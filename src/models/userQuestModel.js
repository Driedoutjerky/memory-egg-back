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
/*
async function getIdOfTodaysQuests(date, user_id) {
    const result = await getDb().all(
        "SELECT quest_id FROM user_quests WHERE assigned_date = ? AND user_id = ?",
        [date, user_id]
    );
    return result;
}
*/

// quest-refactor: It should return joined quest + user quest data.
// Frontend needs user_quest_id, status, completed_post_id

async function getTodaysQuests(date, user_id) {
  const result = await getDb().all(
    `
    SELECT
      uq.user_quest_id,
      uq.user_id,
      uq.quest_id,
      uq.assigned_date,
      uq.status,
      uq.completed_post_id,
      uq.completed_at,

      q.title,
      q.description,
      q.quest_type,
      q.required_tag,
      q.required_word_count,
      q.required_image,
      q.reward_will,
      q.is_active
    FROM user_quests uq
    INNER JOIN quests q
      ON uq.quest_id = q.quest_id
    WHERE uq.assigned_date = ?
      AND uq.user_id = ?
      AND q.is_active = 1
    `,
    [date, user_id]
  );

  return result;
}

// New user doesn't get quest assigned. This function fixes the relevant issue.
async function assignTodaysQuestsIfMissing(user_id) {
  const today = new Date().toISOString().split("T")[0];

  const existing = await getDb().all(
    `
    SELECT user_quest_id
    FROM user_quests
    WHERE user_id = ?
      AND assigned_date = ?
    `,
    [user_id, today]
  );

  if (existing.length > 0) {
    return;
  }

  const activeQuests = await getDb().all(
    `
    SELECT quest_id
    FROM quests
    WHERE is_active = 1
    LIMIT 3
    `
  );

  for (const quest of activeQuests) {
    await getDb().run(
      `
      INSERT OR IGNORE INTO user_quests (
        user_id,
        quest_id,
        assigned_date,
        status,
        completed_post_id,
        completed_at
      )
      VALUES (?, ?, ?, 'assigned', NULL, NULL)
      `,
      [user_id, quest.quest_id, today]
    );
  }
}


// Helper function for quest completion condition check. Used in `increaseWillAfterQuest()`
function doesPostSatisfyQuest(post, quest) {
  const questType = quest.quest_type;

  if (questType === "post_tag") {
    return post.tag === quest.required_tag;
  }

  if (questType === "word_count") {
    return Number(post.word_count) >= Number(quest.required_word_count);
  }

  if (questType === "image") {
    return Boolean(post.image_url);
  }

  if (questType === "post_tag_image") {
    return post.tag === quest.required_tag && Boolean(post.image_url);
  }

  if (questType === "post_tag_word_count") {
    return (
      post.tag === quest.required_tag &&
      Number(post.word_count) >= Number(quest.required_word_count)
    );
  }

  return false;
}


async function increaseWillAfterQuest(user_quest_id, user_id, post){
  
    const userQuest = await getDb().get(
        `
        SELECT
        uq.*,
        q.title,
        q.description,
        q.quest_type,
        q.required_tag,
        q.required_word_count,
        q.required_image,
        q.reward_will,
        q.is_active
        FROM user_quests uq
        INNER JOIN quests q
        ON uq.quest_id = q.quest_id
        WHERE uq.user_quest_id = ?
        `,
        [user_quest_id]
    );

    // 1. is this quest in the current user's quest?
    
    if (!userQuest){
        const error = new Error("Quest not found");
        error.statusCode = 404;
        throw error;
    }

    if (Number(userQuest.user_id) !== Number(user_id)) {
        const error = new Error(
        `Forbidden! Quest ${user_quest_id} does not belong to the currently logged in user`
        );
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

    // 2. is this quest already completed?
    const alreadyUsedPost = await getDb().get(
        `
        SELECT user_quest_id
        FROM user_quests
        WHERE completed_post_id = ?
        AND status = 'claimed'
        `,
        [post.post_id]
    );

    if (alreadyUsedPost) {
        const error = new Error(
        `Post ${post.post_id} has already been used to claim another quest`
        );
        error.statusCode = 409;
        throw error;
    }

    // 3. are quest completion conditions met?

    const isSatisfied = doesPostSatisfyQuest(post, userQuest);

    if (!isSatisfied) {
        const error = new Error(
        `Post ${post.post_id} does not satisfy quest ${user_quest_id}`
        );
        error.statusCode = 400;
        throw error;
    }


    // 4. increase will_balance_of_user by its will_reward
    const rewardWill = Number(userQuest.reward_will);

    await getDb().run(
        `
        UPDATE users
        SET will_balance = will_balance + ?
        WHERE user_id = ?
        `,
        [rewardWill, user_id]
    );

    // 5. Update User Quest with is_completed as true

    await getDb().run(
        `
        UPDATE user_quests
        SET status = 'claimed',
            completed_post_id = ?,
            completed_at = ?
        WHERE user_quest_id = ?
        AND user_id = ?
        `,
        [
        post.post_id,
        new Date().toISOString().split("T")[0],
        user_quest_id,
        user_id
        ]
    );

    const updatedUserQuest = await getDb().get(
        `
        SELECT
        uq.*,
        q.title,
        q.description,
        q.quest_type,
        q.required_tag,
        q.required_word_count,
        q.required_image,
        q.reward_will,
        q.is_active
        FROM user_quests uq
        INNER JOIN quests q
        ON uq.quest_id = q.quest_id
        WHERE uq.user_quest_id = ?
        AND uq.user_id = ?
        `,
        [user_quest_id, user_id]
    );

    const updatedUser = await getDb().get(
        "SELECT user_id, nickname, will_balance FROM users WHERE user_id = ?",
        [user_id]
    );

    // return Completed Quest Info and will_balance
    return {
        userQuest: updatedUserQuest,
        user: updatedUser,
        reward_will: rewardWill,
    };
}



module.exports = { initDb, getTodaysQuests, assignTodaysQuestsIfMissing, increaseWillAfterQuest};