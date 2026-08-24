/**
 * The nine steps.
 *
 * Content is the real step copy from manual A2 — purposes, tasks, traps,
 * readiness notes and reflections. Tasks are editable defaults, not fixed.
 *
 * Per-variation task swaps (Communities vs Organisations) are still OPEN in
 * A2. Until they are written, both variations share this generic set and the
 * toggle drives only the copy the build prompt already marked (steps 1 and 3).
 */

export type Phase = "orientation" | "doing" | "culmination";
export type Variation = "communities" | "organisations";
export type StepStatus = "not_started" | "in_progress" | "done";

/**
 * Phase colours, confirmed by A2 and the Developer Briefing (§5, "Colour marks
 * phase, not step").
 *
 * Colour groups the nine steps into three phases of three. A step never gets
 * its own colour; both sources are explicit that doing so breaks the system.
 *
 * Why these differ from the site's palette: `globals.css` is sampled from the
 * shape artwork, which uses eight colours across the grid. That is an event
 * *composition* — "each festival may compose its own arrangement of the nine
 * forms" — not the phase system. The two are meant to differ.
 */
export const PHASES: Record<Phase, { label: string; color: string }> = {
  orientation: { label: "Orientation", color: "#E9C60F" },
  doing: { label: "Doing", color: "#F0921E" },
  culmination: { label: "Culmination", color: "#E6197F" },
};

/** Deep indigo — the wordmark and primary text on light (Developer Briefing §5). */
export const INK = "#3B3F8F";

/**
 * Colour per step mark, taken from the poster grid.
 *
 * Sampled from branding/website/shapes.png — the designer's own web export, so
 * sRGB with no conversion guesswork. Grid cell position is step number, so
 * cell 1 (four circles) is Listen and cell 9 (the pentagon) is Grow.
 *
 * Nine forms, eight colours: Align and Connect share the yellow, Listen and
 * Grow share the pink. Gather carries two teals within one form, so it is the
 * one mark that needs a second value.
 *
 * Phase is still carried — by the label and the progress gradient — but the
 * marks read as the poster does.
 */
export const STEP_COLORS: Record<number, string> = {
  1: "#f8b3a7", // Listen — four circles
  2: "#338fad", // Gather — quarter discs
  3: "#fbac18", // Align — two half discs
  4: "#fbac18", // Connect — two triangles
  5: "#077c4c", // Design — the centre star
  6: "#6e5889", // Invite — the turned square
  7: "#4e4c9b", // Host — the square
  8: "#ee364f", // Harvest — the circle
  9: "#f8b3a7", // Grow — the pentagon
};

/** Gather's semicircle is a second, greyer teal in the artwork. */
export const STEP_COLOR_ALT: Record<number, string> = { 2: "#4f8daa" };

export type StepSeed = {
  id: number;
  verb: string;
  phase: Phase;
  purpose: string;
  /** Optional to display; the standard the step is aiming at. */
  whatGoodLooksLike: string;
  tasks: string[];
  trap: string;
  /**
   * Only steps 1 and 2 carry one. It is not a task and not a separate step —
   * A2 asks for a quiet aside.
   */
  readiness?: string;
  reflection: string;
};

