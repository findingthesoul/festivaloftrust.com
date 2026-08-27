"use client";

import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/client";

type Stage = "enter-email" | "enter-code";

const field =
  "mt-2 w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-base outline-none focus:border-green focus:ring-2 focus:ring-green/25";

/**
 * Email, then a code. The same two-stage shape The Fibre's apps use.
 *
 * The email carries both a link and a code, so someone who opens their mail on
 * a phone can type the code on the laptop they were already working on rather
 * than starting again there.
 */
export function SignInForm() {
  const [stage, setStage] = useState<Stage>("enter-email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await browserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Organisers are invited by being approved, not by self-registering.
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStage("enter-code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await browserSupabase().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // Full navigation, not a router push: the callback must run on the server
    // so the session cookie is written before anything reads it.
    window.location.href = "/auth/callback";
  }

  if (stage === "enter-code") {
    return (
      <form onSubmit={verifyCode} className="mt-10 max-w-sm">
        <p className="leading-relaxed text-pretty">
          We sent a code to <span className="font-medium">{email}</span>. Enter
          it below, or open the link in that email.
        </p>
        <label htmlFor="code" className="mt-6 block font-medium">
          Code from the email
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          className={field}
        />
        {error && <p className="text-red mt-2 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="bg-green text-cream mt-6 px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStage("enter-email");
            setCode("");
            setError(null);
          }}
          className="text-ink/60 hover:text-ink mt-4 block text-sm underline underline-offset-4"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="mt-10 max-w-sm">
      <label htmlFor="email" className="font-medium">
        Your email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        className={field}
      />
      {error && <p className="text-red mt-2 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="bg-green text-cream mt-6 px-6 py-3 font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send me a code"}
      </button>
      <p className="text-ink/50 mt-4 text-sm leading-relaxed text-pretty">
        No password. We email you a code that signs you in.
      </p>
    </form>
  );
}
