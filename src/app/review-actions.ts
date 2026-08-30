"use server";

import { listFestivals, registrations } from "@/lib/festivals";

/**
 * What waits for this organiser: applications on their own festivals still
 * needing a decision. Counted when the account menu opens rather than on
 * every page render — the platform round-trips are only paid when someone
 * actually looks.
 */
export async function countAwaitingVisitors(): Promise<{
  count: number;
  href: string;
}> {
  const mine = await listFestivals();
  const withPages = mine.filter((f) => f.thread_id);
  const counts = await Promise.all(
    withPages.map(async (f) => {
      const rows = await registrations(f);
      return { marker: f.marker, waiting: rows.filter((r) => r.awaiting_approval).length };
    }),
  );
  const total = counts.reduce((a, c) => a + c.waiting, 0);
  const busy = counts.filter((c) => c.waiting > 0);
  return {
    count: total,
    href:
      busy.length === 1
        ? `/plan/${busy[0].marker}/registrations`
        : "/festivals",
  };
}
