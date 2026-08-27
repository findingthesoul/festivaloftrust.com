/**
 * Markers: the public address of a festival, festivaloftrust.com/[marker].
 *
 * An address, not an identity. A festival keeps its id when its marker changes,
 * so a rename never creates a second run.
 */

/** Paths the app already serves; a marker may not shadow one. */
const RESERVED = new Set([
  "about",
  "api",
  "contact",
  "for-organisations",
  "for-society",
  "funding",
  "icon.svg",
  "join",
  "plan",
  "planner",
  "robots.txt",
  "sitemap.xml",
  "upcoming",
]);

const VALID = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;

/** Lowercase, strip accents, keep letters and digits, single hyphens. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function isValidMarker(marker: string): boolean {
  return VALID.test(marker) && !RESERVED.has(marker);
}

/**
 * Suggestions for a festival name, best first, excluding any already taken.
 *
 * The name usually carries the place — "Festival of Trust — Cape Town" — so the
 * bare place is the first suggestion and the year disambiguates a second
 * festival there. A full date is deliberately not offered: it reads badly as an
 * address and strands the marker if the day moves.
 */
export function suggestMarkers(
  name: string,
  taken: Iterable<string> = [],
  year: number | undefined = undefined,
): string[] {
  const takenSet = new Set(taken);
  const base = slugify(name.replace(/^festival of trust\s*[—–-]?\s*/i, "")) || slugify(name);
  if (!base) return [];

  const candidates = [base];
  if (year) candidates.push(`${base}-${year}`);
  candidates.push(`${base}-2`, `${base}-3`);

  const out: string[] = [];
  for (const c of candidates) {
    if (out.length >= 3) break;
    if (isValidMarker(c) && !takenSet.has(c) && !out.includes(c)) out.push(c);
  }
  return out;
}
