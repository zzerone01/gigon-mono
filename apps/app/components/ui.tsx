"use client";

import { type ReactNode } from "react";

/** Mono state-machine badge (APPLIED / MATCHED / LIVE …). */
export function MonoBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-[0.1em]"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`anim-blink inline-block size-[7px] shrink-0 rounded-full bg-success ${className}`}
    />
  );
}

export function Avatar({
  name,
  size = 42,
  className = "bg-tint text-royal-dark",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {name}
    </span>
  );
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-[13px] text-xs font-medium ${
        active
          ? "border-royal bg-royal text-white"
          : "border-line bg-white text-slate"
      }`}
    >
      {label}
    </button>
  );
}

/** Design-standard progress stepper (17px dots + mono codes). */
export function MiniStepper({ codes, index }: { codes: string[]; index: number }) {
  return (
    <div className="flex items-center">
      {codes.map((code, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <div key={code} className="contents">
            <div className="flex shrink-0 items-center gap-[5px]">
              <span
                className="flex size-[17px] items-center justify-center rounded-full border-[1.5px]"
                style={{
                  background: done ? "#103F96" : current ? "#F5A623" : "#FFFFFF",
                  borderColor: done ? "#103F96" : current ? "#F5A623" : "#E2E7EF",
                }}
              >
                {done ? (
                  <svg width={9} height={9} viewBox="0 0 24 24">
                    <path
                      d="M20 6 9 17l-5-5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={3.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    className="text-[8.5px] font-bold"
                    style={{ color: current ? "#0F1B2E" : "#8A93A3" }}
                  >
                    {i + 1}
                  </span>
                )}
              </span>
              <span
                className="font-mono text-[7.5px]"
                style={{
                  color: current ? "#0F1B2E" : done ? "#103F96" : "#8A93A3",
                  fontWeight: current ? 700 : 500,
                }}
              >
                {code}
              </span>
            </div>
            {i < codes.length - 1 && (
              <span
                className="mx-[5px] h-[2px] flex-1"
                style={{ background: done ? "#103F96" : "#E2E7EF" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Bottom-sheet scaffold: dim backdrop + slide-up panel (gigSheet). */
export function Sheet({
  onClose,
  children,
  maxHeight = "88%",
  floating = false,
  z = 40,
}: {
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
  /** Floating card (match/no-show confirms) instead of docked sheet. */
  floating?: boolean;
  z?: number;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end" style={{ zIndex: z }}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="anim-fade absolute inset-0 cursor-pointer bg-[rgba(15,27,46,0.45)]"
      />
      <div
        className={
          floating
            ? "anim-sheet relative mx-3 mb-3.5 flex flex-col gap-3 rounded-[18px] bg-white p-[18px] shadow-[0_24px_48px_rgba(15,27,46,0.3)]"
            : "anim-sheet relative flex flex-col rounded-t-[18px] bg-white shadow-[0_-12px_40px_rgba(15,27,46,0.25)]"
        }
        style={floating ? undefined : { maxHeight }}
      >
        {children}
      </div>
    </div>
  );
}

export function Grabber() {
  return (
    <div className="flex shrink-0 items-center justify-center pb-0.5 pt-[9px]">
      <div className="h-1 w-10 rounded-full bg-line" />
    </div>
  );
}

export function amberBtn(extra = "") {
  return `flex items-center justify-center gap-2 rounded-[10px] bg-amber font-semibold text-ink transition-colors hover:bg-[#E99B16] disabled:cursor-not-allowed ${extra}`;
}
