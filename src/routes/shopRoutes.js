// =============================================================================
// URL-to-controller mapping
// -----------------------------------------------------------------------------
// The ROUTE layer.
//
// Responsibilities:
//   - Define which HTTP method + URL combinations exist
//   - Map each one to the appropriate controller function
//
// What this layer must NOT do:
//   - Process input or build responses (controller's job)
//   - Touch the database (model's job)
//
// Routes are intentionally short. If this file ever grows long, it usually
// means logic has crept in that should be in the controller.
// =============================================================================

const express = require("express");
const router = express.Router();
const controller = require("../controllers/shopController");

router.get("/items", controller.getAll);

// currently use params for user identification
router.post("/purchase/:id", controller.purchase);
module.exports = router;