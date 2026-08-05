# DimeTime

A full-stack personal finance app. Track income and expenses, filter by month, and visualise spending by category — all scoped per user with JWT authentication via secure httpOnly cookies.

---

## Live URLs

| Service | URL |
|---|---|
| Frontend (Netlify) | https://dimetime.netlify.app |
| Backend API (Render) | https://budgettracker-7whc.onrender.com |
| Health check | https://budgettracker-7whc.onrender.com/api/health |

The frontend reads the backend URL from a runtime config file (`public/runtime-config.json`), so it can be re-pointed without rebuilding.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, Axios |
| Backend | Node.js, Express 4, MongoDB, Mongoose 9 |
| Auth | JWT (httpOnly cookie), bcryptjs (12 salt rounds) |
| AI Insights | Groq (`llama-3.3-70b-versatile`) |
| Routing | React Router v7 |

---

## Project structure

```
dimetime/
├── server/                     Express API (MVC)
│   ├── config/
│   │   └── db.js               MongoDB connection
│   ├── controllers/
│   │   ├── AuthController.js   register / login / logout
│   │   └── TransactionController.js
│   ├── middleware/
│   │   ├── auth.js             JWT cookie verification → req.user
│   │   └── validate.js         Request body validation
│   ├── models/
│   │   ├── User.js             Schema + bcrypt hashing
│   │   └── Transaction.js      Schema + aggregation pipeline
│   ├── routes/
│   │   ├── auth.js             POST /api/auth/*
│   │   └── transactions.js     /api/transactions/* (all protected)
│   ├── index.js                App entry point
│   ├── .env.example
│   └── package.json
│
├── src/                        React frontend
│   ├── components/
│   │   ├── AddTransactionForm.jsx
│   │   ├── BalanceSummary.jsx
│   │   ├── MonthFilter.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SpendingChart.jsx
│   │   ├── TransactionItem.jsx
│   │   └── TransactionList.jsx
│   ├── context/
│   │   └── AuthContext.jsx     User state + login/logout helpers
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Register.jsx        Includes password strength meter
│   ├── services/
│   │   └── api.js              Axios instance (withCredentials, 401 interceptor)
│   ├── utils/
│   │   └── formatCurrency.js
│   ├── App.jsx                 Dashboard (protected)
│   └── main.jsx                Router + AuthProvider setup
│
├── .env.example
└── package.json
```

---

## Getting started

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 2. Clone and install

```bash
git clone https://github.com/Abhises-Yogal/BudgetTracker.git
cd BudgetTracker

# Root (React + Vite)
npm install

# Server
cd server && npm install && cd ..
```

### 3. Configure environment variables

**Root `.env`** (for Vite — not read by the app; the frontend loads its API URL at runtime from `public/runtime-config.json`):
```env
# No required vars for development
FRONTEND_URL=http://localhost:5173   # informational only — the server reads this from server/.env
```

**`server/.env`** — copy from `server/.env.example`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/budget-tracker
# Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/budget-tracker

JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173   # CORS allow-list (same as the Vite dev URL)
GROQ_API_KEY=                        # optional — enables AI Insights; leave blank to disable
```

Both files are git-ignored, so copy them from `.env.example` and fill in your own values.

> **Never commit `.env` files.** Both are in `.gitignore`.

### 4. Run in development

Open **two terminals**:

```bash
# Terminal 1 — Express API (port 3001)
npm run server:dev

# Terminal 2 — Vite dev server (port 5173)
npm run dev
```

Or run both at once:
```bash
npm run dev:all
```

Then open [http://localhost:5173](http://localhost:5173).

---

## API reference

All `/api/transactions` routes require a valid `bt_token` cookie (set on login).

### Auth

| Method | Route | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create account, set cookie |
| `POST` | `/api/auth/login` | `{ email, password }` | Verify credentials, set cookie |
| `POST` | `/api/auth/logout` | — | Clear cookie |

### Transactions

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/transactions` | List all (add `?month=2026-06` to filter) |
| `GET` | `/api/transactions/summary` | Totals + per-category breakdown |
| `POST` | `/api/transactions` | Create transaction |
| `DELETE` | `/api/transactions/:id` | Delete by id |

#### POST `/api/transactions` body

```json
{
  "type": "expense",
  "amount": 48.50,
  "category": "Food",
  "description": "Weekly groceries"
}
```

Valid `type` values: `income`, `expense`

Valid `category` values: `Salary`, `Freelance`, `Investment`, `Gift`, `Housing`, `Food`, `Transport`, `Entertainment`, `Health`, `Utilities`, `Other`

---

## Security

### JWT via httpOnly cookie

The JWT is **never exposed to JavaScript**. It lives exclusively in an `httpOnly` cookie set by the server on login/register:

```
Set-Cookie: bt_token=<jwt>; HttpOnly; SameSite=Lax; Path=/
```

- `httpOnly` — prevents XSS attacks from reading the token
- `secure` — HTTPS only in production
- `sameSite=lax` (dev) / `none` (prod cross-origin) — CSRF protection
- Cookie is cleared server-side on logout via `res.clearCookie()`

### Password requirements

Enforced on both client (with a strength meter) and server:

- Minimum 8 characters
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one number (0–9)
- At least one special character (`!@#$%^&*` etc.)

