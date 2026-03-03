const nodemailer = require("nodemailer");



async function mailer(

  userEmail,

  app_name,

  title,

  userName,

  app_logo,

  otp

) {

  const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailSMTPSecure = "ssl";

  const mailFrom = "support@meditrekaccess.com";



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: mailSMTPSecure === "ssl",

    auth: {

      user: mailUsername,

      pass: mailPassword,

    },

    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `"${app_name}" <${mailFrom}>`,

    to: userEmail,

    subject: title,

    html: `<!DOCTYPE html>

        <head>

            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta charset="UTF-8">

            <title>${app_name} OTP Verification</title>

        </head>

        <body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

            <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">

                <tr>

                    <td style="background-color:#ECEFF1; padding:0 70px 40px;">

                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

                            <tr>

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #1ddec4; background-color: #FFFFFF">

                                    <img src=${app_logo} alt="" width="20%" >

                                    <h2>Email Verification</h2>

                                </td>

                            </tr>

                            <tr>

                                <td style="padding:40px 40px;">

                                    <p style="font-size:15px; color:#333333;">Dear <b>${userName}</b>,</p>

                                    <p style="font-size:15px; color:#333333;">Thank you for signing up with <b>${app_name}</b>.</p>

                                    <p style="font-size:15px; color:#333333;">Your One-Time Password (OTP) for email verification is:</p>

                                    <br />

                                    <center>

                                        <div style="font-size:24px; font-weight:bold; color: #1ddec4; border:2px dashed #1ddec4; padding:15px 30px; display:inline-block; border-radius:8px;">

                                            ${otp}

                                        </div>

                                    </center>

                                    <br />

                                    <p style="font-size:15px; color:#333333;">This OTP is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>

                                    <br /><br />

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        Thank you,

                                    </p>

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        ${app_name} Team

                                    </p>

                                </td>

                            </tr>

                            <tr>

                                <td style="background-color: #1ddec4; padding-bottom:60px;">

                                    <table style="width:100%" border="0" cellspacing="0" cellpadding="0" align="center">

                                        <tr>

                                            <td>     

                                                <div style="margin:0 auto; text-align:center; padding:0 100px">

                                                    <p style="font-size:14px; color:#ffffff; margin-top:40px;">

                                                        &#169; 2025 ${app_name} | All rights reserved.

                                                    </p>

                                                    <p style="font-size:12px; color:#fff; line-height:20px;">

                                                        This email and any files transmitted with it are confidential. If you received this email by mistake, please notify the sender and delete it.

                                                    </p>

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

        </html>`,

  };



  try {

    let info = await transporter.sendMail(mailOptions);

    console.log("OTP Mail sent: %s", info.messageId);

    return { status: "yes", otp: otp };

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);

    return { status: "no", error: error.message };

  }

}



async function ActivateDeactivatemailer(

  email,

  app_name,

  title,

  userName,

  app_logo,

  newStatusMsg

) {

    

      const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailSMTPSecure = "ssl";

  const mailFrom = "support@meditrekaccess.com";

  

  

//   const mailHost = "mail.meditrekaccess.com";

//   const mailPort = "465";

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "4JZHxumf8HuC{F[d";

//   const mailSMTPSecure = "ssl";

//   const mailFrom = "support@meditrekaccess.com";

  const reset_url =

    "https://meditrekaccess.com/meditrek/admin/meditrek/admin/reset-password";



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: mailSMTPSecure === "ssl",

    auth: {

      user: mailUsername,

      pass: mailPassword,

    },

    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `"${app_name}" <${mailFrom}>`,

    to: email,

    subject: title,

    html: `<!DOCTYPE html>

        <head>

            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta charset="UTF-8">

            <title>Welcome to ${app_name}</title>

        </head>

        <body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

            <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">

                <tr>

                    <td style="background-color:#ECEFF1; padding:0 70px 40px;">

                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

                            <tr>

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #F68519; background-color: #F68519">

                                    <img src="${app_logo}" alt="" width="20%" >

                                    <h2>Account Information</h2>

                                </td>

                            </tr>

                            <tr>

                                <td style="padding:40px 40px;">

                                   <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0"> Dear <b> ${userName}, </b></p>



                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0"> Your Account has been ${newStatusMsg} by admin.</p>

                                 

                                    <br /><br />

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        Thank you,                    

                                    </p>

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        ${app_name} App Team

                                    </p>

                                    <p style="font-size:15px; color:#333333;">If you cannot view this email properly, please open it in your browser.</p>

                                </td>

                            </tr>

                            <tr>

                                <td style="background-color:#F68519; padding-bottom:60px;">

                                    <table style="width:100%" border="0" cellspacing="0" cellpadding="0" align="center">

                                        <tr>

                                            <td>     

                                                <div style="margin:0 auto; text-align:center; padding:0 100px">

                                                    <p style="font-size:14px; color:#ffffff; margin-top:40px;">

                                                        &#169; 2025 ${app_name} | All rights reserved.

                                                    </p>

                                                    <p style="font-size:12px; color:#fff; line-height:20px;">

                                                        This email and any files transmitted with it are confidential. If you received this email by mistake, please notify the sender and delete it.

                                                    </p>

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

        </html>`,

  };



  try {

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);

    var data = {

      status: "yes",

      reset_url: reset_url,

    };

    return data;

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);

    return error.message;

  }

}



