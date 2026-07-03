"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon, GIG_TYPE_ICON } from "@/components/icons";
import { ChatSheet, RateSheet } from "@/components/sheets";
import { useToast } from "@/components/shell";
import { Chip, LiveDot, MiniStepper, MonoBadge, Sheet } from "@/components/ui";
import { MapView } from "@/components/map-view";
import {
  DISPUTE_REASONS,
  FILTERS,
  WORKER_RATE_TAGS,
  badgeStyle,
  firstName,
  initials,
  ratingLabel,
  stepIndex,
  type Application,
  type Gig,
  type GigWithEmployer,
  type Match,
  type Profile,
} from "@/lib/domain";
import { MACTAN_CENTER, distanceMeters, formatDistance } from "@/lib/geo";
import { supabaseBrowser } from "@/lib/supabase/client";

type EngagedGig = Gig & { employer: Profile };
type MyMatch = Match & { gig: EngagedGig };
type MyApplication = Application & { gig: EngagedGig };

const WORKER_QUICKS = ["On my way po", "Where is the entrance?", "Running 5 min late"];

export function WorkerApp({ profile }: { profile: Profile }) {
  const supabase = supabaseBrowser();
  const toast = useToast();
  const me = profile.id;
  const you = useMemo(
    () => ({ lat: profile.lat ?? MACTAN_CENTER.lat, lng: profile.lng ?? MACTAN_CENTER.lng }),
    [profile.lat, profile.lng],
  );

  const [gigs, setGigs] = useState<GigWithEmployer[]>([]);
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [match, setMatch] = useState<MyMatch | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [disputeTicket, setDisputeTicket] = useState<string | null>(null);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const [detail, setDetail] = useState<GigWithEmployer | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;

  /* ------------------------------ data ------------------------------ */

  const loadAll = useCallback(async () => {
    const [gigsRes, appsRes, matchRes] = await Promise.all([
      supabase
        .from("gigs")
        .select("*, employer:profiles!gigs_employer_id_fkey(*)")
        .eq("status", "POSTED")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("applications")
        .select("*, gig:gigs(*, employer:profiles!gigs_employer_id_fkey(*))")
        .eq("worker_id", me)
        .order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("*, gig:gigs(*, employer:profiles!gigs_employer_id_fkey(*))")
        .eq("worker_id", me)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setGigs((gigsRes.data as GigWithEmployer[]) ?? []);
    setApps((appsRes.data as MyApplication[]) ?? []);
    const m = (matchRes.data as MyMatch | null) ?? null;
    setMatch(m);
    if (m) {
      const [{ data: rv }, { data: dp }] = await Promise.all([
        supabase.from("reviews").select("id").eq("match_id", m.id).eq("rater_id", me).maybeSingle(),
        supabase
          .from("disputes")
          .select("id")
          .eq("match_id", m.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setReviewed(!!rv);
      setDisputeTicket(dp ? `D-${1000 + dp.id}` : null);
    } else {
      setReviewed(false);
      setDisputeTicket(null);
    }
  }, [me, supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // realtime: my matches + open gigs
  useEffect(() => {
    const channel = supabase
      .channel("worker-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches", filter: `worker_id=eq.${me}` },
        () => {
          toast("You're matched — your gig is on!", "The business picked you · see the banner");
          loadAll();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `worker_id=eq.${me}` },
        (payload) => {
          const next = payload.new as Match;
          if (next.status === "NO_SHOW") {
            toast("No-show recorded", "This gig was reopened by the business");
          }
          loadAll();
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "gigs" }, () => loadAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll, me, supabase, toast]);

  // realtime: unread counter for the active match chat
  useEffect(() => {
    if (!match) return;
    const channel = supabase
      .channel(`worker-chat-${match.id}`)
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

  /* ---------------------------- derived ---------------------------- */

  const appliedIds = useMemo(
    () => new Set(apps.filter((a) => a.status !== "WITHDRAWN").map((a) => a.gig_id)),
    [apps],
  );
  const feed = useMemo(() => {
    const list = gigs
      .filter((g) => g.employer_id !== me)
      .filter((g) => filter === "All" || g.type === filter)
      .map((g) => ({ ...g, dist: distanceMeters(you, g) }));
    list.sort((a, b) => a.dist - b.dist);
    return list;
  }, [gigs, filter, me, you]);

  const activeMatch = match && ["MATCHED", "IN_PROGRESS", "COMPLETED"].includes(match.status) ? match : null;
  const pendingApp =
    !activeMatch ? (apps.find((a) => a.status === "APPLIED" && a.gig.status === "POSTED") ?? null) : null;

  const banStatus = activeMatch
    ? reviewed && activeMatch.status === "COMPLETED"
      ? "RATED"
      : activeMatch.status
    : pendingApp
      ? "APPLIED"
      : null;
  const banGig = activeMatch?.gig ?? pendingApp?.gig ?? null;
  const badge = banStatus ? badgeStyle(banStatus) : null;

  const banLine = (() => {
    if (!banGig) return "";
    const first = firstName(banGig.employer.full_name);
    const biz = banGig.employer.business_name ?? banGig.employer.full_name;
    switch (banStatus) {
      case "APPLIED":
        return `${biz} is reviewing applicants — you'll get a notification here.`;
      case "MATCHED":
        return `${first} picked you. Head to ${biz} and tap “I've arrived” when you're there.`;
      case "IN_PROGRESS":
        return "On site — once you're paid in cash, ask for the 4-digit PIN to close the gig.";
      case "COMPLETED":
        return "PIN verified — reviews are unlocked for both sides.";
      case "RATED":
        return "PIN verified · logged in the append-only audit trail.";
      default:
        return "";
    }
  })();

  /* ---------------------------- actions ---------------------------- */

  const apply = async (gig: GigWithEmployer) => {
    const { error } = await supabase.rpc("apply_to_gig", { p_gig: gig.id });
    if (error) {
      toast("Couldn't apply", error.message);
      return;
    }
    setDetail(null);
    toast("Application sent", `${gig.employer.business_name ?? "The business"} is reviewing applicants — 1-tap, no cover letter`);
    loadAll();
  };

  const arrive = async () => {
    if (!activeMatch) return;
    const { error } = await supabase.rpc("mark_arrived", { p_match: activeMatch.id });
    if (error) return toast("Couldn't log arrival", error.message);
    toast("Arrival logged · IN_PROGRESS", "Recorded in the append-only audit log");
    loadAll();
  };

  const submitReview = async (stars: number, tags: string[], comment: string) => {
    if (!activeMatch) return;
    const { error } = await supabase.rpc("post_review", {
      p_match: activeMatch.id,
      p_stars: stars,
      p_tags: tags,
      p_comment: comment,
    });
    if (error) {
      toast("Couldn't post review", error.message);
      return;
    }
    setRateOpen(false);
    setReviewed(true);
    toast("Review posted", "Reviews only exist on PIN-completed gigs — that keeps them honest");
    loadAll();
  };

  /* ----------------------------- render ----------------------------- */

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* worker status strip */}
      {banStatus && banGig && badge && (
        <div className="anim-fade z-15 flex shrink-0 flex-col gap-[9px] border-b border-line bg-tint-soft px-3.5 pb-3 pt-2.5">
          <div className="flex items-center gap-[9px]">
            <MonoBadge label={badge.label} bg={badge.bg} color={badge.color} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
              {banGig.title} · <span className="text-royal">₱{banGig.pay}</span>
            </span>
            {activeMatch && (
              <button
                onClick={() => {
                  setUnread(0);
                  setChatOpen(true);
                }}
                className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[11.5px] font-semibold"
              >
                <Icon name="message" size={13} />
                Chat
                {unread > 0 && <span className="size-[7px] rounded-full bg-amber" />}
              </button>
            )}
          </div>
          <MiniStepper codes={["APPLIED", "MATCHED", "ON SITE", "DONE"]} index={stepIndex(banStatus)} />
          <div className="flex items-center gap-2.5">
            <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate">{banLine}</span>
            {disputeTicket ? (
              <span className="shrink-0 text-[10px] font-bold text-red">
                DISPUTED · #{disputeTicket}
              </span>
            ) : (
              (banStatus === "IN_PROGRESS" || banStatus === "COMPLETED") && (
                <button
                  onClick={() => setDisputeOpen(true)}
                  className="shrink-0 text-[10.5px] text-ink-muted underline underline-offset-2"
                >
                  Dispute
                </button>
              )
            )}
            {banStatus === "MATCHED" && (
              <button
                onClick={arrive}
                className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-[9px] bg-amber px-[15px] text-xs font-semibold text-ink hover:bg-[#E99B16]"
              >
                <Icon name="navigate" size={13} strokeWidth={2.2} />
                I&apos;ve arrived
              </button>
            )}
            {banStatus === "IN_PROGRESS" && (
              <button
                onClick={() => setPinOpen(true)}
                className="h-[38px] shrink-0 rounded-[9px] bg-amber px-[15px] text-xs font-semibold text-ink hover:bg-[#E99B16]"
              >
                Enter PIN
              </button>
            )}
            {banStatus === "COMPLETED" && (
              <button
                onClick={() => setRateOpen(true)}
                className="h-[38px] shrink-0 rounded-[9px] bg-amber px-[15px] text-xs font-semibold text-ink hover:bg-[#E99B16]"
              >
                Rate {firstName(banGig.employer.full_name)}
              </button>
            )}
            {banStatus === "RATED" && (
              <span className="flex shrink-0 items-center gap-[5px] text-[11.5px] font-bold text-success">
                <Icon name="check" size={13} strokeWidth={3} />
                Done &amp; reviewed
              </span>
            )}
          </div>
        </div>
      )}

      {/* split view: list pane (mobile full-width) + map pane (desktop) */}
      <div className="relative flex min-h-0 flex-1">
        <div
          className={`${view === "map" ? "hidden" : "flex"} w-full flex-col md:flex md:w-[442px] md:shrink-0 md:border-r md:border-line`}
        >
          {/* desktop pane header */}
          <div className="hidden shrink-0 items-baseline justify-between px-4 pb-0 pt-3.5 md:flex">
            <span className="font-display text-lg font-semibold tracking-tight">Gigs near you</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-slate">
              <LiveDot />
              {feed.length} open now
            </span>
          </div>

          {/* filters */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line bg-white px-3.5 pb-2.5 pt-[9px] md:flex-wrap md:px-4">
            {FILTERS.map((f) => (
              <Chip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
            ))}
          </div>

          <div className="relative min-h-0 flex-1 bg-bg-soft">
            <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto px-3 pb-24 pt-2.5 md:pb-4">
            <div className="flex items-center justify-between px-1 py-0.5 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <LiveDot />
                {feed.length} gigs open now · nearest first
              </span>
              <span className="shrink-0 whitespace-nowrap font-medium text-slate">Sort ▾</span>
            </div>
            {feed.map((g) => (
              <button
                key={g.id}
                onClick={() => setDetail(g)}
                className="flex w-full items-start gap-3 rounded-[14px] border-[1.5px] border-line bg-white p-3 px-[13px] text-left shadow-[0_1px_2px_rgba(15,27,46,0.04),0_8px_24px_rgba(15,27,46,0.06)] transition-colors hover:border-royal"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-tint text-royal">
                  <Icon name={GIG_TYPE_ICON[g.type] ?? "briefcase"} size={20} strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-sm font-semibold leading-tight">{g.title}</span>
                  <span className="text-[11.5px] text-ink-muted">
                    {g.employer.business_name ?? g.employer.full_name} · {g.area} ·{" "}
                    <span className="font-semibold text-royal">{formatDistance(g.dist)}</span>
                  </span>
                  <span className="mt-[3px] flex flex-wrap items-center gap-1.5">
                    <span className="whitespace-nowrap rounded-full bg-tint-soft px-2 py-[3px] text-[10.5px] font-medium text-slate">
                      {g.when_label}
                    </span>
                    {appliedIds.has(g.id) && (
                      <span className="whitespace-nowrap text-[10.5px] font-bold text-success">
                        Applied ✓
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="font-display text-base font-bold tracking-tight text-royal">
                    ₱{g.pay}
                  </span>
                  <span className="text-[10px] text-ink-muted">{g.duration} · cash</span>
                </span>
              </button>
            ))}
            <div className="mt-2 flex flex-col items-center gap-2 border-t border-line pb-2 pt-[18px]">
              <span className="flex items-center gap-[7px]">
                <span className="flex size-5 items-center justify-center rounded-md bg-royal">
                  <Icon name="logo" size={11} color="#fff" strokeWidth={2.4} />
                </span>
                <span className="font-display text-[12.5px] font-bold">GigOn</span>
              </span>
              <span className="text-center text-[10px] leading-relaxed text-ink-muted">
                © 2026 GigOn · Terms · Privacy · English (Cebuano soon)
                <br />
                Free during the pilot — per-match fee for businesses planned later.
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* map pane — always on desktop, toggled on mobile */}
        <div className={`relative min-h-0 flex-1 bg-tint-soft ${view === "map" ? "block" : "hidden"} md:block`}>
          <MapView gigs={feed} you={you} appliedIds={appliedIds} onOpen={setDetail} />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-line bg-white px-[13px] py-[7px] text-[11.5px] font-semibold shadow-[0_8px_24px_rgba(15,27,46,0.06)] md:left-4 md:top-3.5">
            <LiveDot />
            {feed.length} gigs open now
          </div>
          <div className="absolute right-3 top-3 rounded-full border border-line bg-white px-3 py-[7px] text-[10.5px] font-medium text-slate shadow-[0_8px_24px_rgba(15,27,46,0.06)] md:right-4 md:top-3.5">
            Pilot zone · 2–3 km
          </div>
        </div>

        <button
          onClick={() => setView(view === "list" ? "map" : "list")}
          className="absolute bottom-5 left-1/2 z-12 flex h-[42px] -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-[19px] text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(15,27,46,0.3)] md:hidden"
        >
          <Icon name={view === "list" ? "map" : "list"} size={15} />
          {view === "list" ? "Map" : "List"}
        </button>
      </div>

      {/* ------------- sheets ------------- */}

      {detail && (
        <GigDetailSheet
          gig={detail}
          applied={appliedIds.has(detail.id)}
          dist={formatDistance(distanceMeters(you, detail))}
          onApply={() => apply(detail)}
          onClose={() => setDetail(null)}
        />
      )}

      {pinOpen && activeMatch && (
        <PinSheet
          matchId={activeMatch.id}
          employerFirst={firstName(activeMatch.gig.employer.full_name)}
          onSuccess={() => {
            setPinOpen(false);
            setRateOpen(true);
            toast("PIN verified · COMPLETED", "Append-only log written — reviews unlocked");
            loadAll();
          }}
          onClose={() => setPinOpen(false)}
        />
      )}

      {rateOpen && activeMatch && (
        <RateSheet
          forName={`${firstName(activeMatch.gig.employer.full_name)} · ${activeMatch.gig.employer.business_name ?? ""}`}
          paySub={`₱${activeMatch.gig.pay} · paid in cash · ${activeMatch.gig.title}`}
          tags={WORKER_RATE_TAGS}
          placeholder="Say a word about the gig (optional)"
          onSubmit={submitReview}
          onClose={() => setRateOpen(false)}
        />
      )}

      {disputeOpen && activeMatch && (
        <DisputeSheet
          matchId={activeMatch.id}
          onFiled={(ticket) => {
            setDisputeOpen(false);
            setDisputeTicket(ticket);
            toast(`Dispute #${ticket} opened · DISPUTED`, "The GigOn team reviews within 24 h");
          }}
          onClose={() => setDisputeOpen(false)}
        />
      )}

      {chatOpen && activeMatch && (
        <ChatSheet
          matchId={activeMatch.id}
          meId={me}
          name={activeMatch.gig.employer.business_name ?? activeMatch.gig.employer.full_name}
          initialsLabel={initials(activeMatch.gig.employer.business_name ?? activeMatch.gig.employer.full_name)}
          sub={`${firstName(activeMatch.gig.employer.full_name)} · ${ratingLabel(activeMatch.gig.employer)}★`}
          quicks={WORKER_QUICKS}
          onClose={() => {
            setChatOpen(false);
            setUnread(0);
          }}
        />
      )}
    </div>
  );
}

/* ============================ gig detail sheet ============================ */

function GigDetailSheet({
  gig,
  applied,
  dist,
  onApply,
  onClose,
}: {
  gig: GigWithEmployer;
  applied: boolean;
  dist: string;
  onApply: () => void;
  onClose: () => void;
}) {
  const since = new Date(gig.employer.created_at).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
  return (
    <Sheet onClose={onClose} maxHeight="86%" desktop="panel">
      <div className="flex shrink-0 items-center justify-center pb-0.5 pt-[9px]">
        <div className="h-1 w-10 rounded-full bg-line" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-tint px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.08em] text-royal-dark">
              {gig.type}
            </span>
            <span className="text-[11px] text-ink-muted">
              {gig.slots} slot{gig.slots > 1 ? "s" : ""}
            </span>
            <span className="flex-1" />
            <button
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-tint-soft text-slate"
            >
              <Icon name="x" size={14} strokeWidth={2.2} />
            </button>
          </div>
          <h2 className="font-display text-xl font-bold leading-tight tracking-tight">
            {gig.title}
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-royal">
              ₱{gig.pay}
            </span>
            <span className="text-xs text-slate">{gig.duration} · cash on completion</span>
          </div>
        </div>

        {/* mini map */}
        <div className="relative h-[110px] shrink-0 overflow-hidden rounded-xl border border-line bg-tint-soft">
          <svg viewBox="0 0 412 170" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
            <rect width={412} height={170} fill="#F2F6FC" />
            <path d="M330 0 L412 0 L412 170 L300 170 C315 115 328 55 330 0 Z" fill="#CDD9F0" />
            <path d="M0 105 L412 66" stroke="#fff" strokeWidth={10} />
            <path d="M130 0 L150 170" stroke="#fff" strokeWidth={6} />
            <rect x={44} y={22} width={58} height={38} rx={7} fill="#E7EDF8" />
            <line x1={206} y1={82} x2={152} y2={132} stroke="#103F96" strokeWidth={1.5} strokeDasharray="4 4" />
          </svg>
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-full">
            <span className="flex flex-col items-center drop-shadow-[0_3px_6px_rgba(15,27,46,0.28)]">
              <span className="rounded-lg bg-royal px-2.5 py-1 font-display text-xs font-bold text-white">
                ₱{gig.pay}
              </span>
              <span className="size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-royal" />
            </span>
          </div>
          <div className="absolute left-[37%] top-[74%] size-3 rounded-full border-[2.5px] border-white bg-amber shadow-[0_1px_4px_rgba(15,27,46,0.3)]" />
          <div className="absolute bottom-[9px] right-2.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-royal">
            {dist} from you
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[14px] border border-line">
          <div className="flex items-center gap-2.5 border-b border-line-soft px-[13px] py-2.5">
            <Icon name="clock" size={15} color="#5B6675" />
            <span className="text-[12.5px] font-medium">{gig.when_label}</span>
          </div>
          <div className="flex items-center gap-2.5 px-[13px] py-2.5">
            <Icon name="mapPin" size={15} color="#5B6675" />
            <span className="text-[12.5px] font-medium">
              {gig.employer.business_name ?? gig.employer.full_name}, {gig.area} —{" "}
              <span className="font-semibold text-royal">{dist} away</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[14px] border border-line px-[13px] py-[11px]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-tint text-[13px] font-bold text-royal-dark">
            {initials(gig.employer.business_name ?? gig.employer.full_name)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13.5px] font-semibold">{gig.employer.full_name}</span>
              <span className="flex items-center gap-[3px] rounded-full border border-success-border px-[7px] py-0.5 text-[9.5px] font-semibold text-success">
                <Icon name="shield" size={9} strokeWidth={2.4} />
                Invite-verified
              </span>
            </div>
            <span className="flex items-center gap-[5px] text-[11.5px] text-slate">
              <Icon name="star" size={11} fill="#F5A623" />
              {ratingLabel(gig.employer)} · {gig.employer.jobs_completed} gigs · since {since}
            </span>
          </div>
        </div>

        {gig.description && (
          <p className="text-[13px] leading-relaxed text-ink-body">{gig.description}</p>
        )}

        <div className="flex flex-col gap-2 rounded-[14px] bg-bg-soft p-3 px-[13px]">
          <span className="flex items-start gap-[9px]">
            <Icon name="card" size={14} color="#103F96" className="mt-px shrink-0" />
            <span className="text-[11.5px] leading-normal text-ink-body">
              <span className="font-semibold">Cash, direct.</span> You keep 100% — GigOn never
              touches wages.
            </span>
          </span>
          <span className="flex items-start gap-[9px]">
            <Icon name="shield" size={14} color="#103F96" className="mt-px shrink-0" />
            <span className="text-[11.5px] leading-normal text-ink-body">
              <span className="font-semibold">PIN check-out.</span> Both sides confirm — that
              unlocks reviews.
            </span>
          </span>
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-white px-5 pb-4 pt-2.5">
        <button
          onClick={onApply}
          disabled={applied}
          className={`h-[50px] w-full rounded-[10px] text-[14.5px] font-semibold ${
            applied
              ? "border-[1.5px] border-royal bg-white text-royal"
              : "bg-amber text-ink hover:bg-[#E99B16]"
          }`}
        >
          {applied ? "Applied ✓ — waiting for reply" : "Apply — 1 tap"}
        </button>
      </div>
    </Sheet>
  );
}

/* ============================== PIN sheet ============================== */

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

function PinSheet({
  matchId,
  employerFirst,
  onSuccess,
  onClose,
}: {
  matchId: string;
  employerFirst: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const supabase = supabaseBrowser();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [lock, setLock] = useState(0);
  const [shake, setShake] = useState(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (lock <= 0) return;
    const t = setInterval(() => setLock((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [lock > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lock === 0 && err.startsWith("3 wrong")) setErr("");
  }, [lock, err]);

  const tap = async (key: string) => {
    if (lock > 0 || busyRef.current) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setErr("");
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    setErr("");
    if (next.length === 4) {
      busyRef.current = true;
      const { data, error } = await supabase.rpc("verify_pin", {
        p_match: matchId,
        p_pin: next,
      });
      busyRef.current = false;
      if (error) {
        setPin("");
        setErr(error.message);
        return;
      }
      const res = data as { ok: boolean; error?: string; attempts_left?: number; locked_for?: number };
      if (res.ok) {
        onSuccess();
        return;
      }
      setPin("");
      setShake((s) => s + 1);
      if (res.error === "locked") {
        setLock(Number(res.locked_for ?? 60));
        setErr("3 wrong attempts — locked for 60 s.");
      } else if (res.error === "no_active_pin") {
        setErr(`No active PIN — ask ${employerFirst} to issue it first.`);
      } else {
        setErr(`PIN doesn't match — ${res.attempts_left ?? 0} attempts left`);
      }
    }
  };

  return (
    <Sheet onClose={onClose} z={45}>
      <div className="flex flex-col gap-3 rounded-t-[18px] p-5 pt-3.5">
        <div className="h-1 w-10 self-center rounded-full bg-line" />
        <div className="flex flex-col gap-[5px]">
          <h2 className="font-display text-[19px] font-bold tracking-tight">Enter completion PIN</h2>
          <p className="text-xs leading-normal text-slate">
            Ask {employerFirst} for the 4-digit PIN — issued after you&apos;ve been paid in cash.
          </p>
        </div>
        <div key={shake} className={`flex justify-center gap-[9px] ${shake ? "anim-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => {
            const v = pin[i] ?? "";
            const active = i === pin.length;
            return (
              <span
                key={i}
                className="flex h-[60px] w-[52px] items-center justify-center rounded-xl border-[1.5px] font-display text-[26px] font-bold"
                style={{
                  borderColor: err && !lock ? "#D92D20" : active || v ? "#103F96" : "#E2E7EF",
                  background: v ? "#F2F6FC" : "#fff",
                }}
              >
                {v}
              </span>
            );
          })}
        </div>
        {!!err && lock === 0 && (
          <p className="text-center text-xs font-semibold text-red">{err}</p>
        )}
        {lock > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-[10px] bg-bg-soft p-2.5 text-xs text-ink-body">
            <Icon name="clock" size={14} />
            Locked — try again in <span className="font-mono font-bold">{lock}s</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-[7px]">
          {PAD_KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => tap(key)}
              disabled={key === "" || lock > 0}
              className={`h-[52px] rounded-[11px] text-[21px] font-semibold active:bg-tint ${
                key === "⌫" ? "bg-white" : "bg-bg-soft"
              } ${key === "" ? "opacity-0" : lock > 0 ? "opacity-40" : ""}`}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] leading-normal text-ink-muted">
          The PIN records both sides agree the gig is complete. It doesn&apos;t move money.
        </p>
      </div>
    </Sheet>
  );
}

/* ============================ dispute sheet ============================ */

function DisputeSheet({
  matchId,
  onFiled,
  onClose,
}: {
  matchId: string;
  onFiled: (ticket: string) => void;
  onClose: () => void;
}) {
  const supabase = supabaseBrowser();
  const [reason, setReason] = useState(-1);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const can = reason >= 0 && !busy;

  const submit = async () => {
    if (!can) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("open_dispute", {
      p_match: matchId,
      p_reason: DISPUTE_REASONS[reason]!,
      p_detail: text,
    });
    setBusy(false);
    if (error || !data) return;
    onFiled(String(data).replace(/^D-/, ""));
  };

  return (
    <Sheet onClose={onClose} z={45}>
      <div className="flex flex-col gap-3 rounded-t-[18px] p-5 pt-3.5">
        <div className="h-1 w-10 self-center rounded-full bg-line" />
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[17px] font-semibold tracking-tight">Open a dispute</h2>
            <p className="text-[11.5px] leading-normal text-slate">
              For PIN or payment mismatches. Reviewed within 24 h — outcomes affect reputation, not
              pay.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-soft text-slate"
          >
            <Icon name="x" size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {DISPUTE_REASONS.map((label, i) => {
            const on = reason === i;
            return (
              <button
                key={label}
                onClick={() => setReason(i)}
                className={`flex items-center gap-2.5 rounded-[11px] border-[1.5px] px-3 py-[11px] text-left ${
                  on ? "border-royal bg-tint-soft" : "border-line bg-white"
                }`}
              >
                <span
                  className={`flex size-[17px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                    on ? "border-royal" : "border-line-dashed"
                  }`}
                >
                  {on && <span className="size-[7px] rounded-full bg-royal" />}
                </span>
                <span className="text-[12.5px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happened? (a sentence is enough)"
          className="min-h-[52px] w-full resize-none rounded-[11px] border border-line px-3 py-2.5 text-[12.5px] leading-normal outline-none focus:border-royal"
        />
        <button className="flex h-10 items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-dashed border-line-dashed text-xs font-medium text-slate">
          <Icon name="camera" size={14} />
          Add a photo (optional)
        </button>
        <button
          onClick={submit}
          disabled={!can}
          className={`h-12 w-full rounded-[10px] text-[13.5px] font-semibold ${
            can ? "bg-royal text-white hover:bg-royal-dark" : "bg-line text-ink-muted"
          }`}
        >
          {busy ? "Opening…" : "Open dispute"}
        </button>
      </div>
    </Sheet>
  );
}
