"use client";

import Link from "next/link";
import { useState } from "react";
import { countAwaitingVisitors } from "@/app/review-actions";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";

/** The account control, top right. Who you are, and the way out. */
export function AccountMenu({
  email,
  reviewCount = null,
  canReviewVisitors = false,
}: {
  email: string;
  /** Pending requests, for the admin; null hides the item. */
  reviewCount?: number | null;
  /** Whether to count this organiser's waiting visitors when the menu opens. */
  canReviewVisitors?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Counted the first time the menu opens, not on every page: the platform
  // round-trips are only paid when someone actually looks.
  const [visitors, setVisitors] = useState<{ count: number; href: string } | null>(null);

  const initial = (email[0] ?? "?").toUpperCase();

  async function signOut() {
    setBusy(true);
    await browserSupabase().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (canReviewVisitors && visitors === null) {
            countAwaitingVisitors().then(setVisitors).catch(() => {});
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="bg-ink text-cream flex size-8 items-center justify-center rounded-full text-sm font-bold transition-opacity hover:opacity-85"
      >
        {initial}
        <span className="sr-only">Account</span>
      </button>

      {open && (
        <>
          {/* Click-away. Sits behind the menu so a click anywhere closes it. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            className="border-ink/12 bg-cream absolute right-0 z-20 mt-2 w-60 rounded-xl border p-2 text-sm shadow-lg"
          >
            <p className="text-ink/55 truncate px-2.5 py-2 text-xs">{email}</p>
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-ink/5 block rounded-lg px-2.5 py-2"
            >
              Your profile
            </Link>
            <Link
              href="/festivals"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-ink/5 block rounded-lg px-2.5 py-2"
            >
              Your festivals
            </Link>
            {canReviewVisitors && visitors !== null && visitors.count > 0 && (
              <Link
                href={visitors.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="hover:bg-ink/5 flex items-center justify-between rounded-lg px-2.5 py-2"
              >
                Review
                <span className="bg-green text-cream rounded-full px-2 py-0.5 text-xs font-bold">
                  {visitors.count}
                </span>
              </Link>
            )}
            {reviewCount !== null && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="hover:bg-ink/5 flex items-center justify-between rounded-lg px-2.5 py-2"
              >
                Review
                {reviewCount > 0 && (
                  <span className="bg-green text-cream rounded-full px-2 py-0.5 text-xs font-bold">
                    {reviewCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/gen"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="hover:bg-ink/5 block rounded-lg px-2.5 py-2"
            >
              Shape generator
            </Link>
            <div className="bg-ink/10 my-1.5 h-px" />
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={busy}
              className="hover:bg-ink/5 w-full rounded-lg px-2.5 py-2 text-left disabled:opacity-50"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
