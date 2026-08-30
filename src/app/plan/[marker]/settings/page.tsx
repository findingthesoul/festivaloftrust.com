import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { agendaFor, collaborators } from "@/lib/festivals";
import { listThreadTemplates, type FibreThreadTemplate } from "@/lib/fibre";
import { currentUser } from "@/lib/supabase/server";
import { FestivalHeader } from "../festival-header";
import { festivalFor } from "../guard";
import { Agenda } from "./agenda";
import { Collaborators } from "./collaborators";
import { EventSettings } from "./event-settings";
import { card } from "@/components/ui";
import { CoverUpload } from "./cover-upload";
import { DeleteFestival } from "./delete-festival";

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
  const agenda = await agendaFor(festival.id);
  // Who "you" is in the collaborator list. festivalFor has already proved a
  // signed-in organiser, so this is narrowing rather than a real check — but
  // a non-null assertion here would outlive the reason for it.
  const user = await currentUser();
  if (!user) notFound();

  // The structures a festival can be built from.
  //
  // Fetched whether or not the festival is published. It is only CHOOSABLE
  // before publishing — a template seeds a thread's items when the page is
  // created, so applying one later would duplicate them — but a published
  // festival should still say what it was built from rather than showing an
  // absent field and no reason for it.
  //
  // Never fatal: if Fibre is unreachable or unconfigured the settings screen
  // still has to open. An empty list simply means no choice is shown.
  let templates: FibreThreadTemplate[] = [];
  // Why the list is empty matters. "None exist" and "we could not ask" look
  // identical to an organiser staring at a missing field, and the second is
  // usually a key pointed at the wrong workspace.
  let templatesProblem: string | null = null;
  if (!process.env.FIBRE_APP_KEY) {
    templatesProblem = "not connected to The Fibre";
  } else {
    try {
      templates = (await listThreadTemplates()).templates;
      if (templates.length === 0) {
        templatesProblem = "no structures in this workspace yet";
      }
    } catch {
      templatesProblem = "could not reach The Fibre just now";
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="settings" />

      <div className="mt-8 space-y-6">
        <section className={`${card} p-5 sm:p-7`}>
          <EventSettings
            festival={festival}
            templates={templates}
            templatesProblem={templatesProblem}
          />
        </section>
        <section className={`${card} p-5 sm:p-7`}>
          <Agenda
            marker={marker}
            items={agenda}
            shown={festival.show_public_agenda}
          />
        </section>
        <section className={`${card} p-5 sm:p-7`}>
          <CoverUpload festivalId={festival.id} current={festival.cover_url} />
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
