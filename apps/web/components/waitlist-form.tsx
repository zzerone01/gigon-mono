"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { usePostHog } from "@posthog/react";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { cn } from "@/lib/utils";
import { siteConfig, type Role } from "@/lib/site";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "business", label: "I'm a business" },
  { value: "worker", label: "I'm a worker" },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const STORAGE_KEY = "gigon:waitlist:joined";

/** Dedup identity: same person + same role — across any CTA (hero, final-cta…).
 *  worker and business count as separate signups, so role is part of the key. */
function joinKey(email: string, role: Role): string {
  return `${email.toLowerCase()}::${role}`;
}

/** Keys this browser has already submitted. Best-effort — clears with storage. */
function readJoined(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(
      Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [],
    );
  } catch {
    return new Set();
  }
}

function rememberJoined(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = readJoined();
    set.add(key);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage unavailable (private mode / quota) — dedup is best-effort.
  }
}

type Tone = "light" | "onRoyal";
type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm({
  source = "hero",
  tone = "light",
  defaultRole = "business",
  emailId,
  className,
}: {
  source?: string;
  tone?: Tone;
  defaultRole?: Role;
  /** Stable id for the email input, so external CTAs can focus it. */
  emailId?: string;
  className?: string;
}) {
  const onRoyal = tone === "onRoyal";
  const posthog = usePostHog();
  const [role, setRole] = React.useState<Role>(defaultRole);
  const [status, setStatus] = React.useState<Status>("idle");
  const [already, setAlready] = React.useState(false);
  const [error, setError] = React.useState("");
  const uid = React.useId();
  const inputId = emailId ?? `${uid}-email`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const email = String(formData.get("email") ?? "").trim();
    const company = String(formData.get("company") ?? ""); // honeypot

    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }

    // Already joined as this role on this device → confirm, skip the re-submit.
    // Keeps duplicates out of Formspree (e.g. hero, then again at final-cta).
    const key = joinKey(email, role);
    if (readJoined().has(key)) {
      formEl.reset();
      setAlready(true);
      setStatus("success");
      posthog?.capture("waitlist_already_joined", { role, source });
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, role, source, company }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      rememberJoined(key);
      setAlready(false);
      setStatus("success");
      formEl.reset();
      // Tie the signup to a person (keyed by email) and record the conversion.
      // `source` distinguishes which CTA converted (hero, final-cta, …).
      posthog?.identify(email, { email, role });
      posthog?.capture("waitlist_joined", { role, source });
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className={cn("flex items-start gap-3", className)} role="status">
        <CheckCircle2
          className={cn(
            "mt-0.5 size-6 shrink-0",
            onRoyal ? "text-[#7dd6a3]" : "text-success",
          )}
          strokeWidth={2.4}
        />
        <div>
          <p
            className={cn(
              "font-display text-lg font-semibold tracking-tight",
              onRoyal ? "text-white" : "text-ink",
            )}
          >
            {already ? "You’re already on the list." : "You’re on the list."}
          </p>
          <p className={cn("text-sm", onRoyal ? "text-tint/85" : "text-slate")}>
            {already
              ? "We’ve got this email saved — we’ll reach out when GigOn opens in "
              : "We’ll email you the moment GigOn goes live in "}
            {siteConfig.locationLabel}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col gap-3", className)}>
      <div
        role="radiogroup"
        aria-label="I am a"
        className={cn(
          "inline-flex self-start rounded-full p-1",
          onRoyal
            ? "border border-white/20 bg-white/10"
            : "border border-line bg-bg-soft",
        )}
      >
        {ROLE_OPTIONS.map((opt) => {
          const active = role === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRole(opt.value)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:py-1.5",
                active
                  ? onRoyal
                    ? "bg-white text-royal"
                    : "bg-royal text-white"
                  : onRoyal
                    ? "text-tint hover:text-white"
                    : "text-slate hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <Input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          required
          placeholder="you@email.com"
          aria-invalid={status === "error" || undefined}
          className={cn(
            "h-12 flex-1 text-base sm:h-11 sm:text-[15px]",
            onRoyal && "border-transparent",
          )}
          onChange={() => {
            if (status === "error") setStatus("idle");
          }}
        />

        {/* Honeypot — hidden from humans, tempting to bots. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <Button
          type="submit"
          variant="amber"
          disabled={status === "submitting"}
          className="h-12 text-base sm:h-11 sm:w-auto sm:text-sm"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Joining&hellip;
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
      </div>

      <p
        aria-live="polite"
        className={cn(
          "text-[12.5px] leading-snug",
          status === "error"
            ? "font-medium text-destructive"
            : onRoyal
              ? "text-tint/75"
              : "text-slate",
        )}
      >
        {status === "error"
          ? error
          : "No spam — just one email when GigOn opens near you."}
      </p>
    </form>
  );
}
