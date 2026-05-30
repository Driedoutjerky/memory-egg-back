// Import the Express framework so that this file can create API routes.
const express = require("express");

// Create a new router object.
// This router will contain endpoints related to authentication.
const router = express.Router();

// Import the authentication controller.
// The controller will contain the actual logic for register, login,
// and retrieving the currently logged-in user.
const controller = require("../controllers/authController");
const {authenticate} = require("../middleware/authMiddleware");

// This router is responsible for authentication-related API endpoints.
//
// Planned endpoints:
// POST /api/auth/register
//   - Registers a new user.
//   - Creates the user's account and starter egg.
router.post("/register", controller.register);
// POST /api/auth/login
//   - Checks the user's login credentials.
//   - Returns an authentication token if login succeeds.
router.post("/login", controller.login);
// GET /api/auth/me
//   - Returns information about the currently logged-in user.
//   - This route should be protected by authentication middleware.
router.get("/me", authenticate, controller.getCurrentUser);

module.exports = router;