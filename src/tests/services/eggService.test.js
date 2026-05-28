// =============================================================================
// Egg Service Unit Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that eggService.equip and eggService.unequip enforce egg equipment
//   business rules and coordinate egg, shop item, and inventory model updates.
//
// Scope:
//   Covers successful equip/unequip flows and expected validation/error cases.
//   Mocks all model dependencies, so these tests do not use the real database.
//
// Out of scope:
//   - Start the Express server
//   - Depend on real seed data
//   - Test route or controller behavior
// =============================================================================
// Replace the real egg model with Jest mock functions.
jest.mock("../../models/eggModel");
// Replace the real shop item model with Jest mock functions.
jest.mock("../../models/shopItemModel");
// Replace the real user item model with Jest mock functions.
jest.mock("../../models/userItemModel");

// Load the service under test after its model dependencies have been mocked.
const eggService = require("../../services/eggService");
// Load the mocked egg model to control and verify egg reads/writes.
const eggModel = require("../../models/eggModel");
// Load the mocked shop item model to control item metadata lookups.
const shopItemModel = require("../../models/shopItemModel");
// Load the mocked inventory model to control and verify ownership/equipment state.
const userItemModel = require("../../models/userItemModel");

// Create an egg fixture while allowing each test to override selected fields.
function makeEgg(overrides = {}) {
  return {
    egg_id: 1,
    user_id: 1,
    stage: 1,
    glow: 10,
    warmth: 15,
    weight: 5,
    active_background_id: null,
    active_music_id: null,
    active_cosmetic_id: null,
    updated_at: "2026-05-28",
    ...overrides
  };
}

// Create a shop item fixture while allowing each test to override selected fields.
function makeItem(overrides = {}) {
  return {
    item_id: 101,
    name: "Test Item",
    item_type: "background",
    price: 50,
    is_active: 1,
    ...overrides
  };
}

// Create an inventory fixture while allowing each test to override selected fields.
function makeInventory(overrides = {}) {
  return {
    user_item_id: 1,
    user_id: 1,
    item_id: 101,
    quantity: 1,
    is_equipped: 0,
    purchased_at: "2026-05-28",
    ...overrides
  };
}

