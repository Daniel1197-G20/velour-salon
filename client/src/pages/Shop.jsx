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
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose">Shop</p>
          <h1 className="mt-1 font-display text-4xl text-espresso">Hair care essentials</h1>
          <p className="mt-3 max-w-xl text-espresso/70">
            Everything used in-salon, ready to take home. Pay on arrival or delivery.
          </p>
        </div>
        {count > 0 && (
          <Link
            to="/cart"
            className="rounded-full bg-espresso px-6 py-3 text-sm font-medium text-cream hover:bg-rose"
          >
            View cart ({count})
          </Link>
        )}
      </div>

      {loading && <p className="mt-10 text-espresso/60">Loading products…</p>}
      {error && (
        <p className="mt-10 text-rose">
          Couldn't load products ({error}). Is the API server running on port 4000?
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
