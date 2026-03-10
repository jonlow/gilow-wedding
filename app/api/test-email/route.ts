import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates/invitation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatGuestGreetingNames } from "@/lib/guest-display";
import { getRequestIpAddress, getRequestLocation } from "@/lib/request-ip";

export const runtime = "nodejs";
const INVITE_FROM = '"Bel & Jon" <howdy@belandjon.com>';

type SendInvitePayload = {
  token: string;
  guestId: Id<"guests">;
  name: string;
  email: string;
  slug: string;
  plusOne?: string;
  kids?: string;
  buttonLink?: string;
};

export async function GET() {
  try {
    const { html, text } = invitationEmail({
      names: "Name & Name",
      buttonLink: "https://belandjon.com",
    });

    const data = await sendEmail({
      from: INVITE_FROM,
      to: "jon@avenue.studio",
      subject: "Bel & Jon invited you to their wedding",
      text,
      html,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SendInvitePayload;
    const names = formatGuestGreetingNames(payload);
    const normalizedSlug = payload.slug.replace(/^\/+/, "");
    const buttonLink =
      payload.buttonLink?.trim() ||
      `${new URL(request.url).origin}/${normalizedSlug}`;

    const { html, text } = invitationEmail({
      names,
      buttonLink,
    });

    const emailResult = await sendEmail({
      from: INVITE_FROM,
      to: payload.email,
      subject: "Bel & Jon invited you to their wedding",
      text,
      html,
    });

    await fetchMutation(api.guests.markInviteSent, {
      token: payload.token,
      guestId: payload.guestId,
      ipAddress: getRequestIpAddress(request.headers),
      ...getRequestLocation(request.headers),
    });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
