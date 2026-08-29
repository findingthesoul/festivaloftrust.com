import { currentUser } from "@/lib/supabase/server";
import { PublicNav } from "./PublicNav";
import { SignedInNav } from "./SignedInNav";

/**
 * Two navigations, not one with extra items.
 *
 * A signed-out visitor is reading about the movement, so they get the whole
 * site. A signed-in organiser is working on their festival, so the marketing
 * pages are noise — they get their festivals and their account, and the public
 * site is still reachable through the wordmark.
 */
export async function SiteNav() {
  const user = await currentUser();

  if (user) return <SignedInNav email={user.email ?? ""} />;
  return <PublicNav />;
}
