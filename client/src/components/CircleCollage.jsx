export default function CircleCollage({ className = "" }) {
  const circles = [
    {
      sizeClass: "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36",
      posClass: "top-[2%] right-[8%] sm:right-[6%]",
      image: "/images/hero_braids.jpg",
      label: "Braids",
      alt: "Knotless Braids",
    },
    {
      sizeClass: "w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44",
      posClass: "top-[26%] right-[34%] sm:right-[26%] md:right-[22%]",
      image: "/images/hero_locs.jpg",
      label: "Locs",
      alt: "Locs Retwist",
    },
    {
      sizeClass: "w-24 h-24 sm:w-32 sm:h-32 md:w-38 md:h-38",
      posClass: "top-[24%] right-[2%] sm:right-[0%]",
      image: "/images/hero_weave.jpg",
      label: "Weave",
      alt: "Ghana Weaving",
    },
    {
      sizeClass: "w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64",
      posClass: "top-[52%] right-[14%] sm:right-[10%] md:right-[8%]",
      image: "/images/hero_curls.jpg",
      label: "Styling & Curls",
      alt: "Silk Press & Curls",
    },
  ];

  return (
    <div className={`relative mx-auto h-[340px] sm:h-[430px] md:h-[530px] w-full max-w-[360px] sm:max-w-[460px] md:max-w-none select-none ${className}`} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 520">
        <path className="arc-line" d="M 300 90 Q 250 180 260 240" stroke="#9E4759" strokeWidth="1.5" fill="none" strokeDasharray="4 4" opacity="0.4" />
        <path className="arc-line" d="M 260 260 Q 280 340 310 400" stroke="#CBB9AA" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
      {circles.map((c, i) => (
        <div
          key={i}
          className={`group absolute rounded-full shadow-xl sm:shadow-2xl ring-2 sm:ring-4 ring-cream/90 flex items-end justify-center overflow-hidden transition-transform duration-500 hover:scale-105 ${c.sizeClass} ${c.posClass}`}
        >
          <img
            src={c.image}
            alt={c.alt}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
          <span className="relative z-10 mb-2 sm:mb-3 font-display text-[10px] sm:text-xs tracking-wider sm:tracking-widest text-cream font-medium uppercase drop-shadow-md">
            {c.label}
          </span>
        </div>
      ))}
      <div className="absolute left-2 sm:left-0 top-2 sm:top-4 flex h-3 gap-1.5 sm:gap-2">
        <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose/60 animate-pulse" />
        <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-clay/60" />
        <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-clay/60" />
      </div>
    </div>
  );
}
