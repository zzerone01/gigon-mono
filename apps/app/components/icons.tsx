/** Stroke icon set ported 1:1 from the GigOn design files (24×24, lucide-style). */

const PATHS = {
  logo: "M12 2v10 M18.4 6.6a9 9 0 1 1-12.77.04",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0",
  x: "M18 6 6 18 m6 6 12 12",
  chevronDown: "m6 9 6 6 6-6",
  search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M21 21l-4.3-4.3",
  briefcase:
    "M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2 M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  switchArrows:
    "m17 2 4 4-4 4 M21 6H8a5 5 0 0 0-5 5 m7 22-4-4 4-4 M3 18h13a5 5 0 0 0 5-5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l3 2",
  mapPin:
    "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  shield: "M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3Z m9 12 2 2 4-4",
  card: "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  check: "M20 6 9 17l-5-5",
  star: "M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7-6-3.3-6 3.3 1.3-6.7-5-4.6 6.8-.8L12 2z",
  alertTriangle:
    "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  send: "m22 2-7 20-4-9-9-4Z M22 2 11 13",
  navigate: "m3 11 19-9-9 19-2-8-8-2z",
  camera:
    "M3 7h4l2-2h6l2 2h4v13H3V7Z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  plus: "M5 12h14 M12 5v14",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 16v-4 M12 8h.01",
  map: "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z M9 3v15 M15 6v15",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  lock: "M5 11h14v11H5z M7 11V7a5 5 0 0 1 10 0v4",
  refresh: "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5",
  arrowRight: "M5 12h14 m12 5 7 7-7 7",
  cleaning:
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z",
  laundry:
    "M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z",
  delivery: "M21 8 12 3 3 8v8l9 5 9-5V8Z M3 8l9 5 M12 13l9-5 M12 13v8",
  errands:
    "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Z M3 6h18 M16 10a4 4 0 0 1-8 0",
} as const;

export type IconName = keyof typeof PATHS;

export const GIG_TYPE_ICON: Record<string, IconName> = {
  Cleaning: "cleaning",
  Laundry: "laundry",
  Delivery: "delivery",
  Errands: "errands",
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  fill,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d={PATHS[name]}
        fill={fill ?? "none"}
        stroke={fill ? "none" : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
