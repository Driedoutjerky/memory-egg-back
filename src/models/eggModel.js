//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the eggs table
//   - Run SQL queries against the eggs table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let eggsDb;

async function initDb(db){
  eggsDb = db;

  // Create the eggs table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS eggs (
      egg_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      stage INTEGER NOT NULL,
      glow INTEGER NOT NULL,
      warmth INTEGER NOT NULL,
      weight INTEGER NOT NULL,
      active_background_id INTEGER,
      active_music_id INTEGER,
      active_cosmetic_id INTEGER,
      updated_at STRING NOT NULL,

      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (active_background_id) REFERENCES shop_items(item_id),
      FOREIGN KEY (active_music_id) REFERENCES shop_items(item_id),
      FOREIGN KEY (active_cosmetic_id) REFERENCES shop_items(item_id)
    );
  `);
  // Seed initial data if the table is empty
  const eggsCount = await db.get("SELECT COUNT(*) AS count FROM eggs");
  if (eggsCount.count === 0) {
    const eggMockData = [
      {
        user_id: 1,
        stage: 1,
        glow: 10,
        warmth: 15,
        weight: 5,
        active_background_id: null,
        active_music_id: null,
        active_cosmetic_id: null,
        updated_at: new Date().toISOString().split('T')[0]
      },
      {
        user_id: 2,
        stage: 2,
        glow: 35,
        warmth: 40,
        weight: 12,
        active_background_id: 1,
        active_music_id: null,
        active_cosmetic_id: 2,
        updated_at: new Date().toISOString().split('T')[0]
      },
      {
        user_id: 3,
        stage: 3,
        glow: 70,
        warmth: 65,
        weight: 25,
        active_background_id: 2,
        active_music_id: 1,
        active_cosmetic_id: 3,
        updated_at: new Date().toISOString().split('T')[0]
      }
    ];

    for (const egg of eggMockData) {
      await db.run(
        `
        INSERT INTO eggs (
          user_id,
          stage,
          glow,
          warmth,
          weight,
          active_background_id,
          active_music_id,
          active_cosmetic_id,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          egg.user_id,
          egg.stage,
          egg.glow,
          egg.warmth,
          egg.weight,
          egg.active_background_id,
          egg.active_music_id,
          egg.active_cosmetic_id,
          egg.updated_at
        ]
      );
    }
  }
  return db
}

// Returns an egg by id, or undefined if no row matches. (READ)
async function findById(user_id) {
  return await eggsDb.get("SELECT * FROM eggs WHERE user_id = ?", [user_id]);
}


// Inserts a new egg and returns it including its generated id. (CREATE)
async function create(user_id) {
    // initial values
    // TODO: I think we should make it clear with initial values of entities 
    let stage = 1; 
    let glow = 0;
    let warmth = 0;
    let weight = 0; 
    let updated_at = new Date().toISOString().split("T")[0];
    const result = await eggsDb.run(
    "INSERT INTO eggs (user_id, stage, glow, warmth, weight, active_background_id, active_music_id, active_cosmetic_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user_id, stage, glow, warmth, weight, null, null, null, updated_at]
  );
  return {
    egg_id: result.lastID,
    user_id,
    stage,
    glow,
    warmth,
    weight,
    active_background_id: null,
    active_music_id: null,
    active_cosmetic_id: null,
    updated_at
};
}

// Deletes an egg by egg_id. Returns true if a row was actually removed, (DELETE)
// false if no row matched the id.
async function remove(egg_id) {
  const result = await eggsDb.run("DELETE FROM eggs WHERE egg_id = ?", [egg_id]);
  return result.changes > 0;
}

// Updates an egg (UPDATE)
// false 
async function update({egg_id, user_id, stage, glow, warmth, weight, active_background_id, active_music_id, active_cosmetic_id, updated_at}){
    const result = await eggsDb.run(
    `
    UPDATE eggs
    SET
      stage = ?,
      glow = ?,
      warmth = ?,
      weight = ?,
      active_background_id = ?, 
      active_music_id = ?, 
      active_cosmetic_id = ?,
      updated_at = ? 
    WHERE egg_id = ?
    `,
    [
      stage,
      glow,
      warmth,
      weight, 
      active_background_id, 
      active_music_id, 
      active_cosmetic_id,
      new Date().toISOString().split('T')[0],
      egg_id
    ]
  );
  return result.changes > 0;
}

module.exports = {initDb, findById, create, remove, update};