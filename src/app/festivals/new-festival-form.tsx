"use client";

import { useActionState, useMemo, useState } from "react";
import { newFestival, type NewFestivalState } from "./actions";
import { slugify, suggestMarkers } from "@/lib/marker";

const initial: NewFestivalState = { status: "idle" };
const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";

export function NewFestivalForm() {
  const [state, action, pending] = useActionState(newFestival, initial);
  const [name, setName] = useState(state.values?.name ?? "");
  const [edited, setEdited] = useState(state.values?.marker ?? "");
  const [touched, setTouched] = useState(false);

  // Suggestions are a pure function of the name, so they belong in render
  // rather than in an effect that fetches them. Only "is this one taken"
  // needs the server, and the action answers that on submit.
  const suggestions = useMemo(
    () => suggestMarkers(name, [], new Date().getFullYear()),
    [name],
  );

  // Until the organiser edits the field it follows the name; after that it is
  // theirs. Derived, so there is no state to keep in step.
  const marker = touched ? edited : (suggestions[0] ?? "");
  const setMarker = (v: string) => {
    setTouched(true);
    setEdited(v);
  };

  const offered = state.suggestions?.length ? state.suggestions : suggestions;

  return (
    <form action={action} className="mt-8 max-w-lg">
      <div>
        <label htmlFor="name" className="font-medium">
          Festival name
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Festival of Trust — Cape Town"
          required
          className={field}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="marker" className="font-medium">
          Public address
        </label>
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className="text-ink/50">festivaloftrust.com/</span>
          <input
            id="marker"
            name="marker"
            value={marker}
            onChange={(e) => setMarker(slugify(e.target.value))}
            className="focus:border-green min-w-0 flex-1 border-b border-ink/25 bg-transparent py-1 outline-none"
          />
        </div>

        {offered.length > 0 && (
          <p className="text-ink/60 mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>Available:</span>
            {offered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMarker(s)}
                className={`border px-2 py-0.5 transition-colors ${
                  marker === s ? "border-green text-green" : "border-ink/25 hover:border-ink/50"
                }`}
              >
                {s}
              </button>
            ))}
          </p>
        )}

        <p className="text-ink/50 mt-3 text-sm leading-relaxed text-pretty">
          This is where the festival lives publicly. It can be changed later
          without affecting the plan.
        </p>
      </div>

      {state.status === "error" && state.message && (
        <p className="text-red mt-4 text-sm">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green text-cream mt-8 px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create the festival"}
      </button>
    </form>
  );
}
