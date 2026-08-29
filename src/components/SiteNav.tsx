import { currentUser } from "@/lib/supabase/server";
import { PublicNav } from "./PublicNav";

/**
 * One navigation for everyone. Signed in, the JOIN or SIGN IN seat becomes
 * the account control — the way to your festivals, your profile and the way
 * out lives in its menu, so no second bar is needed anywhere.
 */
export async function SiteNav() {
  const user = await currentUser();
  return <PublicNav email={user?.email ?? null} />;
}
