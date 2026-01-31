import { Resend } from "resend";
import nodemailer from "nodemailer";

export type EmailProvider = "resend" | "mailpit";

export type SendEmailArgs = {
  from: string;
  to: string | Array<string>;
  subject: string;
  html: string;
  text?: string;
};

function getEmailProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER;
  if (configured === "resend" || configured === "mailpit") {
    return configured;
  }

  // Safe default: use Mailpit in dev, Resend otherwise.
  return process.env.NODE_ENV === "development" ? "mailpit" : "resend";
}

export async function sendEmail(args: SendEmailArgs) {
  const provider = getEmailProvider();

  if (provider === "mailpit") {
    const host = process.env.MAILPIT_HOST ?? "localhost";
    const port = Number(process.env.MAILPIT_PORT ?? "1025");
    const user = process.env.MAILPIT_USER ?? "";
    const pass = process.env.MAILPIT_PASS ?? "";

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ...(user && pass
        ? {
            auth: {
              user,
              pass,
            },
          }
        : {}),
    });

    const info = await transport.sendMail({
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });

    return {
      provider,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);
  const data = await resend.emails.send({
    from: args.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });

  return { provider, ...data };
}
