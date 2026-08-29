import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";

// ⚠️ NOT LEGALLY REVIEWED. Based 2026-08-29 on The Fibre's privacy statement,
// rewritten from what this site actually does — the data listed and the
// sub-processors named here are all things you can go and read in the code.
// Keep it TRUE: if the site starts doing something this page does not say,
// this page is the bug. Move the date in the page when it changes.

export const metadata: Metadata = {
  title: "Privacy statement",
  description: "What festivaloftrust.com holds about you, why, where, and what you can do about it.",
};

export default function Page() {
  return (
    <Doc
      title="Privacy statement"
      standfirst="What we hold about you, why we hold it, where it lives, and what you can do about it."
      updated="29 August 2026"
    >
      <h2>1. Who is responsible</h2>
      <p>
        Solidarity Lab B.V., Rotterdam, the Netherlands — the organisation
        behind Festival of Trust and a partner of soul.com — is the controller
        for the data described here. For what a festival&rsquo;s team writes
        about its own festival, that team decides the content; we hold it for
        them.
      </p>

      <h2>2. What we hold</h2>
      <p>A field exists here because the planner needs it. In practice:</p>
      <ul>
        <li>
          <strong>Organiser accounts</strong> — your name, email address, and
          the application you wrote to host a festival.
        </li>
        <li>
          <strong>Festivals</strong> — everything a festival&rsquo;s team
          enters: its name, place, date, description, cover image, settings,
          agenda, planning tasks and notes, budget calculator content, and who
          is invited to help.
        </li>
        <li>
          <strong>Technical</strong> — server logs needed to keep the site
          running and secure. No advertising identifiers, no profiling, no
          third-party trackers.
        </li>
      </ul>
      <p>
        Registering to attend a festival happens on The Thread, not here —
        what is held about attendees is described in{" "}
        <a href="https://thefibre.app/privacy-policy">
          The Fibre&rsquo;s privacy statement
        </a>
        .
      </p>

      <h2>3. Why we are allowed to hold it</h2>
      <ul>
        <li>
          <strong>Contract</strong> — to give organisers the planner they
          signed up for, and the emails that make sign-in and invitations
          work.
        </li>
        <li>
          <strong>Legitimate interest</strong> — keeping the site secure and
          working, and defending legal claims.
        </li>
      </ul>

      <h2>4. Who else touches it</h2>
      <p>These are our sub-processors. There is nobody else.</p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, sign-in, and cover image
          storage.
        </li>
        <li>
          <strong>Vercel</strong> — serving the site. It is stateless; no
          personal data is stored there.
        </li>
        <li>
          <strong>Resend</strong> — delivering the sign-in and invitation
          emails.
        </li>
        <li>
          <strong>The Fibre</strong> — the platform, operated by Solidarity
          Lab B.V., where a published festival&rsquo;s public page and its
          registrations live.
        </li>
      </ul>

      <h2>5. How long we keep it</h2>
      <p>
        For as long as your account exists, or as long as the festival a
        record belongs to has a reason to keep it. On an erasure request we
        remove your personal content within 30 days.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You have the full set under the GDPR: to see what we hold, to correct
        it, to have it erased, to restrict or object to how it is used, and to
        take it elsewhere. Write to{" "}
        <a href="mailto:hello@festivaloftrust.com">hello@festivaloftrust.com</a>{" "}
        with &ldquo;privacy&rdquo; in the subject; we answer within one month.
        If you are unhappy with how we handle it you can complain to your
        national data protection authority — in the Netherlands, the
        Autoriteit Persoonsgegevens.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Only the strictly necessary kind, which is why you are not being asked
        to dismiss a banner — the details are in the{" "}
        <Link href="/cookies">cookie policy</Link>.
      </p>

      <h2>8. Changes</h2>
      <p>
        We will update this page when what we do changes, and move the date at
        the top.
      </p>

      <h2>9. Contact</h2>
      <p>
        Solidarity Lab B.V., Rotterdam, the Netherlands.{" "}
        <a href="mailto:hello@festivaloftrust.com">hello@festivaloftrust.com</a>
        . The rules of use are in the <Link href="/terms">general terms</Link>.
      </p>
    </Doc>
  );
}
