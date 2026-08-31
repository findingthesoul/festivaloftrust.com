"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/photos";
import { input } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The festival's photo list. Uploads go browser-to-Storage like the cover
 * (same bucket, same folder, same policy). Each photo carries a credit, and
 * can be offered to festivaloftrust.com's home page — the offer needs the
 * credit, because the home page prints it.
 */
export function Photos({
  festivalId,
  photos,
}: {
  festivalId: string;
  photos: PhotoRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const path = `${festivalId}/photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
        .insert({ festival_id: festivalId, url: data.publicUrl });
      if (dbErr) setError(dbErr.message);
    }
    setBusy(false);
    router.refresh();
  }

  async function saveCredit(id: string, credit: string) {
    const { error: e } = await browserSupabase()
      .from("photo")
      .update({ credit: credit.trim() || null })
      .eq("id", id);
    setError(e?.message ?? null);
    if (!e) router.refresh();
  }

  async function setHome(p: PhotoRow, on: boolean) {
    if (on && !p.credit?.trim()) {
      setError("Add a credit first — the home page prints it under the photo.");
      return;
    }
    const { error: e } = await browserSupabase()
      .from("photo")
      .update({ home: on })
      .eq("id", p.id);
    setError(e?.message ?? null);
    if (!e) router.refresh();
  }

  async function remove(id: string) {
    const { error: e } = await browserSupabase().from("photo").delete().eq("id", id);
    setError(e?.message ?? null);
    if (!e) router.refresh();
  }

  return (
    <div>
      <p className="font-medium">Photos</p>
      <p className="text-ink/60 mt-1 text-sm leading-relaxed text-pretty">
        The festival&rsquo;s own photo list. A photo you mark for the home
        page may appear full screen on festivaloftrust.com, with its credit
        line — place, date and who you name here. Only upload photos you have
        the right to share this way.
      </p>

      {photos.length > 0 && (
        <ul className="mt-5 space-y-4">
          {photos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="border-ink/15 aspect-[3/2] w-32 shrink-0 border object-cover"
              />
              <div className="min-w-56 flex-1">
                <input
                  defaultValue={p.credit ?? ""}
                  placeholder="Credit — organisation or photographer"
                  aria-label="Photo credit"
                  className={input}
                  onBlur={(e) => {
                    if (e.target.value !== (p.credit ?? "")) {
                      void saveCredit(p.id, e.target.value);
                    }
                  }}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.home}
                    onChange={(e) => void setHome(p, e.target.checked)}
                    className="accent-current"
                  />
                  Offer it to the home page
                </label>
              </div>
              <button
                type="button"
                onClick={() => void remove(p.id)}
                className="border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink rounded border bg-white px-2.5 py-1 text-xs transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="border-ink/25 hover:border-ink/60 mt-5 inline-block cursor-pointer rounded-lg border border-dashed bg-white px-4 py-2 text-sm font-medium transition-colors">
        {busy ? "Uploading…" : "Upload photos"}
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

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
