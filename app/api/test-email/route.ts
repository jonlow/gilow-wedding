import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  try {
    const previewText = "This is a HTML rendering test for your wedding email.";
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Wedding Email Test</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f5f3;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f5f3;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(17, 24, 39, 0.08);">
            <tr>
              <td style="padding:32px 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Wedding Email HTML Test</h1>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">Here’s a quick visual check for colors, typography, and button rendering across clients.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                  <tr>
                    <td align="center" bgcolor="#b45309" style="border-radius:999px;">
                      <a href="https://example.com" target="_blank" style="display:inline-block;padding:14px 28px;font-size:16px;line-height:1;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">Cross-Client Safe Test Button</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Tip: If the button looks off, check border radius, padding, and background color.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#6b7280;font-size:12px;line-height:1.6;">
                Sent via Resend • HTML preview test
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "delivered+user1@resend.dev",
      subject: "Wedding HTML render test",
      text: previewText,
      html,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
