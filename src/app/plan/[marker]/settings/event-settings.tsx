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

        <Field label="Description" htmlFor="summary" className="sm:col-span-2">
          <textarea
            id="summary"
            name="summary"
            rows={4}
            defaultValue={festival.summary ?? ""}
            className={input}
            placeholder="What this festival is, in a few lines."
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
          Once the festival has a page the structure is settled — a template
          lays down items when the page is created, so it cannot be re-applied.
          Say what it was built from rather than showing nothing and leaving
          someone to wonder where the field went.
        */}
        {festival.thread_id && templates.length > 0 && (
          <Field label="Structure">
            <p className="text-ink/70 py-2 text-sm">
              {templates.find((t) => t.id === festival.thread_template_id)?.title ??
                "Started from an empty page"}
              <span className="text-ink/45 block text-xs">
                Settled when the page was created, so it cannot be changed now.
              </span>
            </p>
          </Field>
        )}

        {/*
          An absent field reads as a broken one. If there is nothing to choose
          from, say why — most often the key is pointed at a workspace that has
          no structures in it, which is invisible from here otherwise.
        */}
        {!festival.thread_id && templates.length === 0 && templatesProblem && (
          <Field label="Structure">
            <p className="text-ink/45 py-2 text-sm">
              Nothing to choose from — {templatesProblem}. The event will start
              from an empty page.
            </p>
          </Field>
        )}

        {!festival.thread_id && templates.length > 0 && (
          <Field
            label="Structure"
            htmlFor="thread_template_id"
            hint="The shape the event starts from. You fill in the content afterwards."
          >
            <select
              id="thread_template_id"
              name="thread_template_id"
              // A festival should start from a structure, so the first one is
              // the default rather than an empty page. Starting empty stays
              // possible, at the bottom, where an unusual choice belongs.
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
          </Field>
        )}

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
