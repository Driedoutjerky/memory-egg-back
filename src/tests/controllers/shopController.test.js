// =============================================================================
// Shop Controller Unit Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that shopController parses query/body parameters, calls the shop model
//   or service with the expected arguments, and returns correct HTTP responses.
//
// Scope:
//   Covers shop item listing and item purchase controller paths.
//   Mocks shopItemModel and shopService, so database and business logic are isolated.
// =============================================================================

// Replace the real shop item model with Jest mock functions.
jest.mock("../../models/shopItemModel");
// Replace the real shop service with Jest mock functions.
jest.mock("../../services/shopService");

// Load the controller under test after dependencies have been mocked.
const shopController = require("../../controllers/shopController");
// Load the mocked model so tests can control item listing results.
const shopItemModel = require("../../models/shopItemModel");
// Load the mocked service so tests can control purchase results and errors.
const shopService = require("../../services/shopService");

// Build a minimal Express response object for controller assertions.
function mockResponse() {
  return {
    // Mock res.status and keep it chainable.
    status: jest.fn().mockReturnThis(),
    // Mock res.json to capture the response body.
    json: jest.fn()
  };
}

// Create a shop item fixture while allowing each test to override selected fields.
function makeItem(overrides = {}) {
  return {
    item_id: 101,
    name: "Test Shop Item",
    item_type: "background",
    description: "Only used in tests",
    price: 50,
    is_active: 1,
    ...overrides
  };
}

// Group tests for listing shop items.
describe("shopController.getAll", () => {
  // Reset all mock calls and configured values before each listing test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm empty query parameters fall back to the controller defaults.
  test("uses default filters when query is empty", async () => {
    // Arrange a default item list returned by the model.
    const items = [makeItem()];

    // Make the mocked model resolve with the arranged items.
    shopItemModel.getAll.mockResolvedValue(items);

    // Provide an empty query object to simulate no filters from the client.
    const req = { query: {} };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.getAll(req, res);

    // Assert that default only_active and item_type filters are used.
    expect(shopItemModel.getAll).toHaveBeenCalledWith(1, "all");
    // Assert that successful listing returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the response body is the model result.
    expect(res.json).toHaveBeenCalledWith(items);
  });

  // Confirm explicit query filters are forwarded to the model.
  test("passes query filters to the model", async () => {
    // Arrange a filtered item result.
    const items = [makeItem({ item_type: "music" })];

    // Make the mocked model resolve with the filtered items.
    shopItemModel.getAll.mockResolvedValue(items);

    // Provide query filters as Express would parse them from the URL.
    const req = {
      query: {
        item_type: "music",
        only_active: "1"
      }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.getAll(req, res);

    // Assert that query values are passed through to the model.
    expect(shopItemModel.getAll).toHaveBeenCalledWith("1", "music");
    // Assert that successful filtered listing returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the response body is the filtered model result.
    expect(res.json).toHaveBeenCalledWith(items);
  });
});

// Group tests for purchasing a shop item.
describe("shopController.purchase", () => {
  // Reset all mocks before each purchase test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm a missing user id is rejected before the service is called.
  test("returns 400 when user_id is missing", async () => {
    // Arrange a request without the route id parameter.
    const req = {
      params: {},
      body: { item_id: 101 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.purchase(req, res);

    // Assert that missing user id returns HTTP 400.
    expect(res.status).toHaveBeenCalledWith(400);
    // Assert that the expected validation error body is returned.
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid user id"
    });
    // Assert that validation failure prevents service execution.
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  // Confirm a missing item id is rejected before the service is called.
  test("returns 400 when item_id is missing", async () => {
    // Arrange a request with a user id but no item id in the body.
    const req = {
      params: { id: "1" },
      body: {}
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.purchase(req, res);

    // Assert that missing body data returns HTTP 400.
    expect(res.status).toHaveBeenCalledWith(400);
    // Assert that the expected validation error body is returned.
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid request body"
    });
    // Assert that validation failure prevents service execution.
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  // Confirm a successful purchase response is returned from the service.
  test("returns 201 when purchase succeeds", async () => {
    // Arrange the purchase result returned by the service.
    const purchaseResult = {
      user_id: "1",
      item_id: 101,
      item_name: "Test Shop Item",
      price: 50
    };

    // Make the mocked service resolve with the purchase result.
    shopService.purchaseItem.mockResolvedValue(purchaseResult);

    // Provide valid user id and item id input.
    const req = {
      params: { id: "1" },
      body: { item_id: "101" }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.purchase(req, res);

    // Assert that item_id is converted to a number while user_id remains the route value.
    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: "1",
      item_id: 101
    });
    // Assert that successful purchase returns HTTP 201.
    expect(res.status).toHaveBeenCalledWith(201);
    // Assert that the response body is the service result.
    expect(res.json).toHaveBeenCalledWith(purchaseResult);
  });

  // Confirm service errors are converted into controller error responses.
  test("returns service error status when purchase fails", async () => {
    // Arrange a service error with an HTTP status code.
    const error = new Error("Insufficient will balance");
    error.statusCode = 409;

    // Make the mocked service reject with that error.
    shopService.purchaseItem.mockRejectedValue(error);

    // Provide otherwise valid input so validation reaches the service call.
    const req = {
      params: { id: "1" },
      body: { item_id: 101 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await shopController.purchase(req, res);

    // Assert that the controller uses the service error status code.
    expect(res.status).toHaveBeenCalledWith(409);
    // Assert that the controller exposes the service error message.
    expect(res.json).toHaveBeenCalledWith({
      error: "Insufficient will balance"
    });
  });
});
