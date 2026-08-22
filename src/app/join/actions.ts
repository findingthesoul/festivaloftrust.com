"use server";

/**
 * Signup goes straight into The Fibre as a signup_request with status
 * 'pending'. The platform's admin approval screen is what moves it forward;
 * this app deliberately does not keep its own parallel account table.
 *
 * Called server-side rather than from the browser: no CORS to negotiate, and
 * the caller's payload is validated before it leaves us.
 */

const API = process.env.FIBRE_API_URL ?? "https://thefibre-api.fly.dev";

export type JoinState = {
  status: "idle" | "ok" | "already" | "invalid" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function requestAccess(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const organisation_name =
    String(formData.get("organisation_name") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const fieldErrors: Record<string, string> = {};
  if (!full_name) fieldErrors.full_name = "Please give your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fieldErrors.email = "Please give a valid email address.";
  }
  if (Object.keys(fieldErrors).length) {
    return { status: "invalid", fieldErrors };
  }

  try {
    const res = await fetch(`${API}/api/v1/signup-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name, email, organisation_name, reason }),
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        status: "error",
        message: "We could not reach the register just now. Please try again.",
      };
    }

    const data = (await res.json()) as { ok?: boolean; already_requested?: boolean };
    // The API answers idempotently so it never reveals whether an address is
    // already registered. Mirror that here rather than leaking it in the UI.
    return data.already_requested ? { status: "already" } : { status: "ok" };
  } catch {
    return {
      status: "error",
      message: "We could not reach the register just now. Please try again.",
    };
  }
}
