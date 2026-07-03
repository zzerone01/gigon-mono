// Supabase Auth "Send SMS" hook → Semaphore (PH-local SMS gateway).
// Auth calls this instead of the built-in Twilio provider; test_otp numbers
// in config.toml never reach here. Secrets (set via `supabase secrets set`):
//   SEMAPHORE_API_KEY     — semaphore.co dashboard
//   SEND_SMS_HOOK_SECRETS — "v1,whsec_<base64>", same value in the auth hook config
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const SEMAPHORE_OTP_URL = "https://api.semaphore.co/api/v4/otp";
// OTP route costs 2 credits/SMS but bypasses the normal queue (delivery speed
// matters for login codes). {otp} is replaced by Semaphore with `code`.
const MESSAGE = "Your GigOn code is {otp}. Never share it — GigOn staff will never ask for it.";

Deno.serve(async (req) => {
  const apiKey = Deno.env.get("SEMAPHORE_API_KEY");
  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRETS")?.replace("v1,whsec_", "");
  if (!apiKey || !hookSecret) {
    return json(500, { error: { http_code: 500, message: "send-sms function is missing secrets" } });
  }

  try {
    const payload = await req.text();
    const webhook = new Webhook(hookSecret);
    const { user, sms } = webhook.verify(payload, Object.fromEntries(req.headers)) as {
      user: { phone: string };
      sms: { otp: string };
    };

    // Supabase stores E.164 without "+" (639171234001); Semaphore wants 09….
    const number = user.phone.startsWith("63") ? `0${user.phone.slice(2)}` : user.phone;

    const res = await fetch(SEMAPHORE_OTP_URL, {
      method: "POST",
      body: new URLSearchParams({ apikey: apiKey, number, message: MESSAGE, code: sms.otp }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Semaphore ${res.status}: ${body}`);
    // Success responses are an array of queued messages; anything else
    // (e.g. account pending / no credits) comes back as a JSON object.
    if (!body.trimStart().startsWith("[")) throw new Error(`Semaphore rejected: ${body}`);

    return json(200, {});
  } catch (err) {
    console.error("send-sms failed:", err);
    return json(500, {
      error: { http_code: 500, message: `SMS delivery failed: ${err instanceof Error ? err.message : err}` },
    });
  }
});

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
