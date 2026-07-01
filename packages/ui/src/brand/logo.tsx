import { Power } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

const sizeMap = {
  sm: { tile: "size-8 rounded-[9px]", icon: "size-[18px]", word: "text-lg" },
  md: {
    tile: "size-9 rounded-[10px]",
    icon: "size-[22px]",
    word: "text-[21px]",
  },
  lg: { tile: "size-11 rounded-xl", icon: "size-6", word: "text-2xl" },
} as const

type LogoSize = keyof typeof sizeMap
type LogoTone = "default" | "inverted"

/** The GigOn mark on its own — a power glyph on the royal tile. */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: LogoSize
  className?: string
}) {
  const s = sizeMap[size]
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center bg-royal text-white shadow-[0_4px_12px_rgba(16,63,150,0.25)]",
        s.tile,
        className
      )}
    >
      <Power className={s.icon} strokeWidth={2.6} />
    </span>
  )
}

/** Full lockup: mark + "GigOn" wordmark. Wrap in a link where needed. */
export function Logo({
  size = "md",
  tone = "default",
  showWordmark = true,
  className,
}: {
  size?: LogoSize
  tone?: LogoTone
  showWordmark?: boolean
  className?: string
}) {
  const s = sizeMap[size]
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            "font-display font-bold leading-none tracking-tight",
            s.word,
            tone === "inverted" ? "text-white" : "text-ink"
          )}
        >
          Gig
          <span className={tone === "inverted" ? "text-amber" : "text-royal"}>
            On
          </span>
        </span>
      )}
    </span>
  )
}
