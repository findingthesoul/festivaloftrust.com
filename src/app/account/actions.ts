"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import { linkOrganiser } from "@/lib/contact-graph";

/**
 * Your own details.
 *
 * Name and organisation go to The Fibre as well, because the organiser is a
 * person in the contact graph and a person who renamed themselves here and not
 * there is two people. Phone and address stay local — the platform's link
 * route accepts email, name and domain and nothing else, which is gap 1 in
 * docs/brief-contacts-from-apps.md.
 */
export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "not signed in" };

  const text = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const fullName = text("full_name");
  if (!fullName) return { error: "please give your name" };

  const { error } = await supabase
    .from("organiser")
    .update({
      full_name: fullName,
      organisation: text("organisation"),
      phone: text("phone"),
      address: text("address"),
    })
    .eq("id", auth.user.id);
  if (error) return { error: error.message };

  // Quiet on purpose: a rename should not fail because the platform was
  // briefly unreachable, and the next save tries again.
  await linkOrganiser({
    userId: auth.user.id,
    email: auth.user.email ?? "",
    name: fullName,
  });

  revalidatePath("/account");
  return {};
}
