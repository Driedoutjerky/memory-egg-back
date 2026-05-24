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

// in this case, we will use egg_id to find
async function getById(req, res){
    try{
        const egg_id = Number(req.params.id);
        const egg = await eggModel.findById(egg_id);
        if(!egg) return res.status(404).json({error: `Egg (id: ${egg_id}) not found`});
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
    const removed = await postModel.remove(post_id);
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
async function equip(req, res){
    const {item_id} = req.body;
    const user_id = Number(req.params.id);
    if(item_id === undefined || user_id === NaN){
      return res.status(400).json({error: "Missing required fields" });
    }
    let egg = await eggModel.findById(user_id);

    // TODO: 1) check whether the requested item is valid

    // TODO: 2) check whether the requested item is owned by this user.

    // TODO: 3) identify what kind of this item 

    // currently, suppose that the item is background (just for db test)
    egg.active_background_id = item_id;
    // equip item
    let flag = await eggModel.update(egg);
    if(flag){
      egg = eggModel.findById(user_id);
      res.status(200).json(egg)
    } else {
      res.status(500).json({ error: "Database error" });
    }

}

module.exports = {getById, create, remove, equip};