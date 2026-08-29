import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";

// ⚠️ NOT LEGALLY REVIEWED. Adapted 2026-08-29 from Solidarity Lab's terms for
// The Fibre, rewritten around what this site actually does. It invents no
// warranty, no liability cap and no arbitration clause. Have a Dutch lawyer
// read it before relying on it commercially, and move the date in the page
// when the text changes materially.

export const metadata: Metadata = {
  title: "General terms",
  description: "The agreement between you and Solidarity Lab B.V. for the use of festivaloftrust.com.",
};

export default function Page() {
  return (
    <Doc
      title="General terms"
      standfirst="The agreement between you and Solidarity Lab B.V. for the use of festivaloftrust.com."
      updated="29 August 2026"
    >
      <h2>1. Who you are agreeing with</h2>
      <p>
        Festival of Trust is an initiative of Solidarity Lab B.V., a private
        limited company established in Rotterdam, the Netherlands, and a
        partner of soul.com. In these terms, &ldquo;we&rdquo; and
        &ldquo;us&rdquo; mean Solidarity Lab B.V.; &ldquo;the site&rdquo;
        means festivaloftrust.com; and &ldquo;you&rdquo; means the person
        using it.
      </p>

      <h2>2. What the site is</h2>
      <p>
        The site tells the story of the Festival of Trust movement, lists
        upcoming festivals, and gives each festival a public page. Behind a
        sign-in it is also the place where approved organisers plan their
        festival: the planner, its settings, its agenda and its budget tool.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>
          An account exists because you applied to host a festival and were
          approved, or because an organiser invited you to help run one.
        </li>
        <li>
          You sign in with a single-use link sent to your email address. Keep
          control of that inbox — anyone with access to it can reach your
          account — and tell us if you believe someone else has used it.
        </li>
        <li>Accounts are personal. Do not share sign-in links.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          enter personal data about someone else without a lawful basis for
          doing so;
        </li>
        <li>
          attempt to reach another festival&rsquo;s records or bypass access
          controls;
        </li>
        <li>
          publish content on a festival page that is unlawful, or that
          harasses, defrauds or endangers anyone.
        </li>
      </ul>
      <p>
        We may suspend an account or a festival that is doing any of the
        above, and will say why when we do.
      </p>

      <h2>5. Your content</h2>
      <p>
        What a festival&rsquo;s team puts into the planner belongs to that
        festival&rsquo;s team. We do not claim ownership of it, we do not use
        it to train anything, and we do not sell or share it for anyone
        else&rsquo;s purposes. We process it to run the service, and for
        nothing else.
      </p>

      <h2>6. Registration and money</h2>
      <p>
        Registering for a festival happens on The Thread, which runs on The
        Fibre — a platform also operated by Solidarity Lab B.V., with{" "}
        <a href="https://thefibre.app/terms">terms</a> and a{" "}
        <a href="https://thefibre.app/privacy-policy">privacy statement</a> of
        its own. A Festival of Trust is free to attend; the site takes no
        payments.
      </p>

      <h2>7. Availability</h2>
      <p>
        The site is actively developed. We aim to keep it available and to
        take backups, but we do not offer a guaranteed uptime level, and
        features may change. We will give reasonable notice before a change
        that removes something you depend on, and we will not delete a
        festival&rsquo;s records without warning.
      </p>

      <h2>8. Liability</h2>
      <p>
        The site is provided as it is. To the extent the law allows, we are
        not liable for indirect or consequential loss, for loss of profit or
        business, or for data lost through something outside our control.
        Nothing here limits our liability for damage caused intentionally or
        by gross negligence, for death or personal injury, or for anything
        else that cannot be limited under Dutch law.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We will update this page when the terms change and move the date at
        the top. For a change that materially affects your rights, we will
        tell account holders by email rather than relying on you to check.
      </p>

      <h2>10. Law and disputes</h2>
      <p>
        Dutch law applies. If we cannot resolve a dispute between us, it goes
        to the competent court in Rotterdam, the Netherlands — without
        prejudice to any right you have as a consumer to bring proceedings
        where you live.
      </p>

      <h2>11. Contact</h2>
      <p>
        Solidarity Lab B.V., Rotterdam, the Netherlands.{" "}
        <a href="mailto:hello@festivaloftrust.com">hello@festivaloftrust.com</a>
        . For anything about personal data, see the{" "}
        <Link href="/privacy">privacy statement</Link>.
      </p>
    </Doc>
  );
}
