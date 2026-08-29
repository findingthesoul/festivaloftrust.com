/**
 * The nine steps, phase by phase, as the brief tables them: purpose, then
 * relationships, then design, then action, then learning. Colour marks
 * phase, not step — three phases of three, each with its own colour, meant
 * for the ink card where the phase colours carry.
 */

const PHASES = [
  {
    label: "Orientation",
    color: "#E9C60F",
    steps: [
      { n: 1, verb: "Listen", does: "Discover the need." },
      { n: 2, verb: "Gather", does: "Form the core group." },
      { n: 3, verb: "Align", does: "Clarify purpose and vision." },
    ],
  },
  {
    label: "Doing",
    color: "#F0921E",
    steps: [
      { n: 4, verb: "Connect", does: "Build partnerships." },
      { n: 5, verb: "Design", does: "Shape the festival journey." },
      { n: 6, verb: "Invite", does: "Bring the community together." },
    ],
  },
  {
    label: "Culmination",
    color: "#E6197F",
    steps: [
      { n: 7, verb: "Host", does: "Facilitate meaningful encounters." },
      { n: 8, verb: "Harvest", does: "Capture stories and learning." },
      { n: 9, verb: "Grow", does: "Sustain the web of trust." },
    ],
  },
];

export function NineSteps() {
  return (
    <div className="mt-2 grid gap-x-10 gap-y-8 sm:grid-cols-3">
      {PHASES.map((phase) => (
        <div key={phase.label}>
          <p
            className="text-sm font-bold tracking-[0.18em] uppercase"
            style={{ color: phase.color }}
          >
            {phase.label}
          </p>
          <ul className="mt-4 space-y-4">
            {phase.steps.map((step) => (
              <li key={step.n}>
                <p className="font-bold">
                  <span className="opacity-50">{step.n}&ensp;</span>
                  {step.verb}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed opacity-80">
                  {step.does}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
