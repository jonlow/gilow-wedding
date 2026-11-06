import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";
import { api } from "@/convex/_generated/api";
import { sendEmail } from "@/lib/email";
import { formatGuestGreetingNames } from "@/lib/guest-display";
import { defaultWeddingUpdateDraft, weddingUpdateEmail } from "@/lib/email-templates/wedding-update";
import { getRequestIpAddress, getRequestLocation } from "@/lib/request-ip";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("dash_session")?.value;
    if (!token || !(await fetchQuery(api.auth.validateSession, { token })).valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await request.json();
    const guests = await fetchQuery(api.guests.listGuests, { token });
    const guest = guests.find((entry) => entry._id === payload.guestId);
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    const recipients = [...new Set([guest.email, guest.secondaryEmail]
      .map((email) => email?.trim()).filter((email): email is string => Boolean(email)))];
    if (!recipients.length) {
      return NextResponse.json({ error: "Guest has no email recipients." }, { status: 400 });
    }
    const origin = new URL(request.url).origin;
    const { html, text } = weddingUpdateEmail({
      ...defaultWeddingUpdateDraft,
      names: formatGuestGreetingNames(guest),
      imageUrl: `${origin}/email/wedding-map.png`,
    });
    const result = await sendEmail({
      from: '"Bel & Jon" <howdy@belandjon.com>',
      to: recipients,
      subject: defaultWeddingUpdateDraft.subject,
      html,
      text,
    });
    if (("error" in result && result.error) ||
        ("rejected" in result && (result.rejected?.length ?? 0) > 0)) {
      return NextResponse.json({ error: "Email provider did not accept all recipients. Check delivery before retrying." }, { status: 502 });
    }
    await fetchMutation(api.guests.markUpdateSent, {
      token,
      guestId: guest._id,
      ipAddress: getRequestIpAddress(request.headers),
      ...getRequestLocation(request.headers),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send update" }, { status: 500 });
  }
}
