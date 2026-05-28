//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the users table
//   - Run SQL queries against the users table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let usersDb;

async function initDb(db) {
  usersDb = db;

  // Create the users table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email STRING NOT NULL UNIQUE,
      password_hash STRING NOT NULL,
      nickname STRING NOT NULL,
      will_balance INTEGER NOT NULL,
      created_at STRING NOT NULL
    );
  `);

  // Seed initial data if the table is empty
  const usersCount = await db.get("SELECT COUNT(*) AS count FROM users");

  if (usersCount.count === 0) {
    const now = new Date().toISOString();

    const userMockData = [
      {
        email: "user1@example.com",
        password_hash: "mock_password_hash_1",
        nickname: "MemoryUser1",
        will_balance: 100,
        created_at: now
      },
      {
        email: "user2@example.com",
        password_hash: "mock_password_hash_2",
        nickname: "MemoryUser2",
        will_balance: 150,
        created_at: now
      },
      {
        email: "user3@example.com",
        password_hash: "mock_password_hash_3",
        nickname: "MemoryUser3",
        will_balance: 200,
        created_at: now
      }
    ];

    for (const user of userMockData) {
      await db.run(
        `
        INSERT INTO users (
          email,
          password_hash,
          nickname,
          will_balance,
          created_at
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          user.email,
          user.password_hash,
          user.nickname,
          user.will_balance,
          user.created_at
        ]
      );
    }
  }

  return db;
}

async function getDb() {
  return usersDb;
}

async function findById(user_id) {
    return await usersDb.get("SELECT * FROM users WHERE user_id = ?", [user_id]);
}

async function update(user_id, key_name, updated_value){
  let user = await findById(user_id);
  const result = await usersDb.run(
        `
    UPDATE users
    SET
      ${key_name} = ?
    WHERE user_id = ?
    `,
        [
          updated_value,
          user_id
        ]
    );
    return result.changes > 0;
}

module.exports = { initDb, findById, update};