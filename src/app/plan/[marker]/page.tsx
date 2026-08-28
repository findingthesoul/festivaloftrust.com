import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectionStatus, findRun } from "../actions";
import { ConnectionBanner } from "../connection-banner";
import { FibrePlanner } from "../fibre-planner";
import { TenthArea } from "../tenth-area";
import { accessTo, festivalByMarker } from "@/lib/festivals";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "The planner",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;

  if (!(await currentUser())) redirect(`/sign-in?next=/plan/${marker}`);

  // RLS decides this, not the URL: a marker belonging to someone else returns
  // nothing, and is indistinguishable from one that does not exist.
  const festival = await festivalByMarker(marker);
  if (!festival) notFound();

  // Organiser or host. A host helps run the festival and does not see the
  // money, so the tenth area is theirs only if they own the commercial side.
  const access = await accessTo(festival);
  if (!access) notFound();

  const connection = await connectionStatus();
  // The run is found by the festival's own id, never by its marker — the marker
  // can change, the identity cannot.
  const run = await findRun(festival.id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <Link
        href="/festivals"
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← Your festivals
      </Link>

      <div className="mt-6">
        {run ? (
          <FibrePlanner run={run} />
        ) : (
          <div className="py-16">
            <h1 className="text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.02em]">
              {festival.name}
            </h1>
            <p className="text-ink/70 mt-4 max-w-xl leading-relaxed text-pretty">
              This festival has no plan behind it yet. That happens when the
              platform could not be reached at the moment it was created.
            </p>
          </div>
        )}
      </div>

      {access.canSeeMoney && <TenthArea />}
      <ConnectionBanner connection={connection} hasRun={!!run} />
    </main>
  );
}
