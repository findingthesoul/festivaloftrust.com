import type { Metadata } from "next";
import { agendaFor } from "@/lib/festivals";
import { listThreadTemplates, type FibreThreadTemplate } from "@/lib/fibre";
import { FestivalHeader } from "../festival-header";
import { festivalFor } from "../guard";
import { Agenda } from "../settings/agenda";
import { EventSettings } from "../settings/event-settings";
import { CoverUpload } from "../settings/cover-upload";
import { LogoPicker } from "../settings/logo-picker";
import { card } from "@/components/ui";
import { allLogos, logoSvg } from "@/lib/logos";

/**
 * The public page's own tab: the words it shows, the programme, the cover
 * photo and the logo. Settings keeps the event itself; this keeps how it
 * reads. The form component is shared with Settings — one form, two rooms —
 * so a save from either side always carries every field.
 */

export const metadata: Metadata = { title: "Webpage", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker, { organiserOnly: true });

  const agenda = await agendaFor(festival.id);
  // Fails soft: without the 0018 migration there simply is no logo card data.
  const logos = await allLogos().catch(() => []);

  // The structure choice lives in the form's hidden event half, so the same
  // fetch as Settings — see that page for why it never throws.
  let templates: FibreThreadTemplate[] = [];
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
      <FestivalHeader festival={festival} access={access} active="webpage" />

      <div className="mt-8 space-y-6">
        <section className={`${card} p-5 sm:p-7`}>
          <EventSettings
            festival={festival}
            templates={templates}
            templatesProblem={templatesProblem}
            part="webpage"
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
          <LogoPicker
            marker={marker}
            current={(() => {
              const mine = logos.find((l) => l.claimed_by === festival.id);
              return mine
                ? { id: mine.id, html: logoSvg(mine.form, "curlogo") }
                : null;
            })()}
            available={logos
              .filter((l) => !l.claimed_by)
              .map((l, i) => ({ id: l.id, html: logoSvg(l.form, `avlogo${i}`) }))}
          />
        </section>
      </div>
    </main>
  );
}
