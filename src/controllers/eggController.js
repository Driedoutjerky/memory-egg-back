// =============================================================================
//
// -----------------------------------------------------------------------------
// The CONTROLLER layer.
//
// Responsibilities:
//   - Read data from the request object (req.params, req.body, req.user, etc.)
//   - Call the appropriate model
//   - Handle request-level validation
//   - Decide the HTTP status code
//   - Send JSON responses to the client
//   - Catch errors and return proper error responses
//
// What this layer must NOT do:
//   - Create database tables
//   - Write raw SQL queries directly
//   - Contain complex business logic
//   - Directly manage database transactions unless absolutely necessary
//
// =============================================================================

const eggModel = require("../models/eggModel");
const eggService = require("../services/eggService");
// in this case, we will use user_id to find
async function findById(req, res) {
  try {
    const user_id = Number(req.params.id);
    const egg = await eggModel.findById(user_id);
    if (!egg) return res.status(404).json({ error: `Egg of this user is not found` });
    return res.status(200).json(egg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}


// Creates a new egg with req.params.id information
async function create(req, res) {
  try {
    const user_id = req.params.id;
    // Basic validation: required fields must be present.
    // Without this, an INSERT with NULL would fail at the database level
    // because of the NOT NULL constraints we defined in db.js.
    if (user_id === undefined) {
      return res.status(400).json({ error: "Missing required fields (user_id)" });
    }

    const newEgg = await eggModel.create(user_id);
    // 201 Created is the standard response for a successful resource creation.
    // The body includes a new egg, so the client knows its assigned id.
    res.status(201).json(newEgg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}


// Returns a boolean indicating whether a row was actually removed.
// We use that to distinguish 204 (deleted) from 404 (no such egg).
async function remove(req, res) {
  try {
    const egg_id = Number(req.params.id);
    const removed = await eggModel.remove(egg_id);
    if (!removed) return res.status(404).json({ error: "Egg not found" });
    // 204 No Content: the request succeeded and there is nothing to return.
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}


// Returns a boolean indicating whether the egg was actually updated.
// Response code:
//      - 200 : Item equipped successfully
//      - 400 : Bad Request : Invalid item for equip action (This response requires the existing ShopItem Table)
//      - 401 : Unauthorized (this response will be fully implemented after auth implementation)
//      - 404 : there is an egg owned by user_id, but the item is not found or the user don't have the item
async function equip(req, res) {
  const user_id = Number(req.params.id);
  const item_id = Number(req.body.item_id);

  if (
    !Number.isInteger(user_id) || user_id <= 0 ||
    !Number.isInteger(item_id) || item_id <= 0
  ) {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  try {
    const result = await eggService.equip({
      user_id,
      item_id
    });

    return res.status(200).json({ egg: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to equip item"
    });
  }
}

async function unequip(req, res) {
  const user_id = Number(req.params.id);
  const item_id = Number(req.body.item_id);
  if (
    !Number.isInteger(user_id) || user_id <= 0 ||
    !Number.isInteger(item_id) || item_id <= 0
  ) {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  try {
    const result = await eggService.unequip({
      user_id,
      item_id
    });

    return res.status(200).json({ egg: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to unequip item"
    });
  }
}

module.exports = { findById, create, remove, equip, unequip};