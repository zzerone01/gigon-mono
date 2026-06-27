import { SiteHeader } from "@/components/sections/site-header";
import { Hero } from "@/components/sections/hero";
import { ProblemStrip } from "@/components/sections/problem-strip";
import { AudienceSplit } from "@/components/sections/audience-split";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyGigOn } from "@/components/sections/why-gigon";
import { FinalCta } from "@/components/sections/final-cta";
import { SiteFooter } from "@/components/sections/site-footer";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";

export default function Home() {
  return (
    <>
      <a
        href="#waitlist"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-royal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to waitlist
      </a>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemStrip />
        <AudienceSplit />
        <HowItWorks />
        <WhyGigOn />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyMobileCta />
    </>
  );
}
