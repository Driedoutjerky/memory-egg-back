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

module.exports = {initDb};