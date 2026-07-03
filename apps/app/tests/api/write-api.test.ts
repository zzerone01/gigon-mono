/**
 * Integration tests for the 15 write endpoints — the TS port of the SQL RPC
 * state machine. Requires the local supabase stack (`npx supabase start`);
 * vitest.config.ts pins DATABASE_URL etc. to the local ports.
 *
 * Auth uses the config.toml test-OTP numbers (639171234001/2/3, OTP 123456):
 * 1 = employer (invite-verified in setup), 2 = worker, 3 = bystander.
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST as selectApplicant } from "@/app/api/applications/[id]/select/route";
import { POST as applyToGig } from "@/app/api/gigs/[id]/apply/route";
import { POST as cancelGig } from "@/app/api/gigs/[id]/cancel/route";
import { POST as postGig } from "@/app/api/gigs/route";
import { POST as redeemInvite } from "@/app/api/invites/redeem/route";
import { POST as arrive } from "@/app/api/matches/[id]/arrive/route";
import { POST as cancelMatch } from "@/app/api/matches/[id]/cancel/route";
import { POST as openDispute } from "@/app/api/matches/[id]/dispute/route";
import { POST as sendMessage } from "@/app/api/matches/[id]/messages/route";
import { POST as reportNoShow } from "@/app/api/matches/[id]/no-show/route";
import { POST as issuePin } from "@/app/api/matches/[id]/pin/route";
import { POST as verifyPin } from "@/app/api/matches/[id]/pin/verify/route";
import { POST as postReview } from "@/app/api/matches/[id]/review/route";
import { POST as onboarding } from "@/app/api/onboarding/route";
import { POST as setRole } from "@/app/api/profile/role/route";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

type Session = { id: string; token: string };

async function login(phone: string): Promise<Session> {
  const supa = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await supa.auth.signInWithOtp({ phone });
  const { data, error } = await supa.auth.verifyOtp({ phone, token: "123456", type: "sms" });
  if (error || !data.session || !data.user) throw error ?? new Error("no session");
  return { id: data.user.id, token: data.session.access_token };
}

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

async function call(
  handler: Handler,
  who: Session | null,
  body?: unknown,
  id?: string,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (who) headers.authorization = `Bearer ${who.token}`;
  const req = new Request("http://test/api", {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });
  const res = await handler(req, { params: Promise.resolve({ id: id ?? "" }) });
  return { status: res.status, json: await res.json() };
}

let employer: Session;
let worker: Session;
let bystander: Session;

const GIG_BODY = {
  title: "Test gig",
  type: "Cleaning" as const,
  description: "integration test",
  pay: 300,
  duration: "2 hrs",
  whenLabel: "Today · 2:00 – 4:00 PM",
  area: "Pusok",
  lat: 10.3208,
  lng: 123.96,
  slots: 1,
};

/** post (employer) → apply (worker) → returns ids; optionally select+arrive. */
async function makeGig() {
  const g = await call(postGig, employer, GIG_BODY);
  expect(g.status).toBe(200);
  const gigId: string = g.json.data.id;
  const a = await call(applyToGig, worker, {}, gigId);
  expect(a.status).toBe(200);
  return { gigId, applicationId: a.json.data.id as string };
}

async function makeMatch() {
  const { gigId, applicationId } = await makeGig();
  const s = await call(selectApplicant, employer, {}, applicationId);
  expect(s.status).toBe(200);
  return { gigId, applicationId, matchId: s.json.data.matchId as string };
}

beforeAll(async () => {
  employer = await login("639171234001");
  worker = await login("639171234002");
  bystander = await login("639171234003");

  const redeemed = await call(redeemInvite, employer, {
    code: "MACTAN-30",
    businessName: "Test Café",
  });
  expect(redeemed.json.data).toEqual({ ok: true });
  await call(onboarding, employer, { name: "Boss Tester", role: "employer", area: "Pusok" });
  await call(onboarding, worker, {
    name: "Worker Tester",
    role: "worker",
    area: "Basak",
    lat: 10.295,
    lng: 123.9496,
  });
  await call(onboarding, bystander, { name: "Bystander", role: "worker", area: "Agus" });
});

afterAll(async () => {
  await sql.end();
});

