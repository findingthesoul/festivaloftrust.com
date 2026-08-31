"use client";

import { useState, useTransition } from "react";
import { decideFestival, decideOrganiser, removeFromHome, toggleCoverHome } from "./actions";

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

export function HomePhotoButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await removeFromHome(id)))}
      className="border-ink/25 hover:border-ink/50 border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      Take off the home page
    </button>
  );
}

/**
 * The round pick on a festival's cover: checked means the cover is in the
 * home page rotation.
 */
export function CoverHomeToggle({
  festivalId,
  on,
}: {
  festivalId: string;
  on: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title={on ? "Take the cover off the home page" : "Put the cover on the home page"}
      aria-pressed={on}
      onClick={() => start(async () => void (await toggleCoverHome(festivalId, !on)))}
      className={`absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-sm shadow-sm transition-colors disabled:opacity-50 ${
        on
          ? "bg-green border-green text-cream"
          : "border-ink/30 text-ink/40 hover:border-ink/60 hover:text-ink/70 bg-white/90"
      }`}
    >
      ✓
    </button>
  );
}
