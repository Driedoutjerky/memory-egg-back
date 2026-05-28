// Tests business logic directly while mocking model dependencies.

// Mock models so service tests focus on purchase rules and coordination.
jest.mock("../../models/shopItemModel");
jest.mock("../../models/userItemModel");
jest.mock("../../models/userModel");

const shopService = require("../../services/shopService");
const shopItemModel = require("../../models/shopItemModel");
const userItemModel = require("../../models/userItemModel");
const userModel = require("../../models/userModel");

// Factory keeps service tests independent from real shop item seed data.
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

// Factory represents the buyer state needed for purchase rules.
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
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("purchases an active item when the user has enough will balance", async () => {
    // Arrange
    const item = makeItem({ price: 40 });
    const user = makeUser({ will_balance: 100 });
    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userItemModel.create.mockResolvedValue(true);
    userModel.update.mockResolvedValue(true);

    // Act
    const result = await shopService.purchaseItem({
      user_id: user.user_id,
      item_id: item.item_id
    });

    // Assert
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
    shopItemModel.findById.mockResolvedValue(makeItem({ is_active: 0 }));

    await expect(
      shopService.purchaseItem({ user_id: 1, item_id: 101 })
    ).rejects.toMatchObject({
      message: "This item is not on sale",
      statusCode: 409
    });

    expect(userModel.findById).not.toHaveBeenCalled();
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  test("throws 404 when the user does not exist", async () => {
    shopItemModel.findById.mockResolvedValue(makeItem());
    userModel.findById.mockResolvedValue(undefined);

    await expect(
      shopService.purchaseItem({ user_id: 999, item_id: 101 })
    ).rejects.toMatchObject({
      message: "User not found",
      statusCode: 404
    });

    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  test("throws 409 when the user has insufficient will balance", async () => {
    // Arrange
    const item = makeItem({ price: 120 });
    const user = makeUser({ will_balance: 50 });
    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);

    // Act and assert
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
    // Arrange
    const item = makeItem({ price: 40 });
    const user = makeUser({ will_balance: 100 });
    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userItemModel.create.mockResolvedValue(true);
    userModel.update.mockResolvedValue(false);

    // Act and assert
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