export const STEPS: StepSeed[] = [
  {
    id: 1,
    verb: "Listen",
    phase: "orientation",
    purpose:
      "Discover the need. Find out what trust looks like, and where it is thin, in this specific place, before planning anything.",
    whatGoodLooksLike:
      "You can describe the community in its own words, not yours. You know who is gathering and what holds them together. You have heard, from real people, where trust already lives and where it strains.",
    tasks: [
      "Have unhurried conversations with people in the community",
      "Ask how trust grows here, who people rely on, what is missing",
      "Name who is gathering, and what holds them together",
      "Listen for the pockets of trust that already exist",
      "Resist pitching a festival, you are learning, not recruiting",
    ],
    trap: "Arriving with the answer. If you already know what the festival will be before you have listened, you have skipped the step. Listening that only confirms your plan is not listening.",
    readiness:
      "This step also tests you. Can you sit with a community's account without correcting it. If listening feels like a delay before the real work, pause. The listening is the real work.",
    reflection: "What surprised you about how trust lives here?",
  },
  {
    id: 2,
    verb: "Gather",
    phase: "orientation",
    purpose:
      "Form the core group. Bring together a small, diverse group who will steward the festival. Stewards, not staff.",
    whatGoodLooksLike:
      "A handful of people who care, from different backgrounds, generations, and vantage points. They own the festival together. No single person carries it alone.",
    tasks: [
      "Invite people whose presence widens the group's view, not just its workload",
      "Seek difference: someone who knows the elders, someone who knows the young",
      "Include at least one person from outside your usual circle",
      "Agree how you will work together before you agree what to do",
    ],
    trap: "Gathering people who agree with you and are easy to work with. A core group that shares one perspective will design a festival for people like themselves.",
    readiness:
      "Here you learn what you carry and what others must. If you cannot let others shape the festival, notice that now, while it is still small.",
    reflection: "Whose perspective is still missing from this group?",
  },
  {
    id: 3,
    verb: "Align",
    phase: "orientation",
    purpose:
      "Clarify purpose and vision. Agree why here, why now, and what people should carry home. This becomes the test for every later choice.",
    whatGoodLooksLike:
      "The core group can say, in a sentence or two, why this festival exists and what it hopes people leave with. When a later decision is hard, you return to this and it helps.",
    tasks: [
      "Answer together: why are we doing this",
      "Answer together: who do we hope will come",
      "Answer together: what do we want people to carry home",
      "Write the purpose plainly and keep it where the group can see it",
    ],
    trap: 'A purpose so broad it decides nothing. "Bring people together" is true of every event. Push until the purpose is specific enough to rule some things out.',
    reflection: "Does our purpose help us say no to something?",
  },
  {
    id: 4,
    verb: "Connect",
    phase: "doing",
    purpose:
      "Build partnerships. Invite organisations, schools, artists, businesses, and local leaders to strengthen the social fabric with you.",
    whatGoodLooksLike:
      "You have partners, not sponsors. People and groups who see the festival as theirs too, who contribute more than money: space, reach, trust, hands.",
    tasks: [
      "List organisations, schools, artists, businesses, local leaders",
      "Approach each with an invitation to build, not a request to fund",
      "Be clear about the shared aim",
      "Let partners shape their own contribution",
    ],
    trap: "Treating partnership as fundraising. The moment the conversation is only about money, you have lost the point. Partners join the work; sponsors buy a logo.",
    reflection: "Who did we invite to give, when we should have invited them to join?",
  },
  {
    id: 5,
    verb: "Design",
    phase: "doing",
    purpose:
      "Shape the festival journey. Choose the movements, formats, and artistic elements that carry people from experience to their own sense of agency.",
    whatGoodLooksLike:
      "A day that moves. Not a stack of sessions, but a sequence that deepens: people arrive as strangers and leave having met. The design fits this community, tuned to it, not copied from elsewhere.",
    tasks: [
      "Work with the five movements as the spine",
      "Set the four pillars for this community using the dials",
      "Start from a named preset if this is your first time",
      "Choose formats, conversations, and art that serve the movements",
      "Leave empty space: a shared meal, an unhurried conversation",
    ],
    trap: "Designing a programme instead of a journey. A good festival is not a full timetable. Empty space, a shared meal, an unhurried conversation often do more than another session.",
    reflection: "Where in the day does a stranger first feel they belong?",
  },
  {
    id: 6,
    verb: "Invite",
    phase: "doing",
    purpose:
      "Bring the community together. Reach people personally first, publicly second. Aim to gather people who would not usually meet.",
    whatGoodLooksLike:
      "The room holds a mix that does not happen by accident. People came because someone they trust asked them, not because they saw a poster.",
    tasks: [
      "Make personal invitations the core of your outreach",
      "Ask partners and the core group to invite people directly",
      "Use public reach to widen, not replace, the personal ask",
      "Notice who is not coming, and go to them",
    ],
    trap: "Relying on marketing. People rarely join a conversation about trust because of an advert. They come because they were asked, by name, by someone who matters to them.",
    reflection: "Who in the room would surprise the rest of the room?",
  },
  {
    id: 7,
    verb: "Host",
    phase: "culmination",
    purpose:
      "Facilitate meaningful encounters. Hold the space so that trust can grow. Do not control the outcome.",
    whatGoodLooksLike:
      "People relax. Strangers talk. The team is present but not central. The day belongs to the participants, and the hosts make that possible without making it about themselves.",
    tasks: [
      "Attend to welcome, hospitality, facilitation, inclusion, reflection",
      "Prepare facilitators well",
      "Watch the room and adjust",
      "Protect the quiet moments as carefully as the loud ones",
    ],
    trap: "Over-programming the day out of nervousness. Silence and open space feel risky to a host and often feel rich to a participant. Trust the room.",
    reflection: "What happened that we did not plan, and was better for it?",
  },
  {
    id: 8,
    verb: "Harvest",
    phase: "culmination",
    purpose: "Capture stories and learning. Turn one day into shared community knowledge.",
    whatGoodLooksLike:
      "The festival leaves a trace. Stories told, relationships named, commitments made, ideas surfaced. Not a report filed and forgotten, but something the community can hold and use.",
    tasks: [
      "Gather stories, insights, relationships formed, commitments made",
      "Capture with consent and care, never by extraction",
      "Let people say what mattered to them",
      "Keep it in a form the community owns, not only the organisers",
    ],
    trap: "Measuring the wrong thing. Attendance and satisfaction are easy to count and say little about trust. Look instead for what people intend to carry on.",
    reflection: "What did the community learn about itself today?",
  },
  {
    id: 9,
    verb: "Grow",
    phase: "culmination",
    purpose:
      "Sustain the web. Support participants to keep going, start their own initiatives, and become organisers themselves.",
    whatGoodLooksLike:
      "The festival was a beginning. Conversations continue. New pockets of trust form. Some participants become the next organisers. The web is denser than it was.",
    tasks: [
      "Before people leave, open a path to what comes next",
      "Offer further conversations, learning circles, small initiatives, future gatherings",
      "Stay in light contact",
      "Connect this festival's web to others",
      "Hand the work onward rather than holding it",
    ],
    trap: "Treating the festival as the finish line. If everything ends when the room empties, the pockets stay scattered. The threads form only if someone tends them after.",
    reflection: "What is now possible here that was not possible before?",
  },
];

/**
 * Per-variation copy. A2 leaves the task swaps OPEN, so both variations share
 * the generic task set and only the copy the build prompt marked changes here.
 */
export const VARIATION_OVERRIDES: Record<
  Variation,
  Partial<Record<number, Partial<Pick<StepSeed, "purpose" | "tasks">>>>
> = {
  communities: {},
  organisations: {
    1: {
      purpose:
        "Discover the need. Find out what trust looks like, and where it is thin, inside this specific organisation, before planning anything.",
    },
    3: {
      purpose:
        "Clarify purpose and vision. Agree why this organisation, why now, and what people should carry back to their work. This becomes the test for every later choice.",
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

/** Accent colours from the brand palette, one per domain. */
export const DOMAIN_ACCENTS = [
  "bg-pink",
  "bg-teal",
  "bg-yellow",
  "bg-green",
  "bg-purple",
  "bg-indigo",
  "bg-red",
  "bg-pink",
  "bg-teal",
] as const;
