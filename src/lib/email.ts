/**
 * Outgoing mail, through Resend — the same account that already carries the
 * sign-in emails (docs/email-sending.md). Plain fetch, no SDK: one endpoint,
 * one shape. Not a "use server" module; callers prove their caller first.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      error:
        "Email is not configured on this server — RESEND_API_KEY is missing in Vercel.",
    };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "Festival of Trust <hello@festivaloftrust.com>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `The email could not be sent: ${text || res.status}` };
  }
  return {};
}
