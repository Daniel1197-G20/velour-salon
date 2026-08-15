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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5 py-14">
      <p className="text-xs uppercase tracking-widest text-rose">Staff access</p>
      <h1 className="mt-1 font-display text-3xl text-espresso">Admin sign in</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          required
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose"
        />
        {error && <p className="text-sm text-rose">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-espresso px-7 py-3 text-sm font-medium text-cream hover:bg-rose disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-xs text-espresso/50">
        Default credentials come from the server's <code>.env</code> file (ADMIN_USERNAME / ADMIN_PASSWORD).
      </p>
    </div>
  );
}
