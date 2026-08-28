"use client";

import { useTransition } from "react";
import { submit } from "./actions";
import type { FestivalStatus } from "@/lib/festivals";

/** Asking for the festival to be published. Granting it is not the organiser's. */
export function SubmitForReview({
  marker,
  status,
}: {
  marker: string;
  status: FestivalStatus;
}) {
  const [pending, start] = useTransition();

  if (status === "live") {
    return (
      <section>
        <h2 className="text-xl font-bold">Published</h2>
        <p className="text-ink/70 mt-2 leading-relaxed text-pretty">
          This festival is live at{" "}
          <a
            href={`/${marker}`}
            className="text-green underline underline-offset-4"
          >
            festivaloftrust.com/{marker}
          </a>
          .
        </p>
      </section>
    );
  }

  if (status === "submitted") {
    return (
      <section>
        <h2 className="text-xl font-bold">With us for review</h2>
        <p className="text-ink/70 mt-2 max-w-xl leading-relaxed text-pretty">
          You can keep planning while we read it. Nothing is public yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold">Publishing</h2>
      <p className="text-ink/70 mt-2 max-w-xl leading-relaxed text-pretty">
        Planning happens in private. When the festival is ready to be seen, ask
        us to publish it — someone reads every one before it goes out.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => void (await submit(marker)))}
        className="bg-green text-cream mt-6 px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Ask to publish"}
      </button>
    </section>
  );
}
