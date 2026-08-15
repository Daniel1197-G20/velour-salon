import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatNaira } from "../lib/format";
import { api } from "../lib/api";
import { getProductImage } from "../components/ProductCard";

export default function Cart() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function handleCheckout(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const created = await api.orders.create({
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      setOrder(created);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay/20 text-2xl text-clay">
          ✓
        </div>
        <h1 className="mt-6 font-display text-3xl text-espresso">Order placed</h1>
        <p className="mt-3 text-espresso/70">
          Thanks {order.customer_name}! Your order total is <strong>{formatNaira(order.total)}</strong>, payable
          on arrival or delivery. We'll reach you on {order.phone} to confirm delivery.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-block rounded-full bg-espresso px-7 py-3 text-sm font-medium text-cream hover:bg-rose"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-espresso">Your cart is empty</h1>
        <p className="mt-3 text-espresso/70">Add a few products from the shop to get started.</p>
        <Link
          to="/shop"
          className="mt-8 inline-block rounded-full bg-espresso px-7 py-3 text-sm font-medium text-cream hover:bg-rose"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-widest text-rose">Checkout</p>
      <h1 className="mt-1 font-display text-4xl text-espresso">Your cart</h1>

      <div className="mt-8 divide-y divide-clay/15 rounded-2xl border border-clay/15 bg-white/50">
        {items.map((i) => (
          <div key={i.product_id} className="flex items-center gap-4 p-4">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone border border-clay/20 shadow-sm">
              <img
                src={i.image || getProductImage(i)}
                alt={i.name}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="flex-1">
              <p className="font-display text-espresso">{i.name}</p>
              <p className="text-sm text-espresso/60">{formatNaira(i.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(i.product_id, i.quantity - 1)}
                className="h-7 w-7 rounded-full border border-clay/30 text-espresso hover:border-rose"
              >
                −
              </button>
              <span className="w-6 text-center">{i.quantity}</span>
              <button
                onClick={() => updateQuantity(i.product_id, i.quantity + 1)}
                className="h-7 w-7 rounded-full border border-clay/30 text-espresso hover:border-rose"
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-display text-espresso">{formatNaira(i.price * i.quantity)}</p>
            <button
              onClick={() => removeItem(i.product_id)}
              className="ml-2 text-xs text-espresso/40 hover:text-rose"
              aria-label={`Remove ${i.name}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <p className="font-display text-xl text-espresso">Total: {formatNaira(total)}</p>
      </div>

      <form onSubmit={handleCheckout} className="mt-10 space-y-4">
        <p className="font-display text-sm uppercase tracking-widest text-clay">Delivery details</p>
        <div className="grid gap-4 sm:grid-cols-2">
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
            required
            placeholder="Delivery address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={3}
            className="rounded-xl border border-clay/25 bg-white/70 px-4 py-3 focus:border-rose sm:col-span-2"
          />
        </div>
        <p className="text-sm text-espresso/60">Payment is made on arrival or delivery — no card needed now.</p>
        {error && <p className="text-sm text-rose">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-rose disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Placing order…" : "Place order (pay on arrival)"}
        </button>
      </form>
    </div>
  );
}
