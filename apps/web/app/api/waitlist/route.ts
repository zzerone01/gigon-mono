import { NextResponse } from "next/server";

/**
 * Waitlist capture — provider-agnostic.
 *
 * Set WAITLIST_ENDPOINT to a Formspree form URL (https://formspree.io/f/xxxxxxxx)
 * to start collecting for free with zero backend. The same shape works for any
 * service that accepts a JSON POST (Mailchimp/Resend can be swapped in here
 * without touching the client). See apps/web/README.md.
 *
 * With no endpoint configured the route logs and accepts the signup, so the UI
 * works end-to-end in local dev.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = new Set(["business", "worker"]);

type Payload = {
  email?: unknown;
  role?: unknown;
  source?: unknown;
  company?: unknown; // honeypot — must stay empty
};

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a filled "company" field means a bot. Pretend success, store nothing.
  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role =
    typeof body.role === "string" && ROLES.has(body.role)
      ? body.role
      : "unspecified";
  const source =
    typeof body.source === "string" ? body.source.slice(0, 40) : "unknown";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  const endpoint = process.env.WAITLIST_ENDPOINT;

  // Not configured yet → accept locally so the flow is testable end-to-end.
  if (!endpoint) {
    console.info("[waitlist] no WAITLIST_ENDPOINT set; signup not persisted:", {
      email,
      role,
      source,
    });
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        role,
        source,
        _subject: `GigOn waitlist · ${role} · ${source}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[waitlist] provider responded", res.status, detail);
      return NextResponse.json(
        { error: "We couldn't add you right now. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("[waitlist] request failed", err);
    return NextResponse.json(
      { error: "Network error. Please try again." },
      { status: 502 },
    );
  }
}

export function GET() {
  return NextResponse.json({ status: "ok" });
}
