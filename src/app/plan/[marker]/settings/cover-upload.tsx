"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Cover upload, straight from the browser to Storage.
 *
 * Not through a server action: that would mean the whole file crossing our
 * server for no reason. Storage policies decide who may write, keyed on the
 * festival id in the path, so the browser doing it directly is not a weaker
 * check — it is the same check, closer to the file.
 */
export function CoverUpload({
  festivalId,
  current,
}: {
  festivalId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <p className="font-medium">Cover image</p>
      <p className="text-ink/60 mt-1 text-sm leading-relaxed text-pretty">
        Real, warm, close-up. It stands for the festival wherever it appears.
      </p>

      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt=""
          className="border-ink/15 mt-4 aspect-[3/2] w-full max-w-sm border object-cover"
        />
      )}

      <label className="border-ink/25 hover:border-ink/50 mt-4 inline-block cursor-pointer border px-4 py-2 text-sm transition-colors">
        {busy ? "Uploading…" : current ? "Replace image" : "Choose an image"}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
          className="sr-only"
        />
      </label>
      {error && <p className="text-red mt-2 text-sm">{error}</p>}
    </div>
  );
}
