import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatNaira } from "../lib/format";

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function nextNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default function Booking() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service");

  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(preselected || "");
  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState("");
  const [takenSlots, setTakenSlots] = useState([]);
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const days = useMemo(() => nextNDays(14), []);
  const selectedService = services.find((s) => String(s.id) === String(serviceId));

  useEffect(() => {
    api.services.list().then(setServices).catch(() => {});
  }, []);

  useEffect(() => {
    if (!date) return;
    api.bookings.taken(date).then(setTakenSlots).catch(() => setTakenSlots([]));
    setTime("");
  }, [date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!serviceId || !date || !time) {
      setError("Please choose a service, date, and time.");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await api.bookings.create({
        ...form,
        service_id: serviceId,
        date,
        time,
      });
      setConfirmed(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay/20 text-2xl text-clay">
          ⏳
        </div>
        <h1 className="mt-6 font-display text-3xl text-espresso">Request Received</h1>
        <p className="mt-3 text-espresso/70 leading-relaxed">
          {confirmed.customer_name}, your appointment request for <strong>{confirmed.service?.name}</strong> on{" "}
          <strong>{date}</strong> at <strong>{time}</strong> has been received and is currently <strong>pending confirmation</strong>.
        </p>
        <div className="mt-4 rounded-xl border border-clay/20 bg-white/60 p-4 text-sm text-espresso/80">
          <p>
            {confirmed.email
              ? `We have sent a summary to ${confirmed.email}. As soon as the salon approves your appointment, you will receive your final confirmation email.`
              : `We will contact you via phone at ${confirmed.phone} as soon as your slot is approved.`}
          </p>
        </div>
        <a
          href="/"
          className="mt-8 inline-block rounded-full bg-espresso px-7 py-3 text-sm font-medium text-cream hover:bg-rose"
        >
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-widest text-rose">Book an appointment</p>
      <h1 className="mt-1 font-display text-4xl text-espresso">Reserve your slot</h1>
      <p className="mt-3 text-espresso/70">Pick a service, a date, and a time — we'll confirm you're in.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        {/* Service */}
        <div>
          <label className="font-display text-sm uppercase tracking-widest text-clay">1. Choose a service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-clay/25 bg-white/70 px-4 py-3 text-espresso focus:border-rose"
          >
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatNaira(s.price)} ({s.duration_minutes} mins)
              </option>
            ))}
          </select>
          {selectedService && (
            <p className="mt-2 text-sm text-espresso/60">{selectedService.description}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="font-display text-sm uppercase tracking-widest text-clay">2. Choose a date</label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const iso = toISODate(d);
              const isSelected = iso === date;
              return (
                <button
                  type="button"
                  key={iso}
                  onClick={() => setDate(iso)}
                  className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-espresso bg-espresso text-cream"
                      : "border-clay/25 text-espresso/70 hover:border-rose"
                  }`}
                >
                  <span className="text-xs uppercase">{d.toLocaleDateString("en-NG", { weekday: "short" })}</span>
                  <span className="font-display text-lg">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="font-display text-sm uppercase tracking-widest text-clay">3. Choose a time</label>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {SLOTS.map((t) => {
              const isTaken = takenSlots.includes(t);
              const isSelected = t === time;
              return (
                <button
                  type="button"
                  key={t}
                  disabled={isTaken}
                  onClick={() => setTime(t)}
                  className={`rounded-lg border px-2 py-2 text-sm transition-colors ${
                    isTaken
                      ? "cursor-not-allowed border-clay/10 text-espresso/30 line-through"
                      : isSelected
                      ? "border-espresso bg-espresso text-cream"
                      : "border-clay/25 text-espresso/70 hover:border-rose"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="font-display text-sm uppercase tracking-widest text-clay">4. Your details</label>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose"
            />
            <input
              required
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose sm:col-span-2"
            />
            <textarea
              placeholder="Notes for your stylist (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose sm:col-span-2"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-rose disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Booking…" : "Confirm appointment"}
        </button>
      </form>
    </div>
  );
}
