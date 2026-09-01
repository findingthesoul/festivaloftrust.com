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
import { photosFor } from "@/lib/photos";

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
  const [agenda, logos, photos, tpl] = await Promise.all([
    agendaFor(festival.id),
    allLogos().catch(() => []),
    photosFor(festival.id).catch(() => []),
    templatesFetch,
  ]);
  const { templates, templatesProblem } = tpl;

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
          <CoverUpload
            festivalId={festival.id}
            current={festival.cover_url}
            coverPhoto={
              photos.find((p) => p.url === festival.cover_url) ?? null
            }
          />
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
