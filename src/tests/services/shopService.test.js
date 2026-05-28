// =============================================================================
// Shop Service Unit Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that shopService.purchaseItem enforces purchase business rules and
//   coordinates shop item, user, and inventory model calls correctly.
//
// Scope:
//   Covers successful purchase flow and expected purchase failures.
//   Mocks all model dependencies, so these tests do not use the real database.
//
// Out of scope:
//   - Start the Express server
//   - Depend on real seed data
//   - Test route or controller behavior
// =============================================================================

// Replace the real shop item model with Jest mock functions.
jest.mock("../../models/shopItemModel");
// Replace the real user item model with Jest mock functions.
jest.mock("../../models/userItemModel");
// Replace the real user model with Jest mock functions.
jest.mock("../../models/userModel");

// Load the service under test after its model dependencies have been mocked.
const shopService = require("../../services/shopService");
// Load the mocked shop item model to control item lookup results.
const shopItemModel = require("../../models/shopItemModel");
// Load the mocked inventory model to verify inventory creation.
const userItemModel = require("../../models/userItemModel");
// Load the mocked user model to control user lookup and balance updates.
const userModel = require("../../models/userModel");

// Create a shop item fixture while allowing each test to override specific fields.
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

// Create a user fixture while allowing each test to override specific fields.
function makeUser(overrides = {}) {
  return {
    user_id: 1,
    email: "test@example.com",
    nickname: "TestUser",
    will_balance: 100,
    ...overrides
  };
}

// Group all purchase business-logic tests.
describe("shopService.purchaseItem", () => {
  // Reset mock call history and configured return values before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm the complete successful purchase flow.
  test("purchases an active item when the user has enough will balance", async () => {
    // Arrange an active item that costs less than the user's balance.
    const item = makeItem({ price: 40 });
    // Arrange a user with enough will balance to buy the item.
    const user = makeUser({ will_balance: 100 });

    // Make item lookup return the purchasable item.
    shopItemModel.findById.mockResolvedValue(item);
    // Make user lookup return the buyer.
    userModel.findById.mockResolvedValue(user);
    // Make inventory creation succeed.
    userItemModel.create.mockResolvedValue(true);
    // Make balance update succeed.
    userModel.update.mockResolvedValue(true);

    // Act by purchasing the item through the service.
    const result = await shopService.purchaseItem({
      user_id: user.user_id,
      item_id: item.item_id
    });

    // Assert that the purchased item is inserted into the user's inventory.
    expect(userItemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.user_id,
        item_id: item.item_id,
        quantity: 1,
        purchased_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      })
    );

    // Assert that the user's will balance is reduced by the item price.
    expect(userModel.update).toHaveBeenCalledWith(
      user.user_id,
      "will_balance",
      user.will_balance - item.price
    );

    // Assert that the service returns a compact purchase summary.
    expect(result).toEqual(
      expect.objectContaining({
        user_id: user.user_id,
        item_id: item.item_id,
        item_name: item.name,
        price: item.price
      })
    );
  });

  // Confirm missing items stop the purchase before user or inventory work.
  test("throws 404 when the item does not exist", async () => {
    // Arrange a missing item lookup result.
    shopItemModel.findById.mockResolvedValue(undefined);

    // Assert that the service rejects with the expected not-found error.
    await expect(
      shopService.purchaseItem({ user_id: 1, item_id: 999 })
    ).rejects.toMatchObject({
      message: "Item not found",
      statusCode: 404
    });

    // Assert that user lookup is skipped after the missing item check fails.
    expect(userModel.findById).not.toHaveBeenCalled();
    // Assert that inventory creation is skipped after the missing item check fails.
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  // Confirm inactive items cannot be purchased.
  test("throws 409 when the item is not active", async () => {
    // Arrange an item that exists but is not active for sale.
    const item = makeItem({ is_active: 0 });

    // Make item lookup return the inactive item.
    shopItemModel.findById.mockResolvedValue(item);

    // Assert that the service rejects with the expected conflict error.
    await expect(
      shopService.purchaseItem({ user_id: 1, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "This item is not on sale",
      statusCode: 409
    });

    // Assert that user lookup is skipped because the item cannot be sold.
    expect(userModel.findById).not.toHaveBeenCalled();
    // Assert that inventory creation is skipped because the item cannot be sold.
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  // Confirm a missing user stops the purchase before inventory creation.
  test("throws 404 when the user does not exist", async () => {
    // Arrange a valid item.
    const item = makeItem();

    // Make item lookup succeed.
    shopItemModel.findById.mockResolvedValue(item);
    // Make user lookup fail.
    userModel.findById.mockResolvedValue(undefined);

    // Assert that the service rejects with the expected user not-found error.
    await expect(
      shopService.purchaseItem({ user_id: 999, item_id: item.item_id })
    ).rejects.toMatchObject({
      message: "User not found",
      statusCode: 404
    });

    // Assert that inventory creation is skipped when the user does not exist.
    expect(userItemModel.create).not.toHaveBeenCalled();
  });

  // Confirm users cannot purchase items they cannot afford.
  test("throws 409 when the user has insufficient will balance", async () => {
    // Arrange an item that costs more than the user's balance.
    const item = makeItem({ price: 120 });
    // Arrange a user with insufficient will balance.
    const user = makeUser({ will_balance: 50 });

    // Make item lookup succeed.
    shopItemModel.findById.mockResolvedValue(item);
    // Make user lookup succeed with insufficient balance.
    userModel.findById.mockResolvedValue(user);

    // Assert that the service rejects with the expected balance conflict.
    await expect(
      shopService.purchaseItem({
        user_id: user.user_id,
        item_id: item.item_id
      })
    ).rejects.toMatchObject({
      message: "Insufficient will balance",
      statusCode: 409
    });

    // Assert that inventory creation is skipped when payment cannot be made.
    expect(userItemModel.create).not.toHaveBeenCalled();
    // Assert that balance update is skipped when payment cannot be made.
    expect(userModel.update).not.toHaveBeenCalled();
  });

  // Confirm database update failures are surfaced as service errors.
  test("throws 500 when will balance update fails", async () => {
    // Arrange a purchasable item.
    const item = makeItem({ price: 40 });
    // Arrange a user who can afford the item.
    const user = makeUser({ will_balance: 100 });

    // Make item lookup succeed.
    shopItemModel.findById.mockResolvedValue(item);
    // Make user lookup succeed.
    userModel.findById.mockResolvedValue(user);
    // Make inventory creation succeed.
    userItemModel.create.mockResolvedValue(true);
    // Make balance update report failure.
    userModel.update.mockResolvedValue(false);

    // Assert that a failed balance update is converted into a database error.
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
