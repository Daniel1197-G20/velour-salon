import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-14 sm:mt-24 border-t border-clay/15 bg-stone/90 pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 sm:gap-10 px-4 sm:px-6 py-10 sm:py-14 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold text-espresso">
            Velour <span className="script-accent text-rose font-medium">hairs &amp; beauty</span>
          </p>
          <p className="mt-2.5 max-w-xs text-xs sm:text-sm text-espresso/70 leading-relaxed">
            Your hair deserves the best care. Step in, relax, and let us bring out your true beauty.
          </p>
        </div>
        <div>
          <p className="font-display text-xs uppercase tracking-widest font-semibold text-clay">Explore</p>
          <div className="mt-3 flex flex-col gap-2.5 text-xs sm:text-sm text-espresso/80">
            <Link to="/services" className="hover:text-rose py-0.5 transition-colors">Services Catalog</Link>
            <Link to="/shop" className="hover:text-rose py-0.5 transition-colors">Shop Hair Products</Link>
            <Link to="/booking" className="hover:text-rose py-0.5 transition-colors">Book an Appointment</Link>
          </div>
        </div>
        <div>
          <p className="font-display text-xs uppercase tracking-widest font-semibold text-clay">Visit &amp; Call</p>
          <div className="mt-3 flex flex-col gap-2.5 text-xs sm:text-sm text-espresso/80">
            <a href="tel:08103043035" className="font-semibold text-espresso hover:text-rose inline-flex items-center gap-1.5 py-0.5">
              <span>📞</span>
              <span>0810 304 3035</span>
            </a>
            <span className="text-espresso/65">Opening Hours: Mon – Sat, 9am – 7pm</span>
            <span className="text-xs text-clay/80">Walk-ins welcome &amp; appointments prioritized</span>
          </div>
        </div>
      </div>
      <div className="border-t border-clay/15 py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-espresso/50 gap-2 text-center sm:text-left">
        <span>© {new Date().getFullYear()} Velour Hairs &amp; Beauty. All rights reserved.</span>
        <Link to="/admin" className="hover:text-rose underline sm:no-underline font-medium">
          Admin Sign In
        </Link>
      </div>
    </footer>
  );
}
