// CONTROLLER layer: register and login only.
// Signs JWTs with sub=userId so the auth middleware can reconstruct req.user from the token alone (stateless - no session store needed).

import jwt from "jsonwebtoken";
import * as User from "../models/User.js";

// Cookie config
const COOKIE_NAME = "bt_token";
const COOKIE_OPTIONS = {
  httpOnly: true, // JS cannot read it
  secure:   process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     "/",
};

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
  // Cookie carries the token; body carries only the safe user object
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS).status(status).json({ ok: true, user });
}

function validatePasswordStrength(password) {
  if (password.length < 8)
    return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/\d/.test(password))
    return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character (!@#$…)";
  return null;
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

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        ok: false,
        error: passwordError
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

// POST /api/auth/logout
export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path:     "/",
  }).json({ 
    ok:true, 
    message:"Logged out" 
  });
}
