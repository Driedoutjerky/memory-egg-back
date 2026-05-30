// Model tests use real SQL against an in-memory SQLite database.

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

  test("creates and finds an egg by user id", async () => {
    // This covers the model's essential insert/read path and default active item values.
    const created = await eggModel.create(999);
    const found = await eggModel.findById(999);

    expect(created).toEqual(
      expect.objectContaining({
        user_id: 999,
        active_background_id: null,
        active_music_id: null,
        active_cosmetic_id: null
      })
    );
    expect(found).toEqual(expect.objectContaining({ user_id: 999 }));
    expect(found.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("updates active item fields", async () => {
    // Equipment services depend on these active item columns being persisted.
    const egg = await eggModel.create(1000);
    egg.active_background_id = 101;

    const updated = await eggModel.update(egg);
    const saved = await eggModel.findById(1000);

    expect(updated).toBe(true);
    expect(saved.active_background_id).toBe(101);
  });
});
