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

// Added more flexibilty for further filtering.
// response code:
//      - 200 : OK
async function getAll(req, res){
    let {item_type, only_active} = req.body;
    
    if(item_type === undefined) item_type = "all";
    if(only_active === undefined) only_active = 1;

    const items = await shopItemModel.getAll(only_active, item_type);

    res.status(200).json(items);
}

module.exports = {getAll};