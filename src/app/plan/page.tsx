import { redirect } from "next/navigation";

/**
 * There is no single festival any more. This existed when there was exactly
 * one, addressed by an environment variable; each festival now has its own
 * address, so send anyone arriving here to their list.
 */
export default function Page() {
  redirect("/festivals");
}
