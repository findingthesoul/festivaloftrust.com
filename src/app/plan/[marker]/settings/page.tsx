import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collaborators } from "@/lib/festivals";
import { listThreadTemplates, type FibreThreadTemplate } from "@/lib/fibre";
import { currentUser } from "@/lib/supabase/server";
import { FestivalHeader } from "../festival-header";
import { festivalFor } from "../guard";
import { Collaborators } from "./collaborators";
import { EventSettings } from "./event-settings";
import { card } from "@/components/ui";
import { DeleteFestival } from "./delete-festival";
import { PublishControls } from "../publish/publish-controls";

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

  // One guard, then every question at once — the templates ask The Fibre,
  // which must never serialise behind the local reads.
  const templatesFetch = (async (): Promise<{
    templates: FibreThreadTemplate[];
    templatesProblem: string | null;
  }> => {
    if (!process.env.FIBRE_APP_KEY) {
      return { templates: [], templatesProblem: "not connected to The Fibre" };
    }
    try {
      const templates = (await listThreadTemplates()).templates;
      return {
        templates,
        templatesProblem:
          templates.length === 0 ? "no structures in this workspace yet" : null,
      };
    } catch {
      return { templates: [], templatesProblem: "could not reach The Fibre just now" };
    }
  })();
  const [{ members, invites }, user, tpl] = await Promise.all([
    collaborators(festival.id),
    currentUser(),
    templatesFetch,
  ]);
  if (!user) notFound();
  const { templates, templatesProblem } = tpl;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="settings" />

      <div className="mt-8 space-y-6">
        {/* The biggest switch first: whether the festival is public at all. */}
        <section className={`${card} p-5 sm:p-7`}>
          <PublishControls marker={marker} status={festival.status} />
        </section>
        <section className={`${card} p-5 sm:p-7`}>
          <EventSettings
            festival={festival}
            templates={templates}
            templatesProblem={templatesProblem}
            part="event"
          />
        </section>
        <section className={`${card} p-5 sm:p-7`}>
          <Collaborators
            marker={marker}
            members={members}
            invites={invites}
            meId={user.id}
          />
        </section>
        <section className={`${card} border-red/30 p-5 sm:p-7`}>
          <DeleteFestival marker={marker} isLive={festival.status === "live"} />
        </section>
      </div>
    </main>
  );
}
