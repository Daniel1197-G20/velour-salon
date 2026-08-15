import { Link } from "react-router-dom";
import { formatNaira } from "../lib/format";

const CATEGORY_IMAGES = {
  Braiding: "/images/service_braids.jpg",
  Styling: "/images/service_styling.jpg",
  Locs: "/images/hero_locs.jpg",
  Wigs: "/images/hero_weave.jpg",
  Treatment: "/images/hero_curls.jpg",
};

export function getServiceImage(service) {
  if (service?.image && service.image.trim()) return service.image;
  return CATEGORY_IMAGES[service?.category] || "/images/service_braids.jpg";
}

export default function ServiceCard({ service }) {
  const imgSrc = getServiceImage(service);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-clay/15 bg-white/75 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-clay/30 hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden bg-stone">
        <img
          src={imgSrc}
          alt={service.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-wider uppercase text-rose backdrop-blur-md shadow-sm">
          {service.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg text-espresso group-hover:text-rose transition-colors">
          {service.name}
        </h3>
        <p className="flex-1 text-sm text-espresso/70 line-clamp-2 leading-relaxed">
          {service.description}
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-clay/10 pt-3">
          <span className="font-display text-base font-semibold text-espresso">
            {formatNaira(service.price)}
          </span>
          <span className="text-xs font-medium text-clay bg-clay/10 px-2.5 py-1 rounded-full">
            ⏱ {service.duration_minutes} mins
          </span>
        </div>
        <Link
          to={`/booking?service=${service.id}`}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-espresso px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition-all duration-200 group-hover:bg-rose hover:shadow-md"
        >
          Book this service
        </Link>
      </div>
    </div>
  );
}