async function contactUsMailer(postData) {

    

      const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailSMTPSecure = "ssl";

  const mailFrom = "support@meditrekaccess.com";

  

//   const mailHost = "mail.meditrekaccess.com";



//   const mailPort = 465;



//   const mailUsername = "support@meditrekaccess.com";



//   const mailPassword = "4JZHxumf8HuC{F[d";



//   const mailSMTPSecure = "ssl";



//   const mailFrom = "support@meditrekaccess.com";

  const year = "2025";



  let transporter = nodemailer.createTransport({

    host: mailHost,



    port: mailPort,



    secure: mailSMTPSecure === "ssl",



    auth: {

      user: mailUsername,



      pass: mailPassword,

    },



    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `${postData.app_name} <${mailFrom}>`,



    to: postData.userEmail,



    subject: "Contact us reply",



    html: `







        <!DOCTYPE html>







        <html>







            <head>







                <meta name="viewport" content="width=device-width, initial-scale=1" />







                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />







                <title>Welcome to ${postData.fromName}</title>







            </head>







            <body style="margin: 0; padding: 0;font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">







                <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">







                    <tr>







                        <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">







                            <table cellpadding="0" cellspacing="0" class="full-wid">







            







                            </table>







            







                            <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">







                                <tr>







                                    <td>







                                        <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">







                                            <tr style="background:#485641;">







                                                <td class="logo" style="padding:40px 0 30px 0; text-align:center; border-bottom:1px solid #000000;background-color: #1DDEC4;">







                                                    <img src="${postData.app_logo}" alt="" width="15%" height="18%" style="background-color: #e4d7d2; padding:5px">







                                                    <h1 style="color:black;">Contact Us Reply</h1>







                                                </td>







                                            </tr>







                                            <tr><td></td></tr>







                                            <tr>







                                                <td class="content" style="padding:40px 40px;">







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    </p>







                                







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.mailContent}</p>







                                







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    Regards,                  







                                                    </p>







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    ${postData.fromName}                    







                                                    </p>







                                                </td>







                                            </tr>







                                            <tr>







                                                <td style="background:#1DDEC4; padding-bottom:60px;">







                                                    <table style="width:100%;background-color: #1DDEC4;" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">







                                                        <tr>







                                                            <td>   







                                                                <div style="margin:0 auto; text-align:center; padding:0 100px" class="foot-items">







                                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000; margin-top:40px; line-height:20px;">







                                                                    &#169; ${year} ${postData.fromName} | All right Reserved







                                                                    </p>







                                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#000000; line-height:20px; margin-bottom:40px;">







                                                                    The content of this message is confidential. If you have received it by mistake, please inform us by an email reply and then delete the message. It is forbidden to copy, forward, or in any way reveal the contents of this message to anyone.







                                                                    </p>







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







                        </td>







                    </tr>







                </table>







            </body>







        </html>







    `,

  };



  try {

    let info = await transporter.sendMail(mailOptions);



    console.log("Message sent: %s", info.messageId);



    var data = {

      status: "yes",

    };



    return data;

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);



    return error.message;

  }

}

