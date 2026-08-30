import { currentUser, serverSupabase } from "@/lib/supabase/server";
import { BackendNav } from "./BackendNav";
import { NavSwitch } from "./Chrome";
import { PublicNav } from "./PublicNav";

/**
 * One navigation for everyone. Signed in, the JOIN or SIGN IN seat becomes
 * the account control — the way to your festivals, your profile and the way
 * out lives in its menu.
 *
 * Two shapes of it: the website's bar on the website, and on the pages behind
 * a sign-in the account control alone. Which one is NavSwitch's call, from the
 * path. The session and the admin's count are looked up once here and given to
 * both, so the choice costs nothing.
 */
export async function SiteNav() {
  const user = await currentUser();

  // The admin's inbox, counted for the badge: organisers waiting for
  // approval plus festivals submitted for review. Nobody else pays the
  // queries, and nobody else sees the item.
  let reviewCount: number | null = null;
  if (user) {
    const supabase = await serverSupabase();
    const { data: me } = await supabase
      .from("organiser")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if ((me as { is_admin: boolean } | null)?.is_admin) {
      const [organisers, festivals] = await Promise.all([
        supabase
          .from("organiser")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("festival")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted"),
      ]);
      reviewCount = (organisers.count ?? 0) + (festivals.count ?? 0);
    }
  }

  const email = user?.email ?? null;
  const canReviewVisitors = !!user && reviewCount === null;

  return (
    <NavSwitch
      publicNav={
        <PublicNav
          email={email}
          reviewCount={reviewCount}
          canReviewVisitors={canReviewVisitors}
        />
      }
      backendNav={
        <BackendNav
          email={email}
          reviewCount={reviewCount}
          canReviewVisitors={canReviewVisitors}
        />
      }
    />
  );
}
