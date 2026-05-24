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
const controller = require("../controllers/eggController");

// All paths here are RELATIVE to the prefix that was given when this router
// was mounted in app.js: `app.use("/flights", flightsRouter)`.
// So `router.get("/")` becomes `GET /flights`, and
// `router.get("/:id")` becomes `GET /flights/:id`.

// TODO: After implementing auth middleware, we will not add usesr_id into params or query.
// currently use params
router.patch("/equip/:id", controller.equip);
module.exports = router;