// =============================================================================
//
// -----------------------------------------------------------------------------
// The CONTROLLER layer.
//
// Responsibilities:
//   - Read data from the request object (req.params, req.body, req.user, etc.)
//   - Call the appropriate model
//   - Handle request-level validation
//   - Decide the HTTP status code
//   - Send JSON responses to the client
//   - Catch errors and return proper error responses
//
// What this layer must NOT do:
//   - Create database tables
//   - Write raw SQL queries directly
//   - Contain complex business logic
//   - Directly manage database transactions unless absolutely necessary
//
// =============================================================================

const authService = require("../services/authService");

async function register(req, res) {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
        return res.status(400).json({ error: "Missing or invalid body" });
    }
    try {
        const result = await authService.registerUser({ email, password, nickname });
        res.status(201).json(result);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            error: statusCode === 500
                ? "Failed to register user"
                : err.message
        });
    }

}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing or invalid body" });
    }
    try {
        const { token, user } = await authService.loginUser({ email, password });
        res.status(200).json({
            "token": token,
            "user": user
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            error: err.statusCode
                ? err.message
                : "Failed to login user"
        });
    }
}
async function getCurrentUser(req, res) {
    // middleware already verified this user_id so just use.
    const user_id = req.user.user_id;

    try {
        const user = await authService.getCurrentUser(req.user.user_id);

        return res.status(200).json({
            user
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;

        return res.status(statusCode).json({
            error: statusCode === 500
                ? "Failed to get current user"
                : err.message
        });
    }
}
module.exports = { register, login, getCurrentUser };