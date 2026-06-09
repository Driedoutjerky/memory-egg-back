
const eggModel = require("../models/eggModel");
const shopItemModel = require("../models/shopItemModel");
const userItemModel = require("../models/userItemModel");
const { getDb } = require("../db");
const ALLOWED_ITEM_TYPES = new Set(["background", "music", "cosmetic"]);

async function equip({ user_id, item_id }) {
    let db = getDb();
    // check whether transaction has started
    let transactionStarted = false;
    try {
        // make this purchase process as the one atomic transaction
        await db.run("BEGIN TRANSACTION");
        transactionStarted = true;
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

        // if there is an item which is already equipped, unequip
        if (prior != null && prior != item_id) {
            let priorInventory = await userItemModel.findByIds(user_id, prior);
            let priorItem = await shopItemModel.findById(prior);
            if (priorInventory) {
                priorInventory.is_equipped = 0;
                await userItemModel.update(priorInventory);
            }
            if (priorItem) {
                applyItemEffect(egg, priorItem, 0);
            }
        }

        if (prior != item_id) {
            applyItemEffect(egg, item, 1);
        }

        egg[`active_${itemType}_id`] = itemInventory.item_id;
        itemInventory.is_equipped = 1;
        // equip item
        let flagEgg = await eggModel.update(egg);
        let flagUserItem = await userItemModel.update(itemInventory);


        if (flagEgg && flagUserItem) {
            // finish transaction and apply changes into database
            await db.run("COMMIT");
            transactionStarted = false;
            return egg;
        } else {
            const error = new Error("Database error");
            error.statusCode = 500;
            throw error;
        }
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

async function unequip({ user_id, item_id }) {
    let db = getDb();
    // check whether transaction has started
    let transactionStarted = false;
    try {
        // make this purchase process as the one atomic transaction
        await db.run("BEGIN TRANSACTION");
        transactionStarted = true;
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

        // if there is an item which is already equipped, unequip
        if (prior == null) {
            const error = new Error("No Equipped Item is found");
            error.statusCode = 400;
            throw error;
        }

        if (prior != item_id) {
            const error = new Error("This item is not currently equipped");
            error.statusCode = 400;
            throw error;
        }

        egg[`active_${itemType}_id`] = null;
        itemInventory.is_equipped = 0;
        // unequip item
        applyItemEffect(egg, item, 0);
        let flagEgg = await eggModel.update(egg);
        let flagUserItem = await userItemModel.update(itemInventory);


        if (flagEgg && flagUserItem) {
            // finish transaction and apply changes into database
            await db.run("COMMIT");
            transactionStarted = false;

            return egg;
        } else {
            const error = new Error("Database error");
            error.statusCode = 500;
            throw error;
        }
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
function applyItemEffect(egg, item, isEquip) {
    let itemEffectType = item["effect_type"];
    let itemEffectValue = Number(item["effect_value"]);
    if (!itemEffectType || !Number.isFinite(itemEffectValue)) {
        return egg;
    }
    if (isEquip) {
        egg[itemEffectType] += itemEffectValue;
    } else {
        egg[itemEffectType] -= itemEffectValue;
    }
    return egg;
}

module.exports = { equip, unequip };
