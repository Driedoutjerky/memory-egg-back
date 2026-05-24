const shopItemModel = require("../models/shopItemModel");
const userItemModel = require("../models/userItemModel");

// Handles the business logic for purchasing an item
async function purchaseItem({ user_id, item_id}) {

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

  // 3) TODO: Check whether the user has enough will_balance
  // Example later:
  // const user = await userModel.findById(user_id);
  // if (user.will_balance < item.price) {
  //   const error = new Error("Insufficient will balance");
  //   error.statusCode = 409;
  //   throw error;
  // }

  // 4) Add item to user's inventory
  // If the user already owns the item, increase quantity.
  let purchased_at = new Date().toISOString();
  await userItemModel.create({
    user_id,
    item_id,
    quantity: 1,
    purchased_at
  });

  return {
    user_id,
    item_id,
    item_name: item.name,
    price: item.price
  };
}

module.exports = {
  purchaseItem
};