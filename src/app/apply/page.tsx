import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { standing } from "@/lib/organiser";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "Apply", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await standing();
  if (s.state === "signed-out") redirect("/sign-in?next=/apply");
  // Already applied, whatever the answer was — /festivals says where they stand.
  if (s.state !== "no-application") redirect("/festivals");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Tell us about you
      </h1>
      <p className="mt-6 max-w-xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        Every festival is organised by the community itself. Before you start
        planning one, we would like to know who you are and where you are.
      </p>
      <ApplyForm />
    </main>
  );
}
