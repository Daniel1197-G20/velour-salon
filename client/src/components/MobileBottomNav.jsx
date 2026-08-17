import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function MobileBottomNav() {
  const { count } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-clay/15 bg-cream/95 backdrop-blur-lg md:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-rose font-bold" : "text-espresso/70 hover:text-espresso"
            }`
          }
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] tracking-tight">Home</span>
        </NavLink>

        <NavLink
          to="/services"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-rose font-bold" : "text-espresso/70 hover:text-espresso"
            }`
          }
        >
          <span className="text-lg">✂️</span>
          <span className="text-[10px] tracking-tight">Services</span>
        </NavLink>

        <NavLink
          to="/booking"
          className={({ isActive }) =>
            `flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold shadow-sm transition-all active:scale-95 ${
              isActive
                ? "bg-rose text-white shadow-rose/20"
                : "bg-espresso text-cream hover:bg-rose"
            }`
          }
        >
          <span className="text-sm">📅</span>
          <span className="text-xs">Book</span>
        </NavLink>

        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-rose font-bold" : "text-espresso/70 hover:text-espresso"
            }`
          }
        >
          <span className="text-lg">🧴</span>
          <span className="text-[10px] tracking-tight">Shop</span>
          {count > 0 && (
            <span className="absolute 0 top-0.5 right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-white shadow-xs">
              {count}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? "text-rose font-bold" : "text-espresso/70 hover:text-espresso"
            }`
          }
        >
          <span className="text-lg">🛍️</span>
          <span className="text-[10px] tracking-tight">Cart</span>
          {count > 0 && (
            <span className="absolute top-0.5 right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-white shadow-xs">
              {count}
            </span>
          )}
        </NavLink>
      </div>
    </div>
  );
}
