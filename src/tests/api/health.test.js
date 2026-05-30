// Smoke test for the public health endpoint.

const request = require("supertest");
const app = require("../../app");

describe("GET /api/health", () => {
  test("returns 200 with ok status", async () => {
    // This is enough to verify the app can serve a simple route.
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "ok"
      })
    );
  });
});
