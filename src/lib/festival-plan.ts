/**
 * The nine steps, per the Planner App build prompt.
 *
 * Tasks, traps and reflections are placeholders: the spec sources them from
 * "manual documents A2", which are not in the repo or the Drive project folder.
 * They are plain data, so importing the real content is a change to this file
 * and nothing else.
 */

export type Phase = "orientation" | "doing" | "culmination";
export type Variation = "communities" | "organisations";
export type StepStatus = "not_started" | "in_progress" | "done";

/**
 * Phase colours. Confirmed by the Developer Briefing (§5, "Colour marks phase,
 * not step") — these are the system, not an approximation of the poster.
 *
 * Colour groups the nine steps into three phases of three. A step never gets
 * its own colour; the briefing is explicit that doing so breaks the system.
 *
 * Why these differ from the site's palette: `globals.css` is sampled from the
 * shape artwork, which uses eight colours across the grid. That is an event
 * *composition* — "each festival may compose its own arrangement of the nine
 * forms" — not the phase system. The two are meant to differ.
 *
 * Both the briefing and the build prompt add that hexes are read from current
 * artwork and want confirming against the designer's master file. Sampling the
 * master PNGs also puts the wordmark at #181717 rather than the briefing's
 * #3B3F8F, so INK below is the briefing's value and the site keeps the sampled
 * one until a designer settles it.
 */
export const PHASES: Record<Phase, { label: string; color: string }> = {
  orientation: { label: "Orientation", color: "#E9C60F" },
  doing: { label: "Doing", color: "#F0921E" },
  culmination: { label: "Culmination", color: "#E6197F" },
};

/** Deep indigo — the wordmark and primary text on light (Developer Briefing §5). */
export const INK = "#3B3F8F";

export type StepSeed = {
  id: number;
  verb: string;
  phase: Phase;
  purpose: string;
  tasks: string[];
  trap: string;
  reflection: string;
};

export const STEPS: StepSeed[] = [
  {
    id: 1,
    verb: "Listen",
    phase: "orientation",
    purpose: "Discover the need.",
    tasks: [
      "Hold four conversations of two hours",
      "Write down what you heard, not what you concluded",
      "Notice who is already trusted here",
    ],
    trap: "Arriving with the festival already designed in your head.",
    reflection: "What did you hear that you did not expect?",
  },
  {
    id: 2,
    verb: "Gather",
    phase: "orientation",
    purpose: "Form the core group.",
    tasks: [
      "Invite the people the conversations pointed to",
      "Agree how often you will meet",
      "Make room for someone who disagrees",
    ],
    trap: "Gathering people who already agree with each other.",
    reflection: "Who is missing from this group, and why?",
  },
  {
    id: 3,
    verb: "Align",
    phase: "orientation",
    purpose: "Clarify purpose and vision.",
    tasks: [
      "Name the four elements together",
      "Write one sentence the whole group can stand behind",
      "Decide what this festival is not",
    ],
    trap: "Settling for words everyone can accept but nobody means.",
    reflection: "Where did the group struggle to agree, and what does that tell you?",
  },
  {
    id: 4,
    verb: "Connect",
    phase: "doing",
    purpose: "Build partnerships.",
    tasks: [
      "List who already holds trust in this place",
      "Approach partners with an invitation, not a request",
      "Agree what each partner brings",
    ],
    trap: "Treating partners as suppliers rather than co-hosts.",
    reflection: "What are you asking of partners, and what are you offering them?",
  },
  {
    id: 5,
    verb: "Design",
    phase: "doing",
    purpose: "Shape the festival journey.",
    tasks: [
      "Map the arc of the day",
      "Decide where encounter happens, not just programme",
      "Leave deliberate space that is not filled",
    ],
    trap: "Filling every hour and leaving no room for what emerges.",
    reflection: "Where in the day does a stranger become someone you know?",
  },
  {
    id: 6,
    verb: "Invite",
    phase: "doing",
    purpose: "Bring the community together.",
    tasks: [
      "Invite through people, not posters",
      "Make it easy for someone to bring another",
      "Check who has not been reached",
    ],
    trap: "Broadcasting widely and reaching only the already-connected.",
    reflection: "Who would not see themselves in this invitation?",
  },
  {
    id: 7,
    verb: "Host",
    phase: "culmination",
    purpose: "Facilitate meaningful encounters.",
    tasks: [
      "Welcome every arrival by name where you can",
      "Hold the frame, then get out of the way",
      "Watch for who is standing alone",
    ],
    trap: "Managing the event instead of hosting the people.",
    reflection: "What happened that you did not plan?",
  },
  {
    id: 8,
    verb: "Harvest",
    phase: "culmination",
    purpose: "Capture stories and learning.",
    tasks: [
      "Collect stories while they are still warm",
      "Ask what changed, not what people thought of it",
      "Record what you would do differently",
    ],
    trap: "Measuring attendance and calling it impact.",
    reflection: "Which story tells you most about what actually happened?",
  },
  {
    id: 9,
    verb: "Grow",
    phase: "culmination",
    purpose: "Sustain the web of trust.",
    tasks: [
      "Decide what continues without you",
      "Introduce people who should know each other",
      "Share what you learned with the next pocket",
    ],
    trap: "Letting the energy end with the event.",
    reflection: "What will still be true here in a year?",
  },
];

/** Per-variation copy and task swaps. Kept in one object per spec §5.
 *  OPEN: real swaps come from manuals B and C. */
export const VARIATION_OVERRIDES: Record<
  Variation,
  Partial<Record<number, Partial<Pick<StepSeed, "purpose" | "tasks">>>>
> = {
  communities: {
    4: {
      tasks: [
        "List who already holds trust in this place",
        "Approach a funder who believes trust is worth investing in",
        "Agree what each partner brings",
      ],
    },
  },
  organisations: {
    1: { purpose: "Discover the need inside the organisation." },
    3: { purpose: "Clarify purpose and vision with the organisation." },
    4: {
      tasks: [
        "List who already holds trust across the organisation",
        "Brief internal sponsors",
        "Agree what each team brings",
      ],
    },
  },
};

export function stepsFor(variation: Variation): StepSeed[] {
  const overrides = VARIATION_OVERRIDES[variation];
  return STEPS.map((s) => ({ ...s, ...(overrides[s.id] ?? {}) }));
}

export function statusOf(checked: number, total: number): StepStatus {
  if (total === 0 || checked === 0) return "not_started";
  return checked >= total ? "done" : "in_progress";
}
