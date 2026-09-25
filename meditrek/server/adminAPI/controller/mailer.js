const connection = require("../connection/connection");
const { sendMail: coreSendMail, wrapEmailHtml, getBaseUrl } = require("../../shared/mailer");

async function mailer(adminEmail, app_name, title, adminName, app_logo, user_id) {
  const baseUrl = await getBaseUrl(connection);
  const reset_url = `${baseUrl}/meditrek/admin/staging/reset-password?user_id=${user_id}`;

  const body = `
    <p style="font-size:15px; color:#333333;"> Dear <b> ${adminName}, </b></p>
    <p style="font-size:15px; color:#333333;"> <b>Email:</b> ${adminEmail}</p>
    <br /><br />
    <p style="font-size:15px; color:#333333;">Recently a request was submitted to reset your password. If this was a mistake, just ignore this email.</p>
    <p style="font-size:15px; color:#333333;">To reset your password, click the button below:</p>
    <br />
    <center>
      <a href="${reset_url}" style="display: inline-block; padding: 10px 20px; border-radius: 10px; background: #1ddec4; color: #fff; text-decoration: none;">Reset Password</a>
    </center>
    <br /><br />
    <p style="font-size:15px; color:#333333; font-weight:bold">Thank you,</p>
    <p style="font-size:15px; color:#333333; font-weight:bold">${app_name} App Team</p>
  `;

  try {
    const info = await coreSendMail(connection, {
      to: adminEmail,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: "Forgot Your Password", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes", reset_url };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return error.message;
  }
}

async function ActivateDeactivatemailer(email, app_name, title, userName, app_logo, newStatusMsg) {
  const baseUrl = await getBaseUrl(connection);
  const reset_url = `${baseUrl}/meditrek/admin/staging/reset-password`;

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
      html: wrapEmailHtml({ appName: app_name, headerTitle: "Account Information", appLogoUrl: app_logo, bodyHtml: body }),
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
    <p style="margin-top:0;">${postData.mailContent}</p>
    <p style="margin-top:20px;">Regards,</p>
    <p style="margin-top:5px; font-weight:bold;">${postData.fromName}</p>
  `;
  try {
    const info = await coreSendMail(connection, {
      to: postData.userEmail,
      subject: "Contact us reply",
      html: wrapEmailHtml({ appName: postData.fromName, headerTitle: "Contact Us", appLogoUrl: postData.app_logo, bodyHtml: body }),
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
  const loginUrl = `${baseUrl}/meditrek/HCP_Panel/meditrek/Access/login/Meditrek_access/`;

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
      html: wrapEmailHtml({ appName: app_name, headerTitle: "🎉 Congratulations, Your Doctor Account is Approved!", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Message sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    return { status: "no", error: error.message };
  }
}

async function mailerRejectDoctorByAdmin(adminEmail, app_name, title, doctor_name, email, app_logo) {
  const body = `
    <p>Dear <b>${doctor_name}</b>,</p>
    <p>We regret to inform you that your account on <b>${app_name}</b> has been rejected by the admin.</p>
    <p>If you have any questions or wish to reapply, please contact the admin.</p>
    <p style="font-size:15px; color:#333333; font-weight:bold">${app_name} App Team</p>
  `;
  try {
    const info = await coreSendMail(connection, {
      to: email,
      subject: title,
      html: wrapEmailHtml({ appName: app_name, headerTitle: "⚠️ Doctor Account Rejected", headerColor: "#D32F2F", appLogoUrl: app_logo, bodyHtml: body }),
      fromNameOverride: app_name,
    });
    console.log("Rejection email sent: %s", info.messageId);
    return { status: "yes" };
  } catch (error) {
    console.error("Error sending rejection email:", error.message);
    return { status: "no", error: error.message };
  }
}

async function contactUsMailerDoctor(postData) {
  const body = `
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">${postData.mailContent}</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">Regards,</p>
    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">${postData.fromName}</p>
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

async function sendDoctorEmail(toEmail, doctorName, password) {
  const app_name = "Meditrek";
  const baseUrl = await getBaseUrl(connection);
  const app_logo = `${baseUrl}/meditrek/server/uploads/td_logo.png`;
  const loginUrl = `${baseUrl}/meditrek/HCP_Panel/meditrek/Access/login/Meditrek_access`;

  const body = `
    <p>Dear <b>${doctorName}</b>,</p>
    <p>Your account has been created successfully. Here are your login details:</p>
    <ul>
      <li><b>Email:</b> ${toEmail}</li>
      <li><b>Password:</b> ${password}</li>
      <li><b>Login URL:</b> <a href="${loginUrl}" target="_blank">${loginUrl}</a></li>
    </ul>
    <p>Please login and change your password after your first login.</p>
    <p>Thank you,<br>${app_name} Team</p>
  `;

  await coreSendMail(connection, {
    to: toEmail,
    subject: "Your Doctor Account Details",
    html: wrapEmailHtml({ appName: app_name, headerTitle: `Welcome, ${doctorName}`, headerColor: "#1DDEC4", appLogoUrl: app_logo, bodyHtml: body }),
    fromNameOverride: app_name,
  });
}

async function sendOtpEmail(toEmail, userName, otp) {
  const app_name = "Meditrek";
  const baseUrl = await getBaseUrl(connection);
  const app_logo = `${baseUrl}/meditrek/server/uploads/meditrek_logo.png`;

  const body = `
    <p style="margin:0 0 10px;">Hi <b>${userName}</b>,</p>
    <p style="margin:0 0 20px;">Use the OTP below to complete your login. This OTP is valid for a short time.</p>
    <div style="text-align:center; margin:30px 0;">
      <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:8px; color:#1DDEC4; border:2px dashed #1DDEC4; padding:15px 25px; border-radius:10px; background:#f9ffff;">${otp}</span>
    </div>
    <p style="color:#777; font-size:14px;">⚠️ Do not share this OTP with anyone for security reasons.</p>
    <p style="margin-top:25px;">Regards,<br><b>${app_name} Team</b></p>
  `;

  await coreSendMail(connection, {
    to: toEmail,
    subject: "🔐 Your OTP Code",
    html: wrapEmailHtml({ appName: app_name, headerTitle: "OTP Verification", headerColor: "#1DDEC4", appLogoUrl: app_logo, bodyHtml: body }),
    fromNameOverride: app_name,
  });
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
  mailerRejectDoctorByAdmin,
  sendDoctorEmail,
  sendOtpEmail,
};