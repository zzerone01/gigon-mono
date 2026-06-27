import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "STEP 01",
    title: "Post a gig",
    desc: "A business posts the job, the pay, and the hours. Workers nearby see it instantly.",
  },
  {
    n: "STEP 02",
    title: "Match nearby",
    desc: "Browse a map of gigs and workers close by. Pick based on ratings and distance.",
  },
  {
    n: "STEP 03",
    title: "Get it done",
    desc: "The worker arrives and does the job. The agreed pay is handed over in cash, 100%.",
  },
  {
    n: "STEP 04",
    title: "Both confirm",
    desc: "Worker and business each confirm it’s done and paid. A mismatch opens a quick dispute, not a silent loss.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-bg-soft py-14 md:py-24">
      <div className="container-gigon">
        <Reveal>
          <SectionHeading
            kicker="How it works"
            title={
              <>
                From &ldquo;I need someone&rdquo; to &ldquo;done&rdquo; &mdash;
                in four steps.
              </>
            }
          />
        </Reveal>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 80}>
              <div
                className={cn(
                  "border-t-2 pt-4",
                  i === STEPS.length - 1 ? "border-amber" : "border-line",
                )}
              >
                <div className="font-display text-[13px] font-bold tracking-[0.06em] text-amber-dark">
                  {step.n}
                </div>
                <h3 className="mt-2.5 font-display text-xl font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] text-slate">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
