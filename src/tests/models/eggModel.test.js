// =============================================================================
// Egg Model Integration Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that eggModel creates, reads, and updates egg records correctly through
//   real SQLite queries.
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
const eggModel = require("../../models/eggModel");

// Group all egg model persistence tests.
describe("eggModel", () => {
  // Hold the per-test in-memory database connection.
  let db;

  // Create a fresh database before each test so records do not leak between tests.
  beforeEach(async () => {
    // Open an in-memory SQLite database.
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    // Initialize the egg schema and seed data through the model.
    await eggModel.initDb(db);
  });

  // Close the database connection after each test.
  afterEach(async () => {
    await db.close();
  });

  // Confirm the model can read a seeded egg by user id.
  test("finds a seeded egg by user id", async () => {
    // Act by reading the seeded egg for user 1.
    const egg = await eggModel.findById(1);

    // Assert that the returned record contains the expected user and numeric stats.
    expect(egg).toEqual(
      expect.objectContaining({
        user_id: 1,
        stage: expect.any(Number),
        glow: expect.any(Number),
        warmth: expect.any(Number),
        weight: expect.any(Number)
      })
    );
  });

  // Confirm create inserts a new egg and formats updated_at as a date string.
  test("creates an egg with YYYY-MM-DD updated_at", async () => {
    // Act by creating an egg for a new user id.
    const egg = await eggModel.create(999);

    // Assert that the created record belongs to the requested user and starts unequipped.
    expect(egg).toEqual(
      expect.objectContaining({
        user_id: 999,
        active_background_id: null,
        active_music_id: null,
        active_cosmetic_id: null
      })
    );
    // Assert that updated_at is stored as a YYYY-MM-DD date.
    expect(egg.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // Confirm update persists changed active item fields.
  test("updates active item fields", async () => {
    // Arrange a new egg to update.
    const egg = await eggModel.create(1000);

    // Mutate the active background field before saving.
    egg.active_background_id = 101;

    // Act by saving the changed egg and reading it back from the database.
    const updated = await eggModel.update(egg);
    const saved = await eggModel.findById(1000);

    // Assert that the update call reports success.
    expect(updated).toBe(true);
    // Assert that the changed active background id was persisted.
    expect(saved.active_background_id).toBe(101);
    // Assert that updated_at remains in the expected date format.
    expect(saved.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
