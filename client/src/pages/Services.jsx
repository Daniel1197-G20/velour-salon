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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest font-semibold text-rose">Our services</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-espresso">
          Everything for your hair
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-espresso/75 leading-relaxed">
          Braiding, styling, locs, wigs, and treatments — choose a service and book a slot that works for you.
        </p>
      </div>

      {/* Swipeable Category Filter Pills */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
              category === c
                ? "border-espresso bg-espresso text-cream shadow-xs font-semibold"
                : "border-clay/25 bg-white/70 text-espresso/70 hover:border-rose hover:text-rose hover:bg-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-14 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rose border-t-transparent"></div>
          <p className="mt-3 text-sm text-espresso/60">Loading salon services…</p>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-rose/20 bg-rose/5 p-5 text-center">
          <p className="text-sm font-semibold text-rose">
            Couldn't load services ({error}).
          </p>
          <p className="mt-1 text-xs text-espresso/60">Please check your internet connection or server.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-12 rounded-2xl border border-clay/15 bg-white/50 p-8 text-center">
          <p className="text-2xl">✂️</p>
          <p className="mt-2 font-display text-lg text-espresso">No services found in this category</p>
          <button
            onClick={() => setCategory("All")}
            className="mt-4 rounded-full bg-espresso px-5 py-2 text-xs font-semibold text-cream"
          >
            Show all services
          </button>
        </div>
      )}

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}
