import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates/invitation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";

type SendInvitePayload = {
  token: string;
  guestId: Id<"guests">;
  name: string;
  email: string;
  slug: string;
  plusOne?: string;
  buttonLink?: string;
};

function getInviteNames(name: string, plusOne?: string) {
  const primaryName = name.trim();
  const plusOneName = plusOne?.trim();
  return plusOneName ? `${primaryName} & ${plusOneName}` : primaryName;
}

export async function GET() {
  try {
    const { html, previewText } = invitationEmail({
      names: "Name & Name",
      buttonLink: "https://belandjon.com",
    });

    const data = await sendEmail({
      from: "howdy@belandjon.com",
      to: "jon@avenue.studio",
      subject: "💛 We're so excited to invite you to our wedding. 💛",
      text: previewText,
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
    const plusOne = payload.plusOne?.trim();
    const names = getInviteNames(payload.name, plusOne);
    const normalizedSlug = payload.slug.replace(/^\/+/, "");
    const buttonLink =
      payload.buttonLink?.trim() ||
      `${new URL(request.url).origin}/${normalizedSlug}`;

    const { html, previewText } = invitationEmail({
      names,
      buttonLink,
    });

    const emailResult = await sendEmail({
      from: "howdy@belandjon.com",
      to: payload.email,
      subject: "💛 We're so excited to invite you to our wedding. 💛",
      text: previewText,
      html,
    });

    await fetchMutation(api.guests.markInviteSent, {
      token: payload.token,
      guestId: payload.guestId,
    });

    return NextResponse.json({ ok: true, emailResult });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