Passwords are hashed with bcrypt at **12 salt rounds** before storage. The raw hash is never returned in any API response (`select: false` on the schema field).

### Data scoping

Every transaction query is filtered by `userId` (from the verified JWT payload). A user cannot read, create, or delete another user's transactions — enforced at the model layer, not just the route layer.

### CORS

Only explicitly listed origins are allowed (`localhost:5173` + `FRONTEND_URL`). All other origins receive a CORS error. `credentials: true` is required for the browser to send the cookie cross-origin.

---

## MongoDB Atlas setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → Add database user (username + password)
3. **Network Access** → Add IP address (your IP, or `0.0.0.0/0` for dev)
4. **Connect** → Drivers → copy the connection string
5. Replace `<password>` with your database user's password
6. Set `MONGODB_URI` in `server/.env`

---

## Deployment

### Production environment variables

Regardless of host, configure these on the backend service (Render, Fly.io, Heroku, Railway, etc.):

| Variable | Required | Production value |
|---|---|---|
| `MONGODB_URI` | ✅ | Atlas connection string, e.g. `mongodb+srv://<user>:<pass>@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority` |
| `JWT_SECRET` | ✅ | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. Use a **different** secret from development |
| `NODE_ENV` | ✅ | `production` — enables the `secure` + `SameSite=None` cookie flags so the JWT is stored cross-origin (see the critical bug below) |
| `FRONTEND_URL` | ✅ | Your Netlify URL, e.g. `https://dimetime.netlify.app` — must match the frontend origin exactly, no trailing slash |
| `PORT` | ❌ | Omit — hosts like Render inject their own `PORT` (the code falls back to `3001`) |
| `JWT_EXPIRES_IN` | ❌ | Optional, defaults to `7d` |
| `GROQ_API_KEY` | ❌ | Optional — add to enable AI Insights on the deployed API |

> ⚠️ **Do NOT copy `server/.env` to production.** Production services inject these as environment variables from their dashboard; `.env` files stay local and are git-ignored.

### Backend (Render)

1. Create a new **Web Service**, connect your repo.
2. Set **Root Directory** to `server`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production` (**required** — see the critical bug below)
   - `FRONTEND_URL=https://dimetime.netlify.app`
   - `GROQ_API_KEY` (optional — enables AI insights)

### Frontend (Netlify)

1. Connect repo, set **Base directory** to `.` (root).
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. The backend URL is supplied at runtime via `public/runtime-config.json`:
   ```json
   { "VITE_API_URL": "https://budgettracker-7whc.onrender.com/api" }
   ```
   This lets you re-point the API without rebuilding the bundle. In production, make sure this points to your deployed API — and that the value in `FRONTEND_URL` on the backend matches the deployed frontend origin exactly.
5. Add a `_redirects` file in `public/`:
   ```
   /*  /index.html  200
   ```
   This ensures React Router handles all client-side routes.

## Critical production bug (fixed)

**Symptom:** In production, registration succeeded (201) but login always returned `401 "Invalid email or password"` — even using the exact same credentials just used to register. The app was unusable.

**Root cause:** The bcrypt password-hashing pre-save hook in `server/models/User.js` used the **async callback style** (`bcrypt.genSalt` / `bcrypt.hash` with `next()`). On the deployed Mongoose 9 + bcryptjs 3.0.3 stack, bcryptjs fires the callback via `setImmediate`, so by the time the innermost callback ran, `next` was no longer a valid function → `TypeError: next is not a function`. Registration still returned 201 (the promise resolved before the deferred throw), but the password hash was **not reliably persisted**. Login then failed `bcrypt.compare` against the un-hashed value → silent 401.

**Fix:** Replaced the async callback hook with **synchronous** bcrypt (`bcrypt.hashSync(password, 12)`), which hashes the password before the document is saved. Also made `verifyPassword` defensive — it returns `false` instead of throwing if a stored value isn't a valid bcrypt hash (handles legacy/corrupted records cleanly).

**Also fixed:** Removed a duplicate `react-router@8` top-level dependency that conflicted with `react-router-dom@7`'s bundled router, preventing build-time version clashes.

> **Note for existing users:** Accounts created during the broken deployment window may have malformed stored hashes. They will need to re-register (or reset their password) after redeploying. New registrations work correctly.

---

## Common issues

**`ECONNREFUSED` on Vite proxy** — Express isn't running. Start it with `npm run server:dev` in a separate terminal.

**`401` on every request** — The `bt_token` cookie isn't being sent. Check that `credentials: true` is set in CORS and `withCredentials: true` is set in the Axios instance.

**Login returns 401 right after registering** — You're likely on the old broken deployment. Redeploy the backend with the `server/models/User.js` fix (synchronous bcrypt) after committing and pushing.

**Health endpoint shows `"env":"development"` even in production** — `NODE_ENV` isn't set to `production` on the Render service. This also disables the `secure` cookie flag and `SameSite=None`, which can block the cookie from being stored cross-origin. Set `NODE_ENV=production` in Render env vars and redeploy.

**MongoDB Atlas connection refused** — Your current IP isn't whitelisted. Go to Atlas → Network Access → Add Current IP Address.

**`JWT_SECRET` warning** — The default secret in `.env.example` is a placeholder. Generate a real one:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