// Group all tests for equipping items on an egg.
describe("eggService.equip", () => {
  // Reset mock call history and configured return values before each equip test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm each supported item type maps to the correct active egg field.
  test.each([
    ["background", "active_background_id"],
    ["music", "active_music_id"],
    ["cosmetic", "active_cosmetic_id"]
  ])("equips an owned %s item", async (itemType, activeField) => {
    // Arrange an egg with no active item for the tested type.
    const egg = makeEgg();
    // Arrange a shop item of the current parameterized type.
    const item = makeItem({ item_id: 101, item_type: itemType });
    // Arrange a matching owned inventory item.
    const inventory = makeInventory({ item_id: item.item_id });

    // Make egg lookup return the arranged egg.
    eggModel.findById.mockResolvedValue(egg);
    // Make shop item lookup return the arranged item metadata.
    shopItemModel.findById.mockResolvedValue(item);
    // Make inventory lookup prove that the user owns the item.
    userItemModel.findByIds.mockResolvedValue(inventory);
    // Make egg update report success.
    eggModel.update.mockResolvedValue(true);
    // Make inventory update report success.
    userItemModel.update.mockResolvedValue(true);

    // Act by equipping the item through the service.
    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    // Assert that the returned egg points the correct active field to the item.
    expect(result[activeField]).toBe(item.item_id);
    // Assert that the inventory object is marked equipped.
    expect(inventory.is_equipped).toBe(1);
    // Assert that the egg update persists the correct active field change.
    expect(eggModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        [activeField]: item.item_id
      })
    );
    // Assert that the inventory update persists the equipped state.
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: item.item_id,
        is_equipped: 1
      })
    );
  });

  // Confirm equipping a new item clears the previously equipped item of the same type.
  test("unequips the previous item of the same type before equipping the new item", async () => {
    // Identify the currently equipped item that should be cleared.
    const previousItemId = 100;
    // Arrange the new background item being equipped.
    const newItem = makeItem({ item_id: 101, item_type: "background" });
    // Arrange an egg that currently has a different background equipped.
    const egg = makeEgg({ active_background_id: previousItemId });
    // Arrange the previous inventory row as currently equipped.
    const previousInventory = makeInventory({
      item_id: previousItemId,
      is_equipped: 1
    });
    // Arrange the new inventory row as currently unequipped.
    const newInventory = makeInventory({
      item_id: newItem.item_id,
      is_equipped: 0
    });

    // Make egg lookup return the egg with an existing active background.
    eggModel.findById.mockResolvedValue(egg);
    // Make shop item lookup return the new item metadata.
    shopItemModel.findById.mockResolvedValue(newItem);
    // Return the new inventory first, then the previous inventory for cleanup.
    userItemModel.findByIds
      .mockResolvedValueOnce(newInventory)
      .mockResolvedValueOnce(previousInventory);
    // Make egg update report success.
    eggModel.update.mockResolvedValue(true);
    // Make inventory updates report success.
    userItemModel.update.mockResolvedValue(true);

    // Act by equipping the new item.
    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: newItem.item_id
    });

    // Assert that the egg now points to the new background item.
    expect(result.active_background_id).toBe(newItem.item_id);
    // Assert that the previous inventory row was marked unequipped.
    expect(previousInventory.is_equipped).toBe(0);
    // Assert that the new inventory row was marked equipped.
    expect(newInventory.is_equipped).toBe(1);
    // Assert that the previous item update was issued.
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: previousItemId,
        is_equipped: 0
      })
    );
    // Assert that the new item update was issued.
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: newItem.item_id,
        is_equipped: 1
      })
    );
  });

  test("throws 404 when egg does not exist", async () => {
    // Arrange a missing egg lookup result.
    eggModel.findById.mockResolvedValue(undefined);

    // Assert that the service rejects with the expected egg not-found error.
    await expect(
      eggService.equip({ user_id: 999, item_id: 101 })
    ).rejects.toMatchObject({
      message: "Egg not found",
      statusCode: 404
    });
  });

  // Confirm equipping fails when the shop item id is unknown.
  test("throws 404 when item does not exist", async () => {
    // Make egg lookup succeed so item lookup is reached.
    eggModel.findById.mockResolvedValue(makeEgg());
    // Arrange a missing shop item lookup result.
    shopItemModel.findById.mockResolvedValue(undefined);

    // Assert that the service rejects with the expected item not-found error.
    await expect(
      eggService.equip({ user_id: 1, item_id: 999 })
    ).rejects.toMatchObject({
      message: "Item not found in the shop (This item is not on the list)",
      statusCode: 404
    });
  });

  // Confirm equipping fails when the user does not own the item.
  test("throws 404 when the user does not own the item", async () => {
    // Arrange a valid shop item.
    const item = makeItem();

    // Make egg lookup succeed.
    eggModel.findById.mockResolvedValue(makeEgg());
    // Make shop item lookup succeed.
    shopItemModel.findById.mockResolvedValue(item);
    // Arrange a missing inventory lookup result.
    userItemModel.findByIds.mockResolvedValue(undefined);

    // Assert that the service rejects with the expected inventory not-found error.
    await expect(
      eggService.equip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "Item not found in the user's inventory",
      statusCode: 404
    });
  });

  // Confirm unsupported item types are rejected before updates are attempted.
  test("throws 400 when item type is invalid", async () => {
    // Arrange a shop item with a type that the service cannot map to an egg field.
    const item = makeItem({ item_type: "invalid_type" });
    // Arrange owned inventory for the invalid item.
    const inventory = makeInventory({ item_id: item.item_id });

    // Make egg lookup succeed.
    eggModel.findById.mockResolvedValue(makeEgg());
    // Make shop item lookup return the invalid type.
    shopItemModel.findById.mockResolvedValue(item);
    // Make inventory lookup prove ownership so type validation is the failing branch.
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Assert that the service rejects with the expected validation error.
    await expect(
      eggService.equip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "Invalid item type",
      statusCode: 400
    });
  });
});

