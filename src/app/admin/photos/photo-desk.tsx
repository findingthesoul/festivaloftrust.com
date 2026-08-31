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
  covers,
  festivalNames,
  onlyFestival,
}: {
  photos: PhotoRow[];
  /** Festival cover images not yet pulled into the photo list. */
  covers: { festivalId: string; url: string; name: string }[];
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
  const coverRows = covers.filter(
    (c) => !onlyFestival || c.festivalId === onlyFestival,
  );

  // A cover becomes a list photo of its festival the moment the desk takes
  // it — from there it behaves like any library photo.
  const pullCover = (c: { festivalId: string; url: string }) =>
    void run(
      browserSupabase()
        .from("photo")
        .insert({ festival_id: c.festivalId, url: c.url }),
    );

  // One click on the photo marks where the faces are; the home page keeps
  // its shapes on the other side. Click the marker again-ish (anywhere) to
  // move it — precision does not matter, the side does.
  const setFocus = (p: PhotoRow, e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    void run(
      browserSupabase()
        .from("photo")
        .update({
          focus_x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
          focus_y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
        })
        .eq("id", p.id),
    );
  };

  const card = (p: PhotoRow, inLibrary: boolean) => (
    <li key={p.id} className="border-ink/15 border bg-white/40">
      <button
        type="button"
        onClick={(e) => setFocus(p, e)}
        title="Click where the faces are — the site keeps its shapes away from that spot"
        className="relative block w-full cursor-crosshair"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.url}
          alt=""
          className="aspect-[3/2] w-full border-b border-ink/10 object-cover"
        />
        {p.focus_x != null && p.focus_y != null && (
          <span
            aria-hidden="true"
            className="border-cream absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-black/30 shadow"
            style={{
              left: `${p.focus_x * 100}%`,
              top: `${p.focus_y * 100}%`,
            }}
          />
        )}
      </button>
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

        {coverRows.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bold">Festival covers</h3>
            <p className="text-ink/50 mt-1 text-sm">
              Every festival&rsquo;s cover photo — take one into the library
              to credit and place it.
            </p>
            <ul className="mt-4 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {coverRows.map((c) => (
                <li key={c.url} className="border-ink/15 border bg-white/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.url}
                    alt=""
                    className="aspect-[3/2] w-full border-b border-ink/10 object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="text-sm font-medium">{c.name}</p>
                    <button
                      type="button"
                      onClick={() => pullCover(c)}
                      className="border-ink/25 hover:border-ink/60 shrink-0 rounded border bg-white px-2.5 py-1 text-xs font-medium transition-colors"
                    >
                      Take into the library
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
