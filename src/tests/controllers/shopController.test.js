// =============================================================================
// Controller Unit Tests
// -----------------------------------------------------------------------------
// Tests request parsing and response handling in shopController.
// Model/service functions are mocked, so these tests do not use the real database.
// =============================================================================

jest.mock("../../models/shopItemModel");
jest.mock("../../services/shopService");

const shopController = require("../../controllers/shopController");
const shopItemModel = require("../../models/shopItemModel");
const shopService = require("../../services/shopService");

function mockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

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
    jest.clearAllMocks();
  });

  test("uses default filters when query is empty", async () => {
    const items = [makeItem()];

    shopItemModel.getAll.mockResolvedValue(items);

    const req = { query: {} };
    const res = mockResponse();

    await shopController.getAll(req, res);

    expect(shopItemModel.getAll).toHaveBeenCalledWith(1, "all");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });

  test("passes query filters to the model", async () => {
    const items = [makeItem({ item_type: "music" })];

    shopItemModel.getAll.mockResolvedValue(items);

    const req = {
      query: {
        item_type: "music",
        only_active: "1"
      }
    };
    const res = mockResponse();

    await shopController.getAll(req, res);

    expect(shopItemModel.getAll).toHaveBeenCalledWith("1", "music");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });
});

describe("shopController.purchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when user_id is missing", async () => {
    const req = {
      params: {},
      body: { item_id: 101 }
    };
    const res = mockResponse();

    await shopController.purchase(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid user id"
    });
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  test("returns 400 when item_id is missing", async () => {
    const req = {
      params: { id: "1" },
      body: {}
    };
    const res = mockResponse();

    await shopController.purchase(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid request body"
    });
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  test("returns 201 when purchase succeeds", async () => {
    const purchaseResult = {
      user_id: "1",
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

    await shopController.purchase(req, res);

    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: "1",
      item_id: 101
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(purchaseResult);
  });

  test("returns service error status when purchase fails", async () => {
    const error = new Error("Insufficient will balance");
    error.statusCode = 409;

    shopService.purchaseItem.mockRejectedValue(error);

    const req = {
      params: { id: "1" },
      body: { item_id: 101 }
    };
    const res = mockResponse();

    await shopController.purchase(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Insufficient will balance"
    });
  });
});
