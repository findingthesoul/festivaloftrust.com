import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collaborators } from "@/lib/festivals";
import { currentUser } from "@/lib/supabase/server";
import { FestivalHeader } from "../festival-header";
import { festivalFor } from "../guard";
import { Collaborators } from "./collaborators";
import { EventSettings } from "./event-settings";
import { CoverUpload } from "./cover-upload";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  // A host helps run the festival; they do not administer it.
  const { festival, access } = await festivalFor(marker, { organiserOnly: true });

  const { members, invites } = await collaborators(festival.id);
  // Who "you" is in the collaborator list. festivalFor has already proved a
  // signed-in organiser, so this is narrowing rather than a real check — but
  // a non-null assertion here would outlive the reason for it.
  const user = await currentUser();
  if (!user) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="settings" />

      <div className="mt-10 space-y-14">
        <EventSettings festival={festival} />
        <CoverUpload festivalId={festival.id} current={festival.cover_url} />
        <Collaborators
          marker={marker}
          members={members}
          invites={invites}
          meId={user.id}
        />
      </div>
    </main>
  );
}
