"use client";

import { useState } from "react";
import {
  DOMAINS,
  DOMAIN_ACCENTS,
  RATES,
  TIERS,
  TRAINING,
  tierIndex,
  type Setting,
} from "@/lib/festival-model";

const eur = (n: number) =>
  "€" + Math.round(n).toLocaleString("nl-NL", { maximumFractionDigits: 0 });

export function Sequence() {
  const [setting, setSetting] = useState<Setting>("social");
  const [visitors, setVisitors] = useState(60);
  const [training, setTraining] = useState(false);

  const ti = tierIndex(visitors);
  const tier = TIERS[ti];
  const rate = RATES[setting];

  const stepHours = DOMAINS.reduce((sum, d) => sum + d.hours[ti], 0);
  const trainingHours = training ? TRAINING.hours : 0;
  const totalHours = stepHours + trainingHours;

  const facilitation = totalHours * rate.hourly;
  const kit = Math.max(visitors * rate.kitPerPerson, rate.kitMinimum);
  const kitAtMinimum = visitors * rate.kitPerPerson < rate.kitMinimum;

  return (
    <>
      {/* Controls */}
      <section className="mt-10 border-t border-ink/15 pt-8">
        <h2 className="text-xl font-bold">Set the shape</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <span className="font-medium">Setting</span>
            <div className="mt-2 flex">
              {(["social", "organisation"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSetting(s)}
                  aria-pressed={setting === s}
                  className={`flex-1 border px-3 py-2 text-sm capitalize transition-colors ${
                    setting === s
                      ? "border-green bg-green text-cream"
                      : "border-ink/25 hover:border-ink/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="visitors" className="font-medium">
              Expected visitors
            </label>
            <input
              id="visitors"
              type="number"
              min={1}
              max={500}
              value={visitors}
              onChange={(e) => setVisitors(Math.max(1, Number(e.target.value) || 0))}
              className="focus:border-green focus:ring-green/25 mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2 outline-none focus:ring-2"
            />
            <p className="text-ink/60 mt-1 text-sm">
              {tier.name} — {tier.range}
            </p>
          </div>

          <div>
            <span className="font-medium">Facilitator training</span>
            <label className="mt-2 flex items-center gap-2 border border-ink/25 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={training}
                onChange={(e) => setTraining(e.target.checked)}
              />
              Include ({TRAINING.hours} h)
            </label>
          </div>
        </div>
      </section>

      {/* The nine domains */}
      <section className="mt-14 border-t border-ink/15 pt-8">
        <h2 className="text-xl font-bold">The nine domains</h2>
        <p className="text-ink/70 mt-2 text-sm">
          Hours shown are the tier default for {tier.name.toLowerCase()}. In the
          full planner each one can be adjusted.
        </p>

        <ol className="mt-8 space-y-0">
          {DOMAINS.map((d, i) => (
            <li
              key={d.key}
              className="flex items-baseline gap-4 border-b border-ink/10 py-4"
            >
              <span className={`h-3 w-3 shrink-0 self-center ${DOMAIN_ACCENTS[i]}`} />
              <span className="text-ink/40 w-5 shrink-0 font-mono text-sm">
                {i + 1}
              </span>
              <span className="w-24 shrink-0 font-bold">{d.name}</span>
              <span className="flex-1 text-pretty">{d.description}</span>
              <span className="shrink-0 font-mono text-sm">{d.hours[ti]} h</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Indicative total */}
      <section className="mt-14 border-t border-ink/15 pt-8">
        <h2 className="text-xl font-bold">Where that lands</h2>
        <dl className="mt-6 space-y-3">
          {[
            [`Facilitation, ${totalHours} h at ${eur(rate.hourly)}`, facilitation],
            [
              `Kit, ${visitors} visitors at ${eur(rate.kitPerPerson)}${kitAtMinimum ? " (minimum applies)" : ""}`,
              kit,
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between gap-6">
              <dt className="text-pretty">{label}</dt>
              <dd className="shrink-0 font-mono">{eur(Number(value))}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-6 border-t border-ink/15 pt-3 text-lg font-bold">
            <dt>Indicative, before costs and funding</dt>
            <dd className="font-mono">{eur(facilitation + kit)}</dd>
          </div>
        </dl>
        <p className="text-ink/60 mt-4 text-sm">
          Exclusive of VAT. Location, food, drinks, artists, travel and funding
          are set in the full planner.
        </p>

        <a
          href="/planner"
          className="bg-green text-cream mt-8 inline-block px-6 py-3 font-medium transition-opacity hover:opacity-85"
        >
          Open the full planner
        </a>
      </section>
    </>
  );
}
