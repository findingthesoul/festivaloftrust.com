import Link from "next/link";
import { currentUser } from "@/lib/supabase/server";
import { AccountMenu } from "./AccountMenu";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/for-society", label: "For society" },
  { href: "/for-organisations", label: "For organisations" },
  { href: "/funding", label: "Funding" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Public pages for the sitemap: the nav plus entry points not shown in it. */
export const PUBLIC_PATHS = [...NAV.map((n) => n.href), "/join"];

/**
 * Two navigations, not one with extra items.
 *
 * A signed-out visitor is reading about the movement, so they get the whole
 * site. A signed-in organiser is working on their festival, so the marketing
 * pages are noise — they get their festivals and their account, and the public
 * site is still reachable through the wordmark.
 */
export async function SiteNav() {
  const user = await currentUser();

  if (user) {
    // Sticky for the signed-in bar only: someone working on a festival scrolls
    // a long way into a step and should not lose the way out of it.
    return (
      <nav
        aria-label="Main"
        className="bg-background/85 border-ink/10 sticky top-0 z-30 border-b backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/festivals" className="text-sm font-bold tracking-[-0.01em]">
            Festival of Trust
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/festivals"
              className="decoration-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
            >
              Festivals
            </Link>
            <AccountMenu email={user.email ?? ""} />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="w-full">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-5 text-sm sm:gap-x-7 sm:px-10">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-x-7">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="decoration-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <span className="text-ink/20 hidden sm:inline">|</span>
        <Link
          href="/join"
          className="decoration-2 underline-offset-4 transition-opacity hover:underline hover:opacity-70"
        >
          Join
        </Link>
        <Link href="/sign-in" className="text-green font-medium hover:opacity-70">
          Sign in
        </Link>
      </div>
    </nav>
  );
}
