// Splits the Timestamp at letter 'T' and moves the two parts into an array
// The date-part at index 0 is chosen. E.g. "2026-05-27T12:25:59.143Z" becomes "2026-05-27" 
const today = new Date().toISOString().split('T')[0]; 

const questModel = require("../models/questModel");
const userQuestModel = require("../models/userQuestModel");
const quest_id_todays_quest = userQuestModel.getIdOfTodaysQuest(today);


function getTodaysQuest (req, res){
    try{
        const todaysQuest = await questModel.findById(quest_id_todays_quest);
        res.status(200).json(todaysQuest);
    } catch (err){
        console.error(err);
        res.status(500).json({error: "Database error"});
    }
}

module.exports = {getTodaysQuest};




