// Splits the Timestamp at letter 'T' and moves the two parts into an array
// The date-part at index 0 is chosen. E.g. "2026-05-27T12:25:59.143Z" becomes "2026-05-27" 
const today = new Date().toISOString().split('T')[0]; 

const questModel = require("../models/questModel");
const userQuestModel = require("../models/userQuestModel");

// temporarily HARD CODED for TESTING purposes
const userId = 2;


async function getTodaysQuests (req, res){
    try{
        const questIdTodaysQuests = await userQuestModel.getIdOfTodaysQuests(today, userId);

        // if no result: return empty array
        if (!questIdTodaysQuests || questIdTodaysQuests.length === 0){
            return res.status(200).json([]);
        }

        // extract all quest_ids and get the corresponding quests:
        // 1. map grabs all quest_id's from an array of Objects
        //    and passes it to findById(quest_id): [ { quest_id: 1 }, { quest_id: 3 } ] → [ findById(1), findById(3) ]
        // 2. every findById call returns a promise: [ Promise<Quest1>, Promise<Quest3> ]
        // 3. Promise.all() waits for ALL promises in parallel, not serial = faster
        // 4. await grabs the results: returns an array of quest objects
        const todaysQuests = await Promise.all(
            questIdTodaysQuests.map(quest => questModel.findById(quest.quest_id))
        );

        res.status(200).json(todaysQuests);


        // questIdTodaysQuests is an Object -> we need to get the value of "quest_id":
        //const todaysQuess = await questModel.findById(questIdTodaysQuests?.quest_id);
        
        
    } catch (err){
        console.error(err);
        res.status(500).json({error: "Database error"});
    }
}

module.exports = {getTodaysQuests};




