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

export const GIG_TYPES = ["Cleaning", "Laundry", "Delivery", "Errands"] as const;
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