describe("auth & role guards", () => {
  it("rejects a bad bearer token with 401 JSON", async () => {
    const res = await call(postGig, { id: "x", token: "not-a-jwt" }, GIG_BODY);
    expect(res.status).toBe(401);
    expect(res.json.error.code).toBe("unauthorized");
  });

  it("blocks gig posting for non-invite-verified employers", async () => {
    const res = await call(postGig, bystander, GIG_BODY);
    expect(res.status).toBe(403);
    expect(res.json.error.message).toBe("employer not invite-verified");
  });

  it("rejects an unknown invite code as ok:false (200)", async () => {
    const res = await call(redeemInvite, bystander, { code: "NOPE-99" });
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual({ ok: false });
  });

  it("switches active role", async () => {
    expect((await call(setRole, worker, { role: "employer" })).status).toBe(200);
    const [p] = await sql`select active_role from profiles where id = ${worker.id}`;
    expect(p!.active_role).toBe("employer");
    await call(setRole, worker, { role: "worker" });
  });

  it("rejects invalid input with 400", async () => {
    const res = await call(postGig, employer, { ...GIG_BODY, pay: -5 });
    expect(res.status).toBe(400);
    expect(res.json.error.code).toBe("invalid_input");
  });
});

describe("full happy path", () => {
  let gigId: string;
  let applicationId: string;
  let matchId: string;
  let pin: string;

  it("posts a gig with 24h expiry defaults", async () => {
    const res = await call(postGig, employer, GIG_BODY);
    expect(res.status).toBe(200);
    gigId = res.json.data.id;
    const [g] = await sql`select status, expires_at > now() as open from gigs where id = ${gigId}`;
    expect(g!.status).toBe("POSTED");
    expect(g!.open).toBe(true);
  });

  it("blocks applying to your own gig", async () => {
    const res = await call(applyToGig, employer, {}, gigId);
    expect(res.status).toBe(403);
    expect(res.json.error.message).toBe("cannot apply to your own gig");
  });

  it("lets the worker apply (idempotent re-apply keeps one row)", async () => {
    const first = await call(applyToGig, worker, {}, gigId);
    expect(first.status).toBe(200);
    applicationId = first.json.data.id;
    const again = await call(applyToGig, worker, {}, gigId);
    expect(again.json.data.id).toBe(applicationId);
  });

  it("blocks selecting an applicant on someone else's gig", async () => {
    const res = await call(selectApplicant, worker, {}, applicationId);
    expect(res.status).toBe(403);
    expect(res.json.error.message).toBe("not your gig");
  });

  it("selects the applicant → MATCHED + ₱0 billable event", async () => {
    const res = await call(selectApplicant, employer, {}, applicationId);
    expect(res.status).toBe(200);
    matchId = res.json.data.matchId;
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("MATCHED");
    const [a] = await sql`select status from applications where id = ${applicationId}`;
    expect(a!.status).toBe("SELECTED");
    const [b] =
      await sql`select event_type, amount::int as amount from billable_events where match_id = ${matchId}`;
    expect(b).toMatchObject({ event_type: "match_confirmed", amount: 0 });
  });

  it("second applicant can't be selected once matched (race guard)", async () => {
    const late = await call(applyToGig, bystander, {}, gigId);
    expect(late.status).toBe(409);
    expect(late.json.error.message).toBe("gig is not open");
  });

  it("chat is open to participants only", async () => {
    const msg = await call(sendMessage, worker, { body: "On my way po" }, matchId);
    expect(msg.status).toBe(200);
    expect(typeof msg.json.data.id).toBe("number");
    const intruder = await call(sendMessage, bystander, { body: "hi" }, matchId);
    expect(intruder.status).toBe(403);
  });

  it("only the worker can mark arrival", async () => {
    const notWorker = await call(arrive, employer, {}, matchId);
    expect(notWorker.status).toBe(409);
    const res = await call(arrive, worker, {}, matchId);
    expect(res.status).toBe(200);
    const [m] = await sql`select status, arrived_at from matches where id = ${matchId}`;
    expect(m!.status).toBe("IN_PROGRESS");
    expect(m!.arrived_at).not.toBeNull();
  });

  it("verify before any PIN is issued → no_active_pin", async () => {
    const res = await call(verifyPin, worker, { pin: "0000" }, matchId);
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ ok: false, error: "no_active_pin" });
  });

  it("only the employer can issue the PIN", async () => {
    const notEmployer = await call(issuePin, worker, {}, matchId);
    expect(notEmployer.status).toBe(409);
    const res = await call(issuePin, employer, {}, matchId);
    expect(res.status).toBe(200);
    pin = res.json.data.pin;
    expect(pin).toMatch(/^\d{4}$/);
  });

  it("two wrong attempts count down attempts_left", async () => {
    const wrong = pin === "9999" ? "0000" : "9999";
    const first = await call(verifyPin, worker, { pin: wrong }, matchId);
    expect(first.json).toEqual({ ok: false, error: "wrong_pin", attempts_left: 2 });
    const second = await call(verifyPin, worker, { pin: wrong }, matchId);
    expect(second.json).toEqual({ ok: false, error: "wrong_pin", attempts_left: 1 });
  });

  it("the correct PIN completes match, gig and worker stats", async () => {
    const [before] = await sql`select jobs_completed from profiles where id = ${worker.id}`;
    const res = await call(verifyPin, worker, { pin }, matchId);
    expect(res.json).toEqual({ ok: true });
    const [m] = await sql`select status, completed_at from matches where id = ${matchId}`;
    expect(m!.status).toBe("COMPLETED");
    expect(m!.completed_at).not.toBeNull();
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("COMPLETED");
    const [after] = await sql`select jobs_completed from profiles where id = ${worker.id}`;
    expect(after!.jobs_completed).toBe(before!.jobs_completed + 1);
    const pins = await sql`select 1 from match_pins where match_id = ${matchId}`;
    expect(pins.length).toBe(0);
  });

  it("both sides review; ratee aggregates update; duplicates 409", async () => {
    const [before] = await sql`select rating_sum, rating_count from profiles where id = ${worker.id}`;
    const r1 = await call(postReview, employer, { stars: 5, tags: ["fast"] }, matchId);
    expect(r1.status).toBe(200);
    const r2 = await call(
      postReview,
      worker,
      { stars: 4, tags: [], comment: "salamat" },
      matchId,
    );
    expect(r2.status).toBe(200);
    const [after] = await sql`select rating_sum, rating_count from profiles where id = ${worker.id}`;
    expect(after!.rating_sum).toBe(before!.rating_sum + 5);
    expect(after!.rating_count).toBe(before!.rating_count + 1);
    const dup = await call(postReview, employer, { stars: 1, tags: [] }, matchId);
    expect(dup.status).toBe(409);
    expect(dup.json.error.message).toBe("already reviewed");
    const outsider = await call(postReview, bystander, { stars: 5, tags: [] }, matchId);
    expect(outsider.status).toBe(403);
  });

  it("writes the audit trail in order with explicit actors", async () => {
    const rows = await sql`
      select event, actor_id from audit_log
      where gig_id = ${gigId} or match_id = ${matchId}
      order by id`;
    expect(rows.map((r) => r.event)).toEqual([
      "gig_posted",
      "applied",
      "applied", // the idempotent re-apply audits again, same as the old RPC
      "match_confirmed",
      "arrived",
      "pin_issued",
      "pin_verified_completed",
      "review_posted",
      "review_posted",
    ]);
    expect(rows.every((r) => r.actor_id !== null)).toBe(true);
  });
});

