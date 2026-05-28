// Tests business logic directly while mocking model dependencies.

// Mock models so service tests focus on equipment rules and coordination.
jest.mock("../../models/eggModel");
jest.mock("../../models/shopItemModel");
jest.mock("../../models/userItemModel");

const eggService = require("../../services/eggService");
const eggModel = require("../../models/eggModel");
const shopItemModel = require("../../models/shopItemModel");
const userItemModel = require("../../models/userItemModel");

// Factory creates complete egg data while each test overrides only the active field it needs.
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

// Factory keeps service tests independent from real shop item seed data.
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

// Factory represents the user's owned item state before service logic runs.
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

describe("eggService.equip", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test.each([
    ["background", "active_background_id"],
    ["music", "active_music_id"],
    ["cosmetic", "active_cosmetic_id"]
  ])("equips an owned %s item", async (itemType, activeField) => {
    // Arrange
    const egg = makeEgg();
    const item = makeItem({ item_id: 101, item_type: itemType });
    const inventory = makeInventory({ item_id: item.item_id });
    eggModel.findById.mockResolvedValue(egg);
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);
    eggModel.update.mockResolvedValue(true);
    userItemModel.update.mockResolvedValue(true);

    // Act
    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    // Assert
    expect(result[activeField]).toBe(item.item_id);
    expect(inventory.is_equipped).toBe(1);
    expect(eggModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        [activeField]: item.item_id
      })
    );
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: item.item_id,
        is_equipped: 1
      })
    );
  });

  test("unequips the previous item of the same type before equipping the new item", async () => {
    // Arrange
    const previousItemId = 100;
    const newItem = makeItem({ item_id: 101, item_type: "background" });
    const egg = makeEgg({ active_background_id: previousItemId });
    const previousInventory = makeInventory({
      item_id: previousItemId,
      is_equipped: 1
    });
    const newInventory = makeInventory({
      item_id: newItem.item_id,
      is_equipped: 0
    });
    eggModel.findById.mockResolvedValue(egg);
    shopItemModel.findById.mockResolvedValue(newItem);
    userItemModel.findByIds
      .mockResolvedValueOnce(newInventory)
      .mockResolvedValueOnce(previousInventory);
    eggModel.update.mockResolvedValue(true);
    userItemModel.update.mockResolvedValue(true);

    // Act
    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: newItem.item_id
    });

    // Assert
    expect(result.active_background_id).toBe(newItem.item_id);
    expect(previousInventory.is_equipped).toBe(0);
    expect(newInventory.is_equipped).toBe(1);
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: previousItemId,
        is_equipped: 0
      })
    );
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: newItem.item_id,
        is_equipped: 1
      })
    );
  });

  test("throws 404 when egg does not exist", async () => {
    eggModel.findById.mockResolvedValue(undefined);

    await expect(
      eggService.equip({ user_id: 999, item_id: 101 })
    ).rejects.toMatchObject({
      message: "Egg not found",
      statusCode: 404
    });
  });

  test("throws 404 when item does not exist", async () => {
    eggModel.findById.mockResolvedValue(makeEgg());
    shopItemModel.findById.mockResolvedValue(undefined);

    await expect(
      eggService.equip({ user_id: 1, item_id: 999 })
    ).rejects.toMatchObject({
      message: "Item not found in the shop (This item is not on the list)",
      statusCode: 404
    });
  });

  test("throws 404 when the user does not own the item", async () => {
    const item = makeItem();
    eggModel.findById.mockResolvedValue(makeEgg());
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(undefined);

    await expect(
      eggService.equip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "Item not found in the user's inventory",
      statusCode: 404
    });
  });

  test("throws 400 when item type is invalid", async () => {
    // Arrange
    const item = makeItem({ item_type: "invalid_type" });
    const inventory = makeInventory({ item_id: item.item_id });
    eggModel.findById.mockResolvedValue(makeEgg());
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Act and assert
    await expect(
      eggService.equip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "Invalid item type",
      statusCode: 400
    });
  });
});

describe("eggService.unequip", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test.each([
    ["background", "active_background_id"],
    ["music", "active_music_id"],
    ["cosmetic", "active_cosmetic_id"]
  ])("unequips a currently equipped %s item", async (itemType, activeField) => {
    // Arrange
    const item = makeItem({ item_id: 101, item_type: itemType });
    const egg = makeEgg({ [activeField]: item.item_id });
    const inventory = makeInventory({
      item_id: item.item_id,
      is_equipped: 1
    });
    eggModel.findById.mockResolvedValue(egg);
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);
    eggModel.update.mockResolvedValue(true);
    userItemModel.update.mockResolvedValue(true);

    // Act
    const result = await eggService.unequip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    // Assert
    expect(result[activeField]).toBe(null);
    expect(inventory.is_equipped).toBe(0);
    expect(eggModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        [activeField]: null
      })
    );
    expect(userItemModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: item.item_id,
        is_equipped: 0
      })
    );
  });

  test("throws 400 when no item of that type is equipped", async () => {
    // Arrange
    const item = makeItem({ item_id: 101, item_type: "background" });
    const inventory = makeInventory({ item_id: item.item_id });
    eggModel.findById.mockResolvedValue(makeEgg({ active_background_id: null }));
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Act and assert
    await expect(
      eggService.unequip({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "No Equipped Item is found",
      statusCode: 400
    });
  });

  test("throws 400 when the requested item is not currently equipped", async () => {
    // Arrange
    const requestedItem = makeItem({ item_id: 101, item_type: "background" });
    const equippedItemId = 202;
    const inventory = makeInventory({ item_id: requestedItem.item_id });
    eggModel.findById.mockResolvedValue(
      makeEgg({ active_background_id: equippedItemId })
    );
    shopItemModel.findById.mockResolvedValue(requestedItem);
    userItemModel.findByIds.mockResolvedValue(inventory);

    // Act and assert
    await expect(
      eggService.unequip({ user_id: 1, item_id: requestedItem.item_id })
    ).rejects.toMatchObject({
      message: "This item is not currently equipped",
      statusCode: 400
    });
  });
});
