
const postModel = require("../models/postModel");
const userModel = require("../models/userModel");

async function getAll(req, res){
    try{
        const posts = await postModel.getAll();
        res.status(200).json(posts);
    } catch (err){
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
}

async function getById(req, res){
    try{
        const post_id = Number(req.params.id);
        const post = await postModel.findById(post_id);
        if(!post) return res.status(404).json({error: "Post not found"});
        return res.status(200).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
}

//
// Reads the new flight from req.body. Note that req.body is only populated
// because of `app.use(express.json())` in app.js — without that middleware,
// req.body would be undefined.
async function create(req, res) {
  try {
    const { user_id, title, content, image_url, tag, visibility, word_count,
       will_reward, created_at, updated_at } = req.body;
    // Basic validation: required fields must be present.
    // Without this, an INSERT with NULL would fail at the database level
    // because of the NOT NULL constraints we defined in db.js.
    if (
    user_id === undefined ||
    !title ||
    !content ||
    !tag ||
    !visibility ||
    //word_count === undefined ||
    will_reward === undefined ||
    created_at == null ||
    updated_at == null
    ) {
    return res.status(400).json({ error: "Missing required fields" });
    }
    const countTheWords = (str) => {return str.trim() .split(/\s+/).length;}
    const wordCount = countTheWords(content);

    // TRANSACTION shizzle implementieren !! -> implement postService.js !! 
    const newPost = await postModel.create({ user_id, title, content, image_url, tag, visibility, word_count: wordCount, will_reward, created_at, updated_at });    
    
    // userModel.increaseWillAfterPost(user_id); 
    
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}



// The model returns a boolean indicating whether a row was actually removed.
// We use that to distinguish 204 (deleted) from 404 (no such flight).
async function remove(req, res) {
  try {
    const post_id = Number(req.params.id);
    const removed = await postModel.remove(post_id);
    if (!removed) return res.status(404).json({ error: "Post not found" });
    // 204 No Content: the request succeeded and there is nothing to return.
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}


module.exports = { getAll, getById, create, remove };
