import type { Variation } from "./festival-plan";

export type StepState = {
  /** Task list, editable; the spec makes seeds defaults rather than fixed. */
  tasks: { text: string; done: boolean }[];
  note: string;
  /** Platform person ids. The picker is not built; see the proposal doc. */
  contacts: string[];
};

export type PlanState = {
  marker: string;
  variation: Variation;
  steps: Record<number, StepState>;
  updatedAt: string;
};

export function emptyPlanFor(marker: string, variation: Variation): PlanState {
  return { marker, variation, steps: {}, updatedAt: new Date().toISOString() };
}
