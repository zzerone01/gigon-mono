"use client";

import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";

import { MACTAN_CENTER } from "@/lib/geo";
import type { GigWithEmployer } from "@/lib/domain";
import { Icon } from "./icons";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

export const HAS_MAPS_KEY = !!MAPS_KEY;

/**
 * Center-pin location picker for the post form: pan the map, the pin stays
 * centered and `onMove` reports the new center. Renders nothing without a
 * Maps key — the caller keeps its SVG-art fallback.
 */
export function LocationPicker({
  center,
  onMove,
}: {
  center: { lat: number; lng: number };
  onMove: (c: { lat: number; lng: number }) => void;
}) {
  if (!MAPS_KEY) return null;
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={16}
        gestureHandling="greedy"
        disableDefaultUI
        className="absolute inset-0"
        onCameraChanged={(e) => onMove(e.detail.center)}
      />
      <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center drop-shadow-[0_3px_6px_rgba(15,27,46,0.25)]">
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-royal">
          <Icon name="mapPin" size={13} color="#fff" strokeWidth={2.2} />
        </span>
        <span className="size-0 border-x-4 border-t-[5px] border-x-transparent border-t-royal" />
      </span>
    </APIProvider>
  );
}

interface MapViewProps {
  gigs: GigWithEmployer[];
  you: { lat: number; lng: number };
  appliedIds: Set<string>;
  onOpen: (gig: GigWithEmployer) => void;
}

/** Price map-pin (label + pointer), shared by both map backends. */
function PricePin({ pay, applied }: { pay: number; applied: boolean }) {
  const bg = applied ? "#1AA75A" : "#103F96";
  return (
    <span className="anim-bob flex flex-col items-center drop-shadow-[0_3px_6px_rgba(15,27,46,0.25)]">
      <span
        className="rounded-lg px-2.5 py-[5px] font-display text-[12.5px] font-bold tracking-tight text-white"
        style={{ background: bg }}
      >
        ₱{pay}
      </span>
      <span
        className="size-0 border-x-[6px] border-t-[7px] border-x-transparent"
        style={{ borderTopColor: bg }}
      />
    </span>
  );
}

function YouDot() {
  return (
    <span className="relative flex size-[17px] items-center justify-center">
      <span className="anim-pulse-ring absolute size-[52px] rounded-full bg-amber opacity-30" />
      <span className="relative size-[17px] rounded-full border-[3px] border-white bg-amber shadow-[0_1px_5px_rgba(15,27,46,0.35)]" />
      <span className="absolute top-5 whitespace-nowrap rounded-full bg-ink px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.04em] text-white">
        YOU
      </span>
    </span>
  );
}

/**
 * Real map when a Google Maps key is configured (the familiar map for PH
 * users); otherwise the stylized Mactan SVG from the design as a fallback.
 */
export function MapView({ gigs, you, appliedIds, onOpen }: MapViewProps) {
  if (MAPS_KEY) {
    return (
      <APIProvider apiKey={MAPS_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={MACTAN_CENTER}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI
          className="absolute inset-0"
        >
          <AdvancedMarker position={you} zIndex={2}>
            <YouDot />
          </AdvancedMarker>
          {gigs.map((g) => (
            <AdvancedMarker
              key={g.id}
              position={{ lat: g.lat, lng: g.lng }}
              zIndex={3}
              onClick={() => onOpen(g)}
            >
              <PricePin pay={g.pay} applied={appliedIds.has(g.id)} />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    );
  }

  return <SvgMap gigs={gigs} you={you} appliedIds={appliedIds} onOpen={onOpen} />;
}

/* ---------------- stylized SVG fallback (no API key needed) ---------------- */

const SPAN = 0.024; // degrees mapped onto the art, centered on Mactan

function pct(v: number, center: number): string {
  const p = 50 + ((v - center) / SPAN) * 50;
  return `${Math.min(93, Math.max(7, p))}%`;
}

function SvgMap({ gigs, you, appliedIds, onOpen }: MapViewProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 412 640"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <rect width={412} height={640} fill="#F2F6FC" />
        <path
          d="M316 0 L412 0 L412 640 L236 640 C270 520 322 468 310 380 C298 296 352 238 332 150 C322 102 310 56 316 0 Z"
          fill="#CDD9F0"
        />
        <path
          d="M316 0 C310 56 322 102 332 150 C352 238 298 296 310 380 C322 468 270 520 236 640"
          fill="none"
          stroke="#B3C5E8"
          strokeWidth={1.5}
        />
        <rect x={36} y={88} width={82} height={54} rx={8} fill="#E7EDF8" />
        <rect x={180} y={470} width={66} height={44} rx={8} fill="#E7EDF8" />
        <path d="M0 214 L412 108" stroke="#DFE6F2" strokeWidth={16} />
        <path d="M0 214 L412 108" stroke="#FFFFFF" strokeWidth={12} />
        <path d="M96 0 L136 640" stroke="#FFFFFF" strokeWidth={8} />
        <path d="M0 356 L340 402" stroke="#FFFFFF" strokeWidth={8} />
        <path d="M0 500 L280 540" stroke="#FBFCFE" strokeWidth={6} />
        <path d="M236 0 L258 180" stroke="#FBFCFE" strokeWidth={6} />
        <path d="M170 120 L200 640" stroke="#FBFCFE" strokeWidth={5} />
        <text x={66} y={170} fontSize={10} fill="#8A93A3">Pusok</text>
        <text x={52} y={392} fontSize={10} fill="#8A93A3">Basak</text>
        <text x={212} y={556} fontSize={10} fill="#8A93A3">Marigondon</text>
        <text x={268} y={318} fontSize={10} fill="#8A93A3">Mactan Newtown</text>
        <circle
          cx={200}
          cy={352}
          r={205}
          fill="none"
          stroke="#103F96"
          strokeWidth={1.5}
          strokeDasharray="7 7"
          opacity={0.4}
        />
      </svg>
      <div
        className="absolute z-2 -translate-x-1/2 -translate-y-1/2"
        style={{ left: pct(you.lng, MACTAN_CENTER.lng), top: pct(-you.lat, -MACTAN_CENTER.lat) }}
      >
        <YouDot />
      </div>
      {gigs.map((g, i) => (
        <button
          key={g.id}
          onClick={() => onOpen(g)}
          className="absolute z-3 -translate-x-1/2 -translate-y-full"
          style={{
            left: pct(g.lng, MACTAN_CENTER.lng),
            top: pct(-g.lat, -MACTAN_CENTER.lat),
            animationDelay: `${(i % 4) * 0.3}s`,
          }}
        >
          <PricePin pay={g.pay} applied={appliedIds.has(g.id)} />
        </button>
      ))}
    </div>
  );
}
