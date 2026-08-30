"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "./actions";
import { ActionBar, Field, Toggle, input, primary, quiet } from "@/components/ui";
import { MarkerField } from "./marker-field";
import type { Festival } from "@/lib/festivals";
import type { FibreThreadTemplate } from "@/lib/fibre";

/**
 * The event, as the public will meet it.
 *
 * Every field here is a column on The Thread's `thread_thread`, kept on the
 * festival as well because a festival is planned before it has a page. Saving
 * writes both.
 */
export function EventSettings({
  festival,
  templates,
  templatesProblem,
}: {
  festival: Festival;
  templates: FibreThreadTemplate[];
  /** Why there is nothing to choose from, when there is nothing. */
  templatesProblem?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  // Held so the address can suggest alternatives from the title being typed,
  // rather than the one that was saved.
  const [title, setTitle] = useState(festival.name);

  return (
    <form
      // Remount when the saved data changes.
      //
      // React resets a form whose action is a function once that action
      // resolves, so every uncontrolled field snaps back to the defaultValue
      // it FIRST rendered with. router.refresh() fetches the new row, but an
      // input that is already mounted never picks up a changed defaultValue —
      // so a save that worked looked like one that reverted, and only a manual
      // reload showed the truth.
      //
      // updated_at is bumped by a trigger on every write, so a new value here
      // means genuinely new data, and the remount carries it into the fields.
      // Keyed on that rather than on the fields themselves: listing them would
      // be a second copy of the form's shape, kept in step by hand.
      key={festival.updated_at}
      // Any change anywhere counts. Comparing every field against its default
      // would be more precise and would also be a second copy of the form's
      // shape, kept in step by hand.
      onInput={() => setDirty(true)}
      onChange={() => setDirty(true)}
      onReset={() => {
        setDirty(false);
        setError(null);
      }}
      action={(formData) =>
        start(async () => {
          const result = await saveSettings(festival.marker, formData);
          setError(result.error ?? null);
          if (!result.error) {
            setDirty(false);
            setSaved(true);
            // The server action runs inside this closure rather than being the
            // form's action directly, so Next does not re-render the route on
            // its own — revalidatePath marks the cache stale and nothing asks
            // for it again. Without this the form keeps showing the values it
            // first loaded with, and a save that worked looks like one that
            // did not. Every other form here already does this; this one was
            // the exception.
            router.refresh();
          }
        })
      }
    >
      <h2 className="text-xl font-bold">The event</h2>
      <p className="text-ink/55 mt-1 text-sm">
        {festival.thread_id
          ? "Changes here also change the public page."
          : "Kept until the festival is published, then carried to its public page."}
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <Field label="Title" htmlFor="name" className="sm:col-span-2">
          <input
            id="name"
            name="name"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={input}
          />
        </Field>

        <MarkerField current={festival.marker} title={title} />

        <Field
          label="Description"
          htmlFor="summary"
          className="sm:col-span-2"
          hint="Formatting works: **bold**, *italic*, [link](https://…), ## heading, - list."
        >
          <textarea
            id="summary"
            name="summary"
            rows={4}
            defaultValue={festival.summary ?? ""}
            className={input}
            placeholder="What this festival is, in a few lines."
          />
        </Field>

        <Field
          label="About the organisers"
          htmlFor="organiser_note"
          className="sm:col-span-2"
          hint="Shown on the event page: who is behind this festival. Same formatting as the description."
        >
          <textarea
            id="organiser_note"
            name="organiser_note"
            rows={3}
            defaultValue={festival.organiser_note ?? ""}
            className={input}
            placeholder="Who you are, in a few lines — the neighbours, the school, the team hosting this day."
          />
        </Field>

        {/* One day. The Thread is told the end is the start, rather than asking
            a question a Festival of Trust never has two answers to. */}
        <Field label="Date" htmlFor="starts_on">
          <input
            id="starts_on"
            name="starts_on"
            type="date"
            defaultValue={festival.starts_on ?? ""}
            className={input}
          />
        </Field>

        <Field label="Place" htmlFor="place">
          <input
            id="place"
            name="place"
            defaultValue={festival.place ?? ""}
            className={input}
            placeholder="City"
          />
        </Field>

        <Field label="Timezone" htmlFor="timezone">
          <input
            id="timezone"
            name="timezone"
            defaultValue={festival.timezone}
            className={input}
            placeholder="Europe/Amsterdam"
          />
        </Field>

        <Field label="Language" htmlFor="language">
          <select id="language" name="language" defaultValue={festival.language} className={input}>
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </Field>

        {/*
          Offered only before the festival has a page. A template lays down the
          event's items when the page is created; choosing a different one
          afterwards would duplicate them or do nothing, so the honest thing is
          not to offer it. The page above says what was chosen once it is set.
        */}
        {/*
          One block, every case. Split across three conditions this had a hole
          in it — a published festival with an empty template list matched none
          of them and rendered nothing at all, which is the silence this was
          supposed to end. If there is a reason there is no choice, say it.
        */}
        <Field
          label="Structure"
          htmlFor={!festival.thread_id && templates.length > 0 ? "thread_template_id" : undefined}
          hint={
            !festival.thread_id && templates.length > 0
              ? "The shape the event starts from. You fill in the content afterwards."
              : undefined
          }
        >
          {festival.thread_id ? (
            <p className="text-ink/70 py-2 text-sm">
              {templates.find((t) => t.id === festival.thread_template_id)?.title ??
                (festival.thread_template_id
                  ? "A structure that is no longer listed"
                  : "Started from an empty page")}
              <span className="text-ink/45 block text-xs">
                Settled when the page was created, so it cannot be changed now.
                {templatesProblem ? ` (${templatesProblem})` : ""}
              </span>
            </p>
          ) : templates.length > 0 ? (
            <select
              id="thread_template_id"
              name="thread_template_id"
              defaultValue={festival.thread_template_id ?? templates[0]?.id ?? ""}
              className={input}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} — {t.item_count} item{t.item_count === 1 ? "" : "s"}
                  {t.sends_messages ? ", sends messages" : ""}
                </option>
              ))}
              <option value="">Start empty</option>
            </select>
          ) : (
            <p className="text-ink/45 py-2 text-sm">
              Nothing to choose from — {templatesProblem ?? "no structures found"}.
              The event will start from an empty page.
            </p>
          )}
        </Field>

        <Field label="Places" htmlFor="capacity" hint="Leave empty for no limit.">
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={festival.capacity ?? ""}
            className={input}
          />
        </Field>

        <Field label="Opening it" htmlFor="public_interaction">
          <select
            id="public_interaction"
            name="public_interaction"
            defaultValue={festival.public_interaction}
            className={input}
          >
            <option value="page">Its own page</option>
            <option value="popup">A popup, with enrolment</option>
          </select>
        </Field>
      </div>

      <fieldset className="border-ink/12 mt-8 border-t pt-2">
        <legend className="sr-only">Registration</legend>
        <div className="divide-ink/10 divide-y">
          <Toggle
            name="requires_approval"
            defaultChecked={festival.requires_approval}
            title="People apply, and we admit them"
            hint="Off means anyone can enrol straight away."
          />
          <Toggle
            name="is_public_listed"
            defaultChecked={festival.is_public_listed}
            title="List it publicly"
            hint="Unlisted festivals stay reachable by their direct link."
          />
          <Toggle
            name="show_public_agenda"
            defaultChecked={festival.show_public_agenda}
            title="Show the public agenda"
            hint="The programme from the agenda section below, on the event page."
          />
          <Toggle
            name="share_participants_public"
            defaultChecked={festival.share_participants_public}
            title="Show who is coming, publicly"
            hint="Visitors' names on the public page."
          />
          <Toggle
            name="share_participants_participants"
            defaultChecked={festival.share_participants_participants}
            title="Let participants see each other"
            hint="Only people who registered."
          />
        </div>
      </fieldset>

      {saved && !dirty && <p className="text-green mt-6 text-sm font-medium">Saved</p>}
      {error && <p className="mt-6 max-w-xl text-sm text-red-700">{error}</p>}

      <ActionBar show={dirty || pending}>
        <button type="reset" disabled={pending} className={quiet}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Saving…" : "Save"}
        </button>
      </ActionBar>
    </form>
  );
}
