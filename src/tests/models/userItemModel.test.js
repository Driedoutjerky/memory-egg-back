// Tests real SQL behavior using an in-memory SQLite database.

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const userItemModel = require("../../models/userItemModel");

describe("userItemModel", () => {
  let db;

  beforeEach(async () => {
    // Use a fresh in-memory database so tests never touch the real SQLite file.
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    // Parent rows satisfy user_items foreign keys.
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
    // Close the per-test database connection to avoid leaking handles.
    await db.close();
  });

  test("creates a user inventory item", async () => {
    // Act
    const created = await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);

    // Assert
    expect(created).toBe(true);
    expect(item).toEqual(
      expect.objectContaining({
        user_id: 1,
        item_id: 101,
        quantity: 1,
        is_equipped: 0,
        purchased_at: "2026-05-28"
      })
    );
  });

  test("increases quantity when the user already owns the item", async () => {
    // Arrange
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    // Act
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);

    // Assert
    expect(item.quantity).toBe(2);
  });

  test("updates is_equipped value", async () => {
    // Arrange
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });
    const item = await userItemModel.findByIds(1, 101);
    item.is_equipped = 1;

    // Act
    const updated = await userItemModel.update(item);
    const saved = await userItemModel.findByIds(1, 101);

    // Assert
    expect(updated).toBe(true);
    expect(saved.is_equipped).toBe(1);
  });
});
