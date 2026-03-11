import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates/invitation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatGuestGreetingNames } from "@/lib/guest-display";
import { getRequestIpAddress, getRequestLocation } from "@/lib/request-ip";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "dash_session";
const INVITE_FROM = '"Bel & Jon" <howdy@belandjon.com>';

type SendInvitePayload = {
  guestId: Id<"guests">;
  name: string;
  email: string;
  secondaryEmail?: string;
  slug: string;
  plusOne?: string;
  kids?: string;
  buttonLink?: string;
};

async function requireDashSession(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const sessionToken = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(`${SESSION_COOKIE_NAME}=`.length);

  if (!sessionToken) {
    return null;
  }

  const session = await fetchQuery(api.auth.validateSession, {
    token: sessionToken,
  });

  if (!session.valid) {
    return null;
  }

  return sessionToken;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    const sessionToken = await requireDashSession(request);
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const recipients = [
      ...new Set(
        [payload.email, payload.secondaryEmail]
          .map((email) => email?.trim())
          .filter((email): email is string => Boolean(email)),
      ),
    ];

    const emailResult = await sendEmail({
      from: INVITE_FROM,
      to: recipients,
      subject: "Bel & Jon invited you to their wedding",
      text,
      html,
    });

    await fetchMutation(api.guests.markInviteSent, {
      token: sessionToken,
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
