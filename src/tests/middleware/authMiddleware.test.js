// Tests JWT authentication middleware behavior while mocking token verification.

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
    // Arrange
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

    // Act
    authenticate(req, res, next);

    // Assert
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
    // Arrange
    const req = {
      headers: {}
    };
    const res = makeResponse();
    const next = jest.fn();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing token"
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the Authorization header is malformed", () => {
    // Arrange
    const req = {
      headers: {
        authorization: "invalid-token"
      }
    };
    const res = makeResponse();
    const next = jest.fn();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when the token is invalid or expired", () => {
    // Arrange
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

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired token"
    });
    expect(next).not.toHaveBeenCalled();
  });
});

test("returns 401 when the verified token has no valid user_id", () => {
  const req = {
    headers: {
      authorization: "Bearer token-without-user-id"
    }
  };
  const res = makeResponse();
  const next = jest.fn();

  jwt.verify.mockReturnValue({});

  authenticate(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({
    error: "Invalid token payload"
  });
  expect(next).not.toHaveBeenCalled();
});