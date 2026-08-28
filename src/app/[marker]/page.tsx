import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShapeGrid } from "@/components/ShapeGrid";
import { Wordmark } from "@/components/Wordmark";
import { liveFestival } from "@/lib/festivals";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marker: string }>;
}): Promise<Metadata> {
  const { marker } = await params;
  const festival = await liveFestival(marker);
  if (!festival) return { title: "Not found" };
  return {
    title: festival.name,
    description: festival.summary ?? undefined,
    openGraph: {
      title: festival.name,
      description: festival.summary ?? undefined,
      images: festival.cover_url ? [festival.cover_url] : undefined,
    },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const festival = await liveFestival(marker);
  // A draft is not "forbidden", it is nothing. Anything else would let this
  // page be used to find out what is being planned.
  if (!festival) notFound();

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-green text-center text-[clamp(1.1rem,3.5vw,2rem)] font-bold tracking-[-0.01em] text-balance uppercase">
          {festival.place ?? "Festival of Trust"}
          {festival.starts_on && (
            <>
              {" "}
              <span className="font-normal">|</span>{" "}
              {dateFormat.format(new Date(festival.starts_on))}
            </>
          )}
        </p>

        {festival.cover_url ? (
          <div className="border-ink/10 relative mt-12 aspect-[3/2] w-full overflow-hidden border">
            <Image
              src={festival.cover_url}
              alt=""
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mt-12 flex justify-center">
            <ShapeGrid className="w-full max-w-sm" />
          </div>
        )}

        <div className="mt-12 flex justify-end">
          <Wordmark className="h-14 w-auto sm:h-16 md:h-20" />
        </div>

        <h1 className="mt-14 text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          {festival.name}
        </h1>

        {festival.summary && (
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
            {festival.summary}
          </p>
        )}

        {/* Enrolment arrives with The Thread; saying so beats a button that
            does nothing. */}
        <p className="text-ink/60 mt-14 border-t border-ink/15 pt-8 text-sm">
          Registration opens closer to the day.
        </p>
      </section>
    </main>
  );
}
