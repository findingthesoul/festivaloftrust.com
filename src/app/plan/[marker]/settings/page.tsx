import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { accessTo, collaborators, festivalByMarker } from "@/lib/festivals";
import { currentUser } from "@/lib/supabase/server";
import { Collaborators } from "./collaborators";
import { CoverUpload } from "./cover-upload";
import { SubmitForReview } from "./submit-for-review";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=/plan/${marker}/settings`);

  const festival = await festivalByMarker(marker);
  if (!festival) notFound();

  const access = await accessTo(festival);
  // A host helps run the festival; they do not administer it.
  if (access?.role !== "organiser") notFound();

  const { members, invites } = await collaborators(festival.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <Link
        href={`/plan/${marker}`}
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← {festival.name}
      </Link>

      <h1 className="mt-6 text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Settings
      </h1>

      <div className="mt-12 space-y-14">
        <CoverUpload festivalId={festival.id} current={festival.cover_url} />
        <Collaborators
          marker={marker}
          members={members}
          invites={invites}
          meId={user.id}
        />
        <SubmitForReview marker={marker} status={festival.status} />
      </div>
    </main>
  );
}
