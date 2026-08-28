"use client";

import { useState, useTransition } from "react";
import { decideFestival, decideOrganiser } from "./actions";

export function OrganiserButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideOrganiser(id, "approved")))}
        className="bg-green text-cream px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await decideOrganiser(id, "declined")))}
        className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}

/**
 * `live` swaps the pair for a single way back down. A festival that is already
 * public has nothing to approve, and "Send back" would read as if it were still
 * waiting — which is how a live festival ended up with no control at all.
 */
export function FestivalButtons({
  id,
  live = false,
  needsPage = false,
}: {
  id: string;
  live?: boolean;
  needsPage?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const decide = (decision: "live" | "draft") =>
    start(async () => {
      const result = await decideFestival(id, decision);
      setError("error" in result ? (result.error ?? null) : null);
    });

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex gap-2">
        {live ? (
          <>
            {/* Approval already ran; only the Thread page failed. Re-running
                the live decision retries just that part. */}
            {needsPage && (
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("live")}
                className="bg-green text-cream px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Retry page
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("draft")}
              className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Take offline
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("live")}
              className="bg-green text-cream px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Put live
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("draft")}
              className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Send back
            </button>
          </>
        )}
      </div>
      {error && <p className="max-w-xs text-right text-sm text-red-700">{error}</p>}
    </div>
  );
}
