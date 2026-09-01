/**
 * Outgoing mail, through Resend — the same account that already carries the
 * sign-in emails (docs/email-sending.md). Plain fetch, no SDK: one endpoint,
 * one shape. Not a "use server" module; callers prove their caller first.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** filename + base64 content, straight through to Resend. */
  attachments?: { filename: string; content: string }[];
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
      ...(input.attachments?.length ? { attachments: input.attachments } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `The email could not be sent: ${text || res.status}` };
  }
  return {};
}

/**
 * The house envelope, cut after The Fibre's: a letter-spaced title over a
 * white card on the cream ground, the wordmark up top, and a footer that
 * says whose letter it is. Content goes in the card; everything around it
 * is the same for every mail the site sends.
 */
export function emailShell(input: { title: string; bodyHtml: string }): string {
  const site = "https://www.festivaloftrust.com";
  return `
  <div style="background:#feecd2;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#181717">
    <div style="max-width:520px;margin:0 auto">
      <div style="text-align:center;padding-bottom:20px">
        <img src="${site}/email/festival-of-trust.png" alt="Festival of Trust" width="140" style="width:140px;height:auto">
      </div>
      <div style="background:#ffffff;border-radius:16px;padding:32px 28px">
        <p style="margin:0 0 18px;letter-spacing:.14em;font-size:12px;font-weight:bold;color:#077c4c">${input.title.toUpperCase()}</p>
        ${input.bodyHtml}
        <p style="margin:22px 0 0;color:#181717">&mdash; Festival of Trust</p>
      </div>
      <div style="border-top:1px solid #e3d3ba;margin-top:28px;padding-top:18px;text-align:center;font-size:13px;color:#7a6f61">
        <p style="margin:0 0 10px">
          <a href="${site}/about" style="color:#7a6f61">About</a> &middot;
          <a href="${site}/contact" style="color:#7a6f61">Contact</a> &middot;
          <a href="${site}/privacy" style="color:#7a6f61">Privacy</a>
        </p>
        <p style="margin:0 0 8px;font-size:12px">To make sure our emails arrive, please add <a href="mailto:hello@festivaloftrust.com" style="color:#7a6f61">hello@festivaloftrust.com</a> to your contacts.</p>
        <p style="margin:0;font-size:12px">Festival of Trust &middot; an initiative of Solidarity Lab B.V. &middot; Rotterdam, The Netherlands</p>
      </div>
    </div>
  </div>`;
}
