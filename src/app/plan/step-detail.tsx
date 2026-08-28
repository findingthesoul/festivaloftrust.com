"use client";

import { useEffect, useState } from "react";
import { PHASES, STEP_COLORS } from "@/lib/festival-plan";
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
  const [saved, setSaved] = useState(false);

  const dirty = note !== step.note;
  const done = step.tasks.filter((t) => t.done).length;

  const save = () => {
    if (!dirty) return;
    onSaveNote(note);
    setSaved(true);
  };

  // The confirmation is worth about as long as it takes to read.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="pb-24">
      <button
        type="button"
        onClick={onBack}
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← All steps
      </button>

      <header className="mt-5 flex items-start gap-4">
        <StepMark step={step.number} className="mt-1 size-11 shrink-0" />
        <div className="min-w-0">
          <p className="text-ink/50 text-xs tracking-[0.15em] uppercase">
            {phase.label} · Step {step.number}
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] leading-tight font-bold tracking-[-0.02em]">
            {step.name}
          </h2>
          <p className="text-ink/80 mt-1 text-lg text-pretty">{step.purpose}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        {/*
          The question first, and alone in its own surface.

          It used to sit in a right-hand column under a "Reflection" heading,
          the same weight as the task list beside it — so the one thing that
          asks the organiser to think read as an optional extra. Here it is the
          first thing on the page and the widest thing on it.
        */}
        <section className="border-ink/12 border bg-white/55 p-6 sm:p-8">
          <p className="text-ink/50 text-xs tracking-[0.15em] uppercase">The question</p>
          <p className="mt-3 text-[clamp(1.15rem,2.2vw,1.5rem)] leading-snug font-medium text-pretty">
            {step.reflection}
          </p>

          <label htmlFor="note" className="sr-only">
            Your answer
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              // The shortcut every text field in every app has. Escape puts it
              // back, which is what Cancel means here.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
              if (e.key === "Escape") setNote(step.note);
            }}
            rows={10}
            placeholder="Take your time."
            className="border-ink/20 focus:border-green focus:ring-green/20 mt-5 w-full border bg-white p-4 leading-relaxed outline-none focus:ring-2"
          />

          {/*
            Save sits under the field it saves, and only exists when there is
            something to save.

            It was on blur before, with a line of small print explaining that.
            Nobody should have to be told when their writing is kept. A button
            that appears the moment the text changes says it without a sentence,
            and never sits there greyed out pretending to be available.
          */}
          <div className="mt-4 flex min-h-9 items-center gap-3">
            {dirty ? (
              <>
                <button
                  type="button"
                  onClick={save}
                  className="bg-green text-cream px-4 py-2 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setNote(step.note)}
                  className="text-ink/60 hover:text-ink px-2 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
                <span className="text-ink/40 ml-auto hidden text-xs sm:block">⌘↵ to save</span>
              </>
            ) : saved ? (
              <span className="text-green text-sm font-medium">Saved</span>
            ) : (
              <span className="text-ink/40 text-sm">
                {note ? "Your answer is saved." : "Nothing written yet."}
              </span>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {step.whatGoodLooksLike && (
            <section className="border-ink/12 border bg-white/35 p-5">
              <h3 className="text-ink/50 text-xs tracking-[0.15em] uppercase">
                What good looks like
              </h3>
              <p className="mt-2 leading-relaxed text-pretty">{step.whatGoodLooksLike}</p>
              {/* Only the first two steps carry one. A quiet aside, not a task. */}
              {step.readiness && (
                <p className="text-ink/70 border-ink/20 mt-4 border-l-2 pl-4 leading-relaxed text-pretty italic">
                  {step.readiness}
                </p>
              )}
            </section>
          )}

          <section className="border-ink/12 border bg-white/35 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold">Tasks</h3>
              <span className="text-ink/50 text-sm tabular-nums">
                {done}/{step.tasks.length}
              </span>
            </div>

            <ul className="mt-4 space-y-1">
              {step.tasks.map((task) => (
                <li key={task.id}>
                  <label className="hover:bg-ink/[0.04] flex cursor-pointer items-start gap-3 rounded-sm px-2 py-1.5 transition-colors">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) => onToggle(task.id, e.target.checked)}
                      className="accent-green mt-1 size-4 shrink-0"
                    />
                    <span className={task.done ? "text-ink/45 line-through" : ""}>
                      {task.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <form
              className="border-ink/15 mt-3 flex gap-2 border-t pt-3"
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
                className="focus:border-green border-ink/25 w-full border-b bg-transparent py-1 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!newTask.trim()}
                className="text-green text-sm font-medium disabled:opacity-35"
              >
                Add
              </button>
            </form>
          </section>

          <section className="border-l-4 p-5 text-sm" style={{ borderColor: accent, background: `${accent}14` }}>
            <p className="font-bold">Watch for</p>
            <p className="mt-1 leading-relaxed text-pretty">{step.trap}</p>
          </section>

          {step.key === "design" && (
            <section className="border-ink/20 border border-dashed p-5 text-sm">
              <p className="font-bold">Four-pillar dials and presets</p>
              <p className="text-ink/60 mt-1 leading-relaxed text-pretty">
                A separate component, still in design.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
