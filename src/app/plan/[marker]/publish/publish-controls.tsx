"use client";

import { useState, useTransition } from "react";
import { askToPublish, unpublish } from "./actions";
import type { FestivalStatus } from "@/lib/festivals";

export function PublishControls({
  marker,
  status,
}: {
  marker: string;
  status: FestivalStatus;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (m: string) => Promise<{ error?: string }>) =>
    start(async () => setError((await fn(marker)).error ?? null));

  return (
    <div className="mt-10">
      {status === "live" && (
        <>
          <h2 className="text-xl font-bold">Published</h2>
          <p className="text-ink/70 mt-2 max-w-xl leading-relaxed text-pretty">
            Live at{" "}
            <a href={`/${marker}`} className="text-green underline underline-offset-4">
              festivaloftrust.com/{marker}
            </a>
            . Taking it offline hides the page and stops registrations. Nobody
            who has already registered is removed.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(unpublish)}
            className="border-ink/25 hover:border-ink/50 mt-6 border px-4 py-2 text-sm disabled:opacity-50"
          >
            Take it offline
          </button>
        </>
      )}

      {status === "submitted" && (
        <>
          <h2 className="text-xl font-bold">With us for review</h2>
          <p className="text-ink/70 mt-2 max-w-xl leading-relaxed text-pretty">
            Someone reads every festival by hand. You can keep planning while we
            do. Nothing is public yet.
          </p>
        </>
      )}

      {status === "draft" && (
        <>
          <h2 className="text-xl font-bold">Not published</h2>
          <p className="text-ink/70 mt-2 max-w-xl leading-relaxed text-pretty">
            Ask us to publish it and we will read it first. Putting a festival
            live is ours to grant, not yours to take — that is what the trust in
            the name is doing.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(askToPublish)}
            className="bg-green text-cream mt-6 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Ask to publish
          </button>
        </>
      )}

      {error && <p className="mt-4 max-w-xl text-sm text-red-700">{error}</p>}
    </div>
  );
}
