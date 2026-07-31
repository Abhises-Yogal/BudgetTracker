// Verifies the Bearer JWT on every protected route.
// On success: attaches { id, email } to req.user and calls next().
// On failure: returns 401 — never calls next(err) so the error handler can't accidentally leak stack traces on auth failures.

import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.bt_token;

  if (!token) {
    return res.status(401).json({ ok: false, error: "No token — please log in" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach minimal user info: controllers use req.user.id to scope queries
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired — please log in again"
        : "Invalid token — please log in";
    return res.status(401).json({ ok: false, error: message });
  }
}
