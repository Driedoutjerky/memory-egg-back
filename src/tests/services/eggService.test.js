// Service tests: cover equipment business rules while mocking persistence.

jest.mock("../../models/eggModel");
jest.mock("../../models/shopItemModel");
jest.mock("../../models/userItemModel");

const eggService = require("../../services/eggService");
const eggModel = require("../../models/eggModel");
const shopItemModel = require("../../models/shopItemModel");
const userItemModel = require("../../models/userItemModel");

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
    jest.clearAllMocks();
  });

  test("equips an owned item", async () => {
    // This covers the normal equip path: egg active slot and inventory flag are updated.
    const egg = makeEgg();
    const item = makeItem({ item_id: 101, item_type: "background" });
    const inventory = makeInventory({ item_id: item.item_id });
    eggModel.findById.mockResolvedValue(egg);
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);
    eggModel.update.mockResolvedValue(true);
    userItemModel.update.mockResolvedValue(true);

    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    expect(result.active_background_id).toBe(item.item_id);
    expect(inventory.is_equipped).toBe(1);
    expect(eggModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        active_background_id: item.item_id
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
    // Replacement is the riskiest equip rule because it mutates two inventory rows.
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

    const result = await eggService.equip({
      user_id: egg.user_id,
      item_id: newItem.item_id
    });

    expect(result.active_background_id).toBe(newItem.item_id);
    expect(previousInventory.is_equipped).toBe(0);
    expect(newInventory.is_equipped).toBe(1);
  });

  test("throws 404 when the user does not own the item", async () => {
    // Ownership is the key authorization rule for equipment.
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
});

describe("eggService.unequip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("unequips a currently equipped item", async () => {
    // Normal unequip path clears the egg active slot and inventory flag.
    const item = makeItem({ item_id: 101, item_type: "background" });
    const egg = makeEgg({ active_background_id: item.item_id });
    const inventory = makeInventory({
      item_id: item.item_id,
      is_equipped: 1
    });
    eggModel.findById.mockResolvedValue(egg);
    shopItemModel.findById.mockResolvedValue(item);
    userItemModel.findByIds.mockResolvedValue(inventory);
    eggModel.update.mockResolvedValue(true);
    userItemModel.update.mockResolvedValue(true);

    const result = await eggService.unequip({
      user_id: egg.user_id,
      item_id: item.item_id
    });

    expect(result.active_background_id).toBe(null);
    expect(inventory.is_equipped).toBe(0);
  });

  test("throws 400 when the requested item is not currently equipped", async () => {
    // Prevents unequipping an owned item that is not the active item.
    const requestedItem = makeItem({ item_id: 101, item_type: "background" });
    const equippedItemId = 202;
    const inventory = makeInventory({ item_id: requestedItem.item_id });
    eggModel.findById.mockResolvedValue(
      makeEgg({ active_background_id: equippedItemId })
    );
    shopItemModel.findById.mockResolvedValue(requestedItem);
    userItemModel.findByIds.mockResolvedValue(inventory);

    await expect(
      eggService.unequip({ user_id: 1, item_id: requestedItem.item_id })
    ).rejects.toMatchObject({
      message: "This item is not currently equipped",
      statusCode: 400
    });
  });
});
