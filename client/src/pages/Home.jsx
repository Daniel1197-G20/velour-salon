import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import CircleCollage from "../components/CircleCollage";
import ServiceCard from "../components/ServiceCard";
import { api } from "../lib/api";

const highlights = [
  { title: "Professional Hair Braiding", desc: "Knotless, cornrows, feed-ins, and jumbo styles." },
  { title: "Gel & Sleek Styling", desc: "Clean lines, laid edges, polished finishes." },
  { title: "Ghana Weaving & Packing", desc: "Neat, long-lasting weave-in styles." },
  { title: "Locs (Retwist & Relocking)", desc: "Healthy maintenance for established locs." },
];

export default function Home() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.services.list().then((data) => setServices(data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-12 md:pt-18">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose/10 px-3 py-1 text-xs font-semibold text-rose">
              <span>✨</span>
              <span>Luxury Hair &amp; Beauty Lounge</span>
            </div>
            <p className="mt-3 script-accent text-xl sm:text-2xl text-rose">Beauty</p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-espresso">
              HAIR SALON
            </h1>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-espresso/75">
              Your hair deserves the best care. Step in, relax, and let us bring out your true beauty —
              braiding, locs, weaving, and styling, booked in minutes.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                to="/booking"
                className="flex items-center justify-center rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-cream shadow-md transition-all hover:bg-rose active:scale-98 text-center"
              >
                Book your appointment →
              </Link>
              <Link
                to="/shop"
                className="flex items-center justify-center rounded-full border border-clay/35 bg-white/50 px-7 py-3.5 text-sm font-medium text-espresso transition-all hover:border-rose hover:text-rose active:scale-98 text-center"
              >
                Shop hair products
              </Link>
            </div>

            {/* Quick Call */}
            <div className="mt-5 flex items-center gap-3 text-xs sm:text-sm text-espresso/80">
              <a
                href="tel:08103043035"
                className="inline-flex items-center gap-2 rounded-full border border-clay/20 bg-stone/40 px-3 py-1.5 font-medium hover:border-rose hover:text-rose transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>0810 304 3035</span>
              </a>
              <span className="text-clay/70">Mon–Sat, 9am–7pm</span>
            </div>
          </div>

          <div className="mt-2 md:mt-0">
            <CircleCollage />
          </div>
        </div>
      </section>

      {/* Service highlights */}
      <section className="mx-auto mt-14 sm:mt-20 md:mt-24 max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-rose">Our services</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-espresso">What we do best</h2>
          </div>
          <Link to="/services" className="text-xs sm:text-sm font-semibold text-rose hover:underline">
            View all services →
          </Link>
        </div>
        <div className="mt-6 grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-2xl border border-clay/15 bg-white/60 p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-sm"
            >
              <h3 className="font-display text-base font-semibold text-espresso">{h.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-espresso/70">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured bookable services */}
      {services.length > 0 && (
        <section className="mx-auto mt-14 sm:mt-20 md:mt-24 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-rose">Book today</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-espresso">Popular right now</h2>
            </div>
            <Link to="/services" className="text-xs sm:text-sm font-semibold text-rose hover:underline">
              Explore catalog →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="mx-auto mt-14 sm:mt-20 md:mt-24 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:gap-5 rounded-2xl sm:rounded-3xl bg-espresso px-5 py-10 sm:px-8 sm:py-14 text-center text-cream shadow-xl">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-cream">
            Ready for your new look?
          </h2>
          <p className="max-w-md text-xs sm:text-sm text-cream/75 leading-relaxed">
            Pick a service, choose your preferred stylist time, and we'll take it from there.
          </p>
          <Link
            to="/booking"
            className="mt-2 w-full sm:w-auto rounded-full bg-rose px-8 py-3.5 text-sm font-semibold text-cream shadow-md transition-all hover:bg-rose/90 active:scale-98"
          >
            Book your appointment now
          </Link>
        </div>
      </section>
    </div>
  );
}
