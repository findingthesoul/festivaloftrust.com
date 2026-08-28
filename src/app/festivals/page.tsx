import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listFestivals } from "@/lib/festivals";
import { claimInvites, standing } from "@/lib/organiser";
import { FestivalCard } from "./festival-card";
import { NewFestivalDialog } from "./new-festival-dialog";

export const metadata: Metadata = {
  title: "Your festivals",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await standing();
  if (s.state === "signed-out") redirect("/sign-in?next=/festivals");
  if (s.state === "no-application") redirect("/apply");

  if (s.state === "pending" || s.state === "declined") {
    const declined = s.state === "declined";
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
        <h1 className="text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          {declined ? "Not this time" : "With us for review"}
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
          {declined
            ? "We are not able to take this forward at the moment."
            : "Someone reads every application by hand. This is a movement built on trust, so we would rather meet you than let a form decide. You will hear from us by email."}
        </p>
        {s.organiser.review_note && (
          <p className="border-ink/20 mt-8 max-w-xl border-l-2 pl-4 leading-relaxed text-pretty italic">
            {s.organiser.review_note}
          </p>
        )}
      </main>
    );
  }

  // Approved. Any invitation waiting for this address becomes a membership now.
  await claimInvites();
  const festivals = await listFestivals();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
            Festivals
          </h1>
          <p className="text-ink/60 mt-2 text-sm">
            {festivals.length
              ? `${festivals.length} festival${festivals.length === 1 ? "" : "s"}`
              : "Nothing here yet."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {s.organiser.is_admin && (
            <Link
              href="/admin"
              className="text-sm underline decoration-2 underline-offset-4 hover:opacity-70"
            >
              Review
            </Link>
          )}
          <NewFestivalDialog />
        </div>
      </div>

      {festivals.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {festivals.map((f) => (
            <FestivalCard key={f.id} festival={f} />
          ))}
        </div>
      ) : (
        <p className="text-ink/70 mt-10 max-w-xl leading-relaxed text-pretty">
          A festival begins as a draft. You can plan the whole thing before
          anyone else sees it.
        </p>
      )}
    </main>
  );
}
