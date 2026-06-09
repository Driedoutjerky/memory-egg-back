// Service tests: protect purchase transaction behavior.

jest.mock("../../models/shopItemModel");
jest.mock("../../models/userItemModel");
jest.mock("../../models/userModel");
jest.mock("../../db", () => ({
  getDb: jest.fn()
}));

const shopService = require("../../services/shopService");
const shopItemModel = require("../../models/shopItemModel");
const userItemModel = require("../../models/userItemModel");
const userModel = require("../../models/userModel");
const { getDb } = require("../../db");

function makeItem() {
  return {
    item_id: 101,
    name: "Test Shop Item",
    price: 40,
    is_active: 1
  };
}

function makeUser() {
  return {
    user_id: 1,
    will_balance: 100
  };
}

describe("shopService.purchaseItem", () => {
  let db;

  beforeEach(() => {
    jest.clearAllMocks();

    db = {
      run: jest.fn().mockResolvedValue({})
    };

    getDb.mockReturnValue(db);
  });

  test("commits the transaction when purchase succeeds", async () => {
    // Core purchase flow: deduct balance, create inventory, commit transaction.
    const item = makeItem();
    const user = makeUser();

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userModel.decreaseWillIfEnough.mockResolvedValue(true);
    userItemModel.create.mockResolvedValue(true);

    const result = await shopService.purchaseItem({
      user_id: user.user_id,
      item_id: item.item_id
    });

    expect(db.run).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION");
    expect(userModel.decreaseWillIfEnough).toHaveBeenCalledWith(
      user.user_id,
      item.price
    );
    expect(userItemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.user_id,
        item_id: item.item_id,
        quantity: 1
      })
    );
    expect(db.run).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(result.item_id).toBe(item.item_id);
  });

  test("rolls back when the user does not have enough will balance", async () => {
    // Main failure path: failed conditional balance deduction must cancel purchase.
    const item = makeItem();
    const user = makeUser();

    shopItemModel.findById.mockResolvedValue(item);
    userModel.findById.mockResolvedValue(user);
    userModel.decreaseWillIfEnough.mockResolvedValue(false);

    await expect(
      shopService.purchaseItem({
        user_id: user.user_id,
        item_id: item.item_id
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining("Insufficient will balance"),
      statusCode: 409
    });

    expect(userItemModel.create).not.toHaveBeenCalled();
    expect(db.run).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION");
    expect(db.run).toHaveBeenNthCalledWith(2, "ROLLBACK");
  });
});
