"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  PHASES,
  statusOf,
  stepsFor,
  type Variation,
} from "@/lib/festival-plan";
import {
  getServerSnapshot,
  getSnapshot,
  setPlan,
  subscribe,
  type StepState,
} from "@/lib/plan-store";
import { StepMark } from "@/components/StepMark";
import { StepDetail } from "./step-detail";

/**
 * Placeholder festival. The marker is the URL slug
 * (festivaloftrust.com/[marker]); the title uses a separate display form, per
 * the build prompt's `title (derived): 'Festival of Trust ' + display marker`.
 *
 * Both are stand-ins until runs come from the platform, where the display name
 * arrives as the run's `subject_label`.
 */
const MARKER = "example";
const MARKER_DISPLAY = "Example";

export function Planner() {
  // The browser store is the source of truth. setPlan persists on every call,
  // which is the autosave the spec asks for — there is no save button.
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState<number | null>(null);

  const steps = useMemo(
    () => stepsFor(plan?.variation ?? "communities"),
    [plan?.variation],
  );

  if (!plan) {
    return <p className="text-ink/50 py-20 text-center">Opening your plan…</p>;
  }

  const stateFor = (id: number): StepState =>
    plan.steps[id] ?? {
      tasks: steps.find((s) => s.id === id)!.tasks.map((t) => ({ text: t, done: false })),
      note: "",
      contacts: [],
    };

  const update = (id: number, next: StepState) =>
    setPlan({ ...plan, steps: { ...plan.steps, [id]: next } });

  const counts = steps.map((s) => {
    const st = stateFor(s.id);
    const done = st.tasks.filter((t) => t.done).length;
    return { done, total: st.tasks.length };
  });
  const totalDone = counts.reduce((a, c) => a + c.done, 0);
  const totalTasks = counts.reduce((a, c) => a + c.total, 0);
  const progress = totalTasks ? (totalDone / totalTasks) * 100 : 0;

  const openStep = open === null ? null : steps.find((s) => s.id === open);

  return (
    <>
      <header>
        <p className="text-ink/50 text-xs tracking-[0.2em] uppercase">
          Festival of Trust
        </p>
        <h1 className="mt-2 text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          Festival of Trust {MARKER_DISPLAY}
        </h1>
        <p className="text-green mt-2 text-lg font-medium">
          Grow trust, one pocket at a time.
        </p>
      </header>

      {/* Progress across all nine steps, in the three phase colours. */}
      <div className="mt-8">
        <div className="bg-ink/10 h-2 w-full overflow-hidden">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${PHASES.orientation.color}, ${PHASES.doing.color}, ${PHASES.culmination.color})`,
            }}
          />
        </div>
        <p className="text-ink/60 mt-2 text-sm">
          {totalDone} of {totalTasks} tasks
        </p>
      </div>

      {openStep ? (
        <div className="mt-12">
          <StepDetail
            step={openStep}
            state={stateFor(openStep.id)}
            onChange={(next) => update(openStep.id, next)}
            onBack={() => setOpen(null)}
          />
        </div>
      ) : (
        <>
          {/* Three rows, one per phase — mirroring the brand grid. */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => {
              const { done, total } = counts[i];
              const status = statusOf(done, total);
              const phase = PHASES[s.phase];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOpen(s.id)}
                  className="border-ink/15 hover:border-ink/40 group flex flex-col items-start border bg-white/40 p-5 text-left transition-colors"
                >
                  <StepMark step={s.id} className="h-10 w-10" />
                  {/* The marks now carry their own poster colour, so the phase
                      needs saying rather than showing. */}
                  <p
                    className="mt-4 text-[0.65rem] font-medium tracking-[0.15em] uppercase"
                    style={{ color: phase.color }}
                  >
                    {phase.label}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{s.verb}</h2>
                  <p className="text-ink/70 mt-1 flex-1 text-sm text-pretty">
                    {s.purpose}
                  </p>
                  <p className="text-ink/50 mt-4 font-mono text-xs">
                    {status === "done" ? "done" : `${done}/${total}`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-6 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-ink/60">Variation</span>
              {(["communities", "organisations"] as Variation[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPlan({ ...plan, variation: v })}
                  aria-pressed={plan.variation === v}
                  className={`border px-3 py-1.5 capitalize transition-colors ${
                    plan.variation === v
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/25 hover:border-ink/50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <a
              href={`/${MARKER}`}
              className="text-green underline underline-offset-4"
            >
              Public page for {MARKER} →
            </a>
          </div>
        </>
      )}
    </>
  );
}
