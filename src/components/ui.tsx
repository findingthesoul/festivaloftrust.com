"use client";

/**
 * The shapes every app screen is built from.
 *
 * Written down once because the planner had grown three ways of drawing a
 * field and two of drawing a button, and consistency is most of what makes
 * software feel finished. The Thread's own edit dialog is the reference:
 * white surfaces, soft corners, a label above every control, and a single
 * action bar with the destructive thing on the left and Cancel and Save on
 * the right.
 *
 * Class strings rather than wrapper components where a wrapper would only
 * forward props — a styled <input> nobody can pass `min` to is worse than a
 * class name.
 */

export const card = "rounded-xl border border-ink/12 bg-white/70";

export const input =
  "w-full rounded-lg border border-ink/20 bg-white px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-ink/35 focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.06]";

export const label = "block text-sm font-medium text-ink/80";

export const primary =
  "rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-40";

export const secondary =
  "rounded-lg border border-ink/20 px-4 py-2.5 text-sm transition-colors hover:border-ink/40 disabled:opacity-40";

export const quiet =
  "rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:text-ink disabled:opacity-40";

/** A label, its control, and an optional hint under it. */
export function Field({
  label: text,
  htmlFor,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={label} htmlFor={htmlFor}>
        {text}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-ink/50 mt-1.5 text-sm leading-snug text-pretty">{hint}</p>}
    </div>
  );
}

/**
 * A switch, for settings that are on or off.
 *
 * A real checkbox underneath, styled out of the way: it keeps the keyboard
 * behaviour, the label association and the form value, which a div with an
 * onClick would each have to reimplement and usually only reimplements two of.
 */
export function Toggle({
  name,
  defaultChecked,
  title,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  hint?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start justify-between gap-6 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {hint && <span className="text-ink/55 mt-0.5 block text-sm leading-snug">{hint}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="bg-ink/15 peer-checked:bg-green peer-focus-visible:ring-ink/25 block h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-4" />
        <span className="pointer-events-none absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/**
 * The action bar.
 *
 * Sticks to the bottom, because these forms are longer than a screen and the
 * answer to "where is Save" should never be "scroll". Present only when there
 * is something to do — a button that is always there and usually does nothing
 * teaches people to ignore it.
 */
export function ActionBar({
  show,
  children,
  left,
}: {
  show: boolean;
  children: React.ReactNode;
  left?: React.ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="bg-background/90 border-ink/12 sticky bottom-0 z-10 -mx-5 mt-8 flex items-center gap-3 border-t px-5 py-4 backdrop-blur sm:-mx-7 sm:px-7">
      {left}
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </div>
  );
}
