"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/client";

/** The account control, top right. Who you are, and the way out. */
export function AccountMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="bg-ink text-cream flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
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
            className="border-ink/15 bg-cream absolute right-0 z-20 mt-2 w-56 border p-3 text-sm shadow-sm"
          >
            <p className="text-ink/60 truncate px-1 pb-2">{email}</p>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={busy}
              className="hover:bg-ink/5 w-full px-1 py-1.5 text-left disabled:opacity-50"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
