import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { registrationOpensAt } from "@/lib/festivals";
import { FestivalHeader } from "../festival-header";
import { PublishControls } from "./publish-controls";
import { RegistrationControls } from "./registration-controls";
import { card } from "@/components/ui";

export const metadata: Metadata = { title: "Publish", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker, { organiserOnly: true });
  const opensAt = festival.status === "live" ? await registrationOpensAt(festival.id) : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="publish" />
      <section className={`${card} mt-8 p-5 sm:p-7`}>
        <PublishControls marker={marker} status={festival.status} />
      </section>

      {festival.status === "live" && (
        <section className={`${card} mt-6 p-5 sm:p-7`}>
          <h2 className="text-xl font-bold">Registration</h2>
          <RegistrationControls
            festival={festival}
            opensAtIso={opensAt}
            open={opensAt !== null && new Date(opensAt) <= new Date()}
          />
        </section>
      )}
    </main>
  );
}
