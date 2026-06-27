"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Mobile-only sticky "Join the waitlist" bar.
 *
 * Keeps the primary action one tap away while the visitor reads the page, then
 * gets out of the way at the top (hero form on screen) and the bottom (the
 * closing CTA / footer on screen, so it never covers the real form). Tapping it
 * scrolls to the hero form and focuses the email field.
 */
export function StickyMobileCta() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const ids = ["waitlist", "final-cta", "site-footer"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Visible only "in between" — past the hero form, before the closing CTA.
        setShow(visible.size === 0);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function goToForm() {
    const input = document.getElementById("waitlist-email");
    const target = document.getElementById("waitlist") ?? input;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (input instanceof HTMLInputElement) {
      window.setTimeout(() => input.focus({ preventScroll: true }), 480);
    }
  }

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-line bg-white/95 px-4 pt-3 backdrop-blur",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button
        type="button"
        variant="amber"
        onClick={goToForm}
        tabIndex={show ? 0 : -1}
        className="h-12 w-full text-base"
      >
        Join the waitlist
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
