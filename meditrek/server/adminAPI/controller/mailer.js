const nodemailer = require("nodemailer");



async function mailer(

  adminEmail,

  app_name,

  title,

  adminName,

  app_logo,

  user_id

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

  const reset_url = `https://meditrekaccess.com/meditrek/admin/meditrek/admin/reset-password?user_id=${user_id}`;



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

    to: adminEmail,

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

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #1ddec4; background-color: transparent">

                                    <img src="${app_logo}" alt="" width="20%" >

                                    <h2>Forgot Your Password</h2>

                                </td>

                            </tr>

                            <tr>

                                <td style="padding:40px 40px;">

                                    <p style="font-size:15px; color:#333333;"> Dear <b> ${adminName}, </b></p>

                                    <p style="font-size:15px; color:#333333;"> <b>Email:</b> ${adminEmail}</p>

                                    <br /><br />

                                    <p style="font-size:15px; color:#333333;">Recently a request was submitted to reset your password. If this was a mistake, just ignore this email.</p>

                                    <p style="font-size:15px; color:#333333;">To reset your password, click the button below:</p>

                                    <br />

                                    <center>

                                        <a href="${reset_url}" style="display: inline-block; padding: 10px 20px; border-radius: 10px; background: #1ddec4; color: #fff; text-decoration: none;">

                                            Reset Password

                                        </a>

                                    </center>

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

                                <td style="background-color:#1ddec4; padding-bottom:60px;">

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

                    <td style="background-color: #ECEFF1; padding:0 70px 40px;">

                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">

                            <tr>

                              <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #1ddec4; background-color:#fff;">

    <img src="${app_logo}" width="150" style="display:block; margin:0 auto;" />

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

<body style="margin:0; padding:0; font-size:14px; color:#333333; font-family:Arial, Helvetica, sans-serif; background-color:#f4f4f4; padding-top:50px; padding-bottom:50px;">

    <table cellspacing="0" cellpadding="0" align="center" width="600" style="margin:0 auto; background-color:#ffffff; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.1); overflow:hidden;">

        <!-- Header -->

      <tr>

    <td style="background-color: #ffffff; text-align:center; padding:30px;">
<img 
    src="${postData.app_logo}" 
    alt="${postData.fromName}" 
    width="80px" 
    height="80px"
    style="display:block; margin:0 auto 10px; width:80px; height:80px; object-fit:contain; background: #ffffff; border-radius:0;"
>


        <h1 style="color:#000000; font-size:24px; margin:0; font-family:Arial, Helvetica, sans-serif;">Contact Us</h1>

    </td>

</tr>





        <!-- Content -->

        <tr>

            <td style="padding:30px; color:#333333; line-height:1.6; font-size:14px;">

                <p style="margin-top:0;">${postData.mailContent}</p>

                <p style="margin-top:20px;">Regards,</p>

                <p style="margin-top:5px; font-weight:bold;">${postData.fromName}</p>

            </td>

        </tr>



        <!-- Footer -->

        <tr>

            <td style="background-color: #1ddec4; padding:30px; text-align:center; color:#000000; font-size:12px; line-height:1.5;">

                <p>&#169; ${year} ${postData.fromName} | All Rights Reserved</p>

                <p style="margin-top:10px;">

                    The content of this message is confidential. If you have received it by mistake, please inform us by an email reply and delete the message. Copying or forwarding is prohibited.

                </p>

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

    from: `"Meditrek Access" <${mailFrom}>`,

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



async function mailerApproveDoctor( adminEmail, app_name, title, doctor_name, email, password, doctor_category_id, app_logo ) {

    

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

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #1ddec4; background-color: transparent">

                                <img src="${app_logo}" alt="Logo" style="width:150px; height:auto; display:block; margin:auto;">





                                    <p> 🎉 Congratulations, Your Doctor Account is Approved!</p>

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

    console.log("Message sent: %s", info.messageId);

    return { status: "yes" };

  } catch (error) {

    console.error("Error occurred while sending email:", error.message);

    return { status: "no", error: error.message };

  }

}