describe("PIN lockout & expiry", () => {
  it("locks after 3 misses, honors the lock, then verifies after it lifts", async () => {
    const { matchId } = await makeMatch();
    await call(arrive, worker, {}, matchId);
    const issued = await call(issuePin, employer, {}, matchId);
    const pin: string = issued.json.data.pin;
    const wrong = pin === "9999" ? "0000" : "9999";

    await call(verifyPin, worker, { pin: wrong }, matchId);
    await call(verifyPin, worker, { pin: wrong }, matchId);
    const third = await call(verifyPin, worker, { pin: wrong }, matchId);
    expect(third.json).toEqual({ ok: false, error: "locked", locked_for: 60 });

    const during = await call(verifyPin, worker, { pin }, matchId);
    expect(during.json.ok).toBe(false);
    expect(during.json.error).toBe("locked");
    expect(during.json.locked_for).toBeGreaterThan(0);

    await sql`update match_pins set locked_until = now() - interval '1 second' where match_id = ${matchId}`;
    const after = await call(verifyPin, worker, { pin }, matchId);
    expect(after.json).toEqual({ ok: true });
  });

  it("a PIN older than 24h is no_active_pin; re-issue rotates it", async () => {
    const { matchId } = await makeMatch();
    await call(arrive, worker, {}, matchId);
    const first = await call(issuePin, employer, {}, matchId);
    await sql`update match_pins set issued_at = now() - interval '25 hours' where match_id = ${matchId}`;
    const stale = await call(verifyPin, worker, { pin: first.json.data.pin }, matchId);
    expect(stale.json).toEqual({ ok: false, error: "no_active_pin" });

    const second = await call(issuePin, employer, {}, matchId);
    const res = await call(verifyPin, worker, { pin: second.json.data.pin }, matchId);
    expect(res.json).toEqual({ ok: true });
  });

  it("non-worker verify → 404, pre-arrival verify → 409", async () => {
    const { matchId } = await makeMatch();
    const notWorker = await call(verifyPin, employer, { pin: "1234" }, matchId);
    expect(notWorker.status).toBe(404);
    const early = await call(verifyPin, worker, { pin: "1234" }, matchId);
    expect(early.status).toBe(409);
  });
});

