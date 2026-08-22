import type { Metadata } from "next";
import { JoinForm } from "./form";

export const metadata: Metadata = {
  title: "Host a festival",
  description:
    "Request access to plan a Festival of Trust in your community or organisation.",
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        Host a festival
      </h1>
      <p className="mt-6 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        Tell us who you are and where you would host it. Every request is read
        by a person before the planner opens to you.
      </p>

      <JoinForm />

      <ol className="text-ink/70 mt-16 space-y-2 border-t border-ink/15 pt-8 text-sm">
        <li>1. You request access.</li>
        <li>2. We read it and approve.</li>
        <li>3. You settle the contribution.</li>
        <li>4. The planner opens, and the nine domains begin.</li>
      </ol>
    </main>
  );
}
