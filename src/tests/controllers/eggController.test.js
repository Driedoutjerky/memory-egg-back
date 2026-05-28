// =============================================================================
// Egg Controller Unit Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that eggController translates HTTP request data into model/service
//   calls and returns the expected HTTP status codes and JSON response bodies.
//
// Scope:
//   Covers findById, equip, and unequip controller behavior.
//   Mocks eggModel and eggService, so no real database or service logic runs here.
// =============================================================================

// Replace the real egg model with Jest mock functions for isolated controller tests.
jest.mock("../../models/eggModel");
// Replace the real egg service with Jest mock functions for isolated controller tests.
jest.mock("../../services/eggService");

// Load the controller under test after its dependencies have been mocked.
const eggController = require("../../controllers/eggController");
// Load the mocked model so each test can control database-like results.
const eggModel = require("../../models/eggModel");
// Load the mocked service so each test can control business-logic results.
const eggService = require("../../services/eggService");

// Build a minimal Express response object with chainable status and JSON helpers.
function mockResponse() {
  return {
    // Mock res.status and return res so controller code can call res.status(...).json(...).
    status: jest.fn().mockReturnThis(),
    // Mock res.json to capture the response body.
    json: jest.fn(),
    // Mock res.send in case controller code uses an empty response.
    send: jest.fn()
  };
}

// Group tests for reading an egg by user id.
describe("eggController.findById", () => {
  // Reset all mock call history and configured return values before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm the controller returns an existing egg with a successful response.
  test("returns 200 with egg data when egg exists", async () => {
    // Arrange a model result that represents a found egg.
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: null
    };

    // Make the mocked model resolve with the egg when called.
    eggModel.findById.mockResolvedValue(egg);

    // Provide the route parameter as Express would pass it.
    const req = { params: { id: "1" } };
    // Create a mock response object for capturing controller output.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.findById(req, res);

    // Assert that the string route id was converted to the numeric model id.
    expect(eggModel.findById).toHaveBeenCalledWith(1);
    // Assert that the controller sends HTTP 200 for a found egg.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the response body is the egg returned by the model.
    expect(res.json).toHaveBeenCalledWith(egg);
  });

  // Confirm the controller returns a not-found response when the model finds nothing.
  test("returns 404 when egg does not exist", async () => {
    // Arrange a missing model result.
    eggModel.findById.mockResolvedValue(undefined);

    // Use a route id that does not map to any egg.
    const req = { params: { id: "999" } };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.findById(req, res);

    // Assert that the controller reports a missing egg with HTTP 404.
    expect(res.status).toHaveBeenCalledWith(404);
    // Assert that the controller returns the expected error body.
    expect(res.json).toHaveBeenCalledWith({
      error: "Egg of this user is not found"
    });
  });
});

// Group tests for equipping an item on an egg.
describe("eggController.equip", () => {
  // Reset mocks before every equip test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm invalid request data is rejected before the service is called.
  test("returns 400 when user_id or item_id is invalid", async () => {
    // Arrange a non-numeric route id to simulate invalid user input.
    const req = {
      params: { id: "abc" },
      body: { item_id: 1 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.equip(req, res);

    // Assert that validation failure maps to HTTP 400.
    expect(res.status).toHaveBeenCalledWith(400);
    // Assert that the validation error body is returned.
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid required fields"
    });
    // Assert that invalid input prevents service-layer execution.
    expect(eggService.equip).not.toHaveBeenCalled();
  });

  // Confirm a successful equip service result is returned to the client.
  test("returns 200 when equip succeeds", async () => {
    // Arrange the updated egg returned by the service.
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: 10
    };

    // Make the mocked service resolve with the updated egg.
    eggService.equip.mockResolvedValue(egg);

    // Provide valid route and body parameters.
    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.equip(req, res);

    // Assert that the controller passes numeric ids to the service.
    expect(eggService.equip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 10
    });
    // Assert that a successful equip returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the updated egg is wrapped in the expected response shape.
    expect(res.json).toHaveBeenCalledWith({ egg });
  });

  // Confirm service-layer errors are converted into HTTP error responses.
  test("returns service error status when equip fails", async () => {
    // Arrange a service error that carries an HTTP status code.
    const error = new Error("Item not found in the user's inventory");
    error.statusCode = 404;

    // Make the mocked service reject with that error.
    eggService.equip.mockRejectedValue(error);

    // Provide otherwise valid input so validation does not stop the service call.
    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.equip(req, res);

    // Assert that the controller uses the service error status code.
    expect(res.status).toHaveBeenCalledWith(404);
    // Assert that the controller exposes the service error message.
    expect(res.json).toHaveBeenCalledWith({
      error: "Item not found in the user's inventory"
    });
  });
});

// Group tests for removing an equipped item from an egg.
describe("eggController.unequip", () => {
  // Reset mocks before every unequip test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm a successful unequip service result is returned to the client.
  test("returns 200 when unequip succeeds", async () => {
    // Arrange the updated egg returned by the service.
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: null
    };

    // Make the mocked service resolve with the updated egg.
    eggService.unequip.mockResolvedValue(egg);

    // Provide valid route and body parameters.
    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await eggController.unequip(req, res);

    // Assert that the controller passes numeric ids to the service.
    expect(eggService.unequip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 10
    });
    // Assert that successful unequip returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the updated egg is wrapped in the expected response shape.
    expect(res.json).toHaveBeenCalledWith({ egg });
  });
});
