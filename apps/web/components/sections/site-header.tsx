"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="container-gigon flex h-16 items-center justify-between gap-3 md:h-[70px] md:gap-4">
        <Link href="#top" aria-label="GigOn — home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-slate transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link href="#how">How it works</Link>
          </Button>
          <Button asChild size="sm" className="md:h-11 md:px-5 md:text-sm">
            <Link href="#waitlist">
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Join the waitlist</span>
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-md border border-line text-ink transition-colors hover:bg-tint-soft md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <nav
            aria-label="Mobile"
            className="container-gigon flex flex-col py-2"
          >
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 text-[15px] font-medium text-ink last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mb-2 mt-3">
              <Link href="#waitlist" onClick={() => setOpen(false)}>
                Join the waitlist
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
