/**
 * One shape the screens render, whichever source produced it.
 *
 * Connected, the steps come from Flow — including their status, which the
 * platform derives from task counts. Unconnected, they come from this repo and
 * the browser. Keeping both behind one type stops the difference leaking into
 * every component.
 */
import type { FibreRun } from "@/lib/fibre";
import { PHASES, type Phase, type StepStatus } from "@/lib/festival-plan";

export type ViewTask = { id: string; title: string; done: boolean };

export type ViewStep = {
  /** 1-9, for the mark. Flow gives a 0-based ordinal. */
  number: number;
  key: string;
  name: string;
  phase: Phase;
  purpose: string;
  whatGoodLooksLike: string;
  trap: string;
  readiness?: string;
  reflection: string;
  tasks: ViewTask[];
  note: string;
  status: StepStatus;
};

export type PlanView = {
  source: "fibre" | "local";
  runId?: string;
  subject: string;
  steps: ViewStep[];
};

const isPhase = (v: string | null): v is Phase => !!v && v in PHASES;

export function viewFromRun(run: FibreRun): PlanView {
  return {
    source: "fibre",
    runId: run.id,
    subject: run.subject_label ?? "Festival of Trust",
    steps: [...run.steps]
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((s) => {
        const m = s.meta ?? {};
        const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
        return {
          number: s.ordinal + 1,
          key: s.key,
          name: s.name,
          // group_key is the phase; fall back rather than crash if a flow is
          // authored without one.
          phase: isPhase(s.group_key) ? s.group_key : "orientation",
          purpose: str("purpose") || s.description || "",
          whatGoodLooksLike: str("what_good_looks_like"),
          trap: str("trap"),
          readiness: str("readiness") || undefined,
          reflection: str("reflection"),
          // Task order is not preserved by the platform yet: flow_task has no
          // ordinal and the API sorts by created_at, which is one instant for a
          // whole run. Left as returned rather than re-sorted here — the planner
          // second-guessing Flow would be worse than the wrong order.
          // See thefibre/docs/brief-task-ordering.md.
          tasks: s.tasks
            .filter((t) => t.status !== "cancelled")
            .map((t) => ({ id: t.id, title: t.title, done: t.status === "done" })),
          note: s.note ?? "",
          status: s.status,
        };
      }),
  };
}
