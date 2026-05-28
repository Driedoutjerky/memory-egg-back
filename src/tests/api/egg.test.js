// Supertest API test for route-to-controller behavior through the Express app.
// Supertest calls the app directly, so this test does not start the real server.

const request = require("supertest");

// Mock the service so API boundary tests stay independent from business logic.
jest.mock("../../services/eggService");

const app = require("../../app");
const eggService = require("../../services/eggService");

// Factory keeps API tests independent from real egg records.
function makeEgg(overrides = {}) {
  return {
    egg_id: 1,
    user_id: 1,
    active_background_id: null,
    active_music_id: null,
    active_cosmetic_id: null,
    ...overrides
  };
}

describe("PATCH /api/egg/:id/equip", () => {
  beforeEach(() => {
    // Reset mocks so each request verifies only its own behavior.
    jest.clearAllMocks();
  });

  test("returns 400 when item_id is invalid", async () => {
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
    // Arrange
    const egg = makeEgg({ active_background_id: 101 });
    eggService.equip.mockResolvedValue(egg);

    // Act
    const response = await request(app)
      .patch("/api/egg/1/equip")
      .send({ item_id: 101 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        egg: expect.objectContaining(egg)
      })
    );
    expect(eggService.equip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
  });

  test("returns service error status when equip fails", async () => {
    // Arrange
    const error = new Error("Equip failed");
    error.statusCode = 404;
    eggService.equip.mockRejectedValue(error);

    // Act
    const response = await request(app)
      .patch("/api/egg/1/equip")
      .send({ item_id: 101 });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Equip failed"
      })
    );
  });
});

describe("PATCH /api/egg/:id/unequip", () => {
  beforeEach(() => {
    // Reset mocks so each request verifies only its own behavior.
    jest.clearAllMocks();
  });

  test("returns 400 when item_id is invalid", async () => {
    const response = await request(app)
      .patch("/api/egg/1/unequip")
      .send({ item_id: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Missing or invalid required fields"
      })
    );
    expect(eggService.unequip).not.toHaveBeenCalled();
  });

  test("returns 200 when unequip succeeds", async () => {
    // Arrange
    const egg = makeEgg({ active_background_id: null });
    eggService.unequip.mockResolvedValue(egg);

    // Act
    const response = await request(app)
      .patch("/api/egg/1/unequip")
      .send({ item_id: 101 });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        egg: expect.objectContaining(egg)
      })
    );
    expect(eggService.unequip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 101
    });
  });

  test("returns service error status when unequip fails", async () => {
    // Arrange
    const error = new Error("Unequip failed");
    error.statusCode = 400;
    eggService.unequip.mockRejectedValue(error);

    // Act
    const response = await request(app)
      .patch("/api/egg/1/unequip")
      .send({ item_id: 101 });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Unequip failed"
      })
    );
  });
});
