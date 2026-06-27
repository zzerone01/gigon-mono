import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  sub,
  align = "left",
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[38rem]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker && (
        <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-amber-dark">
          {kicker}
        </p>
      )}
      <h2 className="text-balance text-[clamp(1.9rem,3.4vw,2.7rem)] text-ink">
        {title}
      </h2>
      {sub && <p className="mt-4 text-lg text-slate">{sub}</p>}
    </div>
  );
}
