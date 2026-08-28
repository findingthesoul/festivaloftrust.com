"use client";

import { useActionState } from "react";
import { submitApplication, type ApplyState } from "./actions";

const initial: ApplyState = { status: "idle" };
const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";

export function ApplyForm() {
  const [state, action, pending] = useActionState(submitApplication, initial);

  return (
    <form action={action} className="mt-10 max-w-lg space-y-6">
      <div>
        <label htmlFor="full_name" className="font-medium">
          Your name
        </label>
        <input id="full_name" name="full_name" required className={field} />
      </div>
      <div>
        <label htmlFor="organisation" className="font-medium">
          Community or organisation{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <input id="organisation" name="organisation" className={field} />
      </div>
      <div>
        <label htmlFor="phone" className="font-medium">
          Telephone{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={field} />
      </div>
      <div>
        <label htmlFor="address" className="font-medium">
          Address{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <textarea id="address" name="address" rows={3} autoComplete="street-address" className={field} />
      </div>
      <div>
        <label htmlFor="reason" className="font-medium">
          Where would you host it, and why there?{" "}
          <span className="text-ink/50 font-normal">(optional)</span>
        </label>
        <textarea id="reason" name="reason" rows={5} className={field} />
      </div>

      {state.status === "error" && <p className="text-red text-sm">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-green text-cream px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send application"}
      </button>
    </form>
  );
}
