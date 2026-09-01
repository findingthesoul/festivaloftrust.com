"use server";

import { revalidatePath } from "next/cache";
import { accessTo, festivalByMarker } from "@/lib/festivals";
import { approveEnrolment, declineEnrolment, FibreError } from "@/lib/fibre";

/**
 * The organiser's decision on an application. Reviewing is an organiser's
 * authority, not a host's — the same line the money draws. The platform
 * enforces ownership again on its side (source_app), so a foreign id dies
 * there rather than needing a lookup here.
 */
async function organiserOf(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.role === "organiser" ? festival : null;
}

export async function admit(
  marker: string,
  enrolmentRowId: string,
): Promise<{ error?: string }> {
  if (!(await organiserOf(marker))) return { error: "not yours to decide" };
  try {
    await approveEnrolment(enrolmentRowId);
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
  revalidatePath(`/plan/${marker}/registrations`);
  return {};
}

export async function turnAway(
  marker: string,
  enrolmentRowId: string,
): Promise<{ error?: string }> {
  if (!(await organiserOf(marker))) return { error: "not yours to decide" };
  try {
    await declineEnrolment(enrolmentRowId);
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
  revalidatePath(`/plan/${marker}/registrations`);
  return {};
}

/**
 * Send (or send again) a guest's ticket by email: the festival, the date,
 * the QR — The Thread's own code, so the door speaks one language — and,
 * when the site knows this guest, the link to their ticket page. Any of the
 * festival's people may send it; handing someone their own ticket is door
 * work, not a decision.
 */
export async function resendTicket(
  marker: string,
  guest: { email: string; name: string; attendeeId: string | null },
): Promise<{ error?: string }> {
  const festival = await festivalByMarker(marker);
  if (!festival) return { error: "not found" };
  if (!(await accessTo(festival))) return { error: "not yours" };
  if (!guest.email) return { error: "this guest has no email address" };

  const { registrations } = await import("@/lib/festivals");
  const { sendEmail } = await import("@/lib/email");

  const findCode = async () => {
    const rows = await registrations(festival);
    const mine = rows.find(
      (e) => (e.email ?? "").toLowerCase() === guest.email.toLowerCase(),
    );
    return { found: !!mine, code: mine?.checkin_code ?? null };
  };

  let code: string | null = null;
  // Which half fails matters: a row without a code and no row at all are
  // different diagnoses, and the amber note below names the one that hit.
  let codeGap: string | null = null;
  try {
    let { found, code: c } = await findCode();
    // Sending a ticket to someone the platform does not know means the
    // organiser wants them as a guest — so enrol them, which is where the
    // check-in code is born. A guest declined earlier comes back as one
    // awaiting the decision again, never silently admitted.
    if (!found) {
      const { registerAttendee } = await import("@/lib/festivals");
      const made = await registerAttendee(festival, {
        name: guest.name,
        email: guest.email,
        requestId: crypto.randomUUID(),
      });
      if (made.error) {
        codeGap = `this guest has no enrolment, and enrolling them failed: ${made.error}`;
      } else {
        ({ found, code: c } = await findCode());
      }
    }
    code = c;
    if (!code && !codeGap) {
      codeGap = found
        ? "the platform lists this enrolment without a check-in code — its listing may predate the door build"
        : "no platform enrolment carries this email address";
    }
  } catch (e) {
    codeGap = `the platform listing failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  const fibreBase = process.env.FIBRE_API_URL ?? "https://thefibre-api.fly.dev";
  const ticketUrl = guest.attendeeId
    ? `https://www.festivaloftrust.com/${festival.marker}/ticket/${guest.attendeeId}`
    : null;
  if (!code && !ticketUrl) {
    return { error: "no ticket exists for this guest yet" };
  }

  // The QR rides along as a real attachment (inline images are stripped or
  // hidden by plenty of mail clients), and the wallet passes are offered
  // exactly when the platform actually serves them — a button that 503s is
  // worse than no button.
  const base = code ? `${fibreBase}/api/v1/thread/public/checkin/${code}` : null;
  let qrAttachment: { filename: string; content: string } | null = null;
  let appleUrl: string | null = null;
  let googleUrl: string | null = null;
  if (base) {
    try {
      const img = await fetch(`${base}/qr.png`, { cache: "no-store" });
      if (img.ok) {
        qrAttachment = {
          filename: "festival-of-trust-ticket.png",
          content: Buffer.from(await img.arrayBuffer()).toString("base64"),
        };
      }
    } catch {}
    const offered = async (path: string) => {
      try {
        const r = await fetch(`${base}/${path}`, {
          method: "HEAD",
          cache: "no-store",
          redirect: "manual",
        });
        return r.status < 400 ? `${base}/${path}` : null;
      } catch {
        return null;
      }
    };
    [appleUrl, googleUrl] = await Promise.all([
      offered("apple.pkpass"),
      offered("google"),
    ]);
  }

  const when = festival.starts_on
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(festival.starts_on))
    : null;

  const { emailShell } = await import("@/lib/email");
  const html = emailShell({
    title: `Your ticket \u2014 ${festival.name}`,
    bodyHtml: `
      <p style="margin:0 0 14px">Hi ${guest.name},</p>
      <p style="margin:0 0 18px">Here is your ticket for <b>${festival.name}</b>${when ? ` on ${when}` : ""}${festival.place ? ` in ${festival.place}` : ""}.</p>
      ${
        code
          ? `<div style="border:1px solid #e3d3ba;border-radius:16px;padding:20px;text-align:center;margin:0 0 18px">
               <p style="margin:0 0 10px;font-size:14px;color:#7a6f61">Show this QR at the door.</p>
               <img src="${fibreBase}/api/v1/thread/public/checkin/${code}/qr.png" alt="Your check-in QR" width="240" height="240" style="max-width:100%">
             </div>`
          : ""
      }
      ${
        ticketUrl
          ? `<p style="margin:0 0 14px"><a href="${ticketUrl}" style="background:#077c4c;color:#feecd2;padding:12px 22px;text-decoration:none;font-weight:bold;display:inline-block;border-radius:8px">Open your ticket</a></p>`
          : ""
      }
      ${
        appleUrl || googleUrl
          ? `<p style="margin:0 0 14px">${appleUrl ? `<a href="${appleUrl}" style="color:#181717;margin-right:14px">Add to Apple Wallet</a>` : ""}${googleUrl ? `<a href="${googleUrl}" style="color:#181717">Add to Google Wallet</a>` : ""}</p>`
          : ""
      }
      <p style="margin:0;color:#7a6f61;font-size:13px">${qrAttachment ? "The QR is attached to this email too. " : ""}A screenshot of the QR works just as well. See you there!</p>`,
  });

  const sent = await sendEmail({
    to: guest.email,
    subject: `Your ticket — ${festival.name}`,
    html,
    attachments: qrAttachment ? [qrAttachment] : undefined,
  });
  if (sent.error) return { error: sent.error };
  // Sent, but a ticket without its QR is worth saying out loud: the
  // platform's listing gave no check-in code for this guest.
  if (!code) {
    return { error: `Sent — but without a QR: ${codeGap ?? "no check-in code found"}.` };
  }
  return {};
}
