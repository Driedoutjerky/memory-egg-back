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
                name: "default",
                item_type: "background",
                description: "The original quiet background for a calm memory egg.",
                price: 0,
                effect_type: "warmth",
                effect_value: "1",
                asset_url: null,
                is_active: 1
            },
            {
                name: "fall_bg",
                item_type: "background",
                description: "A crisp autumn background with falling leaves and soft amber light.",
                price: 150,
                effect_type: "warmth",
                effect_value: "6",
                asset_url: "/assets/background/fall-bg.PNG",
                is_active: 1
            },
            {
                name: "grass_bg",
                item_type: "background",
                description: "A fresh green field background that makes the egg feel light and peaceful.",
                price: 140,
                effect_type: "warmth",
                effect_value: "4",
                asset_url: "/assets/background/grass-bg.PNG",
                is_active: 1
            },
            {
                name: "nightstreet_bg",
                item_type: "background",
                description: "A quiet night street background lit by city lamps and reflections.",
                price: 180,
                effect_type: "glow",
                effect_value: "7",
                asset_url: "/assets/background/nightstreet-bg.png",
                is_active: 1
            },
            {
                name: "eternity_in_moments",
                item_type: "music",
                description: "A gentle track that stretches small memories into something lasting.",
                price: 160,
                effect_type: "warmth",
                effect_value: "5",
                asset_url: "/assets/music/eternity-in-moments.m4a",
                is_active: 1
            },
            {
                name: "gold_phenomenon",
                item_type: "music",
                description: "A bright, shimmering track that gives the egg a golden pulse.",
                price: 170,
                effect_type: "glow",
                effect_value: "6",
                asset_url: "/assets/music/gold-phenomenon.m4a",
                is_active: 1
            },
            {
                name: "mi_querido",
                item_type: "music",
                description: "A warm melodic track with a tender and familiar mood.",
                price: 170,
                effect_type: "warmth",
                effect_value: "6",
                asset_url: "/assets/music/src_assets_mi-querido.m4a",
                is_active: 1
            },
            {
                name: "angelic",
                item_type: "cosmetic",
                description: "A soft halo effect that gives the egg a serene angelic glow.",
                price: 220,
                effect_type: "glow",
                effect_value: "10",
                asset_url: null,
                is_active: 1
            },
            {
                name: "beard",
                item_type: "cosmetic",
                description: "A playful beard that makes the egg look wise and patient.",
                price: 120,
                effect_type: "weight",
                effect_value: "4",
                asset_url: null,
                is_active: 1
            },
            {
                name: "dirty_boots",
                item_type: "cosmetic",
                description: "Muddy little boots for an egg that has been out gathering memories.",
                price: 130,
                effect_type: "weight",
                effect_value: "5",
                asset_url: null,
                is_active: 1
            },
            {
                name: "flower_crown",
                item_type: "cosmetic",
                description: "A crown of small flowers that adds a fresh and affectionate touch.",
                price: 160,
                effect_type: "warmth",
                effect_value: "7",
                asset_url: null,
                is_active: 1
            },
            {
                name: "glasses",
                item_type: "cosmetic",
                description: "Round glasses that give the egg a thoughtful, curious look.",
                price: 140,
                effect_type: "glow",
                effect_value: "4",
                asset_url: null,
                is_active: 1
            },
            {
                name: "life_buoy",
                item_type: "cosmetic",
                description: "A bright life buoy that helps the egg feel safe and supported.",
                price: 150,
                effect_type: "warmth",
                effect_value: "5",
                asset_url: null,
                is_active: 1
            },
            {
                name: "on_fire",
                item_type: "cosmetic",
                description: "A lively flame effect for an egg filled with intense energy.",
                price: 210,
                effect_type: "glow",
                effect_value: "12",
                asset_url: null,
                is_active: 1
            },
            {
                name: "spinning_hat",
                item_type: "cosmetic",
                description: "A spinning hat that adds motion and a cheerful spark to the egg.",
                price: 190,
                effect_type: "glow",
                effect_value: "8",
                asset_url: null,
                is_active: 1
            },
            {
                name: "top_hat",
                item_type: "cosmetic",
                description: "A neat top hat that gives the egg a polished, classic style.",
                price: 180,
                effect_type: "weight",
                effect_value: "3",
                asset_url: null,
                is_active: 1
            },
            {
                name: "work_overall",
                item_type: "cosmetic",
                description: "Sturdy work overalls for an egg ready to build new memories.",
                price: 170,
                effect_type: "weight",
                effect_value: "6",
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

async function getAll(only_active = 1, item_type = "all") {
    let sql = "SELECT * FROM shop_items";
    const conditions = [];
    const params = [];

    if (Number(only_active) === 1) {
        conditions.push("is_active = ?");
        params.push(1);
    }

    if (item_type !== "all") {
        conditions.push("item_type = ?");
        params.push(item_type);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    
    return shopItemsDb.all(sql, params);
}
// Returns item information by id, or undefined if no row matches. (READ)
async function findById(item_id) {
    return await shopItemsDb.get("SELECT * FROM shop_items WHERE item_id = ?", [item_id]);
}

// Returns item information by its name so the result can be multiple items, or undefined if no row matches. (READ)
async function findByName(name) {
    return await shopItemsDb.all("SELECT * FROM shop_items WHERE name = ?", [name]);
}

// Inserts a new item and returns it including its generated id. (CREATE)
async function create({ name, item_type, description, price, effect_type = null, effect_value = null, asset_url = null, is_active = 1 }) {
    const result = await shopItemsDb.run(
        "INSERT INTO shop_items (name, item_type, description, price, effect_type, effect_value, asset_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, item_type, description, price, effect_type, effect_value, asset_url, is_active]
    );
    return { item_id: result.lastID, name, item_type, description, price, effect_type, effect_value, asset_url, is_active };
}

// Deletes an item by item_id. Returns true if a row was actually removed, (DELETE)
// false if no row matched the id.
async function remove(item_id) {
    const result = await shopItemsDb.run("DELETE FROM shop_items WHERE item_id = ?", [item_id]);
    return result.changes > 0;
}

// Updates item information (UPDATE)
async function update({ item_id, name, item_type, description, price, effect_type, effect_value, asset_url, is_active }) {
    const result = await shopItemsDb.run(
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
