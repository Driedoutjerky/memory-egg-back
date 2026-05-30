//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the user_items table
//   - Run SQL queries against the user_items table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let userItemsDb;

async function initDb(db) {
    userItemsDb = db;

    // Create the user_items table if it doesn't exist
    await db.exec(`
    CREATE TABLE IF NOT EXISTS user_items (
        user_item_id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,

        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),

        is_equipped INTEGER NOT NULL DEFAULT 0 CHECK (
        is_equipped IN (0, 1)
        ),

        purchased_at TEXT NOT NULL,

        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

        FOREIGN KEY (item_id)
        REFERENCES shop_items(item_id)
        ON DELETE RESTRICT,

        UNIQUE (user_id, item_id)
        );
    `);
    
    return db;
}
function getDb() {
    return userItemsDb;
}

//return all items based on basic condition
async function getAll(user_id){
    return await userItemsDb.all("SELECT * FROM user_items WHERE user_id = ?", [user_id]);
    
}
// Returns item information by id, or undefined if no row matches. (READ)
async function findByIds(user_id, item_id) {
    return await userItemsDb.get("SELECT * FROM user_items WHERE item_id = ? AND user_id = ?", [item_id, user_id]);
}

// Inserts a purchased item into user_items.
// If the user already owns the item, increase its quantity.
async function create({ user_id, item_id, quantity = 1, purchased_at}) {
    const result = await userItemsDb.run(
        `
        INSERT INTO user_items (
            user_id,
            item_id,
            quantity,
            is_equipped,
            purchased_at
        ) VALUES (?, ?, ?, 0, ?)
        ON CONFLICT(user_id, item_id)
        DO UPDATE SET
            quantity = quantity + excluded.quantity
        `,
        [user_id, item_id, quantity, purchased_at]
    );

    return result.changes > 0;
}

// Deletes an item by item_id. Returns true if a row was actually removed, (DELETE)
// false if no row matched the id.
async function remove(user_id, item_id) {
    const result = await userItemsDb.run("DELETE FROM user_items WHERE user_id = ? AND item_id = ?", [user_id, item_id]);
    return result.changes > 0;
}

// Updates item information (UPDATE)
async function update({user_id, item_id, quantity, is_equipped, purchased_at}) {
    const result = await userItemsDb.run(
        `
    UPDATE user_items
    SET
      quantity = ?, 
      is_equipped = ?
    WHERE item_id = ? AND user_id = ?
    `,
        [
            quantity, is_equipped,
            item_id, user_id
        ]
    );
    return result.changes > 0;
}

module.exports = {initDb, getDb, getAll, findByIds, create, remove, update};