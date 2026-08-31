"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";
import type { PhotoPage, PhotoRow } from "@/lib/photos";
import { input } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;

const PAGES: { key: PhotoPage; label: string }[] = [
  { key: "home", label: "Home page" },
  { key: "society", label: "For society" },
  { key: "organisations", label: "For organisations" },
  { key: "about", label: "About" },
];

/**
 * The desk itself. Placement and library in one view: the top sections show
 * what each public page currently wears; the library below holds everything
 * unplaced — the workspace's own uploads first, then each festival's list.
 * Every write goes browser-to-database; row-level security already knows
 * the admin.
 */
export function PhotoDesk({
  photos,
  festivalNames,
  onlyFestival,
}: {
  photos: PhotoRow[];
  festivalNames: Record<string, string>;
  onlyFestival: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (p: PhotoRow) =>
    p.festival_id
      ? (festivalNames[p.festival_id] ?? "a festival")
      : "Workspace library";

  const run = async (
    work: PromiseLike<{ error: { message: string } | null }>,
  ) => {
    const { error: e } = await work;
    setError(e?.message ?? null);
    if (!e) router.refresh();
  };

  const place = (p: PhotoRow, page: PhotoPage | null) => {
    if (page && !p.credit?.trim() && page === "home") {
      setError("Give it a credit first — the home page prints one.");
      return;
    }
    void run(browserSupabase().from("photo").update({ page }).eq("id", p.id));
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const supabase = browserSupabase();
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is over 5 MB.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `workspace/photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("covers")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("photo")
        .insert({ festival_id: null, url: data.publicUrl });
      if (dbErr) setError(dbErr.message);
    }
    setBusy(false);
    router.refresh();
  }

  const placed = (key: PhotoPage) => photos.filter((p) => p.page === key);
  const library = photos.filter(
    (p) => !p.page && (!onlyFestival || p.festival_id === onlyFestival),
  );

  const card = (p: PhotoRow, inLibrary: boolean) => (
    <li key={p.id} className="border-ink/15 border bg-white/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.url}
        alt=""
        className="aspect-[3/2] w-full border-b border-ink/10 object-cover"
      />
      <div className="space-y-2 p-3">
        <p className="text-sm font-medium">{nameOf(p)}</p>
        <input
          defaultValue={p.credit ?? ""}
          placeholder="Credit"
          aria-label="Photo credit"
          className={`${input} text-sm`}
          onBlur={(e) => {
            if (e.target.value !== (p.credit ?? "")) {
              void run(
                browserSupabase()
                  .from("photo")
                  .update({ credit: e.target.value.trim() || null })
                  .eq("id", p.id),
              );
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Place on"
            value={p.page ?? ""}
            onChange={(e) =>
              place(p, (e.target.value || null) as PhotoPage | null)
            }
            className="border-ink/20 rounded-lg border bg-white px-2 py-1 text-sm"
          >
            <option value="">Not placed</option>
            {PAGES.map((pg) => (
              <option key={pg.key} value={pg.key}>
                {pg.label}
              </option>
            ))}
          </select>
          {inLibrary && !p.festival_id && (
            <button
              type="button"
              onClick={() =>
                void run(browserSupabase().from("photo").delete().eq("id", p.id))
              }
              className="border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink rounded border bg-white px-2.5 py-1 text-xs transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <div className="mt-10 space-y-12">
      {PAGES.map((pg) => {
        const rows = placed(pg.key);
        return (
          <section key={pg.key}>
            <h2 className="text-xl font-bold">
              {pg.label}{" "}
              <span className="text-ink/45 text-base font-normal">
                ({rows.length})
              </span>
            </h2>
            {rows.length === 0 ? (
              <p className="text-ink/50 mt-2 text-sm">
                Nothing placed here — pick from the library below.
              </p>
            ) : (
              <ul className="mt-4 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                {rows.map((p) => card(p, false))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="border-ink/15 border-t pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold">
            Library{" "}
            <span className="text-ink/45 text-base font-normal">
              ({library.length})
            </span>
          </h2>
          <label className="border-ink/25 hover:border-ink/60 inline-block cursor-pointer rounded-lg border border-dashed bg-white px-4 py-2 text-sm font-medium transition-colors">
            {busy ? "Uploading…" : "Upload to the library"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {onlyFestival && (
          <p className="text-ink/60 mt-2 text-sm">
            Showing only {festivalNames[onlyFestival] ?? "that festival"}
            &rsquo;s unplaced photos —{" "}
            <Link href="/admin/photos" className="underline">
              show everything
            </Link>
            .
          </p>
        )}
        {library.length === 0 ? (
          <p className="text-ink/50 mt-4 text-sm">
            Nothing unplaced. Festival uploads land here, and so does whatever
            you upload above.
          </p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {library.map((p) => card(p, true))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
