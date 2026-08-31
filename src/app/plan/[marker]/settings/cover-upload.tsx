"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/photos";
import { input } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Cover upload, straight from the browser to Storage.
 *
 * Not through a server action: that would mean the whole file crossing our
 * server for no reason. Storage policies decide who may write, keyed on the
 * festival id in the path, so the browser doing it directly is not a weaker
 * check — it is the same check, closer to the file.
 *
 * The offer lives here too: the cover IS the festival's photo, so giving it
 * a credit and offering it to the home page happens under the same picture
 * rather than in a second list asking for a second upload.
 */
export function CoverUpload({
  festivalId,
  current,
  coverPhoto,
}: {
  festivalId: string;
  current: string | null;
  /** The photo-list row for the current cover, when one exists. */
  coverPhoto: PhotoRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credit, setCredit] = useState(coverPhoto?.credit ?? "");

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That is not an image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images need to be under 5 MB.");
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = browserSupabase();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // The festival id is the first path segment; the storage policy reads it.
    const path = `${festivalId}/cover-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("covers")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("festival")
      .update({ cover_url: data.publicUrl })
      .eq("id", festivalId);

    setBusy(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    router.refresh();
  }

  /** The cover's photo-list row, made the moment the offer needs one. */
  async function coverRow(): Promise<string | null> {
    if (!current) return null;
    if (coverPhoto) return coverPhoto.id;
    const { data, error: e } = await browserSupabase()
      .from("photo")
      .insert({ festival_id: festivalId, url: current, credit: credit.trim() || null })
      .select("id")
      .single();
    if (e) {
      setError(e.message);
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  }

  async function saveCredit() {
    if (credit.trim() === (coverPhoto?.credit ?? "")) return;
    const id = await coverRow();
    if (!id) return;
    const { error: e } = await browserSupabase()
      .from("photo")
      .update({ credit: credit.trim() || null })
      .eq("id", id);
    setError(e?.message ?? null);
    if (!e) router.refresh();
  }

  async function offer(on: boolean) {
    if (on && !credit.trim()) {
      setError("Add a credit first — the home page prints it under the photo.");
      return;
    }
    const id = await coverRow();
    if (!id) return;
    const { error: e } = await browserSupabase()
      .from("photo")
      .update({ page: on ? "home" : null, credit: credit.trim() || null })
      .eq("id", id);
    setError(e?.message ?? null);
    if (!e) router.refresh();
  }

  return (
    <div>
      <p className="font-medium">Cover image</p>
      <p className="text-ink/60 mt-1 text-sm leading-relaxed text-pretty">
        Real, warm, close-up. It stands for the festival wherever it appears —
        and with a credit, you can offer this same photo to
        festivaloftrust.com&rsquo;s home page below. Only upload a photo you
        have the right to share that way.
      </p>

      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt=""
          className="border-ink/15 mt-4 aspect-[3/2] w-full max-w-sm border object-cover"
        />
      )}

      <label className="border-ink/25 hover:border-ink/60 mt-4 inline-block cursor-pointer rounded-lg border border-dashed bg-white px-4 py-2 text-sm font-medium transition-colors">
        {busy ? "Uploading…" : current ? "Replace image" : "Upload an image"}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </label>

      {current && (
        <div className="border-ink/10 mt-5 max-w-sm border-t pt-4">
          <label htmlFor="cover-credit" className="text-ink/80 block text-sm font-medium">
            Credit
          </label>
          <input
            id="cover-credit"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            onBlur={() => void saveCredit()}
            placeholder="Organisation or photographer"
            className={`${input} mt-1`}
          />
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={coverPhoto?.page === "home"}
              onChange={(e) => void offer(e.target.checked)}
              className="accent-current"
            />
            Offer it to the home page
          </label>
          <p className="text-ink/50 mt-1.5 text-xs leading-relaxed">
            Offered photos may appear full screen on the home page, credited
            with your festival&rsquo;s place, date, and the name above.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
