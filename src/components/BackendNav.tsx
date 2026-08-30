import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

/**
 * The bar on the pages behind a sign-in: reviewing, planning, your account.
 *
 * It is the public bar with the website's menu taken out. What stays is the
 * account control — who you are, the way to your festivals, the review queue
 * when you are an admin, and the way out. Removing the public nav from these
 * pages (065ac6c) took that with it, which left no visible way to sign out of
 * a planning page; this puts it back on its own.
 *
 * The wordmark on the left is the way back to the website, and it is the only
 * public link here on purpose: one door out, not a menu of them.
 *
 * Signed out this renders nothing. Every backend page requires a session and
 * redirects without one, so the bar would only ever flash on the way to a
 * sign-in screen.
 */
export function BackendNav({
  email,
  reviewCount = null,
  canReviewVisitors = false,
  isOrganiser = false,
}: {
  email?: string | null;
  reviewCount?: number | null;
  canReviewVisitors?: boolean;
  /** Approved workspace member: sees the internal tools. */
  isOrganiser?: boolean;
}) {
  if (!email) return null;

  return (
    <nav aria-label="Account" className="w-full">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-10">
        <Link
          href="/"
          className="text-sm font-bold tracking-[-0.01em] transition-opacity hover:opacity-70"
        >
          Festival of Trust
        </Link>
        <AccountMenu
          email={email}
          reviewCount={reviewCount}
          canReviewVisitors={canReviewVisitors}
          isOrganiser={isOrganiser}
        />
      </div>
    </nav>
  );
}
