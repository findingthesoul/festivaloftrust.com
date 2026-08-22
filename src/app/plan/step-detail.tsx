"use client";

import { PHASES, type StepSeed } from "@/lib/festival-plan";
import type { StepState } from "@/lib/plan-store";
import { StepMark } from "@/components/StepMark";

export function StepDetail({
  step,
  state,
  onChange,
  onBack,
}: {
  step: StepSeed;
  state: StepState;
  onChange: (next: StepState) => void;
  onBack: () => void;
}) {
  const phase = PHASES[step.phase];

  const setTask = (i: number, patch: Partial<StepState["tasks"][number]>) =>
    onChange({
      ...state,
      tasks: state.tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)),
    });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← All steps
      </button>

      <header className="mt-6 flex items-start gap-4">
        <StepMark step={step.id} color={phase.color} className="mt-1 h-11 w-11 shrink-0" />
        <div>
          <p className="text-ink/50 text-xs tracking-[0.15em] uppercase">
            {phase.label}
          </p>
          <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em]">
            {step.verb}
          </h2>
          <p className="mt-1 text-lg text-pretty">{step.purpose}</p>
        </div>
      </header>

      {/* Tasks and reflection carry equal weight, per the spec's core
          principle: the early steps are relational, not logistical. */}
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h3 className="font-bold">Suggested tasks</h3>
          <ul className="mt-4 space-y-2">
            {state.tasks.map((task, i) => (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => setTask(i, { done: e.target.checked })}
                  className="mt-1.5 shrink-0"
                  aria-label={task.text}
                />
                <input
                  value={task.text}
                  onChange={(e) => setTask(i, { text: e.target.value })}
                  className={`focus:border-ink/40 w-full border-b border-transparent bg-transparent py-1 outline-none ${
                    task.done ? "text-ink/45 line-through" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...state, tasks: state.tasks.filter((_, j) => j !== i) })
                  }
                  aria-label={`Remove "${task.text}"`}
                  className="text-ink/30 hover:text-red shrink-0 px-1 transition-colors"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              onChange({ ...state, tasks: [...state.tasks, { text: "", done: false }] })
            }
            className="text-green mt-4 text-sm font-medium underline underline-offset-4"
          >
            Add a task
          </button>

          <div
            className="mt-8 border-l-4 p-4 text-sm"
            style={{ borderColor: phase.color, background: `${phase.color}14` }}
          >
            <p className="font-bold">Watch for</p>
            <p className="mt-1 leading-relaxed text-pretty">{step.trap}</p>
          </div>

          {step.id === 5 && (
            <div className="border-ink/20 mt-6 border border-dashed p-4 text-sm">
              <p className="font-bold">Four-pillar dials and presets</p>
              <p className="text-ink/60 mt-1 leading-relaxed text-pretty">
                Out of scope for this build — a separate component.
              </p>
            </div>
          )}
        </section>

        <section>
          <h3 className="font-bold">Reflection</h3>
          <p className="mt-4 text-lg leading-relaxed text-pretty">{step.reflection}</p>
          <label htmlFor="note" className="sr-only">
            Your note
          </label>
          <textarea
            id="note"
            value={state.note}
            onChange={(e) => onChange({ ...state, note: e.target.value })}
            rows={12}
            placeholder="Take your time."
            className="focus:border-green focus:ring-green/20 mt-4 w-full border border-ink/25 bg-white/60 p-4 leading-relaxed outline-none focus:ring-2"
          />

          <div className="mt-8">
            <h3 className="font-bold">People</h3>
            <p className="text-ink/60 mt-2 text-sm leading-relaxed text-pretty">
              Linking people pulls from the platform contact graph. The picker
              is not built — the contact entities are still open. See the
              persistence proposal.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
