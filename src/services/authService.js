const userModel = require("../models/userModel");
const eggModel = require("../models/eggModel");
const shopItemModel = require("../models/shopItemModel");
const { getDb } = require("../db");

const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const saltRounds = 10;

// provide atomic transaction about user registeration
async function registerUser({ email, password, nickname }) {
    const db = getDb();
    const existingUser = await userModel.findByEmail(email);

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const password_hash = await bcrypt.hash(password, saltRounds);
    let isTransactionStarted = false;

    try {
        await db.run("BEGIN TRANSACTION");
        isTransactionStarted = true;
        const user = await userModel.create({
            email,
            password_hash,
            nickname,
            will_balance: 0
        });

        if (!user) {
            const error = new Error("Database Error : it failed to create User Entity");
            error.statusCode = 500;
            throw error;
        }

        const egg = await eggModel.create(user.user_id);

        // finish adding new information in database
        await db.run("COMMIT");
        isTransactionStarted = false;

        // generate token
        const token = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return { token, user, egg };
    } catch (error) {
        if (isTransactionStarted) {
            await db.run("ROLLBACK");
            isTransactionStarted = false;
        }
        error.statusCode = 500;
        throw error;
    }
}

async function loginUser({ email, password }) {
    const user = await userModel.findByEmail(email);
    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign(
        { user_id: user.user_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return {
        "token": token,
        "user": {
            user_id: user.user_id,
            email: user.email,
            nickname: user.nickname,
            will_balance: user.will_balance,
            created_at: user.created_at
        }
    };
}

async function getCurrentUser(user_id) {
    const user = await userModel.findById(user_id);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const egg = await eggModel.findById(user_id);

    if (!egg) {
        const error = new Error("Egg not found");
        error.statusCode = 404;
        throw error;
    }
    const background = egg.active_background_id;
    const music = egg.active_music_id;
    const cosmetic = egg.active_cosmetic_id;

    return {
        "user": {
            user_id: user.user_id,
            email: user.email,
            nickname: user.nickname,
            will_balance: user.will_balance,
            created_at: user.created_at
        },
        "egg" : egg,
        "active_background" : await shopItemModel.findById(background),
        "active_music": await shopItemModel.findById(music),
        "active_cosmetic": await shopItemModel.findById(cosmetic)

    };
}

module.exports = { registerUser, loginUser, getCurrentUser };