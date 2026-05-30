// Tests the main authentication business rules.
// Database details and real JWT/bcrypt behavior are tested separately or mocked here.

jest.mock("../../models/userModel");
jest.mock("../../models/eggModel");
jest.mock("../../db", () => ({
  getDb: jest.fn()
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const authService = require("../../services/authService");
const userModel = require("../../models/userModel");
const eggModel = require("../../models/eggModel");
const { getDb } = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function makeUser() {
  return {
    user_id: 4,
    email: "newuser@example.com",
    password_hash: "hashed-password",
    nickname: "NewUser",
    will_balance: 0,
    created_at: "2026-05-30"
  };
}

describe("authService", () => {
  let db;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_EXPIRES_IN = "1h";

    db = {
      run: jest.fn().mockResolvedValue({})
    };

    getDb.mockReturnValue(db);
    bcrypt.hash.mockResolvedValue("hashed-password");
    jwt.sign.mockReturnValue("signed-jwt-token");
  });

  test("registers a user, creates a starter egg, and issues a JWT", async () => {
    // This test checks the normal registration flow:
    // user and egg are created in one transaction, then a token is returned.
    const user = makeUser();
    const egg = {
      egg_id: 4,
      user_id: user.user_id
    };

    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(user);
    eggModel.create.mockResolvedValue(egg);

    const result = await authService.registerUser({
      email: user.email,
      password: "password123",
      nickname: user.nickname
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(db.run).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION");
    expect(userModel.create).toHaveBeenCalled();
    expect(eggModel.create).toHaveBeenCalledWith(user.user_id);
    expect(db.run).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(result).toEqual({
      token: "signed-jwt-token",
      user,
      egg
    });
  });

  test("rejects registration when the email already exists", async () => {
    // This test checks that duplicated emails are rejected
    // before creating a new user or egg.
    userModel.findByEmail.mockResolvedValue(makeUser());

    await expect(
      authService.registerUser({
        email: "newuser@example.com",
        password: "password123",
        nickname: "NewUser"
      })
    ).rejects.toMatchObject({
      message: "Email already registered",
      statusCode: 409
    });

    expect(userModel.create).not.toHaveBeenCalled();
    expect(eggModel.create).not.toHaveBeenCalled();
    expect(db.run).not.toHaveBeenCalled();
  });

  test("rolls back registration when starter egg creation fails", async () => {
    // This test checks the atomic transaction rule:
    // a user must not remain registered without a starter egg.
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(makeUser());
    eggModel.create.mockRejectedValue(new Error("Egg insert failed"));

    await expect(
      authService.registerUser({
        email: "newuser@example.com",
        password: "password123",
        nickname: "NewUser"
      })
    ).rejects.toMatchObject({
      statusCode: 500
    });

    expect(db.run).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION");
    expect(db.run).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test("logs in a valid user and issues a JWT", async () => {
    // This test checks the normal login flow:
    // the submitted password is compared and a token is issued after success.
    const user = makeUser();

    userModel.findByEmail.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.loginUser({
      email: user.email,
      password: "password123"
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      user.password_hash
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { user_id: user.user_id },
      "test-jwt-secret",
      { expiresIn: "1h" }
    );
    expect(result.token).toBe("signed-jwt-token");
    expect(result.user.password_hash).toBeUndefined();
  });

  test("rejects login with an invalid password without issuing a JWT", async () => {
    // This test checks that authentication failure does not produce a token.
    const user = makeUser();

    userModel.findByEmail.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.loginUser({
        email: user.email,
        password: "wrong-password"
      })
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      statusCode: 401
    });

    expect(jwt.sign).not.toHaveBeenCalled();
  });
});