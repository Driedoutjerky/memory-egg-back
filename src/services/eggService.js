
const eggModel = require("../models/eggModel");
const shopItemModel = require("../models/shopItemModel");
const userItemModel = require("../models/userItemModel");
const ALLOWED_ITEM_TYPES = new Set(["background", "music", "cosmetic"]);

async function equip({ user_id, item_id }) {
    let egg = await eggModel.findById(user_id);
    if (!egg) {
        const error = new Error("Egg not found");
        error.statusCode = 404;
        throw error;
    }
    // TODO: 1) check whether the requested item is valid
    const item = await shopItemModel.findById(item_id);
    if (!item) {
        const error = new Error("Item not found in the shop (This item is not on the list)");
        error.statusCode = 404;
        throw error;
    }

    // TODO: 2) check whether the requested item is owned by this user.
    const itemInventory = await userItemModel.findByIds(user_id, item_id);
    if (!itemInventory) {
        const error = new Error("Item not found in the user's inventory");
        error.statusCode = 404;
        throw error;
    }
    // TODO: 3) identify what kind of this item 
    let itemType = item.item_type;
    let prior = egg[`active_${itemType}_id`];

    if (!ALLOWED_ITEM_TYPES.has(itemType)) {
        const error = new Error("Invalid item type");
        error.statusCode = 400;
        throw error;
    }

    // if there is an item which is already equipped, unequip
    if (prior != null && prior !== item_id) {
        let priorInventory = await userItemModel.findByIds(user_id, prior);

        if (priorInventory) {
            priorInventory.is_equipped = 0;
            await userItemModel.update(priorInventory);
        }
    }

    egg[`active_${itemType}_id`] = itemInventory.item_id;
    itemInventory.is_equipped = 1;

    // equip item
    let flagEgg = await eggModel.update(egg);
    let flagUserItem = await userItemModel.update(itemInventory);


    if (flagEgg && flagUserItem) {
        return egg;
    } else {
        const error = new Error("Database error");
        error.statusCode = 500;
        throw error;
    }

}


async function unequip({ user_id, item_id }) {
    let egg = await eggModel.findById(user_id);
    if (!egg) {
        const error = new Error("Egg not found");
        error.statusCode = 404;
        throw error;
    }
    // TODO: 1) check whether the requested item is valid
    const item = await shopItemModel.findById(item_id);
    if (!item) {
        const error = new Error("Item not found in the shop (This item is not on the list)");
        error.statusCode = 404;
        throw error;
    }

    // TODO: 2) check whether the requested item is owned by this user.
    const itemInventory = await userItemModel.findByIds(user_id, item_id);
    if (!itemInventory) {
        const error = new Error("Item not found in the user's inventory");
        error.statusCode = 404;
        throw error;
    }
    // TODO: 3) identify what kind of this item 
    let itemType = item.item_type;

    if (!ALLOWED_ITEM_TYPES.has(itemType)) {
        const error = new Error("Invalid item type");
        error.statusCode = 400;
        throw error;
    }
    let prior = egg[`active_${itemType}_id`];

    if (prior !== item_id) {
        const error = new Error("This item is not currently equipped");
        error.statusCode = 400;
        throw error;
    }
    // if there is an item which is already equipped, unequip
    if (prior == null) {
        const error = new Error("No Equipped Item is found");
        error.statusCode = 400;
        throw error;
    }

    egg[`active_${itemType}_id`] = null;
    itemInventory.is_equipped = 0;

    // equip item
    let flagEgg = await eggModel.update(egg);
    let flagUserItem = await userItemModel.update(itemInventory);


    if (flagEgg && flagUserItem) {
        return egg;
    } else {
        const error = new Error("Database error");
        error.statusCode = 500;
        throw error;
    }

}

module.exports = { equip, unequip };
