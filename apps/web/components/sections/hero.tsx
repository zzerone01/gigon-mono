import { MapPin, Star, Wallet, type LucideIcon } from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";
import { MapPreview } from "@/components/sections/map-preview";
import { siteConfig } from "@/lib/site";

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: MapPin, label: "Nearby only" },
  { icon: Star, label: "Rated both ways" },
  { icon: Wallet, label: "Paid in cash" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container-gigon grid gap-y-7 py-9 md:grid-cols-2 md:items-center md:gap-x-12 md:gap-y-6 md:py-24">
        {/* Copy */}
        <div className="md:col-start-1 md:row-start-1">
          <Badge size="lg" className="mb-4">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Now in private beta · {siteConfig.region}
          </Badge>

          <h1 className="text-balance text-[clamp(2.5rem,8vw,4.2rem)] leading-[1.04] text-ink">
            Your gig is <span className="text-royal">on</span>.
          </h1>

          <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-slate sm:text-xl">
            Short, local gigs matched with trusted people nearby. Post or pick up
            a <strong className="font-semibold text-ink">1–3 hour job</strong> in
            minutes — not days.
          </p>
        </div>

        {/* Signature visual — mobile: between copy and form; desktop: right column */}
        <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
          <Reveal>
            <MapPreview />
          </Reveal>
        </div>

        {/* Conversion */}
        <div id="waitlist" className="scroll-mt-20 md:col-start-1 md:row-start-2">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
            <WaitlistForm source="hero" emailId="waitlist-email" />
          </div>
          <ul className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[13px] font-medium text-slate">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.label} className="inline-flex items-center gap-1.5">
                  <Icon className="size-3.5 text-royal" />
                  {t.label}
                </li>
              );
            })}
          </ul>
          <p className="mt-2.5 px-1 text-[13px] text-slate">
            Already in the beta?{" "}
            <a
              href={siteConfig.appUrl}
              className="font-semibold text-royal underline-offset-2 hover:underline"
            >
              Open the app &rarr;
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
