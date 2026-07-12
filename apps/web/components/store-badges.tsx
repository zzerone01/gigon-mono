import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

/**
 * Official store badges (Apple SVG + trimmed Google PNG in /public/badges).
 * Heights are matched visually — the Play badge artwork ships with padding,
 * so it was pre-trimmed by the download script rather than fudged with CSS.
 */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        href={siteConfig.appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download GigOn on the App Store"
        className="transition-opacity hover:opacity-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset */}
        <img
          src="/badges/app-store.svg"
          alt="Download on the App Store"
          className="h-12 w-auto"
        />
      </a>
      <a
        href={siteConfig.playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get GigOn on Google Play"
        className="transition-opacity hover:opacity-80"
      >
        <Image
          src="/badges/google-play.png"
          alt="Get it on Google Play"
          width={403}
          height={120}
          className="h-12 w-auto"
        />
      </a>
    </div>
  );
}
