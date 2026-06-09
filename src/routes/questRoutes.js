// URL-to-controller mapping
// -----------------------------------------------------------------------------
// The ROUTE layer.
//
// Responsibilities:
//   - Define which HTTP method + URL combinations exist
//   - Map each one to the appropriate controller function

const express = require("express");
const router = express.Router();
const controller = require("../controllers/questController");
const {authenticate} = require("../middleware/authMiddleware");

// All paths here are RELATIVE to the prefix that was given when this router
// was mounted in app.js: `app.use("/api/quests", questRouter);`

router.get("/today", authenticate, controller.getTodaysQuests);
router.post("/:id/claim", authenticate, controller.claimCompletedQuestReward); //id means userQuestId

module.exports = router;