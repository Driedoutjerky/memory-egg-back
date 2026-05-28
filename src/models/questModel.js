//=============================================================================
//
// -----------------------------------------------------------------------------
// The MODEL layer.
//
// Responsibilities:
//   - Create/Get the quests table
//   - Run SQL queries against the quests table
//   - Return plain JavaScript objects (or arrays of objects) to the caller
//
// What this layer must NOT do:
//   - Read from req or write to res (that is the controller's job)
//   - Send HTTP responses or set status codes
//
// All functions are async because db.all / db.get / db.run return Promises.
// The controllers will `await` these functions.
// =============================================================================

let questsDb;

async function initDb(db) {
    questsDb = db;

    // Create the quests table if it doesn't exist
    await db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      quest_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title STRING NOT NULL,
      description STRING NOT NULL,
      quest_type STRING NOT NULL,
      required_tag STRING,
      required_word_count INTEGER NOT NULL,
      required_image BOOLEAN NOT NULL,
      reward_will INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL
    );
  `);

    // Seed initial data if the table is empty
    // Seed initial data if the table is empty
    const questsCount = await db.get("SELECT COUNT(*) AS count FROM quests");

    if (questsCount.count === 0) {
        const questMockData = [
            {
                title: "Write about food",
                description: "Write a memory post with the food tag.",
                quest_type: "post_tag",
                required_tag: "food",
                required_word_count: 0,
                required_image: 0,
                reward_will: 10,
                is_active: 1
            },
            {
                title: "Write about study",
                description: "Write a memory post with the study tag.",
                quest_type: "post_tag",
                required_tag: "study",
                required_word_count: 0,
                required_image: 0,
                reward_will: 10,
                is_active: 1
            },
            {
                title: "Write a long memory",
                description: "Write a memory post with at least 100 words.",
                quest_type: "word_count",
                required_tag: null,
                required_word_count: 100,
                required_image: 0,
                reward_will: 20,
                is_active: 1
            },
            {
                title: "Share a photo memory",
                description: "Write a memory post with an image.",
                quest_type: "image",
                required_tag: null,
                required_word_count: 0,
                required_image: 1,
                reward_will: 15,
                is_active: 1
            },
            {
                title: "Write a food story with a photo",
                description: "Write a food memory post with an image.",
                quest_type: "post_tag_image",
                required_tag: "food",
                required_word_count: 0,
                required_image: 1,
                reward_will: 25,
                is_active: 1
            },
            {
                title: "Write a detailed study memory",
                description: "Write a study memory post with at least 150 words.",
                quest_type: "post_tag_word_count",
                required_tag: "study",
                required_word_count: 150,
                required_image: 0,
                reward_will: 30,
                is_active: 1
            }
        ];

        for (const quest of questMockData) {
            await db.run(
                `
      INSERT INTO quests (
        title,
        description,
        quest_type,
        required_tag,
        required_word_count,
        required_image,
        reward_will,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
                [
                    quest.title,
                    quest.description,
                    quest.quest_type,
                    quest.required_tag,
                    quest.required_word_count,
                    quest.required_image,
                    quest.reward_will,
                    quest.is_active
                ]
            );
        }
    }
    return db;
}

function getDb() {
    return questsDb;
}

async function findById(quest_id){
    return getDb().get("SELECT * FROM quests WHERE quest_id = ?", [quest_id])
}

module.exports = { initDb, findById };