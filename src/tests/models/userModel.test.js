// Model tests use real SQL against an in-memory SQLite database.

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const userModel = require("../../models/userModel");

describe("userModel", () => {
  let db;

  beforeEach(async () => {
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    await userModel.initDb(db);
  });

  afterEach(async () => {
    await db.close();
  });

  test("finds a seeded user by id", async () => {
    // Confirms initDb creates usable seed data for tests and local development.
    const user = await userModel.findById(1);

    expect(user).toEqual(
      expect.objectContaining({
        user_id: 1,
        email: expect.any(String),
        nickname: expect.any(String),
        will_balance: expect.any(Number)
      })
    );
    expect(user.created_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("updates an allowed user field", async () => {
    // Will balance updates are required by purchase logic.
    const updated = await userModel.update(1, "will_balance", 80);
    const user = await userModel.findById(1);

    expect(updated).toBe(true);
    expect(user.will_balance).toBe(80);
  });
});
