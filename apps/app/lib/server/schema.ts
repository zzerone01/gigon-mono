/**
 * Drizzle table definitions for querying only — the schema source of truth
 * stays in supabase/migrations/*.sql (supabase CLI). Keep this file in sync
 * by hand when a migration lands; drizzle-kit is NOT used for migrations.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const appRole = pgEnum("app_role", ["worker", "employer"]);
export const gigType = pgEnum("gig_type", ["Cleaning", "Laundry", "Delivery", "Errands"]);
export const gigStatus = pgEnum("gig_status", [
  "POSTED",
  "MATCHED",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
  "EXPIRED",
]);
export const applicationStatus = pgEnum("application_status", [
  "APPLIED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
]);
export const matchStatus = pgEnum("match_status", [
  "MATCHED",
  "IN_PROGRESS",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);
export const disputeStatus = pgEnum("dispute_status", ["OPEN", "RESOLVED"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull().default("New user"),
  activeRole: appRole("active_role").notNull().default("worker"),
  area: text("area"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  skills: text("skills").array().notNull().default([]),
  businessName: text("business_name"),
  employerVerified: boolean("employer_verified").notNull().default(false),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  noShowCount: integer("no_show_count").notNull().default(0),
  cancelCount: integer("cancel_count").notNull().default(0),
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inviteCodes = pgTable("invite_codes", {
  code: text("code").primaryKey(),
  usesLeft: integer("uses_left").notNull().default(9999),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gigs = pgTable("gigs", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id").notNull(),
  title: text("title").notNull(),
  type: gigType("type").notNull(),
  description: text("description").notNull().default(""),
  pay: integer("pay").notNull(),
  duration: text("duration").notNull().default("2 hrs"),
  whenLabel: text("when_label").notNull(),
  area: text("area").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  slots: integer("slots").notNull().default(1),
  status: gigStatus("status").notNull().default("POSTED"),
  expiresAt: timestamp("expires_at", { withTimezone: true })
    .notNull()
    .default(sql`now() + interval '24 hours'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gigId: uuid("gig_id").notNull(),
    workerId: uuid("worker_id").notNull(),
    status: applicationStatus("status").notNull().default("APPLIED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.gigId, t.workerId)],
);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  gigId: uuid("gig_id").notNull(),
  applicationId: uuid("application_id").notNull(),
  workerId: uuid("worker_id").notNull(),
  employerId: uuid("employer_id").notNull(),
  status: matchStatus("status").notNull().default("MATCHED"),
  pinIssuedAt: timestamp("pin_issued_at", { withTimezone: true }),
  arrivedAt: timestamp("arrived_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledBy: uuid("cancelled_by"),
  cancelReason: text("cancel_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** PIN secrets — no client grants at all; only this API reads it. */
export const matchPins = pgTable("match_pins", {
  matchId: uuid("match_id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

export const billableEvents = pgTable("billable_events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  matchId: uuid("match_id").notNull(),
  eventType: text("event_type").notNull().default("match_confirmed"),
  amount: numeric("amount").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  matchId: uuid("match_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id").notNull(),
    raterId: uuid("rater_id").notNull(),
    rateeId: uuid("ratee_id").notNull(),
    stars: integer("stars").notNull(),
    tags: text("tags").array().notNull().default([]),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.matchId, t.raterId)],
);

export const disputes = pgTable("disputes", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  matchId: uuid("match_id").notNull(),
  openerId: uuid("opener_id").notNull(),
  reason: text("reason").notNull(),
  detail: text("detail").notNull().default(""),
  status: disputeStatus("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Expo push tokens — API-only (no client grants), one row per device. */
export const pushTokens = pgTable("push_tokens", {
  token: text("token").primaryKey(),
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull().default("android"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  matchId: uuid("match_id"),
  gigId: uuid("gig_id"),
  actorId: uuid("actor_id"),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
