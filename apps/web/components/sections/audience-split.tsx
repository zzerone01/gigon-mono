import {
  Building2,
  Clock,
  MapPin,
  Star,
  UserRound,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { cn } from "@/lib/utils";

type Feature = { icon: LucideIcon; title: string; desc: string };

const BUSINESS: Feature[] = [
  {
    icon: Clock,
    title: "Hands when you need them",
    desc: "Post a 1–3 hour gig and match in minutes, not days.",
  },
  {
    icon: MapPin,
    title: "Only nearby workers",
    desc: "Everyone you see is within walking distance, so they actually show up.",
  },
  {
    icon: Star,
    title: "Know before you book",
    desc: "Ratings and reviews from real jobs, not anonymous profiles.",
  },
];

const WORKER: Feature[] = [
  {
    icon: MapPin,
    title: "Work near you",
    desc: "See paid gigs within 1–3 km on a simple map, closest first.",
  },
  {
    icon: Zap,
    title: "Fill the gaps",
    desc: "Turn a free hour between commitments into real cash.",
  },
  {
    icon: Wallet,
    title: "Paid on the spot",
    desc: "Get 100% of the agreed pay in cash, confirmed in the app.",
  },
];

function AudienceCard({
  id,
  tag,
  tagIcon: TagIcon,
  title,
  who,
  features,
  variant,
}: {
  id?: string;
  tag: string;
  tagIcon: LucideIcon;
  title: string;
  who: string;
  features: Feature[];
  variant: "light" | "royal";
}) {
  const royal = variant === "royal";
  return (
    <div
      id={id}
      className={cn(
        "h-full rounded-2xl border p-8 transition-shadow sm:p-9",
        royal
          ? "border-royal bg-royal text-white"
          : "border-line bg-white hover:shadow-card",
      )}
    >
      <span
        className={cn(
          "mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold",
          royal ? "bg-white/15 text-white" : "bg-tint text-royal-dark",
        )}
      >
        <TagIcon className="size-3.5" />
        {tag}
      </span>

      <h3
        className={cn(
          "font-display text-2xl font-bold tracking-tight",
          royal ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h3>
      <p className={cn("mt-2 text-[15px]", royal ? "text-[#bcd0f2]" : "text-slate")}>
        {who}
      </p>

      <ul className="mt-6 flex flex-col gap-5">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.title} className="flex gap-3.5">
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                  royal ? "bg-white/15 text-white" : "bg-tint text-royal",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>
                <b
                  className={cn(
                    "block font-semibold",
                    royal ? "text-white" : "text-ink",
                  )}
                >
                  {f.title}
                </b>
                <span
                  className={cn(
                    "text-[15px]",
                    royal ? "text-[#cdd9f0]" : "text-slate",
                  )}
                >
                  {f.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AudienceSplit() {
  return (
    <section id="business" className="py-14 md:py-24">
      <div className="container-gigon">
        <Reveal>
          <SectionHeading
            kicker="Two sides, one marketplace"
            title="Built for the people who need the work, and the people who do it."
            sub="Whichever side you’re on, GigOn is designed around the same thing: speed and trust, close to home."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal className="h-full">
            <AudienceCard
              variant="light"
              tag="For business"
              tagIcon={Building2}
              title="Need hands fast?"
              who="Spas, restaurants, bars, and shops covering a rush or a sudden no-show."
              features={BUSINESS}
            />
          </Reveal>
          <Reveal className="h-full" delay={100}>
            <AudienceCard
              id="workers"
              variant="royal"
              tag="For workers"
              tagIcon={UserRound}
              title="Looking for work nearby?"
              who="Anyone with a spare hour who wants paid work a short walk away."
              features={WORKER}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
