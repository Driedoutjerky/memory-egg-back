// Controller tests: verify validation and delegation without real service/model behavior.

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
    // One read test confirms params are converted and model output is returned.
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
});

describe("eggController.equip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when user_id is invalid", async () => {
    // Keep validation here because this is controller-owned behavior.
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
    // This verifies the controller delegates with numeric ids and wraps the egg response.
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
});
