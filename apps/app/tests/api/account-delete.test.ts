/**
 * /api/account/delete — local supabase stack. Uses the dedicated 004/005
 * test-OTP numbers (config.toml) so the parallel test files' accounts
 * (001–003) are never deleted from under them.
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST as deleteAccount } from "@/app/api/account/delete/route";
import { POST as selectApplicant } from "@/app/api/applications/[id]/select/route";
import { POST as applyToGig } from "@/app/api/gigs/[id]/apply/route";
import { POST as postGig } from "@/app/api/gigs/route";
import { POST as redeemInvite } from "@/app/api/invites/redeem/route";
import { POST as arrive } from "@/app/api/matches/[id]/arrive/route";
import { POST as sendMessage } from "@/app/api/matches/[id]/messages/route";
import { POST as onboarding } from "@/app/api/onboarding/route";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const GIG_BODY = {
  title: "Delete-me gig",
  type: "Cleaning" as const,
  description: "account deletion test",
  pay: 300,
  duration: "2 hrs",
  whenLabel: "Today · 2:00 – 4:00 PM",
  area: "Pusok",
  lat: 10.3208,
  lng: 123.96,
  slots: 1,
};

let employer: Session;
let worker: Session;

beforeAll(async () => {
  employer = await login("639171234005");
  worker = await login("639171234004");
  await call(redeemInvite, employer, { code: "MACTAN-30", businessName: "Delete Café" });
  await call(onboarding, employer, { name: "Delete Boss", role: "employer", area: "Pusok" });
  await call(onboarding, worker, {
    name: "Delete Worker",
    role: "worker",
    area: "Basak",
    lat: 10.295,
    lng: 123.9496,
  });
});

afterAll(async () => {
  await sql.end();
});

describe("account deletion", () => {
  it("rejects unauthenticated calls", async () => {
    const res = await call(deleteAccount, null);
    expect(res.status).toBe(401);
  });

  it("rejects cross-origin browser requests without a bearer token", async () => {
    // Foreign, "null" (sandboxed iframe), and malformed Origins are all 403.
    for (const origin of ["https://evil.example", "null", "not a url"]) {
      const req = new Request("http://test/api", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: "{}",
      });
      const res = await deleteAccount(req, { params: Promise.resolve({}) });
      expect(res.status).toBe(403);
    }
  });

  it("lets same-origin and bearer requests past the CSRF check", async () => {
    // Same-origin cookie-style request → passes the check, fails auth (401).
    const sameOrigin = new Request("http://test/api", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://test" },
      body: "{}",
    });
    expect((await deleteAccount(sameOrigin, { params: Promise.resolve({}) })).status).toBe(401);

    // Bearer callers skip the Origin check entirely (mobile sets no Origin,
    // but must never be blocked by one) — bad token still fails auth, not CSRF.
    const bearer = new Request("http://test/api", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        authorization: "Bearer not-a-real-token",
      },
      body: "{}",
    });
    expect((await deleteAccount(bearer, { params: Promise.resolve({}) })).status).toBe(401);
  });

  it("deletes a worker with live activity, reopening the counterparty's gigs", async () => {
    // Gig A — matched, worker arrived (IN_PROGRESS), chatted.
    const gA = await call(postGig, employer, GIG_BODY);
    expect(gA.status).toBe(200);
    const gigA: string = gA.json.data.id;
    const aA = await call(applyToGig, worker, {}, gigA);
    expect(aA.status).toBe(200);
    const sA = await call(selectApplicant, employer, {}, aA.json.data.id as string);
    expect(sA.status).toBe(200);
    const matchId: string = sA.json.data.matchId;
    expect((await call(arrive, worker, {}, matchId)).status).toBe(200);
    expect((await call(sendMessage, worker, { body: "on my way" }, matchId)).status).toBe(200);

    // Gig B — matched, but its posting window already lapsed.
    const gB = await call(postGig, employer, GIG_BODY);
    const gigB: string = gB.json.data.id;
    const aB = await call(applyToGig, worker, {}, gigB);
    expect((await call(selectApplicant, employer, {}, aB.json.data.id as string)).status).toBe(200);
    await sql`update gigs set expires_at = now() - interval '1 minute' where id = ${gigB}`;

    const res = await call(deleteAccount, worker);
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual({ deleted: true });

    // Account and every row that pointed at it are gone…
    expect(await sql`select 1 from auth.users where id = ${worker.id}`).toHaveLength(0);
    expect(await sql`select 1 from profiles where id = ${worker.id}`).toHaveLength(0);
    expect(await sql`select 1 from applications where worker_id = ${worker.id}`).toHaveLength(0);
    expect(await sql`select 1 from matches where worker_id = ${worker.id}`).toHaveLength(0);
    expect(await sql`select 1 from messages where sender_id = ${worker.id}`).toHaveLength(0);
    // …while the counterparty's gigs reopen for other applicants (or expire
    // if their window lapsed), and the audit trail is kept.
    const [gigARow] = await sql`select status from gigs where id = ${gigA}`;
    expect(gigARow!.status).toBe("POSTED");
    const [gigBRow] = await sql`select status from gigs where id = ${gigB}`;
    expect(gigBRow!.status).toBe("EXPIRED");
    expect(
      await sql`select 1 from audit_log where actor_id = ${worker.id} and event = 'account_deleted'`,
    ).toHaveLength(1);

    // The old token no longer authenticates.
    expect((await call(deleteAccount, worker)).status).toBe(401);
    // No cleanup needed: the employer-deletion test below removes gigs A & B.
  });

  it("deletes an employer and cascades their gigs", async () => {
    const g = await call(postGig, employer, GIG_BODY);
    expect(g.status).toBe(200);
    const gigId: string = g.json.data.id;

    const res = await call(deleteAccount, employer);
    expect(res.status).toBe(200);

    expect(await sql`select 1 from auth.users where id = ${employer.id}`).toHaveLength(0);
    expect(await sql`select 1 from profiles where id = ${employer.id}`).toHaveLength(0);
    expect(await sql`select 1 from gigs where id = ${gigId}`).toHaveLength(0);
  });
});
