/**
 * View models + constants for the mobile screens.
 * DB rows (see @repo/supabase/types) are mapped into these shapes by the
 * store, so the screens keep the exact fields the design was built around.
 */
import type { Database } from "@repo/supabase/types";

import { distanceMeters, formatDistance } from "../lib/geo";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
export type GigWithEmployer = GigRow & { employer: ProfileRow };

export const GIG_TYPES = [
  "Cleaning",
  "Laundry",
  "Delivery",
  "Errands",
  "Construction",
  "Kitchen Help",
  "Events",
  "Others",
] as const;
export type GigType = (typeof GIG_TYPES)[number];

/** Worker skill options — mirrors the gig categories so applicant tags line up. */
export const SKILL_OPTIONS = GIG_TYPES.filter((t) => t !== "Others");

export const LANGUAGE_OPTIONS = ["English", "Tagalog", "Cebuano", "Ilonggo"];

/** Gig view model (fields the screens consume). */
export interface Gig {
  id: string;
  t: string;
  biz: string;
  area: string;
  type: GigType;
  pay: number;
  hrs: string;
  when: string;
  dist: string;
  slots: string;
  lat: number;
  lng: number;
  desc: string;
  er: string;
  einit: string;
  ephoto: string | null;
  erate: string;
  ereviews: number;
  ejobs: number;
  since: string;
}

/** Applicant view model. */
export interface Applicant {
  id: string;
  name: string;
  init: string;
  photo: string | null;
  rt: string;
  jobs: number;
  ns: string;
  nsBad: boolean;
  dist: string;
  tags: string;
  note: string;
  /** Platform-verified line, e.g. "Cleaning ×12 · rehired ×2" ("" if none). */
  verified: string;
  /** Top review tags, e.g. "“On time” ×8 · “Quality work” ×5". */
  vtags: string;
  bio: string;
  langs: string;
}

/** Platform-verified stats for one worker (from the worker_*_stats views). */
export interface WorkerStats {
  cats: string;
  rehires: number;
  tags: string;
}

/** Fold the three stats-view result sets into a per-worker map. */
export function buildWorkerStats(
  cat: { worker_id: string | null; type: string | null; completed: number | null }[],
  reh: { worker_id: string | null; rehire_businesses: number | null }[],
  tag: { worker_id: string | null; tag: string | null; cnt: number | null }[],
): Record<string, WorkerStats> {
  const map: Record<string, WorkerStats> = {};
  const ensure = (id: string) => (map[id] ??= { cats: "", rehires: 0, tags: "" });
  const catByWorker: Record<string, { type: string; completed: number }[]> = {};
  for (const r of cat)
    if (r.worker_id && r.type && r.completed)
      (catByWorker[r.worker_id] ??= []).push({ type: r.type, completed: r.completed });
  for (const [id, rows] of Object.entries(catByWorker)) {
    rows.sort((a, b) => b.completed - a.completed);
    ensure(id).cats = rows
      .slice(0, 3)
      .map((r) => `${r.type} ×${r.completed}`)
      .join(" · ");
  }
  for (const r of reh)
    if (r.worker_id && r.rehire_businesses) ensure(r.worker_id).rehires = r.rehire_businesses;
  const tagByWorker: Record<string, { tag: string; cnt: number }[]> = {};
  for (const r of tag)
    if (r.worker_id && r.tag && r.cnt)
      (tagByWorker[r.worker_id] ??= []).push({ tag: r.tag, cnt: r.cnt });
  for (const [id, rows] of Object.entries(tagByWorker)) {
    rows.sort((a, b) => b.cnt - a.cnt);
    ensure(id).tags = rows
      .slice(0, 2)
      .map((r) => `“${r.tag}” ×${r.cnt}`)
      .join(" · ");
  }
  return map;
}

export const FILTERS = ["All", ...GIG_TYPES] as const;

export const WORKER_RATE_TAGS = [
  "Paid exactly as agreed",
  "On time",
  "Clear instructions",
  "Would work again",
];

export const EMPLOYER_RATE_TAGS = [
  "On time",
  "Quality work",
  "Followed instructions",
  "Would hire again",
];

export const DISPUTE_REASONS = [
  "PIN doesn't match what happened",
  "Pay was different than agreed",
  "Work quality / other",
];

export const WORKER_CANCEL_REASONS = [
  "Emergency — can't make it",
  "Schedule conflict",
  "Took another gig",
  "Other",
];

export const EMPLOYER_CANCEL_REASONS = [
  "No longer needed",
  "Rescheduled — will repost",
  "Made other arrangements",
  "Other",
];

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ratingLabel(p: Pick<ProfileRow, "rating_sum" | "rating_count">): string {
  if (!p.rating_count) return "New";
  return (p.rating_sum / p.rating_count).toFixed(1);
}

export function mapGig(row: GigWithEmployer, you: { lat: number; lng: number }): Gig {
  const e = row.employer;
  return {
    id: row.id,
    t: row.title,
    biz: e.business_name ?? e.full_name,
    area: row.area,
    type: row.type as GigType,
    pay: row.pay,
    hrs: row.duration,
    when: row.when_label,
    dist: formatDistance(distanceMeters(you, { lat: row.lat, lng: row.lng })),
    slots: `${row.slots} slot${row.slots > 1 ? "s" : ""}`,
    lat: row.lat,
    lng: row.lng,
    desc: row.description,
    er: e.full_name,
    einit: initials(e.business_name ?? e.full_name),
    ephoto: e.avatar_url,
    erate: ratingLabel(e),
    ereviews: e.rating_count,
    ejobs: e.jobs_completed,
    since: new Date(e.created_at).toLocaleDateString("en-PH", {
      month: "short",
      year: "numeric",
    }),
  };
}

export function mapApplicant(
  p: ProfileRow,
  bizLoc: { lat: number; lng: number },
  stats?: WorkerStats,
): Applicant {
  const hasHistory = p.no_show_count > 0 || p.cancel_count > 0;
  const verifiedBits = [
    ...(stats?.cats ? [stats.cats] : []),
    ...(stats?.rehires ? [`rehired ×${stats.rehires}`] : []),
  ];
  return {
    id: p.id,
    name: p.full_name,
    init: initials(p.full_name),
    photo: p.avatar_url,
    rt: ratingLabel(p),
    jobs: p.jobs_completed,
    ns:
      p.no_show_count > 0
        ? `${p.no_show_count} no-show${p.no_show_count > 1 ? "s" : ""}`
        : p.cancel_count > 0
          ? `${p.cancel_count} cancel · 30 d`
          : "0 no-shows",
    nsBad: hasHistory,
    dist:
      p.lat && p.lng
        ? formatDistance(distanceMeters(bizLoc, { lat: p.lat, lng: p.lng }))
        : "nearby",
    tags: p.skills.length ? p.skills.join(" · ") : "General",
    note: p.area ?? "Mactan",
    verified: verifiedBits.join(" · "),
    vtags: stats?.tags ?? "",
    bio: p.bio,
    langs: p.languages.join(" / "),
  };
}
