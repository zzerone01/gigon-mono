import { Reveal } from "@/components/reveal";
import { StoreBadges } from "@/components/store-badges";
import { WaitlistForm } from "@/components/waitlist-form";
import { siteConfig } from "@/lib/site";

export function FinalCta() {
  return (
    <section id="final-cta" className="container-gigon pb-16 pt-2 md:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[20px] bg-royal px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_-10%,rgba(255,255,255,0.12),transparent)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-[clamp(2rem,4vw,3rem)] text-white">
              Be first in {siteConfig.locationLabel}.
            </h2>
            <p className="mx-auto mt-3.5 max-w-[34em] text-lg text-[#cdd9f0]">
              We&rsquo;re onboarding a small group of businesses and workers for
              launch. Join the waitlist and we&rsquo;ll reach out personally.
            </p>
            <div className="mx-auto mt-7 max-w-[460px] rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left sm:p-5">
              <WaitlistForm source="final-cta" tone="onRoyal" />
            </div>
            <StoreBadges className="mt-6 justify-center" />
            <p className="mt-4 text-sm text-[#cdd9f0]">
              Already in the beta?{" "}
              <a
                href={siteConfig.appUrl}
                className="font-semibold text-white underline underline-offset-2"
              >
                Open the web app &rarr;
              </a>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
