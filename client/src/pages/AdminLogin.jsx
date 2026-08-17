import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

export default function AdminLogin() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-sm flex-col justify-center px-5 py-8 sm:py-14">
      <div className="rounded-3xl border border-clay/15 bg-white/80 p-6 sm:p-8 shadow-sm backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-espresso text-cream text-xl shadow-xs">
            👑
          </div>
          <p className="mt-3 text-xs uppercase tracking-widest font-semibold text-rose">Salon Management</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-espresso">Admin Sign In</h1>
          <p className="mt-1 text-xs text-espresso/60">Enter your credentials to access appointments and orders.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-espresso mb-1">Username</label>
            <input
              required
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-base text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso mb-1">Password</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-base text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose/10 border border-rose/20 p-2.5 text-xs text-rose font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-espresso py-3.5 text-sm font-semibold text-cream shadow-sm hover:bg-rose active:scale-98 disabled:opacity-60 transition-all"
          >
            {submitting ? "Signing in…" : "Sign In to Dashboard →"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="text-xs text-espresso/60 hover:text-rose transition-colors">
          ← Back to Homepage
        </a>
      </div>
    </div>
  );
}
