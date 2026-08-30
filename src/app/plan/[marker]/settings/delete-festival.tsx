"use client";

import { useState, useTransition } from "react";
import { deleteFestivalAction } from "./actions";

/**
 * The way out, made deliberate: deleting asks for the festival's address
 * typed back, and a live festival refuses outright — offline first, then
 * delete, so registrations are never one click from gone.
 */
export function DeleteFestival({
  marker,
  isLive,
}: {
  marker: string;
  isLive: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <h2 className="text-xl font-bold">Delete this festival</h2>
      {isLive ? (
        <p className="text-ink/60 mt-2 text-sm leading-relaxed">
          This festival is live. Take it offline on the Unpublish tab first —
          deleting is only for festivals that are not public.
        </p>
      ) : (
        <>
          <p className="text-ink/60 mt-2 text-sm leading-relaxed">
            Gone is gone: the plan, the agenda, the figures and the guest book
            go with it. Type the festival&rsquo;s address to confirm.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={marker}
              aria-label="Type the festival's address to confirm"
              className="border-ink/20 focus:border-ink rounded-lg border bg-white px-3.5 py-2 text-sm outline-none"
            />
            <button
              type="button"
              disabled={pending || confirm !== marker}
              onClick={() =>
                start(async () => {
                  const r = await deleteFestivalAction(marker, confirm);
                  if (r?.error) setError(r.error);
                })
              }
              className="bg-red text-cream rounded-lg px-5 py-2 text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete festival"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </>
      )}
    </div>
  );
}
