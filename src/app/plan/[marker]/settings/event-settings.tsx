"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "./actions";
import type { Festival } from "@/lib/festivals";

const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";
const label = "block text-sm font-medium";

/**
 * The event, as the public will meet it.
 *
 * Every field here is a column on The Thread's `thread_thread`, kept on the
 * festival as well because a festival is planned before it has a page. Saving
 * writes both.
 */
export function EventSettings({ festival }: { festival: Festival }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) =>
        start(async () => {
          const result = await saveSettings(festival.marker, formData);
          setError(result.error ?? null);
          setNote(result.error ? null : "Saved");
        })
      }
    >
      <h2 className="text-xl font-bold">The event</h2>
      <p className="text-ink/60 mt-1 text-sm">
        {festival.thread_id
          ? "Changes here also change the public page."
          : "Kept until the festival is published, then carried to its public page."}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="name">
            Title
          </label>
          <input id="name" name="name" required defaultValue={festival.name} className={field} />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="summary">
            Description
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={4}
            defaultValue={festival.summary ?? ""}
            className={field}
            placeholder="What this festival is, in a few lines."
          />
        </div>

        <div>
          <label className={label} htmlFor="starts_on">
            Date
          </label>
          {/* One day. The Thread is told the end is the start rather than
              asking a question a Festival of Trust never has two answers to. */}
          <input
            id="starts_on"
            name="starts_on"
            type="date"
            defaultValue={festival.starts_on ?? ""}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="place">
            Place
          </label>
          <input
            id="place"
            name="place"
            defaultValue={festival.place ?? ""}
            className={field}
            placeholder="City"
          />
        </div>

        <div>
          <label className={label} htmlFor="timezone">
            Timezone
          </label>
          <input
            id="timezone"
            name="timezone"
            defaultValue={festival.timezone}
            className={field}
            placeholder="Europe/Amsterdam"
          />
        </div>

        <div>
          <label className={label} htmlFor="language">
            Language
          </label>
          <select id="language" name="language" defaultValue={festival.language} className={field}>
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div>
          <label className={label} htmlFor="capacity">
            Places
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={festival.capacity ?? ""}
            className={field}
            placeholder="No limit"
          />
        </div>

        <div>
          <label className={label} htmlFor="public_interaction">
            Opening it
          </label>
          <select
            id="public_interaction"
            name="public_interaction"
            defaultValue={festival.public_interaction}
            className={field}
          >
            <option value="page">Its own page</option>
            <option value="popup">A popup, with enrolment</option>
          </select>
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium">Registration</legend>
        <div className="mt-3 space-y-3">
          <Check
            name="requires_approval"
            defaultChecked={festival.requires_approval}
            title="People apply, and we admit them"
            hint="Off means anyone can enrol straight away."
          />
          <Check
            name="is_public_listed"
            defaultChecked={festival.is_public_listed}
            title="List it publicly"
            hint="Unlisted festivals stay reachable by their direct link."
          />
          <Check
            name="share_participants_public"
            defaultChecked={festival.share_participants_public}
            title="Show who is coming, publicly"
            hint="Visitors' names on the public page."
          />
          <Check
            name="share_participants_participants"
            defaultChecked={festival.share_participants_participants}
            title="Let participants see each other"
            hint="Only people who registered."
          />
        </div>
      </fieldset>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-green text-cream px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {note && <span className="text-ink/60 text-sm">{note}</span>}
      </div>
      {error && <p className="mt-3 max-w-xl text-sm text-red-700">{error}</p>}
    </form>
  );
}

function Check({
  name,
  defaultChecked,
  title,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-green mt-1 size-4 shrink-0"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-ink/60 block text-sm">{hint}</span>
      </span>
    </label>
  );
}
