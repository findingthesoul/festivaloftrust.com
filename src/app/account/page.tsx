import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import { card } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import { SignOut } from "./sign-out";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await standing();
  if (s.state === "signed-out") redirect("/sign-in?next=/account");
  if (s.state === "no-application") redirect("/apply");

  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("organiser")
    .select("full_name, organisation, phone, address")
    .eq("id", s.organiser.id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-10 sm:py-14">
      <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Your profile
      </h1>
      <p className="text-ink/60 mt-2 text-sm">{s.organiser.email}</p>

      <section className={`${card} mt-8 p-5 sm:p-7`}>
        <ProfileForm
          profile={
            (data as {
              full_name: string | null;
              organisation: string | null;
              phone: string | null;
              address: string | null;
            } | null) ?? {
              full_name: s.organiser.full_name,
              organisation: s.organiser.organisation,
              phone: null,
              address: null,
            }
          }
        />
      </section>

      <section className={`${card} mt-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7`}>
        <div>
          <h2 className="font-bold">Signed in on this device</h2>
          {/* Said plainly, because the email is how you get back in and people
              sign up with one address and look for the link in another. */}
          <p className="text-ink/60 mt-1 text-sm">
            Signing in again always sends a code to {s.organiser.email}.
          </p>
        </div>
        <SignOut />
      </section>
    </main>
  );
}
