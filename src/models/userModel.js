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
const ALLOWED_USER_FIELDS = new Set(["email", "password_hash", "nickname", "will_balance"]);
// just for mock data
const bcrypt = require('bcrypt');
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
    const now = new Date().toISOString().split("T")[0];

    const userMockData = [
      {
        email: "user1@example.com",
        password_hash: await bcrypt.hash("mock_password_hash_1", 10),
        nickname: "MemoryUser1",
        will_balance: 100,
        created_at: now
      },
      {
        email: "user2@example.com",
        password_hash: await bcrypt.hash("mock_password_hash_2", 10),
        nickname: "MemoryUser2",
        will_balance: 150,
        created_at: now
      },
      {
        email: "user3@example.com",
        password_hash: await bcrypt.hash("mock_password_hash_3", 10),
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

function getDb() {
  return usersDb;
}

async function findById(user_id) {
    return await usersDb.get("SELECT * FROM users WHERE user_id = ?", [user_id]);
}

async function findByEmail(email) {
  return await usersDb.get(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
}

async function create({email, password_hash, nickname, will_balance}){

  const created_at = new Date().toISOString().split("T")[0];

  const result = await usersDb.run(
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
      email,
      password_hash,
      nickname,
      will_balance,
      created_at
    ]
  );


  // password_hash shouldn't be released outside of model
  return {
    user_id: result.lastID,
    email,
    nickname,
    will_balance,
    created_at
  };
}

async function update(user_id, key_name, updated_value) {
  if (!ALLOWED_USER_FIELDS.has(key_name)) {
    throw new Error("Invalid user field");
  }

  const result = await usersDb.run(
    `
    UPDATE users
    SET ${key_name} = ?
    WHERE user_id = ?
    `,
    [updated_value, user_id]
  );

  return result.changes > 0;
}
// ensure the exclusive transaction about will balance
async function decreaseWillIfEnough(user_id, price) {
  const result = await usersDb.run(
    `
    UPDATE users
    SET will_balance = will_balance - ?
    WHERE user_id = ?
      AND will_balance >= ?
    `,
    [price, user_id, price]
  );

  return result.changes > 0;
}
module.exports = { initDb, findById,findByEmail, create, update, decreaseWillIfEnough};