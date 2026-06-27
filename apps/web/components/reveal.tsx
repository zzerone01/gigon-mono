"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Fades + lifts its children into view once, on scroll.
 *
 * Robust by construction: the element renders visible on the server, so it is
 * never hidden for crawlers or users without JavaScript. The hidden→reveal
 * animation is applied purely in CSS (`html.js .gigon-reveal`, see globals.css)
 * and is skipped entirely under prefers-reduced-motion. This component only
 * flips the `is-revealed` class when the element scrolls into view.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => el.classList.add("is-revealed");

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      reveal();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("gigon-reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
