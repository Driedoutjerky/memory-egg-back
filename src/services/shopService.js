const shopItemModel = require("../models/shopItemModel");
const userItemModel = require("../models/userItemModel");
const userModel = require("../models/userModel");

// Handles the business logic for purchasing an item
async function purchaseItem({ user_id, item_id }) {
  let db = userItemModel.getDb();
  // check whether transaction has started
  let transactionStarted = false;
  try {
    // make this purchase process as the one atomic transaction
    await db.run("BEGIN TRANSACTION");
    transactionStarted = true;

    // 1) Check whether the item_id is valid
    const item = await shopItemModel.findById(item_id);
    if (!item) {
      const error = new Error("Item not found");
      error.statusCode = 404;
      throw error;
    }

    // 2) Check whether the item is currently on sale
    if (!item.is_active) {
      const error = new Error("This item is not on sale");
      error.statusCode = 409;
      throw error;
    }

    // 3) Check whether the user has enough will_balance
    const user = await userModel.findById(user_id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // 4) Decrease will balance only if sufficient balance remains.
    const decreaseResult = await userModel.decreaseWillIfEnough(
      user_id,
      item.price
    );

    if (!decreaseResult) {
      const error = new Error(`Insufficient will balance price: ${item.price} | will balance: ${user.will_balance}`);
      error.statusCode = 409;
      throw error;
    }

    // 4) Add item to user's inventory
    // If the user already owns the item, increase quantity.
    let purchasedAt = new Date().toISOString().split('T')[0];
    let itemAddResult = await userItemModel.create({
      user_id,
      item_id,
      quantity: 1,
      purchased_at: purchasedAt
    });
    if (!itemAddResult) {
      const error = new Error("Database Error : Failed to create user item");
      error.statusCode = 500;
      throw error;
    }
    // finish transaction and apply changes into database
    await db.run("COMMIT");
    transactionStarted = false;

    return {
      user_id,
      item_id,
      item_name: item.name,
      price: item.price
    };
  }
  catch (error) {
    if (transactionStarted) {
      try {
        await db.run("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
    throw error;
  }
}

module.exports = {
  purchaseItem
};