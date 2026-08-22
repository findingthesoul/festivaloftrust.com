"use client";

import { useActionState } from "react";
import { requestAccess, type JoinState } from "./actions";

const initial: JoinState = { status: "idle" };

const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";

export function JoinForm() {
  const [state, action, pending] = useActionState(requestAccess, initial);

  if (state.status === "ok" || state.status === "already") {
    return (
      <div className="border-green/30 bg-green/5 mt-10 border p-6">
        <h2 className="text-xl font-bold">Request received</h2>
        <p className="mt-3 leading-relaxed text-pretty">
          Your request is with us. Someone reviews it by hand — this is a
          movement built on trust, so we would rather meet you than let a form
          decide. You will hear from us by email.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 max-w-lg space-y-6">
      <div>
        <label htmlFor="full_name" className="font-medium">
          Your name
        </label>
        <input id="full_name" name="full_name" className={field} required />
        {state.fieldErrors?.full_name && (
          <p className="text-red mt-1 text-sm">{state.fieldErrors.full_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" className={field} required />
        {state.fieldErrors?.email && (
          <p className="text-red mt-1 text-sm">{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="organisation_name" className="font-medium">
          Community or organisation{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <input id="organisation_name" name="organisation_name" className={field} />
      </div>

      <div>
        <label htmlFor="reason" className="font-medium">
          Where would you host it, and why there?{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <textarea id="reason" name="reason" rows={4} className={field} />
      </div>

      {state.status === "error" && (
        <p className="text-red text-sm">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green px-6 py-3 font-medium text-cream transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Request access"}
      </button>
    </form>
  );
}
