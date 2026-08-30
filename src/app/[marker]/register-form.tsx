"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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

      <label htmlFor="reg-phone" className="text-ink/80 mt-4 block text-sm font-medium">
        Phone <span className="text-ink/50 font-normal">(optional)</span>
      </label>
      <input
        id="reg-phone"
        name="phone"
        type="tel"
        autoComplete="tel"
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

/**
 * The popup way of opening it, for festivals whose settings say so: the desk
 * shows one Enrol button, and the form arrives in a dialog over the page.
 */
export function EnrolPopup({
  marker,
  requiresApproval,
}: {
  marker: string;
  requiresApproval: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2 className="text-xl font-bold">Register</h2>
      <p className="text-ink/60 mt-1 text-sm">
        Free, as every Festival of Trust is.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-green text-cream mt-5 w-full rounded-lg px-7 py-3.5 font-medium transition-opacity hover:opacity-90"
      >
        Enrol
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        >
          {/* Click-away. Sits behind the card so a click anywhere closes it. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="bg-ink/60 absolute inset-0 cursor-default backdrop-blur-sm"
          />
          <div className="bg-cream relative w-full max-w-md rounded-xl p-6 shadow-xl sm:p-8">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="text-ink/60 hover:text-ink absolute top-4 right-4 p-1 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
            <RegisterForm marker={marker} requiresApproval={requiresApproval} />
          </div>
        </div>
      )}
    </>
  );
}
