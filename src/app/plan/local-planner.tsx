"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { PHASES, statusOf, stepsFor } from "@/lib/festival-plan";
import type { PlanView, ViewStep } from "@/lib/plan-view";
import {
  getServerSnapshot,
  getSnapshot,
  setPlan,
  subscribe,
} from "@/lib/plan-store";
import { StepMark } from "@/components/StepMark";
import { StepDetail } from "./step-detail";

/**
 * The planner with no platform behind it.
 *
 * Kept so the page works before an app key exists, and so a failure to reach
 * the platform degrades rather than blanks. Renders the same view shape as the
 * connected planner, so the screens do not branch.
 */
export function LocalPlanner() {
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState<string | null>(null);

  const seeds = useMemo(() => stepsFor(plan?.variation ?? "communities"), [plan?.variation]);

  const view: PlanView | null = useMemo(() => {
    if (!plan) return null;
    return {
      source: "local",
      subject: "Festival of Trust",
      steps: seeds.map((s): ViewStep => {
        const stored = plan.steps[s.id];
        const tasks = (stored?.tasks ?? s.tasks.map((t) => ({ text: t, done: false }))).map(
          (t, i) => ({ id: `${s.id}-${i}`, title: t.text, done: t.done }),
        );
        return {
          number: s.id,
          key: s.verb.toLowerCase(),
          name: s.verb,
          phase: s.phase,
          purpose: s.purpose,
          whatGoodLooksLike: s.whatGoodLooksLike,
          trap: s.trap,
          readiness: s.readiness,
          reflection: s.reflection,
          tasks,
          note: stored?.note ?? "",
          status: statusOf(tasks.filter((t) => t.done).length, tasks.length),
        };
      }),
    };
  }, [plan, seeds]);

  if (!plan || !view) {
    return <p className="text-ink/50 py-20 text-center">Opening your plan…</p>;
  }

  const write = (stepNumber: number, mutate: (tasks: { text: string; done: boolean }[]) => {
    tasks?: { text: string; done: boolean }[];
    note?: string;
  }) => {
    const seed = seeds.find((s) => s.id === stepNumber)!;
    const current =
      plan.steps[stepNumber] ??
      { tasks: seed.tasks.map((t) => ({ text: t, done: false })), note: "", contacts: [] };
    const patch = mutate(current.tasks);
    setPlan({
      ...plan,
      steps: { ...plan.steps, [stepNumber]: { ...current, ...patch } },
    });
  };

  const openStep = view.steps.find((s) => s.key === open);
  const counts = view.steps.map((s) => ({
    done: s.tasks.filter((t) => t.done).length,
    total: s.tasks.length,
  }));
  const totalDone = counts.reduce((a, c) => a + c.done, 0);
  const totalTasks = counts.reduce((a, c) => a + c.total, 0);
  const progress = totalTasks ? (totalDone / totalTasks) * 100 : 0;

  return (
    <>
      <header>
        <p className="text-ink/50 text-xs tracking-[0.2em] uppercase">Festival of Trust</p>
        <h1 className="mt-2 text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          {view.subject}
        </h1>
        <p className="text-green mt-2 text-lg font-medium">
          Grow trust, one pocket at a time.
        </p>
      </header>

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
            key={openStep.key}
            step={openStep}
            onBack={() => setOpen(null)}
            onToggle={(taskId, done) =>
              write(openStep.number, (tasks) => ({
                tasks: tasks.map((t, i) =>
                  `${openStep.number}-${i}` === taskId ? { ...t, done } : t,
                ),
              }))
            }
            onAddTask={(title) =>
              write(openStep.number, (tasks) => ({ tasks: [...tasks, { text: title, done: false }] }))
            }
            onSaveNote={(body) => write(openStep.number, () => ({ note: body }))}
          />
        </div>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {view.steps.map((s, i) => {
            const { done, total } = counts[i];
            const phase = PHASES[s.phase];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setOpen(s.key)}
                className="border-ink/15 hover:border-ink/40 flex flex-col items-start border bg-white/40 p-5 text-left transition-colors"
              >
                <StepMark step={s.number} className="h-10 w-10" />
                <p
                  className="mt-4 text-[0.65rem] font-medium tracking-[0.15em] uppercase"
                  style={{ color: phase.color }}
                >
                  {phase.label}
                </p>
                <h2 className="mt-1 text-xl font-bold">{s.name}</h2>
                <p className="text-ink/70 mt-1 flex-1 text-sm text-pretty">{s.purpose}</p>
                <p className="text-ink/50 mt-4 font-mono text-xs">
                  {s.status === "done" ? "done" : `${done}/${total}`}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
