import { formatNaira } from "../lib/format";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const PRODUCT_IMAGES = {
  "Edge Control Gel": "/images/hero_weave.jpg",
  "Braiding Hair Bundle (Jumbo)": "/images/hero_braids.jpg",
  "Loc Retwist Gel": "/images/hero_locs.jpg",
  "Silk Bonnet": "/images/hero_curls.jpg",
  "Scalp Oil Treatment": "/images/service_styling.jpg",
  "Wig Care Kit": "/images/service_braids.jpg",
};

export function getProductImage(product) {
  if (product?.image && product.image.trim()) return product.image;
  return PRODUCT_IMAGES[product?.name] || "/images/hero_curls.jpg";
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;
  const imgSrc = getProductImage(product);

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-clay/15 bg-white/75 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-clay/30 hover:-translate-y-1">
      <div className="relative h-44 w-full overflow-hidden bg-stone">
        <img
          src={imgSrc}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
        <span
          className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-md shadow-sm ${
            outOfStock ? "bg-rose/90 text-white" : "bg-white/90 text-espresso"
          }`}
        >
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-base text-espresso group-hover:text-rose transition-colors">
          {product.name}
        </h3>
        <p className="flex-1 text-sm text-espresso/70 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-clay/10 pt-3">
          <span className="font-display text-base font-semibold text-espresso">
            {formatNaira(product.price)}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`mt-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm ${
            added
              ? "bg-clay text-cream"
              : outOfStock
              ? "cursor-not-allowed bg-espresso/20 text-espresso/40 shadow-none"
              : "bg-espresso text-cream hover:bg-rose hover:shadow-md"
          }`}
        >
          {added ? "Added to cart ✓" : outOfStock ? "Unavailable" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
