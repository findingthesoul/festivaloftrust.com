"use client";

import { useEffect, useState } from "react";
import { checkMarker } from "./actions";
import { Field } from "@/components/ui";
import { slugify } from "@/lib/marker";

type State =
  | { kind: "unchanged" }
  | { kind: "checking" }
  | { kind: "free" }
  | { kind: "taken"; reason: string; suggestions: string[] };

/**
 * The public address.
 *
 * Separate from the other fields because it is the only one where the answer
 * "no" is useful: an address someone else holds has to be found out before
 * saving, not after. It checks as you type and offers what is free.
 *
 * It does not follow the title. Renaming a festival two weeks in should not
 * silently move the link people already have — so the alternatives are offered
 * and never applied.
 */
export function MarkerField({
  current,
  title,
}: {
  current: string;
  /** The title as it stands in the form, so suggestions follow a rename. */
  title: string;
}) {
  const [value, setValue] = useState(current);
  // Keyed by the value it answers about, so "checking" is derived from the
  // answer being stale rather than set on the way into an effect.
  const [answer, setAnswer] = useState<{ for: string; state: State } | null>(null);

  const state: State =
    value === current
      ? { kind: "unchanged" }
      : answer?.for === value
        ? answer.state
        : { kind: "checking" };

  useEffect(() => {
    if (value === current) return;
    // Debounced: one request per pause, not one per keystroke.
    const t = setTimeout(async () => {
      const result = await checkMarker(value, current, title);
      setAnswer({
        for: value,
        state: result.ok
          ? { kind: "free" }
          : {
              kind: "taken",
              reason: result.reason ?? "not available",
              suggestions: result.suggestions,
            },
      });
    }, 400);
    return () => clearTimeout(t);
  }, [value, current, title]);

  return (
    <Field
      label="Public address"
      htmlFor="marker"
      className="sm:col-span-2"
      hint={
        value !== current
          ? "The old address stops working, and the page in The Thread keeps the one it was published under."
          : undefined
      }
    >
      <div className="border-ink/20 focus-within:border-ink/40 focus-within:ring-ink/[0.06] flex items-center rounded-lg border bg-white pl-3.5 transition-colors focus-within:ring-4">
        <span className="text-ink/45 shrink-0 text-base">festivaloftrust.com/</span>
        <input
          id="marker"
          name="marker"
          value={value}
          onChange={(e) => setValue(slugify(e.target.value))}
          className="w-full bg-transparent py-2.5 pr-3.5 text-base outline-none"
        />
      </div>

      <p className="mt-1.5 min-h-5 text-sm">
        {state.kind === "checking" && <span className="text-ink/45">Checking…</span>}
        {state.kind === "free" && <span className="text-green font-medium">Available</span>}
        {state.kind === "taken" && <span className="text-red-700">{state.reason}</span>}
      </p>

      {state.kind === "taken" && state.suggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-ink/50 text-sm">Free:</span>
          {state.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="border-ink/20 hover:border-ink/45 rounded-full border px-3 py-1 text-sm transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
