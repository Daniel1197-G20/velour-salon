import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { count } = useCart();

  useEffect(() => {
    api.products
      .list()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-widest font-semibold text-rose">Shop</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-espresso">Hair care essentials</h1>
          <p className="mt-2.5 text-sm sm:text-base text-espresso/75 leading-relaxed">
            Everything used in-salon, ready to take home. Pay on arrival or delivery.
          </p>
        </div>
        {count > 0 && (
          <Link
            to="/cart"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-6 py-3 text-xs sm:text-sm font-semibold text-cream shadow-sm hover:bg-rose active:scale-98 transition-all self-start sm:self-auto"
          >
            <span>🛍️ View Cart</span>
            <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-white">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </Link>
        )}
      </div>

      {loading && (
        <div className="py-14 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rose border-t-transparent"></div>
          <p className="mt-3 text-sm text-espresso/60">Loading hair products…</p>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-rose/20 bg-rose/5 p-5 text-center">
          <p className="text-sm font-semibold text-rose">
            Couldn't load products ({error}).
          </p>
          <p className="mt-1 text-xs text-espresso/60">Please check your connection or server status.</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="mt-12 rounded-2xl border border-clay/15 bg-white/50 p-8 text-center">
          <p className="text-2xl">🧴</p>
          <p className="mt-2 font-display text-lg text-espresso">No products currently available</p>
        </div>
      )}

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
