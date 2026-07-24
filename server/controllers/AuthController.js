// CONTROLLER layer: register and login only.
// Signs JWTs with sub=userId so the auth middleware can reconstruct req.user from the token alone (stateless - no session store needed).

import jwt from "jsonwebtoken";
import * as User from "../models/User.js";

// Helpers

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sendToken(res, status, user) {
  const token = signToken(user);
  res.status(status).json({ ok: true, token, user });
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Basic presence check before hitting the DB
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        ok: false,
        error: "name, email, and password are all required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 8 characters",
      });
    }

    const user = await User.createUser({ name, email, password });
    sendToken(res, 201, user);
  } catch (err) {
    // Duplicate email: MongoDB unique index violation
    if (err.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: "An account with that email already exists",
      });
    }
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ ok: false, errors });
    }
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        ok: false,
        error: "email and password are required",
      });
    }

    // findByEmail explicitly selects the password field (it's excluded by default)
    const user = await User.findByEmail(email);

    // Use the same generic message for "not found" and "wrong password" so we don't reveal whether the email exists in the DB.
    const INVALID = "Invalid email or password";

    if (!user) {
      return res.status(401).json({ ok: false, error: INVALID });
    }

    const valid = await User.verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ ok: false, error: INVALID });
    }

    sendToken(res, 200, user.toJSON());
  } catch (err) {
    next(err);
  }
}