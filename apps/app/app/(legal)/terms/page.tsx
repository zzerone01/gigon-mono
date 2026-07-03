import type { Metadata } from "next";

import { Callout, LegalHeader, Section } from "../section";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GigOn terms of service — pilot program, roles, fees, and completion rules.",
};

export default function TermsPage() {
  return (
    <>
      <LegalHeader title="Terms of Service" updated="July 3, 2026" />

      <Callout>
        <b>The short version:</b> GigOn is free during the pilot. Businesses pay nothing to post
        or match today — a small per-match fee for businesses is planned after the pilot. Workers
        are never charged. You&apos;re paid in cash, directly, on site — GigOn never touches
        wages.
      </Callout>

      <Section title="1. What GigOn is">
        <p>
          GigOn (operated from gigon.io and app.gigon.io, &quot;GigOn&quot;, &quot;we&quot;) is a
          marketplace that connects local businesses posting short gigs (typically 1–3 hours)
          with nearby workers in the Philippines. GigOn is currently running as an{" "}
          <b>invite-gated pilot</b> in Mactan / Lapu-Lapu City.
        </p>
        <p>
          GigOn is a <b>venue only</b>. We are not an employer, staffing agency, or payment
          processor. Businesses and workers contract with each other directly.
        </p>
      </Section>

      <Section title="2. Independent contractor relationship">
        <p>
          Workers engage with businesses as <b>independent contractors</b>. Nothing on GigOn
          creates an employment, agency, or partnership relationship between a worker and GigOn,
          or between a worker and a business, beyond the single gig both sides agree to.
        </p>
      </Section>

      <Section title="3. Pay is cash, direct, 100% yours">
        <p>
          The pay shown on a gig is paid by the business to the worker <b>in cash, on site, in
          full</b>. GigOn does not collect, hold, route, or deduct from wages — ever. Any pay
          disagreement is between the two parties; our dispute process (below) affects
          reputations on the platform, not money.
        </p>
      </Section>

      <Section title="4. Fees — free pilot, planned per-match fee">
        <p>
          During the pilot, GigOn is <b>completely free for everyone</b>. Each confirmed match is
          logged as a billable event at <b>₱0</b>.
        </p>
        <p>
          After the pilot we plan to introduce a <b>small per-match fee charged to businesses
          only</b>. We will announce pricing clearly before anything is charged, and no fee will
          ever be applied retroactively to pilot activity. <b>Workers will never be charged</b> to
          find or complete gigs.
        </p>
      </Section>

      <Section title="5. Accounts and roles">
        <p>
          You sign in with your Philippine mobile number. One account can act as a worker or — if
          verified with a pilot invite code — as a business. You&apos;re responsible for activity
          on your account and for keeping your number reachable.
        </p>
      </Section>

      <Section title="6. Completion PIN and reviews">
        <p>
          A gig is completed when the worker enters the business&apos;s one-time <b>4-digit
          PIN</b> — issued after the work is done and paid. The PIN records that both sides agree
          the gig is complete; it does not move money. Reviews unlock only on PIN-completed gigs,
          which keeps them honest.
        </p>
      </Section>

      <Section title="7. Cancellations, no-shows, and disputes">
        <p>
          Either side may cancel a match before work starts; cancellations are recorded on the
          canceller&apos;s profile. A worker who doesn&apos;t show up may be reported as a
          no-show, which is recorded on their profile and reopens the gig. Disputes are reviewed
          by the GigOn team within 24 hours; outcomes affect reputation and platform access, not
          pay.
        </p>
      </Section>

      <Section title="8. Acceptable use">
        <p>
          Don&apos;t post illegal, unsafe, or misleading gigs; don&apos;t harass other users;
          don&apos;t misrepresent your identity, ratings, or history; don&apos;t use GigOn for
          anything other than arranging genuine local gigs. We may suspend or remove accounts
          that break these rules or abuse the pilot.
        </p>
      </Section>

      <Section title="9. The pilot, availability, and changes">
        <p>
          GigOn is early software in an active pilot. The service is provided &quot;as is&quot;,
          may change, pause, or end at any time, and we can&apos;t guarantee matches, uptime, or
          earnings. We may update these terms as the product evolves; continued use after an
          update means you accept the new terms.
        </p>
      </Section>

      <Section title="10. Liability">
        <p>
          To the maximum extent allowed by law, GigOn is not liable for what happens on a gig —
          including quality of work, payment disagreements, property damage, or personal injury.
          Our total liability for any claim related to the service is limited to ₱1,000 or the
          amount you paid us in the past 12 months, whichever is greater.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these terms:{" "}
          <a href="mailto:hello@gigon.io" className="font-semibold text-royal underline underline-offset-2">
            hello@gigon.io
          </a>
          . These terms are governed by the laws of the Republic of the Philippines.
        </p>
      </Section>
    </>
  );
}
