/** Typography helpers shared by the legal pages. */

export function LegalHeader({ title, updated }: { title: string; updated: string }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight md:text-[32px]">
        {title}
      </h1>
      <p className="text-xs text-ink-muted">Last updated: {updated}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 flex flex-col gap-2.5">
      <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2.5 text-[13.5px] leading-relaxed text-ink-body">
        {children}
      </div>
    </section>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-tint p-4 text-[13px] leading-relaxed text-royal-dark">
      {children}
    </div>
  );
}
