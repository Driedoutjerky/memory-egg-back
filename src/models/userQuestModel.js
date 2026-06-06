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
                status: "Completed but unclaimed",
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

async function getIdOfTodaysQuests(date, userId) {
    const result = await getDb().all(
        "SELECT quest_id FROM user_quests WHERE assigned_date = ? AND user_id = ?",
        [date, userId]
    );
    return result;
}

async function increaseWillAfterQuest(user_quest_id, user_id){
  
    // 1. is this quest in the current user's quest?
    const questIfCurrentUser = await getDb().get(
        "SELECT * FROM user_quests WHERE user_quest_id = ? AND user_id = ?", [user_quest_id, user_id]
    );

    if (!questIfCurrentUser){
        throw new Error("Quest not found or does not belong to the user with user_id: " + user_id);
    }

    // 2. is it actually done? & Is it already claimed?
    const status = questIfCurrentUser.status;

    // 3. load will_balance_of_user from user table
    if (status !== "Completed but unclaimed"){
        throw new Error("Quest status is not 'Completed but unclaimed'");
    }

    const will_balance_of_user_Object = await getDb().get("SELECT will_balance FROM users WHERE user_id = ?", [user_id]);
    let will_balance_of_user = will_balance_of_user_Object.will_balance;
    

    const reward_will_Object = await getDb().get("SELECT reward_will FROM quests INNER JOIN user_quests ON quests.quest_id = user_quests.quest_id;");
    const reward_will = reward_will_Object.reward_will;
    
    // 4. increase will_balance_of_user by its will_reward
    will_balance_of_user += reward_will;
    
    
    await getDb().run("UPDATE users SET will_balance = ? WHERE user_id = ?", [will_balance_of_user, user_id]);

    // 5. Update User Quest with is_completed as true
    await getDb().run("UPDATE user_quests SET status = 'Claimed' WHERE user_quest_id = ?", [user_quest_id]);

    // return Completed Quest Info and will_balance
    return {questIfCurrentUser : questIfCurrentUser, will_balance_of_user : will_balance_of_user}
}



module.exports = { initDb, getIdOfTodaysQuests, increaseWillAfterQuest};