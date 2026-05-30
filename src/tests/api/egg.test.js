// API boundary tests: verify Express routes parse requests and map service results to HTTP responses.

const request = require("supertest");

jest.mock("../../services/eggService");

const app = require("../../app");
const eggService = require("../../services/eggService");

describe("PATCH /api/egg/:id/equip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when item_id is invalid", async () => {
    // Keep one validation test at the API layer so malformed request handling is covered.
    const response = await request(app)
      .patch("/api/egg/1/equip")
      .send({ item_id: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Missing or invalid required fields"
      })
    );
    expect(eggService.equip).not.toHaveBeenCalled();
  });

  test("returns 200 when equip succeeds", async () => {
    // This proves the route reaches the service and serializes the controller response.
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: 101
    };
    eggService.equip.mockResolvedValue(egg);

    const response = await request(app)
      .patch("/api/egg/1/equip")
      .send({ item_id: 101 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ egg });
    expect(eggService.equip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
  });
});
