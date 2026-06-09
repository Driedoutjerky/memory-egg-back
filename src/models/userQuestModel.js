//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the user_quests table
//   - Run SQL queries against the user_quests table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let userQuestsDb;

async function initDb(db) {
    userQuestsDb = db;

    // Create the user_quests table if it doesn't exist
    await db.exec(`
    CREATE TABLE IF NOT EXISTS user_quests (
      user_quest_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id INTEGER NOT NULL,
      assigned_date STRING NOT NULL,
      status STRING NOT NULL,
      completed_post_id	INTEGER,
      completed_at STRING,

      UNIQUE(user_id, quest_id),
      FOREIGN KEY (quest_id) REFERENCES quests(quest_id),
      FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE,

      FOREIGN KEY (completed_post_id) REFERENCES posts(post_id)
    );
  `);

    // Seed initial data if the table is empty
    // Seed initial data if the table is empty
    const userQuestsCount = await db.get(
        "SELECT COUNT(*) AS count FROM user_quests"
    );

    if (userQuestsCount.count === 0) {
        const now = new Date().toISOString().split('T')[0];

        const userQuestMockData = [
            {
                user_id: 1,
                quest_id: 1,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 1,
                quest_id: 2,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 2,
                quest_id: 1,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 2,
                quest_id: 3,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 3,
                quest_id: 1,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 4,
                quest_id: 2,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 4,
                quest_id: 3,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            },
            {
                user_id: 4,
                quest_id: 4,
                assigned_date: now,
                status: "assigned",
                completed_post_id: null,
                completed_at: null
            }
        ];

        for (const userQuest of userQuestMockData) {
            await db.run(
                `
      INSERT INTO user_quests (
        user_id,
        quest_id,
        assigned_date,
        status,
        completed_post_id,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      `,
                [
                    userQuest.user_id,
                    userQuest.quest_id,
                    userQuest.assigned_date,
                    userQuest.status,
                    userQuest.completed_post_id,
                    userQuest.completed_at
                ]
            );
        }
    }

    return db;
}

function getDb() {
    return userQuestsDb;
}

async function getIdOfTodaysQuests(date, user_id) {
    const result = await getDb().all(
        "SELECT quest_id FROM user_quests WHERE assigned_date = ? AND user_id = ?",
        [date, user_id]
    );
    return result;
}

