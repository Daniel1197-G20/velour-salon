import { useEffect, useMemo, useState } from "react";
import ServiceCard from "../components/ServiceCard";
import { api } from "../lib/api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.services
      .list()
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return ["All", ...set];
  }, [services]);

  const filtered = category === "All" ? services : services.filter((s) => s.category === category);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-xs uppercase tracking-widest text-rose">Our services</p>
      <h1 className="mt-1 font-display text-4xl text-espresso">Everything for your hair</h1>
      <p className="mt-3 max-w-xl text-espresso/70">
        Braiding, styling, locs, wigs, and treatments — choose a service and book a slot that works for you.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              category === c
                ? "border-espresso bg-espresso text-cream"
                : "border-clay/30 text-espresso/70 hover:border-rose hover:text-rose"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="mt-10 text-espresso/60">Loading services…</p>}
      {error && (
        <p className="mt-10 text-rose">
          Couldn't load services ({error}). Is the API server running on port 4000?
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}
