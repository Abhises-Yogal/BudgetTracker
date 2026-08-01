import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Score a password 0–5 on length + character variety.
function scorePassword(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: "" };
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  return { score, label: labels[score] ?? "Very strong" };
}

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "" });

  function set(field, value) {
    setError("");
    setForm((p) => ({ ...p, [field]: value }));
    if (field === "password" || field === "confirm") {
      setStrength(scorePassword(value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())     { setError("Name is required.");           return; }
    if (!form.email.trim())    { setError("Email is required.");          return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (strength?.score < 2)   { setError("Please choose a stronger password."); return; }

    setLoading(true);
    try {
      const data = await registerUser(form);
      login(data.user); // cookie is set server-side; only the user object is needed
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ??
        err.response?.data?.errors?.[0]?.message ??
        "Registration failed — please try again."
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
            Get started
          </p>
          <h1 className="font-serif text-2xl text-ink">Create account</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-surface border border-hairline rounded-sm px-7 py-8 flex flex-col gap-5">

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Name
            </label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith" autoComplete="name"
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Email
            </label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com" autoComplete="email"
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Password
            </label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
              placeholder="8+ characters" autoComplete="new-password"
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
            {strength.label && form.password && (
              <div className="mt-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i}
                      className={`h-1 flex-1 rounded-full ${i < strength.score ? "bg-ink" : "bg-hairline"}`} />
                  ))}
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft mb-1.5">
              Confirm password
            </label>
            <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
              placeholder="Re-enter password" autoComplete="new-password"
              className="w-full bg-paper border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink" />
          </div>

          {error && (
            <p className="font-mono text-[11px] text-expense">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-ink text-surface rounded-sm font-mono text-[12px] uppercase tracking-[0.14em] hover:opacity-80 disabled:opacity-40 transition-opacity">
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center font-mono text-[11px] text-ink-soft">
            Already have an account?{" "}
            <Link to="/login" className="text-ink underline hover:no-underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

