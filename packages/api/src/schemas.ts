import { z } from "zod";

/**
 * Shared request/response contracts for the GigOn write API
 * (apps/app/app/api/**). Server route handlers parse requests with these
 * schemas; web and mobile clients import the same types, so a contract
 * change is a single-file edit that the compiler propagates everywhere.
 */

export const appRoleSchema = z.enum(["worker", "employer"]);
export type AppRole = z.infer<typeof appRoleSchema>;

export const gigTypeSchema = z.enum([
  "Cleaning",
  "Laundry",
  "Delivery",
  "Errands",
  "Construction",
  "Kitchen Help",
  "Events",
  "Others",
]);
export type GigType = z.infer<typeof gigTypeSchema>;

// ---------- request bodies ----------

export const onboardingBody = z.object({
  name: z.string(),
  role: appRoleSchema,
  area: z.string(),
  lat: z.number().nullish(),
  lng: z.number().nullish(),
});
export type OnboardingBody = z.infer<typeof onboardingBody>;

export const redeemInviteBody = z.object({
  code: z.string().min(1),
  businessName: z.string().nullish(),
});
export type RedeemInviteBody = z.infer<typeof redeemInviteBody>;

export const setRoleBody = z.object({
  role: appRoleSchema,
});
export type SetRoleBody = z.infer<typeof setRoleBody>;

export const updateProfileBody = z
  .object({
    skills: z.array(z.string().trim().min(1).max(24)).max(8).optional(),
    /** Public URL of an uploaded avatar; null clears the photo. */
    avatarUrl: z.string().url().max(600).nullish(),
    bio: z.string().max(200).optional(),
    languages: z.array(z.string().trim().min(1).max(20)).max(4).optional(),
    availability: z.string().max(60).optional(),
    /** Fresh device location (both or neither) — keeps distances honest. */
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine((b) => (b.lat === undefined) === (b.lng === undefined), {
    message: "lat and lng must be sent together",
  });
export type UpdateProfileBody = z.infer<typeof updateProfileBody>;

export const postGigBody = z.object({
  title: z.string().min(1),
  type: gigTypeSchema,
  description: z.string().nullish(),
  pay: z.number().int().positive(),
  duration: z.string().min(1),
  whenLabel: z.string().min(1),
  /** Gig start date "YYYY-MM-DD" (PH time); omitted = today (old clients). */
  startsOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  area: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  slots: z.number().int().min(1).max(5),
});
export type PostGigBody = z.infer<typeof postGigBody>;

export const cancelBody = z.object({
  reason: z.string().nullish(),
});
export type CancelBody = z.infer<typeof cancelBody>;

export const verifyPinBody = z.object({
  pin: z.string().min(1).max(16),
});
export type VerifyPinBody = z.infer<typeof verifyPinBody>;

export const openDisputeBody = z.object({
  reason: z.string().min(1),
  detail: z.string().nullish(),
});
export type OpenDisputeBody = z.infer<typeof openDisputeBody>;

export const postReviewBody = z.object({
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.string()).default([]),
  comment: z.string().nullish(),
});
export type PostReviewBody = z.infer<typeof postReviewBody>;

export const sendMessageBody = z.object({
  body: z.string().min(1).max(2000),
});
export type SendMessageBody = z.infer<typeof sendMessageBody>;

// ---------- responses ----------

/** Every endpoint except pin/verify wraps success as `{ data }`. */
export type IdResponse = { id: string };
export type MatchIdResponse = { matchId: string };
export type RedeemInviteResponse = { ok: boolean };
export type IssuePinResponse = { pin: string };
export type OpenDisputeResponse = { ticket: string };
export type SendMessageResponse = { id: number };

/**
 * pin/verify keeps the legacy RPC contract: always HTTP 200, the outcome
 * is data (clients consume it as state, not as an exception).
 */
export type VerifyPinResponse =
  | { ok: true }
  | { ok: false; error: "wrong_pin"; attempts_left: number }
  | { ok: false; error: "locked"; locked_for: number }
  | { ok: false; error: "no_active_pin" };

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_input"
  | "invalid_state"
  | "internal";

export type ApiErrorBody = { error: { code: ApiErrorCode | string; message: string } };
