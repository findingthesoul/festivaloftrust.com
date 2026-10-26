import type { CSSProperties } from "react";

// The nine steps and the colour mark, shared by the server page and the
// client dimmer without pulling the wordmark outlines into the bundle.

export const STEPS = [
  { id: "listen", name: "Listen", line: "Discover the need." },
  { id: "gather", name: "Gather", line: "Form the core group." },
  { id: "align", name: "Align", line: "Clarify purpose and vision." },
  { id: "connect", name: "Connect", line: "Build partnerships." },
  { id: "design", name: "Design", line: "Shape the festival journey." },
  { id: "invite", name: "Invite", line: "Bring the community together." },
  { id: "host", name: "Host", line: "The festival of trust." },
  { id: "harvest", name: "Harvest", line: "Capture stories and learning." },
  { id: "grow", name: "Grow", line: "Sustain the web of trust." },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

/** Each form's colour in the colour mark, from the identity artwork. */
export const COLOUR_MARK = {
  "--listen": "#FBB4A8",
  "--gather": "#348EAC",
  "--align": "#FBAC0F",
  "--connect": "#FBAC0F",
  "--design": "#0C7B4B",
  "--invite": "#6D5687",
  "--host": "#4E4C9F",
  "--harvest": "#FB2F4A",
  "--grow": "#FBB4A8",
} as CSSProperties;
