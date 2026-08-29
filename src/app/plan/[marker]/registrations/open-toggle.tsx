"use client";

import { useState, useTransition } from "react";
import { openRegistrationAt, stopRegistration } from "../publish/actions";

/**
 * The doors, as one switch. On, and the form on the event page is live; off,
 * and nobody can enrol — the same platform patch the publish screen and the
 * scheduled opener use, just within reach of the person watching the list
 * fill up. Optimistic only until the answer lands; a refusal flips it back
 * and says why.
 */
export function OpenToggle({
  marker,
  open: initial,
}: {
  marker: string;
  open: boolean;
}) {
  const [open, setOpen] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const flip = (next: boolean) => {
    setOpen(next);
    start(async () => {
      const r = next
        ? await openRegistrationAt(marker, "")
        : await stopRegistration(marker);
      if (r.error) {
        setOpen(!next);
        setError(r.error);
      } else {
        setError(null);
      }
    });
  };

  return (
    <div>
      <label className="flex cursor-pointer items-start justify-between gap-6">
        <span className="min-w-0">
          <span className="block text-sm font-medium">Open to registration</span>
          <span className="text-ink/55 mt-0.5 block text-sm leading-snug">
            {open
              ? "The form on the event page is live."
              : "Closed — the event page says registration is not open."}
          </span>
        </span>
        <span className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={open}
            disabled={pending}
            onChange={(e) => flip(e.target.checked)}
            className="peer sr-only"
          />
          <span className="bg-ink/15 peer-checked:bg-green peer-focus-visible:ring-ink/25 block h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-4" />
          <span className="pointer-events-none absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
