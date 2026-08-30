"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  build,
  DEFAULT_OPTIONS,
  PALETTE,
  svgFor,
  svgForItems,
  type Options,
} from "./core";
import {
  Editor,
  fillsOf,
  SHAPE_COLOUR_OPTIONS,
  SwatchDropdown,
  type FormState,
} from "./editor";
import { addLogo, listLogos, removeLogo, type LogoRow } from "./actions";

const BATCH = 24;
const STORE = "fot-gen-saved";
const STORE_COLLECTIONS = "fot-gen-collections";
const DEFAULT_COLLECTION = "Unsorted";
// The one collection that does not live in this browser: festival logos are
// a shared pool in the database, claimed one-per-festival from Settings.
const FESTIVAL_COLLECTION = "Festival logos";
const GEN_TAB = "__gen__";

type SavedForm = FormState & { id: string; version: number; collection: string };

export function Generator() {
  const [batch, setBatch] = useState(0);
  const [color, setColor] = useState<string>(PALETTE[5].hex);
  const [pentagonTail, setPentagonTail] = useState(DEFAULT_OPTIONS.pentagonTail);
  // One axis, one story: how far the form escapes the grid. 0 = the
  // nine-grid of the original drawing; 1 = breakout.
  const [breakout, setBreakout] = useState(0.3);
  const [picked, setPicked] = useState<number[]>([]);
  const [saved, setSaved] = useState<SavedForm[]>([]);
  const [extraCollections, setExtraCollections] = useState<string[]>([]);
  const [dbLogos, setDbLogos] = useState<LogoRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  // The tab bar: the generator, or one collection shown at a time.
  const [tab, setTab] = useState<string>(GEN_TAB);
  // Save target: the collection tab last visited.
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [editing, setEditing] = useState<{ seed: number; form?: SavedForm } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Saved forms survive reloads; load after mount so SSR markup matches.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed: SavedForm[] = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount
        setSaved(
          parsed.map((f) => ({
            ...f,
            collection: f.collection || DEFAULT_COLLECTION,
            bg: f.bg || "#FFFFFF",
          })),
        );
      }
      const rawC = localStorage.getItem(STORE_COLLECTIONS);
       
      if (rawC) setExtraCollections(JSON.parse(rawC));
    } catch {}
    setLoaded(true);
  }, []);

  // The shared collection comes from the server, not localStorage.
  const refreshLogos = () => listLogos().then((r) => setDbLogos(r.logos));
  useEffect(() => {
    void listLogos().then((r) => setDbLogos(r.logos));
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(saved));
      localStorage.setItem(STORE_COLLECTIONS, JSON.stringify(extraCollections));
    } catch {}
  }, [saved, extraCollections, loaded]);

  const opts: Options = useMemo(
    () => ({
      // Fixed: the base layout never re-grows as the slider moves, so a seed
      // keeps ONE form and the slider reads as that form breaking out.
      compactness: 0.2,
      wildness: breakout,
      pentagonTail,
    }),
    [breakout, pentagonTail],
  );
  const tiles = useMemo(() => {
    const first = batch * BATCH + 1;
    return Array.from({ length: BATCH }, (_, i) => {
      const seed = first + i;
      return { seed, svg: svgFor(seed, color, opts) };
    });
  }, [batch, color, opts]);

  const pickedSeeds = useMemo(() => new Set(picked), [picked]);
  const collections = useMemo(
    () => [
      ...new Set([
        DEFAULT_COLLECTION,
        FESTIVAL_COLLECTION,
        ...extraCollections,
        ...saved.map((s) => s.collection),
      ]),
    ],
    [saved, extraCollections],
  );
  const tabForms = useMemo(
    () =>
      tab === FESTIVAL_COLLECTION
        ? dbLogos.map(
            (l): SavedForm => ({
              ...l.form,
              id: l.id,
              version: 1,
              collection: FESTIVAL_COLLECTION,
            }),
          )
        : saved.filter((f) => f.collection === tab),
    [saved, tab, dbLogos],
  );
  const claimedBy = useMemo(
    () => new Map(dbLogos.map((l) => [l.id, l.claimedBy])),
    [dbLogos],
  );
  const onGenerator = tab === GEN_TAB;

  const toggle = (seed: number) =>
    setPicked((prev) =>
      prev.includes(seed) ? prev.filter((s) => s !== seed) : [...prev, seed],
    );

  const openCollection = (name: string) => {
    setTab(name);
    setCollection(name);
  };

  const addCollection = () => {
    const name = window.prompt("Name of the new collection:")?.trim();
    if (!name) return;
    setExtraCollections((prev) => (prev.includes(name) ? prev : [...prev, name]));
    openCollection(name);
  };

  // The editor's collection select routes through here too.
  const pickCollection = (value: string) => {
    if (value === "__new__") {
      const name = window.prompt("Name of the new collection:")?.trim();
      if (name) {
        setExtraCollections((prev) => (prev.includes(name) ? prev : [...prev, name]));
        setCollection(name);
      }
    } else {
      setCollection(value);
    }
  };

  const download = (svg: string, name: string, delay: number) =>
    setTimeout(() => {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }, delay);

  // Every save is a new version — edits never overwrite an earlier form.
  const saveForm = (form: FormState, into = collection) => {
    if (into === FESTIVAL_COLLECTION) {
      void addLogo(form).then((r) => {
        if (r.error) window.alert(r.error);
        return refreshLogos();
      });
      return;
    }
    setSaved((prev) => {
      const version =
        Math.max(0, ...prev.filter((s) => s.seed === form.seed).map((s) => s.version)) + 1;
      return [
        ...prev,
        { ...form, version, collection: into, id: `${form.seed}-${version}-${Date.now()}` },
      ];
    });
  };

  // "Shapes selected → add to collection": picked tiles become saved forms.
  const addPickedToCollection = () => {
    for (const seed of picked) {
      saveForm({
        seed,
        items: build(seed, opts).items,
        base: color === "original" ? PALETTE[5].hex : color,
        original: color === "original",
        accent: null,
        bg: "#FFFFFF",
      });
    }
    setPicked([]);
  };

  const savedSvg = (f: SavedForm) =>
    svgForItems(
      f.items,
      f.base,
      fillsOf(f),
      {
        seed: f.seed,
        items: f.items,
        base: f.base,
        original: f.original,
        accent: f.accent,
        bg: f.bg,
        collection: f.collection,
      },
      f.bg,
      // Unique per saved form: these SVGs sit inline in one document, where
      // duplicate gradient/mask ids would paint each other's masks.
      `s${f.id.replace(/[^\w-]/g, "")}g`,
    );

  const fileName = (f: SavedForm) =>
    `fot-${f.collection.replace(/[^\w-]+/g, "_")}-${f.seed}-v${f.version}.svg`;

  const exportForms = (forms: SavedForm[]) =>
    forms.forEach((f, i) => download(savedSvg(f), fileName(f), i * 200));

  // Upload: exported files carry their form data in <metadata>, so they come
  // back in editable, into their original collection.
  const uploadFiles = async (files: FileList | null) => {
    if (!files) return;
    let ok = 0;
    let skipped = 0;
    let firstImported: string | null = null;
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const meta = doc.querySelector("metadata#fot-form")?.textContent;
        if (!meta) throw new Error("no form data");
        const form = JSON.parse(meta);
        if (!Array.isArray(form.items) || typeof form.seed !== "number")
          throw new Error("bad form data");
        const into =
          typeof form.collection === "string" && form.collection ? form.collection : collection;
        saveForm(
          {
            seed: form.seed,
            items: form.items,
            base: form.base ?? PALETTE[5].hex,
            original: form.original ?? false,
            accent: form.accent ?? null,
            bg: typeof form.bg === "string" ? form.bg : "#FFFFFF",
          },
          into,
        );
        firstImported ??= into;
        ok++;
      } catch {
        skipped++;
      }
    }
    // Jump to the collection tab the forms landed in, so the upload is visible.
    if (firstImported) openCollection(firstImported);
    if (skipped) {
      window.alert(
        `${ok} form(s) uploaded, ${skipped} skipped — only SVGs exported by this tool carry form data.`,
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10">
      <div className="sticky top-0 z-10 -mx-6 mb-8 border-b border-black/10 bg-background/95 backdrop-blur sm:-mx-10">
        {/* Tabs: the generator, one tab per collection, and + for a new one. */}
        <div className="flex flex-wrap items-end gap-1 px-6 pt-3 sm:px-10">
          <button
            type="button"
            onClick={() => setTab(GEN_TAB)}
            className={`border border-b-0 border-black/15 px-4 py-2 text-sm font-medium ${
              onGenerator ? "bg-white" : "bg-black/5 text-black/50 hover:text-black"
            }`}
          >
            Generator
          </button>
          {collections.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => openCollection(c)}
              className={`border border-b-0 border-black/15 px-4 py-2 text-sm font-medium ${
                tab === c ? "bg-white" : "bg-black/5 text-black/50 hover:text-black"
              }`}
            >
              {c} (
              {c === FESTIVAL_COLLECTION
                ? dbLogos.length
                : saved.filter((f) => f.collection === c).length}
              )
            </button>
          ))}
          <button
            type="button"
            onClick={addCollection}
            title="New collection"
            className="border border-b-0 border-black/15 bg-black/5 px-3 py-2 text-sm font-medium text-black/50 hover:text-black"
          >
            +
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-black/15 bg-white/60 px-6 py-4 sm:px-10">
          <SwatchDropdown
            label="Colour"
            value={color}
            options={SHAPE_COLOUR_OPTIONS}
            onChange={setColor}
            disabled={!onGenerator}
          />

          <label
            className={`flex items-center gap-3 text-sm ${onGenerator ? "" : "opacity-40"}`}
            title="Left: the nine-grid of the original drawing. Right: break out of the grid."
          >
            <span>Nine grid</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={breakout}
              disabled={!onGenerator}
              onChange={(e) => setBreakout(Number(e.target.value))}
              className="w-40 accent-current"
            />
            <span>Breakout</span>
          </label>

          <label
            className={`flex items-center gap-2 text-sm ${
              onGenerator ? "cursor-pointer" : "opacity-40"
            }`}
          >
            <input
              type="checkbox"
              checked={pentagonTail}
              disabled={!onGenerator}
              onChange={(e) => setPentagonTail(e.target.checked)}
              className="accent-current"
            />
            Pentagon in tail
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!onGenerator}
              onClick={() => setBatch((b) => b + 1)}
              className="border border-current px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Generate more
            </button>
            <button
              type="button"
              disabled={!onGenerator || picked.length === 0}
              onClick={addPickedToCollection}
              className="border border-current px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Add picked to {collection} ({picked.length})
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border border-current px-4 py-2 text-sm font-medium"
            >
              Upload forms
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".svg,image/svg+xml"
              multiple
              hidden
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={onGenerator || tabForms.length === 0}
              onClick={() => exportForms(tabForms)}
              className="bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              Export collection ({onGenerator ? 0 : tabForms.length})
            </button>
          </div>
        </div>
      </div>

      {onGenerator ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t) => {
            const isPicked = pickedSeeds.has(t.seed);
            return (
              <div
                key={t.seed}
                role="button"
                tabIndex={0}
                onClick={() => setEditing({ seed: t.seed })}
                onKeyDown={(e) => e.key === "Enter" && setEditing({ seed: t.seed })}
                className={`group relative aspect-square cursor-pointer bg-white p-4 transition-shadow ${
                  isPicked ? "ring-2 ring-black" : "hover:shadow-md"
                }`}
              >
                <div
                  className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: t.svg }}
                />
                <span className="absolute bottom-2 left-3 text-xs text-black/40">
                  {t.seed}
                </span>
                <button
                  type="button"
                  aria-label={isPicked ? "Unpick" : "Pick"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(t.seed);
                  }}
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                    isPicked
                      ? "bg-black text-white"
                      : "border border-black/25 text-transparent hover:border-black/60 hover:text-black/40"
                  }`}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      ) : tabForms.length === 0 ? (
        <p className="text-sm text-black/50">
          Nothing in {tab} yet — pick tiles on the Generator tab and add them, or
          save from the editor into this collection.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tabForms.map((f) => (
            <div
              key={f.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing({ seed: f.seed, form: f })}
              onKeyDown={(e) => e.key === "Enter" && setEditing({ seed: f.seed, form: f })}
              className="group relative aspect-square cursor-pointer bg-white p-4 hover:shadow-md"
            >
              <div
                className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: savedSvg(f) }}
              />
              <span className="absolute bottom-2 left-3 text-xs text-black/40">
                {tab === FESTIVAL_COLLECTION && claimedBy.get(f.id)
                  ? `chosen by ${claimedBy.get(f.id)}`
                  : `${f.seed} · v${f.version}`}
              </span>
              {!(tab === FESTIVAL_COLLECTION && claimedBy.get(f.id)) && (
                <button
                  type="button"
                  aria-label="Delete saved form"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tab === FESTIVAL_COLLECTION) {
                      void removeLogo(f.id).then((r) => {
                        if (r.error) window.alert(r.error);
                        return refreshLogos();
                      });
                    } else {
                      setSaved((prev) => prev.filter((s) => s.id !== f.id));
                    }
                  }}
                  className="absolute top-2 right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm text-white group-hover:flex"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Editor
          key={editing.form?.id ?? `seed-${editing.seed}`}
          seed={editing.seed}
          color={color}
          opts={opts}
          initial={editing.form}
          title={
            editing.form
              ? `Saved form ${editing.form.seed} · v${editing.form.version}`
              : `Seed ${editing.seed} · new`
          }
          collections={collections}
          collection={collection}
          onCollectionChange={pickCollection}
          onSave={saveForm}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
