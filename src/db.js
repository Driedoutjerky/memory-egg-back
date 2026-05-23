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

const DB_FILE = "./posts.db";

let db;

async function initDb() {
  db = await sqlite.open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  // Create the posts table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      tag TEXT NOT NULL,
      visibility TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      will_reward BOOLEAN NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
  `);

  // Seed initial data if the table is empty
  const postsCount = await db.get("SELECT COUNT(*) AS count FROM posts");
  if (postsCount.count === 0) {
    // Insert sample posts in English
    const now = new Date().toISOString();
    await db.run(
      "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        1,
        "My First Blog Post",
        "This is the content of my very first post. Excited to share my thoughts!",
        null,
        "general",
        "public",
        15,
        true,
        now,
        now
      ]
    );
    await db.run(
      "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        1,
        "Learning Node.js",
        "Node.js is a powerful runtime for server-side JavaScript. Here's how I got started and what I've learned so far.",
        "https://example.com/nodejs.jpg",
        "tech",
        "public",
        40,
        false,
        now,
        now
      ]
    );
    await db.run(
      "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        2,
        "Private Notes",
        "This is a private post. Only I can see this content.",
        null,
        "personal",
        "private",
        8,
        false,
        now,
        now
      ]
    );
    await db.run(
      "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        2,
        "Trip to Seoul",
        "I visited Seoul last summer and it was an amazing experience! The food, culture, and people were incredible.",
        "https://example.com/seoul.jpg",
        "travel",
        "public",
        25,
        true,
        now,
        now
      ]
    );
    await db.run(
      "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        3,
        "How to Build a REST API",
        "A step-by-step guide to building a RESTful API with Express and SQLite. Perfect for beginners!",
        "https://example.com/rest-api.jpg",
        "tutorial",
        "public",
        120,
        true,
        now,
        now
      ]
    );

    console.log("Database seeded with initial posts.");
  }

  return db;
}

function getDb() {
  return db;
}

module.exports = { initDb, getDb };