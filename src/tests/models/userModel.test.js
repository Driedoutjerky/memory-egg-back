// =============================================================================
// User Model Integration Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that userModel reads seeded users, stores dates consistently, updates
//   allowed fields, and rejects unsafe field names.
//
// Scope:
//   Uses an in-memory SQLite database for each test.
//   Does not read from or write to the project database.sqlite file.
// =============================================================================

// Import the sqlite3 driver used by the sqlite wrapper.
const sqlite3 = require("sqlite3");
// Import open to create a promise-based SQLite connection.
const { open } = require("sqlite");

// Load the model under test.
const userModel = require("../../models/userModel");

// Group all user model persistence tests.
describe("userModel", () => {
  // Hold the per-test in-memory database connection.
  let db;

  // Create a fresh database before each test so state is isolated.
  beforeEach(async () => {
    // Open an in-memory SQLite database.
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    // Initialize the user schema and seed data through the model.
    await userModel.initDb(db);
  });

  // Close the database connection after each test.
  afterEach(async () => {
    await db.close();
  });

  // Confirm the model can read a seeded user by id.
  test("finds a seeded user by id", async () => {
    // Act by reading the seeded user.
    const user = await userModel.findById(1);

    // Assert that the returned user has the expected id and typed fields.
    expect(user).toEqual(
      expect.objectContaining({
        user_id: 1,
        email: expect.any(String),
        nickname: expect.any(String),
        will_balance: expect.any(Number)
      })
    );
  });

  // Confirm seeded user dates use the expected YYYY-MM-DD format.
  test("stores created_at as YYYY-MM-DD", async () => {
    // Act by reading the seeded user.
    const user = await userModel.findById(1);

    // Assert that created_at is a date-only string.
    expect(user.created_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // Confirm updates to whitelisted user fields are saved.
  test("updates an allowed user field", async () => {
    // Act by updating will_balance and then reading the user back.
    const updated = await userModel.update(1, "will_balance", 80);
    const user = await userModel.findById(1);

    // Assert that the update reports success.
    expect(updated).toBe(true);
    // Assert that the new will balance was persisted.
    expect(user.will_balance).toBe(80);
  });

  // Confirm unsafe or unsupported field names are rejected.
  test("throws an error when updating a disallowed field", async () => {
    // Assert that a non-whitelisted field name throws the model validation error.
    await expect(
      userModel.update(1, "not_allowed_field", "value")
    ).rejects.toThrow("Invalid user field");
  });
});
