"use client";

import { useRef, useState, useTransition } from "react";
import type { AgendaItem } from "@/lib/festivals";
import { input, primary, quiet } from "@/components/ui";
import { addAgenda, removeAgenda, saveAgenda } from "./actions";
import { WysiwygArea } from "./wysiwyg-area";

/**
 * The programme, written here and shown on the event page when the setting
 * says so. One form per item, so saving a line touches that line — an
 * organiser polishing item four should not resubmit items one to three.
 */
export function Agenda({
  marker,
  items,
  shown,
}: {
  marker: string;
  items: AgendaItem[];
  shown: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const addForm = useRef<HTMLFormElement>(null);

  const run = (work: () => Promise<{ error?: string }>) =>
    start(async () => setError((await work()).error ?? null));

  return (
    <div>
      <h2 className="text-xl font-bold">Public agenda</h2>
      <p className="text-ink/55 mt-1 text-sm">
        {shown
          ? "Shown on the event page."
          : "Written here, shown on the event page once “Show the public agenda” is on in the event settings above."}
      </p>

      {items.length > 0 && (
        <ul className="divide-ink/10 mt-6 divide-y">
          {items.map((item) => (
            <li key={item.id} className="py-5 first:pt-0">
              <form action={(fd) => run(() => saveAgenda(marker, fd))}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  name="title"
                  required
                  defaultValue={item.title}
                  aria-label="Item title"
                  className={`${input} font-medium`}
                />
                <div className="mt-2">
                  <WysiwygArea
                    id={`agenda-desc-${item.id}`}
                    name="description"
                    defaultValue={item.description ?? ""}
                    placeholder="What happens, in a line or two."
                  />
                </div>
                <div className="mt-2 flex gap-3">
                  <button type="submit" disabled={pending} className={quiet}>
                    Save item
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => removeAgenda(marker, item.id))}
                    className={quiet}
                  >
                    Remove
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={addForm}
        className="border-ink/12 mt-6 border-t pt-6"
        action={(fd) =>
          run(async () => {
            const r = await addAgenda(marker, fd);
            if (!r.error) addForm.current?.reset();
            return r;
          })
        }
      >
        <input
          name="title"
          required
          aria-label="New item title"
          placeholder="10:00 — Opening circle"
          className={`${input} font-medium`}
        />
        <div className="mt-2">
          <WysiwygArea
            id="agenda-desc-new"
            name="description"
            defaultValue=""
            placeholder="What happens, in a line or two."
          />
        </div>
        <div className="mt-3">
          <button type="submit" disabled={pending} className={primary}>
            {pending ? "Saving…" : "Add to the agenda"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 max-w-xl text-sm text-red-700">{error}</p>}
    </div>
  );
}
