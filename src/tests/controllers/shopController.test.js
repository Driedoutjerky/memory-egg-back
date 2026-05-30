// Controller tests: keep only filter defaults, validation, and purchase delegation.

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

describe("shopController.getAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses default filters when query is empty", async () => {
    // This protects the controller's default query behavior.
    const items = [
      {
        item_id: 101,
        name: "Test Shop Item",
        item_type: "background",
        price: 50,
        is_active: 1
      }
    ];
    shopItemModel.getAll.mockResolvedValue(items);
    const req = { query: {} };
    const res = mockResponse();

    await shopController.getAll(req, res);

    expect(shopItemModel.getAll).toHaveBeenCalledWith(1, "all");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(items);
  });
});

describe("shopController.purchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when item_id is missing", async () => {
    // Keep one request-body validation test at the controller layer.
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
    // Happy path confirms ids are normalized before calling the service.
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

    await shopController.purchase(req, res);

    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(purchaseResult);
  });
});
