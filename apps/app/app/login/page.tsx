"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Normalize a PH mobile number to E.164 (63…). */
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return digits;
  if (digits.startsWith("09") && digits.length === 11) return `63${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `63${digits}`;
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    });
    setBusy(false);
    if (err) {
      setError(err.message);
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
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-white shadow-[0_0_60px_rgba(15,27,46,0.08)]">
      <div className="flex flex-1 flex-col justify-center gap-[18px] px-7">
        <span className="flex size-14 items-center justify-center rounded-[14px] bg-royal shadow-[0_8px_24px_rgba(15,27,46,0.12)]">
          <Icon name="logo" size={28} color="#fff" strokeWidth={2.4} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-tight">
            GigOn
          </h1>
          <p className="font-display text-[17px] font-semibold text-royal">Your gig is on.</p>
          <p className="max-w-[30ch] text-[13.5px] leading-relaxed text-slate">
            Short, local gigs matched with trusted people nearby — in the Philippines.
          </p>
        </div>

        {step === "phone" ? (
          <>
            <label className="mt-2 flex flex-col gap-[7px]">
              <span className="text-[13px] font-semibold">Phone number</span>
              <span className="flex h-12 overflow-hidden rounded-[10px] border border-line focus-within:border-royal">
                <span className="flex items-center border-r border-line bg-tint-soft px-[13px] text-sm font-semibold text-slate">
                  +63
                </span>
                <input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  inputMode="tel"
                  autoFocus
                  placeholder="917 123 4001"
                  className="min-w-0 flex-1 px-[13px] text-[15px] font-medium outline-none"
                />
              </span>
              <span className="text-[11.5px] text-ink-muted">
                We&apos;ll text a 6-digit code. Standard SMS rates apply.
              </span>
            </label>
            {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
            <button
              onClick={sendCode}
              disabled={busy}
              className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] bg-amber text-[15px] font-semibold text-ink hover:bg-[#E99B16] disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send code"}
              <Icon name="arrowRight" size={16} strokeWidth={2.2} />
            </button>
          </>
        ) : (
          <>
            <label className="mt-2 flex flex-col gap-[7px]">
              <span className="text-[13px] font-semibold">Enter the 6-digit code</span>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && otp.length === 6 && verify()}
                inputMode="numeric"
                autoFocus
                placeholder="123456"
                className="h-12 rounded-[10px] border border-line px-[13px] text-center font-display text-[22px] font-bold tracking-[0.4em] outline-none focus:border-royal"
              />
              <span className="text-[11.5px] text-ink-muted">Sent to +{phone}</span>
            </label>
            {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
            <button
              onClick={verify}
              disabled={busy || otp.length !== 6}
              className="flex h-[50px] items-center justify-center rounded-[10px] bg-amber text-[15px] font-semibold text-ink hover:bg-[#E99B16] disabled:opacity-60"
            >
              {busy ? "Checking…" : "Verify & continue"}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="text-[12.5px] text-ink-muted underline underline-offset-2"
            >
              Use a different number
            </button>
          </>
        )}
      </div>
      <p className="px-7 pb-6 text-[10.5px] leading-relaxed text-ink-muted">
        By continuing you agree to the{" "}
        <a href="/terms" className="underline underline-offset-2">Terms</a> and{" "}
        <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a> — you work
        with businesses directly as an independent contractor.{" "}
        <span className="font-semibold text-slate">
          GigOn is free during the pilot; a small per-match fee for businesses is planned later.
        </span>
      </p>
    </div>
  );
}
