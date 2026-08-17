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
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-clay/20 text-3xl text-clay shadow-xs">
          ⏳
        </div>
        <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-espresso">Request Received</h1>
        <p className="mt-3 text-sm sm:text-base text-espresso/75 leading-relaxed">
          {confirmed.customer_name}, your appointment request for <strong>{confirmed.service?.name}</strong> on{" "}
          <strong>{date}</strong> at <strong>{time}</strong> has been received and is currently <strong>pending confirmation</strong>.
        </p>
        <div className="mt-5 rounded-2xl border border-clay/20 bg-white/70 p-4 text-xs sm:text-sm text-espresso/80 shadow-2xs">
          <p>
            {confirmed.email
              ? `We have sent a summary to ${confirmed.email}. As soon as our stylists confirm your slot, you will receive your final confirmation.`
              : `We will contact you via phone at ${confirmed.phone} as soon as your slot is approved.`}
          </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/"
            className="w-full sm:w-auto rounded-full bg-espresso px-7 py-3.5 text-xs sm:text-sm font-semibold text-cream shadow-md hover:bg-rose active:scale-98 transition-all"
          >
            Back to Homepage
          </a>
          <a
            href="tel:08103043035"
            className="w-full sm:w-auto rounded-full border border-clay/30 bg-white/80 px-7 py-3.5 text-xs sm:text-sm font-semibold text-espresso hover:border-rose hover:text-rose transition-all"
          >
            📞 Call Salon: 0810 304 3035
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-widest font-semibold text-rose">Book an appointment</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-espresso">Reserve your slot</h1>
        <p className="mt-2 text-sm sm:text-base text-espresso/75">
          Pick a service, a date, and a time — we'll confirm you're in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-7 sm:space-y-8">
        {/* Step 1: Service */}
        <div className="rounded-2xl border border-clay/15 bg-white/80 p-4 sm:p-5 shadow-2xs">
          <label className="flex items-center gap-2 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">1</span>
            <span>Choose a service</span>
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-base text-espresso focus:border-rose focus:outline-none shadow-2xs"
          >
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatNaira(s.price)} ({s.duration_minutes} mins)
              </option>
            ))}
          </select>
          {selectedService && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-stone/40 px-3.5 py-2.5 text-xs text-espresso">
              <span className="text-espresso/70 truncate mr-2">{selectedService.description}</span>
              <span className="font-display font-bold text-rose shrink-0">{formatNaira(selectedService.price)}</span>
            </div>
          )}
        </div>

        {/* Step 2: Date */}
        <div className="rounded-2xl border border-clay/15 bg-white/80 p-4 sm:p-5 shadow-2xs">
          <label className="flex items-center gap-2 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">2</span>
            <span>Choose a date</span>
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
            {days.map((d) => {
              const iso = toISODate(d);
              const isSelected = iso === date;
              const isToday = toISODate(new Date()) === iso;
              return (
                <button
                  type="button"
                  key={iso}
                  onClick={() => setDate(iso)}
                  className={`flex min-w-[62px] sm:min-w-[68px] flex-col items-center rounded-xl border px-3 py-2.5 text-xs transition-all active:scale-95 ${
                    isSelected
                      ? "border-espresso bg-espresso text-cream shadow-sm"
                      : "border-clay/20 bg-white text-espresso/70 hover:border-rose hover:bg-rose/5"
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold tracking-wider">
                    {isToday ? "Today" : d.toLocaleDateString("en-NG", { weekday: "short" })}
                  </span>
                  <span className="font-display text-lg sm:text-xl font-bold my-0.5">{d.getDate()}</span>
                  <span className="text-[9px] uppercase opacity-75">{d.toLocaleDateString("en-NG", { month: "short" })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Time */}
        <div className="rounded-2xl border border-clay/15 bg-white/80 p-4 sm:p-5 shadow-2xs">
          <label className="flex items-center gap-2 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">3</span>
            <span>Choose a time</span>
          </label>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
            {SLOTS.map((t) => {
              const isTaken = takenSlots.includes(t);
              const isSelected = t === time;
              return (
                <button
                  type="button"
                  key={t}
                  disabled={isTaken}
                  onClick={() => setTime(t)}
                  className={`rounded-xl border py-2.5 px-2 text-xs font-semibold transition-all active:scale-95 ${
                    isTaken
                      ? "cursor-not-allowed border-clay/10 bg-stone/30 text-espresso/30 line-through"
                      : isSelected
                      ? "border-espresso bg-espresso text-cream shadow-sm"
                      : "border-clay/20 bg-white text-espresso hover:border-rose hover:bg-rose/5"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Details */}
        <div className="rounded-2xl border border-clay/15 bg-white/80 p-4 sm:p-5 shadow-2xs">
          <label className="flex items-center gap-2 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-rose">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose text-[11px] font-bold text-white">4</span>
            <span>Your details</span>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">Full Name *</label>
              <input
                required
                placeholder="e.g. Chinelo Obi"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-espresso mb-1">Phone Number *</label>
              <input
                required
                type="tel"
                placeholder="e.g. 0810 304 3035"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-espresso mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="e.g. chinelo@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-espresso mb-1">Notes for Stylist (Optional)</label>
              <textarea
                placeholder="Style specifications, hair length, special requests…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Live Summary Card */}
        {selectedService && date && time && (
          <div className="rounded-2xl border border-rose/30 bg-rose/5 p-4 text-xs sm:text-sm text-espresso flex items-center justify-between">
            <div>
              <p className="font-semibold text-rose">Appointment Summary:</p>
              <p className="mt-0.5 font-medium">{selectedService.name} · {date} at {time}</p>
            </div>
            <span className="font-display text-base font-bold text-espresso">{formatNaira(selectedService.price)}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose/10 border border-rose/20 p-3 text-xs text-rose font-medium text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-espresso px-7 py-4 text-sm font-semibold text-cream shadow-md transition-all hover:bg-rose active:scale-98 disabled:opacity-60"
        >
          {submitting ? "Booking appointment…" : "Confirm appointment slot →"}
        </button>
      </form>
    </div>
  );
}
