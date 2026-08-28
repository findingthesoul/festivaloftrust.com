"use client";

import { useRouter } from "next/navigation";
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
export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
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
        emailRedirectTo: `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
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
    // verifyOtp has already written the session cookie, so this can navigate
    // straight in. /auth/callback exists for the other path — clicking the link
    // in the email — where the exchange has to happen server-side.
    router.replace(next ?? "/festivals");
    router.refresh();
  }

  if (stage === "enter-code") {
    return (
      <form onSubmit={verifyCode} className="mt-10 max-w-sm">
        <p className="leading-relaxed text-pretty">
          We sent a code to <span className="font-medium">{email}</span>. Enter
          it below, or open the link in that email.
        </p>
        {/* Worth saying plainly: this is a young sending domain, and iCloud in
            particular files it as junk until it has some history. Someone who
            never finds their code just gives up. */}
        <p className="text-ink/60 mt-3 text-sm leading-relaxed text-pretty">
          If it is not there in a minute, look in your junk or spam folder —
          especially on iCloud, Hotmail or Outlook. Marking it as not junk means
          the next one arrives properly.
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
