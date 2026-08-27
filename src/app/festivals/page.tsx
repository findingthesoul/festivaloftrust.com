import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listFestivals } from "@/lib/festivals";
import { currentUser } from "@/lib/supabase/server";
import { NewFestivalForm } from "./new-festival-form";

export const metadata: Metadata = {
  title: "Your festivals",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await currentUser())) redirect("/sign-in?next=/festivals");
  const festivals = await listFestivals();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Your festivals
      </h1>

      {festivals.length > 0 && (
        <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
          {festivals.map((f) => (
            <li key={f.id}>
              <Link
                href={`/plan/${f.marker}`}
                className="group flex items-baseline justify-between gap-4 py-5"
              >
                <span>
                  <span className="text-lg font-bold group-hover:underline underline-offset-4">
                    {f.name}
                  </span>
                  <span className="text-ink/50 mt-1 block font-mono text-sm">
                    /{f.marker}
                  </span>
                </span>
                {!f.fibre_run_id && (
                  <span className="text-ink/50 shrink-0 text-sm">plan not started</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14 border-t border-ink/15 pt-10">
        <h2 className="text-2xl font-bold tracking-[-0.02em]">
          {festivals.length ? "Start another" : "Start your first festival"}
        </h2>
        <NewFestivalForm />
      </section>
    </main>
  );
}
