import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";

// Kept TRUE the same way the privacy statement is: if the site ever sets a
// cookie this page does not name, this page is the bug — and a consent
// banner becomes legally required the moment a non-essential one appears.

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "The cookies festivaloftrust.com sets, and why there is no banner about them.",
};

export default function Page() {
  return (
    <Doc
      title="Cookie policy"
      standfirst="The cookies this site sets, and why there is no banner about them."
      updated="29 August 2026"
    >
      <h2>1. What we set</h2>
      <p>
        One kind of cookie, and only for people who sign in: the cookie that
        keeps an organiser signed in to the planner, set by Supabase, our
        sign-in provider. It exists so you do not have to ask for a new email
        link on every page.
      </p>
      <p>
        A visitor who only reads the site gets no cookies at all.
      </p>

      <h2>2. What we do not set</h2>
      <p>
        No advertising cookies, no analytics cookies, no social media pixels,
        and no third party sets a cookie through us. That is why the site
        shows no cookie banner: consent is only required for cookies beyond
        the strictly necessary, and we have none.
      </p>

      <h2>3. If this changes</h2>
      <p>
        Should the site ever need a cookie beyond the strictly necessary, we
        will ask before setting it, and this page will say what it is for.
      </p>

      <h2>4. Contact</h2>
      <p>
        Questions about cookies or data:{" "}
        <a href="mailto:hello@festivaloftrust.com">hello@festivaloftrust.com</a>
        . More in the <Link href="/privacy">privacy statement</Link> and the{" "}
        <Link href="/terms">general terms</Link>.
      </p>
    </Doc>
  );
}
