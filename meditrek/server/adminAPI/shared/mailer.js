const nodemailer = require("nodemailer");
const { getMailConfig } = require("./mailConfig");

async function getTransporter(connection) {
  const cfg = await getMailConfig(connection);

  if (!cfg.mail_host || !cfg.mail_username || !cfg.mail_password) {
    throw new Error(
      "Mail is not configured yet. Set mail_host / mail_username / mail_password in Admin > Settings > Email."
    );
  }

  return nodemailer.createTransport({
    host: cfg.mail_host,
    port: Number(cfg.mail_port) || 465,
    secure: (cfg.mail_secure || "ssl").toLowerCase() === "ssl",
    auth: {
      user: cfg.mail_username,
      pass: cfg.mail_password,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function getBaseUrl(connection) {
  const cfg = await getMailConfig(connection);
  return (cfg.app_base_url || "").replace(/\/+$/, "");
}

function wrapEmailHtml({ appName, headerTitle, headerColor = "#1ddec4", appLogoUrl, bodyHtml }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta charset="UTF-8">
  <title>${appName}</title>
</head>
<body style="margin:0;padding:0;font-size:13px;color:#444;font-family:Arial, Helvetica, sans-serif;padding-top:70px;padding-bottom:70px;">
  <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">
    <tr>
      <td style="background-color:#ECEFF1;padding:0 70px 40px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#FFFFFF;border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">
          <tr>
            <td style="padding:25px 0 30px 0;text-align:center;border-bottom:1px solid ${headerColor};background-color:transparent">
              ${appLogoUrl ? `<img src="${appLogoUrl}" alt="" width="20%">` : ""}
              <h2>${headerTitle}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px;">
              ${bodyHtml}
              <p style="font-size:15px;color:#333333;">If you cannot view this email properly, please open it in your browser.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${headerColor};padding-bottom:60px;">
              <table style="width:100%" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td>
                    <div style="margin:0 auto;text-align:center;padding:0 100px">
                      <p style="font-size:14px;color:#ffffff;margin-top:40px;">&#169; ${year} ${appName} | All rights reserved.</p>
                      <p style="font-size:12px;color:#fff;line-height:20px;">This email and any files transmitted with it are confidential. If you received this email by mistake, please notify the sender and delete it.</p>
                    </div>
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
}

async function sendMail(connection, { to, subject, html, fromNameOverride }) {
  const cfg = await getMailConfig(connection);
  const transporter = await getTransporter(connection);
  const fromName = fromNameOverride || cfg.mail_from_name || "Meditrek";

  const info = await transporter.sendMail({
    from: `"${fromName}" <${cfg.mail_from}>`,
    to,
    subject,
    html,
  });
  return info;
}

module.exports = { getTransporter, getBaseUrl, wrapEmailHtml, sendMail };