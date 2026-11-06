export type WeddingUpdateDraft = {
  subject: string;
  previewText: string;
  names: string;
  heading: string;
  body: string;
  bodyBelowImage: string;
  signOff: string;
  buttonLabel: string;
  buttonLink: string;
  imageUrl: string;
  imageAlt: string;
};

export const defaultWeddingUpdateDraft: WeddingUpdateDraft = {
  subject: "Wedding details for 21 November",
  previewText: "11am, Saturday 21 November — 5 Archer Place, Mill Park.",
  names: "friends",
  heading: "",
  body: "Just a quick reminder that our wedding is on **Saturday 21 November**. The ceremony starts at **11am**.\n\nThe address is **5 Archer Place, Mill Park 3082**. Here’s a map to help you find us.",
  bodyBelowImage:
    "Please park along Archer Place towards Statesman Crescent, or in nearby streets, leaving the cul-de-sac near the house free for the ceremony and party.\n\nLooking forward to seeing you!",
  signOff: "With love,",
  buttonLabel: "View wedding details",
  buttonLink: "",
  imageUrl: "", // Supplied by the local preview; host the image when wiring up sending.
  imageAlt:
    "Wedding location map showing Archer Place, Statesman Crescent, Todman Close and Mill Park Drive",
};

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

export function weddingUpdateEmail(draft: WeddingUpdateDraft) {
  const buttonLink = webUrl(draft.buttonLink);
  const showButton = Boolean(buttonLink && draft.buttonLabel.trim());
  const image = imageUrl(draft.imageUrl);
  const paragraphStyle = "margin:0 0 20px;font-size:16px;line-height:1.6;";
  const paragraphs = (body: string) =>
    body
      .split(/\r?\n\s*\r?\n/)
      .filter((paragraph) => paragraph.trim())
      .map(
        (paragraph) =>
          `<p class="mobile-text" style="${paragraphStyle}">${escapeHtml(paragraph).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\r?\n/g, "<br />")}</p>`,
      )
      .join("\n");
  const text = [
    `Hi ${draft.names}!`,
    draft.heading,
    draft.body.replace(/\*\*(.+?)\*\*/g, "$1"),
    ...(image && draft.imageAlt.trim() ? [draft.imageAlt] : []),
    draft.bodyBelowImage.replace(/\*\*(.+?)\*\*/g, "$1"),
    ...(showButton ? [`${draft.buttonLabel}: ${buttonLink}`] : []),
    draft.signOff,
    "Bel & Jon",
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
          ${image ? `<tr><td class="mobile-padding" align="center" style="padding:0 32px 28px;"><img src="${escapeHtml(image)}" alt="${escapeHtml(draft.imageAlt)}" width="636" style="display:block;width:100%;max-width:636px;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>` : ""}
          <tr><td class="mobile-padding" style="padding:0 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">${paragraphs(draft.bodyBelowImage)}</td></tr>
          ${
            showButton
              ? `<tr><td align="center" style="padding:0 32px 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#f8af63" style="border-radius:4px;mso-padding-alt:16px 24px;">
              <a href="${escapeHtml(buttonLink)}" style="background-color:#f8af63;color:#000000;display:inline-block;padding:16px 24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;line-height:20px;text-align:center;text-decoration:none;border-radius:4px;">${escapeHtml(draft.buttonLabel)}</a>
            </td></tr></table>
          </td></tr>`
              : ""
          }
          <tr><td class="mobile-padding" style="padding:0 32px 32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
            ${showButton ? `<p class="mobile-text" style="${paragraphStyle}">If the button doesn't work, please <a href="${escapeHtml(buttonLink)}" style="color:#000000;text-decoration:underline;">use this link</a>.</p>` : ""}
            <p class="mobile-text" style="${paragraphStyle}">${escapeHtml(draft.signOff).replace(/\r?\n/g, "<br />")}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center">
              <img src="https://www.belandjon.com/bel-jon-sig.png" alt="Bel &amp; Jon signature" width="200" height="47" style="display:block;width:200px;height:47px;max-width:100%;border:0;outline:none;text-decoration:none;margin:0 auto;" />
            </td></tr></table>
          </td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
  </body>
</html>`;

  return { html, text, previewText: draft.previewText };
}
