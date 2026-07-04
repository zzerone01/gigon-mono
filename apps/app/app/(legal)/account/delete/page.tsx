import type { Metadata } from "next";

import { Callout, LegalHeader, Section } from "../../section";

import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to permanently delete your GigOn account and the data that goes with it.",
};

/** Public page referenced as the Play Console "Delete account URL". */
export default function DeleteAccountPage() {
  return (
    <>
      <LegalHeader title="Delete your GigOn account" updated="July 4, 2026" />

      <Callout>
        <b>Deleting your account is permanent.</b> Your profile, sign-in, gigs, applications,
        matches, chats, and reviews are removed immediately and can&apos;t be recovered. This
        page is for the GigOn app by GigOn — the same account works for workers and businesses.
      </Callout>

      <Section title="Option 1 — Delete in the app">
        <p>
          Open GigOn, go to the <b>Profile</b> tab, scroll to the bottom, and tap{" "}
          <b>Delete account</b>. Confirm the prompt and your account is deleted immediately —
          you&apos;ll be signed out on the spot.
        </p>
      </Section>

      <Section title="Option 2 — Delete on this page">
        <p>
          No app needed. Verify the mobile number you sign in with (we&apos;ll text you a
          6-digit code), then confirm the deletion below.
        </p>
        <DeleteAccountForm />
      </Section>

      <Section title="Option 3 — Ask us by email">
        <p>
          Email{" "}
          <a
            href="mailto:leo@gigon.io?subject=Delete%20my%20GigOn%20account"
            className="font-semibold text-royal underline underline-offset-2"
          >
            leo@gigon.io
          </a>{" "}
          with the subject &ldquo;Delete my GigOn account&rdquo; and include the mobile number
          you sign in with. We&apos;ll verify it&apos;s you and complete the deletion within 15
          days.
        </p>
      </Section>

      <Section title="What is deleted, and what we keep">
        <p>
          <b>Deleted immediately</b> when your request is confirmed: your sign-in and phone
          number, profile (name, business name, area and location, skills, ratings), gigs you
          posted, applications, matches, chat messages, reviews you gave and received, dispute
          reports, and device push tokens.
        </p>
        <p>
          <b>Kept:</b> anonymized marketplace event records (our append-only audit log) needed
          for dispute resolution, fraud prevention, and legal compliance — these no longer link
          back to you once your profile is deleted. Encrypted database backups expire
          automatically within 30 days. See the{" "}
          <a href="/privacy" className="font-semibold text-royal underline underline-offset-2">
            Privacy Policy
          </a>{" "}
          for details.
        </p>
      </Section>
    </>
  );
}