async function sendEmailUser(userEmail, app_name, title, message, app_logo) {

    

      const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailSMTPSecure = "ssl";

  const mailFrom = "support@meditrekaccess.com";

  

//   const mailHost = "mail.meditrekaccess.com";

//   const mailPort = 465;

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "4JZHxumf8HuC{F[d";

//   const mailSMTPSecure = "ssl";

//   const mailFrom = "support@meditrekaccess.com";

  // const reset_url = "https://meribhiapp.com/2025/theradata/admin/reset-password"



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: mailSMTPSecure === "ssl",

    auth: {

      user: mailUsername,

      pass: mailPassword,

    },

    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `${app_name} <${mailFrom}>`,

    to: userEmail,

    subject: title,

    html: `







    <!DOCTYPE html>







    <html>







        <head>







            <meta name="viewport" content="width=device-width, initial-scale=1" />







            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />







            <title>Welcome to ${userEmail}</title>







        </head>







        <body style="margin: 0; padding: 0;font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">







            <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">







                <tr>







                    <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">







                        <table cellpadding="0" cellspacing="0" class="full-wid">







        







                        </table>







        







                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">







                            <tr>







                                <td>







                                    <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">







                                        <tr style="background:#F68519;">







                                            <td class="logo" style="padding:40px 0 30px 0; text-align:center; border-bottom:1px solid #000000;background-color: #F68519;">







                                                <img src="${app_logo}" alt="" width="15%" height="18%" style="background-color: #e4d7d2; padding:5px">







                                                <h1 style="color:white;">${title}</h1>







                                            </td>







                                        </tr>







                                        <tr><td></td></tr>







                                        <tr>







                                            <td class="content" style="padding:40px 40px;">







                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                </p>







                              <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0"><b>Dear : </b>${userEmail}</p>







                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0"><b>Message : </b>${message}</p>







                            







                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                Regards,                  







                                                </p>







                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                ${app_name}                    







                                                </p>







                                            </td>







                                        </tr>







                                        <tr>







                                            <td style="background:#F68519; padding-bottom:60px;">







                                                <table style="width:100%;background-color: #F68519;" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">







                                                    <tr>







                                                        <td>   







                                                            <div style="margin:0 auto; text-align:center; padding:0 100px" class="foot-items">







                                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#fffcfc; margin-top:40px; line-height:20px;">







                                                                &#169; 2025 ${app_name} | All right Reserved







                                                                </p>







                                                                <p style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#fffcfc; line-height:20px; margin-bottom:40px;">







                                                                The content of this message is confidential. If you have received it by mistake, please inform us by an email reply and then delete the message. It is forbidden to copy, forward, or in any way reveal the contents of this message to anyone.







                                                                </p>







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







                    </td>







                </tr>







            </table>







        </body>







    </html>







`,

  };



  try {

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);

    var data = {

      status: "yes",

    };

    return data;

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);

    return error.message;

  }

}