async function increaseWillAfterQuest(user_quest_id, user_id, getAllPostsOfUser){
  
    const doesQuestExist = await getDb().get(
        "SELECT * FROM user_quests WHERE user_quest_id = ?", [user_quest_id]
    );

    if(!doesQuestExist){
        const error = new Error("Quest not found");
        error.statusCode = 404;
        throw error;
        
    }

    // 1. is this quest in the current user's quest?
    let userQuest = await getDb().get(
        "SELECT * FROM user_quests WHERE user_quest_id = ? AND user_id = ?", [user_quest_id, user_id]
    );

    
    if (!userQuest){
        const error = new Error("Forbidden! Quest " + user_quest_id + "does not belong to the currently logged in user");
        error.statusCode = 403;
        throw error;
    }

    if (userQuest.status === "claimed") {
    const error = new Error(
        `Quest ${user_quest_id} has already been claimed`
    );
    error.statusCode = 409;
    throw error;
}

    // 1b) are quest completition conditions met ? 
    const quest_template_Object = await getDb().get(
        "SELECT * FROM quests WHERE quest_id = ?", [userQuest.quest_id]
    )
    const quest_type = quest_template_Object.quest_type;
    const required_tag = quest_template_Object.required_tag;
    const required_word_count = quest_template_Object.required_word_count;
    const doesRequireImage = quest_template_Object.required_image;
    
    //load the posts:
    const tag_type_post = await getDb().get(
        //"SELECT * FROM posts WHERE post_id = ?", [userQuest.completed_post_id]
        "SELECT * FROM posts WHERE user_id = ? AND tag LIKE ? AND post_id NOT IN (SELECT completed_post_id FROM user_quests WHERE completed_post_id IS NOT NULL)",
        [user_id, required_tag]
    )
    console.log(tag_type_post);

    const word_count_type_post = await getDb().get(
        "SELECT * FROM posts WHERE user_id = ? AND word_count >= ? AND post_id NOT IN (SELECT completed_post_id FROM user_quests WHERE completed_post_id IS NOT NULL)",
        [user_id, required_word_count]
    )
    console.log(word_count_type_post);
    const image_required_type_post = await getDb().get(
        "SELECT * FROM posts WHERE user_id = ? AND image_url IS NOT NULL AND post_id NOT IN (SELECT completed_post_id FROM user_quests WHERE completed_post_id IS NOT NULL)",
        [user_id]
    )
    console.log(image_required_type_post)

    // if(tag_type_post === undefined && word_count_type_post === undefined && image_required_type_post === undefined){
    //     const error = new Error(`no corresponding post for quest ${user_quest_id} found`);
    //     error.statusCode = 404;
    //     throw error;
    // }

    // if(quest_type === "post_tag" && required_tag !== tag_type_post.tag){
        //     const error = new Error(`wrong tag for userQuest ${user_quest_id}`);
        //     error.statusCode = 400;
        //     throw error;
        // }
    
    // completion conditions NOT met ?    
    if (quest_type === "post_tag") {
        if (tag_type_post === undefined) {
            const error = new Error(
                `No new post with tag '${required_tag}' found`
            );
            error.statusCode = 400;
            throw error;
        }

        if (required_tag !== tag_type_post.tag) {
            const error = new Error(`wrong tag for userQuest ${user_quest_id}`);
            error.statusCode = 400;
            throw error;
        }
}

    if(quest_type === "word_count"){
        if (word_count_type_post === undefined) {
            const error = new Error(
                `No new post with word_count found`
            );
            error.statusCode = 400;
            throw error;
        }

        if(required_word_count > word_count_type_post.word_count){
        const error = new Error(`word_count requirement not fulfilled for userQuest ${user_quest_id}`);
        error.statusCode = 400;
        throw error;
        }
    }

    if(quest_type === "image"){
        if (image_required_type_post === undefined) {
            const error = new Error(
                `No new post with image_url found`
            );
            error.statusCode = 400;
            throw error;
        }

        if(image_required_type_post.image_url.length === 0){
        const error = new Error(`no image_url provided for userQuest ${user_quest_id}`);
        error.statusCode = 400;
        throw error;
        }
    }

    if(quest_type === "post_tag_image"){
        if (tag_type_post === undefined) {
            const error = new Error(
                `No new post with tag '${required_tag}' found`
            );
            error.statusCode = 400;
            throw error;
        }

        if (image_required_type_post === undefined) {
            const error = new Error(
                `No new post with image_url found`
            );
            error.statusCode = 400;
            throw error;
        }




        if(image_required_type_post.image_url.length === 0){
            const error = new Error(`no image_url provided for userQuest ${user_quest_id}`);
            error.statusCode = 400;
            throw error;
        }
        if(required_tag !== tag_type_post.tag){
            const error = new Error(`wrong tag for userQuest ${user_quest_id}`);
            error.statusCode = 400;
            throw error;
        }
    }

    if(quest_type === "post_tag_word_count" ){
         if (word_count_type_post === undefined) {
            const error = new Error(
                `No new post with word_count found`
            );
            error.statusCode = 400;
            throw error;
        }
        if (tag_type_post === undefined) {
            const error = new Error(
                `No new post with tag '${required_tag}' found`
            );
            error.statusCode = 400;
            throw error;
        }



        if(image_required_type_post.image_url.length === 0){
            const error = new Error(`no image_url provided for userQuest ${user_quest_id}`);
            error.statusCode = 400;
            throw error;
        }
        if(required_word_count !== word_count_type_post.word_count){
        const error = new Error(`word_count requirement not fulfilled for userQuest ${user_quest_id}`);
        error.statusCode = 400;
        throw error;
        }
        

    }

//     // 1c) update "user_quests" as completed, set completed_post_id and completed_at
//     await getDb().run(
//         // completed_post_id = ?,
//   `UPDATE user_quests
//    SET status = 'completed',
//        completed_at = ?
//    WHERE user_quest_id = ?
//     AND status = 'assigned'`,
//   [new Date().toISOString(), user_quest_id]
// );

//     // 2. is it actually done? & Is it already claimed?
//         //Update Variable:
//     userQuest = await getDb().get(
//         "SELECT * FROM user_quests WHERE user_quest_id = ? AND user_id = ?", [user_quest_id, user_id]
//     );
//     const status = userQuest.status;

//     // 3. load will_balance_of_user from user table
//     if (status !== "completed"){
//         const error = new Error("Quest status is not 'completed'");
//         error.statusCode = 403;
//         throw error;
//     }

    const will_balance_of_user_Object = await getDb().get("SELECT will_balance FROM users WHERE user_id = ?", [user_id]);
    let will_balance_of_user = will_balance_of_user_Object.will_balance;
    

    const reward_will_Object = await getDb().get("SELECT reward_will FROM quests INNER JOIN user_quests ON quests.quest_id = user_quests.quest_id;");
    const reward_will = reward_will_Object.reward_will;
    
    // 4. increase will_balance_of_user by its will_reward
    will_balance_of_user += reward_will;
    
    
    await getDb().run("UPDATE users SET will_balance = ? WHERE user_id = ?", [will_balance_of_user, user_id]);

    // 5. Update User Quest with is_completed as true
    await getDb().run("UPDATE user_quests SET status = 'claimed', completed_at = ? WHERE user_quest_id = ?", [new Date().toISOString().split('T')[0], user_quest_id]);
    
    //Update Variable:
    userQuest = await getDb().get(
    "SELECT * FROM user_quests WHERE user_quest_id = ? AND user_id = ?", [user_quest_id, user_id]
    );

    // return Completed Quest Info and will_balance
    return {userQuest : userQuest, will_balance_of_user : will_balance_of_user}
}



module.exports = { initDb, getIdOfTodaysQuests, increaseWillAfterQuest};