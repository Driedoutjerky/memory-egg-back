// API boundary tests: keep only representative route behavior.

const request = require("supertest");

jest.mock("../../models/shopItemModel");
jest.mock("../../services/shopService");

const app = require("../../app");
const shopItemModel = require("../../models/shopItemModel");
const shopService = require("../../services/shopService");

describe("GET /api/shop/items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 200 with filtered shop items", async () => {
    // Covers query parsing and response serialization for the list route.
    const items = [
      {
        item_id: 101,
        name: "Shop Item",
        item_type: "music",
        price: 50,
        is_active: 1
      }
    ];
    shopItemModel.getAll.mockResolvedValue(items);

    const response = await request(app)
      .get("/api/shop/items")
      .query({ item_type: "music", only_active: "1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(items);
    expect(shopItemModel.getAll).toHaveBeenCalledWith("1", "music");
  });
});

describe("POST /api/shop/:id/purchase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 201 when purchase succeeds", async () => {
    // Service edge cases are tested in shopService; API only needs the happy path.
    const purchaseResult = {
      user_id: 1,
      item_id: 101,
      item_name: "Shop Item",
      price: 50
    };
    shopService.purchaseItem.mockResolvedValue(purchaseResult);

    const response = await request(app)
      .post("/api/shop/1/purchase")
      .send({ item_id: "101" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(purchaseResult);
    expect(shopService.purchaseItem).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
  });
});
