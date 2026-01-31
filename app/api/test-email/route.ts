import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates/invitation";

export const runtime = "nodejs";

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
