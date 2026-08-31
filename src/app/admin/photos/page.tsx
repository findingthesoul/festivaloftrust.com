import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { standing } from "@/lib/organiser";
import { serverSupabase } from "@/lib/supabase/server";
import { allPhotos } from "@/lib/photos";
import { PhotoDesk } from "./photo-desk";

export const metadata: Metadata = { title: "Photo desk", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The workspace's photo desk: everything festivals uploaded plus the
 * workspace's own library, and where each photo hangs — the home page
 * rotation or a story page's hero. Admin only, like the rest of /admin.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ festival?: string }>;
}) {
  const { festival: onlyFestival } = await searchParams;
  const s = await standing();
  if (s.state !== "approved" || !s.organiser.is_admin) notFound();

  const photos = await allPhotos().catch(() => []);
  const supabase = await serverSupabase();
  const { data: fests } = await supabase.from("festival").select("id, name");
  const names = Object.fromEntries(
    ((fests ?? []) as { id: string; name: string }[]).map((f) => [f.id, f.name]),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <Link
        href="/admin"
        className="text-ink/60 hover:text-ink text-sm transition-colors"
      >
        ← Review
      </Link>
      <h1 className="mt-4 text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Photo desk
      </h1>
      <p className="text-ink/60 mt-3 max-w-2xl leading-relaxed text-pretty">
        Every photo in the workspace: what festivals uploaded, and the
        library you keep yourself. Place a photo on the home page rotation or
        on a story page&rsquo;s opening picture; taking it off a page never
        deletes it.
      </p>

      <PhotoDesk
        photos={photos}
        festivalNames={names}
        onlyFestival={onlyFestival ?? null}
      />
    </main>
  );
}
