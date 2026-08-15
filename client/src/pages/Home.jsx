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
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="script-accent text-2xl text-rose">Beauty</p>
            <h1 className="mt-1 font-display text-5xl leading-[1.05] text-espresso md:text-6xl">
              HAIR SALON
            </h1>
            <p className="mt-5 max-w-md text-espresso/70">
              Your hair deserves the best care. Step in, relax, and let us bring out your true beauty —
              braiding, locs, weaving, and styling, booked in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/booking"
                className="rounded-full bg-espresso px-7 py-3 text-sm font-medium text-cream shadow-md transition-transform hover:-translate-y-0.5 hover:bg-rose"
              >
                Book your appointment
              </Link>
              <Link
                to="/shop"
                className="rounded-full border border-clay/40 px-7 py-3 text-sm font-medium text-espresso transition-colors hover:border-rose hover:text-rose"
              >
                Shop hair products
              </Link>
            </div>
            <a href="tel:08103043035" className="mt-6 flex items-center gap-2 text-sm text-espresso/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              0810 304 3035
            </a>
          </div>
          <CircleCollage />
        </div>
      </section>

      {/* Service highlights */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-rose">Our services</p>
            <h2 className="mt-1 font-display text-3xl text-espresso">What we do best</h2>
          </div>
          <Link to="/services" className="hidden text-sm text-espresso/70 hover:text-rose md:block">
            View all services →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.title} className="rounded-2xl border border-clay/15 bg-white/50 p-6">
              <h3 className="font-display text-base text-espresso">{h.title}</h3>
              <p className="mt-2 text-sm text-espresso/65">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured bookable services */}
      {services.length > 0 && (
        <section className="mx-auto mt-24 max-w-6xl px-5">
          <p className="text-xs uppercase tracking-widest text-rose">Book today</p>
          <h2 className="mt-1 font-display text-3xl text-espresso">Popular right now</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-espresso px-8 py-14 text-center">
          <h2 className="font-display text-3xl text-cream md:text-4xl">Ready for your new look?</h2>
          <p className="max-w-md text-cream/70">
            Pick a service, choose your time, and we'll take it from there.
          </p>
          <Link
            to="/booking"
            className="mt-2 rounded-full bg-rose px-8 py-3 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5"
          >
            Book your appointment
          </Link>
        </div>
      </section>
    </div>
  );
}
