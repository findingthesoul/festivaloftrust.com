"use client";

import { useState, useTransition } from "react";
import { askToPublish, unpublish } from "./actions";
import type { FestivalStatus } from "@/lib/festivals";

/**
 * Publishing as one switch — with an honest middle. On means live; off
 * means not public. Flipping a draft on does the only thing a festival can
 * do for itself: ask. The workspace reads it by hand before it goes live,
 * so between off and on the switch waits, amber, and says so.
 */
export function PublishControls({
  marker,
  status,
}: {
  marker: string;
  status: FestivalStatus;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Optimistic only until the answer lands; a refusal flips back and says why.
  const [state, setState] = useState<FestivalStatus>(status);

  const flip = (on: boolean) => {
    const was = state;
    setState(on ? "submitted" : "draft");
    start(async () => {
      const r = on ? await askToPublish(marker) : await unpublish(marker);
      if (r.error) {
        setState(was);
        setError(r.error);
      } else {
        setError(null);
      }
    });
  };

  const on = state !== "draft";
  const waiting = state === "submitted";

  return (
    <div>
      <label className="flex cursor-pointer items-start justify-between gap-6">
        <span className="min-w-0">
          <span className="block text-sm font-medium">Published</span>
          <span className="text-ink/55 mt-0.5 block text-sm leading-snug">
            {state === "live" ? (
              <>
                Live at{" "}
                <a
                  href={`/${marker}`}
                  className="text-green underline underline-offset-4"
                >
                  festivaloftrust.com/{marker}
                </a>
                . Off hides the page and stops registrations — nobody already
                registered is removed.
              </>
            ) : waiting ? (
              "With us for review — someone reads every festival by hand. Nothing is public yet; off withdraws the ask."
            ) : (
              "Not public. Flipping it on asks us to publish — putting a festival live is ours to grant, which is what the trust in the name is doing."
            )}
          </span>
        </span>
        <span className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={on}
            disabled={pending}
            onChange={(e) => flip(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`peer-focus-visible:ring-ink/25 block h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-4 ${
              waiting ? "bg-yellow" : "bg-ink/15 peer-checked:bg-green"
            }`}
          />
          <span
            className={`pointer-events-none absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform ${
              waiting ? "translate-x-2.5" : "peer-checked:translate-x-5"
            }`}
          />
        </span>
      </label>
      {error && <p className="mt-3 max-w-xl text-sm text-red-700">{error}</p>}
    </div>
  );
}
