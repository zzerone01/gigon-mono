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

export type GigType = "Cleaning" | "Laundry" | "Delivery" | "Errands";

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
  erate: string;
  ejobs: number;
  since: string;
}

/** Applicant view model. */
export interface Applicant {
  id: string;
  name: string;
  init: string;
  rt: string;
  jobs: number;
  ns: string;
  nsBad: boolean;
  dist: string;
  tags: string;
  note: string;
}

export const FILTERS = ["All", "Cleaning", "Laundry", "Delivery", "Errands"] as const;

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
    erate: ratingLabel(e),
    ejobs: e.jobs_completed,
    since: new Date(e.created_at).toLocaleDateString("en-PH", {
      month: "short",
      year: "numeric",
    }),
  };
}

export function mapApplicant(p: ProfileRow, bizLoc: { lat: number; lng: number }): Applicant {
  const hasHistory = p.no_show_count > 0 || p.cancel_count > 0;
  return {
    id: p.id,
    name: p.full_name,
    init: initials(p.full_name),
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
  };
}
