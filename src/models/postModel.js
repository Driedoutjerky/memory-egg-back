//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the posts table
//   - Run SQL queries against the posts table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

const DB_FILE = "./database.sqlite";

let postsDb;

async function initDb(db) {
  postsDb = db;

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
      will_reward INTEGER NOT NULL,
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
        100,
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
        200,
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
        300,
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
        400,
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
        500,
        now,
        now
      ]
    );

    console.log("Database seeded with initial posts.");
  }

  return db;
}

function getDb() {
  return postsDb;
}

async function getAll(user_id){
    const sql = "SELECT * FROM posts WHERE user_id = ?";
    const result = await getDb().all(sql, [user_id]);
    
    if(!result || result.length === 0){
      const error = new Error (`no posts from user ${user_id} in database`);
      error.statusCode = 404;
      throw error;
    }
    return result
}

// Returns a single post by id, or undefined if no row matches.
// db.get returns the first matching row, or undefined if there is none.
async function findById(post_id, user_id) {
  const sql = "SELECT * FROM posts WHERE post_id = ? AND user_id = ?";
  const checkIfPostPresent = await getDb().get("SELECT * FROM posts WHERE post_id = ?", [post_id]);

  if(!checkIfPostPresent){
    const error = new Error(`post with id ${post_id} not found`);
    error.statusCode = 404;
    throw error;
  }
  const result = await getDb().get(sql, [post_id, user_id]);

  if(!result){
    const error = new Error(`Forbidden! Missing authorisation to see post with id ${post_id}`);
    error.statusCode = 403;
    throw error;
  }

  return result;
}

// Inserts a new post and returns it including its generated id.
// db.run does not return rows; the result object exposes:
//   - lastID: the AUTOINCREMENT value assigned to the new row
//   - changes: the number of rows affected (1 for a successful INSERT)
async function create({ user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at }) {
  const result = await getDb().run(
    "INSERT INTO posts (user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at]
  );
  return { id: result.lastID, user_id, title, content, image_url, tag, visibility, word_count, will_reward, created_at, updated_at };
}

// Deletes a post by id. Returns true if a row was actually removed,
// false if no row matched the id.
//
// The controller uses this boolean to decide between:
//   - 204 No Content (deleted successfully)
//   - 404 Not Found  (no post with that id existed)
async function remove(post_id, user_id) {

  const checkIfPostPresent = await getDb().get("SELECT * FROM posts WHERE post_id = ?", [post_id]);

  if(!checkIfPostPresent){
    const error = new Error(`post with id ${post_id} not found`);
    error.statusCode = 404;
    throw error;
  }

  const checkIfAuthorized = await getDb().get("SELECT * FROM posts WHERE post_id = ? AND user_id = ?", [post_id, user_id]);

  if(!checkIfAuthorized){
    const error = new Error(`Forbidden! User ${user_id} doesn't have the required priviledges to delete post with id ${post_id}`);
    error.statusCode = 403;
    throw error;
  }
  const result = await getDb().run("DELETE FROM posts WHERE post_id = ? AND user_id = ?", [post_id, user_id]);

  return result;
  //return result.changes > 0;
}

module.exports = {initDb, getAll, findById, create, remove };
