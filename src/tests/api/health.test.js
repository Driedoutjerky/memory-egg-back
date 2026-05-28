// Supertest API test for route-to-controller behavior through the Express app.
// Supertest calls the app directly, so this test does not start the real server.

const request = require("supertest");
const app = require("../../app");

describe("GET /api/health", () => {
  test("returns 200 with ok status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "ok"
      })
    );
  });
});
