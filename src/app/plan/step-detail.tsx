"use client";

import { useState } from "react";
import { PHASES } from "@/lib/festival-plan";
import { STEP_COLORS } from "@/lib/festival-plan";
import type { ViewStep } from "@/lib/plan-view";
import { StepMark } from "@/components/StepMark";

export function StepDetail({
  step,
  onBack,
  onToggle,
  onAddTask,
  onSaveNote,
}: {
  step: ViewStep;
  onBack: () => void;
  onToggle: (taskId: string, done: boolean) => void;
  onAddTask: (title: string) => void;
  onSaveNote: (body: string) => void;
}) {
  const phase = PHASES[step.phase];
  const accent = STEP_COLORS[step.number];
  // Callers mount this with key={step.key}, so moving between steps remounts
  // and these initialise from the new step. Syncing them in an effect instead
  // would fight the user's cursor mid-sentence.
  const [note, setNote] = useState(step.note);
  const [newTask, setNewTask] = useState("");

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
        <StepMark step={step.number} className="mt-1 h-11 w-11 shrink-0" />
        <div>
          <p className="text-ink/50 text-xs tracking-[0.15em] uppercase">{phase.label}</p>
          <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-tight font-bold tracking-[-0.02em]">
            {step.name}
          </h2>
          <p className="mt-1 text-lg text-pretty">{step.purpose}</p>
        </div>
      </header>

      {step.whatGoodLooksLike && (
        <section className="mt-8 max-w-2xl">
          <h3 className="text-ink/50 text-xs tracking-[0.15em] uppercase">
            What good looks like
          </h3>
          <p className="mt-2 leading-relaxed text-pretty">{step.whatGoodLooksLike}</p>
        </section>
      )}

      {/* Only the first two steps carry one. A quiet aside, not a task. */}
      {step.readiness && (
        <p className="text-ink/70 mt-6 max-w-2xl border-l-2 border-ink/20 pl-4 leading-relaxed text-pretty italic">
          {step.readiness}
        </p>
      )}

      {/* Tasks and reflection carry equal weight: the early steps are
          relational, not logistical. */}
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h3 className="font-bold">Suggested tasks</h3>
          <ul className="mt-4 space-y-2">
            {step.tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => onToggle(task.id, e.target.checked)}
                  className="mt-1.5 shrink-0"
                  aria-label={task.title}
                />
                <span className={task.done ? "text-ink/45 line-through" : ""}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = newTask.trim();
              if (!t) return;
              onAddTask(t);
              setNewTask("");
            }}
          >
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task"
              aria-label="Add a task"
              className="focus:border-green w-full border-b border-ink/25 bg-transparent py-1 text-sm outline-none"
            />
            <button type="submit" className="text-green text-sm font-medium">
              Add
            </button>
          </form>

          <div
            className="mt-8 border-l-4 p-4 text-sm"
            style={{ borderColor: accent, background: `${accent}14` }}
          >
            <p className="font-bold">Watch for</p>
            <p className="mt-1 leading-relaxed text-pretty">{step.trap}</p>
          </div>

          {step.key === "design" && (
            <div className="border-ink/20 mt-6 border border-dashed p-4 text-sm">
              <p className="font-bold">Four-pillar dials and presets</p>
              <p className="text-ink/60 mt-1 leading-relaxed text-pretty">
                A separate component, still in design.
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            // Saved on blur rather than per keystroke: the spec forbids a save
            // button, and a write per character would be 39 round trips a
            // sentence.
            onBlur={() => note !== step.note && onSaveNote(note)}
            rows={12}
            placeholder="Take your time."
            className="focus:border-green focus:ring-green/20 mt-4 w-full border border-ink/25 bg-white/60 p-4 leading-relaxed outline-none focus:ring-2"
          />
          <p className="text-ink/40 mt-2 text-xs">Saved when you click away.</p>
        </section>
      </div>
    </div>
  );
}
