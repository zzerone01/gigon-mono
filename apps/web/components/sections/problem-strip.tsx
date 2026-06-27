import { Reveal } from "@/components/reveal";

export function ProblemStrip() {
  return (
    <section className="container-gigon pb-4 pt-2">
      <Reveal>
        <div className="grid items-center gap-7 rounded-2xl bg-royal px-8 py-9 text-white sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-11 sm:py-10">
          <div className="font-display text-[clamp(2.4rem,5vw,3.4rem)] font-bold leading-none">
            1&ndash;3 hrs
            <span className="mt-2.5 block font-sans text-sm font-medium text-[#bcd0f2]">
              the jobs GigOn is built for
            </span>
          </div>
          <p className="text-lg leading-relaxed text-[#dde7f8]">
            Today, daily work in the Philippines lives in Facebook groups
            &mdash; with no-shows, no verification, and no guarantee you&rsquo;ll
            get paid.{" "}
            <strong className="font-semibold text-white">
              GigOn brings it into the open:
            </strong>{" "}
            nearby, rated, and confirmed by both sides.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