describe("cancellations", () => {
  it("A: worker cancel → WITHDRAWN + gig reopens + cancel_count", async () => {
    const { gigId, applicationId, matchId } = await makeMatch();
    const [before] = await sql`select cancel_count from profiles where id = ${worker.id}`;
    const res = await call(cancelMatch, worker, { reason: "emergency" }, matchId);
    expect(res.status).toBe(200);
    const [m] = await sql`select status, cancelled_by, cancel_reason from matches where id = ${matchId}`;
    expect(m).toMatchObject({ status: "CANCELLED", cancelled_by: worker.id, cancel_reason: "emergency" });
    const [a] = await sql`select status from applications where id = ${applicationId}`;
    expect(a!.status).toBe("WITHDRAWN");
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("POSTED");
    const [after] = await sql`select cancel_count from profiles where id = ${worker.id}`;
    expect(after!.cancel_count).toBe(before!.cancel_count + 1);

    const twice = await call(cancelMatch, worker, {}, matchId);
    expect(twice.status).toBe(409);
  });

  it("B: employer cancel → REJECTED + gig CANCELLED", async () => {
    const { gigId, applicationId, matchId } = await makeMatch();
    const res = await call(cancelMatch, employer, { reason: "closed today" }, matchId);
    expect(res.status).toBe(200);
    const [a] = await sql`select status from applications where id = ${applicationId}`;
    expect(a!.status).toBe("REJECTED");
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("CANCELLED");
  });

  it("C: cancelling an open posting rejects pending applications, no penalty", async () => {
    const { gigId, applicationId } = await makeGig();
    const [before] = await sql`select cancel_count from profiles where id = ${employer.id}`;
    const res = await call(cancelGig, employer, { reason: "plans changed" }, gigId);
    expect(res.status).toBe(200);
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("CANCELLED");
    const [a] = await sql`select status from applications where id = ${applicationId}`;
    expect(a!.status).toBe("REJECTED");
    const [after] = await sql`select cancel_count from profiles where id = ${employer.id}`;
    expect(after!.cancel_count).toBe(before!.cancel_count);

    const twice = await call(cancelGig, employer, {}, gigId);
    expect(twice.status).toBe(409);
  });

  it("D: non-participants get 404, post-arrival cancel gets 409", async () => {
    const { matchId } = await makeMatch();
    const outsider = await call(cancelMatch, bystander, {}, matchId);
    expect(outsider.status).toBe(404);
    await call(arrive, worker, {}, matchId);
    const late = await call(cancelMatch, worker, {}, matchId);
    expect(late.status).toBe(409);
    expect(late.json.error.message).toMatch(/no-show or dispute/);
  });
});

describe("no-show", () => {
  it("reopens a live gig and increments the worker's no_show_count", async () => {
    const { gigId, applicationId, matchId } = await makeMatch();
    const [before] = await sql`select no_show_count from profiles where id = ${worker.id}`;
    const notEmployer = await call(reportNoShow, worker, {}, matchId);
    expect(notEmployer.status).toBe(409);
    const res = await call(reportNoShow, employer, {}, matchId);
    expect(res.status).toBe(200);
    const [m] = await sql`select status from matches where id = ${matchId}`;
    expect(m!.status).toBe("NO_SHOW");
    const [a] = await sql`select status from applications where id = ${applicationId}`;
    expect(a!.status).toBe("REJECTED");
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("POSTED");
    const [after] = await sql`select no_show_count from profiles where id = ${worker.id}`;
    expect(after!.no_show_count).toBe(before!.no_show_count + 1);
  });

  it("a no-show on an expired posting closes it as EXPIRED", async () => {
    const { gigId, matchId } = await makeMatch();
    await sql`update gigs set expires_at = now() - interval '1 hour' where id = ${gigId}`;
    const res = await call(reportNoShow, employer, {}, matchId);
    expect(res.status).toBe(200);
    const [g] = await sql`select status from gigs where id = ${gigId}`;
    expect(g!.status).toBe("EXPIRED");
  });
});

describe("disputes & review gating", () => {
  it("participants open disputes and get a ticket; outsiders 403", async () => {
    const { matchId } = await makeMatch();
    const res = await call(openDispute, worker, { reason: "pay mismatch", detail: "said 400" }, matchId);
    expect(res.status).toBe(200);
    expect(res.json.data.ticket).toMatch(/^D-\d{4,}$/);
    const outsider = await call(openDispute, bystander, { reason: "nosy" }, matchId);
    expect(outsider.status).toBe(403);
  });

  it("reviews are locked until PIN completion", async () => {
    const { matchId } = await makeMatch();
    const res = await call(postReview, employer, { stars: 5, tags: [] }, matchId);
    expect(res.status).toBe(409);
    expect(res.json.error.message).toBe("reviews unlock only after PIN completion");
  });

  it("expired gigs reject applications", async () => {
    const { gigId } = await makeGig();
    await sql`update gigs set expires_at = now() - interval '1 minute' where id = ${gigId}`;
    const res = await call(applyToGig, bystander, {}, gigId);
    expect(res.status).toBe(409);
    expect(res.json.error.message).toBe("gig is not open");
  });
});
