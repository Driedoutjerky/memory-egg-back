//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
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

const { getDb } = require("../db");

async function getAll(){
    const sql = "SELECT * FROM posts";
    return getDb().all(sql);
}

// Returns a single post by id, or undefined if no row matches.
// db.get returns the first matching row, or undefined if there is none.
async function findById(post_id) {
  return getDb().get("SELECT * FROM posts WHERE post_id = ?", [post_id]);
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
async function remove(post_id) {
  const result = await getDb().run("DELETE FROM posts WHERE post_id = ?", [post_id]);
  return result.changes > 0;
}

module.exports = { getAll, findById, create, remove };
