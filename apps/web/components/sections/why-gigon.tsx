import { BadgeCheck, MapPin, Star, Wallet, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/sections/section-heading";

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: MapPin,
    title: "Proximity first",
    desc: "Distance is shown up front. If it’s not walkable, it doesn’t waste your time.",
  },
  {
    icon: Star,
    title: "Two-way ratings",
    desc: "Both sides rate each job, so reliable people rise and bad actors fade.",
  },
  {
    icon: BadgeCheck,
    title: "Mutual check-out",
    desc: "A job only closes when both sides confirm it’s done and paid.",
  },
  {
    icon: Wallet,
    title: "Cash, direct",
    desc: "Workers keep 100% of their pay. GigOn never takes a cut from wages.",
  },
];

export function WhyGigOn() {
  return (
    <section id="why" className="py-14 md:py-24">
      <div className="container-gigon">
        <Reveal>
          <SectionHeading
            kicker="Why GigOn"
            title="Trust isn’t a feature here. It’s the whole point."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} className="h-full" delay={i * 80}>
                <div className="h-full rounded-2xl border border-line bg-white p-7 transition-shadow hover:shadow-card">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl bg-tint text-royal">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-slate">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
