/**
 * The shape of the work: nine domains, three tiers, two settings.
 *
 * These constants mirror the ones inside the standalone planner tool
 * (src/assets/planner.fragment.html). That file is a drop-in export we do not
 * edit, so the values are duplicated rather than shared. If the tool's rates
 * change, change them here too — see docs/fibre-integration.md.
 */

export type Setting = "social" | "organisation";

export const DOMAINS = [
  {
    key: "listen",
    name: "Listen",
    description: "Conversations, four of two hours",
    hours: [8, 8, 10],
  },
  {
    key: "gather",
    name: "Gather",
    description: "Forming the core group",
    hours: [4, 4, 6],
  },
  {
    key: "align",
    name: "Align",
    description: "Identifying the four elements together",
    hours: [4, 4, 6],
  },
  {
    key: "connect",
    name: "Connect",
    description: "Accompanying the core group to build partnerships",
    hours: [4, 6, 8],
  },
  {
    key: "design",
    name: "Design",
    description: "Designing the festival",
    hours: [8, 12, 16],
  },
  {
    key: "invite",
    name: "Invite",
    description: "Accompaniment during the invitation",
    hours: [2, 4, 6],
  },
  {
    key: "host",
    name: "Host",
    description: "Hosting the festival",
    hours: [8, 12, 20],
  },
  {
    key: "harvest",
    name: "Harvest",
    description: "Harvesting",
    hours: [4, 6, 8],
  },
  {
    key: "grow",
    name: "Grow",
    description: "Consolidating, presenting, next steps",
    hours: [4, 4, 6],
  },
] as const;

export const TIERS = [
  { max: 60, name: "Minimum", range: "25 to 60", hours: 46 },
  { max: 150, name: "Larger social", range: "61 to 150", hours: 60 },
  { max: 500, name: "Bigger social", range: "151 to 500", hours: 86 },
] as const;

export const RATES: Record<Setting, { hourly: number; kitPerPerson: number; kitMinimum: number }> = {
  social: { hourly: 100, kitPerPerson: 25, kitMinimum: 1000 },
  organisation: { hourly: 150, kitPerPerson: 50, kitMinimum: 2500 },
};

export const TRAINING = { hours: 16, perPerson: 250 };

export function tierIndex(visitors: number): 0 | 1 | 2 {
  return visitors <= 60 ? 0 : visitors <= 150 ? 1 : 2;
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
