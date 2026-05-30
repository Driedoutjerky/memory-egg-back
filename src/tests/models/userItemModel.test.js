// Model tests use real SQL against an in-memory SQLite database.

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const userItemModel = require("../../models/userItemModel");

describe("userItemModel", () => {
  let db;

  beforeEach(async () => {
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY
      );

      CREATE TABLE shop_items (
        item_id INTEGER PRIMARY KEY
      );
    `);

    await userItemModel.initDb(db);
    await db.run("INSERT INTO users (user_id) VALUES (?)", [1]);
    await db.run("INSERT INTO shop_items (item_id) VALUES (?)", [101]);
  });

  afterEach(async () => {
    await db.close();
  });

  test("creates a user inventory item", async () => {
    // Essential insert/read behavior for purchased inventory.
    const created = await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);

    expect(created).toBe(true);
    expect(item).toEqual(
      expect.objectContaining({
        user_id: 1,
        item_id: 101,
        quantity: 1,
        is_equipped: 0
      })
    );
  });

  test("increases quantity when the user already owns the item", async () => {
    // This protects duplicate purchase behavior used by shopService.
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);

    expect(item.quantity).toBe(2);
  });

  test("updates is_equipped value", async () => {
    // Equipment services rely on persisting the inventory equipped flag.
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);
    item.is_equipped = 1;

    const updated = await userItemModel.update(item);
    const saved = await userItemModel.findByIds(1, 101);

    expect(updated).toBe(true);
    expect(saved.is_equipped).toBe(1);
  });
});
