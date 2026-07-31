import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Send the user back to wherever they were trying to go before being redirected to /login, or fall back to the dashboard.
  const from = location.state?.from?.pathname ?? "/";

  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setError("");
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(form);
      login(data.user); // cookie set by server
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ?? "Login failed — check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-1">
            Welcome back
          </p>
          <h1 className="font-serif text-2xl text-ink">Log in</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-surface border border-hairline rounded-sm px-7 py-8 flex flex-col gap-5">

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Email
            </label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com" autoComplete="email" autoFocus
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Password
            </label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
          </div>

          {error && <p className="font-mono text-[11px] text-expense">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-ink text-surface rounded-sm font-mono text-[12px] uppercase tracking-[0.14em] hover:opacity-80 disabled:opacity-40 transition-opacity">
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="text-center font-mono text-[11px] text-ink-soft">
            No account?{" "}
            <Link to="/register" className="text-ink underline hover:no-underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
