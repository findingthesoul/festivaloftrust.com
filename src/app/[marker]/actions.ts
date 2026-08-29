"use server";

import { liveFestival, registerAttendee } from "@/lib/festivals";

export type RegisterState = {
  status: "idle" | "done" | "error";
  message?: string;
};

/**
 * The registration, from the form on the event page. A public endpoint, so
 * nothing the form claims is taken on trust: the festival is resolved live
 * by its marker (a draft cannot be registered for, even by its own team —
 * there is no active thread behind it), and every field is re-checked here.
 */
export async function register(
  marker: string,
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const festival = await liveFestival(marker);
  if (!festival) {
    return { status: "error", message: "This festival is not open for registration." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name) return { status: "error", message: "Tell us your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "That does not look like an email address." };
  }
  if (formData.get("policy") === null) {
    return {
      status: "error",
      message: "Registering needs your agreement to the privacy statement.",
    };
  }

  // Minted by the form once, so a retried submit lands as one registration.
  const requestId = String(formData.get("request_id") ?? "");
  const r = await registerAttendee(festival, {
    name,
    email,
    requestId: requestId.length >= 8 ? requestId : crypto.randomUUID(),
  });
  if (r.error) return { status: "error", message: r.error };
  return { status: "done" };
}
