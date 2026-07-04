import Link from "next/link";

import { Icon } from "@/components/icons";

/** Shared frame for the public legal pages (/terms, /privacy). */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line px-5 md:h-[60px]">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-royal">
            <Icon name="logo" size={14} color="#fff" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">GigOn</span>
        </Link>
        <span className="flex-1" />
        <nav className="flex items-center gap-4 text-[12.5px] font-medium text-slate">
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-16 pt-8 md:pt-12">
        {children}
      </main>
      <footer className="border-t border-line-soft px-5 py-5 text-center text-[10.5px] text-ink-muted">
        © 2026 GigOn · <Link href="/terms" className="underline underline-offset-2">Terms</Link> ·{" "}
        <Link href="/privacy" className="underline underline-offset-2">Privacy</Link> ·{" "}
        <Link href="/account/delete" className="underline underline-offset-2">Delete account</Link> ·{" "}
        <a href="mailto:leo@gigon.io" className="underline underline-offset-2">
          leo@gigon.io
        </a>
      </footer>
    </div>
  );
}