// Group all tests for unequipping items from an egg.
describe("eggService.unequip", () => {
  // Reset mock call history and configured return values before each unequip test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm each supported item type clears the correct active egg field.
  test.each([
    ["background", "active_background_id"],
    ["music", "active_music_id"],
    ["cosmetic", "active_cosmetic_id"]
  ])("unequips a currently equipped %s item", async (itemType, activeField) => {
    // Arrange the item being unequipped.
    const item = makeItem({ item_id: 101, item_type: itemType });
    // Arrange an egg that has this item active in the matching field.
    const egg = makeEgg({ [activeField]: item.item_id });
    // Arrange inventory that is currently marked equipped.
    const inventory = makeInventory({
      item_id: item.item_id,
      is_equipped: 1
    });

    // Make egg lookup return the arranged egg.
    eggModel.findById.mockResolvedValue(egg);
    // Make shop item lookup return the arranged item metadata.
    shopItemModel.findById.mockResolvedValue(item);
    // Make inventory lookup prove that the user owns the item.
    userItemModel.findByIds.mockResolvedValue(inventory);
    // Make egg update report success.
    eggModel.update.mockResolvedValue(true);
    // Make inventory update report success.
    userItemModel.update.mockResolvedValue(true);

    // Act by unequipping the item through the service.
    const result = await eggService.unequip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    // Assert that the returned egg clears the active field.
    expect(result[activeField]).toBe(null);
    // Assert that the inventory object is marked unequipped.
    expect(inventory.is_equipped).toBe(0);
    // Assert that the egg update persists the cleared active field.
    expect(eggModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        [activeField]: null
      })
    );
    // Assert that the inventory update persists the unequipped state.
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: item.item_id,
        is_equipped: 0
      })
    );
  });

  // Confirm unequip fails when no item of the requested type is active.
  test("throws 400 when no item of that type is equipped", async () => {
    // Arrange a background item.
    const item = makeItem({ item_id: 101, item_type: "background" });
    // Arrange inventory ownership for that item.
    const inventory = makeInventory({ item_id: item.item_id });

    // Arrange an egg with no active background equipped.
    eggModel.findById.mockResolvedValue(makeEgg({ active_background_id: null }));
    // Make shop item lookup return the background item.
    shopItemModel.findById.mockResolvedValue(item);
    // Make inventory lookup prove ownership.
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Assert that the service rejects because there is nothing active to remove.
    await expect(
      eggService.unequip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "No Equipped Item is found",
      statusCode: 400
    });
  });

  // Confirm unequip fails when the requested item is not the active item.
  test("throws 400 when the requested item is not the currently equipped item", async () => {
    // Arrange the item the user is trying to unequip.
    const requestedItem = makeItem({ item_id: 101, item_type: "background" });
    // Arrange a different background item as currently equipped.
    const equippedItemId = 202;
    // Arrange inventory ownership for the requested item.
    const inventory = makeInventory({ item_id: requestedItem.item_id });

    // Arrange an egg whose active background does not match the requested item.
    eggModel.findById.mockResolvedValue(
      makeEgg({ active_background_id: equippedItemId })
    );
    // Make shop item lookup return the requested item metadata.
    shopItemModel.findById.mockResolvedValue(requestedItem);
    // Make inventory lookup prove ownership of the requested item.
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Assert that the service rejects because the requested item is not active.
    await expect(
      eggService.unequip({ user_id: 1, item_id: requestedItem.item_id })
    ).rejects.toMatchObject({
      message: "This item is not currently equipped",
      statusCode: 400
    });
  });
});
