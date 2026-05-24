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

const shopItemModel = require("../models/shopItemModel");
const shopService = require("../services/shopService");

// Added more flexibilty for further filtering.
// response code:
//      - 200 : OK
async function getAll(req, res) {
    let { item_type, only_active } = req.body;

    if (item_type === undefined) item_type = "all";
    if (only_active === undefined) only_active = 1;

    const items = await shopItemModel.getAll(only_active, item_type);

    res.status(200).json(items);
}


// Enable the user to purchase the item
async function purchase(req, res) {
    // after implementing auth, this will be conducted with req.user.user_id
    // const user_id = req.user.user_id;
    try {
        const user_id = req.params.id;
        const { item_id } = req.body;

        // there is no information about user
        if (!user_id) {
            return res.status(400).json({ error: "Missing or invalid user id" });
        }

        // there is no item_id in body
        if (item_id === undefined || item_id === null) {
            return res.status(400).json({ error: "Missing or invalid request body" });
        }

        // Conduct service
        const result = await shopService.purchaseItem({
            user_id,
            item_id: Number(item_id)
        });
        return res.status(201).json(result);
    }
    catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to purchase item"
        });
    }
}

module.exports = { getAll, purchase };