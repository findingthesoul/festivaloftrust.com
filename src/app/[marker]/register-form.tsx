"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { register, type RegisterState } from "./actions";

/**
 * Registration without leaving the page: the form hands the submission to
 * The Thread behind the scenes and answers right here. The request id is
 * minted once per visit, so pressing the button twice — or retrying after a
 * network hiccup — lands as one registration.
 */
export function RegisterForm({
  marker,
  requiresApproval,
}: {
  marker: string;
  requiresApproval: boolean;
}) {
  // Minted after mount, straight into the uncontrolled input, so the server
  // and the browser never disagree about a rendered value. The action mints
  // its own if this is still empty — only the retry-idempotency is lost
  // then, not the submit.
  const idInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (idInput.current && !idInput.current.value) {
      idInput.current.value = crypto.randomUUID();
    }
  }, []);
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    (prev, formData) => register(marker, prev, formData),
    { status: "idle" },
  );

  if (state.status === "done") {
    return (
      <div>
        <h2 className="text-xl font-bold">You&rsquo;re in</h2>
        <p className="mt-3 leading-relaxed text-pretty">
          {requiresApproval
            ? "Your registration is with the organisers — they confirm by email."
            : "That's it. A confirmation is on its way to your inbox."}
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <h2 className="text-xl font-bold">Register</h2>
      <p className="text-ink/60 mt-1 text-sm">
        Free, as every Festival of Trust is.
      </p>

      <input ref={idInput} type="hidden" name="request_id" defaultValue="" />

      <label htmlFor="reg-name" className="text-ink/80 mt-5 block text-sm font-medium">
        Name
      </label>
      <input
        id="reg-name"
        name="name"
        required
        autoComplete="name"
        className="border-ink/20 focus:border-ink mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 outline-none"
      />

      <label htmlFor="reg-email" className="text-ink/80 mt-4 block text-sm font-medium">
        Email
      </label>
      <input
        id="reg-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="border-ink/20 focus:border-ink mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 outline-none"
      />

      <label className="mt-4 flex items-start gap-2.5 text-sm">
        <input type="checkbox" name="policy" required className="mt-0.5" />
        <span>
          I agree to the{" "}
          <Link
            href="/privacy"
            className="underline decoration-2 underline-offset-4"
          >
            privacy statement
          </Link>
          .
        </span>
      </label>

      {state.status === "error" && (
        <p className="mt-4 text-sm text-red-700">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green text-cream mt-5 w-full rounded-lg px-7 py-3.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
