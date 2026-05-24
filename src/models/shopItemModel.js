//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the shopItems table
//   - Run SQL queries against the shopItems table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let shopItemsDb;

async function initDb(db) {
    shopItemsDb = db;

    // Create the shop_items table if it doesn't exist
    await db.exec(`
  CREATE TABLE IF NOT EXISTS shop_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (
      item_type IN ('background', 'music', 'cosmetic')
    ),
    description TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    effect_type TEXT CHECK (
      effect_type IS NULL OR effect_type IN ('glow', 'warmth', 'weight')
    ),
    effect_value TEXT,
    asset_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (
      is_active IN (0, 1)
    )
  );
`);
    // Seed initial data if the table is empty
    const shopItemsCount = await db.get("SELECT COUNT(*) AS count FROM shop_items");

    if (shopItemsCount.count === 0) {
        const shopItemMockData = [
            {
                name: "Sunny Garden Background",
                item_type: "background",
                description: "A bright garden background for your egg.",
                price: 100,
                effect_type: "warmth",
                effect_value: "5",
                asset_url: null,
                is_active: 1
            },
            {
                name: "Night Sky Background",
                item_type: "background",
                description: "A calm night sky background with stars.",
                price: 150,
                effect_type: "glow",
                effect_value: "8",
                asset_url: null,
                is_active: 1
            },
            {
                name: "Soft Piano Music",
                item_type: "music",
                description: "A peaceful piano track for the egg room.",
                price: 120,
                effect_type: "warmth",
                effect_value: "4",
                asset_url: null,
                is_active: 1
            },
            {
                name: "Forest Ambience Music",
                item_type: "music",
                description: "Relaxing forest ambience with birds and wind.",
                price: 130,
                effect_type: "weight",
                effect_value: "3",
                asset_url: null,
                is_active: 1
            },
            {
                name: "Tiny Crown Cosmetic",
                item_type: "cosmetic",
                description: "A small crown decoration for your egg.",
                price: 200,
                effect_type: "glow",
                effect_value: "10",
                asset_url: null,
                is_active: 1
            },
            {
                name: "Ribbon Cosmetic",
                item_type: "cosmetic",
                description: "A cute ribbon decoration for your egg.",
                price: 180,
                effect_type: "warmth",
                effect_value: "7",
                asset_url: null,
                is_active: 1
            }
        ];

        for (const item of shopItemMockData) {
            await db.run(
                `
      INSERT INTO shop_items (
        name,
        item_type,
        description,
        price,
        effect_type,
        effect_value,
        asset_url,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
                [
                    item.name,
                    item.item_type,
                    item.description,
                    item.price,
                    item.effect_type,
                    item.effect_value,
                    item.asset_url,
                    item.is_active
                ]
            );
        }
    }
    return db;
}
function getDb() {
    return shopItemsDb;
}

async function getAll(only_active = 1, item_type = "all"){
    let sql_query = "SELECT * FROM shop_items ";
    let filter_list = [];
    // is WHERE needed?
    if(only_active || item_type != "all") sql_query += "WHERE ";
    
    if(only_active) {
        filter_list.push(1);
        sql_query += "is_active = ?";
    }
    if(item_type != "all"){
        filter_list.push(item_type);
        if(filter_list.length >= 1){
            sql_query += ", item_type = ?"; 
        } else {
            sql_query += "item_type = ?";
        }
    }
    return getDb().all(sql_query, filter_list);
    
}
// Returns item information by id, or undefined if no row matches. (READ)
async function findById(item_id) {
    return await getDb().get("SELECT * FROM shop_items WHERE item_id = ?", [item_id]);
}

// Returns item information by its name so the result can be multiple items, or undefined if no row matches. (READ)
async function findByName(name) {
    return await getDb().get("SELECT * FROM shop_items WHERE name = ?", [name]);
}

// Inserts a new item and returns it including its generated id. (CREATE)
async function create({ name, item_type, description, price, effect_type = null, effect_value = null, asset_url = null, is_active = 1 }) {
    const result = await getDb().run(
        "INSERT INTO shop_items (name, item_type, description, price, effect_type, effect_value, asset_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, item_type, description, price, effect_type, effect_value, asset_url, is_active]
    );
    return { item_id: result.lastID, name, item_type, description, price, effect_type, effect_value, asset_url, is_active };
}

// Deletes an item by item_id. Returns true if a row was actually removed, (DELETE)
// false if no row matched the id.
async function remove(item_id) {
    const result = await getDb().run("DELETE FROM shop_items WHERE item_id = ?", [item_id]);
    return result.changes > 0;
}

// Updates item information (UPDATE)
async function update({ item_id, name, item_type, description, price, effect_type, effect_value, asset_url, is_active }) {
    const result = await getDb().run(
        `
    UPDATE shop_items
    SET
      name = ?, 
      item_type = ?, 
      description = ?, 
      price = ?, 
      effect_type = ?, 
      effect_value = ?, 
      asset_url = ?, 
      is_active = ? 
    WHERE item_id = ?
    `,
        [
            name,
            item_type,
            description,
            price,
            effect_type,
            effect_value,
            asset_url,
            is_active,
            item_id
        ]
    );
    return result.changes > 0;
}

module.exports = {initDb, getAll, findById, findByName, create, remove, update};