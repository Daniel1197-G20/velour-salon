import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { api } from "../lib/api";
import { formatNaira, formatDate } from "../lib/format";

const TABS = ["Overview", "Bookings", "Orders", "Services", "Products"];
const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

export default function AdminDashboard() {
  const { token, username, logout } = useAdmin();
  const [tab, setTab] = useState("Bookings");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    api.admin.summary(token).then((res) => {
      if (res?.pendingBookings) setPendingCount(res.pendingBookings);
    }).catch(() => {});
  }, [token, tab]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Mobile-friendly Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-clay/15 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs uppercase tracking-widest font-semibold text-rose">Salon Management</p>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl text-espresso">
            Admin Portal <span className="text-sm font-body font-normal text-espresso/60">({username})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-clay/20 bg-white/60 px-4 py-2 text-xs font-medium text-espresso hover:border-rose hover:text-rose transition-colors"
          >
            View Live Site ↗
          </a>
          <button
            onClick={logout}
            className="rounded-full border border-rose/30 bg-rose/10 px-4 py-2 text-xs font-semibold text-rose hover:bg-rose hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Touch-optimized horizontal scrolling tabs */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              tab === t
                ? "bg-espresso text-cream shadow-sm"
                : "bg-stone/50 text-espresso/70 hover:bg-stone hover:text-espresso"
            }`}
          >
            <span>{t}</span>
            {t === "Bookings" && pendingCount > 0 && (
              <span className="rounded-full bg-rose px-1.5 py-0.2 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {tab === "Overview" && <Overview token={token} onNavigateTab={setTab} />}
        {tab === "Bookings" && <Bookings token={token} onUpdateCount={setPendingCount} />}
        {tab === "Orders" && <Orders token={token} />}
        {tab === "Services" && <Services token={token} />}
        {tab === "Products" && <Products token={token} />}
      </div>
    </div>
  );
}

function Overview({ token, onNavigateTab }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.admin.summary(token).then(setSummary).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const cards = summary
    ? [
        { label: "Pending Bookings", value: summary.pendingBookings, highlight: summary.pendingBookings > 0, tab: "Bookings", icon: "🗓️" },
        { label: "Pending Orders", value: summary.pendingOrders, highlight: summary.pendingOrders > 0, tab: "Orders", icon: "🛍️" },
        { label: "Shop Revenue", value: formatNaira(summary.revenue), highlight: false, tab: "Orders", icon: "💰" },
        { label: "Active Services", value: summary.serviceCount, highlight: false, tab: "Services", icon: "✂️" },
      ]
    : [];

  if (loading) return <p className="py-8 text-center text-sm text-espresso/60">Loading metrics…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            onClick={() => onNavigateTab && onNavigateTab(c.tab)}
            className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all active:scale-95 hover:shadow-md ${
              c.highlight
                ? "border-rose/40 bg-rose/5"
                : "border-clay/15 bg-white/75"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{c.icon}</span>
              {c.highlight && (
                <span className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] font-bold text-rose uppercase">
                  Action Needed
                </span>
              )}
            </div>
            <p className="mt-3 font-display text-xl sm:text-2xl font-bold text-espresso">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-clay truncate">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-clay/15 bg-white/60 p-5">
        <h3 className="font-display text-base font-semibold text-espresso">Quick Mobile Actions</h3>
        <p className="mt-1 text-xs text-espresso/70">Tap a button below to quickly manage your salon operations:</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => onNavigateTab("Bookings")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-clay/20 bg-stone/40 p-3 text-xs font-semibold text-espresso hover:bg-stone"
          >
            <span className="text-xl">📅</span>
            <span>View Bookings</span>
          </button>
          <button
            onClick={() => onNavigateTab("Orders")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-clay/20 bg-stone/40 p-3 text-xs font-semibold text-espresso hover:bg-stone"
          >
            <span className="text-xl">📦</span>
            <span>Shop Orders</span>
          </button>
          <button
            onClick={() => onNavigateTab("Services")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-clay/20 bg-stone/40 p-3 text-xs font-semibold text-espresso hover:bg-stone"
          >
            <span className="text-xl">✨</span>
            <span>Add Service</span>
          </button>
          <button
            onClick={() => onNavigateTab("Products")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-clay/20 bg-stone/40 p-3 text-xs font-semibold text-espresso hover:bg-stone"
          >
            <span className="text-xl">🧴</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Bookings({ token, onUpdateCount }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);

  function load() {
    setLoading(true);
    api.bookings
      .list(token)
      .then((data) => {
        setBookings(data || []);
        const pending = (data || []).filter((b) => b.status === "pending").length;
        if (onUpdateCount) onUpdateCount(pending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    if (!confirm("Delete this booking record?")) return;
    await api.bookings.remove(id, token);
    load();
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchFilter = filter === "all" || b.status === filter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.phone || "").toLowerCase().includes(q) ||
        (b.service_name || "").toLowerCase().includes(q) ||
        (b.date || "").includes(q);
      return matchFilter && matchSearch;
    });
  }, [bookings, filter, search]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-300">✓ Confirmed</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-300">✕ Cancelled</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">★ Completed</span>;
      case "pending":
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300 animate-pulse">⏳ Pending Action</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All", count: bookings.length },
            { id: "pending", label: "Pending", count: pendingCount },
            { id: "confirmed", label: "Confirmed", count: bookings.filter((b) => b.status === "confirmed").length },
            { id: "completed", label: "Completed", count: bookings.filter((b) => b.status === "completed").length },
            { id: "cancelled", label: "Cancelled", count: bookings.filter((b) => b.status === "cancelled").length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-espresso text-cream shadow-sm"
                  : "bg-white border border-clay/20 text-espresso/70 hover:border-rose"
              }`}
            >
              <span>{f.label}</span>
              {f.count > 0 && <span className="text-[10px] opacity-75">({f.count})</span>}
            </button>
          ))}
        </div>

        {/* Refresh & Search Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48 rounded-full border border-clay/20 bg-white px-3.5 py-1.5 text-xs text-espresso placeholder:text-espresso/40 focus:border-rose focus:outline-none"
          />
          <button
            onClick={load}
            title="Refresh bookings"
            className="shrink-0 rounded-full border border-clay/20 bg-white p-2 text-xs text-espresso hover:text-rose transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {loading && <p className="py-12 text-center text-sm text-espresso/60">Loading appointments…</p>}

      {!loading && filteredBookings.length === 0 && (
        <div className="rounded-2xl border border-clay/15 bg-white/50 p-8 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-2 font-display text-lg text-espresso">No bookings found</p>
          <p className="mt-1 text-xs text-espresso/60">
            {filter !== "all" || search ? "Try changing your filter or search." : "New client appointments will appear here automatically."}
          </p>
        </div>
      )}

      {/* MOBILE-FIRST APPOINTMENT CARDS (Optimized for Phones) */}
      <div className="grid gap-3.5 sm:hidden">
        {filteredBookings.map((b) => {
          const isPending = b.status === "pending";
          const isBusy = processingId === b.id;

          return (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 transition-all shadow-sm ${
                isPending
                  ? "border-amber-400/80 bg-amber-50/40"
                  : "border-clay/15 bg-white/90"
              }`}
            >
              {/* Header: Customer & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-espresso">{b.customer_name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-stone/80 px-2 py-0.5 font-semibold text-espresso">
                      {b.service_name || "Salon Service"}
                    </span>
                    {b.service_price && (
                      <span className="font-semibold text-rose">{formatNaira(b.service_price)}</span>
                    )}
                  </div>
                </div>
                <div>{getStatusBadge(b.status)}</div>
              </div>

              {/* Date, Time & Contact Info */}
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-stone/30 p-2.5 text-xs text-espresso">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span className="font-semibold">{formatDate(b.date)}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1 font-bold text-rose">
                  <span>⏰</span>
                  <span>{b.time}</span>
                </div>
              </div>

              {/* Customer Note */}
              {b.notes && (
                <div className="mt-2.5 rounded-lg border border-clay/10 bg-white/80 p-2 text-xs italic text-clay">
                  "{b.notes}"
                </div>
              )}

              {/* Direct Quick Contact Buttons */}
              <div className="mt-3 flex items-center gap-2 border-t border-clay/10 pt-3">
                <a
                  href={`tel:${b.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-clay/25 bg-white py-2 text-xs font-semibold text-espresso shadow-xs hover:border-rose active:bg-stone"
                >
                  <span>📞 Call</span>
                  <span className="text-[11px] text-espresso/60 font-normal">{b.phone}</span>
                </a>
                {b.email && (
                  <a
                    href={`mailto:${b.email}`}
                    className="inline-flex items-center justify-center rounded-xl border border-clay/25 bg-white p-2 text-xs text-espresso hover:border-rose"
                    title="Send Email"
                  >
                    ✉️
                  </a>
                )}
              </div>

              {/* ONE-TAP APPROVE / DECLINE BUTTONS (For Pending Bookings) */}
              {isPending && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
                  >
                    <span>✓ Accept</span>
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-98 disabled:opacity-50"
                  >
                    <span>✕ Decline</span>
                  </button>
                </div>
              )}

              {/* Status Change Dropdown & Delete */}
              <div className="mt-3 flex items-center justify-between border-t border-clay/10 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-espresso/60">Status:</span>
                  <select
                    value={b.status}
                    disabled={isBusy}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    className="rounded-lg border border-clay/25 bg-white px-2 py-1 text-xs text-espresso focus:border-rose"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="text-xs text-espresso/40 hover:text-rose p-1"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE VIEW (For Tablet & Desktop >= 640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-clay/15 bg-white/70">
        <table className="w-full text-sm">
          <thead className="bg-stone text-left text-espresso/70 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Service</th>
              <th className="p-3.5">Date & Time</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay/10">
            {filteredBookings.map((b) => (
              <tr key={b.id} className="hover:bg-white/40 transition-colors">
                <td className="p-3.5">
                  <p className="font-semibold text-espresso">{b.customer_name}</p>
                  <p className="text-xs text-espresso/70">
                    <a href={`tel:${b.phone}`} className="hover:text-rose font-medium">📞 {b.phone}</a>
                  </p>
                  {b.email && (
                    <p className="text-xs text-espresso/50 truncate max-w-[180px]">
                      <a href={`mailto:${b.email}`} className="hover:text-rose">✉️ {b.email}</a>
                    </p>
                  )}
                  {b.notes && <p className="mt-1 text-xs italic text-clay line-clamp-1">"{b.notes}"</p>}
                </td>
                <td className="p-3.5">
                  <span className="font-medium text-espresso">{b.service_name || "Service"}</span>
                  {b.service_price && <p className="text-xs text-rose font-semibold">{formatNaira(b.service_price)}</p>}
                </td>
                <td className="p-3.5">
                  <p className="text-espresso font-medium">{formatDate(b.date)}</p>
                  <p className="text-xs text-rose font-bold">{b.time}</p>
                </td>
                <td className="p-3.5">
                  <div className="space-y-1">
                    <div>{getStatusBadge(b.status)}</div>
                    <select
                      value={b.status}
                      disabled={processingId === b.id}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="block text-xs rounded-lg border border-clay/25 bg-white px-2 py-1 text-espresso focus:border-rose"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-3.5">
                  {b.status === "pending" ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStatus(b.id, "confirmed")}
                        disabled={processingId === b.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        disabled={processingId === b.id}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-clay">Completed</span>
                  )}
                </td>
                <td className="p-3.5 text-right">
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

  if (loading) return <p className="py-8 text-center text-sm text-espresso/60">Loading orders…</p>;
  if (orders.length === 0) return <p className="py-8 text-center text-sm text-espresso/60">No orders yet.</p>;

  return (
    <div className="space-y-3.5">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-clay/15 bg-white/80 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-clay/10 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-espresso">{o.customer_name}</h3>
              <p className="mt-0.5 text-xs text-espresso/70">
                <a href={`tel:${o.phone}`} className="hover:text-rose font-medium">📞 {o.phone}</a> · 📍 {o.address}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-display text-base font-bold text-rose">{formatNaira(o.total)}</span>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="rounded-lg border border-clay/25 bg-white px-2.5 py-1 text-xs font-semibold text-espresso"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-clay">Items Ordered:</p>
            <ul className="mt-1 space-y-1 text-xs text-espresso/80">
              {o.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{i.quantity} × {i.name}</span>
                  <span className="font-medium">{formatNaira(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function Services({ token }) {
  const [services, setServices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", price: "", duration_minutes: "60" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.services.list(token).then(setServices).catch(() => {});
  }
  useEffect(load, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.services.create(
        { ...form, price: Number(form.price), duration_minutes: Number(form.duration_minutes) || 60 },
        token
      );
      setForm({ name: "", category: "", description: "", price: "", duration_minutes: "60" });
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this service from the site?")) return;
    await api.services.remove(id, token);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-espresso">Salon Services ({services.length})</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-espresso px-4 py-2 text-xs font-semibold text-cream hover:bg-rose transition-colors"
        >
          {showAddForm ? "✕ Close Form" : "+ Add Service"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-clay/20 bg-white/95 p-4 sm:p-5 shadow-md">
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-rose">Add New Service</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Service Name (e.g. Bohemian Braids)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
            <input
              required
              placeholder="Category (e.g. Braiding, Locs, Wigs)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
            <input
              required
              type="number"
              placeholder="Price in ₦ (e.g. 25000)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
            <input
              type="number"
              placeholder="Duration in mins (e.g. 180)"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>
          <textarea
            placeholder="Short description of the service…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
          />
          {error && <p className="text-xs text-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-espresso py-3 text-xs sm:text-sm font-semibold text-cream hover:bg-rose active:scale-98 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Service to Catalog →"}
          </button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="rounded-2xl border border-clay/15 bg-white/80 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-stone/70 px-2.5 py-0.5 text-[11px] font-semibold text-rose uppercase">
                  {s.category}
                </span>
                <span className="font-display font-bold text-espresso">{formatNaira(s.price)}</span>
              </div>
              <h4 className="mt-2 font-display text-base font-semibold text-espresso">{s.name}</h4>
              <p className="mt-1 text-xs text-espresso/70 line-clamp-2">{s.description}</p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-clay/10 pt-2.5 text-xs">
              <span className="text-clay font-medium">⏱ {s.duration_minutes} mins</span>
              <button onClick={() => remove(s.id)} className="text-espresso/40 hover:text-rose font-medium">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "20" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.products.list(token).then(setProducts).catch(() => {});
  }
  useEffect(load, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.products.create(
        { ...form, price: Number(form.price), stock: Number(form.stock) || 0 },
        token
      );
      setForm({ name: "", description: "", price: "", stock: "20" });
      setShowAddForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm("Remove this product from the store?")) return;
    await api.products.remove(id, token);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-espresso">Store Products ({products.length})</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-espresso px-4 py-2 text-xs font-semibold text-cream hover:bg-rose transition-colors"
        >
          {showAddForm ? "✕ Close Form" : "+ Add Product"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-clay/20 bg-white/95 p-4 sm:p-5 shadow-md">
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-rose">Add New Product</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
            <input
              required
              type="number"
              placeholder="Price in ₦"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
            <input
              type="number"
              placeholder="Available Stock (e.g. 30)"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>
          <textarea
            placeholder="Product details…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
          />
          {error && <p className="text-xs text-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-espresso py-3 text-xs sm:text-sm font-semibold text-cream hover:bg-rose active:scale-98 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Product to Store →"}
          </button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-clay/15 bg-white/80 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-stone/70 px-2 py-0.5 text-[11px] font-semibold text-espresso">
                  Stock: {p.stock}
                </span>
                <span className="font-display font-bold text-espresso">{formatNaira(p.price)}</span>
              </div>
              <h4 className="mt-2 font-display text-base font-semibold text-espresso">{p.name}</h4>
              <p className="mt-1 text-xs text-espresso/70 line-clamp-2">{p.description}</p>
            </div>
            <div className="mt-3 flex items-center justify-end border-t border-clay/10 pt-2.5 text-xs">
              <button onClick={() => remove(p.id)} className="text-espresso/40 hover:text-rose font-medium">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
