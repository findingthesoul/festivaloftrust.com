"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { PLAIN_PATHS } from "./nav-links";

/**
 * The signed-in bar, aware of where it stands. On a festival's page the
 * poster owns the whole screen, so the bar disappears into it: no bar at
 * all, just the account control floating over the photo. Everywhere else it
 * is the sticky cream bar — someone working on a festival scrolls a long way
 * into a step and should not lose the way out of it.
 */
export function SignedInNav({ email }: { email: string }) {
  const pathname = usePathname();
  const event =
    pathname !== "/" &&
    pathname.split("/").filter(Boolean).length === 1 &&
    !PLAIN_PATHS.includes(pathname);

  if (event) {
    return (
      <nav aria-label="Main" className="absolute inset-x-0 top-0 z-40">
        <div className="flex justify-end px-6 py-4 sm:px-10">
          <AccountMenu email={email} />
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Main"
      className="bg-background/85 border-ink/10 sticky top-0 z-30 border-b backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <Link href="/festivals" className="text-sm font-bold tracking-[-0.01em]">
          Festival of Trust
        </Link>
        <AccountMenu email={email} />
      </div>
    </nav>
  );
}
