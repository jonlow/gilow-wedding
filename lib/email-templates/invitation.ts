export type InvitationEmailProps = {
  names: string;
  buttonLink: string;
};

export function invitationEmail({ names, buttonLink }: InvitationEmailProps) {
  const previewText = "You're invited to our wedding!";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Wedding Invitation</title>
    <style>
      @media only screen and (max-width: 700px) {
        .mobile-padding {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        .mobile-text {
          font-size: 14px !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:700px;">
            
          <tr>
           <td class="mobile-padding" style="padding:32px 32px 8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
                <p class="mobile-text" style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                  Hello ${names}!
                </p>
              <p class="mobile-text" style="margin:0 0 20px;font-size:16px;line-height:1.6;">                  
                💛 We're so excited to invite you to our wedding. 💛
              </p>
              <p class="mobile-text" style="margin:0 0 20px;font-size:16px;line-height:1.6;">                  
                Please click the button below to view your invitation.
              </p>
              </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 30px;">
              <!--[if mso]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonLink}" style="height:50px;v-text-anchor:middle;width:170px;" stroke="f" fillcolor="#f8af63">
                  <w:anchorlock/>
                  <center>
                <![endif]-->
                    <a href="${buttonLink}"
              style="background-color:#f8af63;color:#000000;display:inline-block;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;text-decoration:none;width:170px;-webkit-text-size-adjust:none;max-width:90%;">View Invitation</a>
                <!--[if mso]>
                  </center>
                </v:rect>
              <![endif]-->
            </td>
          </tr>

          <tr>
            <td class="mobile-padding" style="padding:0 32px 32px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
              <p class="mobile-text" style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                If you have any trouble opening the invitation, please don't hesitate to let us know.
              </p>
              <p class="mobile-text" style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                With love,
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center">
                    <img
                      src="https://www.belandjon.com/bel-jon-sig.png"
                      alt="Bel and Jon signature"
                      width="200"
                      style="display:block;width:200px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, previewText };
}
