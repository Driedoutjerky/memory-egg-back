// =============================================================================
// Model Tests
// -----------------------------------------------------------------------------
// Tests eggModel with an in-memory SQLite database.
// These tests check real SQL behavior without touching the project database file.
// =============================================================================

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const eggModel = require("../../models/eggModel");

describe("eggModel", () => {
  let db;

  beforeEach(async () => {
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    await eggModel.initDb(db);
  });

  afterEach(async () => {
    await db.close();
  });

  test("finds a seeded egg by user id", async () => {
    const egg = await eggModel.findById(1);

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

  test("creates an egg with YYYY-MM-DD updated_at", async () => {
    const egg = await eggModel.create(999);

    expect(egg).toEqual(
      expect.objectContaining({
        user_id: 999,
        active_background_id: null,
        active_music_id: null,
        active_cosmetic_id: null
      })
    );
    expect(egg.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("updates active item fields", async () => {
    const egg = await eggModel.create(1000);

    egg.active_background_id = 101;

    const updated = await eggModel.update(egg);
    const saved = await eggModel.findById(1000);

    expect(updated).toBe(true);
    expect(saved.active_background_id).toBe(101);
    expect(saved.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
