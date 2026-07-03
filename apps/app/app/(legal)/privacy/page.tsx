import type { Metadata } from "next";

import { Callout, LegalHeader, Section } from "../section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What GigOn collects, why, and your rights under the PH Data Privacy Act.",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader title="Privacy Policy" updated="July 3, 2026" />

      <Callout>
        <b>The short version:</b> we collect the minimum needed to match nearby gigs — your
        phone number, name, approximate location, and gig activity. We don&apos;t sell your
        data, and we never see or store wage payments (they happen in cash, off-platform).
      </Callout>

      <Section title="1. What we collect">
        <p>
          <b>Account:</b> your mobile number (used to sign in via SMS code), your name, and — for
          businesses — a business name and pilot invite verification.
        </p>
        <p>
          <b>Location:</b> the approximate location you set during onboarding (and, if you allow
          it, your device&apos;s location) so we can show gigs near you and show businesses how
          far applicants are. We don&apos;t track your location in the background.
        </p>
        <p>
          <b>Activity:</b> gigs you post or apply to, matches, arrivals, PIN completions,
          cancellations, no-shows, reviews, disputes, and chat messages between matched parties.
          Key events are also written to an append-only audit log for trust and dispute
          resolution.
        </p>
      </Section>

      <Section title="2. What we use it for">
        <p>
          To run the marketplace: showing nearby gigs, letting businesses compare applicants
          (distance, rating, completion history), powering chat between matched parties,
          resolving disputes, and keeping the community safe. Aggregated, non-identifying usage
          statistics help us improve the pilot.
        </p>
      </Section>

      <Section title="3. What other users see">
        <p>
          Your profile (name or business name, area, rating, gigs completed, and no-show /
          cancellation history) is visible to other signed-in users — that transparency is how
          trust works on GigOn. Your phone number is never shown to other users; coordination
          happens in in-app chat.
        </p>
      </Section>

      <Section title="4. Where it lives and who we share it with">
        <p>
          Data is stored with Supabase (our backend provider) on servers in the
          Asia-Pacific region, and SMS codes are delivered through an SMS provider. These
          processors act on our instructions. We do not sell personal data, and we only disclose
          it if the law requires it.
        </p>
      </Section>

      <Section title="5. Retention">
        <p>
          We keep account and activity data while your account is active and as long as needed
          for dispute resolution and audit integrity. If you delete your account, we remove or
          anonymize personal data within 30 days, except records we must keep for legal or
          safety reasons.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          Under the Philippine Data Privacy Act of 2012 (RA 10173), you can ask for access to,
          correction of, or deletion of your personal data, or object to its processing. Email{" "}
          <a href="mailto:leo@gigon.io" className="font-semibold text-royal underline underline-offset-2">
            leo@gigon.io
          </a>{" "}
          and we&apos;ll respond within 15 days.
        </p>
      </Section>

      <Section title="7. Changes">
        <p>
          If this policy changes in a way that matters, we&apos;ll flag it in the app before it
          takes effect. This page always holds the current version.
        </p>
      </Section>
    </>
  );
}
