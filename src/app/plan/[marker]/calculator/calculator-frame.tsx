"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadCalculator,
  saveCalculator,
  saveFundamentals,
  setFestivalCurrency,
  type CalcCurrency,
} from "./actions";

type Saved = "idle" | "saving" | "saved" | "error";

/**
 * The calculator, kept per festival.
 *
 * The tool is a standalone document in a frame, so this does not reach into
 * its markup for values. It uses the two functions the tool already exposes
 * for its own open/save buttons — `snapshot()` and `restore()` — which are
 * top-level declarations and therefore on the frame's window. Same origin,
 * because /planner is a rewrite on this domain.
 *
 * That seam is the point: a new export of the tool can change every field and
 * this keeps working, as long as those two functions remain.
 */
export function CalculatorFrame({
  marker,
  prefill,
  currencies,
  current,
  isAdmin,
}: {
  marker: string;
  /** Field id to value, for what the festival already knows. */
  prefill: Record<string, string>;
  /** The workspace's currencies, for the picker and the fundamentals tab. */
  currencies: CalcCurrency[];
  /** This festival's currency code. */
  current: string;
  /** Whether the fundamentals tab is this viewer's to edit. */
  isAdmin: boolean;
}) {
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
      | (Window & { restore?: (o: unknown) => void })
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
        // An older snapshot this version of the tool cannot read. Better to
        // show the tool's own defaults than to fail the page — nothing is
        // lost, the stored figures stay until the next save overwrites them.
        setNote("Saved figures could not be read by this version of the tool.");
      }
    }

    // Open and Save are the tool's file buttons: one downloads a .fot.json,
    // the other reads one back. Inside a festival the figures belong to the
    // festival and keep themselves, so both offer a second, weaker copy of
    // something already done — and Save means the wrong thing entirely.
    //
    // Hidden here rather than cut from the export, so a new drop-in export
    // still carries them for standalone use at /planner.
    for (const id of ["btnOpen", "btnSave"]) {
      const el = doc.getElementById(id);
      if (el) el.style.setProperty("display", "none");
    }

    // The Organiser panel asks for the festival's name, date, place and who is
    // running it. All of that is the festival's own and belongs in Settings,
    // which The Thread feeds — asking again invites two answers to one
    // question.
    //
    // Filled from what the festival knows and then hidden, rather than only
    // hidden, so the figures still carry the right name wherever the tool
    // prints them. After the restore, so a stale snapshot cannot win.
    for (const [id, value] of Object.entries(prefill)) {
      const el = doc.getElementById(id) as HTMLInputElement | null;
      if (el && value) el.value = value;
    }
    const panel = doc.getElementById("fName")?.closest(".panel") as HTMLElement | null;
    panel?.style.setProperty("display", "none");

    // Currency: the symbol always; the ratio scales the default prices only
    // when the festival has no saved figures yet — saved figures are already
    // in the festival's own currency and must not be touched.
    const chosen = currencies.find((c) => c.code === current);
    const tool = win as Window & {
      setCurrency?: (symbol: string, ratio: number, scale: boolean) => void;
      setFundamentals?: (list: CalcCurrency[], canEdit: boolean) => void;
    };
    if (chosen && typeof tool.setCurrency === "function") {
      tool.setCurrency(chosen.symbol, chosen.ratio, !saved);
    }
    // The fundamentals tab: filled for everyone, revealed only to the admin,
    // and saved through this page's own action.
    if (typeof tool.setFundamentals === "function") {
      tool.setFundamentals(currencies, isAdmin);
      Reflect.set(win, "onFundamentalsSave", (list: CalcCurrency[]) =>
        saveFundamentals(list),
      );
    }

    // Save on any change, coalesced. The tool has no change event of its own,
    // so this listens on its document, where every input bubbles to.
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, 900);
    };
    doc.addEventListener("input", schedule);
    doc.addEventListener("change", schedule);
    // Clicks cover the tool's own buttons — adding an artist, a funder,
    // switching tier — which change the snapshot without firing input.
    doc.addEventListener("click", schedule);

    // Any other route into restore() lands its figures asynchronously, after
    // the events that led to it. Wrapping it catches all of them.
    //
    // Reflect.set, because the immutability lint reads any assignment through
    // a ref as mutating our own state. This is another document's window,
    // which is the one thing we are here to talk to.
    if (typeof restore === "function") {
      Reflect.set(win, "restore", (o: unknown) => {
        restore.call(win, o);
        schedule();
      });
    }
  }, [marker, prefill, save, currencies, current, isAdmin]);

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
        <label className="text-ink/60 flex items-center gap-2 text-sm">
          Currency
          <select
            defaultValue={current}
            onChange={async (e) => {
              const r = await setFestivalCurrency(marker, e.target.value);
              if (r.error) {
                setNote(r.error);
                return;
              }
              // Reload the tool so a fresh festival reseeds its defaults in
              // the new currency; saved figures stay exactly as they were.
              if (frame.current) frame.current.src = "/planner";
            }}
            className="border-ink/20 rounded-lg border bg-white px-2 py-1"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.symbol}
              </option>
            ))}
          </select>
        </label>
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
