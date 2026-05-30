// Supertest API test for route-to-controller behavior through the Express app.
// Supertest calls the app directly, so this test does not start the real server.

const request = require("supertest");

// Mock dependencies to keep API boundary tests independent from data and service logic.
jest.mock("../../models/shopItemModel");
jest.mock("../../services/shopService");

const app = require("../../app");
const shopItemModel = require("../../models/shopItemModel");
const shopService = require("../../services/shopService");

// Factory keeps API tests independent from real seed item data.
function makeItem(overrides = {}) {
  return {
    item_id: 101,
    name: "Shop Item",
    item_type: "background",
    description: "Test item",
    price: 50,
    is_active: 1,
    ...overrides
  };
}

// Factory represents the service response shape without depending on real prices or names.
function makePurchaseResult(overrides = {}) {
  return {
    user_id: 1,
    item_id: 101,
    item_name: "Shop Item",
    price: 50,
    ...overrides
  };
}

describe("GET /api/shop/items", () => {
  beforeEach(() => {
    // Reset mocks so each request verifies only its own behavior.
    jest.clearAllMocks();
  });

  test("returns 200 with filtered shop items", async () => {
    // Arrange
    const items = [makeItem({ item_type: "music" })];
    shopItemModel.getAll.mockResolvedValue(items);

    // Act
    const response = await request(app)
      .get("/api/shop/items")
      .query({ item_type: "music", only_active: "1" });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(items);
    expect(shopItemModel.getAll).toHaveBeenCalledWith("1", "music");
  });
});

describe("POST /api/shop/:id/purchase", () => {
  beforeEach(() => {
    // Reset mocks so each request verifies only its own behavior.
    jest.clearAllMocks();
  });

  test("returns 400 when item_id is missing", async () => {
    const response = await request(app)
      .post("/api/shop/1/purchase")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Missing or invalid request body"
      })
    );
    expect(shopService.purchaseItem).not.toHaveBeenCalled();
  });

  test("returns 201 when purchase succeeds", async () => {
    // Arrange
    const purchaseResult = makePurchaseResult();
    shopService.purchaseItem.mockResolvedValue(purchaseResult);

    // Act
    const response = await request(app)
      .post("/api/shop/1/purchase")
      .send({ item_id: "101" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining(purchaseResult));
    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
  });

  test("returns service error status when purchase fails", async () => {
    // Arrange
    const error = new Error("Purchase failed");
    error.statusCode = 409;
    shopService.purchaseItem.mockRejectedValue(error);

    // Act
    const response = await request(app)
      .post("/api/shop/1/purchase")
      .send({ item_id: 101 });

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Purchase failed"
      })
    );
  });
});
