import { MapPin } from "lucide-react";

type Pin = { price: string; top: string; left: string; delay: string };

const PINS: Pin[] = [
  { price: "₱300", top: "30%", left: "40%", delay: "0.2s" },
  { price: "₱250", top: "31%", left: "72%", delay: "1.1s" },
  { price: "₱400", top: "68%", left: "64%", delay: "0.6s" },
  { price: "₱180", top: "71%", left: "27%", delay: "1.6s" },
];

function GigPin({ price, top, left, delay }: Pin) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={{ top, left }}>
      <div
        className="flex animate-bob flex-col items-center"
        style={{ animationDelay: delay }}
      >
        <span className="rounded-full bg-amber px-2.5 py-1 font-display text-[13px] font-semibold leading-none text-ink shadow-[0_8px_18px_rgba(245,166,35,0.45)]">
          {price}
        </span>
        <span className="h-2 w-[2px] bg-amber" />
        <span className="size-2 rounded-full bg-amber ring-2 ring-white" />
      </div>
    </div>
  );
}

export function MapPreview() {
  return (
    <div
      role="img"
      aria-label="A map of paid gigs nearby, priced in pesos, around your location."
      className="relative mx-auto aspect-[5/4] w-full max-w-[440px] overflow-hidden rounded-[22px] border border-line bg-bg-soft shadow-card sm:aspect-square"
    >
      {/* Stylised street map */}
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="400" height="400" fill="#f6f9fe" />
        <rect x="232" y="38" width="158" height="118" rx="20" fill="#e7edf8" />
        <rect x="18" y="250" width="120" height="132" rx="20" fill="#eef3fb" />
        <g stroke="#dde4ef" strokeWidth="14" strokeLinecap="round">
          <line x1="-20" y1="118" x2="420" y2="118" />
          <line x1="-20" y1="272" x2="420" y2="272" />
          <line x1="150" y1="-20" x2="150" y2="420" />
          <line x1="300" y1="-20" x2="300" y2="420" />
        </g>
        <line
          x1="-20"
          y1="40"
          x2="420"
          y2="360"
          stroke="#e6ebf4"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <g
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="10 12"
          strokeLinecap="round"
        >
          <line x1="-20" y1="118" x2="420" y2="118" />
          <line x1="150" y1="-20" x2="150" y2="420" />
        </g>
      </svg>

      {/* Soft brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(280px_280px_at_50%_50%,rgba(16,63,150,0.06),transparent_70%)]" />

      {/* "Gigs near you" chip */}
      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur">
        <MapPin className="size-3.5 text-royal" />
        Gigs near you
      </div>

      {/* Live indicator */}
      <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-line bg-white/95 px-3 py-1.5 text-xs font-medium text-slate shadow-sm">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success/60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        4 gigs open now
      </div>

      {/* "You are here" marker */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="relative grid size-4 place-items-center">
          <span className="absolute inline-flex size-4 animate-ping rounded-full bg-royal/40" />
          <span className="relative size-3.5 rounded-full bg-royal ring-4 ring-white" />
        </span>
        <span className="mt-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-royal-dark shadow-sm">
          You
        </span>
      </div>

      {/* Gig price pins */}
      {PINS.map((pin) => (
        <GigPin key={pin.price + pin.top} {...pin} />
      ))}
    </div>
  );
}
