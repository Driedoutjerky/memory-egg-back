// Tests request validation, response handling, and service/model calls using mocks.

// Mock dependencies to keep controller tests isolated from data and purchase logic.
jest.mock("../../models/shopItemModel");
jest.mock("../../services/shopService");

const shopController = require("../../controllers/shopController");
const shopItemModel = require("../../models/shopItemModel");
const shopService = require("../../services/shopService");

// Minimal Express response double used to verify controller output.
function mockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

// Factory creates shop item data without relying on real seed records.
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

describe("shopController.getAll", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("uses default filters when query is empty", async () => {
    // Arrange
    const items = [makeItem()];
    shopItemModel.getAll.mockResolvedValue(items);
    const req = { query: {} };
    const res = mockResponse();

    // Act
    await shopController.getAll(req, res);

    // Assert
    expect(shopItemModel.getAll).toHaveBeenCalledWith(1, "all");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });

  test("passes query filters to the model", async () => {
    // Arrange
    const items = [makeItem({ item_type: "music" })];
    shopItemModel.getAll.mockResolvedValue(items);
    const req = {
      query: {
        item_type: "music",
        only_active: "1"
      }
    };
    const res = mockResponse();

    // Act
    await shopController.getAll(req, res);

    // Assert
    expect(shopItemModel.getAll).toHaveBeenCalledWith("1", "music");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });
});

describe("shopController.purchase", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("returns 400 when user_id is missing", async () => {
    // Arrange
    const req = {
      params: {},
      body: { item_id: 101 }
    };
    const res = mockResponse();

    // Act
    await shopController.purchase(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid user id"
    });
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  test("returns 400 when item_id is missing", async () => {
    // Arrange
    const req = {
      params: { id: "1" },
      body: {}
    };
    const res = mockResponse();

    // Act
    await shopController.purchase(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid request body"
    });
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  test("returns 201 when purchase succeeds", async () => {
    // Arrange
    const purchaseResult = {
      user_id: 1,
      item_id: 101,
      item_name: "Test Shop Item",
      price: 50
    };
    shopService.purchaseItem.mockResolvedValue(purchaseResult);
    const req = {
      params: { id: "1" },
      body: { item_id: "101" }
    };
    const res = mockResponse();

    // Act
    await shopController.purchase(req, res);

    // Assert
    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(purchaseResult);
  });

  test("returns service error status when purchase fails", async () => {
    // Arrange
    const error = new Error("Insufficient will balance");
    error.statusCode = 409;
    shopService.purchaseItem.mockRejectedValue(error);
    const req = {
      params: { id: "1" },
      body: { item_id: 101 }
    };
    const res = mockResponse();

    // Act
    await shopController.purchase(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Insufficient will balance"
    });
  });
});
