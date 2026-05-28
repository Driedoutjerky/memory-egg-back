// =============================================================================
// Service Unit Tests
// -----------------------------------------------------------------------------
// This file tests the SERVICE layer.
//
// Responsibilities:
//   - Test business logic directly
//   - Mock model functions instead of using the real database
//   - Check success cases and expected error cases
//
// What this test must NOT do:
//   - Start the Express server
//   - Depend on real seed data
//   - Test route or controller behavior
// =============================================================================

jest.mock("../../models/shopItemModel");
jest.mock("../../models/userItemModel");
jest.mock("../../models/userModel");

const shopService = require("../../services/shopService");
const shopItemModel = require("../../models/shopItemModel");
const userItemModel = require("../../models/userItemModel");
const userModel = require("../../models/userModel");

function makeItem(overrides = {}) {
  return {
    item_id: 101,
    name: "Test Shop Item",
    item_type: "background",
    description: "Item used only for tests",
    price: 50,
    effect_type: null,
    effect_value: null,
    asset_url: null,
    is_active: 1,
    ...overrides
  };
}

function makeUser(overrides = {}) {
  return {
    user_id: 1,
    email: "test@example.com",
    nickname: "TestUser",
    will_balance: 100,
    ...overrides
  };
}

describe("shopService.purchaseItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("purchases an active item when the user has enough will balance", async () => {
    const item = makeItem({ price: 40 });
    const user = makeUser({ will_balance: 100 });

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userItemModel.create.mockResolvedValue(true);
    userModel.update.mockResolvedValue(true);

    const result = await shopService.purchaseItem({
      user_id: user.user_id,
      item_id: item.item_id
    });

    expect(userItemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.user_id,
        item_id: item.item_id,
        quantity: 1,
        purchased_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      })
    );

    expect(userModel.update).toHaveBeenCalledWith(
      user.user_id,
      "will_balance",
      user.will_balance - item.price
    );

    expect(result).toEqual(
      expect.objectContaining({
        user_id: user.user_id,
        item_id: item.item_id,
        item_name: item.name,
        price: item.price
      })
    );
  });

  test("throws 404 when the item does not exist", async () => {
    shopItemModel.findById.mockResolvedValue(undefined);

    await expect(
      shopService.purchaseItem({ user_id: 1, item_id: 999 })
    ).rejects.toMatchObject({
      message: "Item not found",
      statusCode: 404
    });

    expect(userModel.findById).not.toHaveBeenCalled();
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  test("throws 409 when the item is not active", async () => {
    const item = makeItem({ is_active: 0 });

    shopItemModel.findById.mockResolvedValue(item);

    await expect(
      shopService.purchaseItem({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "This item is not on sale",
      statusCode: 409
    });

    expect(userModel.findById).not.toHaveBeenCalled();
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  test("throws 404 when the user does not exist", async () => {
    const item = makeItem();

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(undefined);

    await expect(
      shopService.purchaseItem({ user_id: 999, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "User not found",
      statusCode: 404
    });

    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  test("throws 409 when the user has insufficient will balance", async () => {
    const item = makeItem({ price: 120 });
    const user = makeUser({ will_balance: 50 });

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);

    await expect(
      shopService.purchaseItem({
        user_id: user.user_id,
        item_id: item.item_id
      })
    ).rejects.toMatchObject({
      message: "Insufficient will balance",
      statusCode: 409
    });

    expect(userItemModel.create).not.toHaveBeenCalled();
    expect(userModel.update).not.toHaveBeenCalled();
  });

  test("throws 500 when will balance update fails", async () => {
    const item = makeItem({ price: 40 });
    const user = makeUser({ will_balance: 100 });

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userItemModel.create.mockResolvedValue(true);
    userModel.update.mockResolvedValue(false);

    await expect(
      shopService.purchaseItem({
        user_id: user.user_id,
        item_id: item.item_id
      })
    ).rejects.toMatchObject({
      message: "Database Error",
      statusCode: 500
    });
  });
});
