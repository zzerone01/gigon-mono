"use client";

import { useEffect, useState } from "react";

import { supabaseBrowser } from "@/lib/supabase/client";

/** Normalize a PH mobile number to E.164 (63…) — same rules as /login. */
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return digits;
  if (digits.startsWith("09") && digits.length === 11) return `63${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `63${digits}`;
  return null;
}

type Step = "phone" | "otp" | "confirm" | "done";

/** Self-service deletion: verify the sign-in number by SMS, then delete. */
export function DeleteAccountForm() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in on this browser (e.g. via /login) → skip the OTP.
  useEffect(() => {
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          setPhone(data.session.user.phone ?? "");
          setStep("confirm");
        }
      });
  }, []);

  const sendCode = async () => {
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setError("Enter a valid PH mobile number, e.g. 0917 123 4001");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await supabaseBrowser().auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("signups not allowed")
          ? "We couldn't find a GigOn account with that number."
          : err.message,
      );
      return;
    }
    setPhone(normalized);
    setStep("otp");
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await supabaseBrowser().auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: "sms",
    });
    setBusy(false);
    if (err) {
      setError("That code doesn't match — try again.");
      return;
    }
    setStep("confirm");
  };

  const deleteAccount = async () => {
    setBusy(true);
    setError("");
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    let res: Response;
    try {
      res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: "{}",
      });
    } catch {
      setBusy(false);
      setError("Network error — check your connection and try again.");
      return;
    }
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      setBusy(false);
      setError(json?.error?.message ?? `Something went wrong (${res.status}) — try again.`);
      return;
    }
    // The account is gone server-side; just drop the local session cookies.
    await supabaseBrowser().auth.signOut({ scope: "local" });
    setBusy(false);
    setStep("done");
  };

  const cancel = async () => {
    await supabaseBrowser().auth.signOut({ scope: "local" });
    setOtp("");
    setError("");
    setStep("phone");
  };

  if (step === "done") {
    return (
      <div className="rounded-[14px] border border-success-border bg-success-bg p-4 text-[13px] leading-relaxed">
        <b>Your account has been deleted.</b> Your profile and activity data are gone, and your
        number can no longer sign in. Encrypted backups expire within 30 days. Salamat for
        trying GigOn — you&apos;re welcome back any time.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-4">
      {step === "phone" && (
        <>
          <label className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-semibold">Your GigOn phone number</span>
            <span className="flex h-11 max-w-[320px] overflow-hidden rounded-[10px] border border-line focus-within:border-royal">
              <span className="flex items-center border-r border-line bg-tint-soft px-3 text-[13px] font-semibold text-slate">
                +63
              </span>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
                inputMode="tel"
                placeholder="917 123 4001"
                className="min-w-0 flex-1 px-3 text-[14px] font-medium outline-none"
              />
            </span>
          </label>
          <button
            onClick={sendCode}
            disabled={busy}
            className="flex h-11 max-w-[320px] items-center justify-center rounded-[10px] bg-royal text-[13.5px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Sending…" : "Text me a verification code"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <label className="flex flex-col gap-[7px]">
            <span className="text-[13px] font-semibold">Enter the 6-digit code</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verify()}
              inputMode="numeric"
              autoFocus
              placeholder="123456"
              className="h-11 max-w-[320px] rounded-[10px] border border-line px-3 text-center font-display text-[19px] font-bold tracking-[0.4em] outline-none focus:border-royal"
            />
            <span className="text-[11.5px] text-ink-muted">Sent to +{phone}</span>
          </label>
          <button
            onClick={verify}
            disabled={busy || otp.length !== 6}
            className="flex h-11 max-w-[320px] items-center justify-center rounded-[10px] bg-royal text-[13.5px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Checking…" : "Verify"}
          </button>
          <button
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
            }}
            className="self-start text-[12px] text-ink-muted underline underline-offset-2"
          >
            Use a different number
          </button>
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="text-[13px] leading-relaxed">
            You&apos;re verified{phone ? ` as +${phone}` : ""}. This will{" "}
            <b>permanently delete</b> your GigOn account — profile, gigs, applications, matches,
            chats, and reviews. It can&apos;t be undone.
          </p>
          <button
            onClick={deleteAccount}
            disabled={busy}
            className="flex h-11 max-w-[320px] items-center justify-center rounded-[10px] bg-red text-[13.5px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Permanently delete my account"}
          </button>
          <button
            onClick={cancel}
            disabled={busy}
            className="self-start text-[12px] text-ink-muted underline underline-offset-2"
          >
            Cancel — keep my account
          </button>
        </>
      )}

      {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
    </div>
  );
}
