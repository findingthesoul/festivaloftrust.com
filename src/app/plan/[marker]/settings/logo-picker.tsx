"use client";

import { useState, useTransition } from "react";
import { chooseLogo, releaseLogo } from "./actions";

/**
 * The festival chooses its face: one composition from the shared Festival
 * logos pool, drawn in the shape generator. What is shown here is only what
 * is still free — a claimed logo belongs to its festival until released.
 * The SVGs arrive pre-rendered from the server; this component only lets
 * the organiser point at one.
 */

export type LogoChoice = { id: string; html: string };

export function LogoPicker({
  marker,
  current,
  available,
}: {
  marker: string;
  current: LogoChoice | null;
  available: LogoChoice[];
}) {
  const [picking, setPicking] = useState(!current);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const claim = (id: string) =>
    start(async () => {
      const r = await chooseLogo(marker, id);
      setError(r.error ?? null);
      if (!r.error) setPicking(false);
    });

  const giveBack = () =>
    start(async () => {
      const r = await releaseLogo(marker);
      setError(r.error ?? null);
    });

  return (
    <div>
      <h2 className="text-lg font-bold">Logo</h2>
      <p className="text-ink/60 mt-1 text-sm">
        Each festival wears one composition of the nine forms — unique to it.
        Once chosen, no other festival can take the same one. Until you
        choose, the festival carries a form grown from its own address.
      </p>

      {current && (
        <div className="mt-4 flex items-end gap-4">
          <div
            className="border-ink/10 h-32 w-32 border bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: current.html }}
          />
          <div className="flex gap-3 pb-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => setPicking((p) => !p)}
              className="border-ink/20 hover:border-ink/50 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {picking ? "Keep this one" : "Choose another"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={giveBack}
              className="border-ink/20 text-ink/70 hover:border-ink/50 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Release
            </button>
          </div>
        </div>
      )}

      {picking &&
        (available.length === 0 ? (
          <p className="text-ink/50 mt-4 text-sm">
            The pool is empty right now — every logo is taken. New ones appear
            here as they are added.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {available.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={pending}
                onClick={() => claim(l.id)}
                title="Choose this logo"
                className="border-ink/10 hover:border-ink/60 aspect-square border bg-white p-3 transition-colors disabled:opacity-50 [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: l.html }}
              />
            ))}
          </div>
        ))}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
