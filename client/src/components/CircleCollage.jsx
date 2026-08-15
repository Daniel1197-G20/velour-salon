export default function CircleCollage({ className = "" }) {
  const circles = [
    {
      size: 140,
      top: "2%",
      right: "6%",
      image: "/images/hero_braids.jpg",
      label: "Braids",
      alt: "Knotless Braids",
    },
    {
      size: 184,
      top: "30%",
      right: "22%",
      image: "/images/hero_locs.jpg",
      label: "Locs",
      alt: "Locs Retwist",
    },
    {
      size: 156,
      top: "28%",
      right: "-2%",
      image: "/images/hero_weave.jpg",
      label: "Weave",
      alt: "Ghana Weaving",
    },
    {
      size: 268,
      top: "56%",
      right: "8%",
      image: "/images/hero_curls.jpg",
      label: "Styling & Curls",
      alt: "Silk Press & Curls",
    },
  ];

  return (
    <div className={`relative h-[530px] w-full ${className}`} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 520">
        <path className="arc-line" d="M 300 90 Q 250 180 260 240" stroke="#9E4759" strokeWidth="1.5" fill="none" strokeDasharray="4 4" opacity="0.4" />
        <path className="arc-line" d="M 260 260 Q 280 340 310 400" stroke="#CBB9AA" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      {circles.map((c, i) => (
        <div
          key={i}
          className="group absolute rounded-full shadow-2xl ring-4 ring-cream/90 flex items-end justify-center overflow-hidden transition-transform duration-500 hover:scale-105"
          style={{ width: c.size, height: c.size, top: c.top, right: c.right }}
        >
          <img
            src={c.image}
            alt={c.alt}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/15 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
          <span className="relative z-10 mb-3 font-display text-xs tracking-widest text-cream font-medium uppercase drop-shadow-md">
            {c.label}
          </span>
        </div>
      ))}
      <div className="absolute left-0 top-4 flex h-3 gap-2">
        <span className="h-3 w-3 rounded-full bg-rose/60 animate-pulse" />
        <span className="h-3 w-3 rounded-full bg-clay/60" />
        <span className="h-3 w-3 rounded-full bg-clay/60" />
      </div>
    </div>
  );
}
