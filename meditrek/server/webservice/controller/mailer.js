const connection = require("../connection");
const { sendMail: coreSendMail, wrapEmailHtml, getBaseUrl } = require("../../shared/mailer");

async function mailer(userEmail, app_name, title, userName, app_logo, otp) {
  const body = `
    <p style="font-size:15px; color:#333333;">Dear <b>${userName}</b>,</p>
    <p style="font-size:15px; color:#333333;">Thank you for signing up with <b>${app_name}</b>.</p>
    <p style="font-size:15px; color:#333333;">Your One-Time Password (OTP) for email verification is:</p>
    <br />
    <center>
      <div style="font-size:24px; font-weight:bold; color: #1ddec4; border:2px dashed #1ddec4; padding:15px 30px; display:inline-block; border-radius:8px;">${otp}</div>
    </center>
    <br />
    <p style="font-size:15px; color:#333333;">This OTP is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>
    <br /><br />
    <p style="font-size:15px; color:#333333; font-weight:bold">Thank you,</p>
    <p style="font-size:15px; color:#333333; font-weight:bold">${app_name} Team</p>
  `;

  try {
    const info = await coreSendMail(connection, {
      to: userEmail,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: "Email Verification", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("OTP Mail sent: %s", info.messageId);
    return { status: "yes", otp };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return { status: "no", error: error.message };
  }
}

async function ActivateDeactivatemailer(email, app_name, title, userName, app_logo, newStatusMsg) {
  const baseUrl = await getBaseUrl(connection);
  const reset_url = `${baseUrl}/meditrek/admin/meditrek/admin/reset-password`;

  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0"> Dear <b> ${userName}, </b></p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0"> Your Account has been ${newStatusMsg} by admin.</p>
    <br /><br />
    <p style="font-size:15px; color:#333333; font-weight:bold">Thank you,</p>
    <p style="font-size:15px; color:#333333; font-weight:bold">${app_name} App Team</p>
  `;

  try {
    const info = await coreSendMail(connection, {
      to: email,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: "Account Information", headerColor: "#F68519", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes", reset_url };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return error.message;
  }
}

async function contactUsMailer(postData) {
  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.mailContent}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">Regards,</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.fromName}</p>
  `;
  try {
    const info = await coreSendMail(connection, {
      to: postData.userEmail,
      subject: "Contact us reply",
      html: wrapEmailHtml({ appName: postData.fromName, headerTitle: "Contact Us Reply", headerColor: "#1DDEC4", appLogoUrl: postData.app_logo, bodyHtml: body }),
      fromNameOverride: postData.app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return error.message;
  }
}

async function sendEmailUser(userEmail, app_name, title, message, app_logo) {
  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0"><b>Dear : </b>${userEmail}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0"><b>Message : </b>${message}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">Regards,</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${app_name}</p>
  `;
  try {
    const info = await coreSendMail(connection, {
      to: userEmail,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: title, headerColor: "#F68519", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return error.message;
  }
}

function mailBodySubadminData(postData) {
  const date = new Date().getFullYear();
  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:black; margin-top:0">Hello ${postData.name}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">${postData.mailContent}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">Regards,</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">${postData.fromName}</p>
  `;
  return wrapEmailHtml({
    appName: postData.fromName,
    headerTitle: postData.subject,
    headerColor: "#000000",
    appLogoUrl: postData.app_logo,
    bodyHtml: body,
  });
}

async function sendMail(email, subject, mailBody) {
  try {
    const info = await coreSendMail(connection, { to: email, subject, html: mailBody });
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    return { success: false, message: "Failed to send email", error: error.message };
  }
}

async function mailerApproveDoctor(adminEmail, app_name, title, doctor_name, email, password, doctor_category_id, app_logo) {
  const baseUrl = await getBaseUrl(connection);
  const loginUrl = `${baseUrl}/meditrek/sub_admin/meditrek/sub_admin/login`;

  const body = `
    <p>Dear <b>${doctor_name}</b>,</p>
    <p>We are pleased to inform you that your account has been successfully approved on <b>${app_name}</b>.</p>
    <p><b>Your Login Details:</b></p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Password:</b> ${password}</p>
    <p><b>Specialization:</b> ${doctor_category_id}</p>
    <p>You can now log in to your account and start using our platform.</p>
    <a href="${loginUrl}" class="button">Login Now</a>
    <p>If you have any questions, feel free to contact us.</p>
    <p style="font-size:15px; color:#333333; font-weight:bold">${app_name} App Team</p>
  `;

  try {
    const info = await coreSendMail(connection, {
      to: email,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: "🎉 Congratulations, Your Doctor Account is Approved!", headerColor: "#F68519", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return { status: "no", error: error.message };
  }
}

async function contactUsMailerDoctor(postData) {
  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.mailContent}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">Regards,</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.fromName}</p>
  `;
  try {
    const info = await coreSendMail(connection, {
      to: postData.userEmail,
      subject: "Contact Us",
      html: wrapEmailHtml({ appName: postData.fromName, headerTitle: "Contact Us", headerColor: "#1DDEC4", appLogoUrl: postData.app_logo, bodyHtml: body }),
      fromNameOverride: postData.app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return error.message;
  }
}

module.exports = {
  mailer,
  contactUsMailer,
  sendMail,
  sendEmailUser,
  mailBodySubadminData,
  ActivateDeactivatemailer,
  mailerApproveDoctor,
  contactUsMailerDoctor,
};