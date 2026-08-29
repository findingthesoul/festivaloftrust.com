"use client";

import { useOptimistic, useState, useTransition } from "react";
import { PHASES, statusOf } from "@/lib/festival-plan";
import { viewFromRun, type PlanView } from "@/lib/plan-view";
import type { FibreRun } from "@/lib/fibre";
import { StepMark } from "@/components/StepMark";
import { createTask, saveNote, toggleTask } from "./actions";
import { StepDetail } from "./step-detail";

/**
 * The planner reading a live Flow run.
 *
 * Every mutation goes to the platform and the whole run comes back — step
 * status is derived server-side from task counts, so recomputing it here would
 * be a second rule free to drift from the platform's. Ticking a box is
 * optimistic only so the checkbox does not lag; the authoritative status
 * arrives with the response.
 */
export function FibrePlanner({ run: initial }: { run: FibreRun }) {
  const [view, setView] = useState<PlanView>(() => viewFromRun(initial));
  const [open, setOpen] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [optimistic, applyOptimistic] = useOptimistic(
    view,
    (state: PlanView, patch: { stepKey: string; taskId: string; done: boolean }) => ({
      ...state,
      steps: state.steps.map((s) => {
        if (s.key !== patch.stepKey) return s;
        const tasks = s.tasks.map((t) =>
          t.id === patch.taskId ? { ...t, done: patch.done } : t,
        );
        return {
          ...s,
          tasks,
          status: statusOf(tasks.filter((t) => t.done).length, tasks.length),
        };
      }),
    }),
  );

  const settle = (r: { run: FibreRun } | { error: string }) => {
    if ("error" in r) setError(r.error);
    else {
      setError(null);
      setView(viewFromRun(r.run));
    }
  };

  const onToggle = (stepKey: string, taskId: string, done: boolean) =>
    startTransition(async () => {
      applyOptimistic({ stepKey, taskId, done });
      settle(await toggleTask(view.runId!, taskId, done));
    });

  const onAddTask = (stepKey: string, title: string) =>
    startTransition(async () => settle(await createTask(view.runId!, stepKey, title)));

  const onSaveNote = (stepKey: string, body: string) =>
    startTransition(async () => {
      const r = await saveNote(view.runId!, stepKey, body);
      if ("error" in r) setError(r.error);
      else {
        setError(null);
        setView((v) => ({
          ...v,
          steps: v.steps.map((s) => (s.key === stepKey ? { ...s, note: body } : s)),
        }));
      }
    });

  const counts = optimistic.steps.map((s) => ({
    done: s.tasks.filter((t) => t.done).length,
    total: s.tasks.length,
  }));
  const totalDone = counts.reduce((a, c) => a + c.done, 0);
  const totalTasks = counts.reduce((a, c) => a + c.total, 0);
  const progress = totalTasks ? (totalDone / totalTasks) * 100 : 0;
  const openStep = optimistic.steps.find((s) => s.key === open);

  return (
    <>
      {/* No header of its own: the page's FestivalHeader already says whose
          plan this is, and the run subject repeats that same name. */}
      <div>
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

      {error && (
        <p className="border-red bg-red/10 mt-6 border-l-4 p-3 text-sm">
          The platform refused that: {error}
        </p>
      )}

      {openStep ? (
        <div className="mt-12">
          <StepDetail
            key={openStep.key}
            step={openStep}
            onBack={() => setOpen(null)}
            onToggle={(taskId, done) => onToggle(openStep.key, taskId, done)}
            onAddTask={(title) => onAddTask(openStep.key, title)}
            onSaveNote={(body) => onSaveNote(openStep.key, body)}
          />
        </div>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {optimistic.steps.map((s, i) => {
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
