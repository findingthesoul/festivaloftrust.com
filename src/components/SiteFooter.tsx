import Link from "next/link";
import { BrandLockup } from "./BrandLockup";
import { NAV } from "./nav-links";

// TODO: confirm the real handles with the organisation — these are the
// obvious guesses, not verified accounts.
const SOCIAL = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/festivaloftrust",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.28 2.37 4.28 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/festivaloftrust",
    path: "M12 2.2c-2.67 0-3 .01-4.05.06-1.04.05-1.76.21-2.38.46a4.8 4.8 0 0 0-1.74 1.13A4.8 4.8 0 0 0 2.7 5.59c-.25.62-.41 1.34-.46 2.38C2.19 9.02 2.18 9.35 2.18 12s.01 3 .06 4.05c.05 1.04.21 1.76.46 2.38.26.65.6 1.2 1.13 1.74.54.53 1.09.87 1.74 1.13.62.24 1.34.4 2.38.45 1.05.05 1.38.06 4.05.06s3-.01 4.05-.06c1.04-.05 1.76-.21 2.38-.45a4.8 4.8 0 0 0 1.74-1.13 4.8 4.8 0 0 0 1.13-1.74c.24-.62.4-1.34.45-2.38.05-1.05.06-1.38.06-4.05s-.01-3-.06-4.05c-.05-1.04-.21-1.76-.45-2.38a4.8 4.8 0 0 0-1.13-1.74 4.8 4.8 0 0 0-1.74-1.13c-.62-.25-1.34-.41-2.38-.46-1.05-.05-1.38-.06-4.05-.06Zm0 1.77c2.62 0 2.93.01 3.96.06.96.04 1.48.2 1.82.34.46.17.79.38 1.13.72.34.34.55.67.72 1.13.13.34.3.86.34 1.82.05 1.03.06 1.34.06 3.96s-.01 2.93-.06 3.96c-.04.96-.21 1.48-.34 1.82-.17.46-.38.79-.72 1.13a3.03 3.03 0 0 1-1.13.72c-.34.13-.86.3-1.82.34-1.03.05-1.34.06-3.96.06s-2.93-.01-3.96-.06c-.96-.04-1.48-.21-1.82-.34a3.04 3.04 0 0 1-1.13-.72 3.04 3.04 0 0 1-.72-1.13c-.14-.34-.3-.86-.34-1.82-.05-1.03-.06-1.34-.06-3.96s.01-2.93.06-3.96c.04-.96.2-1.48.34-1.82.17-.46.38-.79.72-1.13.34-.34.67-.55 1.13-.72.34-.14.86-.3 1.82-.34 1.03-.05 1.34-.06 3.96-.06Zm0 3a5.03 5.03 0 1 0 0 10.06A5.03 5.03 0 0 0 12 6.97Zm0 8.3a3.27 3.27 0 1 1 0-6.53 3.27 3.27 0 0 1 0 6.53Zm6.41-8.5a1.18 1.18 0 1 1-2.35 0 1.18 1.18 0 0 1 2.35 0Z",
  },
];

/**
 * The site's foot, dark like the nav over the poster. It carries the whole
 * way out of any page: the logo, the menu in two rows, the organisation
 * behind the festival, the social doors, and the legal shelf. On a
 * festival's page it is the only menu there is — the poster keeps its top
 * clean.
 */
export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream mt-auto w-full">
      <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-10">
        <BrandLockup className="h-9 sm:h-10" />

        <nav aria-label="Footer" className="mt-10 text-sm">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-opacity hover:opacity-70"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-medium">
            <li>
              <Link href="/join" className="transition-opacity hover:opacity-70">
                Join
              </Link>
            </li>
            <li>
              <Link
                href="/sign-in"
                className="transition-opacity hover:opacity-70"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-cream/15 mt-10 flex flex-wrap items-start justify-between gap-x-10 gap-y-6 border-t pt-8">
          <div className="max-w-md text-sm leading-relaxed">
            <p className="text-cream/70">
              Festival of Trust is an initiative of Solidarity Lab B.V.
              (Rotterdam, the Netherlands), partner of{" "}
              <a
                href="https://soul.com"
                className="underline decoration-2 underline-offset-4 hover:opacity-70"
              >
                soul.com
              </a>
              .
            </p>
            <p className="mt-3">
              <a
                href="mailto:hello@festivaloftrust.com"
                className="font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
              >
                hello@festivaloftrust.com
              </a>
            </p>
          </div>

          <ul className="flex gap-3">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-cream/30 hover:bg-cream/10 block rounded-full border p-2.5 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <ul className="text-cream/60 mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <Link href="/terms" className="hover:text-cream transition-colors">
              General terms
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="hover:text-cream transition-colors">
              Privacy statement
            </Link>
          </li>
          <li>
            <Link href="/cookies" className="hover:text-cream transition-colors">
              Cookie policy
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
