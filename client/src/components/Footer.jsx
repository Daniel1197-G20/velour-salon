import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-clay/15 bg-stone">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-espresso">
            Velour <span className="script-accent text-rose">hairs &amp; beauty</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-espresso/70">
            Your hair deserves the best care. Step in, relax, and let us bring out your true beauty.
          </p>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-widest text-clay">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-espresso/80">
            <Link to="/services" className="hover:text-rose">Services</Link>
            <Link to="/shop" className="hover:text-rose">Shop</Link>
            <Link to="/booking" className="hover:text-rose">Book an appointment</Link>
          </div>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-widest text-clay">Visit &amp; call</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-espresso/80">
            <a href="tel:08103043035" className="hover:text-rose">0810 304 3035</a>
            <span>Mon – Sat, 9am – 7pm</span>
          </div>
        </div>
      </div>
      <div className="border-t border-clay/15 py-5 text-center text-xs text-espresso/50">
        © {new Date().getFullYear()} Velour Hairs &amp; Beauty. All rights reserved.
      </div>
    </footer>
  );
}