async function mailerRejectDoctorByAdmin(adminEmail, app_name, title, doctor_name, email, app_logo) {



  const mailHost = "mail.meditrekaccess.com";

  const mailPort = "465";

  const mailUsername = "support@meditrekaccess.com";

  const mailPassword = "i[f4+,z6ea$h2AY,";

  const mailFrom = "support@meditrekaccess.com";



  let transporter = nodemailer.createTransport({

    host: mailHost,

    port: mailPort,

    secure: true,

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

    to: email, // Send to the rejected doctor

    subject: title,

    html: `<!DOCTYPE html>

        <head>

            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

            <meta charset="UTF-8">

            <title>Account Status - ${app_name}</title>

        </head>

        <body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

            <table cellspacing="0" cellpadding="0" align="center" width="768" style="margin:0 auto;">

                <tr>

                    <td style="background-color:#ECEFF1; padding:0 70px 40px;">

                        <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px; box-shadow:0 0 20px #ccc; margin-top:40px">

                            <tr>

                                <td style="padding:25px 0 30px 0; text-align:center; border-bottom:1px solid #D32F2F; background-color: #D32F2F">

                                    <img src="${app_logo}" alt="" width="20%" >

                                    <p>⚠️ Doctor Account Rejected</p>

                                </td>

                            </tr>

                            <tr>

                                <td style="padding:40px 40px;">

                                    <p>Dear <b>${doctor_name}</b>,</p>

                                    <p>We regret to inform you that your account on <b>${app_name}</b> has been rejected by the admin.</p>

                                    <p>If you have any questions or wish to reapply, please contact the admin.</p>

                                    <p style="font-size:15px; color:#333333; font-weight:bold">

                                        ${app_name} App Team

                                    </p>

                                    <p style="font-size:15px; color:#333333;">If you cannot view this email properly, please open it in your browser.</p>

                                </td>

                            </tr>

                            <tr>

                                <td style="background-color:#D32F2F; padding-bottom:60px;">

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

        </html>`

  };



  try {

    let info = await transporter.sendMail(mailOptions);

    console.log("Rejection email sent: %s", info.messageId);

    return { status: "yes" };

  } catch (error) {

    console.error("Error sending rejection email:", error.message);

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

<body style="margin: 0; padding: 0; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">

    <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">

        <tr>

            <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">

                <table cellpadding="0" cellspacing="0" class="full-wid"></table>



                <table cellpadding="0" cellspacing="0" style="width:100%; background-color:#FFFFFF; border-radius:4px; box-shadow:0 0 20px #ccc; margin-top:40px;">

                    <tr>

                        <td>

                            <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">

                                <tr style="background:#485641;">

                                    <td class="logo" style="padding:40px 0 30px 0; text-align:center; border-bottom:1px solid #000000; background-color: #ffffff;">

                                        <img src="${postData.app_logo}" alt="" width="15%" height="18%" style="background-color: #ffffff; padding:5px">

                                        <h1 style="color:black;">Contact Us</h1>

                                    </td>

                                </tr>



                                <tr><td></td></tr>



                                <tr>

                                    <td class="content" style="padding:40px 40px;">

                                        <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;"></p>

                                        <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">

                                            ${postData.mailContent}

                                        </p>

                                        <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">

                                            Regards,

                                        </p>

                                        <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#060b48; margin-top:0;">

                                            ${postData.fromName}

                                        </p>

                                    </td>

                                </tr>



                                <tr>

                                    <td style="background:#1DDEC4; padding-bottom:60px;">

                                        <table style="width:100%; background-color:#1DDEC4;" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">

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

// Function to send email

async function sendDoctorEmail(toEmail, doctorName, password) {

  const app_name = "Meditrek";

  const app_logo = "https://meditrekaccess.com/meditrek/server/uploads/td_logo.png";

  const loginUrl = "https://meditrekaccess.com/doctor/login";



  let transporter = nodemailer.createTransport({

    host: "mail.meditrekaccess.com",

    port: 465,

    secure: true,

    auth: {

      user: "support@meditrekaccess.com",

      pass: "i[f4+,z6ea$h2AY,", // Better: use env variable

    },

    tls: { rejectUnauthorized: false },

  });



  const htmlContent = `

  <!DOCTYPE html>

  <html>

  <head>

    <meta charset="UTF-8">

    <title>Welcome to ${app_name}</title>

  </head>

  <body style="font-family:Arial, sans-serif; color:#333; padding:20px;">

    <table width="100%" style="max-width:600px; margin:auto; border:1px solid #ccc; border-radius:8px; overflow:hidden;">

      <tr style="background:#1DDEC4; text-align:center; padding:20px;">

        <td>

          <img src="${app_logo}" width="100" style="display:block; margin:10px auto;">

          <h2 style="color:#000;">Welcome, ${doctorName}</h2>

        </td>

      </tr>

      <tr>

        <td style="padding:20px;">

          <p>Dear <b>${doctorName}</b>,</p>

          <p>Your account has been created successfully. Here are your login details:</p>

          <ul>

            <li><b>Email:</b> ${toEmail}</li>

            <li><b>Password:</b> ${password}</li>

            <li><b>Login URL:</b> <a href="${loginUrl}" target="_blank">${loginUrl}</a></li>

          </ul>

          <p>Please login and change your password after your first login.</p>

          <p>Thank you,<br>${app_name} Team</p>

        </td>

      </tr>

      <tr style="background:#F68519; text-align:center; color:#fff; padding:15px;">

        <td>

          &copy; 2025 ${app_name} | All rights reserved.

        </td>

      </tr>

    </table>

  </body>

  </html>`;



  await transporter.sendMail({

    from: `"${app_name}" <support@meditrekaccess.com>`,

    to: toEmail,

    subject: "Your Doctor Account Details",

    html: htmlContent,

  });

}

// otp for subadminlogin
// otp for subadminlogin
async function sendOtpEmail(toEmail, userName, otp) {

  const app_name = "Meditrek";
//   const app_logo = "https://meditrekaccess.com/meditrek/server/uploads/td_logo.png";
     const app_logo = "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";


  let transporter = nodemailer.createTransport({
    host: "mail.meditrekaccess.com",
    port: 465,
    secure: true,
    auth: {
      user: "support@meditrekaccess.com",
      pass: "i[f4+,z6ea$h2AY,",
    },
    tls: { rejectUnauthorized: false },
  });

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>OTP Verification</title>
  </head>

  <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td align="center">

          <!-- Main Card -->
          <table width="100%" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr style="background:#1DDEC4;">
              <td align="center" style="padding:25px;">
               <img 
                    src="${app_logo}" 
                    width="90" 
                    height="90"
                    alt="Meditrek Logo"
                    style="display:block; margin:auto;"
                    />
                <h2 style="margin:10px 0 0; color:#000;">OTP Verification</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px; color:#333;">

                <p style="margin:0 0 10px;">Hi <b>${userName}</b>,</p>

                <p style="margin:0 0 20px;">
                  Use the OTP below to complete your login. This OTP is valid for a short time.
                </p>

                <!-- OTP BOX -->
                <div style="text-align:center; margin:30px 0;">
                  <span style="
                    display:inline-block;
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    color:#1DDEC4;
                    border:2px dashed #1DDEC4;
                    padding:15px 25px;
                    border-radius:10px;
                    background:#f9ffff;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="color:#777; font-size:14px;">
                  ⚠️ Do not share this OTP with anyone for security reasons.
                </p>

                <p style="margin-top:25px;">
                  Regards,<br>
                  <b>${app_name} Team</b>
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr style="background:#F68519;">
              <td align="center" style="padding:15px; color:#fff; font-size:14px;">
                © 2025 ${app_name} | All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>`;

  await transporter.sendMail({
    from: `"${app_name}" <support@meditrekaccess.com>`,
    to: toEmail,
    subject: "🔐 Your OTP Code",
    html: htmlContent,
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
  sendOtpEmail

};

