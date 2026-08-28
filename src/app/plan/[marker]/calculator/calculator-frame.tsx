"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCalculator, saveCalculator } from "./actions";

type Saved = "idle" | "saving" | "saved" | "error";

/**
 * The calculator, kept per festival.
 *
 * The tool is a standalone document in a frame, so this does not reach into
 * its markup. It uses the two functions the tool already exposes for its own
 * open/save buttons — `snapshot()` and `restore()` — which are top-level
 * declarations and therefore on the frame's window. Same origin, because
 * /planner is a rewrite on this domain.
 *
 * That seam is the whole point: a new export of the tool changes its fields
 * freely and this keeps working, as long as those two functions remain.
 */
export function CalculatorFrame({ marker }: { marker: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<Saved>("idle");
  const [note, setNote] = useState<string | null>(null);

  const save = useCallback(async () => {
    const win = frame.current?.contentWindow as
      | (Window & { snapshot?: () => unknown })
      | null
      | undefined;
    if (typeof win?.snapshot !== "function") return;

    setState("saving");
    const result = await saveCalculator(marker, win.snapshot());
    if (result.error) {
      setState("error");
      setNote(result.error);
      return;
    }
    setState("saved");
    setNote(null);
  }, [marker]);

  const onLoad = useCallback(async () => {
    const win = frame.current?.contentWindow as
      | (Window & {
          restore?: (o: unknown) => void;
          say?: (msg: string) => void;
        })
      | null
      | undefined;
    const doc = frame.current?.contentDocument;
    if (!win || !doc) return;

    const restore = win.restore;

    const saved = await loadCalculator(marker);
    if (saved && typeof restore === "function") {
      try {
        restore.call(win, saved);
      } catch {
        // An older snapshot the current tool cannot read. Better to show the
        // tool's own defaults than to fail the page — nothing is lost, the
        // stored figures are still there until the next save overwrites them.
        setNote("Saved figures could not be read by this version of the tool.");
      }
    }

    // Save on any change, coalesced. The tool has no change event of its own,
    // so this listens on its document, where every input bubbles to.
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, 900);
    };
    doc.addEventListener("input", schedule);
    doc.addEventListener("change", schedule);
    // Clicks cover the tool's own buttons — adding an artist, a funder, a tier
    // — which change the snapshot without ever firing input.
    doc.addEventListener("click", schedule);

    // Opening a file restores asynchronously, long after the click and change
    // events that led to it, so neither would carry the imported figures.
    // Wrapping restore catches every path into it, including future ones.
    if (typeof restore === "function") {
      // Reflect.set, because the immutability lint reads any assignment
      // through a ref as mutating our own state. This is another document's
      // window, which is the one thing we are here to talk to.
      Reflect.set(win, "restore", (o: unknown) => {
        restore.call(win, o);
        schedule();
      });
    }

    // The tool's own Save downloads a .fot.json. In a festival that is the
    // wrong meaning of the word — the figures belong to this festival, and
    // already save themselves. Rebound rather than hidden, because a Save
    // button that does nothing is worse than one that does the right thing.
    const btnSave = doc.getElementById("btnSave") as HTMLButtonElement | null;
    if (btnSave) {
      btnSave.onclick = () => {
        void save();
        win.say?.("Saved to this festival");
      };
    }
  }, [marker, save]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <div className="mt-6 flex items-baseline justify-between gap-4">
        <p className="text-ink/60 text-sm" aria-live="polite">
          {state === "saving"
            ? "Saving…"
            : state === "saved"
              ? "Saved to this festival"
              : state === "error"
                ? "Not saved"
                : "Changes are kept with this festival"}
        </p>
        <a
          href="/planner"
          target="_blank"
          rel="noreferrer"
          className="text-ink/60 hover:text-ink shrink-0 text-sm underline decoration-2 underline-offset-4 transition-colors"
        >
          Full screen ↗
        </a>
      </div>
      {note && <p className="mt-2 text-sm text-red-700">{note}</p>}

      <iframe
        ref={frame}
        onLoad={onLoad}
        src="/planner"
        title="The business model"
        className="border-ink/15 mt-4 h-[calc(100vh-24rem)] min-h-[40rem] w-full border bg-white"
      />
    </>
  );
}