function mailBodySubadminData(postData) {

  const date = new Date().getFullYear();



  const mailBody = `

          <!DOCTYPE html>

          <html>

          <head>

              <meta name="viewport" content="width=device-width, initial-scale=1">

              <meta http-equiv="Content-Type" content="text/html; charset=utf-8">

              <title>Welcome to ${postData.fromName}</title>

          </head>

          <body style="margin: 0; padding: 0; background-color:#FFFFFF; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

              <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">

                  <tr>

                      <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">

                          <table cellpadding="0" cellspacing="0" class="full-wid">

              

                          </table>

                          <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

                              <tr>

                                  <td>

                                      <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">

                                          <tr>

                                              <td class="logo" style="padding:40px 0 30px 0; background-color:#000000; text-align:center; border-bottom:1px solid #E1E1E1">

                                                  <img src="${postData.app_logo}" alt="" width="15%" height="18%" style="background-color: white; padding:5px">

                                                  <h1 style="color:white;">${postData.subject}</h1>

                                              </td>

                                          </tr>

                                          <tr><td></td></tr>

                                          <tr>

                                              <td class="content" style="padding:40px 40px;">

                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:black; margin-top:0">

                                                      Hello ${postData.name}

                                                  </p>

                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">

                                                  ${postData.mailContent}

                                                  </p>

                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">

                                                      Regards,

                                                  </p>

                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">

                                                  ${postData.fromName}

                                                  </p>

                                              </td>

                                          </tr>

                                          <tr>

                                              <td style="background:#000000; padding-bottom:60px;">

                                                  <table style="width:100%" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">

                                                      <tr>

                                                          <td>

                                                              <div style="margin:0 auto; text-align:center; padding:0 100px" class="foot-items">

                                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#fbfbfb; margin-top:40px; line-height:20px;">

                                                                      &#169; ${date} ${postData.fromName} | All right Reserved

                                                                  </p>

                                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#fbfbfb; line-height:20px; margin-bottom:40px;">

                                                                      The content of this message is confidential. If you have received it by mistake, please inform us by an email reply and then delete the message. It is forbidden to copy, forward, or in any way reveal the contents of this message to anyone.

                                                                  </p>

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

                      </td>

                  </tr>

              </table>

          </body>

          </html>

      `;



  return mailBody;

}



// Function to send email

async function sendMail(email, subject, mailBody) {

    

      const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailSMTPSecure = "ssl";

  const mailFrom = "support@meditrekaccess.com";

  

//     const mailHost = "mail.meditrekaccess.com";

//   const mailPort = "465";

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "4JZHxumf8HuC{F[d";

//   const mailSMTPSecure = "ssl";

//   const mailFrom = "support@meditrekaccess.com";



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: mailSMTPSecure === "ssl",

    auth: {

      user: mailUsername,

      pass: mailPassword,

    },

    tls: {

      rejectUnauthorized: false,

    },

  });

  const mailOptions = {

    from: mailFrom,

    to: email,

    subject: subject,

    html: mailBody,

  };



  try {

    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: "Email sent successfully", info };

  } catch (error) {

    return {

      success: false,

      message: "Failed to send email",

      error: error.message,

    };

  }

}



// async function mailerApproveDoctor(

//   adminEmail,

//   app_name,

//   title,

//   adminName,

//   app_logo,

// ) {

//   const mailHost = "mail.meditrekaccess.com";

//   const mailPort = "465";

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "i[f4+,z6ea$h2AY,";

//   const mailSMTPSecure = "ssl";

//   const mailFrom = "support@meditrekaccess.com";

// //   const reset_url = `http://localhost:3000/2025/thera_data/admin/reset-password?user_id=${user_id}`;



//   let transporter = nodemailer.createTransport({

//     host: mailHost,

//     port: mailPort,

//     secure: mailSMTPSecure === "ssl",

//     auth: {

//       user: mailUsername,

//       pass: mailPassword,

//     },

//     tls: {

//       rejectUnauthorized: false,

//     },

//   });



//   let mailOptions = {

//     from: `"${app_name}" <${mailFrom}>`,

//     to: email,

//     subject: title,

//     html: `<!DOCTYPE html>

//         <head>

//             <meta name="viewport" content="width=device-width, initial-scale=1" />

//             <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

//             <meta charset="UTF-8">

//             <title>Welcome to ${app_name}</title>

//         </head>

//         <body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

//             <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">

//                 <tr>

//                     <td style="background-color:#ECEFF1; padding:0 70px 40px;">

//                         <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

//                             <tr>

//                                 <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #F68519; background-color: #F68519">

//                                     <img src="${app_logo}" alt="" width="20%" >

//                                     <h2>Forgot Your Password</h2>

//                                 </td>

//                             </tr>

//                             <tr>

//                                 <td style="padding:40px 40px;">

//                                     <p style="font-size:15px; color:#333333;"> Dear <b> ${doctor_name}, </b></p>

//                                     <p style="font-size:15px; color:#333333;"> <b>Email:</b> ${adminEmail}</p>

//                                     <p style="font-size:15px; color:#333333;"> <b>Password:</b> ${password}</p>

//                                     <p style="font-size:15px; color:#333333;"> <b>Specialization:</b> ${doctor_category_id}</p>

