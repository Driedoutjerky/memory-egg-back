// Middleware tests: validate the only security-critical branches.

jest.mock("jsonwebtoken");

const jwt = require("jsonwebtoken");
const { authenticate } = require("../../middleware/authMiddleware");

function makeResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe("authMiddleware.authenticate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  test("attaches user_id to req.user and continues when token is valid", () => {
    // Happy path proves the middleware verifies the bearer token and calls next.
    const req = {
      headers: {
        authorization: "Bearer valid-token"
      }
    };
    const res = makeResponse();
    const next = jest.fn();

    jwt.verify.mockReturnValue({
      user_id: 4
    });

    authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "valid-token",
      "test-jwt-secret"
    );
    expect(req.user).toEqual({
      user_id: 4
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 401 when the Authorization header is missing", () => {
    // Missing credentials are the main unauthenticated branch.
    const req = {
      headers: {}
    };
    const res = makeResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing token"
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the token is invalid or expired", () => {
    // One jwt.verify failure test is enough for malformed, invalid, and expired tokens.
    const req = {
      headers: {
        authorization: "Bearer expired-token"
      }
    };
    const res = makeResponse();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired token"
    });
    expect(next).not.toHaveBeenCalled();
  });
});
