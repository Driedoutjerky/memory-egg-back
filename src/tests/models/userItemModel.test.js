// =============================================================================
// User Item Model Integration Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that userItemModel persists inventory records, merges duplicate
//   purchases by increasing quantity, and updates equipment state.
//
// Scope:
//   Uses an in-memory SQLite database with minimal users and shop_items tables.
//   Does not read from or write to the project database.sqlite file.
// =============================================================================

// Import the sqlite3 driver used by the sqlite wrapper.
const sqlite3 = require("sqlite3");
// Import open to create a promise-based SQLite connection.
const { open } = require("sqlite");

// Load the model under test.
const userItemModel = require("../../models/userItemModel");

// Group all user inventory persistence tests.
describe("userItemModel", () => {
  // Hold the per-test in-memory database connection.
  let db;

  // Create a fresh database and required parent rows before each test.
  beforeEach(async () => {
    // Open an in-memory SQLite database.
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database
    });

    // Create minimal parent tables needed by user_items foreign keys.
    await db.exec(`
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY
      );

      CREATE TABLE shop_items (
        item_id INTEGER PRIMARY KEY
      );
    `);

    // Initialize the user_items table through the model.
    await userItemModel.initDb(db);

    // Seed one user that can own inventory items.
    await db.run("INSERT INTO users (user_id) VALUES (?)", [1]);
    // Seed one shop item that can be added to inventory.
    await db.run("INSERT INTO shop_items (item_id) VALUES (?)", [101]);
  });

  // Close the database connection after each test.
  afterEach(async () => {
    await db.close();
  });

  // Confirm a new inventory row can be created and fetched.
  test("creates a user inventory item", async () => {
    // Act by creating an inventory record for the seeded user and item.
    const created = await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    // Read the row back to verify the database state, not just the return value.
    const item = await userItemModel.findByIds(1, 101);

    // Assert that create reports success.
    expect(created).toBe(true);
    // Assert that the persisted item contains the expected default and input fields.
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

  // Confirm buying the same item twice increments quantity instead of duplicating rows.
  test("increases quantity when the user already owns the item", async () => {
    // Create the first inventory record.
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    // Create the same user/item pair again to trigger duplicate-purchase behavior.
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    // Read the merged inventory row back from the database.
    const item = await userItemModel.findByIds(1, 101);

    // Assert that quantity increased to two.
    expect(item.quantity).toBe(2);
  });

  // Confirm equipment state updates are persisted.
  test("updates is_equipped value", async () => {
    // Arrange an inventory item that starts unequipped.
    await userItemModel.create({
      user_id: 1,
      item_id: 101,
      quantity: 1,
      purchased_at: "2026-05-28"
    });

    // Load the item and change its equipment flag.
    const item = await userItemModel.findByIds(1, 101);
    item.is_equipped = 1;

    // Act by saving the changed item and reading it back.
    const updated = await userItemModel.update(item);
    const saved = await userItemModel.findByIds(1, 101);

    // Assert that update reports success.
    expect(updated).toBe(true);
    // Assert that the equipment flag was persisted.
    expect(saved.is_equipped).toBe(1);
  });
});
