import { useEffect, useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { api } from "../lib/api";
import { formatNaira, formatDate } from "../lib/format";

const TABS = ["Overview", "Bookings", "Orders", "Services", "Products"];
const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

export default function AdminDashboard() {
  const { token, username, logout } = useAdmin();
  const [tab, setTab] = useState("Overview");

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose">Admin</p>
          <h1 className="mt-1 font-display text-3xl text-espresso">Welcome back, {username}</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-clay/30 px-5 py-2 text-sm text-espresso hover:border-rose hover:text-rose"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-clay/15 pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? "border-rose text-rose" : "border-transparent text-espresso/60 hover:text-espresso"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Overview" && <Overview token={token} />}
        {tab === "Bookings" && <Bookings token={token} />}
        {tab === "Orders" && <Orders token={token} />}
        {tab === "Services" && <Services token={token} />}
        {tab === "Products" && <Products token={token} />}
      </div>
    </div>
  );
}

function Overview({ token }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    api.admin.summary(token).then(setSummary).catch(() => {});
  }, [token]);

  const cards = summary
    ? [
        { label: "Pending bookings", value: summary.pendingBookings },
        { label: "Pending orders", value: summary.pendingOrders },
        { label: "Total revenue (orders)", value: formatNaira(summary.revenue) },
        { label: "Active services", value: summary.serviceCount },
      ]
    : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-clay/15 bg-white/50 p-6">
          <p className="text-xs uppercase tracking-widest text-clay">{c.label}</p>
          <p className="mt-2 font-display text-2xl text-espresso">{c.value}</p>
        </div>
      ))}
      {!summary && <p className="text-espresso/60">Loading…</p>}
    </div>
  );
}

function Bookings({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  function load() {
    setLoading(true);
    api.bookings.list(token).then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function updateStatus(id, status) {
    setProcessingId(id);
    try {
      await api.bookings.update(id, { status }, token);
      load();
    } finally {
      setProcessingId(null);
    }
  }
  async function remove(id) {
    if (!confirm("Delete this booking?")) return;
    await api.bookings.remove(id, token);
    load();
  }

  if (loading) return <p className="text-espresso/60">Loading bookings…</p>;
  if (bookings.length === 0) return <p className="text-espresso/60">No bookings yet.</p>;

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-300">✓ Confirmed</span>;
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-300">✕ Cancelled</span>;
      case "completed":
        return <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">Completed</span>;
      case "pending":
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">⏳ Pending</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-clay/20 bg-white/40 px-4 py-3 text-xs text-espresso/70 flex items-center justify-between">
        <span>💡 <strong>Tip:</strong> Approving or declining a booking will automatically send an email update to the customer.</span>
        <button onClick={load} className="text-rose font-medium hover:underline">Refresh</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-clay/15 bg-white/70">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-stone text-left text-espresso/70">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Service</th>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Status</th>
              <th className="p-3">Quick Actions</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay/10">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-white/40 transition-colors">
                <td className="p-3">
                  <p className="font-medium text-espresso">{b.customer_name}</p>
                  <p className="text-xs text-espresso/60"><a href={`tel:${b.phone}`} className="hover:text-rose">{b.phone}</a></p>
                  {b.email && <p className="text-xs text-espresso/50"><a href={`mailto:${b.email}`} className="hover:text-rose">{b.email}</a></p>}
                  {b.notes && <p className="mt-1 text-xs italic text-clay">"{b.notes}"</p>}
                </td>
                <td className="p-3">
                  <span className="font-medium text-espresso">{b.service_name}</span>
                </td>
                <td className="p-3">
                  <p className="text-espresso">{formatDate(b.date)}</p>
                  <p className="text-xs text-espresso/60 font-semibold">{b.time}</p>
                </td>
                <td className="p-3">
                  <div className="space-y-1.5">
                    <div>{getStatusBadge(b.status)}</div>
                    <select
                      value={b.status}
                      disabled={processingId === b.id}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="block text-xs rounded-lg border border-clay/25 bg-white px-2 py-1 text-espresso focus:border-rose"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-3">
                  {b.status === "pending" ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStatus(b.id, "confirmed")}
                        disabled={processingId === b.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        title="Approve booking and notify customer"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        disabled={processingId === b.id}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
                        title="Decline booking and notify customer"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-clay">Done</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(b.id)} className="text-xs text-espresso/40 hover:text-rose">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.orders.list(token).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function updateStatus(id, status) {
    await api.orders.update(id, { status }, token);
    load();
  }

  if (loading) return <p className="text-espresso/60">Loading orders…</p>;
  if (orders.length === 0) return <p className="text-espresso/60">No orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-clay/15 bg-white/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-espresso">{o.customer_name}</p>
              <p className="text-xs text-espresso/50">{o.phone} · {o.address}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-display text-espresso">{formatNaira(o.total)}</p>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="rounded-lg border border-clay/25 bg-white px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-espresso/70">
            {o.items.map((i, idx) => (
              <li key={idx}>
                {i.quantity} × {i.name} — {formatNaira(i.price * i.quantity)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Services({ token }) {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", description: "", price: "", duration_minutes: "" });
  const [error, setError] = useState("");

  function load() {
    api.services.list(token).then(setServices).catch(() => {});
  }
  useEffect(load, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.services.create(
        { ...form, price: Number(form.price), duration_minutes: Number(form.duration_minutes) || 60 },
        token
      );
      setForm({ name: "", category: "", description: "", price: "", duration_minutes: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this service from the site?")) return;
    await api.services.remove(id, token);
    load();
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto rounded-2xl border border-clay/15">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-stone text-left text-espresso/70">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay/10">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="p-3 text-espresso">{s.name}</td>
                <td className="p-3 text-espresso/70">{s.category}</td>
                <td className="p-3">{formatNaira(s.price)}</td>
                <td className="p-3">
                  <button onClick={() => remove(s.id)} className="text-xs text-espresso/40 hover:text-rose">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-clay/15 bg-white/50 p-5">
        <p className="font-display text-sm uppercase tracking-widest text-clay">Add service</p>
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Category (e.g. Braiding)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          placeholder="Price (₦)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-rose">{error}</p>}
        <button className="w-full rounded-full bg-espresso py-2 text-sm text-cream hover:bg-rose">
          Add service
        </button>
      </form>
    </div>
  );
}

function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "" });
  const [error, setError] = useState("");

  function load() {
    api.products.list(token).then(setProducts).catch(() => {});
  }
  useEffect(load, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.products.create(
        { ...form, price: Number(form.price), stock: Number(form.stock) || 0 },
        token
      );
      setForm({ name: "", description: "", price: "", stock: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this product from the site?")) return;
    await api.products.remove(id, token);
    load();
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto rounded-2xl border border-clay/15">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-stone text-left text-espresso/70">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay/10">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-3 text-espresso">{p.name}</td>
                <td className="p-3">{formatNaira(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  <button onClick={() => remove(p.id)} className="text-xs text-espresso/40 hover:text-rose">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-clay/15 bg-white/50 p-5">
        <p className="font-display text-sm uppercase tracking-widest text-clay">Add product</p>
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          placeholder="Price (₦)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Stock quantity"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="w-full rounded-lg border border-clay/25 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-rose">{error}</p>}
        <button className="w-full rounded-full bg-espresso py-2 text-sm text-cream hover:bg-rose">
          Add product
        </button>
      </form>
    </div>
  );
}
