import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { standing } from "@/lib/organiser";

export const metadata: Metadata = {
  title: "Host a festival",
  description:
    "Request to plan a Festival of Trust in your community or organisation.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  // Anyone already in the flow belongs further along it.
  const s = await standing();
  if (s.state === "no-application") redirect("/apply");
  if (s.state !== "signed-out") redirect("/festivals");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        Host a festival
      </h1>
      <p className="mt-6 max-w-xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        Festivals are organised by the communities themselves. If you would like
        to host one, start by making an account — then tell us who you are and
        where you are.
      </p>

      <Link
        href="/sign-in?next=/apply"
        className="bg-green text-cream mt-10 inline-block px-7 py-3.5 text-lg font-medium transition-opacity hover:opacity-85"
      >
        Get started
      </Link>

      <ol className="text-ink/70 mt-16 space-y-2 border-t border-ink/15 pt-8 text-sm">
        <li>1. Make an account — we email you a code, there is no password.</li>
        <li>2. Tell us about you and where you would host it.</li>
        <li>3. Someone reads it, and we come back to you.</li>
        <li>4. The planner opens, and the nine steps begin.</li>
      </ol>
    </main>
  );
}
