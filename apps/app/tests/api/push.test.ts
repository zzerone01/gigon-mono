/** /api/push/register + /api/push/unregister — local supabase stack. */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST as register } from "@/app/api/push/register/route";
import { POST as unregister } from "@/app/api/push/unregister/route";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

type Session = { id: string; token: string };

async function login(phone: string): Promise<Session> {
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await supa.auth.signInWithOtp({ phone });
  const { data, error } = await supa.auth.verifyOtp({ phone, token: "123456", type: "sms" });
  if (error || !data.session || !data.user) throw error ?? new Error("no session");
  return { id: data.user.id, token: data.session.access_token };
}

async function call(handler: typeof register, who: Session | null, body: unknown) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (who) headers.authorization = `Bearer ${who.token}`;
  const res = await handler(
    new Request("http://test/api", { method: "POST", headers, body: JSON.stringify(body) }),
    { params: Promise.resolve({}) },
  );
  return { status: res.status, json: await res.json() };
}

const TOKEN = "ExponentPushToken[vitest-device-1]";
let alice: Session;
let bob: Session;

beforeAll(async () => {
  alice = await login("639171234001");
  bob = await login("639171234002");
  await sql`delete from push_tokens where token = ${TOKEN}`;
});

afterAll(async () => {
  await sql`delete from push_tokens where token = ${TOKEN}`;
  await sql.end();
});

describe("push token registry", () => {
  it("rejects unauthenticated calls", async () => {
    const res = await call(register, null, { token: TOKEN });
    expect(res.status).toBe(401);
  });

  it("registers and re-registers (device changes hands) via upsert", async () => {
    expect((await call(register, alice, { token: TOKEN, platform: "android" })).status).toBe(200);
    let [row] = await sql`select user_id from push_tokens where token = ${TOKEN}`;
    expect(row!.user_id).toBe(alice.id);

    expect((await call(register, bob, { token: TOKEN, platform: "android" })).status).toBe(200);
    [row] = await sql`select user_id from push_tokens where token = ${TOKEN}`;
    expect(row!.user_id).toBe(bob.id);
  });

  it("only the owner can unregister a token", async () => {
    expect((await call(unregister, alice, { token: TOKEN })).status).toBe(200);
    let rows = await sql`select 1 from push_tokens where token = ${TOKEN}`;
    expect(rows.length).toBe(1); // bob owns it — alice's delete was a no-op

    expect((await call(unregister, bob, { token: TOKEN })).status).toBe(200);
    rows = await sql`select 1 from push_tokens where token = ${TOKEN}`;
    expect(rows.length).toBe(0);
  });
});
