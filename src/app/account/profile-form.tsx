"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "./actions";
import { ActionBar, Field, input, primary, quiet } from "@/components/ui";

export function ProfileForm({
  profile,
}: {
  profile: {
    full_name: string | null;
    organisation: string | null;
    phone: string | null;
    address: string | null;
  };
}) {
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onInput={() => setDirty(true)}
      onChange={() => setDirty(true)}
      onReset={() => {
        setDirty(false);
        setError(null);
      }}
      action={(formData) =>
        start(async () => {
          const result = await saveProfile(formData);
          setError(result.error ?? null);
          if (!result.error) {
            setDirty(false);
            setSaved(true);
          }
        })
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="full_name" className="sm:col-span-2">
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
            className={input}
          />
        </Field>

        <Field
          label="Community or organisation"
          htmlFor="organisation"
          hint="Who you are hosting with."
        >
          <input
            id="organisation"
            name="organisation"
            defaultValue={profile.organisation ?? ""}
            className={input}
          />
        </Field>

        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" defaultValue={profile.phone ?? ""} className={input} />
        </Field>

        <Field label="Address" htmlFor="address" className="sm:col-span-2">
          <textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={profile.address ?? ""}
            className={input}
          />
        </Field>
      </div>

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
