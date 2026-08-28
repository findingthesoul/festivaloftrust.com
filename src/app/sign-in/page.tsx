import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await currentUser()) redirect("/festivals");
  const { error, next } = await searchParams;

  // Only same-site paths. `next` arrives in a URL anyone can craft, and an
  // absolute one would turn the sign-in screen into an open redirect.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  const message =
    error === "link_expired"
      ? "That link has expired. Ask for a new code."
      : error === "no_session"
        ? "That sign-in did not complete. Try again."
        : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Sign in
      </h1>
      <p className="mt-6 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        For organisers planning a Festival of Trust.
      </p>
      {message && (
        <p className="border-yellow bg-yellow/10 mt-8 max-w-sm border-l-4 p-3 text-sm">
          {message}
        </p>
      )}
      <SignInForm next={safeNext} />
    </main>
  );
}
