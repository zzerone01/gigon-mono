"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { api } from "@/lib/api";
import { MACTAN_CENTER } from "@/lib/geo";

type Role = "worker" | "employer";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("worker");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    if (!name.trim()) {
      setError("Tell us your name.");
      return;
    }
    setBusy(true);
    setError("");

    if (role === "employer") {
      const redeemed = await api
        .post<{ ok: boolean }>("/api/invites/redeem", {
          code: invite,
          businessName: businessName || name,
        })
        .catch(() => ({ ok: false }));
      if (!redeemed.ok) {
        setBusy(false);
        setError("That invite code isn't valid. Pilot businesses are invite-only.");
        return;
      }
    }

    // Best-effort browser geolocation; falls back to the pilot-zone center.
    // The outer timer also covers a permission prompt that's never answered.
    const coords = await new Promise<{ lat: number; lng: number }>((resolve) => {
      if (!navigator.geolocation) return resolve(MACTAN_CENTER);
      const fallback = setTimeout(() => resolve(MACTAN_CENTER), 8000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallback);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(fallback);
          resolve(MACTAN_CENTER);
        },
        { timeout: 4000 },
      );
    });

    try {
      await api.post("/api/onboarding", {
        name,
        role,
        area: "Philippines",
        lat: coords.lat,
        lng: coords.lng,
      });
    } catch (err2) {
      setBusy(false);
      setError((err2 as Error).message);
      return;
    }
    setBusy(false);
    router.replace(role === "employer" ? "/business" : "/");
    router.refresh();
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-white shadow-[0_0_60px_rgba(15,27,46,0.08)]">
      <div className="flex gap-[5px] px-7 pt-[18px]">
        <span className="h-1 w-6 rounded-full bg-royal" />
        <span className="h-1 w-6 rounded-full bg-royal" />
        <span className="h-1 w-6 rounded-full bg-line" />
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-6 pt-6">
        <div className="flex flex-col gap-1.5 px-1">
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight">
            How will you use GigOn?
          </h1>
          <p className="text-[13px] text-slate">
            One account, one active role — switch any time in the menu.
          </p>
        </div>

        {(
          [
            {
              key: "worker" as Role,
              icon: "briefcase" as const,
              title: "I'm looking for work",
              body: "See paid gigs within walking distance. Free — you keep 100% of your pay.",
            },
            {
              key: "employer" as Role,
              icon: "card" as const,
              title: "I'm hiring for my business",
              body: "Post 1–3 hour gigs and match in minutes. Invite code required during the pilot.",
            },
          ]
        ).map((r) => {
          const on = role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex items-start gap-3.5 rounded-[14px] border-[1.5px] p-4 py-[18px] text-left ${
                on ? "border-royal bg-tint-soft" : "border-line bg-white"
              }`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-tint text-royal">
                <Icon name={r.icon} size={22} />
              </span>
              <span className="flex flex-1 flex-col gap-[3px]">
                <span className="text-[15.5px] font-semibold">{r.title}</span>
                <span className="text-[12.5px] leading-relaxed text-slate">{r.body}</span>
              </span>
              <span
                className={`mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                  on ? "border-royal" : "border-line-dashed"
                }`}
              >
                {on && <span className="size-[9px] rounded-full bg-royal" />}
              </span>
            </button>
          );
        })}

        <label className="flex flex-col gap-1.5 px-1">
          <span className="text-[12.5px] font-semibold">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className="h-11 rounded-[10px] border border-line px-[13px] text-sm outline-none focus:border-royal"
          />
        </label>

        {role === "employer" && (
          <div className="anim-fade flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 px-1">
              <span className="text-[12.5px] font-semibold">Business name</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Kape Lokal"
                className="h-11 rounded-[10px] border border-line px-[13px] text-sm outline-none focus:border-royal"
              />
            </label>
            <label className="flex flex-col gap-1.5 px-1">
              <span className="text-[12.5px] font-semibold">Invite code</span>
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value.toUpperCase())}
                placeholder="MACTAN-30"
                className="h-11 rounded-[10px] border border-line bg-tint-soft px-[13px] font-mono text-sm font-semibold tracking-[0.08em] text-royal outline-none focus:border-royal"
              />
              <span className="text-[11px] text-ink-muted">
                Pilot merchants are invite-verified by the GigOn team.
              </span>
            </label>
          </div>
        )}

        {error && <p className="px-1 text-[12.5px] font-semibold text-red">{error}</p>}

        <div className="mt-1 flex items-start gap-2.5 rounded-[14px] bg-bg-soft p-3.5 px-3.5">
          <Icon name="shield" size={16} color="#1AA75A" className="mt-px shrink-0" />
          <span className="text-xs leading-relaxed text-slate">
            GigOn shows the gigs closest to you — around 2–3 km in the pilot zone. Businesses only see your approximate distance —
            e.g. “400 m away”. We&apos;ll ask the browser for location; you can decline.
          </span>
        </div>
      </div>
      <div className="px-6 pb-6 pt-4">
        <button
          onClick={finish}
          disabled={busy}
          className="h-[50px] w-full rounded-[10px] bg-royal text-[15px] font-semibold text-white hover:bg-royal-dark disabled:opacity-60"
        >
          {busy ? "Setting up…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
