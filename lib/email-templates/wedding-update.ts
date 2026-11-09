import { formatGuestGreetingNames } from "@/lib/guest-display";

type WeddingUpdateDraft = {
  subject: string;
  previewText: string;
  names: string;
  heading: string;
  body: string;
  bodyBelowImage: string;
  signOff: string;
  imageUrl: string;
  imageAlt: string;
  inviteUrl: string;
};

const defaultWeddingUpdateDraft: WeddingUpdateDraft = {
  subject: "See you on 21 Nov! A few wedding details",
  previewText: "11am, Saturday 21 November, 5 Archer Place, Mill Park.",
  names: "friends",
  heading: "Not long now! Here are a few more details to help you on the day.",
  body: "Our wedding ceremony starts at **11am** on **Saturday 21 November** at **5 Archer Place, Mill Park 3082**.",
  bodyBelowImage:
    "You can park near Archer Place on Statesman Crescent or in nearby streets, leaving room in the cul-de-sac for the ceremony and party.\n\nWear whatever makes you feel good. We'll be mostly outdoors. Looking forward to seeing you!",
  signOff: "With love,",
  imageUrl: "", // Resolved by buildWeddingUpdateEmail for preview and delivery.
  imageAlt:
    "Wedding location map showing Archer Place, Statesman Crescent, Todman Close and Mill Park Drive",
  inviteUrl: "",
};

const address = "5 Archer Place, Mill Park 3082";
const mapUrl = "https://maps.app.goo.gl/rstVJGrRyifytLN29";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function webUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function imageUrl(value: string) {
  const trimmed = value.trim();
  // Data URLs are for local authoring only; the image must be hosted before sending.
  return /^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(
    trimmed,
  )
    ? trimmed
    : webUrl(trimmed);
}

function weddingUpdateEmail(draft: WeddingUpdateDraft) {
  const image = imageUrl(draft.imageUrl);
  const paragraphStyle = "margin:0 0 20px;font-size:16px;line-height:1.6;";
  const paragraphs = (body: string) =>
    body
      .split(/\r?\n\s*\r?\n/)
      .filter((paragraph) => paragraph.trim())
      .map(
        (paragraph) =>
          `<p class="mobile-text" style="${paragraphStyle}">${escapeHtml(
            paragraph,
          )
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(address, `<a href="${mapUrl}" style="color:#2d68b2;text-decoration:underline;">${address}</a>`)
            .replace(/\r?\n/g, "<br />")}</p>`,
      )
      .join("\n");
  const text = [
    `Hi ${draft.names}!`,
    draft.heading,
    draft.body.replace(/\*\*(.+?)\*\*/g, "$1"),
    "Here's a map to help you find us.",
    `Map: ${mapUrl}`,
    ...(image && draft.imageAlt.trim() ? [draft.imageAlt] : []),
    draft.bodyBelowImage.replace(/\*\*(.+?)\*\*/g, "$1"),
    draft.signOff,
    "Bel & Jon",
    `View your invite: ${draft.inviteUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(draft.subject)}</title>
    <style>
      @media only screen and (max-width: 700px) {
        .mobile-padding { padding-left:16px !important; padding-right:16px !important; }
        .mobile-text { font-size:14px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;color:#000000;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;">${escapeHtml(draft.previewText)}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr><td align="center" style="padding:32px 12px;">
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="700"><tr><td><![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:700px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          <tr><td class="mobile-padding" style="padding:32px 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;overflow-wrap:anywhere;">
            <p class="mobile-text" style="${paragraphStyle}">Hi ${escapeHtml(draft.names)}!</p>
            ${draft.heading.trim() ? `<p class="mobile-text" style="${paragraphStyle}">${escapeHtml(draft.heading)}</p>` : ""}
            ${paragraphs(draft.body)}
          </td></tr>
          <tr><td class="mobile-padding" style="padding:0 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
            ${paragraphs("Here's a map to help you find us.")}
          </td></tr>
          ${image ? `<tr><td class="mobile-padding" align="center" style="padding:0 32px 28px;"><img src="${escapeHtml(image)}" alt="${escapeHtml(draft.imageAlt)}" width="636" style="display:block;width:100%;max-width:636px;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>` : ""}
          <tr><td class="mobile-padding" style="padding:0 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">${paragraphs(draft.bodyBelowImage)}</td></tr>
          <tr><td class="mobile-padding" style="padding:0 32px 32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
            <p class="mobile-text" style="${paragraphStyle}">${escapeHtml(draft.signOff).replace(/\r?\n/g, "<br />")}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center">
              <img src="https://www.belandjon.com/bel-jon-sig.png" alt="Bel &amp; Jon signature" width="200" height="47" style="display:block;width:200px;height:47px;max-width:100%;border:0;outline:none;text-decoration:none;margin:0 auto;" />
            </td></tr></table>
          </td></tr>
          <tr>
            <td align="center" style="padding:0 32px 30px;">
              <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(draft.inviteUrl)}" style="height:50px;v-text-anchor:middle;width:170px;" arcsize="8%" stroke="f" fillcolor="#f8af63">
                  <w:anchorlock/>
                  <center style="color:#000000;font-family:Segoe UI,Arial,sans-serif;font-size:16px;font-weight:bold;">
                    View your invite
                  </center>
                </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <a href="${escapeHtml(draft.inviteUrl)}"
                style="background-color:#f8af63;color:#000000;display:inline-block;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:170px;max-width:90%;-webkit-text-size-adjust:none;mso-hide:all;border-radius:4px;">View your invite</a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
  </body>
</html>`;

  return { html, text, previewText: draft.previewText };
}

/** The only entry point for both the preview and the outgoing update. */
export function buildWeddingUpdateEmail({
  origin,
  guest = { name: "friends", slug: "preview-invite" },
}: {
  origin: string;
  guest?: Parameters<typeof formatGuestGreetingNames>[0] & { slug: string };
}) {
  const draft = {
    ...defaultWeddingUpdateDraft,
    names: formatGuestGreetingNames(guest),
    imageUrl: new URL("/email/wedding-map.png", origin).href,
    inviteUrl: new URL(`/${encodeURIComponent(guest.slug)}`, origin).href,
  };
  return {
    from: '"Bel & Jon" <howdy@belandjon.com>',
    subject: draft.subject,
    ...weddingUpdateEmail(draft),
  };
}
