// =============================================================================
// db.js — Database module for posts
// -----------------------------------------------------------------------------
// Responsibilities:
//   1. Open a connection to the SQLite database file
//   2. Create the posts table if it doesn't exist yet
//   3. Seed initial data on the first run
//   4. Expose the shared database connection to the rest of the application
// =============================================================================

const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");

// src/db.js
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

// const userModel = require("./models/userModel");
const eggModel = require("./models/eggModel");
const postModel = require("./models/postModel");
// const questModel = require("./models/questModel");
// const shopItemModel = require("./models/shopItemModel");

async function initDb() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  // Enable foreign key constraint checks in SQLite.
  // For example, an egg cannot reference a user_id that does not exist in the users table.
  // But just comment it since we are now making one by one.
  // await db.exec("PRAGMA foreign_keys = ON");

  // await userModel.createTable(db);
  // await shopItemModel.createTable(db);
  await eggModel.createTable(db);
  await postModel.createTable(db);
  // await questModel.createTable(db);

  return db;
}

module.exports = initDb;