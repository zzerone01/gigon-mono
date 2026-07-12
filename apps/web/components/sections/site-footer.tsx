import Link from "next/link";

import { Logo } from "@repo/ui/brand/logo";
import { siteConfig } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Open the web app", href: siteConfig.appUrl },
      { label: "Get it on Google Play", href: siteConfig.playStoreUrl },
      { label: "Download on the App Store", href: siteConfig.appStoreUrl },
      { label: "How it works", href: "#how" },
      { label: "For business", href: "#business" },
      { label: "For workers", href: "#workers" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Why GigOn", href: "#why" },
      { label: "Join the waitlist", href: "#waitlist" },
      { label: "Contact", href: `mailto:${siteConfig.contactEmail}` },
    ],
  },
  {
    heading: "Coverage",
    links: [
      { label: "Philippines", href: "#top" },
      { label: "Nationwide rollout", href: "#waitlist" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="site-footer" className="border-t border-line bg-white">
      <div className="container-gigon py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[26em] text-sm text-slate">
              The fastest, safest way to find short, local work &mdash; near you
              and on demand.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
                {col.heading}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-slate transition-colors hover:text-royal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-[13.5px] text-slate sm:flex-row sm:items-center">
          <span>© {year} GigOn. All rights reserved.</span>
          <span>Private beta · Philippines</span>
        </div>
      </div>
    </footer>
  );
}
