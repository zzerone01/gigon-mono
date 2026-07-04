"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon, GIG_TYPE_ICON } from "@/components/icons";
import { CancelSheet, ChatSheet, RateSheet } from "@/components/sheets";
import { useToast } from "@/components/shell";
import { Chip, LiveDot, MiniStepper, MonoBadge, Sheet } from "@/components/ui";
import {
  EMPLOYER_CANCEL_REASONS,
  EMPLOYER_RATE_TAGS,
  GIG_TYPES,
  badgeStyle,
  firstName,
  historyLabel,
  initials,
  ratingLabel,
  stepIndex,
  type Application,
  type Gig,
  type Match,
  type Profile,
} from "@/lib/domain";
import { api } from "@/lib/api";
import { MACTAN_CENTER, distanceMeters, formatDistance } from "@/lib/geo";
import { supabaseBrowser } from "@/lib/supabase/client";

type AppWithWorker = Application & { worker: Profile };
type MatchWithWorker = Match & { worker: Profile };

const EMPLOYER_QUICKS = ["Supplies are inside", "Call when you arrive", "Thank you!"];

export function BusinessApp({ profile }: { profile: Profile }) {
  const supabase = supabaseBrowser();
  const toast = useToast();
  const me = profile.id;
  const bizLoc = useMemo(
    () => ({ lat: profile.lat ?? MACTAN_CENTER.lat, lng: profile.lng ?? MACTAN_CENTER.lng }),
    [profile.lat, profile.lng],
  );

  const [gig, setGig] = useState<Gig | null>(null);
  const [apps, setApps] = useState<AppWithWorker[]>([]);
  const [match, setMatch] = useState<MatchWithWorker | null>(null);
  const [hadNoShow, setHadNoShow] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const [postOpen, setPostOpen] = useState(false);
  const [confirmApp, setConfirmApp] = useState<AppWithWorker | null>(null);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [cancelMatchOpen, setCancelMatchOpen] = useState(false);
  const [cancelGigOpen, setCancelGigOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;

  /* ------------------------------ data ------------------------------ */

  const loadAll = useCallback(async () => {
    // Sweep POSTED gigs past their expiry so the console reflects EXPIRED
    await supabase.rpc("expire_stale_gigs");
    const { data: g } = await supabase
      .from("gigs")
      .select("*")
      .eq("employer_id", me)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setGig(g ?? null);
    if (!g) {
      setApps([]);
      setMatch(null);
      setHadNoShow(false);
      return;
    }
    const [appsRes, matchRes, noShowRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*, worker:profiles!applications_worker_id_fkey(*)")
        .eq("gig_id", g.id)
        .eq("status", "APPLIED")
        .order("created_at"),
      supabase
        .from("matches")
        .select("*, worker:profiles!matches_worker_id_fkey(*)")
        .eq("gig_id", g.id)
        .in("status", ["MATCHED", "IN_PROGRESS", "COMPLETED"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("matches")
        .select("id")
        .eq("gig_id", g.id)
        .eq("status", "NO_SHOW")
        .limit(1)
        .maybeSingle(),
    ]);
    setApps((appsRes.data as AppWithWorker[]) ?? []);
    const m = (matchRes.data as MatchWithWorker | null) ?? null;
    setMatch(m);
    setHadNoShow(!!noShowRes.data);
    if (m) {
      const { data: rv } = await supabase
        .from("reviews")
        .select("id")
        .eq("match_id", m.id)
        .eq("rater_id", me)
        .maybeSingle();
      setReviewed(!!rv);
    } else {
      setReviewed(false);
    }
  }, [me, supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // realtime: applicants + match progress
  useEffect(() => {
    if (!gig) return;
    const channel = supabase
      .channel(`biz-${gig.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications", filter: `gig_id=eq.${gig.id}` },
        async (payload) => {
          const workerId = (payload.new as Application).worker_id;
          const { data: w } = await supabase
            .from("profiles")
            .select("full_name, rating_sum, rating_count, lat, lng")
            .eq("id", workerId)
            .single();
          const dist = w?.lat && w?.lng ? formatDistance(distanceMeters(bizLoc, { lat: w.lat, lng: w.lng })) : "nearby";
          toast(
            "New applicant",
            `${w?.full_name ?? "A worker"} applied — ${dist} · ${w ? ratingLabel(w) : "New"}★`,
          );
          loadAll();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `employer_id=eq.${me}` },
        (payload) => {
          const next = payload.new as Match;
          const prev = payload.old as Partial<Match>;
          if (next.status === "IN_PROGRESS" && prev.status !== "IN_PROGRESS") {
            toast("Worker arrived · IN_PROGRESS", "She tapped “I've arrived” on site");
          }
          if (next.status === "COMPLETED" && prev.status !== "COMPLETED") {
            toast("PIN confirmed · COMPLETED", "Both sides confirmed — reviews unlocked");
            setPinDigits(null);
          }
          if (next.status === "CANCELLED" && next.cancelled_by !== me) {
            toast("Worker cancelled", "Recorded on their profile · your gig is live again");
            setPinDigits(null);
          }
          loadAll();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gig?.id, me, supabase, toast, loadAll, bizLoc]); // eslint-disable-line react-hooks/exhaustive-deps

  // realtime: unread chat counter
  useEffect(() => {
    if (!match) return;
    const channel = supabase
      .channel(`biz-chat-${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${match.id}` },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== me && !chatOpenRef.current) setUnread((u) => u + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [match?.id, me, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------- actions ---------------------------- */

  const confirmMatch = async () => {
    if (!confirmApp) return;
    const app = confirmApp;
    setConfirmApp(null);
    try {
      await api.post(`/api/applications/${app.id}/select`);
    } catch (error) {
      return toast("Couldn't match", (error as Error).message);
    }
    toast("Matched — the gig is on", "billable_event logged · ₱0 during pilot");
    loadAll();
  };

  const issuePin = async () => {
    if (!match) return;
    let pin: string;
    try {
      ({ pin } = await api.post<{ pin: string }>(`/api/matches/${match.id}/pin`));
    } catch (error) {
      return toast("Couldn't issue PIN", (error as Error).message);
    }
    setPinDigits(pin);
    toast(`PIN issued · ${pin.split("").join(" ")}`, "One-time · valid 24 h · tell it to your worker");
    loadAll();
  };

  const reportNoShow = async () => {
    if (!match) return;
    setNoShowOpen(false);
    try {
      await api.post(`/api/matches/${match.id}/no-show`);
    } catch (error) {
      return toast("Couldn't record no-show", (error as Error).message);
    }
    toast("No-show recorded", "Logged on the worker's profile · slot reopened for other applicants");
    setPinDigits(null);
    loadAll();
  };

  const cancelMatch = async (reason: string) => {
    if (!match) return;
    try {
      await api.post(`/api/matches/${match.id}/cancel`, { reason });
    } catch (error) {
      setCancelMatchOpen(false);
      return toast("Couldn't cancel", (error as Error).message);
    }
    setCancelMatchOpen(false);
    toast("Gig cancelled", `${firstName(match.worker.full_name)} was notified · posting closed`);
    setPinDigits(null);
    loadAll();
  };

  const cancelGig = async (reason: string) => {
    if (!gig) return;
    try {
      await api.post(`/api/gigs/${gig.id}/cancel`, { reason });
    } catch (error) {
      setCancelGigOpen(false);
      return toast("Couldn't cancel the posting", (error as Error).message);
    }
    setCancelGigOpen(false);
    toast("Posting cancelled", "Applicants were released — post again anytime");
    loadAll();
  };

  const submitReview = async (stars: number, tags: string[], comment: string) => {
    if (!match) return;
    try {
      await api.post(`/api/matches/${match.id}/review`, { stars, tags, comment });
    } catch (error) {
      toast("Couldn't post review", (error as Error).message);
      return;
    }
    setRateOpen(false);
    setReviewed(true);
    toast("Review posted", "Visible on their profile for future businesses");
    loadAll();
  };

  /* ----------------------------- derived ----------------------------- */

  const consoleStatus = match
    ? reviewed && match.status === "COMPLETED"
      ? "RATED"
      : match.status
    : gig?.status === "POSTED"
      ? "POSTED"
      : null;
  const badge = badgeStyle(consoleStatus ?? gig?.status ?? "POSTED");
  const showPosting = !!gig && (gig.status === "POSTED" || gig.status === "MATCHED" || gig.status === "COMPLETED");
  const workerFirst = match ? firstName(match.worker.full_name) : "";
  const statusLine = match
    ? match.status === "MATCHED"
      ? `${workerFirst} accepted — coordinate in chat. They'll tap “I've arrived” on site.`
      : match.status === "IN_PROGRESS"
        ? "On site — they tapped “I've arrived”. Issue the PIN once the job is done and paid."
        : "PIN confirmed by both sides. Gig closed and logged."
    : "";

  const expiresIn = gig
    ? Math.max(0, Math.round((new Date(gig.expires_at).getTime() - Date.now()) / 3600000))
    : 0;

  /* ----------------------------- render ----------------------------- */

  const postingCard = showPosting && gig && (
    <div className="overflow-hidden rounded-[14px] border-[1.5px] border-royal bg-white shadow-[0_1px_2px_rgba(15,27,46,0.04),0_8px_24px_rgba(15,27,46,0.06)]">
      <div className="flex items-center justify-between px-3.5 pt-3">
        <MonoBadge label={badge.label} bg={badge.bg} color={badge.color} />
        <span className="text-[11px] text-ink-muted">
          {gig.status === "POSTED" ? `expires in ${expiresIn} h` : gig.when_label}
        </span>
      </div>
      <div className="flex flex-col gap-[3px] px-3.5 pb-3 pt-[11px]">
        <span className="text-sm font-semibold">{gig.title}</span>
        <span className="text-xs text-ink-muted">
          ₱{gig.pay} · {gig.when_label} · {gig.area}
        </span>
      </div>
      <div className="px-3.5 pb-3.5">
        <MiniStepper
          codes={["POSTED", "MATCHED", "ON SITE", "DONE"]}
          index={stepIndex(consoleStatus)}
        />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg-soft md:flex-row">
      {/* desktop sidebar (GigOn Web design) */}
      <aside className="hidden md:flex md:w-[392px] md:shrink-0 md:flex-col md:gap-2.5 md:overflow-y-auto md:border-r md:border-line md:bg-white md:px-3.5 md:py-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">Your postings</h2>
          <button
            onClick={() => setPostOpen(true)}
            className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-amber px-[15px] text-[12.5px] font-semibold text-ink hover:bg-[#E99B16]"
          >
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Post a gig
          </button>
        </div>
        {postingCard}
        {!showPosting && (
          <div className="flex flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-dashed p-[22px] px-[18px] text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-tint text-royal">
              <Icon name="plus" size={22} />
            </span>
            <span className="font-display text-[14.5px] font-semibold">Need hands fast?</span>
            <span className="max-w-[26ch] text-xs leading-relaxed text-slate">
              Post a 1–3 hour gig and match with workers within walking distance.
            </span>
          </div>
        )}
        <div className="mt-auto flex items-start gap-2.5 rounded-[14px] bg-tint p-3 px-3.5">
          <Icon name="info" size={15} color="#0B2E6F" className="mt-px shrink-0" />
          <span className="text-[11.5px] leading-relaxed text-royal-dark">
            Posting is free. When you match, we log a billable event — <b>₱0 during the pilot</b>.
          </span>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-24 pt-3 md:px-[22px] md:pb-6 md:pt-[18px]">
        <div className="flex items-center justify-between px-0.5 md:hidden">
          <h1 className="font-display text-[17px] font-semibold">Your postings</h1>
          <button
            onClick={() => setPostOpen(true)}
            className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-amber px-[15px] text-[12.5px] font-semibold text-ink hover:bg-[#E99B16]"
          >
            <Icon name="plus" size={14} strokeWidth={2.4} />
            Post a gig
          </button>
        </div>

        {!showPosting && (
          <div className="flex flex-col items-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-line-dashed bg-white p-[26px] px-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-[13px] bg-royal">
              <Icon name="logo" size={24} color="#fff" strokeWidth={2.4} />
            </span>
            <span className="font-display text-[15px] font-semibold">Need hands fast?</span>
            <span className="max-w-[28ch] text-[12.5px] leading-relaxed text-slate">
              Post a 1–3 hour gig and match with workers within walking distance — in minutes.
            </span>
            <button
              onClick={() => setPostOpen(true)}
              className="mt-0.5 h-[42px] rounded-[10px] bg-amber px-5 text-[13px] font-semibold text-ink hover:bg-[#E99B16]"
            >
              Post your first gig — free
            </button>
          </div>
        )}

        {showPosting && gig && (
          <>
            <div className="md:hidden">{postingCard}</div>

            {/* desktop main header */}
            <div className="hidden items-center justify-between px-0.5 md:flex">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[19px] font-semibold tracking-tight">{gig.title}</span>
                <span className="text-xs text-slate">
                  ₱{gig.pay} · {gig.when_label} · {profile.business_name ?? ""}, {gig.area}
                </span>
              </div>
              <div className="flex items-center rounded-xl border border-line bg-white px-4 py-2.5">
                <MiniStepper codes={["POSTED", "MATCHED", "ON SITE", "DONE"]} index={stepIndex(consoleStatus)} />
              </div>
            </div>

            {hadNoShow && !match && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-red-border bg-red-bg p-3 px-3.5">
                <Icon name="alertTriangle" size={15} color="#D92D20" className="mt-px shrink-0" />
                <span className="text-xs leading-relaxed text-ink-body">
                  <b className="text-red">No-show recorded</b> on the worker&apos;s profile. Pick a
                  replacement below.
                </span>
              </div>
            )}

            {/* applicants (gig open) */}
            {gig.status === "POSTED" && (
              <>
                {apps.length === 0 ? (
                  <div className="flex flex-col items-center gap-[9px] rounded-[14px] border-[1.5px] border-dashed border-line-dashed bg-white p-7 px-5 text-center">
                    <LiveDot className="!size-[9px]" />
                    <span className="text-[13.5px] font-semibold">Your gig is live</span>
                    <span className="max-w-[30ch] text-xs leading-relaxed text-slate">
                      Workers within 3 km can see it now — applicants appear here in real time.
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="px-0.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-dark">
                      Applicants — compare &amp; select
                    </span>
                    <div className="flex flex-col gap-2.5 md:grid md:grid-cols-[repeat(auto-fill,minmax(290px,1fr))] md:gap-3">
                    {apps.map((a) => {
                      const w = a.worker;
                      const hist = historyLabel(w);
                      const dist =
                        w.lat && w.lng
                          ? formatDistance(distanceMeters(bizLoc, { lat: w.lat, lng: w.lng }))
                          : "nearby";
                      return (
                        <div
                          key={a.id}
                          className="anim-fade flex flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_1px_2px_rgba(15,27,46,0.04),0_8px_24px_rgba(15,27,46,0.06)]"
                        >
                          <div className="flex items-center gap-3 px-3.5 pb-[9px] pt-3">
                            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-tint text-sm font-bold text-royal-dark">
                              {initials(w.full_name)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-semibold">{w.full_name}</span>
                                {w.rating_count === 0 && (
                                  <span className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] text-royal-dark">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-ink-muted">
                                {w.skills.length ? w.skills.join(" · ") : "General"} ·{" "}
                                {w.area ?? "Philippines"}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 border-y border-line-soft">
                            {[
                              { v: dist, l: "AWAY", c: "#103F96" },
                              { v: w.rating_count ? `${ratingLabel(w)}★` : "New", l: "RATING", c: "#0F1B2E" },
                              { v: String(w.jobs_completed), l: "GIGS", c: "#0F1B2E" },
                              { v: hist.label, l: "HISTORY", c: hist.bad ? "#D92D20" : "#1AA75A" },
                            ].map((s, i) => (
                              <div
                                key={s.l}
                                className={`flex flex-col items-center gap-0.5 px-0.5 py-2 ${i < 3 ? "border-r border-line-soft" : ""}`}
                              >
                                <span
                                  className="text-center font-display text-xs font-bold leading-tight"
                                  style={{ color: s.c }}
                                >
                                  {s.v}
                                </span>
                                <span className="text-[8px] font-semibold tracking-[0.07em] text-ink-muted">
                                  {s.l}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="px-[13px] pb-3 pt-[9px]">
                            <button
                              onClick={() => setConfirmApp(a)}
                              className="h-[42px] w-full rounded-[10px] bg-royal text-[12.5px] font-semibold text-white hover:bg-royal-dark"
                            >
                              Select for this gig
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </>
                )}
                <button
                  onClick={() => setCancelGigOpen(true)}
                  className="self-center p-0.5 text-[11.5px] text-ink-muted underline underline-offset-2 md:self-start"
                >
                  Don&apos;t need help anymore? Cancel this posting
                </button>
              </>
            )}

            {/* match status */}
            {match && (
              <div className="contents md:flex md:max-w-[720px] md:flex-col md:gap-3">
                <div className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-royal bg-tint-soft p-3 px-3.5">
                  <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-royal text-sm font-bold text-white">
                    {initials(match.worker.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{match.worker.full_name}</div>
                    <div className="text-[11px] text-slate">
                      {ratingLabel(match.worker)}★ · {match.worker.jobs_completed} gigs ·{" "}
                      {match.worker.lat && match.worker.lng
                        ? `${formatDistance(distanceMeters(bizLoc, { lat: match.worker.lat, lng: match.worker.lng }))} away`
                        : "nearby"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUnread(0);
                      setChatOpen(true);
                    }}
                    className="relative flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-white px-[13px] text-xs font-semibold hover:bg-bg-soft"
                  >
                    <Icon name="message" size={13} />
                    Chat
                    {unread > 0 && <span className="size-[7px] rounded-full bg-amber" />}
                  </button>
                </div>

                <div className="flex items-start gap-2.5 rounded-[14px] border border-line bg-white p-3 px-3.5">
                  <span className="mt-1">
                    <LiveDot className="!size-2" />
                  </span>
                  <span className="text-xs leading-relaxed text-ink-body">{statusLine}</span>
                </div>

                {match.status === "IN_PROGRESS" && !match.pin_issued_at && (
                  <div className="flex flex-col gap-[11px] rounded-[14px] border border-line bg-white p-3.5">
                    <span className="text-xs leading-relaxed text-ink-body">
                      <span className="font-semibold text-ink">Job done and paid in cash?</span>{" "}
                      Issue the one-time PIN and tell it to {workerFirst}.
                    </span>
                    <button
                      onClick={issuePin}
                      className="h-[46px] w-full rounded-[10px] bg-amber text-[13.5px] font-semibold text-ink hover:bg-[#E99B16]"
                    >
                      Issue completion PIN
                    </button>
                  </div>
                )}

                {match.status === "IN_PROGRESS" && match.pin_issued_at && (
                  <div className="flex flex-col items-center gap-[11px] rounded-[14px] border-[1.5px] border-amber bg-amber-bg p-[15px]">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-amber-dark">
                      Tell {workerFirst} this PIN
                    </span>
                    {pinDigits ? (
                      <div className="flex gap-2">
                        {pinDigits.split("").map((d, i) => (
                          <span
                            key={i}
                            className="flex h-[52px] w-11 items-center justify-center rounded-[11px] border-[1.5px] border-amber bg-white font-display text-2xl font-bold"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={issuePin}
                        className="h-10 rounded-[10px] border border-amber bg-white px-4 text-xs font-semibold text-amber-dark"
                      >
                        Show PIN again (re-issue)
                      </button>
                    )}
                    <span className="text-center text-[10.5px] leading-normal text-ink-muted">
                      One-time · valid 24 h · 3 wrong tries locks it for 60 s
                      <br />
                      <span className="font-semibold text-amber-dark">
                        Waiting for {workerFirst} to enter it…
                      </span>
                    </span>
                  </div>
                )}

                {match.status === "COMPLETED" && (
                  <div className="flex flex-col items-center gap-[9px] rounded-[14px] border-[1.5px] border-success-border bg-success-bg p-[15px] text-center">
                    <span className="anim-pop flex size-[42px] items-center justify-center rounded-full bg-success">
                      <Icon name="check" size={22} color="#fff" strokeWidth={2.6} />
                    </span>
                    <span className="font-display text-sm font-semibold">
                      COMPLETED — confirmed by both sides
                    </span>
                    <span className="text-[11.5px] text-ink-body">
                      ₱0 charged (pilot). Reviews are unlocked.
                    </span>
                    {!reviewed ? (
                      <button
                        onClick={() => setRateOpen(true)}
                        className="h-10 rounded-[10px] bg-amber px-[18px] text-[12.5px] font-semibold text-ink hover:bg-[#E99B16]"
                      >
                        Rate {workerFirst}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-success">Review posted ✓</span>
                    )}
                  </div>
                )}

                {match.status === "MATCHED" && (
                  <div className="flex flex-col items-center gap-1 md:items-start">
                    <button
                      onClick={() => setNoShowOpen(true)}
                      className="p-0.5 text-[11.5px] text-ink-muted underline underline-offset-2"
                    >
                      Worker hasn&apos;t arrived? Report a no-show
                    </button>
                    <button
                      onClick={() => setCancelMatchOpen(true)}
                      className="p-0.5 text-[11.5px] text-ink-muted underline underline-offset-2"
                    >
                      Plans changed? Cancel this gig
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-[#EEF3FB] px-[11px] py-2 font-mono text-[9.5px] text-slate">
              on match: billable_event · charge ₱0 (pilot)
            </div>
          </>
        )}

        <div className="flex items-start gap-2.5 rounded-[14px] bg-tint p-3 px-3.5 md:hidden">
          <Icon name="info" size={15} color="#0B2E6F" className="mt-px shrink-0" />
          <span className="text-[11.5px] leading-relaxed text-royal-dark">
            Posting is free. When you match, we log a billable event —{" "}
            <b>₱0 during the pilot</b>.
          </span>
        </div>
      </div>

      {/* ------------- sheets ------------- */}

      {postOpen && (
        <PostGigSheet
          profile={profile}
          onPosted={() => {
            setPostOpen(false);
            toast("Gig posted — free", "Live now · visible to workers within 3 km");
            loadAll();
          }}
          onClose={() => setPostOpen(false)}
        />
      )}

      {confirmApp && (
        <Sheet onClose={() => setConfirmApp(null)} floating z={46}>
          <span className="flex size-[42px] items-center justify-center rounded-xl bg-tint">
            <Icon name="logo" size={21} color="#103F96" strokeWidth={2.2} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-display text-[17px] font-semibold tracking-tight">
              Match with {confirmApp.worker.full_name}?
            </span>
            <span className="text-[11.5px] text-slate">
              {confirmApp.worker.rating_count ? `${ratingLabel(confirmApp.worker)}★` : "New"} ·{" "}
              {confirmApp.worker.jobs_completed} gigs · {historyLabel(confirmApp.worker).label}
            </span>
            <span className="mt-[3px] text-xs leading-relaxed text-ink-body">
              They&apos;ll be notified and chat opens right away. Matching is{" "}
              <b>free during the pilot</b> — logged as a billable event (₱0).
            </span>
          </div>
          <div className="mt-0.5 flex gap-2">
            <button
              onClick={() => setConfirmApp(null)}
              className="h-11 flex-1 rounded-[10px] border border-line bg-white text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmMatch}
              className="h-11 flex-[1.4] rounded-[10px] bg-amber text-[13px] font-semibold text-ink hover:bg-[#E99B16]"
            >
              Confirm match
            </button>
          </div>
        </Sheet>
      )}

      {cancelGigOpen && gig && (
        <CancelSheet
          title="Cancel this posting?"
          sub="It comes off the feed right away and applicants are released. No penalty — nothing was matched yet."
          reasons={EMPLOYER_CANCEL_REASONS}
          confirmLabel="Cancel the posting"
          onSubmit={cancelGig}
          onClose={() => setCancelGigOpen(false)}
        />
      )}

      {cancelMatchOpen && match && (
        <CancelSheet
          title={`Cancel on ${firstName(match.worker.full_name)}?`}
          sub="They'll be notified right away. Cancelling a matched gig is recorded on your business profile."
          reasons={EMPLOYER_CANCEL_REASONS}
          confirmLabel="Cancel the gig"
          onSubmit={cancelMatch}
          onClose={() => setCancelMatchOpen(false)}
        />
      )}

      {noShowOpen && match && (
        <Sheet onClose={() => setNoShowOpen(false)} floating z={46}>
          <span className="flex size-[42px] items-center justify-center rounded-xl bg-red-bg">
            <Icon name="alertTriangle" size={21} color="#D92D20" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-display text-[17px] font-semibold tracking-tight">
              Report a no-show?
            </span>
            <span className="text-xs leading-relaxed text-ink-body">
              Use this after the 30-minute grace period. It&apos;s recorded on{" "}
              {firstName(match.worker.full_name)}&apos;s profile and your gig reopens for other
              applicants.
            </span>
          </div>
          <div className="mt-0.5 flex gap-2">
            <button
              onClick={() => setNoShowOpen(false)}
              className="h-11 flex-1 rounded-[10px] border border-line bg-white text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={reportNoShow}
              className="h-11 flex-[1.4] rounded-[10px] bg-red text-[13px] font-semibold text-white"
            >
              Record no-show
            </button>
          </div>
        </Sheet>
      )}

      {rateOpen && match && (
        <RateSheet
          forName={match.worker.full_name}
          paySub={`₱${gig?.pay ?? ""} · paid in cash · ${gig?.title ?? ""}`}
          tags={EMPLOYER_RATE_TAGS}
          placeholder="Say a word about the work (optional)"
          onSubmit={submitReview}
          onClose={() => setRateOpen(false)}
        />
      )}

      {chatOpen && match && (
        <ChatSheet
          matchId={match.id}
          meId={me}
          name={match.worker.full_name}
          initialsLabel={initials(match.worker.full_name)}
          sub={`${ratingLabel(match.worker)}★ · ${match.worker.jobs_completed} gigs`}
          quicks={EMPLOYER_QUICKS}
          onClose={() => {
            setChatOpen(false);
            setUnread(0);
          }}
        />
      )}
    </div>
  );
}

/* ============================ post gig sheet ============================ */

const WHENS = ["Today", "Tomorrow"];
const DURATIONS = ["1 hr", "2 hrs", "3 hrs"];

function PostGigSheet({
  profile,
  onPosted,
  onClose,
}: {
  profile: Profile;
  onPosted: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<(typeof GIG_TYPES)[number]>("Cleaning");
  const [title, setTitle] = useState("Afternoon café deep clean");
  const [when, setWhen] = useState("Today");
  const [time, setTime] = useState("2:00 – 4:00 PM");
  const [dur, setDur] = useState("2 hrs");
  const [pay, setPay] = useState("350");
  const [slots, setSlots] = useState(1);
  const [desc, setDesc] = useState(
    "Dining area + kitchen wipe-down after the lunch rush. Mop and supplies provided.",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const payNum = parseInt(pay, 10);
    if (!title.trim() || !payNum) {
      setError("Add a title and pay amount.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/api/gigs", {
        title: title.trim(),
        type,
        description: desc,
        pay: payNum,
        duration: dur,
        whenLabel: `${when} · ${time}`,
        area: profile.area ?? "Philippines",
        lat: profile.lat ?? MACTAN_CENTER.lat,
        lng: profile.lng ?? MACTAN_CENTER.lng,
        slots,
      });
    } catch (err) {
      setBusy(false);
      setError((err as Error).message);
      return;
    }
    setBusy(false);
    onPosted();
  };

  return (
    <Sheet onClose={onClose} maxHeight="88%" desktop="panel">
      <div className="flex shrink-0 items-center gap-2.5 px-5 pb-2.5 pt-3.5">
        <span className="flex-1 font-display text-[17px] font-semibold">Post a gig</span>
        <span className="rounded-full border border-success-border bg-success-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-success">
          Free
        </span>
        <button
          aria-label="Close"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-tint-soft text-slate"
        >
          <Icon name="x" size={14} strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[13px] overflow-y-auto px-5 pb-4 pt-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">What kind of work?</span>
          <div className="grid grid-cols-2 gap-[7px]">
            {GIG_TYPES.map((tp) => {
              const on = type === tp;
              return (
                <button
                  key={tp}
                  onClick={() => setType(tp)}
                  className={`flex h-11 items-center gap-2 rounded-[11px] border-[1.5px] px-3 text-[12.5px] font-semibold ${
                    on ? "border-royal bg-tint-soft text-royal-dark" : "border-line bg-white text-slate"
                  }`}
                >
                  <Icon name={GIG_TYPE_ICON[tp] ?? "briefcase"} size={16} strokeWidth={1.8} />
                  {tp}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-[10px] border border-line px-[13px] text-[13px] outline-none focus:border-royal"
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">When</span>
          <div className="flex items-center gap-1.5">
            {WHENS.map((w) => (
              <Chip key={w} label={w} active={when === w} onClick={() => setWhen(w)} />
            ))}
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-[34px] min-w-0 flex-1 rounded-full border border-line px-[13px] text-xs outline-none focus:border-royal"
            />
          </div>
          <div className="flex gap-1.5">
            {DURATIONS.map((d) => (
              <Chip key={d} label={d} active={dur === d} onClick={() => setDur(d)} />
            ))}
          </div>
        </div>
        <div className="flex gap-2.5">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold">Pay (cash)</span>
            <span className="flex h-11 overflow-hidden rounded-[10px] border border-line focus-within:border-royal">
              <span className="flex items-center border-r border-line bg-tint-soft px-3 font-display text-sm font-bold text-royal">
                ₱
              </span>
              <input
                value={pay}
                onChange={(e) => setPay(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="min-w-0 flex-1 px-3 font-display text-sm font-bold outline-none"
              />
            </span>
          </label>
          <div className="flex w-[122px] flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold">Workers</span>
            <span className="flex h-11 items-center overflow-hidden rounded-[10px] border border-line">
              <button
                onClick={() => setSlots((s) => Math.max(1, s - 1))}
                className="h-full w-[38px] bg-tint-soft text-base font-semibold text-royal"
              >
                −
              </button>
              <span className="flex-1 text-center font-display text-sm font-bold">{slots}</span>
              <button
                onClick={() => setSlots((s) => Math.min(5, s + 1))}
                className="h-full w-[38px] bg-tint-soft text-base font-semibold text-royal"
              >
                +
              </button>
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">Location pin</span>
          <div className="relative h-24 overflow-hidden rounded-[11px] border border-line bg-tint-soft">
            <svg viewBox="0 0 412 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
              <rect width={412} height={160} fill="#F2F6FC" />
              <path d="M330 0 L412 0 L412 160 L300 160 C315 105 328 50 330 0 Z" fill="#CDD9F0" />
              <path d="M0 98 L412 62" stroke="#fff" strokeWidth={9} />
              <path d="M130 0 L150 160" stroke="#fff" strokeWidth={5} />
              <rect x={46} y={22} width={52} height={32} rx={6} fill="#E7EDF8" />
            </svg>
            <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-full">
              <span className="flex flex-col items-center drop-shadow-[0_3px_6px_rgba(15,27,46,0.25)]">
                <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-royal">
                  <Icon name="mapPin" size={13} color="#fff" strokeWidth={2.2} />
                </span>
                <span className="size-0 border-x-4 border-t-[5px] border-x-transparent border-t-royal" />
              </span>
            </div>
            <div className="absolute bottom-2 left-[9px] rounded-full border border-line bg-white px-2.5 py-[3px] text-[10px] font-semibold text-royal-dark">
              {profile.business_name ?? "Your business"} · {profile.area ?? "Philippines"}
            </div>
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold">
            Details <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="min-h-[58px] resize-none rounded-[11px] border border-line px-3 py-2.5 text-[12.5px] leading-normal outline-none focus:border-royal"
          />
        </label>
        {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
      </div>
      <div className="shrink-0 border-t border-line bg-white px-5 pb-4 pt-2.5">
        <button
          onClick={submit}
          disabled={busy}
          className="h-[50px] w-full rounded-[10px] bg-amber text-[14.5px] font-semibold text-ink hover:bg-[#E99B16] disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post gig — free"}
        </button>
        <p className="mt-[7px] text-center text-[10px] text-ink-muted">
          Goes live instantly to workers within 3 km. ₱0 during the pilot.
        </p>
      </div>
    </Sheet>
  );
}
