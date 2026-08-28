import { notFound, redirect } from "next/navigation";
import { accessTo, festivalByMarker, type Access, type Festival } from "@/lib/festivals";
import { currentUser } from "@/lib/supabase/server";

/**
 * The same four checks every tab needs, in one place.
 *
 * Written once because five pages repeating an authorisation dance is five
 * chances to get it subtly different. RLS decides what is visible; this decides
 * what the tab does about it.
 */
export async function festivalFor(
  marker: string,
  opts: { organiserOnly?: boolean; moneyOnly?: boolean } = {},
): Promise<{ festival: Festival; access: Access }> {
  if (!(await currentUser())) redirect(`/sign-in?next=/plan/${marker}`);

  const festival = await festivalByMarker(marker);
  if (!festival) notFound();

  const access = await accessTo(festival);
  if (!access) {
    // Live but not theirs is not missing — it is the public page.
    if (festival.status === "live") redirect(`/${marker}`);
    notFound();
  }
  if (opts.organiserOnly && access.role !== "organiser") notFound();
  if (opts.moneyOnly && !access.canSeeMoney) notFound();

  return { festival, access };
}
