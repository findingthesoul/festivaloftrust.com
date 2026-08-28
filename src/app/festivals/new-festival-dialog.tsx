"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { newFestival, type NewFestivalState } from "./actions";
import { slugify, suggestMarkers } from "@/lib/marker";

const initial: NewFestivalState = { status: "idle" };
const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";

export function NewFestivalDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(newFestival, initial);
  const [name, setName] = useState("");
  const [edited, setEdited] = useState("");
  const [touched, setTouched] = useState(false);

  // A pure function of the name, so it belongs in render. Only "is it taken"
  // needs the server, which the submit answers.
  const suggestions = useMemo(
    () => suggestMarkers(name, [], new Date().getFullYear()),
    [name],
  );
  const marker = touched ? edited : (suggestions[0] ?? "");
  const setMarker = (v: string) => {
    setTouched(true);
    setEdited(v);
  };

  const offered = state.suggestions?.length ? state.suggestions : suggestions;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="bg-green text-cream px-6 py-3 font-medium transition-opacity hover:opacity-85"
      >
        Add a festival
      </button>

      <dialog
        ref={dialogRef}
        // The native dialog gives focus trapping, Escape and inertness for
        // free; reimplementing those in a div is how they end up half-done.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="bg-cream text-ink border-ink/20 m-auto w-[min(34rem,92vw)] border p-0 backdrop:bg-ink/40"
      >
        <form action={action} className="p-7">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">A new festival</h2>
          <p className="text-ink/70 mt-2 text-sm leading-relaxed text-pretty">
            It starts as a draft. Nothing is public until it is approved.
          </p>

          <div className="mt-6">
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

          <div className="mt-5">
            <label htmlFor="place" className="font-medium">
              Place <span className="text-ink/50 font-normal">(optional)</span>
            </label>
            <input id="place" name="place" className={field} />
          </div>

          <div className="mt-5">
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
                      marker === s
                        ? "border-green text-green"
                        : "border-ink/25 hover:border-ink/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </p>
            )}
          </div>

          {state.status === "error" && state.message && (
            <p className="text-red mt-4 text-sm">{state.message}</p>
          )}

          <div className="mt-8 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-green text-cream px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-ink/60 hover:text-ink px-2 py-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