//                                     <br /><br />

//                                     <p style="font-size:15px; color:#333333;">Recently a request was submitted to reset your password. If this was a mistake, just ignore this email.</p>

//                                     <p style="font-size:15px; color:#333333;">To reset your password, click the button below:</p>

//                                     <br />

//                                     <br /><br />

//                                     <p style="font-size:15px; color:#333333; font-weight:bold">

//                                         Thank you,

//                                     </p>

//                                     <p style="font-size:15px; color:#333333; font-weight:bold">

//                                         ${app_name} App Team

//                                     </p>

//                                     <p style="font-size:15px; color:#333333;">If you cannot view this email properly, please open it in your browser.</p>

//                                 </td>

//                             </tr>

//                             <tr>

//                                 <td style="background-color:#F68519; padding-bottom:60px;">

//                                     <table style="width:100%" border="0" cellspacing="0" cellpadding="0" align="center">

//                                         <tr>

//                                             <td>

//                                                 <div style="margin:0 auto; text-align:center; padding:0 100px">

//                                                     <p style="font-size:14px; color:#ffffff; margin-top:40px;">

//                                                         &#169; 2025 ${app_name} | All rights reserved.

//                                                     </p>

//                                                     <p style="font-size:12px; color:#fff; line-height:20px;">

//                                                         This email and any files transmitted with it are confidential. If you received this email by mistake, please notify the sender and delete it.

//                                                     </p>

//                                                 </div>

//                                             </td>

//                                         </tr>

//                                     </table>

//                                 </td>

//                             </tr>

//                         </table>

//                     </td>

//                 </tr>

//             </table>

//         </body>

//         </html>`,

//   };



//   try {

//     let info = await transporter.sendMail(mailOptions);

//     console.log("Message sent: %s", info.messageId);

//     var data = {

//       status: "yes",

//       reset_url: reset_url,

//     };

//     return data;

//   } catch (error) {

//     console.error("Error occurred while sending email:", error.message);

//     return error.message;

//   }

// }



// const nodemailer = require("nodemailer");



async function mailerApproveDoctor(

  adminEmail,

  app_name,

  title,

  doctor_name,

  email,

  password,

  doctor_category_id,

  app_logo

) {

    

  const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailFrom = "support@meditrekaccess.com";

    

    

//   const mailHost = "mail.meditrekaccess.com";

//   const mailPort = 465;

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "4JZHxumf8HuC{F[d";

//   const mailFrom = "support@meditrekaccess.com";



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: true, // SSL enabled

    auth: {

      user: mailUsername,

      pass: mailPassword,

    },

    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `"${app_name}" <${mailFrom}>`,

    to: email, // Send to the approved doctor

    subject: title,

    html: `<!DOCTYPE html>

        <head>

            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta charset="UTF-8">

            <title>Welcome to ${app_name}</title>

        </head>

        <body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

            <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">

                <tr>

                    <td style="background-color:#ECEFF1; padding:0 70px 40px;">

                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

                            <tr>

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #F68519; background-color: #F68519">

                                    <img src="${app_logo}" alt="" width="20%" >

                                    <p>🎉 Congratulations, Your Doctor Account is Approved!</p>

                                </td>

                            </tr>

                            <tr>

                                <td style="padding:40px 40px;">

                                    <p>Dear <b>${doctor_name}</b>,</p>

                <p>We are pleased to inform you that your account has been successfully approved on <b>${app_name}</b>.</p>

                <p><b>Your Login Details:</b></p>

                <p><b>Email:</b> ${email}</p>

                <p><b>Password:</b> ${password}</p>

                <p><b>Specialization:</b> ${doctor_category_id}</p>

                <p>You can now log in to your account and start using our platform.</p>

                <a href="https://meditrekaccess.com/meditrek/sub_admin/meditrek/sub_admin/login" class="button">Login Now</a>

                <p>If you have any questions, feel free to contact us.</p>

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        ${app_name} App Team

                                    </p>

                                    <p style="font-size:15px; color:#333333;">If you cannot view this email properly, please open it in your browser.</p>

                                </td>

                            </tr>

                            <tr>

                                <td style="background-color:#F68519; padding-bottom:60px;">

                                    <table style="width:100%" border="0" cellspacing="0" cellpadding="0" align="center">

                                        <tr>

                                            <td>     

                                                <div style="margin:0 auto; text-align:center; padding:0 100px">

                                                    <p style="font-size:14px; color:#ffffff; margin-top:40px;">

                                                        &#169; 2025 ${app_name} | All rights reserved.

                                                    </p>

                                                    <p style="font-size:12px; color:#fff; line-height:20px;">

                                                        This email and any files transmitted with it are confidential. If you received this email by mistake, please notify the sender and delete it.

                                                    </p>

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

        </html>`,

  };



  try {

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);

    return { status: "yes" };

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);

    return { status: "no", error: error.message };

  }

}



