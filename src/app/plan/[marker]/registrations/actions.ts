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

  let code: string | null = null;
  try {
    const rows = await registrations(festival);
    code =
      rows.find(
        (e) => (e.email ?? "").toLowerCase() === guest.email.toLowerCase(),
      )?.checkin_code ?? null;
  } catch {
    code = null;
  }

  const fibreBase = process.env.FIBRE_API_URL ?? "https://thefibre-api.fly.dev";
  const ticketUrl = guest.attendeeId
    ? `https://www.festivaloftrust.com/${festival.marker}/ticket/${guest.attendeeId}`
    : null;
  if (!code && !ticketUrl) {
    return { error: "no ticket exists for this guest yet" };
  }

  const when = festival.starts_on
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(festival.starts_on))
    : null;

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#181717">
      <p style="letter-spacing:.12em;font-size:12px;color:#077c4c;font-weight:bold">YOUR TICKET — ${festival.name.toUpperCase()}</p>
      <p>Hi ${guest.name},</p>
      <p>Here is your ticket for <b>${festival.name}</b>${when ? ` on ${when}` : ""}${festival.place ? ` in ${festival.place}` : ""}.</p>
      ${
        code
          ? `<div style="border:1px solid #e3d3ba;border-radius:16px;padding:20px;text-align:center;margin:20px 0">
               <p style="font-size:14px;color:#555">Show this QR at the door.</p>
               <img src="${fibreBase}/api/v1/thread/public/checkin/${code}/qr.png" alt="Your check-in QR" width="240" height="240" style="max-width:100%">
             </div>`
          : ""
      }
      ${
        ticketUrl
          ? `<p><a href="${ticketUrl}" style="background:#077c4c;color:#feecd2;padding:12px 22px;text-decoration:none;font-weight:bold;display:inline-block">Open your ticket</a></p>`
          : ""
      }
      <p style="color:#777;font-size:13px">A screenshot of the QR works just as well. See you there!</p>
      <p style="color:#777;font-size:13px">— Festival of Trust</p>
    </div>`;

  const sent = await sendEmail({
    to: guest.email,
    subject: `Your ticket — ${festival.name}`,
    html,
  });
  return sent.error ? { error: sent.error } : {};
}
