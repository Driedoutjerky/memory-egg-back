// =============================================================================
// Controller Unit Tests
// -----------------------------------------------------------------------------
// Tests request validation and response handling in eggController.
// Service/model functions are mocked, so these tests do not use the real database.
// =============================================================================

jest.mock("../../models/eggModel");
jest.mock("../../services/eggService");

const eggController = require("../../controllers/eggController");
const eggModel = require("../../models/eggModel");
const eggService = require("../../services/eggService");

function mockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn()
  };
}

describe("eggController.findById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 200 with egg data when egg exists", async () => {
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: null
    };

    eggModel.findById.mockResolvedValue(egg);

    const req = { params: { id: "1" } };
    const res = mockResponse();

    await eggController.findById(req, res);

    expect(eggModel.findById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(egg);
  });

  test("returns 404 when egg does not exist", async () => {
    eggModel.findById.mockResolvedValue(undefined);

    const req = { params: { id: "999" } };
    const res = mockResponse();

    await eggController.findById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Egg of this user is not found"
    });
  });
});

describe("eggController.equip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when user_id or item_id is invalid", async () => {
    const req = {
      params: { id: "abc" },
      body: { item_id: 1 }
    };
    const res = mockResponse();

    await eggController.equip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing or invalid required fields"
    });
    expect(eggService.equip).not.toHaveBeenCalled();
  });

  test("returns 200 when equip succeeds", async () => {
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: 10
    };

    eggService.equip.mockResolvedValue(egg);

    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    const res = mockResponse();

    await eggController.equip(req, res);

    expect(eggService.equip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 10
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ egg });
  });

  test("returns service error status when equip fails", async () => {
    const error = new Error("Item not found in the user's inventory");
    error.statusCode = 404;

    eggService.equip.mockRejectedValue(error);

    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    const res = mockResponse();

    await eggController.equip(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Item not found in the user's inventory"
    });
  });
});

describe("eggController.unequip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 200 when unequip succeeds", async () => {
    const egg = {
      egg_id: 1,
      user_id: 1,
      active_background_id: null
    };

    eggService.unequip.mockResolvedValue(egg);

    const req = {
      params: { id: "1" },
      body: { item_id: 10 }
    };
    const res = mockResponse();

    await eggController.unequip(req, res);

    expect(eggService.unequip).toHaveBeenCalledWith({
      user_id: 1,
      item_id: 10
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ egg });
  });
});
