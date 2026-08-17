import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/shop", label: "Shop" },
  { to: "/booking", label: "Book Appointment" },
];

export default function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-clay/15 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-baseline gap-1.5 sm:gap-2 focus:outline-none"
        >
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-espresso">
            Velour
          </span>
          <span className="script-accent text-base sm:text-lg text-rose font-medium">
            hairs &amp; beauty
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-7 lg:gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-body text-sm tracking-wide transition-colors py-1 ${
                  isActive
                    ? "text-rose font-semibold border-b-2 border-rose -mb-[2px]"
                    : "text-espresso/80 hover:text-rose"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Action icons (Cart, Call, Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Call Icon on mobile */}
          <a
            href="tel:08103043035"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-clay/20 bg-white/70 text-espresso transition-colors hover:border-rose hover:text-rose sm:hidden"
            aria-label="Call salon directly"
            title="Call 0810 304 3035"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-clay/30 bg-white/70 text-espresso transition-colors hover:border-rose hover:text-rose"
            aria-label={`Shopping cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose text-[10px] font-bold text-cream shadow-xs animate-scale-in">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-clay/25 bg-white/70 text-espresso p-1.5 transition-colors hover:border-rose md:hidden focus:outline-none"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="md:hidden border-t border-clay/15 bg-cream/98 px-4 py-4 shadow-xl backdrop-blur-lg">
          <nav className="flex flex-col gap-1.5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-espresso text-cream font-semibold shadow-xs"
                      : "text-espresso/80 active:bg-stone/60 hover:bg-white/60"
                  }`
                }
              >
                <span>{l.label}</span>
                <span className="text-xs opacity-50">→</span>
              </NavLink>
            ))}

            {/* Quick Call in Drawer */}
            <a
              href="tel:08103043035"
              className="mt-2 flex items-center justify-between rounded-xl border border-clay/20 bg-white/70 px-4 py-3 text-xs font-semibold text-espresso active:bg-stone"
            >
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>Call Salon: 0810 304 3035</span>
              </div>
              <span className="text-rose font-bold">Call Now</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
