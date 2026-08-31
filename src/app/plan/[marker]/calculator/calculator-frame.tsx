"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadCalculator,
  saveCalculator,
  saveFundamentals,
  setFestivalCurrency,
  type CalcCurrency,
  type CalcPrices,
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
  prices,
  tall,
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
  /** The workspace's base prices, in the base currency. */
  prices: CalcPrices;
  /** Fill the viewport, for the full-screen page. */
  tall?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<Saved>("idle");
  // The chosen currency lives in state: after a change the reloaded tool
  // must speak the new one, not the code the page was served with.
  const [cur, setCur] = useState(current);
  const [note, setNote] = useState<string | null>(null);

  // What one base unit becomes in a given currency: exchange rate times
  // price level. Unknown codes multiply by 1.
  const mOf = useCallback(
    (c: string) => {
      const found = currencies.find((x) => x.code === c);
      return found ? found.rate * found.ratio : 1;
    },
    [currencies],
  );

  const save = useCallback(
    async (curCode?: string) => {
      const win = frame.current?.contentWindow as
        | (Window & { snapshot?: () => unknown })
        | null
        | undefined;
      if (typeof win?.snapshot !== "function") return;

      setState("saving");
      // The snapshot carries which currency its figures are in — and at what
      // multiplier, because a code's meaning changes when the admin corrects
      // an exchange rate. restore() ignores the extra keys; the next load
      // reads them to know whether the stored money still matches.
      const snap = win.snapshot();
      const code = curCode ?? cur;
      const stamped =
        snap && typeof snap === "object"
          ? {
              ...(snap as Record<string, unknown>),
              fotCurrency: code,
              fotMultiplier: mOf(code),
            }
          : snap;
      const result = await saveCalculator(marker, stamped);
      if (result.error) {
        setState("error");
        setNote(result.error);
        return;
      }
      setState("saved");
      setNote(null);
    },
    [marker, cur, mOf],
  );

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
    // when the festival has no saved figures yet. Saved figures carry the
    // currency they were saved in — when it differs from the festival's,
    // they convert once, here. Figures from before the stamp existed are
    // euro figures whatever the symbol said (the old switch changed only
    // the symbol), so a missing stamp converts by the full multiplier.
    const chosen = currencies.find((c) => c.code === cur);
    const tool = win as Window & {
      setCurrency?: (
        symbol: string,
        ratio: number,
        scale: boolean,
        convert?: number,
      ) => void;
      setFundamentals?: (
        fund: { currencies: CalcCurrency[]; prices: CalcPrices },
        canEdit: boolean,
      ) => void;
    };
    const multiplier = chosen ? chosen.rate * chosen.ratio : 1;
    if (chosen && typeof tool.setCurrency === "function") {
      const savedObj =
        saved && typeof saved === "object"
          ? (saved as Record<string, unknown>)
          : null;
      const savedCur =
        typeof savedObj?.fotCurrency === "string" ? savedObj.fotCurrency : null;
      // The multiplier the figures were saved at, preferred over what the
      // stamp's code means today — an admin correcting an exchange rate
      // changes the code's meaning, and the figures must follow.
      const savedM =
        typeof savedObj?.fotMultiplier === "number" && savedObj.fotMultiplier > 0
          ? savedObj.fotMultiplier
          : savedCur
            ? mOf(savedCur)
            : 1;
      const factor = saved ? multiplier / savedM : 1;
      tool.setCurrency(
        chosen.symbol,
        multiplier,
        !saved,
        saved && factor !== 1 ? factor : undefined,
      );
      // Converted or merely unstamped: write the repaired figures back so
      // this runs once, not on every open.
      if (saved && (factor !== 1 || savedCur !== cur || savedM !== multiplier)) {
        void save(cur);
      }
    }
    const withPrices = win as typeof tool & {
      setBasePrices?: (p: CalcPrices, m: number) => void;
    };
    if (typeof withPrices.setBasePrices === "function") {
      withPrices.setBasePrices(prices, multiplier);
    }
    // The fundamentals tab: filled for everyone, revealed only to the admin,
    // and saved through this page's own action.
    if (typeof tool.setFundamentals === "function") {
      tool.setFundamentals({ currencies, prices }, isAdmin);
      Reflect.set(
        win,
        "onFundamentalsSave",
        (payload: { currencies: CalcCurrency[]; prices: CalcPrices }) =>
          saveFundamentals(payload),
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
  }, [marker, prefill, save, currencies, cur, isAdmin, prices]);

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
            value={cur}
            onChange={async (e) => {
              const code = e.target.value;
              // The money on screen changes currency, so every amount —
              // inputs, artists, funders — converts by the step between the
              // old multiplier and the new one. R20 to the euro at half the
              // price level: a €10.000 line becomes R100.000, not R10.000.
              const factor = mOf(code) / mOf(cur);
              const win = frame.current?.contentWindow as
                | (Window & {
                    setCurrency?: (
                      s: string,
                      r: number,
                      scale: boolean,
                      convert?: number,
                    ) => void;
                  })
                | null
                | undefined;
              const symbol =
                currencies.find((x) => x.code === code)?.symbol ?? "€";
              if (factor !== 1 && typeof win?.setCurrency === "function") {
                win.setCurrency(symbol, mOf(code), false, factor);
                // The converted figures are the festival's figures now —
                // saved under the new currency before the reload restores
                // them.
                await save(code);
              }
              setCur(code);
              const r = await setFestivalCurrency(marker, code);
              if (r.error) {
                setNote(r.error);
                return;
              }
              // Reload so the tool reseeds base prices at the new
              // multiplier and restores the converted snapshot.
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
        {!tall && (
          <a
            href={`/plan/${marker}/calculator/full`}
            className="text-ink/60 hover:text-ink shrink-0 text-sm underline decoration-2 underline-offset-4 transition-colors"
          >
            Full screen ↗
          </a>
        )}
      </div>
      {/* The conversion, said out loud. A currency whose fundamentals were
          never filled multiplies by 1 and looks exactly like a bug — this
          line makes the difference visible instead of deniable. */}
      {cur !== "EUR" &&
        (() => {
          const c = currencies.find((x) => x.code === cur);
          if (!c) return null;
          const m = c.rate * c.ratio;
          return m === 1 ? (
            <p className="mt-2 text-sm font-medium text-red-700">
              {c.code} multiplies by 1 right now — its exchange rate and price
              level are still at their defaults. Set them on the Fundamentals
              tab (e.g. rate 20 and price level 0.5 for South Africa), then
              switch the currency away and back to convert the figures.
            </p>
          ) : (
            <p className="text-ink/50 mt-2 text-xs">
              €1 → {c.symbol}
              {c.rate} at price level {c.ratio}: figures are ×{m} against the
              base prices.
            </p>
          );
        })()}
      {note && <p className="mt-2 text-sm text-red-700">{note}</p>}

      <iframe
        ref={frame}
        onLoad={onLoad}
        src="/planner"
        title="The business model"
        className={`border-ink/15 mt-4 w-full border bg-white ${tall ? "h-[calc(100vh-11rem)]" : "h-[calc(100vh-24rem)] min-h-[40rem]"}`}
      />
    </>
  );
}