async function contactUsMailerDoctor(postData) {

    

    

//       const mailHost = "mail.meditrekaccess.com";

//   const mailPort = "465";

//   const mailUsername = "support@meditrekaccess.com";

//   const mailPassword = "i[f4+,z6ea$h2AY,";

//   const mailFrom = "support@meditrekaccess.com";

    

    

  const mailHost = "mail.meditrekaccess.com";



  const mailPort = 465;



  const mailUsername = "support@meditrekaccess.com";



  const mailPassword = "i[f4+,z6ea$h2AY,";



  const mailSMTPSecure = "ssl";



  const mailFrom = "support@meditrekaccess.com";

  

  const year = "2025";



  let transporter = nodemailer.createTransport({

    host: mailHost,



    port: mailPort,



    secure: mailSMTPSecure === "ssl",



    auth: {

      user: mailUsername,



      pass: mailPassword,

    },



    tls: {

      rejectUnauthorized: false,

    },

  });



  let mailOptions = {

    from: `${postData.app_name} <${mailFrom}>`,



    to: postData.userEmail,



    subject: "Contact Us",



    html: `







        <!DOCTYPE html>







        <html>







            <head>







                <meta name="viewport" content="width=device-width, initial-scale=1" />







                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />







                <title>Welcome to ${postData.fromName}</title>







            </head>







            <body style="margin: 0; padding: 0;font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">







                <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">







                    <tr>







                        <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">







                            <table cellpadding="0" cellspacing="0" class="full-wid">







            







                            </table>







            







                            <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">







                                <tr>







                                    <td>







                                        <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">







                                            <tr style="background:#485641;">







                                                <td class="logo" style="padding:40px 0 30px 0; text-align:center; border-bottom:1px solid #000000;background-color: #1DDEC4;">







                                                    <img src="${postData.app_logo}" alt="" width="15%" height="18%" style="background-color: #e4d7d2; padding:5px">







                                                    <h1 style="color:black;">Contact Us</h1>







                                                </td>







                                            </tr>







                                            <tr><td></td></tr>







                                            <tr>







                                                <td class="content" style="padding:40px 40px;">







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    </p>







                                







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">${postData.mailContent}</p>







                                







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    Regards,                  







                                                    </p>







                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0">







                                                    ${postData.fromName}                    







                                                    </p>







                                                </td>







                                            </tr>







                                            <tr>







                                                <td style="background:#1DDEC4; padding-bottom:60px;">







                                                    <table style="width:100%;background-color: #1DDEC4;" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">







                                                        <tr>







                                                            <td>   







                                                                <div style="margin:0 auto; text-align:center; padding:0 100px" class="foot-items">







                                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000; margin-top:40px; line-height:20px;">







                                                                    &#169; ${year} ${postData.fromName} | All right Reserved







                                                                    </p>







                                                                    <p style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#000000; line-height:20px; margin-bottom:40px;">







                                                                    The content of this message is confidential. If you have received it by mistake, please inform us by an email reply and then delete the message. It is forbidden to copy, forward, or in any way reveal the contents of this message to anyone.







                                                                    </p>







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







                        </td>







                    </tr>







                </table>







            </body>







        </html>







    `,

  };



  try {

    let info = await transporter.sendMail(mailOptions);



    console.log("Message sent: %s", info.messageId);



    var data = {

      status: "yes",

    };



    return data;

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

  contactUsMailerDoctor

};

