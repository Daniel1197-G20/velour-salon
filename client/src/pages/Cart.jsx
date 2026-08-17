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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <p className="text-xs uppercase tracking-widest font-semibold text-rose">Checkout</p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-espresso">Your cart</h1>

      {/* Cart Items List */}
      <div className="mt-6 divide-y divide-clay/15 rounded-2xl border border-clay/15 bg-white/80 shadow-xs overflow-hidden">
        {items.map((i) => (
          <div key={i.product_id} className="p-3.5 sm:p-4">
            {/* Responsive 2-tier layout on mobile, 1-row on desktop */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              {/* Product Thumbnail */}
              <div className="relative h-16 w-16 sm:h-14 sm:w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone border border-clay/20 shadow-2xs">
                <img
                  src={i.image || getProductImage(i)}
                  alt={i.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Title, Unit Price & Desktop/Mobile Stepper */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm sm:text-base font-semibold text-espresso leading-snug">
                      {i.name}
                    </p>
                    <p className="text-xs text-espresso/60 mt-0.5">
                      {formatNaira(i.price)} each
                    </p>
                  </div>
                  {/* Remove Button (Mobile visible in top-right) */}
                  <button
                    onClick={() => removeItem(i.product_id)}
                    className="p-1 text-espresso/40 hover:text-rose transition-colors"
                    aria-label={`Remove ${i.name} from cart`}
                    title="Remove item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Bottom Action Bar (Quantity + Price) */}
                <div className="mt-3 flex items-center justify-between sm:hidden pt-2 border-t border-clay/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(i.product_id, i.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-clay/30 bg-stone/40 text-sm font-bold text-espresso active:bg-rose/20"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-semibold text-espresso">{i.quantity}</span>
                    <button
                      onClick={() => updateQuantity(i.product_id, i.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-clay/30 bg-stone/40 text-sm font-bold text-espresso active:bg-rose/20"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-display text-sm font-bold text-espresso">
                    {formatNaira(i.price * i.quantity)}
                  </span>
                </div>
              </div>

              {/* Desktop Stepper and Total Price */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(i.product_id, i.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-clay/30 text-espresso hover:border-rose"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-semibold">{i.quantity}</span>
                <button
                  onClick={() => updateQuantity(i.product_id, i.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-clay/30 text-espresso hover:border-rose"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <p className="hidden sm:block w-24 text-right font-display font-bold text-espresso">
                {formatNaira(i.price * i.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-clay/15 bg-white/60 px-5 py-4">
        <span className="text-xs uppercase tracking-wider font-semibold text-clay">Total Due on Arrival</span>
        <span className="font-display text-xl sm:text-2xl font-bold text-espresso">{formatNaira(total)}</span>
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleCheckout} className="mt-8 space-y-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-clay">
            Delivery &amp; Customer Details
          </p>
          <p className="text-xs text-espresso/60 mt-0.5">Please provide your details so we can fulfill your order.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-espresso mb-1">Full Name *</label>
            <input
              required
              placeholder="e.g. Amara Okafor"
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
              placeholder="e.g. amara@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-espresso mb-1">Delivery Address *</label>
            <textarea
              required
              placeholder="Street address, apartment, or salon pickup note"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-clay/25 bg-white px-4 py-3 text-espresso focus:border-rose focus:outline-none shadow-2xs"
            />
          </div>
        </div>

        <div className="rounded-xl bg-stone/40 border border-clay/15 p-3.5 text-xs text-espresso/75 leading-relaxed">
          💳 <strong>No upfront card payment required.</strong> Payment is collected directly on arrival or upon package delivery.
        </div>

        {error && (
          <div className="rounded-xl bg-rose/10 border border-rose/20 p-3 text-xs text-rose font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-espresso px-7 py-3.5 text-sm font-semibold text-cream shadow-md transition-all hover:bg-rose active:scale-98 disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place order (pay on arrival) →"}
        </button>
      </form>
    </div>
  );
}
