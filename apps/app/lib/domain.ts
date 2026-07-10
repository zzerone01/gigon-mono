import type { Database } from "@repo/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Gig = Database["public"]["Tables"]["gigs"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type GigWithEmployer = Gig & { employer: Profile };
export type ApplicationWithWorker = Application & { worker: Profile };
export type MatchWithGig = Match & { gig: Gig };

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
export const FILTERS = ["All", ...GIG_TYPES] as const;

/** Worker skill options — mirrors the gig categories so applicant tags line up. */
export const SKILL_OPTIONS = GIG_TYPES.filter((t) => t !== "Others");

export const LANGUAGE_OPTIONS = ["English", "Tagalog", "Cebuano", "Ilonggo"];

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

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function ratingLabel(p: Pick<Profile, "rating_sum" | "rating_count">): string {
  if (!p.rating_count) return "New";
  return (p.rating_sum / p.rating_count).toFixed(1);
}

export function historyLabel(p: Pick<Profile, "no_show_count" | "cancel_count">): {
  label: string;
  bad: boolean;
} {
  if (p.no_show_count > 0)
    return { label: `${p.no_show_count} no-show${p.no_show_count > 1 ? "s" : ""}`, bad: true };
  if (p.cancel_count > 0) return { label: `${p.cancel_count} cancel · 30 d`, bad: true };
  return { label: "0 no-shows", bad: false };
}

/** Mono state badge palette (matches the design's BADGES map). */
export function badgeStyle(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "POSTED":
      return { label: "LIVE", bg: "#1AA75A", color: "#FFFFFF" };
    case "APPLIED":
      return { label: "APPLIED", bg: "#E7EDF8", color: "#0B2E6F" };
    case "MATCHED":
      return { label: "MATCHED", bg: "#103F96", color: "#FFFFFF" };
    case "IN_PROGRESS":
      return { label: "IN_PROGRESS", bg: "#F5A623", color: "#0F1B2E" };
    case "COMPLETED":
    case "RATED":
      return { label: "COMPLETED", bg: "#1AA75A", color: "#FFFFFF" };
    case "NO_SHOW":
      return { label: "NO_SHOW", bg: "#D92D20", color: "#FFFFFF" };
    case "CANCELLED":
      return { label: "CANCELLED", bg: "#5B6675", color: "#FFFFFF" };
    case "EXPIRED":
      return { label: "EXPIRED", bg: "#E7EDF8", color: "#5B6675" };
    default:
      return { label: status, bg: "#E7EDF8", color: "#0B2E6F" };
  }
}

export function stepIndex(status: string | null): number {
  switch (status) {
    case "APPLIED":
    case "POSTED":
      return 0;
    case "MATCHED":
      return 1;
    case "IN_PROGRESS":
      return 2;
    case "COMPLETED":
    case "RATED":
      return 4;
    default:
      return 0;
  }
}
