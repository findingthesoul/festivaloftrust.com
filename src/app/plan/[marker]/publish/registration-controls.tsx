"use client";

import { useState, useTransition } from "react";
import { openRegistrationAt, stopRegistration } from "./actions";
import { input, primary, secondary } from "@/components/ui";
import type { Festival } from "@/lib/festivals";

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
});

/**
 * Opening the doors.
 *
 * Separate from publishing because they are separate decisions: approval says
 * the festival may exist publicly, this says people may sign up. The Thread
 * treats the second as one act — a thread going active is live and open at
 * once — so there is nothing here to get out of step with it.
 */
export function RegistrationControls({
  festival,
  opensAtIso,
  open,
}: {
  festival: Festival;
  /** Fetched apart from the festival, so a missing 0010 turns the feature off
      rather than the page. */
  opensAtIso: string | null;
  /**
   * Decided on the server. Reading the clock in render is impure and would
   * also hydrate to a different answer than it rendered with, a minute either
   * side of the moment.
   */
  open: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const opensAt = opensAtIso ? new Date(opensAtIso) : null;
  const promised = opensAt !== null && !open;

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => setError((await fn()).error ?? null));

  if (!festival.thread_id) {
    return (
      <p className="text-ink/60 mt-4 text-sm">
        Registration opens once the festival has a public page.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {open && opensAt && (
        <>
          <p className="text-ink/70 leading-relaxed text-pretty">
            Open since {when.format(opensAt)} ({festival.timezone}). People can sign up now.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => stopRegistration(festival.marker))}
            className={`${secondary} mt-5`}
          >
            {pending ? "Closing…" : "Stop taking registrations"}
          </button>
        </>
      )}

      {promised && opensAt && (
        <>
          <p className="text-ink/70 leading-relaxed text-pretty">
            Opens {when.format(opensAt)} ({festival.timezone}). Nobody can sign up before then.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => stopRegistration(festival.marker))}
            className={`${secondary} mt-5`}
          >
            {pending ? "Cancelling…" : "Cancel that"}
          </button>
        </>
      )}

      {!open && !promised && (
        <>
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            The page exists and nobody can sign up yet. Opening registration is
            yours to decide.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => openRegistrationAt(festival.marker, ""))}
              className={primary}
            >
              {pending ? "Opening…" : "Open registration now"}
            </button>
            <button
              type="button"
              onClick={() => setScheduling((v) => !v)}
              className={secondary}
            >
              {scheduling ? "Not from a date" : "Or from a date"}
            </button>
          </div>

          {scheduling && (
            <div className="border-ink/12 mt-5 max-w-md rounded-xl border p-4">
              <label className="text-sm font-medium" htmlFor="opens">
                Open from
              </label>
              {/* Read in the festival's timezone, not the organiser's: "nine"
                  means nine where the festival is. */}
              <input
                id="opens"
                type="datetime-local"
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className={`${input} mt-2`}
              />
              <p className="text-ink/50 mt-1.5 text-sm">{festival.timezone}</p>
              <button
                type="button"
                disabled={pending || !at}
                onClick={() => run(() => openRegistrationAt(festival.marker, at))}
                className={`${primary} mt-4`}
              >
                {pending ? "Saving…" : "Open then"}
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="mt-4 max-w-xl text-sm text-red-700">{error}</p>}
    </div>
  );
}
