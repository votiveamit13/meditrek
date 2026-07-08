const connection = require("../connection/connection");
const { getNotificationArrSingle } = require("../../webservice/shared functions/functions");
const db = require("../connection/connection");
const moment = require("moment");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const languageMessages = require("./languageMessages");
const { hashPassword } = require("./function");
dotenv.config();
const SECRET_KEY = "SECRETKEYHERE";
const {
  sendMail
} = require("../controller/mailer");
const { resolve } = require("path");
const admin = require("../../webservice/helpers/firebase");

let otpStore = {};
// const subAdminLogin = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     if (!email) {
//       return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "email", });
//     }
//     if (!password) {
//       return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "password", });
//     }

//     const sqlCheckUser = "SELECT doctor_id, user_id, doctor_name, mobile, email, password, doctor_category_id, image, approve_status, createtime FROM doctor_master WHERE delete_flag = 0 AND approve_status = 1 AND email = ? AND active_flag = 1";
//     connection.query(sqlCheckUser, [email], async (err, userResult) => {
//       if (err) {
//         return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
//       }
//       if (userResult.length <= 0) {
//         return res.status(200).json({ success: false, msg: languageMessages.emailNotRegistered, key: "email", });
//       }
//       if (userResult.length > 0) {
//         var adminPassword = userResult[0].password;
//         const hashedPass = await hashPassword(password);
//         if (adminPassword != hashedPass) {
//           return res.status(200).json({ success: false, msg: languageMessages.wrongPassword, });
//         } else {
//           const payload = { subject: userResult[0].doctor_id };
//           const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
//           return res.status(200).json({ success: true, msg: languageMessages.loginSuccessfully, key: "login_successfully", token: token, info: userResult });
//         }
//       }
//     });
//   } catch (error) {
//     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
//   }
// };

// const subAdminLogin = async (req, res) => {
//   const { email, password } = req.body;

//   try {

//     if (!email) {
//       return res.status(200).json({ success: false, msg: "Email required" });
//     }

//     if (!password) {
//       return res.status(200).json({ success: false, msg: "Password required" });
//     }

//     const sqlCheckUser = `
//     SELECT doctor_id, doctor_name, email, password 
//     FROM doctor_master 
//     WHERE delete_flag = 0 
//     AND approve_status = 1 
//     AND email = ? 
//     AND active_flag = 1
//     `;

//     connection.query(sqlCheckUser, [email], async (err, userResult) => {

//       if (userResult.length <= 0) {
//         return res.status(200).json({
//           success: false,
//           msg: "Email not registered"
//         });
//       }

//       var adminPassword = userResult[0].password;
//       const hashedPass = await hashPassword(password);

//       if (adminPassword != hashedPass) {
//         return res.status(200).json({
//           success: false,
//           msg: "Wrong password"
//         });
//       }

//       // OTP generate
//       const otp = Math.floor(100000 + Math.random() * 900000);
//       console.log("Login OTP:", otp);

//       const insertOtp = `
//       INSERT INTO otp_verification (email, otp)
//       VALUES (?,?)
//       `;

//       connection.query(insertOtp, [email, otp]);

//       await sendMail(email, "Login OTP", `Your OTP is ${otp}`);

//       return res.status(200).json({
//         success: true,
//         msg: "OTP sent to email",
//         email: email
//       });

//     });

//   } catch (error) {

//     return res.status(200).json({
//       success: false,
//       msg: error.message
//     });

//   }
// };
// const subAdminLogin = async (req, res) => {
//   const { sendOtpEmail } = require('../mailer');
//   const { email, password } = req.body;

//   try {
    
//     const sqlCheckUser = `
//     SELECT doctor_id, doctor_name, email, password 
//     FROM doctor_master 
//     WHERE delete_flag = 0 
//     AND approve_status = 1 
//     AND email = ? 
//     AND active_flag = 1
//     `;

//     connection.query(sqlCheckUser, [email], async (err, userResult) => {

//       if (userResult.length <= 0) {
//         return res.status(200).json({
//           success: false,
//           msg: "Email not registered"
//         });
//       }

//       var adminPassword = userResult[0].password;
//       const hashedPass = await hashPassword(password);

//       if (adminPassword != hashedPass) {
//         return res.status(200).json({
//           success: false,
//           msg: "Wrong password"
//         });
//       }

//       // OTP generate
//       const otp = Math.floor(100000 + Math.random() * 900000);
//       console.log("Login OTP:", otp);

//       otpStore[email] = otp;

//       // await sendMail(email, "Login OTP", `Your OTP is ${otp}`);
//       await sendOtpEmail(emailTrim, user.name || "User", otp);

//       return res.status(200).json({
//         success: true,
//         msg: "OTP sent to email",
//         email: email,
//         doctor_id: userResult[0].doctor_id,
//          otp: otp
//       });

//     });

//   } catch (error) {

//     return res.status(200).json({
//       success: false,
//       msg: error.message
//     });

//   }
// };
const subAdminLogin = async (req, res) => {

  const { sendOtpEmail } = require('./mailer');
  const { email, password } = req.body;

  try {

    const emailTrim = email.trim(); // 

    const sqlCheckUser = `
    SELECT doctor_id, doctor_name, email, password 
    FROM doctor_master 
    WHERE delete_flag = 0 
    AND approve_status = 1 
    AND email = ? 
    AND active_flag = 1
    `;

    connection.query(sqlCheckUser, [emailTrim], async (err, userResult) => {

      if (!userResult || userResult.length === 0) {
        return res.status(200).json({
          success: false,
          msg: "Email not registered"
        });
      }

      const user = userResult[0]; // 

      var adminPassword = user.password;
      const hashedPass = await hashPassword(password);

      if (adminPassword != hashedPass) {
        return res.status(200).json({
          success: false,
          msg: "Wrong password"
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
       console.log("Login OTP:", otp);
      otpStore[emailTrim] = otp;

      //  correct call
      await sendOtpEmail(emailTrim, user.doctor_name || "User", otp);

      return res.status(200).json({
        success: true,
        msg: "OTP sent to email",
        email: emailTrim,
        doctor_id: user.doctor_id,
        otp: otp
      });

    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: error.message
    });
  }
};

// const verifyLoginOtp = async (req, res) => {

//   const { email, otp } = req.body;

//   try {

//     const checkOtp = `
//     SELECT * FROM otp_verification
//     WHERE email = ? AND otp = ?
//     ORDER BY id DESC LIMIT 1
//     `;

//     connection.query(checkOtp, [email, otp], (err, result) => {

//       if (result.length <= 0) {
//         return res.status(200).json({
//           success: false,
//           msg: "Invalid OTP"
//         });
//       }

//       const getUser = `
//       SELECT doctor_id FROM doctor_master
//       WHERE email = ?
//       `;

//       connection.query(getUser, [email], (err, user) => {

//         const payload = { subject: user[0].doctor_id };

//         const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

//         return res.status(200).json({
//           success: true,
//           msg: "Login successful",
//           token: token
//         });

//       });

//     });

//   } catch (error) {

//     return res.status(200).json({
//       success: false,
//       msg: error.message
//     });

//   }

// };
const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] != otp) {
    return res.status(200).json({
      success: false,
      msg: "Invalid OTP"
    });
  }

const sql = `
  SELECT doctor_id
  FROM doctor_master
  WHERE email = ?
  AND delete_flag = 0
  AND active_flag = 1
  AND approve_status = 1
`;

  connection.query(sql, [email], (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(200).json({ success: false, msg: "Doctor not found" });
    }

    const doctor_id = result[0].doctor_id;

    connection.query(
      `UPDATE doctor_master SET last_login = NOW() WHERE doctor_id = ?`,
      [doctor_id],
      (updateErr) => {
        if (updateErr) console.error("Failed to update last_login:", updateErr);
      }
    );

    const payload = { subject: doctor_id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

    delete otpStore[email];

    return res.status(200).json({
      success: true,
      msg: "Login successful",
      token: token
    });
  });
};
//--------------------------get prophile--------------
const getProfile = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name,mobile,email,image FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, info: check[0] })
    })


  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
};

//---------------------update password-------------
const UpdateSubAdminPassword = async (req, res) => {
  const { oldpassword, newPassword } = req.body;
  const doctor_id = req.doctor_id;

  try {
    if (!doctor_id) {
      return res.status(200).json({
        success: false,

        msg: languageMessages.msg_empty_param,

        key: "doctor_id",
      });
    }


    if (!newPassword) {
      return res.status(200).json({
        success: false,

        msg: languageMessages.msg_empty_param,

        key: "newPassword",
      });
    }
    if (!oldpassword) {
      return res.status(200).json({
        success: false,

        msg: languageMessages.msg_empty_param,

        key: "oldpassword",
      });
    }

    var sql =
      "SELECT doctor_id,password  FROM doctor_master WHERE doctor_id = ? and delete_flag = 0";

    connection.query(sql, [doctor_id], async (err, info) => {
      if (err) {
        return res

          .status(200)

          .json({ success: false, msg: languageMessages.internalServerError });
      }

      if (info.length <= 0) {
        return res

          .status(200)

          .json({ success: false, msg: languageMessages.msgUserNotFound });
      }

      if (info[0].active_flag === 0) {
        return res.status(200).json({
          success: false,

          msg: languageMessages.accountDeactivate,

          active_status: 0,
        });
      }

      console.log(info[0].user_id);


      var password = info[0].password;

      console.log(password);

      const old_password_hash = await hashPassword(oldpassword);
      const new_pass = await hashPassword(newPassword);

      if (password == old_password_hash) {


        if (new_pass != old_password_hash) {
          var updateSql =
            "UPDATE doctor_master SET password=?, updatetime = NOW() WHERE doctor_id = ? AND delete_flag = 0";

          connection.query(
            updateSql,
            [new_pass, doctor_id],
            (err) => {
              if (err) {
                return res
                  .status(200)
                  .json({
                    success: false,
                    msg: languageMessages.internalServerError,
                  });
              } else {
                return res
                  .status(200)
                  .json({
                    success: true,
                    msg: languageMessages.PasswordUpdatedSuccessfully,
                    key: "success",
                  });
              }
            }
          );
        } else {
          return res.status(200).json({
            success: true,

            msg: languageMessages.newOldPassword,

            key: "samePassword",
          });
        }
      } else {
        return res.status(200).json({
          success: false,

          msg: languageMessages.newOldPassword,

          key: "failure",
        });
      }
    });
  } catch (error) {
    return res

      .status(200)

      .json({ success: false, msg: languageMessages.internalServerError });
  }
};




//-----------------------update sub admin profile-------------
const UpdateSubAdminProfile = async (req, res) => {
  const { name, email, doctor_id, mobile } = req.body;
  // return response.json({ success: false, msg: languageMessages.msg_empty_param, res: req.body });
  // const doctor_id = req.doctor_id;

  try {
    let image = req.file ? req.file.filename : null;
    // return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "test" });

    if (!name) {
      return res

        .status(200)

        .json({ success: false, msg: languageMessages.msg_empty_param, key: "name" });
    }
    if (!doctor_id) {
      return res

        .status(200)

        .json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
    }
    if (!email) {
      return res

        .status(200)

        .json({ success: false, msg: languageMessages.msg_empty_param, key: "email" });
    }

    const checksql = "SELECT doctor_id ,user_id ,doctor_name,image,email FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      if (image == null) {
        image = check[0].image
      }
      const updatesql = "UPDATE doctor_master SET doctor_name = ?,email= ?,image = ?, mobile = ?  WHERE doctor_id = ? AND delete_flag = 0";
      connection.query(updatesql, [name, email, image, mobile, doctor_id], async (err, result) => {
        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
        }
        return res.status(200).json({ success: true, msg: languageMessages.msgProfileUpdateSuccess })
      })
    })


  } catch (error) {
    return res.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      error: error.message,
    });
  }
};

function mailBodyForgotPasswordData(postData) {

  const date = new Date().getFullYear();



  const mailBody = `
  
          <!DOCTYPE html>
  
          <html>
  
          <head>
  
              <meta name="viewport" content="width=device-width, initial-scale=1">
  
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  
              <title>Forgot Password</title>
  
          </head>
  
          <body style="margin: 0; padding: 0; background-color: #ffffff; font-size:13px; color:#444; font-family:Arial, Helvetica, sans-serif; padding-top:70px; padding-bottom:70px;">
  
              <table cellspacing="0" cellpadding="0" align="center" width="768" class="outer-tbl" style="margin:0 auto;">
  
                  <tr>
  
                      <td class="pad-l-r-b" style="background-color:#FFFFFF; padding:0 70px 40px;">
  
                          <table cellpadding="0" cellspacing="0" class="full-wid">
  
                          </table>
  
                          <table cellpadding="0" cellspacing="0" style="width:100%; background-color: #FFFFFF; border-radius:4px;box-shadow:0 0 20px #ccc;margin-top:40px">
  
                              <tr>
  
                                  <td>
  
                                      <table border="0" style="margin:0; width:100%" cellpadding="0" cellspacing="0">
  
                                          <tr>
  
                                              <td class="logo" style="padding:40px 0 30px 0; background-color: #ffffff; text-align:center; border-bottom:1px solid #E1E1E1">
  
                                                  <img src="https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png" alt="" style="width:20%; background-color: white; padding:5px">
  
                                                  <h1 style="color:black;">Forgot Your Password</h1>
  
                                              </td>
  
                                          </tr>
  
                                          <tr><td></td></tr>
  
                                          <tr>
  
                                              <td class="content" style="padding:40px 40px;">
  
                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">
  
                                                      Hello ${postData.doctor_name}
  
                                                  </p>
  
                                          <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">
  
                                          You have requested to reset your password. Below is the Reset Password button you can click to change your password.
  
                                      </p>
  
                                                  <p style="text-align: center;">
  
                                              <a href='https://meditrekaccess.com/meditrek/HCP_Panel/meditrek/Access/login/Meditrek_access/reset-password?doctor_id=${postData.doctor_id}' target="_blank" style="display: inline-block; background-color: #1ddec4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
  
                                                  Reset Password
  
                                              </a>
  
                                          </p>
  
                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">
  
                                                      Regards,
  
                                                  </p>
  
                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#333333; margin-top:0">
  
                                                  Meditrek Access
  
                                                  </p>
  
                                              </td>
  
                                          </tr>
  
                                          <tr>
  
                                              <td style="background: #1ddec4; padding-bottom:60px;">
  
                                                  <table style="width:100%" border="0" cellspacing="0" cellpadding="0" class="full-wid" align="center">
  
                                                      <tr>
  
                                                          <td>
  
                                                              <div style="margin:0 auto; text-align:center; padding:0 100px" class="foot-items">
  
                                                                  <p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#fbfbfb; margin-top:40px; line-height:20px;">
  
                                                                      &#169; ${date} Meditrek Access | All right Reserved
  
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
  
          </html>    `;



  return mailBody;

}

//--------------------------forgot password----------------
const ForgotPassword = async (req, res) => {

  const { email } = req.body;

  try {

    if (!email) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "email",

      });

    }

    //check user exist

    const sql1 =

      "SELECT doctor_id, doctor_name,mobile,email,image FROM doctor_master WHERE email = ? AND delete_flag = 0 AND approve_status = 1";

    connection.query(sql1, [email], async (err, info) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.emailNotRegistered,

        });

      }

      let subject = "Forgot Password";

      let text = mailBodyForgotPasswordData(info[0]);

      const mailResponse = await sendMail(email, subject, text);

      return res.status(200).json({

        success: true,

        message: languageMessages.resetPassword,
        mailResponse:mailResponse
      });

    });

  } catch (err) {

    return res.status(200).json({

      success: false,

      message: languageMessages.internalServerError,

      error: err.message,

    });

  }

};

const subAdminForgetNewPassword = async (request, response) => {
  const { newPassword, doctor_id } = request.body;

  if (!doctor_id) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "doctor_id",
    });
  }

  if (!newPassword) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "newPassword",
    });
  }

  try {

    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return response.status(200).json({
          success: false,

          msg: languageMessages.internalServerError,

          error: err,
        });
      }
      if (check.length <= 0) {
        return response.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }



      const hashedPass = await hashPassword(newPassword);

      var updatepassword =
        "UPDATE doctor_master SET password = ?, updatetime = NOW() WHERE doctor_id = ? AND delete_flag = 0";

      connection.query(updatepassword, [hashedPass, doctor_id], async (err) => {
        if (err) {
          return response.status(200).json({
            success: false,

            msg: languageMessages.internalServerError,

            error: err,
          });
        } else {
          return response.status(200).json({
            success: true,

            msg: languageMessages.CreateNewPassword,
          });
        }
      });
    })

  } catch (err) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      error: err,
    });
  }
};

//----------------------subAdmin Dashboard---------------
const subAdminDashboard = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      // const query = "SELECT patient_id ,doctor_id FROM patient_master WHERE doctor_id = ? AND delete_flag = 0";
      // connection.query(query, [doctor_id], async (err, result) => {
      //   if (err) {
      //     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      //   }
      //   return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, totalPatients: result.length })
      // })
      const totalSql = `
        SELECT COUNT(*) as totalPatients
        FROM patient_master
        WHERE doctor_id = ? AND delete_flag = 0
        `;

        connection.query(totalSql, [doctor_id], (err, totalRes) => {

          const totalPatients = totalRes[0].totalPatients;

          // CURRENT WEEK
          const currentWeekSql = `
          SELECT COUNT(*) as currentWeek
          FROM patient_master
          WHERE doctor_id = ?
          AND delete_flag = 0
          AND createtime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          `;

          connection.query(currentWeekSql, [doctor_id], (err, currentRes) => {

            const currentWeek = currentRes[0].currentWeek;

            // LAST WEEK
            const lastWeekSql = `
            SELECT COUNT(*) as lastWeek
            FROM patient_master
            WHERE doctor_id = ?
            AND delete_flag = 0
            AND createtime BETWEEN
            DATE_SUB(NOW(), INTERVAL 14 DAY)
            AND DATE_SUB(NOW(), INTERVAL 7 DAY)
            `;

            connection.query(lastWeekSql, [doctor_id], (err, lastRes) => {

              const lastWeek = lastRes[0].lastWeek;

             let growth = 0;

              if (lastWeek === 0) {
                if (currentWeek > 0) {
                  growth = 100; // full growth 
                } else {
                  growth = 0;
                }
              } else {
                growth = ((currentWeek - lastWeek) / lastWeek) * 100;
                  growth = Math.min(growth, 100);
              }

              return res.status(200).json({
                success: true,
                msg: languageMessages.msgDataFound,
                totalPatients: totalPatients,
                currentWeekPatients: currentWeek,
                lastWeekPatients: lastWeek,
                patientGrowth: growth.toFixed(2)
              });

            });

          });

        });
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}

//medication dashboard function
const medicationDashboard = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
    }

    const checksql = "SELECT doctor_id, doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound });
      }

      // const query = `
      //   SELECT COUNT(mm.medication_id) AS totalMedication
      //   FROM patient_master AS pm
      //   LEFT JOIN medication_master AS mm ON pm.user_id = mm.user_id AND mm.delete_flag = 0 AND pm.delete_flag = 0
      //   WHERE pm.doctor_id = ?
      // `;

      // connection.query(query, [doctor_id], async (err, result) => {
      //   if (err) {
      //     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
      //   }

      //   return res.status(200).json({
      //     success: true,
      //     msg: languageMessages.msgDataFound,
      //     totalMedication: result[0].totalMedication
      //   });
      // });
      // ================= TOTAL =================
        const totalSql = `
          SELECT COUNT(mm.medication_id) AS totalMedication
          FROM patient_master pm
          LEFT JOIN medication_master mm 
            ON pm.user_id = mm.user_id 
            AND mm.delete_flag = 0
          WHERE pm.doctor_id = ? 
          AND pm.delete_flag = 0
        `;

        connection.query(totalSql, [doctor_id], (err, totalRes) => {

          if (err) {
            return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
          }

          const totalMedication = totalRes[0].totalMedication;

          // ================= CURRENT WEEK =================
          // const currentWeekSql = `
          //   SELECT COUNT(mm.medication_id) AS currentWeek
          //   FROM patient_master pm
          //   LEFT JOIN medication_master mm 
          //     ON pm.user_id = mm.user_id 
          //     AND mm.delete_flag = 0
          //   WHERE pm.doctor_id = ?
          //   AND pm.delete_flag = 0
          //   AND mm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          // `;
          const currentWeekSql = `
            SELECT COUNT(mm.medication_id) AS currentWeek
            FROM patient_master pm
            LEFT JOIN medication_master mm 
              ON pm.user_id = mm.user_id 
              AND mm.delete_flag = 0
              AND mm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            WHERE pm.doctor_id = ?
            AND pm.delete_flag = 0
          `;

          connection.query(currentWeekSql, [doctor_id], (err, currentRes) => {

            if (err) {
              return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
            }

            const currentWeek = currentRes[0].currentWeek;

            // ================= LAST WEEK =================
            // const lastWeekSql = `
            //   SELECT COUNT(mm.medication_id) AS lastWeek
            //   FROM patient_master pm
            //   LEFT JOIN medication_master mm 
            //     ON pm.user_id = mm.user_id 
            //     AND mm.delete_flag = 0
            //   WHERE pm.doctor_id = ?
            //   AND pm.delete_flag = 0
            //   AND mm.createtime BETWEEN 
            //     DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            //     AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            // `;
            const lastWeekSql = `
              SELECT COUNT(mm.medication_id) AS lastWeek
              FROM patient_master pm
              LEFT JOIN medication_master mm 
                ON pm.user_id = mm.user_id 
                AND mm.delete_flag = 0
                AND mm.createtime BETWEEN 
                  DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                  AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              WHERE pm.doctor_id = ?
              AND pm.delete_flag = 0
            `;

            connection.query(lastWeekSql, [doctor_id], (err, lastRes) => {

              if (err) {
                return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
              }

              const lastWeek = lastRes[0].lastWeek;

              // ================= GROWTH =================
              let growth = 0;

            if (lastWeek === 0) {
              growth = currentWeek > 0 ? 100 : 0;
            } else {
              growth = ((currentWeek - lastWeek) / lastWeek) * 100;
                growth = Math.min(growth, 100);
            }
              

              return res.status(200).json({
                success: true,
                msg: languageMessages.msgDataFound,
                totalMedication: totalMedication,
                currentWeekMedication: currentWeek,
                lastWeekMedication: lastWeek,
                medicationGrowth: growth.toFixed(2)
              });

            });

          });

        });
    });

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message });
  }
};

//adverse dashboard function
const adverseDashboard = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      // const query = "SELECT adverse_reaction_id FROM adverse_reaction_master WHERE delete_flag = 0";
      // const query = "SELECT COUNT(asm.adverse_reaction_id) AS adverse_count FROM patient_master AS pm LEFT JOIN adverse_reaction_master AS asm ON pm.user_id = asm.user_id WHERE pm.doctor_id = ? AND asm.delete_flag = 0 AND pm.delete_flag =0";
      // connection.query(query, [doctor_id], async (err, result) => {
      //   if (err) {
      //     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      //   }
      //   return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, totalAdverseReaction: result[0].adverse_count })
      // })
        // ================= TOTAL =================
        const totalSql = `
          SELECT COUNT(asm.adverse_reaction_id) AS totalAdverseReaction
          FROM patient_master pm
          LEFT JOIN adverse_reaction_master asm 
            ON pm.user_id = asm.user_id 
            AND asm.delete_flag = 0
          WHERE pm.doctor_id = ? 
          AND pm.delete_flag = 0
        `;

        connection.query(totalSql, [doctor_id], (err, totalRes) => {

          if (err) {
            return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
          }

          const totalAdverseReaction = totalRes[0].totalAdverseReaction;

          // ================= CURRENT WEEK =================
          // const currentWeekSql = `
          //   SELECT COUNT(asm.adverse_reaction_id) AS currentWeek
          //   FROM patient_master pm
          //   LEFT JOIN adverse_reaction_master asm 
          //     ON pm.user_id = asm.user_id 
          //     AND asm.delete_flag = 0
          //   WHERE pm.doctor_id = ?
          //   AND pm.delete_flag = 0
          //   AND asm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          // `;
          const currentWeekSql = `
            SELECT COUNT(asm.adverse_reaction_id) AS currentWeek
            FROM patient_master pm
            LEFT JOIN adverse_reaction_master asm 
              ON pm.user_id = asm.user_id 
              AND asm.delete_flag = 0
              AND asm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            WHERE pm.doctor_id = ?
            AND pm.delete_flag = 0
          `;

          connection.query(currentWeekSql, [doctor_id], (err, currentRes) => {

            if (err) {
              return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
            }

            const currentWeek = currentRes[0].currentWeek;

            // ================= LAST WEEK =================
            // const lastWeekSql = `
            //   SELECT COUNT(asm.adverse_reaction_id) AS lastWeek
            //   FROM patient_master pm
            //   LEFT JOIN adverse_reaction_master asm 
            //     ON pm.user_id = asm.user_id 
            //     AND asm.delete_flag = 0
            //   WHERE pm.doctor_id = ?
            //   AND pm.delete_flag = 0
            //   AND asm.createtime BETWEEN 
            //     DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            //     AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            // `;
            const lastWeekSql = `
              SELECT COUNT(asm.adverse_reaction_id) AS lastWeek
              FROM patient_master pm
              LEFT JOIN adverse_reaction_master asm 
                ON pm.user_id = asm.user_id 
                AND asm.delete_flag = 0
                AND asm.createtime BETWEEN 
                  DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                  AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              WHERE pm.doctor_id = ?
              AND pm.delete_flag = 0
            `;

            connection.query(lastWeekSql, [doctor_id], (err, lastRes) => {

              if (err) {
                return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
              }

              const lastWeek = lastRes[0].lastWeek;

              // ================= GROWTH =================
              let growth = 0;


              if (lastWeek === 0) {
                growth = currentWeek > 0 ? 100 : 0;
              } else {
                growth = ((currentWeek - lastWeek) / lastWeek) * 100;
                  growth = Math.min(growth, 100);

              }

              return res.status(200).json({
                success: true,
                msg: languageMessages.msgDataFound,
                totalAdverseReaction: totalAdverseReaction,
                currentWeekAdverse: currentWeek,
                lastWeekAdverse: lastWeek,
                adverseGrowth: growth.toFixed(2)
              });

            });

          });

        });
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}

//lab report dashboard function
const labReportDashboard = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      // const query = "SELECT medical_report_id FROM medical_report_master WHERE delete_flag = 0";
      // const query = "SELECT COUNT(mrm.medical_report_id) AS report_count FROM patient_master AS pm LEFT JOIN medical_report_master AS mrm ON pm.user_id = mrm.user_id WHERE pm.doctor_id = ? AND mrm.delete_flag = 0 AND pm.delete_flag =0";
      // connection.query(query, [doctor_id], async (err, result) => {
      //   if (err) {
      //     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      //   }
      //   return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, totalLabReports: result[0].report_count })
      // })
      // ================= TOTAL =================
      const totalSql = `
        SELECT COUNT(mrm.medical_report_id) AS totalLabReports
        FROM patient_master pm
        LEFT JOIN medical_report_master mrm 
          ON pm.user_id = mrm.user_id 
          AND mrm.delete_flag = 0
        WHERE pm.doctor_id = ? 
        AND pm.delete_flag = 0
      `;

      connection.query(totalSql, [doctor_id], (err, totalRes) => {

        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
        }

        const totalLabReports = totalRes[0].totalLabReports;

        // ================= CURRENT WEEK =================
        // const currentWeekSql = `
        //   SELECT COUNT(mrm.medical_report_id) AS currentWeek
        //   FROM patient_master pm
        //   LEFT JOIN medical_report_master mrm 
        //     ON pm.user_id = mrm.user_id 
        //     AND mrm.delete_flag = 0
        //   WHERE pm.doctor_id = ?
        //   AND pm.delete_flag = 0
        //   AND mrm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        // `;
        const currentWeekSql = `
          SELECT COUNT(mrm.medical_report_id) AS currentWeek
          FROM patient_master pm
          LEFT JOIN medical_report_master mrm 
            ON pm.user_id = mrm.user_id 
            AND mrm.delete_flag = 0
            AND mrm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          WHERE pm.doctor_id = ?
          AND pm.delete_flag = 0
        `;

        connection.query(currentWeekSql, [doctor_id], (err, currentRes) => {

          if (err) {
            return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
          }

          const currentWeek = currentRes[0].currentWeek;

          // ================= LAST WEEK =================
          // const lastWeekSql = `
          //   SELECT COUNT(mrm.medical_report_id) AS lastWeek
          //   FROM patient_master pm
          //   LEFT JOIN medical_report_master mrm 
          //     ON pm.user_id = mrm.user_id 
          //     AND mrm.delete_flag = 0
          //   WHERE pm.doctor_id = ?
          //   AND pm.delete_flag = 0
          //   AND mrm.createtime BETWEEN 
          //     DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          //     AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          // `;

          const lastWeekSql = `
              SELECT COUNT(mrm.medical_report_id) AS lastWeek
              FROM patient_master pm
              LEFT JOIN medical_report_master mrm 
                ON pm.user_id = mrm.user_id 
                AND mrm.delete_flag = 0
                AND mrm.createtime BETWEEN 
                  DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                  AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              WHERE pm.doctor_id = ?
              AND pm.delete_flag = 0
            `;

          connection.query(lastWeekSql, [doctor_id], (err, lastRes) => {

            if (err) {
              return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
            }

            const lastWeek = lastRes[0].lastWeek;

            // ================= GROWTH =================
            let growth = 0;

           if (lastWeek === 0) {
              growth = currentWeek > 0 ? 100 : 0;
            } else {
              growth = ((currentWeek - lastWeek) / lastWeek) * 100;
                  growth = Math.min(growth, 100);

            }

            return res.status(200).json({
              success: true,
              msg: languageMessages.msgDataFound,
              totalLabReports: totalLabReports,
              currentWeekLabReports: currentWeek,
              lastWeekLabReports: lastWeek,
              labReportGrowth: growth.toFixed(2)
            });

          });

        });

      });
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}

//measurement dashboard function 
const measurementDashboard = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }
      // const query = "SELECT measurement_id FROM measurement_master WHERE delete_flag = 0";
      // const query = "SELECT COUNT(mrm.measurement_id) AS report_count FROM patient_master AS pm LEFT JOIN measurement_master AS mrm ON pm.user_id = mrm.user_id WHERE pm.doctor_id = ? AND mrm.delete_flag = 0 AND pm.delete_flag =0"; 
      // connection.query(query, [doctor_id], async (err, result) => {
      //   if (err) {
      //     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      //   }
      //   return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, totalmeasurement: result[0].report_count })
      // })// ================= TOTAL =================
      const totalSql = `
        SELECT COUNT(mrm.measurement_id) AS totalmeasurement
        FROM patient_master pm
        LEFT JOIN measurement_master mrm 
          ON pm.user_id = mrm.user_id 
          AND mrm.delete_flag = 0
        WHERE pm.doctor_id = ? 
        AND pm.delete_flag = 0
      `;

      connection.query(totalSql, [doctor_id], (err, totalRes) => {

        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
        }

        const totalmeasurement = totalRes[0].totalmeasurement;

        // ================= CURRENT WEEK =================
        // const currentWeekSql = `
        //   SELECT COUNT(mrm.measurement_id) AS currentWeek
        //   FROM patient_master pm
        //   LEFT JOIN measurement_master mrm 
        //     ON pm.user_id = mrm.user_id 
        //     AND mrm.delete_flag = 0
        //   WHERE pm.doctor_id = ?
        //   AND pm.delete_flag = 0
        //   AND mrm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        // `;
        const currentWeekSql = `
          SELECT COUNT(mrm.measurement_id) AS currentWeek
          FROM patient_master pm
          LEFT JOIN measurement_master mrm 
            ON pm.user_id = mrm.user_id 
            AND mrm.delete_flag = 0
            AND mrm.createtime >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          WHERE pm.doctor_id = ?
          AND pm.delete_flag = 0
        `;

        connection.query(currentWeekSql, [doctor_id], (err, currentRes) => {

          if (err) {
            return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
          }

          const currentWeek = currentRes[0].currentWeek;

          // ================= LAST WEEK =================
          // const lastWeekSql = `
          //   SELECT COUNT(mrm.measurement_id) AS lastWeek
          //   FROM patient_master pm
          //   LEFT JOIN measurement_master mrm 
          //     ON pm.user_id = mrm.user_id 
          //     AND mrm.delete_flag = 0
          //   WHERE pm.doctor_id = ?
          //   AND pm.delete_flag = 0
          //   AND mrm.createtime BETWEEN 
          //     DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          //     AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          // `;

          const lastWeekSql = `
              SELECT COUNT(mrm.measurement_id) AS lastWeek
              FROM patient_master pm
              LEFT JOIN measurement_master mrm 
                ON pm.user_id = mrm.user_id 
                AND mrm.delete_flag = 0
                AND mrm.createtime BETWEEN 
                  DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                  AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              WHERE pm.doctor_id = ?
              AND pm.delete_flag = 0
            `;

          connection.query(lastWeekSql, [doctor_id], (err, lastRes) => {

            if (err) {
              return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
            }

            const lastWeek = lastRes[0].lastWeek;

            // ================= GROWTH =================
            let growth = 0;

           if (lastWeek === 0) {
              growth = currentWeek > 0 ? 100 : 0;
            } else {
              growth = ((currentWeek - lastWeek) / lastWeek) * 100;
                growth = Math.min(growth, 100);
            }

            return res.status(200).json({
              success: true,
              msg: languageMessages.msgDataFound,
              totalmeasurement: totalmeasurement,
              currentWeekMeasurement: currentWeek,
              lastWeekMeasurement: lastWeek,
              measurementGrowth: growth.toFixed(2)
            });

          });

        });

      });
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}


//----------------------get all patients---------------
const getAllPatients = async (req, res) => {
  const doctor_id = req.doctor_id;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id", doctor_id });
    }
    const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
    connection.query(checksql, [doctor_id], async (err, check) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (check.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
      }

      const patientsql = "SELECT p.patient_id ,p.doctor_id ,p.user_id,p.createtime,p.updatetime, u.user_unique_id, u.email,u.name,u.mobile,u.image FROM patient_master p JOIN user_master u ON u.user_id = p.user_id  WHERE p.doctor_id = ? AND p.delete_flag= 0 AND p.delete_flag =0 ORDER BY p.patient_id desc";
      connection.query(patientsql, [doctor_id], async (err, patient) => {
        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
        }
        if (patient.length <= 0) {
          return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, patient: "NA" })
        }
        patient.map((item) => {
          item.createtime = moment(item.createtime).format('DD-MM-YYYY hh:mm A');
          item.updatetime = moment(item.updatetime).format('DD-MM-YYYY hh:mm A');
        })
        return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, patient })
      })
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}

//---------------------------get patients details--------------
// const getPatientsDetails = async (req, res) => {
//   const doctor_id = req.doctor_id;
//   const { user_id } = req.query;
//   try {
//     if (!doctor_id) {
//       return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
//     }
//     if (!user_id) {
//       return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });
//     }
//     const checksql = "SELECT doctor_id ,doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0 ";
//     connection.query(checksql, [doctor_id], async (err, check) => {
//       if (err) {
//         return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
//       }
//       if (check.length <= 0) {
//         return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound })
//       }

//       const patientsql = "SELECT user_id ,email,name,mobile,image,address,dob,createtime,updatetime,active_flag  FROM user_master WHERE user_id = ?";
//       connection.query(patientsql, [user_id], async (err, patient) => {
//         if (err) {
//           return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
//         }
//         if (patient.length <= 0) {
//           return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, patient: "NA" })
//         }
//         patient.map((item) => {
//           item.createtime = moment(item.createtime).format('YYYY-MM-DD HH:mm:ss');
//           item.updatetime = moment(item.updatetime).format('YYYY-MM-DD HH:mm:ss');
//           item.dob = moment(item.updatetime).format('YYYY-MM-DD');
//         })

//         const reportsql = "SELECT 	mr.medical_report_id,mr.createtime,mr.file,rc.report_category_id ,rc.category_name FROM medical_report_master as mr JOIN report_share_master as rs on rs.medical_report_id=mr.medical_report_id JOIN report_category as rc on rc.report_category_id=mr.report_category_id  WHERE rs.doctor_id= ?  AND rs.user_id = ? AND mr.delete_flag = 0 ORDER BY mr.medical_report_id desc";
//         connection.query(reportsql, [doctor_id, user_id], async (err, report) => {
//           if (err) {
//             return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
//           }
//           if (report.length <= 0) {
//             return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, patienDetails: patient[0], report: "NA" })
//           }
//           report.map((item) => {
//             item.createtime = moment(item.createtime).format('YYYY-MM-DD HH:mm:ss');
//           })
//           return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, patienDetails: patient[0], report })
//         })
//       })
//     })

//   } catch (error) {
//     return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
//   }
// }

const getPatientsDetails = async (req, res) => {
  const doctor_id = req.doctor_id;
  const { user_id } = req.query;

  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
    }

    if (!user_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });
    }

    // Step 1: Validate doctor
    const checksql = "SELECT doctor_id, doctor_name FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
    connection.query(checksql, [doctor_id], async (err, doctorCheck) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
      }

      if (doctorCheck.length === 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound });
      }

      // Step 2: Get patient details
      const patientsql = `
        SELECT 
          um.user_id, um.email, um.user_unique_id, um.name, um.mobile, um.image, um.address, um.dob, um.weight, um.height, um.diseases,um.gender,
          um.createtime, um.updatetime, um.active_flag, rsm.information_type 
        FROM user_master AS um LEFT JOIN report_share_master AS rsm ON um.user_id = rsm.user_id
        WHERE um.user_id = ?
      `;

      connection.query(patientsql, [user_id], async (err, patientRes) => {
        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
        }

        if (patientRes.length === 0) {
          return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, patienDetails: "NA" });
        }

        const data = patientRes[0];
        const diseasesIds = data.diseases;

        const patient = {
          user_id: data.user_id,
          email: data.email,
          user_unique_id: data.user_unique_id,
          name: data.name,
          mobile: data.mobile,
          image: data.image,
          address: data.address,
          dob: moment(data.dob).format("YYYY-MM-DD"),
          age: moment().diff(moment(data.dob), 'years'),
           gender: data.gender, 
          weight: data.weight,
          height: data.height,
          information_type: data.information_type,
          active_flag: data.active_flag,
          diseaseName: data.diseases,
          createtime: moment(data.createtime).format("DD-MM-YYYY hh:mm A"),
          updatetime: moment(data.updatetime).format("DD-MM-YYYY hh:mm A"),
          disease_names: ""
        };

        // Step 3: If diseases exist, fetch names
        if (diseasesIds) {
          const diseaseQuery = `
            SELECT GROUP_CONCAT(disease_name SEPARATOR ', ') AS disease_names 
            FROM disease_master 
            WHERE FIND_IN_SET(disease_id, ?)
          `;
          connection.query(diseaseQuery, [diseasesIds], (err, diseaseRes) => {
            if (!err && diseaseRes.length > 0) {
              patient.disease_names = diseaseRes[0].disease_names || "";
            }

            // Step 4: Get reports
            const reportsql = `
              SELECT 
                mr.medical_report_id, mr.createtime, mr.file,
                rc.report_category_id, rc.category_name 
              FROM medical_report_master mr
              JOIN report_share_master rs ON rs.medical_report_id = mr.medical_report_id
              JOIN report_category rc ON rc.report_category_id = mr.report_category_id
              WHERE rs.doctor_id = ? AND rs.user_id = ? AND mr.delete_flag = 0
              ORDER BY mr.medical_report_id DESC
            `;

            connection.query(reportsql, [doctor_id, user_id], (err, report) => {
              if (err) {
                return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
              }

              report.forEach(r => {
                r.createtime = moment(r.createtime).format("YYYY-MM-DD HH:mm:ss");
              });

              return res.status(200).json({
                success: true,
                msg: languageMessages.msgDataFound,
                patienDetails: patient,
                report: report.length > 0 ? report : "NA"
              });
            });
          });
        } else {
          // No diseases, proceed to report
          const reportsql = `
            SELECT 
              mr.medical_report_id, mr.createtime, mr.file,
              rc.report_category_id, rc.category_name 
            FROM medical_report_master mr
            JOIN report_share_master rs ON rs.medical_report_id = mr.medical_report_id
            JOIN report_category rc ON rc.report_category_id = mr.report_category_id
            WHERE rs.doctor_id = ? AND rs.user_id = ? AND mr.delete_flag = 0
            ORDER BY mr.medical_report_id DESC
          `;

          connection.query(reportsql, [doctor_id, user_id], (err, report) => {
            if (err) {
              return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message });
            }

            report.forEach(r => {
              r.createtime = moment(r.createtime).format("YYYY-MM-DD HH:mm:ss");
            });

            return res.status(200).json({
              success: true,
              msg: languageMessages.msgDataFound,
              patienDetails: patient,
              report: report.length > 0 ? report : "NA"
            });
          });
        }
      });
    });
  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message });
  }
};
//get medications 
const getAllMedications = async (req, res) => {
  try {
    const { user_id } = req.query
    if (!user_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });
    }
    const patientsql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(patientsql, [user_id], (err, patient) => {
      if (err) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
      }
      if (patient.length <= 0) {
        return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, patient: "NA" })
      }

      //get medication details 
      const getquery = `SELECT 
  m.medication_id, 
  m.user_id, 
  m.medicine_id, 
  m.dosage, 
  m.type, 
  m.schedule, 
  m.weekday, 
  m.current_quantity, 
  ts.time AS reminder_time, 
  m.remainder_quantity, 
  m.remaining_quantity, 
  m.instruction, 
  m.status, 
  m.createtime, 
  mm.medicine_name 
FROM 
  medication_master m
JOIN 
  medicine_master mm ON m.medicine_id = mm.medicine_id
JOIN 
  time_slots_master ts ON m.medication_id = ts.medication_id
WHERE 
  m.user_id = ? AND m.delete_flag = 0;
`
      connection.query(getquery, [user_id], (err, result) => {
        if (err) {
          return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
        }
        if (result.length <= 0) {
          return res.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, med_array: [] })
        }

        const med_array = result.map(data => ({
          medication_id: data.medication_id,
          type: data.type,
          user_id: data.user_id,
          medicine_id: data.medicine_id,
          dosage: data.dosage,
          schedule: data.schedule,
          weekday: data.weekday,
          current_quantity: data.current_quantity,
          reminder_time: data.reminder_time,
          remind_quantity: data.remind_quantity,
          remaining_quantity: data.remaining_quantity,
          instruction: data.instruction,
          status: data.status,
          createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm:ss"),
          medicine_name: data.medicine_name,
        }))

        return res.status(200).json({ success: true, msg: languageMessages.msgDataFound, med_array: med_array })

      })
    })

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message, });
  }
}


const getAllMeasurements = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "user_id"
      });
    }

    // First check if user exists
    const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(patientSql, [user_id], (err, patient) => {
      if (err) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      if (patient.length <= 0) {
        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          patient: "NA"
        });
      }

      // Get measurement details
      const getQuery = `
                SELECT 
                    type, 
                    user_id, 
                    measurement_id, 
                    systolic_bp, 
                    diastolic_bp, 
                    pulse, 
                    weight, 
                    createtime, 
                    date, 
                    fasting_glucose,
                    temperature,
                    ppbgs,
                    symptom,
                    symptom_range,
                    time 
                FROM 
                    measurement_master
                WHERE 
                    user_id = ? 
                    AND delete_flag = 0
                ORDER BY createtime DESC
            `;

      connection.query(getQuery, [user_id], (err, results) => {
        if (err) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
        }

        if (results.length <= 0) {
          return res.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            measurements: []
          });
        }

        let format_time 

        // Format the response data
        const measurements = results.map((data, index) => {
        const format_time = moment(data.createtime).add(5, 'hours').add(30, 'minutes');
        
        return {
          // format_time: format_time.format("DD-MM-YYYY hh:mm:ss A"),
          sr_no: index + 1,
          type: data.type,
          user_id: data.user_id,
          measurement_id: data.measurement_id,
          systolic_bp: data.systolic_bp,
          diastolic_bp: data.diastolic_bp,
          pulse: data.pulse,
          weight: data.weight,
          temperature: data.temperature,
          ppbgs: data.ppbgs,
          symptom_range: data.symptom_range,
          symptom: data.symptom,
          fasting_glucose: data.fasting_glucose,
          createtime: format_time.format("DD-MM-YYYY HH:mm:ss"),
          // date: format_time.format("DD-MM-YYYY"),
          // time: format_time.format("hh:mm A")
          date : moment(data.createtime).format("DD-MM-YYYY"),
          time : moment(data.createtime).format("hh:mm A")
        };
      });


        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          measurements: measurements
        });
      });
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

const getAllMedicalReports = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "user_id"
      });
    }

    // First check if user exists
    const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(patientSql, [user_id], (err, patient) => {
      if (err) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      if (patient.length <= 0) {
        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          patient: "NA"
        });
      }

      // Get medical report details
      const getQuery = `
        SELECT 
          mrm.medical_report_id, 
          mrm.report_category_id, 
          mrm.file, 
          mrm.createtime, 
          rc.category_name 
        FROM 
          medical_report_master mrm 
        JOIN 
          report_category rc 
        ON 
          mrm.report_category_id = rc.report_category_id
        WHERE 
          mrm.user_id = ? 
          AND mrm.delete_flag = 0
        ORDER BY mrm.createtime DESC
      `;

      connection.query(getQuery, [user_id], (err, results) => {
        if (err) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
        }

        if (results.length <= 0) {
          return res.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            medical_reports: []
          });
        }

        // Format the response data
        const medicalReports = results.map(data => ({
          medical_report_id: data.medical_report_id,
          report_category_id: data.report_category_id,
          file: data.file,
          category_name: data.category_name,
          createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm:ss")
        }));

        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          medical_reports: medicalReports
        });
      });
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

//add note 
// const addNote = async (req, res) => {
//   const { description, user_id } = req.body
//   try {
//     if (!user_id) {
//       return res.status(200).json({
//         success: false,
//         msg: languageMessages.msg_empty_param,
//         key: "user_id"
//       });
//     }
//     if (!description) {
//       return res.status(200).json({
//         success: false,
//         msg: languageMessages.msg_empty_param,
//         key: "description"
//       });
//     }

//     // First check if user exists
//     const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
//     connection.query(patientSql, [user_id], (err, patient) => {
//       if (err) {
//         return res.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           err: err.message,
//         });
//       }

//       if (patient.length <= 0) {
//         return res.status(200).json({
//           success: true,
//           msg: languageMessages.msgDataNotFound,
//           patient: "NA"
//         });
//       }

//       const addquery = "INSERT INTO note_master(user_id, description, createtime, updatetime) VALUES (?,?,now(), now())"
//       connection.query(addquery, [user_id, description], (addError, addResult) => {
//         if (addError) {
//           return res.status(200).json({
//             success: false,
//             msg: languageMessages.internalServerError,
//             error: addError.message
//           })
//         }
//         if (addResult.affectedRows > 0) {
//           return res.status(200).json({
//             success: true,
//             msg: 'Note added successfully'
//           })
//         }
//       })

//     })
//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message,
//     });
//   }
// }

  const addNote = async (req, res) => {
    const { description, user_id,doctor_id  } = req.body
    // const doctor_id = req.doctor_id;
    // console.log("BODY:", req.body);
    try {
      if (!user_id) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "user_id"
        });
      }
      if (!description) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "description"
        });
      }

      
      const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
      connection.query(patientSql, [user_id], (err, patient) => {
        if (err) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
        }

        if (patient.length <= 0) {
          return res.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            patient: "NA"
          });
        }

        const addquery = "INSERT INTO note_master(user_id, doctor_id,description, createtime, updatetime) VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())"
        connection.query(addquery, [user_id, doctor_id,description], (addError, addResult) => {
          if (addError) {
            return res.status(200).json({
              success: false,
              msg: languageMessages.internalServerError,
              error: addError.message
            })
          }
          if (addResult.affectedRows > 0) {
            return res.status(200).json({
              success: true,
              msg: 'Note added successfully'
            })
          }
        })

      })
    } catch (error) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
    }
  }


//get note 
// const getNotes = async (req, res) => {
//   try {
//     const { user_id } = req.query;

//     if (!user_id) {
//       return res.status(200).json({
//         success: false,
//         msg: languageMessages.msg_empty_param,
//         key: "user_id"
//       });
//     }

//     // First check if user exists
//     const userSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
//     connection.query(userSql, [user_id], (err, user) => {
//       if (err) {
//         return res.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           err: err.message,
//         });
//       }

//       if (user.length <= 0) {
//         return res.status(200).json({
//           success: true,
//           msg: languageMessages.msgDataNotFound,
//           user: "NA"
//         });
//       }

//       // Get note details
//       const getQuery = `
//         SELECT 
//           note_id,
//           user_id, 
//           description, 
//           createtime
//         FROM 
//           note_master 
//         WHERE 
//           user_id = ? 
//           AND delete_flag = 0
//         ORDER BY createtime DESC
//       `;

//       connection.query(getQuery, [user_id], (err, results) => {
//         if (err) {
//           return res.status(200).json({
//             success: false,
//             msg: languageMessages.internalServerError,
//             err: err.message,
//           });
//         }

//         if (results.length <= 0) {
//           return res.status(200).json({
//             success: true,
//             msg: languageMessages.msgDataNotFound,
//             notes: []
//           });
//         }

//         const notes = results.map((data, index) => ({
//           sr_no: index + 1,
//           note_id: data.note_id,
//           user_id: data.user_id,
//           description: data.description,
//           createtime: moment(data.createtime).format("DD-MM-YYYY hh:mm A")
//         }));

//         // Format the response data
//         // const notes = results.map(data => ({
//         //   note_id: data.note_id,
//         //   user_id: data.user_id,
//         //   description: data.description,
//         //   createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm:ss")
//         // }));

//         return res.status(200).json({
//           success: true,
//           msg: languageMessages.msgDataFound,
//           notes: notes
//         });
//       });
//     });
//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message,
//     });
//   }
// };
const getNotes = async (req, res) => {
  
  try {
    const { user_id ,doctor_id } = req.query;

    if (!user_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "user_id"
      });
    }

    //
    const userSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(userSql, [user_id], (err, user) => {
      if (err) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      if (user.length <= 0) {
        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          user: "NA"
        });
      }

      const getQuery = `
        SELECT 
          note_id,
          user_id, 
          description, 
          createtime
        FROM 
          note_master 
        WHERE 
          user_id = ? AND doctor_id = ?
          AND delete_flag = 0
        ORDER BY createtime DESC
      `;
      // const doctor_id = req.doctor_id;

      connection.query(getQuery, [user_id,doctor_id], (err, results) => {
        if (err) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
        }

        if (results.length <= 0) {
          return res.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            notes: []
          });
        }

        const notes = results.map((data, index) => ({
          sr_no: index + 1,
          note_id: data.note_id,
          user_id: data.user_id,
          description: data.description,
          createtime: data.createtime
        }));

        // Format the response data
        // const notes = results.map(data => ({
        //   note_id: data.note_id,
        //   user_id: data.user_id,
        //   description: data.description,
        //   createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm:ss")
        // }));

        return res.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          notes: notes
        });
      });
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

const medicineOntimeCount = (medicine_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(medicine_average_id) AS medicine_ontime_count FROM medicine_average_master WHERE medicine_id = ? AND status = 0 AND delete_flag = 0`;
    connection.query(sql, [medicine_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0].medicine_ontime_count);
    });
  });
};

const medicineLateCount = (medicine_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(medicine_average_id) AS medicine_late_count FROM medicine_average_master WHERE medicine_id = ? AND status = 1 AND delete_flag = 0`;
    connection.query(sql, [medicine_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0].medicine_late_count);
    });
  });
};

const medicineNottakenCount = (medicine_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(medicine_average_id) AS medicine_nottaken_count FROM medicine_average_master WHERE medicine_id = ? AND status = 2 AND delete_flag = 0`;
    connection.query(sql, [medicine_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0].medicine_nottaken_count);
    });
  });
};


const getMedicineCounts = (medicine_id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS medicine_ontime_count,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS medicine_late_count,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS medicine_nottaken_count
      FROM medicine_average_master
      WHERE medicine_id = ? AND delete_flag = 0
    `;
    connection.query(sql, [medicine_id], (err, result) => {
      if (err) return reject(err);
      resolve(result[0] || {});
    });
  });
};

// API: Get tabular medication list   - old api upto - 20-11-2025
const getTabularMedication = async (request, response) => {

  const {
    from_date,
    to_date,
    page = 1,
    limit = 10,
  } = request.query;

  try {

    // =========================
    // Validate Parameters
    // =========================

    if (!from_date) {
      return response.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param || "from_date required",
        key: "from_date",
      });
    }

    if (!to_date) {
      return response.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param || "to_date required",
        key: "to_date",
      });
    }

    // =========================
    // Pagination Logic
    // =========================

    const pageNumber = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 10;

    const offset = (pageNumber - 1) * pageLimit;

    // =========================
    // Total Count Query
    // =========================

    const totalRecords = await new Promise((resolve, reject) => {

      const countSql = `
        SELECT COUNT(*) AS total

        FROM medication_master m

        JOIN time_slots_master tm
          ON tm.medication_id = m.medication_id

        WHERE
          m.delete_flag = 0
          AND tm.delete_flag = 0
          AND DATE(m.createtime) BETWEEN ? AND ?
      `;

      connection.query(
        countSql,
        [from_date, to_date],
        (err, result) => {

          if (err) {
            console.log("COUNT SQL ERROR:", err);
            return reject(err);
          }

          resolve(result[0].total || 0);
        }
      );
    });

    // =========================
    // Main Data Query
    // =========================

    const medication_array = await new Promise((resolve, reject) => {

      const sqlSelect = `
        SELECT 
          m.medication_id,
          m.user_id,
          m.medicine_id,
          m.dosage,
          m.type,
          m.schedule,
          m.weekday,
          m.current_quantity,

          TIME_FORMAT(tm.time, '%h:%i %p') AS reminder_time,

          m.remainder_quantity,
          tm.taken_status,
          m.pause_status,
          m.remaining_quantity,
          m.instruction,
          m.status,
          m.updatetime,
          m.createtime,

          a.medicine_name,
          a.description,

          um.name,

          COALESCE(ma.medicine_ontime_count, 0) AS medicine_ontime_count,

          COALESCE(ma.medicine_late_count, 0) AS medicine_late_count,

          COALESCE(ma.medicine_nottaken_count, 0) AS medicine_nottaken_count

        FROM medication_master m

        JOIN medicine_master a
          ON a.medicine_id = m.medicine_id

        JOIN user_master um
          ON um.user_id = m.user_id

        JOIN time_slots_master tm
          ON tm.medication_id = m.medication_id

        LEFT JOIN (
          SELECT
            medicine_id,

            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END)
              AS medicine_ontime_count,

            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END)
              AS medicine_late_count,

            SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END)
              AS medicine_nottaken_count

          FROM medicine_average_master

          WHERE delete_flag = 0

          GROUP BY medicine_id

        ) ma ON ma.medicine_id = m.medicine_id

        WHERE
          m.delete_flag = 0
          AND tm.delete_flag = 0
          AND DATE(m.createtime) BETWEEN ? AND ?

        ORDER BY m.createtime DESC

        LIMIT ?, ?
      `;

      connection.query(
        sqlSelect,
        [from_date, to_date, offset, pageLimit],
        (err, result) => {

          if (err) {
            console.log("MAIN SQL ERROR:", err);
            return reject(err);
          }

          resolve(result);
        }
      );
    });

    // =========================
    // No Data Found
    // =========================

    if (!medication_array || medication_array.length === 0) {

      return response.status(200).json({
        success: true,
        msg: languageMessages.msgNoDataFound || "No data found",
        medication_arr: [],
        pagination: {
          current_page: pageNumber,
          total_pages: 0,
          total_records: 0,
          limit: pageLimit,
        }
      });
    }

    // =========================
    // Type Labels
    // =========================

    const typeLabels = {
      1: "Tablet",
      2: "Capsule",
      3: "Lozenge",
      4: "Cream",
      5: "Drops",
      6: "Foam",
      7: "Gel",
      8: "Inhaler",
      9: "Injection",
      10: "Ointment",
      11: "Patch",
      12: "Powder",
      13: "Spray",
      14: "Suppository",
      15: "Syrup",
      16: "Granule",
      17: "Lotion",
      18: "Other",
    };

    // =========================
    // Final Data Array
    // =========================

    const user_arr = medication_array.map((data, index) => {

      return {

        s_no: offset + index + 1,

        medication_id: data.medication_id,

        user_id: data.user_id,

        patient_name: data.name,

        medicine_id: data.medicine_id,

        medicine_name: data.medicine_name,

        medicine_description: data.description,

        dosage: data.dosage,

        type: data.type,

        type_label: typeLabels[data.type] || "Unknown",

        schedule: data.schedule,

        schedule_label:
          data.schedule === 0
            ? "Daily"
            : data.schedule === 1
            ? "Weekly"
            : "Monthly",

        weekday: data.weekday,

        current_quantity: data.current_quantity,

        reminder_time: data.reminder_time,

        remind_quantity: data.remainder_quantity,

        remaining_quantity: data.remaining_quantity,

        instruction: data.instruction,

        ontime_count: data.medicine_ontime_count,

        late_count: data.medicine_late_count,

        not_taken_count: data.medicine_nottaken_count,

        status: data.status,

        status_label:
          data.status === 1
            ? "Active"
            : "Inactive",

        pause_status: data.pause_status,

        pause_status_label:
          data.pause_status === 1
            ? "Paused"
            : "Running",

        taken_status: data.taken_status,

        taken_status_label:
          data.taken_status === 1
            ? "Not Taken"
            : "Taken",

        createtime: data.createtime
          ? moment(data.createtime).format("DD-MM-YYYY hh:mm A")
          : "N/A",

        updatetime: data.updatetime
          ? moment(data.updatetime).format("DD-MM-YYYY hh:mm A")
          : "N/A",
      };
    });

    // =========================
    // Final Response
    // =========================

    return response.status(200).json({

      success: true,

      msg:
        languageMessages.msgDataFound ||
        "Data found successfully",

      medication_arr: user_arr,

      pagination: {

        current_page: pageNumber,

        total_pages: Math.ceil(totalRecords / pageLimit),

        total_records: totalRecords,

        limit: pageLimit,

        has_next_page:
          pageNumber < Math.ceil(totalRecords / pageLimit),

        has_previous_page:
          pageNumber > 1,
      }
    });

  } catch (error) {

    console.log(
      "getTabularMedication ERROR:",
      error
    );

    return response.status(500).json({
      success: false,
      msg:
        languageMessages.internalServerError ||
        "Internal Server Error",
      error: error.message,
    });
  }
};


// new api updated on 20-11-2025










//get tabular adverse 
// const getTabularAdverse = async (request, response) => {
//   const { from_date, to_date } = request.query;

//   try {
//     if (!from_date) {
//       return response.status(200).json({
//         status: true,
//         msg: languageMessages.msg_empty_param,
//         key: "from_date",
//       });
//     }

//     if (!to_date) {
//       return response.status(200).json({
//         status: true,
//         msg: languageMessages.msg_empty_param,
//         key: "to_date",
//       });
//     }

//     const sqlSelect = `SELECT 
//       a.adverse_reaction_id,
//       a.user_id, 
//       um.name AS patient_name,
//       m.medicine_name,
//       a.dosage,
//       mm.category_name AS medicine_category,
//       s.symptom_name,
//       a.medication_start_date,
//       a.reaction_date,
//       a.createtime,
//       a.updatetime,
//     FROM adverse_reaction_master AS a 
//     JOIN medicine_master AS m ON m.medicine_id = a.medicine_id 
//     JOIN medicine_category_master AS mm ON mm.medicine_category_id = m.medicine_category_id 
//     JOIN symptoms_master AS s ON s.symptom_id = a.symptom_id 
//     JOIN user_master um ON um.user_id = a.user_id 
//     WHERE a.delete_flag = 0
//     AND DATE(a.createtime) BETWEEN ? AND ?  
//     ORDER BY a.createtime DESC`;

//     connection.query(sqlSelect, [from_date, to_date], (err, result) => {
//       if (err) {
//         return response.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           err: err.message,
//         });
//       }

//       const adverse_arr = [];
//       let s_no = 0;

//       if (result.length > 0) {
//         for (const data of result) {
//           s_no++;

//           adverse_arr.push({
//             s_no: s_no,
//             adverse_reaction_id: data.adverse_reaction_id,
//             user_id: data.user_id,
//             patient_name: data.patient_name,
//             medicine_name: data.medicine_name,
//             dosage: data.dosage,
//             medicine_category: data.medicine_category,
//             symptom_name: data.symptom_name,
//             medication_start_date: data.medication_start_date
//               ? moment(data.medication_start_date).format("DD-MM-YYYY")
//               : "N/A",
//             reaction_date: data.reaction_date
//               ? moment(data.reaction_date).format("DD-MM-YYYY")
//               : "N/A",
//             createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm A"),
//             updatetime: data.updatetime
//               ? moment(data.updatetime).format("DD-MM-YYYY HH:mm A")
//               : "N/A"
//           });
//         }
//       }

//       return response.status(200).json({
//         success: true,
//         msg: result.length > 0 ? languageMessages.msgDataFound : languageMessages.msgDataNotFound,
//         adverse_arr: adverse_arr.length > 0 ? adverse_arr : "NA",
//         total_records: adverse_arr.length
//       });
//     });
//   } catch (error) {
//     return response.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message,
//     });
//   }
// };

const getTabularAdverse = async (request, response) => {
  const { from_date, to_date } = request.query;

  try {
    if (!from_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "from_date",
      });
    }

    if (!to_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "to_date",
      });
    }

    const sqlSelect = `
      SELECT 
        a.adverse_reaction_id,
        a.type,
        a.user_id, 
        um.name AS patient_name,
        m.medicine_name,
        a.dosage,
        mm.category_name AS medicine_category,
        s.symptom_name,
        a.details,
        a.medication_start_date,
        a.reaction_date,
        a.createtime,
        a.updatetime
      FROM adverse_reaction_master AS a 
      LEFT JOIN medicine_master AS m ON m.medicine_id = a.medicine_id 
      LEFT JOIN medicine_category_master AS mm ON mm.medicine_category_id = a.medicine_category_id 
      LEFT JOIN symptoms_master AS s ON s.symptom_id = a.symptom_id 
      LEFT JOIN user_master AS um ON um.user_id = a.user_id 
      WHERE a.delete_flag = 0
      AND DATE(a.createtime) BETWEEN ? AND ?
      ORDER BY a.createtime DESC
    `;

    connection.query(sqlSelect, [from_date, to_date], (err, rows) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      if (rows.length === 0) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.msgDataNotFound,
          adverse_arr: [],
          total_records: 0,
        });
      }

      let s_no = 0;
      const adverse_arr = rows.map((data) => {
        s_no++;
        return {
          s_no,
          adverse_reaction_id: data.adverse_reaction_id,
          user_id: data.user_id,
          patient_name: data.patient_name,
          medicine_name: data.medicine_name,
          dosage: data.dosage,
          medicine_category:
            data.type == 1 ? "Tablet" :
            data.type == 2 ? "Capsule" :
            data.type == 3 ? "Lozenge" :
            data.type == 4 ? "Cream" :
            data.type == 5 ? "Drops" :
            data.type == 6 ? "Foam" :
            data.type == 7 ? "Gel" :
            data.type == 8 ? "Inhaler" :
            data.type == 9 ? "Injection" :
            data.type == 10 ? "Ointment" :
            data.type == 11 ? "Patch" :
            data.type == 12 ? "Powder" :
            data.type == 13 ? "Spray" :
            data.type == 14 ? "Suppository" :
            data.type == 15 ? "Syrup" :
            data.type == 16 ? "Granule" :
            data.type == 17 ? "Lotion" :
            data.type == 18 ? "Other" :
            "Unknown",
          symptom_name: data.symptom_name,
          medication_start_date: data.medication_start_date
            ? moment(data.medication_start_date).tz("Europe/Paris").format("DD-MM-YYYY")
            : "N/A",
          reaction_date: data.reaction_date
            ? moment(data.reaction_date).tz("Europe/Paris").format("DD-MM-YYYY")
            : "N/A",
          instruction: data.details || "N/A",
          createtime: moment(data.createtime).tz("Europe/Paris").format("DD-MM-YYYY hh:mm A"),
          updatetime: data.updatetime
            ? moment(data.updatetime).tz("Europe/Paris").format("DD-MM-YYYY hh:mm A")
            : "N/A",
        };
      });

      return response.status(200).json({
        success: true,
        msg: languageMessages.msgDataFound,
        adverse_arr,
        total_records: adverse_arr.length,
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

//get measurement tabular 
const getTabularMeasurement = async (request, response) => {
  const { from_date, to_date } = request.query;

  try {
    if (!from_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "from_date",
      });
    }

    if (!to_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "to_date",
      });
    }

    const sqlSelect = `SELECT 
                    mm.type, 
                    mm.user_id, 
                    mm.measurement_id, 
                    mm.systolic_bp, 
                    mm.diastolic_bp, 
                    mm.pulse, 
                    mm.weight, 
                    mm.createtime, 
                    mm.date, 
                    mm.fasting_glucose,
                    mm.temperature,
                    mm.ppbgs,
                    mm.symptom,
                    mm.symptom_range,
                    mm.time,
                    um.name AS patient_name
                FROM 
                    measurement_master mm JOIN user_master um ON mm.user_id = um.user_id
    WHERE mm.delete_flag = 0
    AND DATE(mm.createtime) BETWEEN ? AND ?  
    ORDER BY mm.createtime DESC`;

    connection.query(sqlSelect, [from_date, to_date], (err, result) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      const measurement_arr = [];
      let s_no = 0;

      if (result.length > 0) {
        for (const data of result) {
          s_no++;

          measurement_arr.push({
            s_no: s_no,
            measurement_id: data.measurement_id,
            user_id: data.user_id,
            patient_name: data.patient_name,
            type: data.type,
            systolic_bp: data.systolic_bp,
            diastolic_bp: data.diastolic_bp,
            pulse: data.pulse,
            weight: data.weight,
            fasting_glucose: data.fasting_glucose,
            temperature: data.temperature,
            ppbgs: data.ppbgs,
            symptom_range: data.symptom_range,
            symptom: data.symptom,
            date: moment(data.createtime).format("DD-MM-YYYY"),
            time: moment(data.createtime).format("hh:mm A"),
            createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm A")

          });
        }
      }

      return response.status(200).json({
        success: true,
        msg: result.length > 0 ? languageMessages.msgDataFound : languageMessages.msgDataNotFound,
        measurement_arr: measurement_arr.length > 0 ? measurement_arr : [],
        total_records: measurement_arr.length
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

//get lab report tabular 
const getTabularLabreport = async (request, response) => {
  const { from_date, to_date } = request.query;

  try {
    if (!from_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "from_date",
      });
    }

    if (!to_date) {
      return response.status(200).json({
        status: true,
        msg: languageMessages.msg_empty_param,
        key: "to_date",
      });
    }

    const sqlSelect = `SELECT 
                    mrm.medical_report_id, mrm.file, mrm.createtime, rcm.category_name, um.name AS patient_name FROM medical_report_master mrm JOIN report_category rcm ON rcm.report_category_id = mrm.report_category_id JOIN user_master um ON um.user_id = mrm.user_id WHERE mrm.delete_flag = 0
    AND DATE(mrm.createtime) BETWEEN ? AND ?  
    ORDER BY mrm.createtime DESC`;

    connection.query(sqlSelect, [from_date, to_date], (err, result) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      const report_arr = [];
      let s_no = 0;

      if (result.length > 0) {
        for (const data of result) {
          s_no++;

          report_arr.push({
            s_no: s_no,
            medical_report_id: data.medical_report_id,
            file: data.file,
            patient_name: data.patient_name,
            category_name: data.category_name,

            createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm A")

          });
        }
      }

      return response.status(200).json({
        success: true,
        msg: result.length > 0 ? languageMessages.msgDataFound : languageMessages.msgDataNotFound,
        report_arr: report_arr.length > 0 ? report_arr : [],
        total_records: report_arr.length
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

//get shared tabular 


// const getSharedTabular = async (req, res) => {
//   const { doctor_id, from_date, to_date } = req.query;

//   try {
//     // Validate required parameters
//     if (!from_date) {
//       return res.status(200).json({
//         status: false,
//         msg: languageMessages.msg_empty_param,
//         key: "from_date",
//       });
//     }

//     if (!to_date) {
//       return res.status(200).json({
//         status: false,
//         msg: languageMessages.msg_empty_param,
//         key: "to_date",
//       });
//     }

//     if (!doctor_id) {
//       return res.status(200).json({
//         status: false,
//         msg: languageMessages.msg_empty_param,
//         key: "doctor_id",
//       });
//     }

//     // Get all patients for the doctor
//     const fetchUserId = "SELECT user_id FROM patient_master WHERE doctor_id = ? AND delete_flag = 0";

//     connection.query(fetchUserId, [doctor_id], async (userError, userResult) => {
//       if (userError) {
//         return res.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           error: userError.message
//         });
//       }

//       if (userResult.length <= 0) {
//         return res.status(200).json({
//           success: false,
//           msg: 'No patients found for this doctor'
//         });
//       }

//       // Extract user IDs to an array
//       const userIds = userResult.map(data => data.user_id);

//       // Create placeholders for multiple user IDs in queries
//       const userIdPlaceholders = userIds.map(() => '?').join(',');

//       // Initialize arrays to store results
//       let medicationData = [];
//       let adverseReactionData = [];
//       let labReportData = [];
//       let measurementData = [];
//       let complianceData = [];

//       const fetchMedication = `SELECT 
//   m.medication_id, m.user_id, m.medicine_id, m.dosage, m.type, 
//   m.schedule, m.weekday, m.current_quantity, m.remainder_quantity, 
//   m.pause_status, m.remaining_quantity, m.instruction, m.status, 
//   m.updatetime, m.createtime, a.medicine_name, a.description, 
//   um.name AS patient_name, um.dob,
//   DATE_FORMAT(CONVERT_TZ(CONCAT('2024-01-01 ', tm.time), '+00:00', '+05:30'), '%h:%i %p') AS time
// FROM 
//   medication_master m 
// JOIN 
//   medicine_master a ON a.medicine_id = m.medicine_id 
// JOIN 
//   time_slots_master tm ON tm.medication_id = m.medication_id AND tm.taken_status = 0 AND tm.delete_flag = 0
// JOIN 
//   user_master um ON um.user_id = m.user_id 
// WHERE 
//   m.user_id IN (${userIdPlaceholders}) 
//   AND
//    m.delete_flag = 0 
//   AND DATE(m.createtime) BETWEEN ? AND ?
// ORDER BY 
//   m.medication_id DESC
// `

//       // SQL queries for each data type
//       // const fetchMedication = `SELECT 
//       //     m.medication_id, m.user_id, m.medicine_id, m.dosage, m.type, 
//       //     m.schedule, m.weekday, m.current_quantity, um.dob, m.remainder_quantity, m.pause_status, m.remaining_quantity, m.instruction, m.status, 
//       //     m.updatetime, m.createtime, a.medicine_name, a.description, 
//       //     um.name AS patient_name 
//       //   FROM 
//       //     medication_master m 
//       //   LEFT JOIN 
//       //     medicine_master a ON a.medicine_id = m.medicine_id 
//       //   LEFT JOIN 
//       //     user_master um ON um.user_id = m.user_id 

//       //   WHERE 
//       //     m.user_id IN (${userIdPlaceholders}) 
//       //     AND m.delete_flag = 0 
//       //     AND DATE(m.createtime) BETWEEN ? AND ? 
//       //   ORDER BY 
//       //     m.medication_id DESC`;





//       // const fetchAdverse = `
//       //   SELECT 
//       //     a.adverse_reaction_id, a.user_id, m.medicine_name, a.dosage, 
//       //     mm.category_name, s.symptom_name, a.medication_start_date, 
//       //     a.reaction_date, a.createtime, 
//       //     um.name AS patient_name 
//       //   FROM 
//       //     adverse_reaction_master AS a 
//       //   JOIN 
//       //     medicine_master as m ON m.medicine_id = a.medicine_id
//       //   JOIN 
//       //     medicine_category_master as mm ON mm.medicine_category_id = a.medicine_category_id 
//       //   JOIN 
//       //     symptoms_master as s ON s.symptom_id = a.symptom_id 
//       //   JOIN 
//       //     user_master um ON um.user_id = a.user_id 
//       //   WHERE 
//       //     a.user_id IN (${userIdPlaceholders})
//       //     AND DATE(a.createtime) BETWEEN ? AND ?`;

//      const fetchAdverse = `
//   SELECT 
//     a.adverse_reaction_id, a.user_id, m.medicine_name, a.dosage, 
//     mm.category_name, s.symptom_name, a.medication_start_date, 
//     a.reaction_date, a.createtime, 
//     um.name AS patient_name 
//   FROM 
//     adverse_reaction_master AS a 
//   LEFT JOIN 
//     medicine_master as m ON m.medicine_id = a.medicine_id
//   LEFT JOIN 
//     medicine_category_master as mm ON mm.medicine_category_id = a.medicine_category_id 
//   LEFT JOIN 
//     symptoms_master as s ON s.symptom_id = a.symptom_id 
//   LEFT JOIN 
//     user_master um ON um.user_id = a.user_id 
//   WHERE 
//     a.user_id IN (${userIdPlaceholders})
//     AND a.delete_flag = 0
//     AND (DATE(a.createtime) BETWEEN ? AND ? OR a.createtime IS NULL)`;
//       const fetchLabReport = `
//         SELECT 
//           mrm.medical_report_id, mrm.file, mrm.createtime, mrm.user_id,
//           rcm.category_name, um.name AS patient_name 
//         FROM 
//           medical_report_master mrm 
//         JOIN 
//           report_category rcm ON rcm.report_category_id = mrm.report_category_id 
//         JOIN 
//           user_master um ON um.user_id = mrm.user_id 
//         WHERE 
//           mrm.user_id IN (${userIdPlaceholders})
//           AND mrm.delete_flag = 0
//           AND DATE(mrm.createtime) BETWEEN ? AND ?  
//         ORDER BY 
//           mrm.createtime DESC`;

//       const fetchMeasurement = `
//         SELECT 
//           mm.type, mm.user_id, mm.measurement_id, mm.systolic_bp, 
//           mm.diastolic_bp, mm.pulse, mm.weight, mm.createtime, mm.symptom, mm.symptom_range,
//           DATE_FORMAT(mm.createtime, '%Y-%m-%d') AS date,
//           DATE_FORMAT(CONVERT_TZ(mm.createtime, '+00:00', '+05:30'), '%h:%i %p') AS time,
//          mm.fasting_glucose, mm.temperature, mm.ppbgs, 
//          um.name AS patient_name
//         FROM 
//           measurement_master mm 
//         JOIN 
//           user_master um ON mm.user_id = um.user_id
//         WHERE 
//           mm.user_id IN (${userIdPlaceholders})
//           AND mm.delete_flag = 0
//           AND DATE(mm.createtime) BETWEEN ? AND ?  
//         ORDER BY 
//           mm.createtime DESC`;

//       const fetchCompliance = `SELECT m.medication_id,m.user_id,m.medicine_id,m.dosage,m.type,m.schedule, m.schedule_date, m.pause_status, m.number_of_times, tm.taken_status, um.name, m.weekday,m.current_quantity, DATE_FORMAT(CONVERT_TZ(CONCAT('2024-01-01 ', tm.time), '+00:00', '+05:30'), '%h:%i %p') AS time,m.remainder_quantity,m.remaining_quantity,m.instruction,m.status,m.updatetime,a.medicine_name,a.description FROM medication_master m JOIN medicine_master a ON a.medicine_id = m.medicine_id JOIN user_master um ON um.user_id = m.user_id JOIN time_slots_master tm ON tm.medication_id = m.medication_id WHERE m.delete_flag = 0 AND m.user_id IN (${userIdPlaceholders}) AND DATE(m.createtime) BETWEEN ? AND ? ORDER BY m.medication_id desc`

//       // Execute all queries using promises
//       try {
//         // Helper function to query database with a promise
//         const queryPromise = (sql, params) => {
//           return new Promise((resolve, reject) => {
//             connection.query(sql, params, (error, results) => {
//               if (error) reject(error);
//               else resolve(results);
//             });
//           });
//         };

//         // Query params for each query (user IDs + date range)
//         const queryParams = [...userIds, from_date, to_date];

//         // Execute all queries in parallel
//         const [medicationResults, adverseResults, labResults, measurementResults, complianceResults] = await Promise.all([
//           queryPromise(fetchMedication, queryParams),
//           queryPromise(fetchAdverse, queryParams),
//           queryPromise(fetchLabReport, queryParams),
//           queryPromise(fetchMeasurement, queryParams),
//           queryPromise(fetchCompliance, queryParams)
//         ]);

//         // Return all data in structured format
//         return res.status(200).json({
//           success: true,
//           userIdPlaceholders: userIdPlaceholders,
//           medication: medicationResults || [],
//           adverseReaction: adverseResults || [],
//           labReport: labResults || [],
//           measurement: measurementResults || [],
//           compliance: complianceResults || [],
//           msg: "Data fetched successfully"
//         });

//       } catch (queryError) {
//         return res.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           error: queryError.message
//         });
//       }
//     });

//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message,
//     });
//   }
// };
const getSharedTabular = async (req, res) => {
  const { doctor_id, from_date, to_date } = req.query;

  try {
    if (!from_date) {
      return res.status(200).json({ status: false, msg: languageMessages.msg_empty_param, key: "from_date" });
    }
    if (!to_date) {
      return res.status(200).json({ status: false, msg: languageMessages.msg_empty_param, key: "to_date" });
    }
    if (!doctor_id) {
      return res.status(200).json({ status: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
    }

    const fetchUserId = "SELECT user_id FROM patient_master WHERE doctor_id = ? AND delete_flag = 0";

    connection.query(fetchUserId, [doctor_id], async (userError, userResult) => {
      if (userError) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, error: userError.message });
      }

      if (userResult.length <= 0) {
        return res.status(200).json({ success: false, msg: 'No patients found for this doctor' });
      }

      const userIds = userResult.map(data => data.user_id);
      const userIdPlaceholders = userIds.map(() => '?').join(',');

      try {
        const queryPromise = (sql, params) => {
          return new Promise((resolve, reject) => {
            connection.query(sql, params, (error, results) => {
              if (error) reject(error);
              else resolve(results);
            });
          });
        };

        // ---- NEW: figure out what each patient has actually shared with this doctor ----
        const TYPE_MEDICATION = '1';
        const TYPE_LAB_REPORT = '2';
        const TYPE_MEASUREMENT = '3';
        const TYPE_ADVERSE = '4';

        const fetchShareInfo = `
          SELECT user_id, information_type, createtime
          FROM report_share_master
          WHERE doctor_id = ?
            AND user_id IN (${userIdPlaceholders})
            AND share_type = 0
            AND delete_flag = 0
          ORDER BY createtime DESC
        `;
        const shareRows = await queryPromise(fetchShareInfo, [doctor_id, ...userIds]);

        // shareCutoff[user_id][typeCode] = latest createtime of a share entry containing that type
        const shareCutoff = {};
        shareRows.forEach(row => {
          if (!row.information_type) return;
          const uid = row.user_id;
          if (!shareCutoff[uid]) shareCutoff[uid] = {};
          row.information_type.split(',').map(t => t.trim()).forEach(t => {
            // rows are ordered DESC by createtime, so the first hit per type is the latest one
            if (!shareCutoff[uid][t]) shareCutoff[uid][t] = row.createtime;
          });
        });

        const allowedUserIds = (typeCode) => userIds.filter(uid => shareCutoff[uid] && shareCutoff[uid][typeCode]);

        const medicationUserIds = allowedUserIds(TYPE_MEDICATION);
        const adverseUserIds = allowedUserIds(TYPE_ADVERSE);
        const labReportUserIds = allowedUserIds(TYPE_LAB_REPORT);
        const measurementUserIds = allowedUserIds(TYPE_MEASUREMENT);
        const complianceUserIds = medicationUserIds; // compliance reads medication_master, same consent as medication

        const runIfAllowed = (allowedIds, sqlBuilder) => {
          if (allowedIds.length === 0) return Promise.resolve([]);
          const placeholders = allowedIds.map(() => '?').join(',');
          return queryPromise(sqlBuilder(placeholders), [...allowedIds, from_date, to_date]);
        };

        const filterByCutoff = (rows, typeCode) => {
          return rows.filter(row => {
            const cutoff = shareCutoff[row.user_id] && shareCutoff[row.user_id][typeCode];
            return cutoff && new Date(row.createtime) <= new Date(cutoff);
          });
        };
        // ---- END NEW ----

        const buildMedicationSql = (ph) => `SELECT 
  m.medication_id, m.user_id, m.medicine_id, m.dosage, m.type, 
  m.schedule, m.weekday, m.current_quantity, m.remainder_quantity, 
  m.pause_status, m.remaining_quantity, m.instruction, m.status, 
  m.updatetime, m.createtime, a.medicine_name, a.description, 
  um.name AS patient_name, um.dob,
  DATE_FORMAT(CONVERT_TZ(CONCAT('2024-01-01 ', tm.time), '+00:00', '+05:30'), '%h:%i %p') AS time
FROM medication_master m 
JOIN medicine_master a ON a.medicine_id = m.medicine_id 
JOIN time_slots_master tm ON tm.medication_id = m.medication_id AND tm.taken_status = 0 AND tm.delete_flag = 0
JOIN user_master um ON um.user_id = m.user_id 
WHERE m.user_id IN (${ph}) 
  AND m.delete_flag = 0 
  AND DATE(m.createtime) BETWEEN ? AND ?
ORDER BY m.medication_id DESC`;

        const buildAdverseSql = (ph) => `
  SELECT 
    a.adverse_reaction_id, a.user_id, m.medicine_name, a.dosage, 
    mm.category_name, s.symptom_name, a.medication_start_date, 
    a.reaction_date, a.createtime, 
    um.name AS patient_name 
  FROM adverse_reaction_master AS a 
  LEFT JOIN medicine_master as m ON m.medicine_id = a.medicine_id
  LEFT JOIN medicine_category_master as mm ON mm.medicine_category_id = a.medicine_category_id 
  LEFT JOIN symptoms_master as s ON s.symptom_id = a.symptom_id 
  LEFT JOIN user_master um ON um.user_id = a.user_id 
  WHERE a.user_id IN (${ph})
    AND a.delete_flag = 0
    AND (DATE(a.createtime) BETWEEN ? AND ? OR a.createtime IS NULL)`;

        const buildLabReportSql = (ph) => `
        SELECT 
          mrm.medical_report_id, mrm.file, mrm.createtime, mrm.user_id,
          rcm.category_name, um.name AS patient_name 
        FROM medical_report_master mrm 
        JOIN report_category rcm ON rcm.report_category_id = mrm.report_category_id 
        JOIN user_master um ON um.user_id = mrm.user_id 
        WHERE mrm.user_id IN (${ph})
          AND mrm.delete_flag = 0
          AND DATE(mrm.createtime) BETWEEN ? AND ?  
        ORDER BY mrm.createtime DESC`;

        const buildMeasurementSql = (ph) => `
        SELECT 
          mm.type, mm.user_id, mm.measurement_id, mm.systolic_bp, 
          mm.diastolic_bp, mm.pulse, mm.weight, mm.createtime, mm.symptom, mm.symptom_range,
          DATE_FORMAT(mm.createtime, '%Y-%m-%d') AS date,
          DATE_FORMAT(CONVERT_TZ(mm.createtime, '+00:00', '+05:30'), '%h:%i %p') AS time,
         mm.fasting_glucose, mm.temperature, mm.ppbgs, 
         um.name AS patient_name
        FROM measurement_master mm 
        JOIN user_master um ON mm.user_id = um.user_id
        WHERE mm.user_id IN (${ph})
          AND mm.delete_flag = 0
          AND DATE(mm.createtime) BETWEEN ? AND ?  
        ORDER BY mm.createtime DESC`;

        const buildComplianceSql = (ph) => `SELECT m.medication_id,m.user_id,m.medicine_id,m.dosage,m.type,m.schedule, m.schedule_date, m.pause_status, m.number_of_times, tm.taken_status, um.name, m.weekday,m.current_quantity, DATE_FORMAT(CONVERT_TZ(CONCAT('2024-01-01 ', tm.time), '+00:00', '+05:30'), '%h:%i %p') AS time,m.remainder_quantity,m.remaining_quantity,m.instruction,m.status,m.updatetime,a.medicine_name,a.description FROM medication_master m JOIN medicine_master a ON a.medicine_id = m.medicine_id JOIN user_master um ON um.user_id = m.user_id JOIN time_slots_master tm ON tm.medication_id = m.medication_id WHERE m.delete_flag = 0 AND m.user_id IN (${ph}) AND DATE(m.createtime) BETWEEN ? AND ? ORDER BY m.medication_id desc`;

        const [rawMedication, rawAdverse, rawLabReport, rawMeasurement, rawCompliance] = await Promise.all([
          runIfAllowed(medicationUserIds, buildMedicationSql),
          runIfAllowed(adverseUserIds, buildAdverseSql),
          runIfAllowed(labReportUserIds, buildLabReportSql),
          runIfAllowed(measurementUserIds, buildMeasurementSql),
          runIfAllowed(complianceUserIds, buildComplianceSql),
        ]);

        const medicationResults = filterByCutoff(rawMedication, TYPE_MEDICATION);
        const adverseResults = filterByCutoff(rawAdverse, TYPE_ADVERSE);
        const labResults = filterByCutoff(rawLabReport, TYPE_LAB_REPORT);
        const measurementResults = filterByCutoff(rawMeasurement, TYPE_MEASUREMENT);
        const complianceResults = filterByCutoff(rawCompliance, TYPE_MEDICATION);

        return res.status(200).json({
          success: true,
          userIdPlaceholders: userIdPlaceholders,
          medication: medicationResults || [],
          adverseReaction: adverseResults || [],
          labReport: labResults || [],
          measurement: measurementResults || [],
          compliance: complianceResults || [],
          msg: "Data fetched successfully"
        });

      } catch (queryError) {
        return res.status(200).json({ success: false, msg: languageMessages.internalServerError, error: queryError.message });
      }
    });

  } catch (error) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message });
  }
};


const deleteNote = async (req, res) => {

  const { note_id } = req.body;

  try {
    if (!note_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "note_id" });
    }

    const checkNote = await new Promise((resolve, reject) => {
      const check = "SELECT note_id FROM note_master WHERE note_id = ? AND delete_flag = 0";
      connection.query(check, [note_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (checkNote.length <= 0) {
      return res.status(200).json({ success: false, msg: languageMessages.msgDataNotFound, });
    }

    const deleteNoteQuery = await new Promise((resolve, reject) => {
      const deleteQuery = "UPDATE note_master SET delete_flag = 1, updatetime = now() WHERE note_id = ?";
      connection.query(deleteQuery, [note_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (deleteNoteQuery.affectedRows > 0) {
      return res.status(200).json({ success: true, msg: "Note deleted Successfully" });
    }


  } catch (err) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
  }
}

const updateNote = async (req, res) => {

  const { note_id, description } = req.body;

  try {
    if (!note_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "note_id" });
    }

    if (!description) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "description" });
    }

    const checkNote = await new Promise((resolve, reject) => {
      const check = "SELECT note_id FROM note_master WHERE note_id = ? AND delete_flag = 0";
      connection.query(check, [note_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (checkNote.length <= 0) {
      return res.status(200).json({ success: false, msg: languageMessages.msgDataNotFound, });
    }

    const updateNoteQuery = await new Promise((resolve, reject) => {
      const updateQuery = "UPDATE note_master SET description = ?, updatetime = UTC_TIMESTAMP() WHERE note_id = ?";
      connection.query(updateQuery, [description, note_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (updateNoteQuery.affectedRows > 0) {
      return res.status(200).json({ success: true, msg: "Note updated Successfully" });
    }
  } catch (err) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
  }
}

//delete image 
const deleteImage = async (req, res) => {
  const { doctor_id } = req.body;

  try {
    if (!doctor_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "doctor_id"
      });
    }

    // Check if the doctor exists and is not deleted
    const checkUser = await new Promise((resolve, reject) => {
      const query = "SELECT doctor_id FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
      connection.query(query, [doctor_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (checkUser.length === 0) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msgDataNotFound
      });
    }

    // Set image field to NULL
    const deleteImageQuery = await new Promise((resolve, reject) => {
      const query = "UPDATE doctor_master SET image = NULL WHERE doctor_id = ? AND delete_flag = 0";
      connection.query(query, [doctor_id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (deleteImageQuery.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        msg: "Image deleted successfully"
      });
    } else {
      return res.status(200).json({
        success: false,
        msg: "Image not found or already deleted"
      });
    }

  } catch (err) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: err.message
    });
  }
};



const deleteDoctorAccount = async (req, res) => {
  const{ doctor_id,delete_reason} = req.body;
  try {
    if (!doctor_id) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" })
    }
      if (!delete_reason) {
      return res.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "delete_reason" })
    }

    const checkUser = await new Promise((resolve, reject) => {
      const check = "SELECT doctor_id FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
      connection.query(check, [doctor_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (checkUser.length <= 0) {
      return res.status(200).json({ success: false, msg: languageMessages.msgDataNotFound })
    }

    const deletedoctotQuery = await new Promise((resolve, reject) => {
      const deleteQuery = "UPDATE doctor_master SET delete_flag = 1,delete_reason = ? WHERE doctor_id = ? AND delete_flag = 0";
      connection.query(deleteQuery, [delete_reason,doctor_id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })

    if (deletedoctotQuery.affectedRows > 0 ) {
      return res.status(200).json({ success: true, msg: "Account deleted successfully" })
    } else {
      return res.status(200).json({ success: false, msg: "Account Not Fount" })
    }

  } catch (err) {
    return res.status(200).json({ success: false, msg: languageMessages.internalServerError, err: err.message, });
  }
}

// get shared measurements
// const getPatientMeasurements = async (req, res) => {
//   try {
//     const { user_id, doctor_id } = req.query;

//     if (!user_id || !doctor_id) {
//       return res.status(200).json({
//         success: false,
//         msg: languageMessages.msg_empty_param
//       });
//     }

//     const shareSql = `
//       SELECT createtime
//       FROM report_share_master
//       WHERE user_id = ?
//         AND doctor_id = ?
//         AND share_type = 0
//         AND delete_flag = 0
//         AND FIND_IN_SET('3', information_type)
//       ORDER BY createtime DESC
//     `;

//     connection.query(shareSql, [user_id, doctor_id], (err, shares) => {
//       if (err || shares.length === 0) {
//         return res.status(200).json({
//           success: true,
//           msg: "Measurements not shared",
//           measurements: []
//         });
//       }

//       const result = [];
//       let completed = 0;

//       shares.forEach((share, index) => {
//         // const startTime = index === 0 ? '1970-01-01 00:00:00' : shares[index - 1].createtime;
//         // const endTime = share.createtime;
//         //  const startTime = share.createtime;
//         const startTime = '1970-01-01 00:00:00';
//           const endTime = index === 0
//             ? moment().format('YYYY-MM-DD HH:mm:ss') // latest time
//             : shares[index - 1].createtime;
//         const measurementSql = `
//           SELECT *
//           FROM measurement_master
//           WHERE user_id = ?
//             AND delete_flag = 0
//             AND createtime > ?
//             AND createtime <= ?
//           ORDER BY createtime DESC
//         `;

//         connection.query(
//           measurementSql,
//           [user_id, startTime, endTime],
//           (err2, rows) => {
//             completed++;

//             if (!err2 && rows.length > 0) {
//               rows.forEach(r => {
//                 const mTime = moment
//                   .utc(r.createtime)
//                   .tz("Europe/Paris");

//                 result.push({
//                     sr_no: result.length + 1,
//                   date: mTime.format("DD-MM-YYYY"),
//                   time: mTime.format("hh:mm A"),

//                   type: r.type,
//                   systolic_bp: r.systolic_bp,
//                   diastolic_bp: r.diastolic_bp,
//                   pulse: r.pulse,
//                   fasting_glucose: r.fasting_glucose,
//                   ppbgs: r.ppbgs,
//                   weight: r.weight,
//                   temperature: r.temperature,
//                   symptom: r.symptom,
//                   symptom_range: r.symptom_range
//                 });
//               });
//             }

//             if (completed === shares.length) {
//               return res.status(200).json({
//                 success: true,
//                 msg: languageMessages.msgDataFound,
//                 measurements: result
//               });
//             }
//           }
//         );
//       });
//     });

//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message
//     });
//   }
// };

// const getPatientMeasurements = async (req, res) => {
//   try {
//     const { user_id, doctor_id } = req.query;

//     if (!user_id || !doctor_id) {
//       return res.status(200).json({
//         success: false,
//         msg: languageMessages.msg_empty_param
//       });
//     }

//     const shareSql = `
//       SELECT createtime
//       FROM report_share_master
//       WHERE user_id = ?
//         AND doctor_id = ?
//         AND share_type = 0
//         AND delete_flag = 0
//         AND FIND_IN_SET('3', information_type)
//       ORDER BY createtime DESC
//     `;

//     connection.query(shareSql, [user_id, doctor_id], (err, shares) => {
//       if (err || shares.length === 0) {
//         return res.status(200).json({
//           success: true,
//           msg: "Measurements not shared",
//           measurements: []
//         });
//       }

//       const result = [];
//       let completed = 0;

//       shares.forEach((share, index) => {
//         const startTime = index === 0 ? '1970-01-01 00:00:00' : shares[index - 1].createtime;
//         const endTime = share.createtime;

//         const measurementSql = `
//           SELECT *
//           FROM measurement_master
//           WHERE user_id = ?
//             AND delete_flag = 0
//             AND createtime > ?
//             AND createtime <= ?
//           ORDER BY createtime DESC
//         `;

//         connection.query(
//           measurementSql,
//           [user_id, startTime, endTime],
//           (err2, rows) => {
//             completed++;

//             if (!err2 && rows.length > 0) {
//               rows.forEach(r => {
//                 const mTime = moment
//                   .utc(r.createtime)
//                   .tz("Europe/Paris");

//                 result.push({
//                     sr_no: result.length + 1,
//                   date: mTime.format("DD-MM-YYYY"),
//                   time: mTime.format("hh:mm A"),

//                   type: r.type,
//                   systolic_bp: r.systolic_bp,
//                   diastolic_bp: r.diastolic_bp,
//                   pulse: r.pulse,
//                   fasting_glucose: r.fasting_glucose,
//                   ppbgs: r.ppbgs,
//                   weight: r.weight,
//                   temperature: r.temperature,
//                   symptom: r.symptom,
//                   symptom_range: r.symptom_range
//                 });
//               });
//             }

//             if (completed === shares.length) {
//               return res.status(200).json({
//                 success: true,
//                 msg: languageMessages.msgDataFound,
//                 measurements: result
//               });
//             }
//           }
//         );
//       });
//     });

//   } catch (error) {
//     return res.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message
//     });
//   }
// };

const getPatientMeasurements = async (req, res) => {
  try {
    const { user_id, doctor_id } = req.query;

    if (!user_id || !doctor_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param
      });
    }

    const shareSql = `
      SELECT createtime
      FROM report_share_master
      WHERE user_id = ?
        AND doctor_id = ?
        AND share_type = 0
        AND delete_flag = 0
        AND FIND_IN_SET('3', information_type)
      ORDER BY createtime DESC
    `;

    connection.query(shareSql, [user_id, doctor_id], (err, shares) => {
      if (err || shares.length === 0) {
        return res.status(200).json({
          success: true,
          msg: "Measurements not shared",
          measurements: []
        });
      }

      const result = [];
      let completed = 0;

      shares.forEach((share, index) => {
        const startTime = index === 0 ? '1970-01-01 00:00:00' : shares[index - 1].createtime;
        const endTime = share.createtime;

        // const measurementSql = `
        //   SELECT *
        //   FROM measurement_master
        //   WHERE user_id = ?
        //     AND delete_flag = 0
        //     AND createtime > ?
        //     AND createtime <= ?
        //   ORDER BY createtime DESC
        // `;
        const measurementSql = `
          SELECT 
            m.*,
            s.symptom_name AS symptomname
          FROM measurement_master m
          LEFT JOIN symptoms_master s 
            ON m.symptom = s.symptom_id
          WHERE m.user_id = ?
            AND m.delete_flag = 0
            AND m.createtime > ?
            AND m.createtime <= ?
          ORDER BY m.createtime DESC
        `;

        connection.query(
          measurementSql,
          [user_id, startTime, endTime],
          (err2, rows) => {
            completed++;

            if (!err2 && rows.length > 0) {
              rows.forEach(r => {
                const mTime = moment
                  .utc(r.createtime)
                  .tz("Europe/Paris");

                result.push({
                    sr_no: result.length + 1,
                  date: mTime.format("DD-MM-YYYY"),
                  time: mTime.format("hh:mm A"),

                  type: r.type,
                  systolic_bp: r.systolic_bp,
                  diastolic_bp: r.diastolic_bp,
                  pulse: r.pulse,
                  fasting_glucose: r.fasting_glucose,
                  ppbgs: r.ppbgs,
                  weight: r.weight,
                  temperature: r.temperature,
                  symptom: r.symptom,
                  symptom_range: r.symptom_range,
                  symptomname: r.symptomname
                });
              });
            }

            if (completed === shares.length) {
              return res.status(200).json({
                success: true,
                msg: languageMessages.msgDataFound,
                measurements: result
              });
            }
          }
        );
      });
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message
    });
  }
};







// get shared medication list
const getPatientMedicationList = async (request, response) => {
  const { user_id, doctor_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "user_id",
    });
  }

  if (!doctor_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "doctor_id",
    });
  }

  try {
    //    Check if user exists
    const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ?";
    connection.query(patientSql, [user_id], (err, patient) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (patient.length <= 0) {
        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          patient: [],
        });
      }

      //    Check report sharing info
      const checkShare = `
        SELECT report_share_id, information_type, createtime 
        FROM report_share_master 
        WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
        ORDER BY createtime DESC
      `;
      connection.query(checkShare, [user_id, doctor_id], (err1, shareList) => {
        if (err1) {
          return response.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err1.message,
          });
        }

        if (shareList.length === 0) {
          return response.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            list: [],
          });
        }

        //    Find latest share entry that contains "1" (medications)
        const latestShare = shareList.find(r =>
          r.information_type.split(",").includes("1")
        );

        if (!latestShare) {
          return response.status(200).json({
            success: true,
            msg: "Medications not shared",
            list: [],
          });
        }

        const shareTime = latestShare.createtime;

        //    Medication query (respecting share createtime)
        const checksql = `
          SELECT 
              m.medication_id,
              m.user_id,
              m.medicine_id,
              m.dosage,
              m.type,
              m.schedule,
              m.schedule_date,
              m.pause_status,
              m.number_of_times,
              tm.taken_status,
              m.weekday,
              m.current_quantity,
            
              DATE_FORMAT(tm.time, '%h:%i %p') AS reminder_time,
            
              m.remainder_quantity,
              m.remaining_quantity,
              m.instruction,
              m.status,
              m.updatetime,
              a.added_by,
              a.medicine_name,
              a.description
            
            FROM medication_master m
            JOIN medicine_master a 
              ON a.medicine_id = m.medicine_id
            JOIN time_slots_master tm 
              ON tm.medication_id = m.medication_id
            
            WHERE m.user_id = ?
              AND m.delete_flag = 0
              AND tm.delete_flag = 0
              AND m.createtime <= ?
            
            ORDER BY m.medication_id DESC, tm.time DESC;

        `;

        connection.query(checksql, [user_id, shareTime], async (err2, check) => {
          if (err2) {
            return response.status(200).json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err2.message,
            });
          }

          if (check.length <= 0) {
            return response.status(200).json({
              success: true,
              msg: languageMessages.msgDataNotFound,
              list: [],
            });
          }
          
          //    Format medication list
          check.forEach((item, index) => {
              item.sr_no = index + 1;
              item.schedule = item.schedule == 0 ? "Daily" : item.schedule == 1 ? "Weekly" : "Monthly";
              item.taken_status = item.taken_status == 1; // true/false
              item.type = item.type == 1 ? "Pill" : item.type == 2 ? "Syrup" : "Injection";
              // const mTime = moment
              //     .utc(item.updatetime)
              //     .tz("Europe/Paris");
                
              //   item.updatetime = mTime.format("DD-MM-YYYY hh:mm A");

              item.schedule_date = item.schedule_date ? moment(item.schedule_date).format("DD-MM-YYYY") : "NA";
              item.added_by = item.added_by == 0 ? "Admin" : item.added_by == 1 ? "User" : "NA";
              item.reminder_time = item.reminder_time || "";

            });

          return response.status(200).json({
            success: true,
            msg: languageMessages.msgDataFound,
            list: check,
          });
        });
      });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: err.message,
    });
  }
};

 


// get patient report
const getPatientReport = async (request, response) => {
  const { user_id, doctor_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "user_id",
    });
  }

  try {
    // Check if user exists
    const patientSql =
      "SELECT user_id, email FROM user_master WHERE user_id = ? ";
    connection.query(patientSql, [user_id], (err, patient) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (patient.length <= 0) {
        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          patient: [],
        });
      }

      // First, check info-level sharing (share_type = 0)
      const checkShare = `
        SELECT report_share_id, information_type, createtime 
        FROM report_share_master 
        WHERE user_id = ? AND doctor_id =? AND share_type = 0 AND delete_flag = 0
        ORDER BY createtime DESC
      `;
      connection.query(checkShare, [user_id, doctor_id], (err1, shareList) => {
        if (err1) {
          return response.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err1.message,
          });
        }

        // Get latest lab-report share (information_type = 2)
        const latestShare = shareList.find((r) =>
          r.information_type.split(",").includes("2")
        );
        const shareTime = latestShare ? latestShare.createtime : null;

        // Build both queries
        const generalReportSql = `
          SELECT 
            m.medical_report_id,
            m.user_id,
            m.report_category_id,
            m.file,
            m.file_size,
            m.createtime,
            m.updatetime,
            a.category_name 
          FROM medical_report_master m 
          JOIN report_category a ON a.report_category_id = m.report_category_id 
          WHERE m.user_id = ? 
            AND m.delete_flag = 0
            ${shareTime ? "AND m.createtime <= ?" : ""}
        `;

        const specificReportSql = `
          SELECT 
            m.medical_report_id,
            m.user_id,
            m.report_category_id,
            m.file,
            m.file_size,
            m.createtime,
            m.updatetime,
            a.category_name
          FROM medical_report_master m
          JOIN report_category a ON a.report_category_id = m.report_category_id
          JOIN report_share_master r ON r.medical_report_id = m.medical_report_id
          WHERE r.user_id = ? AND r.doctor_id = ? AND r.share_type = 1 AND r.delete_flag = 0
        `;

        // Execute both queries in parallel
        const tasks = [];

        if (shareTime) {
          tasks.push(
            new Promise((resolve, reject) => {
              connection.query(generalReportSql, [user_id, shareTime], (err2, rows) => {
                if (err2) reject(err2);
                else resolve(rows);
              });
            })
          );
        }

        if (doctor_id) {
          tasks.push(
            new Promise((resolve, reject) => {
              connection.query(specificReportSql, [user_id, doctor_id], (err3, rows) => {
                if (err3) reject(err3);
                else resolve(rows);
              });
            })
          );
        }

        Promise.all(tasks)
          .then((results) => {
            // Merge results
            const merged = [].concat(...results);

           
          // Deduplicate by medical_report_id
const uniqueReports = Object.values(
  merged.reduce((acc, item) => {
    acc[item.medical_report_id] = item;
    return acc;
  }, {})
);

// Sort by createtime DESC (latest first)
uniqueReports.sort((a, b) => new Date(b.createtime) - new Date(a.createtime));

if (uniqueReports.length === 0) {
  return response.status(200).json({
    success: true,
    msg: languageMessages.msgDataNotFound,
    list: [],
  });
}

// Format dates AFTER sorting
uniqueReports.forEach((item) => {
  const updateTime = moment
    .utc(item.updatetime)
    .tz("Europe/Paris");

  const createTime = moment
    .utc(item.createtime)
    .tz("Europe/Paris");

  item.updatetime = updateTime.format("DD-MM-YYYY hh:mm A");
  item.createtime = createTime.format("DD-MM-YYYY hh:mm A");
});


return response.status(200).json({
  success: true,
  msg: languageMessages.msgDataFound,
  list: uniqueReports,
});

          })
          .catch((errX) => {
            return response.status(200).json({
              success: false,
              msg: languageMessages.internalServerError,
              error: errX.message,
            });
          });
      });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: err.message,
    });
  }
};


//  get adverse of patient 
// const getAdverseofPatient = async (request, response) => {
//   const { user_id, doctor_id } = request.query;

//   if (!user_id) {
//     return response.status(200).json({
//       success: false,
//       msg: languageMessages.msg_empty_param,
//       key: "user_id",
//     });
//   }


//   if (!doctor_id) {
//     return response.status(200).json({
//       success: false,
//       msg: languageMessages.msg_empty_param,
//       key: "doctor_id",
//     });
//   }


//   try {
//     //      Check if user exists
//     const patientSql =
//       "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
//     connection.query(patientSql, [user_id], (err, patient) => {
//       if (err) {
//         return response.status(200).json({
//           success: false,
//           msg: languageMessages.internalServerError,
//           err: err.message,
//         });
//       }

//       if (patient.length <= 0) {
//         return response.status(200).json({
//           success: true,
//           msg: languageMessages.msgDataNotFound,
//           patient: [],
//         });
//       }

//       //      Check report sharing info
//       const checkShare = `
//         SELECT report_share_id, information_type, createtime 
//         FROM report_share_master 
//         WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//         ORDER BY createtime DESC
//       `;
//       connection.query(checkShare, [user_id, doctor_id], (err1, shareList) => {
//         if (err1) {
//           return response.status(200).json({
//             success: false,
//             msg: languageMessages.internalServerError,
//             err: err1.message,
//           });
//         }

//         if (shareList.length === 0) {
//           return response.status(200).json({
//             success: true,
//             msg: languageMessages.msgDataNotFound,
//             adverse_arr: [],
//           });
//         }

//         //      Find latest share entry that contains "4" (adverse reactions)
//         const latestShare = shareList.find((r) =>
//           r.information_type.split(",").includes("4")
//         );

//         if (!latestShare) {
//           return response.status(200).json({
//             success: true,
//             msg: "Adverse reactions not shared",
//             adverse_arr: [],
//           });
//         }

//         const shareTime = latestShare.createtime;

//         //      Fetch adverse reactions up to share createtime
//         const getadverse = `
//           SELECT 
//             a.adverse_reaction_id,
//             a.type,
//             a.user_id,
//             m.medicine_name,
//             a.dosage,
//             mm.category_name,
//             a.details,
//             s.symptom_name,
//             a.medication_start_date,
//             a.reaction_date, 
//             a.createtime 
//           FROM adverse_reaction_master AS a 
//           LEFT JOIN medicine_master as m ON m.medicine_id=a.medicine_id 
//           LEFT JOIN medicine_category_master as mm ON mm.medicine_category_id=a.medicine_category_id 
//           LEFT JOIN symptoms_master as s ON s.symptom_id=a.symptom_id 
//           WHERE a.user_id=? AND a.delete_flag=0 AND a.createtime <= ?
//           ORDER BY a.adverse_reaction_id DESC
//         `;

//         connection.query(getadverse, [user_id, shareTime], async (err2, rows) => {
//           if (err2) {
//             return response.status(200).json({
//               success: false,
//               msg: languageMessages.internalServerError,
//               err: err2.message,
//             });
//           }

//           const adverse_arr = [];
//           if (rows.length <= 0) {
//             return response.status(200).json({
//               success: true,
//               msg: languageMessages.msgDataNotFound,
//               adverse_arr,
//             });
//           }

//           let s_no = 0;
//           rows.forEach((element) => {
//             s_no++;
            
//             const mTime = moment
//             .utc(element.createtime)
//             .tz("Europe/Paris");
            
//             adverse_arr.push({
//               sr_no: s_no,
//               adverse_reaction_id: element.adverse_reaction_id,
//               user_id: element.user_id,
//               medicine_name: element.medicine_name,
//               dosage: element.dosage,
//               category_name:
//                 element.type === 1
//                   ? "Pill"
//                   : element.type === 2
//                   ? "Syrup"
//                   : element.type === 3
//                   ? "Injection"
//                   : "Others",
//               symptom_name: element.symptom_name,
//               medication_start_date: moment(element.medication_start_date).format("DD-MM-YYYY"),
//               reaction_date: moment(element.reaction_date).format("DD-MM-YYYY"),
//               instruction: element.details,
//               createtime: mTime.format("DD-MM-YYYY hh:mm A"),
//             });
//           });

//           return response.status(200).json({
//             success: true,
//             msg: languageMessages.msgDataFound,
//             adverse_arr,
//           });
//         });
//       });
//     });
//   } catch (error) {
//     return response.status(200).json({
//       success: false,
//       msg: languageMessages.internalServerError,
//       err: error.message,
//     });
//   }
// };
const getAdverseofPatient = async (request, response) => {
  const { user_id, doctor_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "user_id",
    });
  }

  if (!doctor_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "doctor_id",
    });
  }

  try {
    // Check if user exists
    const patientSql = "SELECT user_id, email FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(patientSql, [user_id], (err, patient) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      if (patient.length <= 0) {
        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataNotFound,
          adverse_arr: [],
        });
      }

      // Check report sharing info
      const checkShare = `
        SELECT report_share_id, information_type, createtime 
        FROM report_share_master 
        WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
        ORDER BY createtime DESC
      `;
      connection.query(checkShare, [user_id, doctor_id], (err1, shareList) => {
        if (err1) {
          return response.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err1.message,
          });
        }

        if (shareList.length === 0) {
          return response.status(200).json({
            success: true,
            msg: languageMessages.msgDataNotFound,
            adverse_arr: [],
          });
        }

        // Find latest share entry containing "4" (adverse reactions)
        const latestShare = shareList.find(r =>
          r.information_type.split(",").includes("4")
        );

        if (!latestShare) {
          return response.status(200).json({
            success: true,
            msg: "Adverse reactions not shared",
            adverse_arr: [],
          });
        }

        const shareTime = latestShare.createtime;

        // 4Fetch adverse reactions up to share createtime
        const getAdverse = `
          SELECT 
            a.adverse_reaction_id,
            a.user_id,
            m.medicine_name,
            a.dosage,
            mm.category_name,
            a.details,
            s.symptom_name,
            a.medication_start_date,
            a.reaction_date,
            a.createtime
          FROM adverse_reaction_master AS a
          LEFT JOIN medicine_master AS m ON m.medicine_id = a.medicine_id
          LEFT JOIN medicine_category_master AS mm ON mm.medicine_category_id = a.medicine_category_id
          LEFT JOIN symptoms_master AS s ON s.symptom_id = a.symptom_id
          WHERE a.user_id = ? AND a.delete_flag = 0 AND a.createtime <= ?
          ORDER BY a.adverse_reaction_id DESC
        `;

        connection.query(getAdverse, [user_id, shareTime], (err2, rows) => {
          if (err2) {
            return response.status(200).json({
              success: false,
              msg: languageMessages.internalServerError,
              err: err2.message,
            });
          }

          if (rows.length <= 0) {
            return response.status(200).json({
              success: true,
              msg: languageMessages.msgDataNotFound,
              adverse_arr: [],
            });
          }

          //  Format adverse reactions like medication API
          const adverse_arr = rows.map((element, index) => {
            const mTime = moment.utc(element.createtime).tz("Europe/Paris");
            return {
              sr_no: index + 1,
              adverse_reaction_id: element.adverse_reaction_id,
              user_id: element.user_id,
              medicine_name: element.medicine_name,
              dosage: element.dosage,
              category_name: element.category_name || "Others",
              symptom_name: element.symptom_name,
              medication_start_date: moment(element.medication_start_date).format("DD-MM-YYYY"),
              reaction_date: moment(element.reaction_date).format("DD-MM-YYYY"),
              instruction: element.details,
              createtime: mTime.format("DD-MM-YYYY hh:mm A"),
            };
          });

          return response.status(200).json({
            success: true,
            msg: languageMessages.msgDataFound,
            adverse_arr,
          });
        });
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      err: error.message,
    });
  }
};

// API grpa
// const dashboardGraphs = async (req,res)=>{
//   // exports.dashboardGraphs = async (req, res) => {
//   try {

//     const monthlyQuery = `
//       SELECT 
//         DATE_FORMAT(createtime,'%b') as month,
//         COUNT(*) as total 
//       FROM patient_master
//       WHERE delete_flag = 0 AND doctor_id = ?
//       GROUP BY MONTH(createtime)
//       ORDER BY MONTH(createtime)
//     `;

//     const genderQuery = `
//      SELECT 
//         CASE
//           WHEN gender = 1 THEN 'Male'
//           WHEN gender = 2 THEN 'Female'
//           WHEN gender = 3 THEN 'Other'
//           ELSE 'Unknown'
//         END as gender,
//         COUNT(*) as total
//       FROM user_master
//       WHERE delete_flag = 0
//       AND doctor_id = ?
//       GROUP BY gender
//     `;

//     const ageQuery = `
//       SELECT 
//         CASE
//           WHEN age BETWEEN 0 AND 10 THEN '0-10'
//           WHEN age BETWEEN 11 AND 20 THEN '11-20'
//           WHEN age BETWEEN 21 AND 30 THEN '21-30'
//           WHEN age BETWEEN 31 AND 40 THEN '31-40'
//           WHEN age BETWEEN 31 AND 40 THEN '41-50'
//           ELSE '51+'
//         END as age_group,
//         COUNT(*) as total
//       FROM user_master
//       WHERE delete_flag = 0
//       AND doctor_id = ?
//       GROUP BY age_group
//     `;

//     connection.query(monthlyQuery, (err, monthly) => {

//       if (err) return res.json({ status:false, error: err });

//       connection.query(genderQuery, (err, gender) => {

//         if (err) return res.json({ status:false, error: err });

//         connection.query(ageQuery, (err, age) => {

//           if (err) return res.json({ status:false, error: err });

//           res.json({
//             status: true,
//             message: "Dashboard data fetched",
//             monthlyPatients: monthly,
//             genderPercentage: gender,
//             ageGroups: age
//           });

//         });

//       });

//     });

//   } catch (error) {
//     console.log(error);
//     res.json({
//       status:false,
//       message:"Server error"
//     });
//   }
// };

// const dashboardGraphs = async (req, res) => {
//   try {
//     const doctor_id = req.doctor_id;

//     if (!doctor_id) {
//       return res.status(200).json({
//         status: false,
//         msg: "doctor_id missing"
//       });
//     }

//     //  check doctor
//     const checksql = `
//       SELECT doctor_id FROM doctor_master 
//       WHERE doctor_id = ? AND delete_flag = 0
//     `;

//     connection.query(checksql, [doctor_id], (err, check) => {
//       if (err) {
//         return res.json({ status: false, error: err.message });
//       }

//       if (check.length === 0) {
//         return res.json({ status: true, msg: "No data found" });
//       }

//       //  Monthly Patients
//       const monthlyQuery = `
//         SELECT 
//           DATE_FORMAT(p.createtime,'%b') as month,
//           COUNT(*) as total
//         FROM patient_master p
//         WHERE p.delete_flag = 0 
//         AND p.doctor_id = ?
//         GROUP BY MONTH(p.createtime)
//         ORDER BY MONTH(p.createtime)
//       `;

//       //  Gender (JOIN)
//       const genderQuery = `
//         SELECT 
//           CASE
//             WHEN u.gender = 1 THEN 'Male'
//             WHEN u.gender = 2 THEN 'Female'
//             WHEN u.gender = 3 THEN 'Other'
//             ELSE 'Unknown'
//           END as gender,
//           COUNT(*) as total
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         WHERE p.delete_flag = 0
//         AND p.doctor_id = ?
//         GROUP BY gender
//       `;

//       //  Age Group (JOIN)
//      const ageQuery = `
//       SELECT 
//         CASE
//           WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 10 THEN '0-10'
//           WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 11 AND 20 THEN '11-20'
//           WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 21 AND 30 THEN '21-30'
//           WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 31 AND 40 THEN '31-40'
//           WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 41 AND 50 THEN '41-50'
//           ELSE '51+'
//         END as age_group,
//         COUNT(*) as total
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       WHERE p.delete_flag = 0
//       AND p.doctor_id = ?
//       AND u.dob IS NOT NULL
//       GROUP BY age_group
//       ORDER BY age_group
//     `;

//       //  execute queries
//       connection.query(monthlyQuery, [doctor_id], (err, monthly) => {
//         if (err) return res.json({ status: false, error: err.message });

//         connection.query(genderQuery, [doctor_id], (err, gender) => {
//           if (err) return res.json({ status: false, error: err.message });

//           connection.query(ageQuery, [doctor_id], (err, age) => {
//             if (err) return res.json({ status: false, error: err.message });

//             return res.json({
//               status: true,
//               message: "Doctor-wise graph data",
//               monthlyPatients: monthly,
//               genderPercentage: gender,
//               ageGroups: age
//             });
//           });
//         });
//       });

//     });

//   } catch (error) {
//     console.log(error);
//     return res.json({
//       status: false,
//       message: "Server error"
//     });
//   }
// };
  const dashboardGraphs = async (req, res) => {
  try {
    const doctor_id = req.doctor_id;
    const year = req.query.year;

    if (!doctor_id) {
      return res.status(200).json({
        status: false,
        msg: "doctor_id missing"
      });
    }

    const checksql = `
      SELECT doctor_id FROM doctor_master 
      WHERE doctor_id = ? AND delete_flag = 0
    `;

    connection.query(checksql, [doctor_id], (err, check) => {
      if (err) {
        return res.json({ status: false, error: err.message });
      }

      if (check.length === 0) {
        return res.json({ status: true, msg: "No data found" });
      }

      const monthlyQuery = `
        SELECT 
          DATE_FORMAT(p.createtime,'%b') as month,
          COUNT(*) as total
        FROM patient_master p
        WHERE p.delete_flag = 0 
        AND p.doctor_id = ?
        ${year ? "AND YEAR(p.createtime) = ?" : ""}
        GROUP BY MONTH(p.createtime)
        ORDER BY MONTH(p.createtime)
      `;

      const params = year ? [doctor_id, year] : [doctor_id];

      const yearQuery = `
        SELECT DISTINCT YEAR(createtime) as year
        FROM patient_master
        WHERE delete_flag = 0
        AND doctor_id = ?
        ORDER BY year DESC
      `;

      const genderQuery = `
        SELECT 
          CASE
            WHEN u.gender = 1 THEN 'Male'
            WHEN u.gender = 2 THEN 'Female'
            WHEN u.gender = 3 THEN 'Other'
            ELSE 'Unknown'
          END as gender,
          COUNT(*) as total
        FROM patient_master p
        JOIN user_master u ON u.user_id = p.user_id
        WHERE p.delete_flag = 0
        AND p.doctor_id = ?
        GROUP BY gender
      `;

      const ageQuery = `
        SELECT 
          CASE
            WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 10 THEN '0-10'
            WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 11 AND 20 THEN '11-20'
            WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 21 AND 30 THEN '21-30'
            WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 31 AND 40 THEN '31-40'
            WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 41 AND 50 THEN '41-50'
            ELSE '51+'
          END as age_group,
          COUNT(*) as total
        FROM patient_master p
        JOIN user_master u ON u.user_id = p.user_id
        WHERE p.delete_flag = 0
        AND p.doctor_id = ?
        AND u.dob IS NOT NULL
        GROUP BY age_group
        ORDER BY age_group
      `;

      connection.query(monthlyQuery, params, (err, monthly) => {
        if (err) return res.json({ status: false, error: err.message });

        connection.query(genderQuery, [doctor_id], (err, gender) => {
          if (err) return res.json({ status: false, error: err.message });

          connection.query(ageQuery, [doctor_id], (err, age) => {
            if (err) return res.json({ status: false, error: err.message });

            connection.query(yearQuery, [doctor_id], (err, years) => {
              if (err) return res.json({ status: false, error: err.message });

              return res.json({
                status: true,
                message: "Doctor-wise graph data",
                monthlyPatients: monthly,
                genderPercentage: gender,
                ageGroups: age,
                availableYears: years.map(y => y.year)
              });
            });

          });
        });
      });

    });

  } catch (error) {
    console.log(error);
    return res.json({
      status: false,
      message: "Server error"
    });
  }
};

// Send Notification patinet
//  COMMON FUNCTION (Push Notification)
const sendPush = async (playerIds, title, message) => {
  if (!playerIds.length) return;

  const payload = {
    notification: {
      title: title,
      body: message,
    },
    tokens: playerIds,
  };

  try {
    await admin.messaging().sendEachForMulticast(payload);
  } catch (err) {
    console.log("Push Error:", err);
  }
};


// const sendNotificationAll = (req, res) => {
    //   const { title, message } = req.body;
    //   const doctor_id = req.doctor_id;

    //   if (!title || !message) {
    //     return res.json({ success: false, msg: "title & message required" });
    //   }

    //   // const sql = `
    //   //   SELECT p.user_id, n.player_id
    //   //   FROM patient_master p
    //   //   LEFT JOIN user_notification n ON p.user_id = n.user_id
    //   //   WHERE p.doctor_id = ?
    //   //   AND p.delete_flag = 0
    //   // `;
    //   const sql = `
    //     SELECT p.user_id, MAX(n.player_id) as player_id
    //     FROM patient_master p
    //     LEFT JOIN user_notification n ON p.user_id = n.user_id
    //     WHERE p.doctor_id = ?
    //     AND p.delete_flag = 0
    //     GROUP BY p.user_id
    //   `;

    //   connection.query(sql, [doctor_id], async (err, result) => {
    //     if (err) return res.json({ success: false, msg: err });

    //     console.log("Patients found:", result.length);

    //     if (!result.length) {
    //       return res.json({ success: false, msg: "No patients found" });
    //     }

    //     const playerIds = result.map(r => r.player_id).filter(p => p);

    //     const values = result.map(r => [
    //       r.user_id,
    //       doctor_id,
    //       title,
    //       message,
    //       0,
    //       new Date()
    //     ]);

    //     connection.query(
    //       "INSERT INTO user_notification_message (user_id, other_user_id, title, message, read_status, createtime) VALUES ?",
    //       [values],
    //       (err) => {
    //         if (err) console.log("Insert Error:", err);
    //       }
    //     );

    //     await sendPush(playerIds, title, message);

    //     res.json({
    //       success: true,
    //       msg: `Notification sent to ${result.length} patients`
    //     });
    //   });
    // };

    // //  SPECIFIC USERS
// const sendNotificationUsers = (req, res) => {
//   const { title, message, user_ids } = req.body;
//   const doctor_id = req.doctor_id; //  

//   console.log("doctor_id:", doctor_id);
//   console.log("user_ids:", user_ids);

//   if (!title || !message || !user_ids?.length) {
//     return res.json({ success: false, msg: "missing params" });
//   }

//   const sql = `
//     SELECT p.user_id, n.player_id
//     FROM patient_master p
//     LEFT JOIN user_notification n ON p.user_id = n.user_id
//     WHERE p.doctor_id = ?
//     AND p.user_id IN (?)
//     AND p.delete_flag = 0
//   `;

//   connection.query(sql, [doctor_id, user_ids], async (err, result) => {
//     if (err) {
//       console.log("Fetch Error:", err);
//       return res.json({ success: false, msg: "DB Error" });
//     }

//     console.log("Matched Patients:", result.length);

//     if (!result.length) {
//       return res.json({ success: false, msg: "No valid patients found" });
//     }

//     const playerIds = result.map(r => r.player_id).filter(p => p);

//     const values = result.map(r => [
//       r.user_id,
//       doctor_id,
//       title,
//       message,
//       0,
//       new Date()
//     ]);

//     connection.query(
//       "INSERT INTO user_notification_message (user_id, other_user_id, title, message, read_status, createtime) VALUES ?",
//       [values],
//       (err) => {
//         if (err) console.log("Insert Error:", err);
//       }
//     );

//     await sendPush(playerIds, title, message);

//     return res.json({
//       success: true,
//       msg: `Notification sent to ${result.length} patients`
//     });
//   });
// };

const sendNotificationAll = (req, res) => {
  const { title, message } = req.body;
  const doctor_id = req.doctor_id;

  if (!title || !message) {
    return res.json({ success: false, msg: "title & message required" });
  }

  // const sql = `
  //   SELECT p.user_id, n.player_id
  //   FROM patient_master p
  //   LEFT JOIN user_notification n ON p.user_id = n.user_id
  //   WHERE p.doctor_id = ?
  //   AND p.delete_flag = 0
  // `;
  const sql = `
    SELECT p.user_id, MAX(n.player_id) as player_id
    FROM patient_master p
    LEFT JOIN user_notification n ON p.user_id = n.user_id
    WHERE p.doctor_id = ?
    AND p.delete_flag = 0
    GROUP BY p.user_id
  `;

  connection.query(sql, [doctor_id], async (err, result) => {
    if (err) return res.json({ success: false, msg: err });

    console.log("Patients found:", result.length);

    if (!result.length) {
      return res.json({ success: false, msg: "No patients found" });
    }

    // const playerIds = result.map(r => r.player_id).filter(p => p);

    // const values = result.map(r => [
    //   r.user_id,
    //   doctor_id,
    //   title,
    //   message,
    //   0,
    //   new Date()
    // ]);

    // connection.query(
    //   "INSERT INTO user_notification_message (user_id, other_user_id, title, message, read_status, createtime) VALUES ?",
    //   [values],
    //   (err) => {
    //     if (err) console.log("Insert Error:", err);
    //   }
    // );

    // await sendPush(playerIds, title, message);

    const doctorData = await new Promise((resolve, reject) => {
  connection.query(
    "SELECT doctor_name FROM doctor_master WHERE doctor_id = ?",
    [doctor_id],
    (err, rows) => {
      if (err) return reject(err);
      resolve(rows?.[0] || null);
    }
  );
});

const doctorName = doctorData?.doctor_name || "Doctor";

const finalTitle = `${doctorName}: ${title}`;
    for (const r of result) {
      await new Promise(resolve => {
            getNotificationArrSingle(
              doctor_id,
              r.user_id,
              "General",
              "0",
              finalTitle,
              finalTitle,
              finalTitle,
              finalTitle,
              finalTitle,
              message, message, message, message, message,
              {},
              {},
              {},
              {},
              resolve
            );
          });
        }

    res.json({
      success: true,
      msg: `Notification sent to ${result.length} patients`
    });
  });
};

const sendNotificationUsers = (req, res) => {
  const { title, message, user_ids } = req.body;
  const doctor_id = req.doctor_id; //  

  console.log("doctor_id:", doctor_id);
  console.log("user_ids:", user_ids);

  if (!title || !message || !user_ids?.length) {
    return res.json({ success: false, msg: "missing params" });
  }

  const sql = `
    SELECT p.user_id, n.player_id
    FROM patient_master p
    LEFT JOIN user_notification n ON p.user_id = n.user_id
    WHERE p.doctor_id = ?
    AND p.user_id IN (?)
    AND p.delete_flag = 0
  `;

  connection.query(sql, [doctor_id, user_ids], async (err, result) => {
    if (err) {
      console.log("Fetch Error:", err);
      return res.json({ success: false, msg: "DB Error" });
    }

    console.log("Matched Patients:", result.length);

    if (!result.length) {
      return res.json({ success: false, msg: "No valid patients found" });
    }

    const playerIds = result.map(r => r.player_id).filter(p => p);

    // const values = result.map(r => [
    //   r.user_id,
    //   doctor_id,
    //   title,
    //   message,
    //   0,
    //   new Date()
    // ]);
    const values = result.map(r => [
      doctor_id,     
      r.user_id,     
      title,
      message,
      0,
      new Date()
    ]);

    // connection.query(
    //   "INSERT INTO user_notification_message (user_id, other_user_id, title, message, read_status, createtime) VALUES ?",
    //   [values],
    //   (err) => {
    //     if (err) console.log("Insert Error:", err);
    //   }
    // );

    // await sendPush(playerIds, title, message);
        const doctorData = await new Promise((resolve, reject) => {
  connection.query(
    "SELECT doctor_name FROM doctor_master WHERE doctor_id = ?",
    [doctor_id],
    (err, rows) => {
      if (err) return reject(err);
      resolve(rows?.[0] || null);
    }
  );
});

const doctorName = doctorData?.doctor_name || "Doctor";

const finalTitle = `${doctorName}: ${title}`;

    for (const r of result) {
        await new Promise(resolve => {
          getNotificationArrSingle(
            doctor_id,         
            r.user_id,         
            "General",          
            "0",
            finalTitle, finalTitle, finalTitle, finalTitle, finalTitle,
            message, message, message, message, message,
            {},
            {},
            {},
            {},
            resolve
          );
        });
      }

    return res.json({
      success: true,
      msg: `Notification sent to ${result.length} patients`
    });
  });
};

const getNotificationHistory = (req, res) => {
  const doctor_id = req.doctor_id;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id missing" });
  }

  // const sql = `
  //   SELECT 
  //     u.user_id,
  //     u.name,
  //     u.email,
  //     n.title,
  //     n.message,
  //     n.createtime
  //   FROM user_notification_message n
  //   JOIN user_master u ON n.user_id = u.user_id
  //   WHERE n.other_user_id = ?
  //   ORDER BY n.createtime DESC
  // `;

   const sql = `
     SELECT 
        u.user_id,
        u.name,
        u.email,
        n.title,
        n.message,
        n.createtime
      FROM user_notification_message n
      JOIN user_master u ON n.user_id = u.user_id
      WHERE n.other_user_id = ?
      ORDER BY n.createtime DESC
    `;

  
  
  

  connection.query(sql, [doctor_id], (err, result) => {
    if (err) {
      console.log("Fetch Error:", err);
      return res.json({ success: false, msg: "DB Error" });
    }

    if (!result.length) {
      return res.json({ success: false, msg: "No notifications found" });
    }

    return res.json({
      success: true,
      total: result.length,
      data: result
    });
  });
};
// analytics api

const getAllDiseases = (req, res) => {

  const sql = `
    SELECT 
      dm.disease_id,
      dt.disease_name
    FROM disease_master dm
    LEFT JOIN disease_translation dt
      ON dm.disease_id = dt.disease_id
      AND dt.language_code = 'en'
    WHERE dm.delete_flag = 0
      AND dt.disease_name IS NOT NULL
      AND TRIM(dt.disease_name) != ''
    ORDER BY dt.disease_name ASC
  `;

  connection.query(sql, (err, result) => {

    if (err) {
      return res.json({
        success: false,
        error: err.message
      });
    }

    return res.json({
      success: true,
      total: result.length,
      diseases: result
    });

  });

};
const getDocterAllDiseases = (req, res) => {
  const { doctor_id } = req.query;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  const sql = `
    SELECT
  COALESCE(
    MAX(CASE WHEN dm.delete_flag = 0 THEN dm.disease_id END),
    MIN(dm.disease_id)
  ) AS disease_id,
  dt.disease_name
    FROM patient_master pm

    JOIN user_master um 
      ON um.user_id = pm.user_id
      AND um.delete_flag = 0

    JOIN disease_master dm
      ON um.diseases LIKE CONCAT('%disease_id: ', dm.disease_id, '%')

    JOIN disease_translation dt
      ON dt.disease_id = dm.disease_id
      AND dt.language_code = 'en'

    WHERE pm.doctor_id = ?
      AND pm.delete_flag = 0

    GROUP BY dt.disease_name
ORDER BY dt.disease_name ASC
  `;

  connection.query(sql, [doctor_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({
        success: false,
        error: err.message
      });
    }

    return res.json({
      success: true,
      total: result.length,
      diseases: result
    });
  });
};

const getAllMedicines = (req, res) => {
  const sql = `
    SELECT 
      medicine_id,
      medicine_name,
      description,
      added_by
    FROM medicine_master
    WHERE delete_flag = 0
    ORDER BY medicine_name ASC
  `;

  connection.query(sql, (err, result) => {
    if (err) {
      return res.json({
        success: false,
        error: err.message
      });
    }

    return res.json({
      success: true,
      total: result.length,
      medicines: result
    });
  });
};
// const getDocterAllMedicines = async (req, res) => {
//   const doctor_id = req.query.doctor_id;

//   try {
//     if (!doctor_id) {
//       return res.status(200).json({
//         success: false,
//         msg: "doctor_id required"
//       });
//     }

    
//     const checksql = `
//       SELECT doctor_id 
//       FROM doctor_master 
//       WHERE doctor_id = ? AND delete_flag = 0
//     `;

//     connection.query(checksql, [doctor_id], (err, check) => {
//       if (err) {
//         return res.json({ success: false, msg: "Server error", err: err.message });
//       }

//       if (check.length === 0) {
//         return res.json({ success: false, msg: "Doctor not found" });
//       }

      
//       const totalSql = `
//         SELECT COUNT(mm.medication_id) AS totalMedication
//         FROM patient_master pm
//         LEFT JOIN medication_master mm 
//           ON pm.user_id = mm.user_id 
//           AND mm.delete_flag = 0
//         WHERE pm.doctor_id = ? 
//         AND pm.delete_flag = 0
//       `;

//       connection.query(totalSql, [doctor_id], (err, totalRes) => {
//         if (err) {
//           return res.json({ success: false, msg: "Error in count", err: err.message });
//         }

//         const totalMedication = totalRes[0].totalMedication;

       
//         const medicineListSql = `
//           SELECT DISTINCT mm2.medicine_name
//           FROM patient_master pm

//           JOIN medication_master md 
//             ON md.user_id = pm.user_id
//             AND md.delete_flag = 0

//           JOIN medicine_master mm2 
//             ON mm2.medicine_id = md.medicine_id
//             AND mm2.delete_flag = 0

//           WHERE pm.doctor_id = ?
//             AND pm.delete_flag = 0

//           ORDER BY mm2.medicine_name ASC
//         `;

//         connection.query(medicineListSql, [doctor_id], (err2, medList) => {
//           if (err2) {
//             return res.json({ success: false, msg: "Error in list", err: err2.message });
//           }

        
//           return res.json({
//             success: true,
//             totalMedication: totalMedication,
//             medicines: medList
//           });
//         });
//       });
//     });

//   } catch (error) {
//     return res.json({
//       success: false,
//       msg: "Server error",
//       err: error.message
//     });
//   }
// };

const getDocterAllMedicines = async (req, res) => {
  const doctor_id = req.query.doctor_id;

  try {
    if (!doctor_id) {
      return res.status(200).json({
        success: false,
        msg: "doctor_id required"
      });
    }

    const checksql = `
      SELECT doctor_id 
      FROM doctor_master 
      WHERE doctor_id = ? AND delete_flag = 0
    `;

    connection.query(checksql, [doctor_id], (err, check) => {
      if (err) {
        return res.json({ success: false, msg: "Server error", err: err.message });
      }

      if (check.length === 0) {
        return res.json({ success: false, msg: "Doctor not found" });
      }

      const totalSql = `
        SELECT COUNT(DISTINCT a.medicine_id) AS totalMedication
        FROM report_share_master r
        JOIN medication_master m 
          ON m.user_id = r.user_id 
          AND m.delete_flag = 0 
          AND m.createtime <= r.createtime
        JOIN medicine_master a 
          ON a.medicine_id = m.medicine_id
          AND a.delete_flag = 0
        WHERE r.doctor_id = ?
          AND r.share_type = 0
          AND r.delete_flag = 0
          AND FIND_IN_SET('1', r.information_type)
      `;

      connection.query(totalSql, [doctor_id], (err, totalRes) => {
        if (err) {
          return res.json({ success: false, msg: "Error in count", err: err.message });
        }

        const totalMedication = totalRes[0].totalMedication;

        const medicineListSql = `
          SELECT DISTINCT a.medicine_name
          FROM report_share_master r
          JOIN medication_master m 
            ON m.user_id = r.user_id 
            AND m.delete_flag = 0 
            AND m.createtime <= r.createtime
          JOIN medicine_master a 
            ON a.medicine_id = m.medicine_id
            AND a.delete_flag = 0
          WHERE r.doctor_id = ?
            AND r.share_type = 0
            AND r.delete_flag = 0
            AND FIND_IN_SET('1', r.information_type)
          ORDER BY a.medicine_name ASC
        `;

        connection.query(medicineListSql, [doctor_id], (err2, medList) => {
          if (err2) {
            return res.json({ success: false, msg: "Error in list", err: err2.message });
          }

          return res.json({
            success: true,
            totalMedication: totalMedication,
            medicines: medList
          });
        });
      });
    });

  } catch (error) {
    return res.json({
      success: false,
      msg: "Server error",
      err: error.message
    });
  }
};

// const getPatientAnalytics = (req, res) => {
//   const { doctor_id, gender, age_group, columns = [] } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [doctor_id];

//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(Number(gender));
//   }

//   // if (age_group && age_group !== "") {
//   //   if (age_group === "0-18")
//   //     where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 18";
//   //   else if (age_group === "19-25")
//   //     where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 25";
//   //   else if (age_group === "26-40")
//   //     where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 26 AND 40";
//   //   else if (age_group === "41-60")
//   //     where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 41 AND 60";
//   //   else if (age_group === "60+")
//   //     where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 60";
//   // }
//   if (age_group && age_group !== "") {
//       if (age_group.includes("-")) {
//         const [min, max] = age_group.split("-").map(Number);
//         where += ` AND u.dob IS NOT NULL 
//           AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ${min} AND ${max}`;
//       } else if (age_group === "60+") {
//         where += ` AND u.dob IS NOT NULL 
//           AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 60`;
//       }
//     }

//   const sql = `
//     SELECT 
//       u.user_id,
//       u.name,
//       IFNULL(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), 0) AS age,
//       u.gender,
//       u.diseases,
//       GROUP_CONCAT(m.medicine_name) AS medicines
//     FROM patient_master p
//     LEFT JOIN user_master u ON u.user_id = p.user_id
//     LEFT JOIN medicine_master m 
//       ON m.user_id = u.user_id AND m.delete_flag = 0
//     ${where}
//     GROUP BY u.user_id
//   `;

//   connection.query(sql, params, (err, users) => {
//     if (err) {
//       return res.json({ success: false, error: err.message });
//     }

//     let patientList = [];

//     users.forEach(user => {
//       let row = {};

//       if (columns.includes("name")) row.patient_name = user.name;
//       if (columns.includes("age")) row.age = user.age;

//       if (columns.includes("gender")) {
//         row.gender =
//           user.gender == 1
//             ? "Male"
//             : user.gender == 2
//             ? "Female"
//             : "Other";
//       }

//       if (columns.includes("diseases")) {
//         let cleanDiseases = [];

//         if (user.diseases) {
//           let matches = user.diseases.match(/name:\s*([^,}]+)/g);

//           if (matches) {
//             matches.forEach(m => {
//               let name = m.split(":")[1].trim();
//               cleanDiseases.push(name);
//             });
//           }
//         }

//         row.diseases = cleanDiseases.join(", ");
//       }

//       if (columns.includes("medications")) {
//         row.medications = user.medicines || "";
//       }

//       patientList.push(row);
//     });

//     return res.json({
//       success: true,
//       total_patients: users.length,
//       patients: patientList
//     });
//   });
// };




// const getPatientAnalyticsCustomTable = (req, res) => {
//   const {
//     doctor_id,
//     gender,
//     age_group,
//     disease = [],
//     medication = [],
//     symptoms = [],
//     page = 1,
//     limit = 10,
//     singleOnly = false,
//     combinedOnly = false
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let baseWhere = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let baseParams = [doctor_id];

//   let where = baseWhere;
//   let params = [...baseParams];

//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(Number(gender));
//   }

//   if (age_group) {
//     if (age_group.includes("-")) {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     } else if (age_group === "60+") {
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 60`;
//     }
//   }

//   // if (disease.length > 0) {
//   //   const cond = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
//   //   where += ` AND (${cond})`;
//   //   disease.forEach(d => params.push(`%${d}%`));
//   // }

//   if (symptoms.length > 0) {
//     where += ` AND EXISTS (
//       SELECT 1 FROM adverse_reaction_master arm2
//       JOIN symptoms_master sm2 ON sm2.symptom_id = arm2.symptom_id
//       WHERE arm2.user_id = u.user_id
//       AND sm2.symptom_name IN (${symptoms.map(() => "?").join(",")})
//     )`;
//     params.push(...symptoms);
//   }

//   const totalSql = `
//     SELECT COUNT(DISTINCT u.user_id) as total
//     FROM patient_master p
//     LEFT JOIN user_master u ON u.user_id = p.user_id
//     ${baseWhere}
//   `;

//   connection.query(totalSql, baseParams, (err, totalRes) => {
//     if (err) return res.json({ success: false, error: err.message });

//     const total = totalRes[0]?.total || 0;

//     const dataSql = `
//       SELECT 
//         u.user_id,
//         u.name,
//         IFNULL(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), 0) AS age,
//         u.gender,
//         u.diseases,

//         (
//           SELECT GROUP_CONCAT(DISTINCT sm2.symptom_name)
//           FROM adverse_reaction_master arm2
//           JOIN symptoms_master sm2 
//             ON sm2.symptom_id = arm2.symptom_id
//           WHERE arm2.user_id = u.user_id
//         ) AS reported_symptoms,

//         (
//         SELECT JSON_ARRAYAGG(
//         DISTINCT JSON_OBJECT(
//           'id', a.medicine_id,
//           'name', a.medicine_name
//         )
//       )
//   FROM report_share_master r
//   JOIN medication_master m 
//     ON m.user_id = r.user_id 
//     AND m.delete_flag = 0
//     AND m.createtime <= r.createtime
//   JOIN medicine_master a 
//     ON a.medicine_id = m.medicine_id
//   JOIN time_slots_master tm 
//     ON tm.medication_id = m.medication_id
//     AND tm.delete_flag = 0
//   WHERE r.user_id = u.user_id
//     AND r.doctor_id = ?
//     AND r.share_type = 0
//     AND r.delete_flag = 0
//     AND FIND_IN_SET('1', r.information_type)
// ) AS medications

//       FROM patient_master p
//       LEFT JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//       GROUP BY u.user_id
//       ORDER BY u.name ASC
//     `;

//     connection.query(dataSql, [...params, doctor_id], (err2, users) => {
//       if (err2) {
//         return res.json({ success: false, error: err2.message });
//       }

//       const finalPatients = users.map(user => {
//         const diseaseMatches = user.diseases?.match(/name:\s*([^,}]+)/g) || [];
//         const diseases = diseaseMatches.map(m => m.split(":")[1].trim());

//         return {
//           user_id: user.user_id,
//           name: user.name,
//           age: user.age,
//           gender:
//             user.gender == 1 ? "Male" :
//             user.gender == 2 ? "Female" :
//             user.gender == 3 ? "Other" :
//             "Not Specified",

//           diseases,

//           reported_symptoms: user.reported_symptoms
//             ? user.reported_symptoms.split(",")
//             : [],

//           medications: user.medications
//             ? JSON.parse(user.medications)
//             : []
//         };
//       });

//       let matchedPatients = finalPatients;
//       // ✅ DISEASE FILTER
//       if (Array.isArray(disease) && disease.length > 0) {
//         const selectedDiseases = disease.map(d => d.toLowerCase().trim());

//         matchedPatients = matchedPatients.filter(p =>
//           (p.diseases || []).some(d =>
//             selectedDiseases.includes(d.toLowerCase().trim())
//           )
//         );
//       }
//       if (Array.isArray(medication) && medication.length > 0) {
//         const selectedMeds = medication.map(m => m.toLowerCase().trim());

//         // ✅ SAME SINGLE ONLY LOGIC
//         if (singleOnly && medication.length === 1) {
//           matchedPatients = matchedPatients.filter(p => {
//             const meds = (p.medications || []).map(m => m.name.toLowerCase().trim());
//             return meds.length === 1 && selectedMeds.includes(meds[0]);
//           });
//         }

//         // ✅ SAME COMBINED ONLY LOGIC
//         else if (combinedOnly && medication.length >= 2) {
//           matchedPatients = matchedPatients.filter(p => {
//             const meds = (p.medications || [])
//               .map(m => m.name.toLowerCase().trim())
//               .sort();

//             return (
//               meds.length === selectedMeds.length &&
//               selectedMeds.every(m => meds.includes(m))
//             );
//           });
//         }

//         // ✅ DEFAULT
//         else {
//           matchedPatients = matchedPatients.filter(p =>
//             (p.medications || []).some(m =>
//               selectedMeds.includes(m.name.toLowerCase().trim())
//             )
//           );
//         }
//       }

//       const matched = matchedPatients.length;

//       const offset = (page - 1) * limit;

//       return res.json({
//         success: true,
//         total,
//         matched_patients: matched,
//         page: Number(page),
//         limit: Number(limit),
//         patients: matchedPatients.slice(offset, offset + Number(limit))
//       });
//     });
//   });
// };
// ✅ FIXED: getPatientAnalyticsCustomTable
// const getPatientAnalyticsCustomTable = (req, res) => {
//   const {
//     doctor_id,
//     gender,
//     age_group,
//     disease = [],
//     medication = [],
//     symptoms = [],
//     page = 1,
//     limit = 10,
//     singleOnly = false,
//     combinedOnly = false
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let baseWhere = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let baseParams = [doctor_id];

//   let where = baseWhere;
//   let params = [...baseParams];

//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(Number(gender));
//   }

//   if (age_group) {
//     if (age_group.includes("-")) {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     } else if (age_group === "60+") {
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 60`;
//     }
//   }

//   // ✅ FIXED: symptom filter now checks report_share_master for information_type=4
//   // and also checks delete_flag on symptoms_master
//   if (symptoms.length > 0) {
//     where += ` AND EXISTS (
//       SELECT 1
//       FROM report_share_master r2
//       JOIN adverse_reaction_master arm2
//         ON arm2.user_id = r2.user_id
//         AND arm2.delete_flag = 0
//       JOIN symptoms_master sm2
//         ON sm2.symptom_id = arm2.symptom_id
//         AND sm2.delete_flag = 0
//       WHERE r2.user_id = u.user_id
//         AND r2.doctor_id = ?
//         AND r2.share_type = 0
//         AND r2.delete_flag = 0
//         AND FIND_IN_SET('4', r2.information_type)
//         AND sm2.symptom_name IN (${symptoms.map(() => "?").join(",")})
//     )`;
//     params.push(doctor_id, ...symptoms); // ✅ doctor_id added for r2.doctor_id = ?
//   }

//   const totalSql = `
//     SELECT COUNT(DISTINCT u.user_id) as total
//     FROM patient_master p
//     LEFT JOIN user_master u ON u.user_id = p.user_id
//     ${baseWhere}
//   `;

//   connection.query(totalSql, baseParams, (err, totalRes) => {
//     if (err) return res.json({ success: false, error: err.message });

//     const total = totalRes[0]?.total || 0;

//     const dataSql = `
//       SELECT 
//         u.user_id,
//         u.name,
//         IFNULL(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), 0) AS age,
//         u.gender,
//         u.diseases,

//         -- ✅ FIXED: reported_symptoms now respects sharing permissions (information_type=4)
//         (
//           SELECT GROUP_CONCAT(DISTINCT sm2.symptom_name)
//           FROM report_share_master r2
//           JOIN adverse_reaction_master arm2
//             ON arm2.user_id = r2.user_id
//             AND arm2.delete_flag = 0
//           JOIN symptoms_master sm2
//             ON sm2.symptom_id = arm2.symptom_id
//             AND sm2.delete_flag = 0
//           WHERE r2.user_id = u.user_id
//             AND r2.doctor_id = ?
//             AND r2.share_type = 0
//             AND r2.delete_flag = 0
//             AND FIND_IN_SET('4', r2.information_type)
//         ) AS reported_symptoms,

//         (
//           SELECT JSON_ARRAYAGG(
//             DISTINCT JSON_OBJECT(
//               'id', a.medicine_id,
//               'name', a.medicine_name
//             )
//           )
//           FROM report_share_master r
//           JOIN medication_master m 
//             ON m.user_id = r.user_id 
//             AND m.delete_flag = 0
//             AND m.createtime <= r.createtime
//           JOIN medicine_master a 
//             ON a.medicine_id = m.medicine_id
//           JOIN time_slots_master tm 
//             ON tm.medication_id = m.medication_id
//             AND tm.delete_flag = 0
//           WHERE r.user_id = u.user_id
//             AND r.doctor_id = ?
//             AND r.share_type = 0
//             AND r.delete_flag = 0
//             AND FIND_IN_SET('1', r.information_type)
//         ) AS medications

//       FROM patient_master p
//       LEFT JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//       GROUP BY u.user_id
//       ORDER BY u.name ASC
//     `;

//     // ✅ params order: reported_symptoms doctor_id, medications doctor_id, then where params
//     connection.query(dataSql, [doctor_id, doctor_id, ...params], (err2, users) => {
//       if (err2) {
//         return res.json({ success: false, error: err2.message });
//       }

//       const finalPatients = users.map(user => {
//         let diseases = [];
//         try {
//           const parsed = JSON.parse(user.diseases);
//           diseases = parsed.map(d => d.name);
//         } catch {
//           const matches = user.diseases?.match(/name:\s*([^,}]+)/g) || [];
//           diseases = matches.map(m => m.split(":")[1].trim());
//         }

//         return {
//           user_id: user.user_id,
//           name: user.name,
//           age: user.age,
//           gender:
//             user.gender == 1 ? "Male" :
//             user.gender == 2 ? "Female" :
//             user.gender == 3 ? "Other" :
//             "Not Specified",
//           diseases,
//           reported_symptoms: user.reported_symptoms
//             ? user.reported_symptoms.split(",")
//             : [],
//           medications: user.medications
//             ? JSON.parse(user.medications)
//             : []
//         };
//       });

//       let matchedPatients = finalPatients;

//       // ✅ SYMPTOM FILTER — post-process filter (mirrors disease/medication pattern)
//       if (Array.isArray(symptoms) && symptoms.length > 0) {
//         const selectedSymptoms = symptoms.map(s => s.toLowerCase().trim());

//         if (singleOnly && symptoms.length === 1) {
//           matchedPatients = matchedPatients.filter(p => {
//             const syms = (p.reported_symptoms || []).map(s => s.toLowerCase().trim());
//             return syms.length === 1 && selectedSymptoms.includes(syms[0]);
//           });
//         } else if (combinedOnly && symptoms.length >= 2) {
//           matchedPatients = matchedPatients.filter(p => {
//             const syms = (p.reported_symptoms || []).map(s => s.toLowerCase().trim());
//             return (
//               syms.length === selectedSymptoms.length &&
//               selectedSymptoms.every(s => syms.includes(s))
//             );
//           });
//         } else {
//           matchedPatients = matchedPatients.filter(p =>
//             (p.reported_symptoms || []).some(s =>
//               selectedSymptoms.includes(s.toLowerCase().trim())
//             )
//           );
//         }
//       }

//       // Disease filter (unchanged)
//       if (Array.isArray(disease) && disease.length > 0) {
//         const selectedDiseases = disease.map(d => d.toLowerCase().trim());
//         if (singleOnly && disease.length === 1) {
//           matchedPatients = matchedPatients.filter(p => {
//             const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
//             return dis.length === 1 && selectedDiseases.includes(dis[0]);
//           });
//         } else if (combinedOnly && disease.length >= 2) {
//           matchedPatients = matchedPatients.filter(p => {
//             const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
//             return (
//               dis.length === selectedDiseases.length &&
//               selectedDiseases.every(d => dis.includes(d))
//             );
//           });
//         } else {
//           matchedPatients = matchedPatients.filter(p =>
//             (p.diseases || []).some(d =>
//               selectedDiseases.includes(d.toLowerCase().trim())
//             )
//           );
//         }
//       }

//       // Medication filter (unchanged)
//       if (Array.isArray(medication) && medication.length > 0) {
//         const selectedMeds = medication.map(m => m.toLowerCase().trim());
//         if (singleOnly && medication.length === 1) {
//           matchedPatients = matchedPatients.filter(p => {
//             const meds = (p.medications || []).map(m => m?.name?.toLowerCase().trim()).filter(Boolean);
//             return meds.length === 1 && selectedMeds.includes(meds[0]);
//           });
//         } else if (combinedOnly && medication.length >= 2) {
//           matchedPatients = matchedPatients.filter(p => {
//             const meds = (p.medications || []).map(m => m?.name?.toLowerCase().trim()).filter(Boolean);
//             return (
//               meds.length === selectedMeds.length &&
//               selectedMeds.every(m => meds.includes(m))
//             );
//           });
//         } else {
//           matchedPatients = matchedPatients.filter(p =>
//             (p.medications || []).some(m =>
//               selectedMeds.includes(m?.name?.toLowerCase().trim())
//             )
//           );
//         }
//       }

//       const matched = matchedPatients.length;
//       const offset = (page - 1) * limit;

//       return res.json({
//         success: true,
//         total,
//         matched_patients: matched,
//         page: Number(page),
//         limit: Number(limit),
//         patients: matchedPatients.slice(offset, offset + Number(limit))
//       });
//     });
//   });
// };
const getPatientAnalyticsCustomTable = (req, res) => {
  const {
    doctor_id,
    gender,
    age_group,
    disease = [],
    medication = [],
    symptoms = [],
    page = 1,
    limit = 10,
    singleOnly = false,
    combinedOnly = false,
    includeExtra = false
  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let baseWhere = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
  let baseParams = [doctor_id];

  let where = baseWhere;
  let params = [...baseParams];

  if (gender !== undefined && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(Number(gender));
  }

  if (age_group) {
    if (age_group.includes("-")) {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    } else if (age_group === "85+") {
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 85`;
    } else if (age_group === "60+") {
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= 60`;
    }
  }

  // Symptom SQL pre-filter — always ANY match at DB level
  if (symptoms.length > 0) {
    where += ` AND EXISTS (
      SELECT 1
      FROM report_share_master r2
      JOIN adverse_reaction_master arm2
        ON arm2.user_id = r2.user_id
        AND arm2.delete_flag = 0
      JOIN symptoms_master sm2
        ON sm2.symptom_id = arm2.symptom_id
        AND sm2.delete_flag = 0
      WHERE r2.user_id = u.user_id
        AND r2.doctor_id = ?
        AND r2.share_type = 0
        AND r2.delete_flag = 0
        AND FIND_IN_SET('4', r2.information_type)
        AND sm2.symptom_name IN (${symptoms.map(() => "?").join(",")})
    )`;
    params.push(doctor_id, ...symptoms);
  }

  const totalSql = `
    SELECT COUNT(DISTINCT u.user_id) as total
    FROM patient_master p
    LEFT JOIN user_master u ON u.user_id = p.user_id
    ${baseWhere}
  `;

  connection.query(totalSql, baseParams, (err, totalRes) => {
    if (err) return res.json({ success: false, error: err.message });

    const total = totalRes[0]?.total || 0;

    const dataSql = `
      SELECT 
        u.user_id,
        u.name,
        IFNULL(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), 0) AS age,
        u.gender,
        u.diseases,

        (
          SELECT GROUP_CONCAT(DISTINCT sm2.symptom_name)
          FROM report_share_master r2
          JOIN adverse_reaction_master arm2
            ON arm2.user_id = r2.user_id
            AND arm2.delete_flag = 0
          JOIN symptoms_master sm2
            ON sm2.symptom_id = arm2.symptom_id
            AND sm2.delete_flag = 0
          WHERE r2.user_id = u.user_id
            AND r2.doctor_id = ?
            AND r2.share_type = 0
            AND r2.delete_flag = 0
            AND FIND_IN_SET('4', r2.information_type)
        ) AS reported_symptoms,

        (
          SELECT JSON_ARRAYAGG(
            DISTINCT JSON_OBJECT(
              'id', a.medicine_id,
              'name', a.medicine_name
            )
          )
          FROM report_share_master r
          JOIN medication_master m 
            ON m.user_id = r.user_id 
            AND m.delete_flag = 0
            AND m.createtime <= r.createtime
          JOIN medicine_master a 
            ON a.medicine_id = m.medicine_id
          JOIN time_slots_master tm 
            ON tm.medication_id = m.medication_id
            AND tm.delete_flag = 0
          WHERE r.user_id = u.user_id
            AND r.doctor_id = ?
            AND r.share_type = 0
            AND r.delete_flag = 0
            AND FIND_IN_SET('1', r.information_type)
        ) AS medications

      FROM patient_master p
      LEFT JOIN user_master u ON u.user_id = p.user_id
      ${where}
      GROUP BY u.user_id
      ORDER BY u.name ASC
    `;

    connection.query(dataSql, [doctor_id, doctor_id, ...params], (err2, users) => {
      if (err2) {
        return res.json({ success: false, error: err2.message });
      }

      const finalPatients = users.map(user => {
        let diseases = [];
        try {
          const parsed = JSON.parse(user.diseases);
          diseases = parsed.map(d => d.name);
        } catch {
          const matches = user.diseases?.match(/name:\s*([^,}]+)/g) || [];
          diseases = matches.map(m => m.split(":")[1].trim());
        }

        return {
          user_id: user.user_id,
          name: user.name,
          age: user.age,
          gender:
            user.gender == 1 ? "Male" :
            user.gender == 2 ? "Female" :
            user.gender == 3 ? "Other" :
            "Not Specified",
          diseases,
          reported_symptoms: user.reported_symptoms
            ? user.reported_symptoms.split(",").map(s => s.trim()).filter(Boolean)
            : [],
          medications: user.medications
            ? JSON.parse(user.medications)
            : []
        };
      });

      let matchedPatients = [...finalPatients];

      // ─────────────────────────────────────────────────────────
      // SYMPTOM FILTER
      // Always default — ANY of selected symptoms
      // No singleOnly / combinedOnly / includeExtra for symptoms
      // ─────────────────────────────────────────────────────────
      if (Array.isArray(symptoms) && symptoms.length > 0) {
        const selected = symptoms.map(s => s.toLowerCase().trim());
        matchedPatients = matchedPatients.filter(p =>
          (p.reported_symptoms || []).some(s =>
            selected.includes(s.toLowerCase().trim())
          )
        );
      }

      // ─────────────────────────────────────────────────────────
      // DISEASE FILTER
      // singleOnly  (1 selected)   → has ONLY this disease, nothing else
      // combinedOnly (2+ selected) → has EXACTLY all selected, nothing else
      // includeExtra (2+ selected) → has ALL selected, extras allowed
      // default                    → has ANY of selected
      // ─────────────────────────────────────────────────────────
      if (Array.isArray(disease) && disease.length > 0) {
        const selected = disease.map(d => d.toLowerCase().trim());

        if (singleOnly && disease.length === 1) {
          matchedPatients = matchedPatients.filter(p => {
            const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
            return dis.length === 1 && selected.includes(dis[0]);
          });

        } else if (combinedOnly && disease.length >= 2) {
          matchedPatients = matchedPatients.filter(p => {
            const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
            return (
              dis.length === selected.length &&
              selected.every(d => dis.includes(d))
            );
          });

        } else if (includeExtra && disease.length >= 2) {
          matchedPatients = matchedPatients.filter(p => {
            const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
            return selected.every(d => dis.includes(d));
          });

        } else {
          matchedPatients = matchedPatients.filter(p =>
            (p.diseases || []).some(d =>
              selected.includes(d.toLowerCase().trim())
            )
          );
        }
      }

      // ─────────────────────────────────────────────────────────
      // MEDICATION FILTER
      // singleOnly  (1 selected)   → takes ONLY this medication, nothing else
      // combinedOnly (2+ selected) → takes EXACTLY all selected, nothing else
      // includeExtra (2+ selected) → takes ALL selected, extras allowed
      // default                    → takes ANY of selected
      // ─────────────────────────────────────────────────────────
      if (Array.isArray(medication) && medication.length > 0) {
        const selected = medication.map(m => m.toLowerCase().trim());

        if (singleOnly && medication.length === 1) {
          matchedPatients = matchedPatients.filter(p => {
            const meds = (p.medications || [])
              .map(m => m?.name?.toLowerCase().trim())
              .filter(Boolean);
            return meds.length === 1 && selected.includes(meds[0]);
          });

        } else if (combinedOnly && medication.length >= 2) {
          matchedPatients = matchedPatients.filter(p => {
            const meds = (p.medications || [])
              .map(m => m?.name?.toLowerCase().trim())
              .filter(Boolean);
            return (
              meds.length === selected.length &&
              selected.every(m => meds.includes(m))
            );
          });

        } else if (includeExtra && medication.length >= 2) {
          matchedPatients = matchedPatients.filter(p => {
            const meds = (p.medications || [])
              .map(m => m?.name?.toLowerCase().trim())
              .filter(Boolean);
            return selected.every(m => meds.includes(m));
          });

        } else {
          matchedPatients = matchedPatients.filter(p =>
            (p.medications || []).some(m =>
              selected.includes(m?.name?.toLowerCase().trim())
            )
          );
        }
      }

      const matched = matchedPatients.length;
      const offset = (Number(page) - 1) * Number(limit);

      // ─── AGE DISTRIBUTION ───────────────────────────────────
      const ageMap = {};
      matchedPatients.forEach(p => {
        const age = p.age;
        let group = "Other";
        if      (age >= 0  && age <= 18) group = "0-18";
        else if (age >= 19 && age <= 30) group = "19-30";
        else if (age >= 31 && age <= 44) group = "31-44";
        else if (age >= 45 && age <= 64) group = "45-64";
        else if (age >= 65 && age <= 74) group = "65-74";
        else if (age >= 75 && age <= 84) group = "75-84";
        else if (age >= 85)              group = "85+";
        ageMap[group] = (ageMap[group] || 0) + 1;
      });
      const age_distribution = Object.entries(ageMap)
        .map(([age_group, count]) => ({
          age_group,
          count,
          percentage: matched > 0 ? ((count / matched) * 100).toFixed(1) : "0.0"
        }));

      // ─── GENDER DISTRIBUTION ────────────────────────────────
      const genderCountMap = {};
      matchedPatients.forEach(p => {
        const g = p.gender || "Not Specified";
        genderCountMap[g] = (genderCountMap[g] || 0) + 1;
      });
      const gender_distribution = Object.entries(genderCountMap)
        .map(([gender, count]) => ({
          gender,
          count,
          percentage: matched > 0 ? ((count / matched) * 100).toFixed(1) : "0.0"
        }));

      // ─── DISEASE DISTRIBUTION ───────────────────────────────
      const diseaseCountMap = {};
      matchedPatients.forEach(p => {
        (p.diseases || []).forEach(d => {
          if (d) diseaseCountMap[d] = (diseaseCountMap[d] || 0) + 1;
        });
      });
      const disease_distribution = Object.entries(diseaseCountMap)
        .map(([disease, count]) => ({
          disease,
          count,
          percentage: matched > 0 ? ((count / matched) * 100).toFixed(1) : "0.0"
        }))
        .sort((a, b) => b.count - a.count);

      // ─── MEDICATION DISTRIBUTION ────────────────────────────
      const medCountMap = {};
      matchedPatients.forEach(p => {
        (p.medications || []).forEach(m => {
          if (m?.name) medCountMap[m.name] = (medCountMap[m.name] || 0) + 1;
        });
      });
      const medication_distribution = Object.entries(medCountMap)
        .map(([medication, count]) => ({
          medication,
          count,
          percentage: matched > 0 ? ((count / matched) * 100).toFixed(1) : "0.0"
        }))
        .sort((a, b) => b.count - a.count);

      // ─── SYMPTOM DISTRIBUTION ───────────────────────────────
      const symptomCountMap = {};
      matchedPatients.forEach(p => {
        (p.reported_symptoms || []).forEach(s => {
          if (s) symptomCountMap[s] = (symptomCountMap[s] || 0) + 1;
        });
      });
      const symptom_distribution = Object.entries(symptomCountMap)
        .map(([symptom, count]) => ({
          symptom,
          count,
          percentage: matched > 0 ? ((count / matched) * 100).toFixed(1) : "0.0"
        }))
        .sort((a, b) => b.count - a.count);

      return res.json({
        success: true,
        total,
        matched_patients: matched,
        page: Number(page),
        limit: Number(limit),
        patients: matchedPatients.slice(offset, offset + Number(limit)),
        age_distribution,
        gender_distribution,
        disease_distribution,
        medication_distribution,
        symptom_distribution,
      });
    });
  });
};

// 1 Patient info (Demographics of Patient)

// const getPatientDemographics = (req, res) => {
//   const { doctor_id, gender, age_group,page = 1, limit = 10  } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;

//   if (gender !== undefined && gender !== "") {
//     where += ` AND um.gender = ?`;
//     params.push(Number(gender));
//   }

//   if (age_group && age_group !== "") {
//     if (age_group.includes("-")) {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN ${min} AND ${max}`;
//     } else if (age_group === "46+") {
//       where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) >= 46`;
//     }
//   }

  
//   const totalSql = `
//     SELECT COUNT(*) as total
//     FROM patient_master pm
//     JOIN user_master um ON pm.user_id = um.user_id
//     ${where}
//   `;

//   connection.query(totalSql, params, (err, totalResult) => {
//     if (err) {
//       return res.json({ success: false, error: err.message });
//     }

//     const total = totalResult[0]?.total || 0;

    
//     const dataSql = `
//       SELECT 
//         CASE 
//           WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
//           WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
//           WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
//           ELSE '46+'
//         END as age_group,
//         CASE 
//           WHEN um.gender = 1 THEN 'Male'
//           WHEN um.gender = 2 THEN 'Female'
//            WHEN um.gender = 3 THEN 'Other'
//           ELSE 'Not Specified'
//         END as gender,
//         COUNT(*) as count
//       FROM patient_master pm
//       JOIN user_master um ON pm.user_id = um.user_id
//       ${where}
//       GROUP BY age_group, gender
//       ORDER BY age_group
//       LIMIT ? OFFSET ?
//     `;

//     connection.query(dataSql,  [...params, Number(limit), Number(offset)], (err2, rows) => {
//       if (err2) {
//         return res.json({ success: false, error: err2.message });
//       }

//       const data = rows.map(r => ({
//         age_group: r.age_group,
//         gender: r.gender,
//         count: r.count,
//         percentage: total > 0 ? ((r.count / total) * 100).toFixed(2) : "0.00"
//       }));

//       return res.json({
//         success: true,
//         total_patients: total,
//         data
//       });
//     });
//   });
// };
const getPatientDemographics = (req, res) => {
  const { doctor_id, gender, age_group,page = 1, limit = 10  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0`;
  let params = [doctor_id];
  const offset = (page - 1) * limit;

  if (gender !== undefined && gender !== "") {
    where += ` AND um.gender = ?`;
    params.push(Number(gender));
  }

  // if (age_group && age_group !== "") {
  //   if (age_group.includes("-")) {
  //     const [min, max] = age_group.split("-").map(Number);
  //     where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN ${min} AND ${max}`;
  //   } else if (age_group === "46+") {
  //     where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) >= 46`;
  //   }
  // }
if (age_group && age_group !== "") {
  if (age_group.includes("-")) {
    const [min, max] = age_group.split("-").map(Number);
    where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN ${min} AND ${max}`;
  } else if (age_group === "85+") {
    where += ` AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) >= 85`;
  }
}
  
  const totalSql = `
    SELECT COUNT(*) as total
    FROM patient_master pm
    JOIN user_master um ON pm.user_id = um.user_id
    ${where}
  `;

  connection.query(totalSql, params, (err, totalResult) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }

    const total = totalResult[0]?.total || 0;

    
    const dataSql = `
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 31 AND 44 THEN '31-44'
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 45 AND 64 THEN '45-64'
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 65 AND 74 THEN '65-74'
          WHEN TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN 75 AND 84 THEN '75-84'
          ELSE '85+'
        END as age_group,
        CASE 
          WHEN um.gender = 1 THEN 'Male'
          WHEN um.gender = 2 THEN 'Female'
           WHEN um.gender = 3 THEN 'Other'
          ELSE 'Not Specified'
        END as gender,
        COUNT(*) as count
      FROM patient_master pm
      JOIN user_master um ON pm.user_id = um.user_id
      ${where}
      GROUP BY age_group, gender
      ORDER BY  CASE 
    WHEN age_group = '0-18' THEN 1
    WHEN age_group = '19-30' THEN 2
    WHEN age_group = '31-44' THEN 3
    WHEN age_group = '45-64' THEN 4
    WHEN age_group = '65-74' THEN 5
    WHEN age_group = '75-84' THEN 6
    WHEN age_group = '85+' THEN 7 End
      
    `;

    connection.query(dataSql,  [...params, Number(limit), Number(offset)], (err2, rows) => {
      if (err2) {
        return res.json({ success: false, error: err2.message });
      }

      const data = rows.map(r => ({
        age_group: r.age_group,
        gender: r.gender,
        count: r.count,
        percentage: total > 0 ? ((r.count / total) * 100).toFixed(2) : "0.00"
      }));

      return res.json({
        success: true,
        total_patients: total,
        data
      });
    });
  });
};
// const getPatientDemographicsDetails = (req, res) => {
//   const { doctor_id, gender, age_group, search, page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `
//     WHERE pm.doctor_id = ?
//     AND pm.delete_flag = 0
//     AND um.dob IS NOT NULL
//     AND um.dob <= CURDATE()
//   `;

//   let params = [doctor_id];
// const offset = (page - 1) * limit;
//   if (gender !== undefined && gender !== null) {
//     where += " AND um.gender = ?";
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += " AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) >= ?";
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += " AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN ? AND ?";
//       params.push(min, max);
//     }
//   }

//   if (search) {
//     where += " AND um.name LIKE ?";
//     params.push(`%${search}%`);
//   }

//   const sql = `
//     SELECT 
//       um.user_id,
//       um.name,
//       TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) as age,
//       CASE 
//         WHEN um.gender = 1 THEN 'Male'
//         WHEN um.gender = 2 THEN 'Female'
//         WHEN um.gender = 3 THEN 'Other'
//           ELSE 'Not Specified'
//       END as gender
//     FROM patient_master pm
//     JOIN user_master um ON pm.user_id = um.user_id
//     ${where}
//     ORDER BY um.name ASC
//     LIMIT ? OFFSET ?
//   `;

//   connection.query(sql, [...params, Number(limit), Number(offset)], (err, rows) => {
//     if (err) {
//       return res.json({ success: false, msg: "Something went wrong" });
//     }

//     return res.json({
//       success: true,
//       total: rows.length,
//       patients: rows
//     });
//   });
// };

// 2.A)  Disease / Demographics 
const getPatientDemographicsDetails = (req, res) => {
  const { doctor_id, gender, age_group, search, page = 1, limit = 10 } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `
    WHERE pm.doctor_id = ?
    AND pm.delete_flag = 0
    AND um.dob IS NOT NULL
    AND um.dob <= CURDATE()
  `;

  let params = [doctor_id];
  const offset = (page - 1) * limit;

  if (gender !== undefined && gender !== null) {
    where += " AND um.gender = ?";
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += " AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) >= ?";
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += " AND TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) BETWEEN ? AND ?";
      params.push(min, max);
    }
  }

  if (search) {
    where += " AND um.name LIKE ?";
    params.push(`%${search}%`);
  }

  const countSql = `
    SELECT COUNT(DISTINCT pm.user_id) as total
    FROM patient_master pm
    JOIN user_master um ON pm.user_id = um.user_id
    ${where}
  `;

  const sql = `
    SELECT 
      um.user_id,
      um.name,
      TIMESTAMPDIFF(YEAR, um.dob, CURDATE()) as age,
      CASE 
        WHEN um.gender = 1 THEN 'Male'
        WHEN um.gender = 2 THEN 'Female'
        WHEN um.gender = 3 THEN 'Other'
        ELSE 'Not Specified'
      END as gender,
      um.diseases
    FROM patient_master pm
    JOIN user_master um ON pm.user_id = um.user_id
    ${where}
    ORDER BY um.name ASC
    LIMIT ? OFFSET ?
  `;

  connection.query(countSql, params, (err, countResult) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, msg: "Count error" });
    }

    const total = countResult[0].total;

    connection.query(sql, [...params, Number(limit), Number(offset)], (err2, rows) => {
      if (err2) {
        console.log(err2);
        return res.json({ success: false, msg: "Data error" });
      }

      
      const promises = rows.map(patient => new Promise((resolve, reject) => {
  const checkShare = `
    SELECT report_share_id, information_type, createtime
    FROM report_share_master
    WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
    ORDER BY createtime DESC
  `;
  connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
    if (err1) return reject(err1);

    const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
    if (!latestShare) {
      patient.medications = [];
      return resolve(patient);
    }

    const shareTime = latestShare.createtime;

    const medSql = `
      SELECT DISTINCT a.medicine_id, a.medicine_name
      FROM medication_master m
      JOIN medicine_master a ON a.medicine_id = m.medicine_id
      JOIN time_slots_master tm ON tm.medication_id = m.medication_id
      WHERE m.user_id = ? 
        AND m.delete_flag = 0 
        AND tm.delete_flag = 0 
        AND m.createtime <= ?
      ORDER BY a.medicine_name ASC
    `;

    connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
      if (err2) return reject(err2);

      // medicines array of objects with id & name
      patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
      resolve(patient);
    });
  });
}));

      Promise.all(promises)
        .then(finalPatients => {
          return res.json({
            success: true,
            total,
            page,
            limit,
            patients: finalPatients
          });
        })
        .catch(err => res.json({ success: false, msg: err.message }));
    });
  });
};

// const getDiseaseDashboard = (req, res) => {
//   const { doctor_id, disease = [], age_group, gender, page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;
//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (disease.length) {
//     where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }

//   const totalSql = `
//     SELECT COUNT(DISTINCT p.user_id) as total
//     FROM patient_master p WHERE p.doctor_id = ? AND p.delete_flag = 0
//   `;

//   connection.query(totalSql,  [doctor_id], (err, totalRes) => {
//     const totalPatients = totalRes[0].total;

//     const matchedSql = `
//       SELECT COUNT(DISTINCT p.user_id) as matched
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//     `;

//     connection.query(matchedSql, params, (err, matchRes) => {
//       const matched = matchRes[0].matched;

//       const diseaseSql = `
//         SELECT u.diseases as name, COUNT(*) as count
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         ${where}
//         GROUP BY u.diseases
//       `;

//       connection.query(diseaseSql, params, (err, diseaseRows) => {
//         const disease_distribution = diseaseRows.map(r => ({
//           name: r.name,
//           count: r.count,
//           percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//         }));

//         const ageSql = `
//           SELECT 
//             CASE 
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
//               ELSE '46+'
//             END as age_group,
//             COUNT(*) as count
//           FROM patient_master p
//           JOIN user_master u ON u.user_id = p.user_id
//           ${where}
//           GROUP BY age_group
//         `;

//         connection.query(ageSql, params, (err, ageRows) => {
//           const age_breakdown = ageRows.map(r => ({
//             age_group: r.age_group,
//             count: r.count,
//             percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//           }));

//           const sexSql = `
//             SELECT 
//               CASE 
//                 WHEN u.gender = 1 THEN 'Male'
//                 WHEN u.gender = 2 THEN 'Female'
//                  WHEN u.gender = 3 THEN 'Other'
//                   ELSE 'Not Specified'
//               END as gender,
//               COUNT(*) as count
//             FROM patient_master p
//             JOIN user_master u ON u.user_id = p.user_id
//             ${where}
//             GROUP BY u.gender
//           `;

//           connection.query(sexSql, params, (err, sexRows) => {
//             const sex_breakdown = sexRows.map(r => ({
//               gender: r.gender,
//               count: r.count,
//               percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//             }));

//             const patientSql = `
//               SELECT 
//                 u.name,
//                 TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//                 CASE WHEN u.gender = 1 THEN 'Male'
//                      WHEN u.gender = 2 THEN 'Female'
//                      WHEN u.gender = 3 THEN 'Other'
//                       ELSE 'Not Specified'
//                       END as gender,
//                 u.diseases,
//                 GROUP_CONCAT(DISTINCT med.medicine_name) as medications
//               FROM patient_master p
//               JOIN user_master u ON u.user_id = p.user_id
//               LEFT JOIN medication_master m ON m.user_id = u.user_id
//               LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//               ${where}
//               GROUP BY p.user_id 
//               ORDER BY u.name ASC
//               LIMIT ? OFFSET ?
//             `;

//             connection.query(patientSql,  [...params, Number(limit), Number(offset)], (err, patientRows) => {
//               return res.json({
//                 success: true,
//                 total_patients: totalPatients,
//                 matched_patients: matched,
//                 disease_distribution,
//                 age_breakdown,
//                 sex_breakdown,
//                 patients: patientRows
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// };
// Diseases Medicine and medicine sumery api

// const getDiseaseDashboard = (req, res) => {
//   const { doctor_id, disease = [], age_group, gender, page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   const offset = (page - 1) * limit;
//   let params = [doctor_id];
//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL`;

//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (disease.length) {
//     where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }

//   // Function to 
//   const cleanDiseaseString = (diseaseStr) => {
//     if (!diseaseStr) return "";
//     return diseaseStr
//       .split(/,|\n/) 
//       .map(d => {
//         d = d.replace(/status:\s*true/g, "")
//              .replace(/length:\s*\d+/g, "")
//              .replace(/\s*,\s*,/g, ",")
//              .trim();
//         return d;
//       })
//       .filter(d => d !== "")
//       .join(",");
//   };

//   const totalSql = `SELECT COUNT(DISTINCT p.user_id) as total
//                     FROM patient_master p WHERE p.doctor_id = ? AND p.delete_flag = 0`;

//   connection.query(totalSql, [doctor_id], (err, totalRes) => {
//     if (err) return res.json({ success: false, msg: err.message });
//     const totalPatients = totalRes[0].total;

//     const matchedSql = `
//       SELECT COUNT(DISTINCT p.user_id) as matched
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//     `;
//     connection.query(matchedSql, params, (err, matchRes) => {
//       if (err) return res.json({ success: false, msg: err.message });
//       const matched = matchRes[0].matched;

//       const diseaseSql = `
//         SELECT u.diseases as name, COUNT(*) as count
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         ${where}
//         GROUP BY u.diseases
//       `;
//       connection.query(diseaseSql, params, (err, diseaseRows) => {
//         if (err) return res.json({ success: false, msg: err.message });

//         const disease_distribution = diseaseRows.map(r => ({
//           name: cleanDiseaseString(r.name),
//           count: r.count,
//           percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//         }));

//         const ageSql = `
//           SELECT 
//             CASE 
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
//               WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
//               ELSE '46+'
//             END as age_group,
//             COUNT(*) as count
//           FROM patient_master p
//           JOIN user_master u ON u.user_id = p.user_id
//           ${where}
//           GROUP BY age_group
//         `;
//         connection.query(ageSql, params, (err, ageRows) => {
//           if (err) return res.json({ success: false, msg: err.message });
//           const age_breakdown = ageRows.map(r => ({
//             age_group: r.age_group,
//             count: r.count,
//             percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//           }));

//           const sexSql = `
//             SELECT 
//               CASE 
//                 WHEN u.gender = 1 THEN 'Male'
//                 WHEN u.gender = 2 THEN 'Female'
//                 WHEN u.gender = 3 THEN 'Other'
//                 ELSE 'Not Specified'
//               END as gender,
//               COUNT(*) as count
//             FROM patient_master p
//             JOIN user_master u ON u.user_id = p.user_id
//             ${where}
//             GROUP BY u.gender
//           `;
//           connection.query(sexSql, params, (err, sexRows) => {
//             if (err) return res.json({ success: false, msg: err.message });
//             const sex_breakdown = sexRows.map(r => ({
//               gender: r.gender,
//               count: r.count,
//               percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
//             }));

//             const patientSql = `
//               SELECT 
//                   u.user_id,
//                   u.name,
//                   TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//                   CASE
//                       WHEN u.gender = 1 THEN 'Male'
//                       WHEN u.gender = 2 THEN 'Female'
//                       WHEN u.gender = 3 THEN 'Other'
//                       ELSE 'Not Specified'
//                   END as gender,
//                   u.diseases
//               FROM patient_master p
//               JOIN user_master u ON u.user_id = p.user_id
//               ${where}
//               GROUP BY p.user_id
//               ORDER BY u.name ASC
//               LIMIT ? OFFSET ?
//             `;
//             connection.query(patientSql, [...params, Number(limit), Number(offset)], (err, patientRows) => {
//               if (err) return res.json({ success: false, msg: err.message });

//               // Clean diseases in patient rows
//               patientRows.forEach(p => {
//                 p.diseases = cleanDiseaseString(p.diseases);
//               });

//               // Fetch medications per patient
//               const promises = patientRows.map(patient => new Promise((resolve, reject) => {
//                 const checkShare = `
//                   SELECT report_share_id, information_type, createtime 
//                   FROM report_share_master 
//                   WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//                   ORDER BY createtime DESC
//                 `;
//                 connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//                   if (err1) return reject(err1);

//                   const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
//                   if (!latestShare) {
//                     patient.medications = [];
//                     return resolve(patient);
//                   }

//                   const shareTime = latestShare.createtime;
//                   const medSql = `
//                     SELECT DISTINCT a.medicine_id, a.medicine_name
//                     FROM medication_master m
//                     JOIN medicine_master a ON a.medicine_id = m.medicine_id
//                     JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//                     WHERE m.user_id = ? 
//                       AND m.delete_flag = 0 
//                       AND tm.delete_flag = 0 
//                       AND m.createtime <= ?
//                     ORDER BY a.medicine_name ASC
//                   `;
//                   connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//                     if (err2) return reject(err2);
//                     patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
//                     resolve(patient);
//                   });
//                 });
//               }));

//               Promise.all(promises)
//                 .then(finalPatients => {
//                   return res.json({
//                     success: true,
//                     total_patients: totalPatients,
//                     matched_patients: matched,
//                     disease_distribution,
//                     age_breakdown,
//                     sex_breakdown,
//                     patients: finalPatients
//                   });
//                 })
//                 .catch(err => res.json({ success: false, msg: err.message }));
//             });
//           });
//         });
//       });
//     });
//   });
// };
const getDiseaseDashboard = (req, res) => {
  const { doctor_id, disease = [], age_group, gender, page = 1, limit = 10 } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  const offset = (page - 1) * limit;
  let params = [doctor_id];
  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL`;

  if (gender !== undefined && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

  if (disease.length) {
    where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
    disease.forEach(d => params.push(`%${d}%`));
  }

  // Function to 
  const cleanDiseaseString = (diseaseStr) => {
    if (!diseaseStr) return "";
    return diseaseStr
      .split(/,|\n/) 
      .map(d => {
        d = d.replace(/status:\s*true/g, "")
             .replace(/length:\s*\d+/g, "")
             .replace(/\s*,\s*,/g, ",")
             .trim();
        return d;
      })
      .filter(d => d !== "")
      .join(",");
  };

  const totalSql = `SELECT COUNT(DISTINCT p.user_id) as total
                    FROM patient_master p WHERE p.doctor_id = ? AND p.delete_flag = 0`;

  connection.query(totalSql, [doctor_id], (err, totalRes) => {
    if (err) return res.json({ success: false, msg: err.message });
    const totalPatients = totalRes[0].total;

    const matchedSql = `
      SELECT COUNT(DISTINCT p.user_id) as matched
      FROM patient_master p
      JOIN user_master u ON u.user_id = p.user_id
      ${where}
    `;
    connection.query(matchedSql, params, (err, matchRes) => {
      if (err) return res.json({ success: false, msg: err.message });
      const matched = matchRes[0].matched;

      const diseaseSql = `
        SELECT u.diseases as name, COUNT(*) as count
        FROM patient_master p
        JOIN user_master u ON u.user_id = p.user_id
        ${where}
        GROUP BY u.diseases
      `;
      connection.query(diseaseSql, params, (err, diseaseRows) => {
        if (err) return res.json({ success: false, msg: err.message });

        const disease_distribution = diseaseRows.map(r => ({
          name: cleanDiseaseString(r.name),
          count: r.count,
          percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
        }))
        .sort((a, b) => b.count - a.count);
   

        const ageSql = `
          SELECT 
            CASE 
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 0 AND 18 THEN '0-18'
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 19 AND 30 THEN '19-30'
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 31 AND 44 THEN '31-44'
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 45 AND 64 THEN '45-64'
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 65 AND 74 THEN '65-74'
              WHEN TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN 75 AND 84 THEN '75-84'
              ELSE '85+'
            END as age_group,
            COUNT(*) as count
          FROM patient_master p
          JOIN user_master u ON u.user_id = p.user_id
          ${where}
          GROUP BY age_group
        `;
        connection.query(ageSql, params, (err, ageRows) => {
          if (err) return res.json({ success: false, msg: err.message });
          const age_breakdown = ageRows.map(r => ({
            age_group: r.age_group,
            count: r.count,
            percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
          }));

          const sexSql = `
            SELECT 
              CASE 
                WHEN u.gender = 1 THEN 'Male'
                WHEN u.gender = 2 THEN 'Female'
                WHEN u.gender = 3 THEN 'Other'
                ELSE 'Not Specified'
              END as gender,
              COUNT(*) as count
            FROM patient_master p
            JOIN user_master u ON u.user_id = p.user_id
            ${where}
            GROUP BY u.gender
          `;
          connection.query(sexSql, params, (err, sexRows) => {
            if (err) return res.json({ success: false, msg: err.message });
            const sex_breakdown = sexRows.map(r => ({
              gender: r.gender,
              count: r.count,
              percentage: matched ? ((r.count / matched) * 100).toFixed(2) : "0.00"
            }));

            const patientSql = `
              SELECT 
                  u.user_id,
                  u.name,
                  TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
                  CASE
                      WHEN u.gender = 1 THEN 'Male'
                      WHEN u.gender = 2 THEN 'Female'
                      WHEN u.gender = 3 THEN 'Other'
                      ELSE 'Not Specified'
                  END as gender,
                  u.diseases
              FROM patient_master p
              JOIN user_master u ON u.user_id = p.user_id
              ${where}
              GROUP BY p.user_id
              ORDER BY u.name ASC
              LIMIT ? OFFSET ?
            `;
            connection.query(patientSql, [...params, Number(limit), Number(offset)], (err, patientRows) => {
              if (err) return res.json({ success: false, msg: err.message });

              // Clean diseases in patient rows
              patientRows.forEach(p => {
                p.diseases = cleanDiseaseString(p.diseases);
              });

              // Fetch medications per patient
              const promises = patientRows.map(patient => new Promise((resolve, reject) => {
                const checkShare = `
                  SELECT report_share_id, information_type, createtime 
                  FROM report_share_master 
                  WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
                  ORDER BY createtime DESC
                `;
                connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
                  if (err1) return reject(err1);

                  const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
                  if (!latestShare) {
                    patient.medications = [];
                    return resolve(patient);
                  }

                  const shareTime = latestShare.createtime;
                  const medSql = `
                    SELECT DISTINCT a.medicine_id, a.medicine_name
                    FROM medication_master m
                    JOIN medicine_master a ON a.medicine_id = m.medicine_id
                    JOIN time_slots_master tm ON tm.medication_id = m.medication_id
                    WHERE m.user_id = ? 
                      AND m.delete_flag = 0 
                      AND tm.delete_flag = 0 
                      AND m.createtime <= ?
                    ORDER BY a.medicine_name ASC
                  `;
                  connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
                    if (err2) return reject(err2);
                    patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
                    resolve(patient);
                  });
                });
              }));

              Promise.all(promises)
                .then(finalPatients => {
                  return res.json({
                    success: true,
                    total_patients: totalPatients,
                    matched_patients: matched,
                    disease_distribution,
                    age_breakdown,
                    sex_breakdown,
                    patients: finalPatients
                  });
                })
                .catch(err => res.json({ success: false, msg: err.message }));
            });
          });
        });
      });
    });
  });
};
//  2 B)
// const getPatientDiseasesMedicineAnalytics = (req, res) => {
//   const {
//     doctor_id,
//     gender,
//     age_group,
//     disease = [],
//     medication = []
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];
//   if (gender !== undefined && gender !== null) {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (disease.length) {
//     where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }

//   if (medication.length) {
//     where += ` AND (` + medication.map(() => `REPLACE(LOWER(med.medicine_name), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`).join(" OR ") + `)`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   const totalSql = `
//     SELECT COUNT(DISTINCT p.user_id) as total
//     FROM patient_master p
//     WHERE p.doctor_id = ? AND p.delete_flag = 0
//   `;

//   connection.query(totalSql, [doctor_id], (err, totalResult) => {
//     if (err) {
//       return res.json({ success: false, msg: "Error" });
//     }

//     const sql = `
//       SELECT COUNT(DISTINCT p.user_id) as count
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       LEFT JOIN medicine_master med ON med.user_id = u.user_id
//       ${where}
//     `;

//     connection.query(sql, params, (err, result) => {
//       if (err) {
//         return res.json({ success: false, msg: "Error" });
//       }

//       const total = totalResult[0].total;
//       const count = result[0].count;
//       const percentage = total ? ((count / total) * 100).toFixed(2) : 0;

//       return res.json({
//         success: true,
//         total_patients: total,
//         matched_patients: count,
//         percentage: percentage + "%"
//       });
//     });
//   });
// };
// const getPatientDiseasesMedicineAnalytics = (req, res) => {
//   const {
//     doctor_id,
//     gender,
//     age_group,
//     disease = [],
//     medication = [],
//     singleOnly = false,
//   combinedOnly = false,
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

// if (Array.isArray(disease) && disease.length > 0) {

//   const countCondition = `
//     (
//       LENGTH(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', '')) 
//       - LENGTH(REPLACE(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', ''), 'name:', ''))
//     ) / LENGTH('name:')
//   `;

//   // ✅ SINGLE ONLY
//   if (disease.length === 1 && singleOnly) {
//     where += ` AND u.diseases LIKE ?`;
//     params.push(`%${disease[0]}%`);

//     where += ` AND ${countCondition} = 1`;
//   }

//   // ✅ COMBINED ONLY
//   else if (combinedOnly && disease.length >= 2) {
//     const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
//     where += ` AND (${diseaseConditions})`;
//     disease.forEach(d => params.push(`%${d}%`));

//     where += ` AND ${countCondition} = ?`;
//     params.push(disease.length);
//   }

//   // ✅ DEFAULT
//   else {
//     const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" OR ");
//     where += ` AND (${diseaseConditions})`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }
// }

//   if (medication.length) {
//     where += ` AND (` + medication.map(() => `REPLACE(LOWER(med.medicine_name), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`).join(" OR ") + `)`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   const totalSql = `
//     SELECT COUNT(DISTINCT p.user_id) as total
//     FROM patient_master p
//     WHERE p.doctor_id = ? AND p.delete_flag = 0
//   `;

//   connection.query(totalSql, [doctor_id], (err, totalResult) => {
//     if (err) return res.json({ success: false, msg: "Error" });

//     const sql = `
//       SELECT COUNT(DISTINCT p.user_id) as count
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       LEFT JOIN medication_master m ON m.user_id = u.user_id
//       LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//       ${where}
//     `;

//     const topDrugSql = `
//       SELECT 
//         m.medicine_id,
//         med.medicine_name,
//         COUNT(DISTINCT p.user_id) as patient_count
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       JOIN medication_master m ON m.user_id = u.user_id AND m.delete_flag = 0
//       JOIN medicine_master med ON med.medicine_id = m.medicine_id
//       ${where}
//       GROUP BY m.medicine_id
//       ORDER BY patient_count DESC
//       LIMIT 1
//     `;

//     connection.query(sql, params, (err, result) => {
//       if (err) return res.json({ success: false, msg: "Error" });

//       const total = totalResult[0].total;
//       const count = result[0].count;
//       const percentage = total ? ((count / total) * 100).toFixed(2) : 0;

//       connection.query(topDrugSql, params, (err2, topDrugRes) => {
//         if (err2) return res.json({ success: false, msg: "Error in top drug" });

//         let top_drug = "";
//         if (topDrugRes.length > 0) {
//           top_drug = topDrugRes[0].medicine_name;
//         }

//         return res.json({
//           success: true,
//           total_patients: total,
//           matched_patients: count,
//           percentage: percentage + "%",
//           top_drug
//         });
//       });
//     });
//   });
// };

const getPatientDiseasesMedicineAnalytics = (req, res) => {
  const {
    doctor_id,
    gender,
    age_group,
    disease = [],
    medication = [],
     exclude_medication = [],
    singleOnly = false,
  combinedOnly = false,
  includeExtra = false,
  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
  let params = [doctor_id];

  if (gender !== undefined && gender !== null && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

if (Array.isArray(disease) && disease.length > 0) {

  const countCondition = `
    (
      LENGTH(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', '')) 
      - LENGTH(REPLACE(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', ''), 'name:', ''))
    ) / LENGTH('name:')
  `;

  // ✅ SINGLE ONLY
  if (disease.length === 1 && singleOnly) {
    where += ` AND u.diseases LIKE ?`;
    params.push(`%${disease[0]}%`);

    where += ` AND ${countCondition} = 1`;
  }

  // ✅ COMBINED ONLY
  else if (combinedOnly && disease.length >= 2) {
    const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
    where += ` AND (${diseaseConditions})`;
    disease.forEach(d => params.push(`%${d}%`));

    where += ` AND ${countCondition} = ?`;
    params.push(disease.length);
  }
   else if (includeExtra && disease.length >= 2) {
  const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
  where += ` AND (${diseaseConditions})`;
  disease.forEach(d => params.push(`%${d}%`));
}

  // ✅ DEFAULT
  else {
    const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" OR ");
    where += ` AND (${diseaseConditions})`;
    disease.forEach(d => params.push(`%${d}%`));
  }
}

  if (medication.length) {
    where += ` AND (` + medication.map(() => `REPLACE(LOWER(med.medicine_name), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`).join(" OR ") + `)`;
    medication.forEach(m => params.push(`%${m}%`));
  }
    let topWhere = where;
    let topParams = [...params];

    if (Array.isArray(exclude_medication) && exclude_medication.length > 0) {
      topWhere += ` AND med.medicine_name NOT IN (${exclude_medication.map(() => '?').join(',')})`;
      topParams.push(...exclude_medication);
    }
  const totalSql = `
    SELECT COUNT(DISTINCT p.user_id) as total
    FROM patient_master p
    WHERE p.doctor_id = ? AND p.delete_flag = 0
  `;

  connection.query(totalSql, [doctor_id], (err, totalResult) => {
    if (err) return res.json({ success: false, msg: "Error" });

    const sql = `
      SELECT COUNT(DISTINCT p.user_id) as count
      FROM patient_master p
      JOIN user_master u ON u.user_id = p.user_id
      LEFT JOIN medication_master m ON m.user_id = u.user_id
      LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
      ${where}
    `;

    // const topDrugSql = `
    //   SELECT 
    //     m.medicine_id,
    //     med.medicine_name,
    //     COUNT(DISTINCT p.user_id) as patient_count
    //   FROM patient_master p
    //   JOIN user_master u ON u.user_id = p.user_id
    //   JOIN medication_master m ON m.user_id = u.user_id AND m.delete_flag = 0
    //   JOIN medicine_master med ON med.medicine_id = m.medicine_id
    //   ${where}
    //   GROUP BY m.medicine_id
    //   ORDER BY patient_count DESC
    //   LIMIT 1
    // `;

    const topDrugSql = `
      SELECT 
        m.medicine_id,
        med.medicine_name,
        COUNT(DISTINCT p.user_id) as patient_count
      FROM patient_master p
      JOIN user_master u ON u.user_id = p.user_id
      JOIN medication_master m ON m.user_id = u.user_id AND m.delete_flag = 0
      JOIN medicine_master med ON med.medicine_id = m.medicine_id
      ${topWhere}
      GROUP BY m.medicine_id
      ORDER BY patient_count DESC
      LIMIT 1
    `;

      connection.query(sql, params, (err, result) => {
      if (err) return res.json({ success: false, msg: "Error" });

      const total = totalResult[0].total;
      const count = result[0].count;
      const percentage = total ? ((count / total) * 100).toFixed(2) : 0;

      connection.query(topDrugSql, topParams, (err2, topDrugRes) => {
        if (err2) return res.json({ success: false, msg: "Error in top drug" });

        let top_drug = "";
        if (topDrugRes.length > 0) {
          top_drug = topDrugRes[0].medicine_name;
        }

        return res.json({
          success: true,
          total_patients: total,
          matched_patients: count,
          percentage: percentage + "%",
          top_drug
        });
      });
    });
  });
};
// const getPatientDiseasesMedicineList = (req, res) => {
//   const { doctor_id, gender, age_group,page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;

//   if (gender !== undefined) {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = age_group.replace("+", "");
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-");
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   const sql = `
//     SELECT 
//       u.name,
//       TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//       CASE 
//         WHEN u.gender = 1 THEN 'Male'
//         WHEN u.gender = 2 THEN 'Female'
//          WHEN u.gender = 3 THEN 'Other'
//           ELSE 'Not Specified'
//       END as gender,
//       u.diseases,
//       GROUP_CONCAT(DISTINCT med.medicine_name) as medications
//     FROM patient_master p
//     JOIN user_master u ON u.user_id = p.user_id
//     LEFT JOIN medication_master m ON m.user_id = u.user_id
//     LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//     ${where}
//     GROUP BY p.user_id LIMIT ? OFFSET ?
//   `;

//   connection.query(sql,  [...params, Number(limit), Number(offset)], (err, patients) => {
//     if (err) {
//       console.log(err);
//       return res.json({ success: false, msg: "Error" });
//     }

//     return res.json({
//       success: true,
//       total: patients.length,
//       data: patients
//     });
//   });
// };
const getPatientDiseasesMedicineList = (req, res) => {
  const {
  doctor_id,
  gender,
  age_group,
  diseases = [],
  singleOnly = false,
  combinedOnly = false,
  includeExtra = false,
  page = 1,
  limit = 10
} = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
  let params = [doctor_id];
  const offset = (page - 1) * limit;

  if (gender !== undefined) {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = age_group.replace("+", "");
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-");
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }
if (Array.isArray(diseases) && diseases.length > 0) {

  // normalize disease count (handle comma + newline)
  const countCondition = `
    (
      LENGTH(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', '')) 
      - LENGTH(REPLACE(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', ''), 'name:', ''))
    ) / LENGTH('name:')
  `;

  // ✅ SINGLE ONLY (exactly 1 disease and matches)
  if (diseases.length === 1 && singleOnly) {
    where += ` AND u.diseases LIKE ?`;
    params.push(`%${diseases[0]}%`);

    where += ` AND ${countCondition} = 1`;
  }

  // ✅ COMBINED ONLY (exact match, no extra diseases)
  else if (combinedOnly && diseases.length >= 2) {
    const diseaseConditions = diseases.map(() => `u.diseases LIKE ?`).join(" AND ");
    where += ` AND (${diseaseConditions})`;
    diseases.forEach(d => params.push(`%${d}%`));

    where += ` AND ${countCondition} = ?`;
    params.push(diseases.length);
  }
  else if (includeExtra && diseases.length >= 2) {
  const diseaseConditions = diseases.map(() => `u.diseases LIKE ?`).join(" AND ");
  where += ` AND (${diseaseConditions})`;
  diseases.forEach(d => params.push(`%${d}%`));
}

  // ✅ DEFAULT (loose match)
  else {
    const diseaseConditions = diseases.map(() => `u.diseases LIKE ?`).join(" OR ");
    where += ` AND (${diseaseConditions})`;
    diseases.forEach(d => params.push(`%${d}%`));
  }
}

  const sql = `
    SELECT 
      u.user_id,
      u.name,
      TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
      CASE 
        WHEN u.gender = 1 THEN 'Male'
        WHEN u.gender = 2 THEN 'Female'
        WHEN u.gender = 3 THEN 'Other'
        ELSE 'Not Specified'
      END as gender,
      u.diseases
    FROM patient_master p
    JOIN user_master u ON u.user_id = p.user_id
    ${where}
    GROUP BY p.user_id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?
  `;

  connection.query(sql, [...params, Number(limit), Number(offset)], (err, patients) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, msg: "Error" });
    }

    // Fetch medications per patient based on doctor share
    const promises = patients.map(patient => new Promise((resolve, reject) => {
      const checkShare = `
        SELECT report_share_id, information_type, createtime 
        FROM report_share_master 
        WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
        ORDER BY createtime DESC
      `;

      connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
        if (err1) return reject(err1);

        const latestShare = shareList.find(r => r.information_type.split(",").includes("1")); // "1" = medication
        if (!latestShare) {
          patient.medications = [];
          return resolve(patient);
        }

        const shareTime = latestShare.createtime;

        const medSql = `
          SELECT DISTINCT a.medicine_id, a.medicine_name
          FROM medication_master m
          JOIN medicine_master a ON a.medicine_id = m.medicine_id
          JOIN time_slots_master tm ON tm.medication_id = m.medication_id
          WHERE m.user_id = ? 
            AND m.delete_flag = 0 
            AND tm.delete_flag = 0 
            AND m.createtime <= ?
          ORDER BY a.medicine_name ASC
        `;

        connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
          if (err2) return reject(err2);

          patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
          resolve(patient);
        });
      });
    }));

    Promise.all(promises)
      .then(finalPatients => {
        return res.json({
          success: true,
          total: finalPatients.length,
          data: finalPatients
        });
      })
      .catch(err => res.json({ success: false, msg: err.message }));
  });
};

// const getDiseaseMedicineSummary = (req, res) => {
//     const {
//       doctor_id,
//       gender,
//       age_group,
//       disease = [],
//       page = 1, limit = 10
//     } = req.body;

//     if (!doctor_id) {
//       return res.json({ success: false, msg: "doctor_id required" });
//     }

//     let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//     let params = [doctor_id];
//     const offset = (page - 1) * limit;
//     if (gender !== undefined && gender !== null && gender !== "") {
//       where += ` AND u.gender = ?`;
//       params.push(gender);
//     }

//     if (age_group) {
//       if (age_group.includes("+")) {
//         const min = parseInt(age_group.replace("+", ""));
//         where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//         params.push(min);
//       } else {
//         const [min, max] = age_group.split("-").map(Number);
//         where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//         params.push(min, max);
//       }
//     }

//     if (disease.length) {
//       where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
//       disease.forEach(d => params.push(`%${d}%`));
//     }

    
//     const totalSql = `
//       SELECT COUNT(DISTINCT p.user_id) as total
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//     `;

//     connection.query(totalSql, params, (err, totalResult) => {
//       if (err) {
//         console.log(err);
//         return res.json({ success: false, msg: "Error" });
//       }

//       const totalPatients = totalResult[0].total;

      
//       const sql = `
//         SELECT 
//           med.medicine_name,
//           COUNT(DISTINCT p.user_id) as patient_count
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         LEFT JOIN medication_master m ON m.user_id = u.user_id
//         LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//         ${where}
//         AND med.medicine_name IS NOT NULL
//         GROUP BY med.medicine_name
//         ORDER BY patient_count DESC
//       `;

//       connection.query(sql, params, (err, result) => {
//         if (err) {
//           console.log(err);
//           return res.json({ success: false, msg: "Error" });
//         }

//         const data = result.map(row => {
//           const percentage = totalPatients
//             ? ((row.patient_count / totalPatients) * 100).toFixed(2)
//             : 0;

//           return {
//             medicine_name: row.medicine_name,
//             patient_count: row.patient_count,
//             percentage: percentage + "%"
//           };
//         });

        
//         const graph = data.map(d => ({
//           name: d.medicine_name,
//           count: d.patient_count
//         }));

        
//         const drilldownSql = `
//           SELECT 
//             p.user_id,
//             u.name,
//             med.medicine_name
//           FROM patient_master p
//           JOIN user_master u ON u.user_id = p.user_id
//           LEFT JOIN medication_master m ON m.user_id = u.user_id
//           LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//           ${where}
//           AND med.medicine_name IS NOT NULL LIMIT ? OFFSET ?
//         `;

//         connection.query(drilldownSql,  [...params, Number(limit), Number(offset)], (err, drillRows) => {
//           if (err) {
//             console.log(err);
//             return res.json({ success: false, msg: "Error" });
//           }

//           return res.json({
//             success: true,
//             total_patients: totalPatients,
//             summary: data,    
//             graph: graph,     
//             drilldown: drillRows 
//           });
//         });
//       });
//     });
// };

// const getDiseaseMedicineSummary = (req, res) => {
//   const { doctor_id, gender, age_group, disease = [], page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (disease.length) {
//     where += ` AND (` + disease.map(() => `u.diseases LIKE ?`).join(" OR ") + `)`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }

//   const sql = `
//     SELECT 
//       u.user_id,
//       u.name
//     FROM patient_master p
//     JOIN user_master u ON u.user_id = p.user_id
//     ${where}
//     GROUP BY p.user_id
//     ORDER BY u.name ASC
//     LIMIT ? OFFSET ?
//   `;

//   connection.query(sql, [...params, Number(limit), Number(offset)], (err, patients) => {
//     if (err) return res.json({ success: false, msg: "Error" });

//     const promises = patients.map(patient => new Promise((resolve, reject) => {
//       const checkShare = `
//         SELECT report_share_id, information_type, createtime 
//         FROM report_share_master 
//         WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//         ORDER BY createtime DESC
//       `;

//       connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//         if (err1) return reject(err1);

//         const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
//         if (!latestShare) {
//           patient.medications = [];
//           return resolve(patient);
//         }

//         const shareTime = latestShare.createtime;

//         const medSql = `
//           SELECT DISTINCT a.medicine_id, a.medicine_name
//           FROM medication_master m
//           JOIN medicine_master a ON a.medicine_id = m.medicine_id
//           JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//           WHERE m.user_id = ? 
//             AND m.delete_flag = 0 
//             AND tm.delete_flag = 0 
//             AND m.createtime <= ?
//           ORDER BY a.medicine_name ASC
//         `;

//         connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//           if (err2) return reject(err2);

//           patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
//           resolve(patient);
//         });
//       });
//     }));

//     Promise.all(promises)
//       .then(finalPatients => {
//         // Generate summary counts per medicine
//         const medicineCountMap = {};
//         finalPatients.forEach(p => {
//           p.medications.forEach(med => {
//             if (!medicineCountMap[med.name]) medicineCountMap[med.name] = 0;
//             medicineCountMap[med.name] += 1;
//           });
//         });

//         const totalPatients = finalPatients.length;
//         const summary = Object.keys(medicineCountMap).map(name => ({
//           medicine_name: name,
//           patient_count: medicineCountMap[name],
//           percentage: totalPatients ? ((medicineCountMap[name] / totalPatients) * 100).toFixed(2) + "%" : "0%"
//         }));

//         const graph = summary.map(d => ({ name: d.medicine_name, count: d.patient_count }));

//         return res.json({
//           success: true,
//           total_patients: totalPatients,
//           summary: summary,
//           graph: graph,
//           drilldown: finalPatients
//         });
//       })
//       .catch(err => res.json({ success: false, msg: err.message }));
//   });
// };

// const getDiseaseMedicineSummary = (req, res) => {
//   const { doctor_id, gender, age_group, singleOnly = false, combinedOnly = false, disease = [], page = 1, limit = 10 } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//  if (Array.isArray(disease) && disease.length > 0) {

//   const countCondition = `
//     (
//       LENGTH(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', '')) 
//       - LENGTH(REPLACE(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', ''), 'name:', ''))
//     ) / LENGTH('name:')
//   `;

//   // ✅ SINGLE ONLY
//   if (disease.length === 1 && singleOnly) {
//     where += ` AND u.diseases LIKE ?`;
//     params.push(`%${disease[0]}%`);

//     where += ` AND ${countCondition} = 1`;
//   }

//   // ✅ COMBINED ONLY
//   else if (combinedOnly && disease.length >= 2) {
//     const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
//     where += ` AND (${diseaseConditions})`;
//     disease.forEach(d => params.push(`%${d}%`));

//     where += ` AND ${countCondition} = ?`;
//     params.push(disease.length);
//   }

//   // ✅ DEFAULT
//   else {
//     const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" OR ");
//     where += ` AND (${diseaseConditions})`;
//     disease.forEach(d => params.push(`%${d}%`));
//   }
// }

//   const totalAllSql = `
//     SELECT COUNT(DISTINCT user_id) as total
//     FROM patient_master
//     WHERE doctor_id = ? AND delete_flag = 0
//   `;

//   const sql = `
//     SELECT 
//       u.user_id,
//       u.name
//     FROM patient_master p
//     JOIN user_master u ON u.user_id = p.user_id
//     ${where}
//     GROUP BY p.user_id
//     ORDER BY u.name ASC
//     LIMIT ? OFFSET ?
//   `;

//   connection.query(totalAllSql, [doctor_id], (err0, totalAllRes) => {
//     if (err0) return res.json({ success: false, msg: "Error" });

//     const totalAllPatients = totalAllRes[0].total;

//     connection.query(sql, [...params, Number(limit), Number(offset)], (err, patients) => {
//       if (err) return res.json({ success: false, msg: "Error" });

//       const promises = patients.map(patient => new Promise((resolve, reject) => {
//         const checkShare = `
//           SELECT report_share_id, information_type, createtime 
//           FROM report_share_master 
//           WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//           ORDER BY createtime DESC
//         `;

//         connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//           if (err1) return reject(err1);

//           const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
//           if (!latestShare) {
//             patient.medications = [];
//             return resolve(patient);
//           }

//           const shareTime = latestShare.createtime;

//           const medSql = `
//             SELECT DISTINCT a.medicine_id, a.medicine_name
//             FROM medication_master m
//             JOIN medicine_master a ON a.medicine_id = m.medicine_id
//             JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//             WHERE m.user_id = ? 
//               AND m.delete_flag = 0 
//               AND tm.delete_flag = 0 
//               AND m.createtime <= ?
//             ORDER BY a.medicine_name ASC
//           `;

//           connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//             if (err2) return reject(err2);

//             patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
//             resolve(patient);
//           });
//         });
//       }));

//       Promise.all(promises)
//         .then(finalPatients => {

//           const medicineCountMap = {};
//           finalPatients.forEach(p => {
//             p.medications.forEach(med => {
//               if (!medicineCountMap[med.name]) medicineCountMap[med.name] = 0;
//               medicineCountMap[med.name] += 1;
//             });
//           });

//           const matchedPatients = finalPatients.length;

//           const summary = Object.keys(medicineCountMap).map(name => ({
//             medicine_name: name,
//             patient_count: medicineCountMap[name],
//             percent_matched: matchedPatients
//               ? ((medicineCountMap[name] / matchedPatients) * 100).toFixed(2)
//               : "0.00",
//             percent_total: totalAllPatients
//               ? ((medicineCountMap[name] / totalAllPatients) * 100).toFixed(2)
//               : "0.00"
//           }));

          
//           const sortedSummary = summary.sort((a, b) => b.patient_count - a.patient_count);
//           const paginatedSummary = sortedSummary.slice(offset, offset + Number(limit));

//           const graph = sortedSummary.slice(0, 10).map(d => ({
//             name: d.medicine_name,
//             count: d.patient_count
//           }));

//           return res.json({
//             success: true,
//             total_patients: totalAllPatients,
//             matched_patients: matchedPatients,
//             summary: paginatedSummary, 
//             graph,
//             drilldown: finalPatients
//           });
//         })
//         .catch(err => res.json({ success: false, msg: err.message }));
//     });
//   });
// };
const getDiseaseMedicineSummary = (req, res) => {
  const { doctor_id, gender, age_group, singleOnly = false, combinedOnly = false, includeExtra = false, disease = [], medication_name, page = 1, limit = 10 } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
  let params = [doctor_id];
  const offset = (page - 1) * limit;

  if (gender !== undefined && gender !== null && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

  const isFilterApplied =
    (Array.isArray(disease) && disease.length > 0) ||
    singleOnly ||
    combinedOnly ||
    (medication_name && medication_name.trim() !== "");

  if (Array.isArray(disease) && disease.length > 0) {

    const countCondition = `
      (
        LENGTH(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', '')) 
        - LENGTH(REPLACE(REPLACE(REPLACE(u.diseases, '\n', ','), ' ', ''), 'name:', ''))
      ) / LENGTH('name:')
    `;

    if (disease.length === 1 && singleOnly) {
      where += ` AND u.diseases LIKE ?`;
      params.push(`%${disease[0]}%`);
      where += ` AND ${countCondition} = 1`;
    }

    else if (combinedOnly && disease.length >= 2) {
      const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
      where += ` AND (${diseaseConditions})`;
      disease.forEach(d => params.push(`%${d}%`));
      where += ` AND ${countCondition} = ?`;
      params.push(disease.length);
    }
    else if (includeExtra && disease.length >= 2) {
      const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
      where += ` AND (${diseaseConditions})`;
      disease.forEach(d => params.push(`%${d}%`));
    }

    else {
      const diseaseConditions = disease.map(() => `u.diseases LIKE ?`).join(" OR ");
      where += ` AND (${diseaseConditions})`;
      disease.forEach(d => params.push(`%${d}%`));
    }
  }

  const totalAllSql = `
    SELECT COUNT(DISTINCT user_id) as total
    FROM patient_master
    WHERE doctor_id = ? AND delete_flag = 0
  `;

  const sql = `
    SELECT 
      u.user_id,
      u.name
    FROM patient_master p
    JOIN user_master u ON u.user_id = p.user_id
    ${where}
    GROUP BY p.user_id
    ORDER BY u.name ASC
  `;

  connection.query(totalAllSql, [doctor_id], (err0, totalAllRes) => {
    if (err0) return res.json({ success: false, msg: "Error" });

    const totalAllPatients = totalAllRes[0].total;

    connection.query(sql, params, (err, patients) => {
      if (err) return res.json({ success: false, msg: "Error" });

      const promises = patients.map(patient => new Promise((resolve, reject) => {
        const checkShare = `
          SELECT report_share_id, information_type, createtime 
          FROM report_share_master 
          WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
          ORDER BY createtime DESC
        `;

        connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
          if (err1) return reject(err1);

          const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));
          if (!latestShare) {
            patient.medications = [];
            return resolve(patient);
          }

          const shareTime = latestShare.createtime;

          const medSql = `
            SELECT DISTINCT a.medicine_id, a.medicine_name
            FROM medication_master m
            JOIN medicine_master a ON a.medicine_id = m.medicine_id
            JOIN time_slots_master tm ON tm.medication_id = m.medication_id
            WHERE m.user_id = ? 
              AND m.delete_flag = 0 
              AND tm.delete_flag = 0 
              AND m.createtime <= ?
            ORDER BY a.medicine_name ASC
          `;

          connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
            if (err2) return reject(err2);

            patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
            resolve(patient);
          });
        });
      }));

      Promise.all(promises)
        .then(finalPatients => {

          let filteredPatients = finalPatients;

          if (medication_name && medication_name.trim() !== "") {
            filteredPatients = finalPatients.filter(p =>
              p.medications.some(m =>
                m.name.toLowerCase().includes(medication_name.toLowerCase())
              )
            );
          }

          const medicineCountMap = {};
          filteredPatients.forEach(p => {
            p.medications.forEach(med => {
              if (!medicineCountMap[med.name]) medicineCountMap[med.name] = 0;
              medicineCountMap[med.name] += 1;
            });
          });

          const matchedPatients = isFilterApplied
            ? filteredPatients.length
            : totalAllPatients;

          const summary = Object.keys(medicineCountMap).map(name => ({
            medicine_name: name,
            patient_count: medicineCountMap[name],
            percent_matched: matchedPatients
              ? ((medicineCountMap[name] / matchedPatients) * 100).toFixed(2)
              : "0.00",
            percent_total: totalAllPatients
              ? ((medicineCountMap[name] / totalAllPatients) * 100).toFixed(2)
              : "0.00"
          }));

          const sortedSummary = summary.sort((a, b) => b.patient_count - a.patient_count);
          const paginatedSummary = sortedSummary.slice(offset, offset + Number(limit));

          const graph = sortedSummary.slice(0, 10).map(d => ({
            name: d.medicine_name,
            count: d.patient_count
          }));

          const paginatedPatients = filteredPatients.slice(offset, offset + Number(limit));

          return res.json({
            success: true,
            total_patients: totalAllPatients,
            matched_patients: matchedPatients,
            summary: paginatedSummary,
            graph,
            drilldown: paginatedPatients
          });
        })
        .catch(err => res.json({ success: false, msg: err.message }));
    });
  });
};
const getDiseaseMedicineAnalyticsMerged = (req, res) => {
  const {
    doctor_id,
    gender,
    age_group,
    disease = [],
    medication = [],
    medication_name = "",
    exclude_medication = [],
    singleOnly = false,
    combinedOnly = false,
    includeExtra = false,
    page = 1,
    limit = 10,
    therapy_page = 1,
    therapy_limit = 10,
    drilldown_page = 1,
    drilldown_limit = 10,
  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  const offset = (Number(page) - 1) * Number(limit);
  const therapyOffset = (Number(therapy_page) - 1) * Number(therapy_limit);
  const drilldownOffset = (Number(drilldown_page) - 1) * Number(drilldown_limit);

  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
  let params = [doctor_id];

  if (gender !== undefined && gender !== null && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

  if (Array.isArray(disease) && disease.length > 0) {
    if (singleOnly && disease.length === 1) {
      where += ` AND u.diseases LIKE ?`;
      params.push(`%${disease[0]}%`);
    } else if (combinedOnly && disease.length >= 2) {
      const conditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
      where += ` AND (${conditions})`;
      disease.forEach(d => params.push(`%${d}%`));
    } else if (includeExtra && disease.length >= 2) {
      const conditions = disease.map(() => `u.diseases LIKE ?`).join(" AND ");
      where += ` AND (${conditions})`;
      disease.forEach(d => params.push(`%${d}%`));
    } else {
      const conditions = disease.map(() => `u.diseases LIKE ?`).join(" OR ");
      where += ` AND (${conditions})`;
      disease.forEach(d => params.push(`%${d}%`));
    }
  }

  const totalSql = `
    SELECT COUNT(DISTINCT p.user_id) AS total
    FROM patient_master p
    WHERE p.doctor_id = ? AND p.delete_flag = 0
  `;

  const patientSql = `
    SELECT DISTINCT u.user_id, u.name, u.diseases,
    IFNULL(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), 0) AS age,
    u.gender
    FROM patient_master p
    JOIN user_master u ON u.user_id = p.user_id
    ${where}
    GROUP BY u.user_id, u.name, u.diseases
    ORDER BY u.name ASC
  `;

  connection.query(totalSql, [doctor_id], (err0, totalRes) => {
    if (err0) return res.json({ success: false, msg: "Total query failed" });

    const totalAllPatients = totalRes[0].total;

    connection.query(patientSql, params, (errP, patients) => {
      if (errP) return res.json({ success: false, msg: "Patient query failed" });

      const promises = patients.map(patient => new Promise((resolve, reject) => {
        let parsedDiseases = [];
        try {
          const parsed = JSON.parse(patient.diseases);
          parsedDiseases = Array.isArray(parsed)
            ? parsed.map(d => d?.name).filter(Boolean)
            : [];
        } catch {
          const matches = patient.diseases?.match(/name:\s*([^,}\n]+)/g) || [];
          parsedDiseases = matches.map(m => m.split(":")[1]?.trim()).filter(Boolean);
        }

        patient.diseases = parsedDiseases;
        patient.age = patient.age ?? 0;
        patient.gender =
          patient.gender == 1 ? "Male" :
          patient.gender == 2 ? "Female" :
          patient.gender == 3 ? "Other" :
          "Not Specified";

        const shareSql = `
          SELECT information_type, createtime
          FROM report_share_master
          WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
          ORDER BY createtime DESC
        `;

        connection.query(shareSql, [patient.user_id, doctor_id], (err1, shareList) => {
          if (err1) return reject(err1);

          const latest = shareList.find(r =>
            r.information_type.split(",").includes("1")
          );

          if (!latest) {
            patient.medications = [];
            return resolve(patient);
          }

          const medSql = `
            SELECT DISTINCT a.medicine_id, a.medicine_name
            FROM medication_master m
            JOIN medicine_master a ON a.medicine_id = m.medicine_id
            JOIN time_slots_master tm ON tm.medication_id = m.medication_id
            WHERE m.user_id = ?
              AND m.delete_flag = 0
              AND tm.delete_flag = 0
              AND m.createtime <= ?
            ORDER BY a.medicine_name ASC
          `;

          connection.query(medSql, [patient.user_id, latest.createtime], (err2, meds) => {
            if (err2) return reject(err2);
            patient.medications = meds.map(m => m.medicine_name);
            resolve(patient);
          });
        });
      }));

      Promise.all(promises)
        .then(enriched => {
          let filteredPatients = enriched;

          // ── STEP 1: medication_name search ──
          if (medication_name && medication_name.trim() !== "") {
            filteredPatients = filteredPatients.filter(p =>
              p.medications.some(m =>
                m.toLowerCase().includes(medication_name.toLowerCase())
              )
            );
          }

          // ── STEP 2: medication[] filter ──
          if (Array.isArray(medication) && medication.length > 0) {
            const selectedMeds = medication.map(m => m.toLowerCase().trim());
            filteredPatients = filteredPatients.filter(p =>
              p.medications.some(m =>
                selectedMeds.some(sel =>
                  m.toLowerCase().replace(/\s/g, "").includes(sel.replace(/\s/g, ""))
                )
              )
            );
          }

          // ── STEP 3: disease filter ──
          if (Array.isArray(disease) && disease.length > 0) {
            const selected = disease.map(d => d.toLowerCase().trim());

            if (singleOnly && disease.length === 1) {
              filteredPatients = filteredPatients.filter(p => {
                const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
                return dis.length === 1 && selected.includes(dis[0]);
              });
            } else if (combinedOnly && disease.length >= 2) {
              filteredPatients = filteredPatients.filter(p => {
                const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
                return (
                  dis.length === selected.length &&
                  selected.every(d => dis.includes(d))
                );
              });
            } else if (includeExtra && disease.length >= 2) {
              filteredPatients = filteredPatients.filter(p => {
                const dis = (p.diseases || []).map(d => d.toLowerCase().trim());
                return selected.every(d => dis.includes(d));
              });
            } else {
              filteredPatients = filteredPatients.filter(p =>
                (p.diseases || []).some(d =>
                  selected.includes(d.toLowerCase().trim())
                )
              );
            }
          }

          const matchedCount = filteredPatients.length;

          // ── STEP 4: drug distribution (individual medicines) ──
          const map = {};
          filteredPatients.forEach(p => {
            p.medications.forEach(med => {
              map[med] = (map[med] || 0) + 1;
            });
          });

          let summary = Object.keys(map).map(name => ({
            medicine_name: name,
            patient_count: map[name],
            percent_matched: matchedCount
              ? ((map[name] / matchedCount) * 100).toFixed(2)
              : "0.00",
            percent_total: totalAllPatients
              ? ((map[name] / totalAllPatients) * 100).toFixed(2)
              : "0.00"
          }));

          summary.sort((a, b) => b.patient_count - a.patient_count);

          // ── STEP 4b: therapy distribution (combo per patient) ──
          const therapyMap = {};
          filteredPatients.forEach(p => {
            const combo = p.medications.length > 0
              ? [...p.medications].sort().join(", ")
              : "No Medication";
            therapyMap[combo] = (therapyMap[combo] || 0) + 1;
          });

          const allTherapy = Object.entries(therapyMap)
            .sort((a, b) => b[1] - a[1])
            .map(([combo, count]) => ({
              medicine_name: combo,
              patient_count: count,
              percent_matched: matchedCount
                ? ((count / matchedCount) * 100).toFixed(2)
                : "0.00",
              percent_total: totalAllPatients
                ? ((count / totalAllPatients) * 100).toFixed(2)
                : "0.00"
            }));

          // ── STEP 5: exclude_medication ──
          const excludeSet = new Set(
            (exclude_medication || []).map(m => m.toLowerCase().trim())
          );

          const top_drug = summary.find(
            s => !excludeSet.has(s.medicine_name.toLowerCase().trim())
          )?.medicine_name || "";

          if (excludeSet.size > 0) {
            summary = summary.filter(
              s => !excludeSet.has(s.medicine_name.toLowerCase().trim())
            );
          }

          // ── STEP 6: separate pagination for all three ──
          const graph = summary.slice(0, 10).map(d => ({
            name: d.medicine_name,
            count: d.patient_count
          }));

          const paginatedSummary = summary.slice(offset, offset + Number(limit));
          const paginatedTherapy = allTherapy.slice(therapyOffset, therapyOffset + Number(therapy_limit));
          const paginatedDrilldown = filteredPatients.slice(drilldownOffset, drilldownOffset + Number(drilldown_limit));

          return res.json({
            success: true,
            total_patients: totalAllPatients,
            matched_patients: matchedCount,
            percentage: totalAllPatients
              ? ((matchedCount / totalAllPatients) * 100).toFixed(2) + "%"
              : "0%",
            top_drug,
            // Drug Distribution
            summary: paginatedSummary,
            summary_total: summary.length,
            // Therapy Distribution
            therapy_distribution: paginatedTherapy,
            therapy_total: allTherapy.length,
            // Drilldown
            drilldown: paginatedDrilldown,
            graph,
          });
        })
        .catch(err => res.json({ success: false, msg: err.message }));
    });
  });
};

// //  Patient Details (Filtered)
// const getPatientMedicationDemographicsDetails = (req, res) => {
//   const { doctor_id, gender, age_group, medication = [], search } = req.body;

//   if (!doctor_id) return res.json({ success: false, msg: "doctor_id required" });

//   let where = `
//     WHERE pm.doctor_id = ? AND pm.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()
//   `;
//   let params = [doctor_id];

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += " AND u.gender = ?";
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?";
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?";
//       params.push(min, max);
//     }
//   }

//   if (medication.length) {
//     where += ` AND (` + medication.map(() => `REPLACE(LOWER(med.medicine_name), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`).join(" OR ") + `)`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   if (search) {
//     where += " AND u.name LIKE ?";
//     params.push(`%${search}%`);
//   }

//   const sql = `
//     SELECT 
//       u.user_id,
//       u.name,
//       TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//       CASE WHEN u.gender = 1 THEN 'Male' WHEN u.gender = 2 THEN 'Female' ELSE 'Other' END as gender,
//       GROUP_CONCAT(DISTINCT med.medicine_name) as medications
//     FROM patient_master pm
//     JOIN user_master u ON u.user_id = pm.user_id
//     LEFT JOIN medication_master m ON m.user_id = u.user_id
//     LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//     ${where}
//     GROUP BY pm.user_id
//     ORDER BY u.name ASC
//   `;

//   connection.query(sql, params, (err, rows) => {
//     if (err) return res.json({ success: false, error: err.message });

//     return res.json({
//       success: true,
//       total: rows.length,
//       patients: rows
//     });
//   });
// };

// // Medication Summary / Analytics
// const getPatientMedicationSummary = (req, res) => {
//   const { doctor_id, gender, age_group, medication = [] } = req.body;

//   if (!doctor_id) return res.json({ success: false, msg: "doctor_id required" });

//   let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += " AND u.gender = ?";
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?";
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += " AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?";
//       params.push(min, max);
//     }
//   }

//   if (medication.length) {
//     where += ` AND (` + medication.map(() => `REPLACE(LOWER(med.medicine_name), ' ', '') LIKE REPLACE(LOWER(?), ' ', '')`).join(" OR ") + `)`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   // Total patients
//   const totalSql = `
//     SELECT COUNT(DISTINCT pm.user_id) as total
//     FROM patient_master pm
//     JOIN user_master u ON u.user_id = pm.user_id
//     LEFT JOIN medication_master m ON m.user_id = u.user_id
//     LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//     ${where}
//   `;

//   connection.query(totalSql, params, (err, totalResult) => {
//     if (err) return res.json({ success: false, error: err.message });

//     const totalPatients = totalResult[0]?.total || 0;

//     // Summary per medicine
//     const summarySql = `
//       SELECT med.medicine_name, COUNT(DISTINCT pm.user_id) as patient_count
//       FROM patient_master pm
//       JOIN user_master u ON u.user_id = pm.user_id
//       LEFT JOIN medication_master m ON m.user_id = u.user_id
//       LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//       ${where} AND med.medicine_name IS NOT NULL
//       GROUP BY med.medicine_name
//       ORDER BY patient_count DESC
//     `;

//     connection.query(summarySql, params, (err, summaryResult) => {
//       if (err) return res.json({ success: false, error: err.message });

//       const summary = summaryResult.map(r => ({
//         medicine_name: r.medicine_name,
//         patient_count: r.patient_count,
//         percentage: totalPatients ? ((r.patient_count / totalPatients) * 100).toFixed(2) + "%" : "0.00%"
//       }));

//       const graph = summary.map(r => ({ name: r.medicine_name, count: r.patient_count }));

//       // Drilldown: patient names
//       const drilldownSql = `
//         SELECT pm.user_id, u.name, med.medicine_name
//         FROM patient_master pm
//         JOIN user_master u ON u.user_id = pm.user_id
//         LEFT JOIN medication_master m ON m.user_id = u.user_id
//         LEFT JOIN medicine_master med ON med.medicine_id = m.medicine_id
//         ${where} AND med.medicine_name IS NOT NULL
//       `;

//       connection.query(drilldownSql, params, (err, drillRows) => {
//         if (err) return res.json({ success: false, error: err.message });

//         return res.json({
//           success: true,
//           total_patients: totalPatients,
//           summary,
//           graph,
//           drilldown: drillRows
//         });
//       });
//     });
//   });
// };
    //  3 A)




// const getSubadminMedicationFull = (req, res) => {
//   let {
//     doctor_id,
//     gender,
//     age_group,
//     medication = [],
//     medicine_name,
//     search,
//     summary_page = 1,
//     summary_limit = 10,
//     patient_page = 1,
//     patient_limit = 10
//   } = req.body;

//   if (!doctor_id) return res.json({ success: false, msg: "doctor_id required" });

//   if ((!medication || medication.length === 0) && medicine_name) {
//     medication = [medicine_name];
//   }

//   let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];

//   const summaryOffset = (summary_page - 1) * summary_limit;
//   const patientOffset = (patient_page - 1) * patient_limit;

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (search) {
//     where += ` AND u.name LIKE ?`;
//     params.push(`%${search}%`);
//   }

//   const patientSql = `
//     SELECT u.user_id, u.name, TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//       CASE 
//         WHEN u.gender = 1 THEN 'Male'
//         WHEN u.gender = 2 THEN 'Female'
//         WHEN u.gender = 3 THEN 'Other'
//         ELSE 'Not Specified'
//       END as gender,
//       u.diseases
//     FROM patient_master pm
//     JOIN user_master u ON u.user_id = pm.user_id
//     ${where}
//     GROUP BY pm.user_id
//     ORDER BY u.name ASC
//   `;

//   connection.query(patientSql, params, (err, patients) => {
//     if (err) return res.json({ success: false, msg: err.message });

//     if (patients.length === 0) {
//       return res.json({
//         success: true,
//         total_patients: 0,
//         matched_patients: 0,
//         percentage: "0.00%",
//         selected_medication_count: 0,
//         demographics: [],
//         details: [],
//         summary: [],
//         graph: [],
//         drilldown: []
//       });
//     }

//     const promises = patients.map(patient => new Promise((resolve, reject) => {

//       let parsedDiseases = [];

//       if (patient.diseases && typeof patient.diseases === "string") {
//         parsedDiseases = patient.diseases.split("},").map(d => {
//           try {
//             const clean = d.replace("{", "").replace("}", "");
//             const parts = clean.split(",");
//             let obj = {};
//             parts.forEach(p => {
//               const [key, val] = p.split(":");
//               obj[key.trim()] = val.trim();
//             });
//             return obj;
//           } catch {
//             return null;
//           }
//         }).filter(Boolean);
//       }

//       const checkShare = `
//         SELECT report_share_id, information_type, createtime 
//         FROM report_share_master 
//         WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//         ORDER BY createtime DESC
//       `;

//       connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//         if (err1) return reject(err1);

//         const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));

//         if (!latestShare) {
//           patient.medications = [];
//           return resolve({ ...patient, diseases: parsedDiseases });
//         }

//         const shareTime = latestShare.createtime;

//         const medSql = `
//           SELECT DISTINCT a.medicine_id, a.medicine_name
//           FROM medication_master m
//           JOIN medicine_master a ON a.medicine_id = m.medicine_id
//           JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//           WHERE m.user_id = ? 
//             AND m.delete_flag = 0 
//             AND tm.delete_flag = 0 
//             AND m.createtime <= ?
//           ORDER BY a.medicine_name ASC
//         `;

//         connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//           if (err2) return reject(err2);

//           resolve({
//             ...patient,
//             diseases: parsedDiseases,
//             medications: meds.map(m => ({
//               id: m.medicine_id,
//               name: m.medicine_name
//             }))
//           });
//         });
//       });
//     }));

//     Promise.all(promises)
//       .then(finalPatients => {

//         let matchedPatients = finalPatients;

//         if (Array.isArray(medication) && medication.length > 0) {
//           matchedPatients = finalPatients.filter(p =>
//             (p.medications || []).some(m =>
//               medication.some(sel =>
//                 m.name.toLowerCase().includes(sel.toLowerCase())
//               )
//             )
//           );
//         }

//         const totalPatients = finalPatients.length;
//         const matchedCount = matchedPatients.length;

//         const percentage = totalPatients
//           ? ((matchedCount / totalPatients) * 100).toFixed(2) + "%"
//           : "0.00%";

//         // 
//         const totalMedSql = `
//           SELECT COUNT(DISTINCT a.medicine_id) AS total
//           FROM report_share_master r
//           JOIN medication_master m 
//             ON m.user_id = r.user_id 
//             AND m.delete_flag = 0 
//             AND m.createtime <= r.createtime
//           JOIN medicine_master a 
//             ON a.medicine_id = m.medicine_id
//             AND a.delete_flag = 0
//           WHERE r.doctor_id = ?
//             AND r.share_type = 0
//             AND r.delete_flag = 0
//             AND FIND_IN_SET('1', r.information_type)
//         `;

//         connection.query(totalMedSql, [doctor_id], (err2, totalRes) => {
//           if (err2) return res.json({ success: false, msg: err2.message });

//           const selectedMedCount = totalRes[0].total;

          

//           const demoMap = {};
//           finalPatients.forEach(u => {
//             const key = `${u.age}-${u.gender}`;
//             if (!demoMap[key]) demoMap[key] = { age_group: u.age, gender: u.gender, count: 0 };
//             demoMap[key].count += 1;
//           });

//           const demographics = Object.values(demoMap).map(d => ({
//             ...d,
//             percentage: totalPatients ? ((d.count / totalPatients) * 100).toFixed(2) : "0.00"
//           }));

//           const medMap = {};
//           matchedPatients.forEach(u => {
//             (u.medications || []).forEach(m => {
//               if (!medMap[m.name]) medMap[m.name] = 0;
//               medMap[m.name] += 1;
//             });
//           });

//           const summaryArray = Object.keys(medMap).map(name => ({
//             medicine_name: name,
//             patient_count: medMap[name],
//             percentage: totalPatients
//               ? ((medMap[name] / totalPatients) * 100).toFixed(2) + "%"
//               : "0.00%"
//           }));

//           const graph = Object.keys(medMap).map(name => ({
//             name,
//             count: medMap[name]
//           }));

//           const drilldown = [];
//           matchedPatients.forEach(u => {
//             (u.medications || []).forEach(m => {
//               drilldown.push({
//                 user_id: u.user_id,
//                 name: u.name,
//                 medicine_name: m.name
//               });
//             });
//           });

//           return res.json({
//             success: true,
//             total_patients: totalPatients,
//             matched_patients: matchedCount,
//             percentage,
//             selected_medication_count: selectedMedCount, 
//             summary_total: summaryArray.length,
//             patient_total: matchedPatients.length,
//             demographics,
//             details: matchedPatients.slice(patientOffset, patientOffset + Number(patient_limit)),
//             summary: summaryArray.slice(summaryOffset, summaryOffset + Number(summary_limit)),
//             graph,
//             drilldown: drilldown.slice(patientOffset, patientOffset + Number(patient_limit))
//           });
//         });
//       })
//       .catch(err => res.json({ success: false, msg: err.message }));
//   });
// };

// const getSubadminMedicationFull = (req, res) => {
//   let {
//     doctor_id,
//     gender,
//     age_group,
//     medication = [],
//     medicine_name,
//     search,
//      singleOnly = false,
//   combinedOnly = false,
//     summary_page = 1,
//     summary_limit = 10,
//     patient_page = 1,
//     patient_limit = 10
//   } = req.body;

//   if (!doctor_id) return res.json({ success: false, msg: "doctor_id required" });

//   if ((!medication || medication.length === 0) && medicine_name) {
//     medication = [medicine_name];
//   }

//   let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
//   let params = [doctor_id];

//   const summaryOffset = (summary_page - 1) * summary_limit;
//   const patientOffset = (patient_page - 1) * patient_limit;

//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (search) {
//     where += ` AND u.name LIKE ?`;
//     params.push(`%${search}%`);
//   }

//   const patientSql = `
//     SELECT u.user_id, u.name, TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//       CASE 
//         WHEN u.gender = 1 THEN 'Male'
//         WHEN u.gender = 2 THEN 'Female'
//         WHEN u.gender = 3 THEN 'Other'
//         ELSE 'Not Specified'
//       END as gender,
//       u.diseases
//     FROM patient_master pm
//     JOIN user_master u ON u.user_id = pm.user_id
//     ${where}
//     GROUP BY pm.user_id
//     ORDER BY u.name ASC
//   `;

//   connection.query(patientSql, params, (err, patients) => {
//     if (err) return res.json({ success: false, msg: err.message });

//     if (patients.length === 0) {
//       return res.json({
//         success: true,
//         total_patients: 0,
//         matched_patients: 0,
//         percentage: "0.00%",
//         selected_medication_count: 0,
//         demographics: [],
//         details: [],
//         summary: [],
//         graph: [],
//         drilldown: []
//       });
//     }

//     const promises = patients.map(patient => new Promise((resolve, reject) => {

//       let parsedDiseases = [];

//       if (patient.diseases && typeof patient.diseases === "string") {
//         parsedDiseases = patient.diseases.split("},").map(d => {
//           try {
//             const clean = d.replace("{", "").replace("}", "");
//             const parts = clean.split(",");
//             let obj = {};
//             parts.forEach(p => {
//               const [key, val] = p.split(":");
//               obj[key.trim()] = val.trim();
//             });
//             return obj;
//           } catch {
//             return null;
//           }
//         }).filter(Boolean);
//       }

//       const checkShare = `
//         SELECT report_share_id, information_type, createtime 
//         FROM report_share_master 
//         WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//         ORDER BY createtime DESC
//       `;

//       connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//         if (err1) return reject(err1);

//         const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));

//         if (!latestShare) {
//           patient.medications = [];
//           return resolve({ ...patient, diseases: parsedDiseases });
//         }

//         const shareTime = latestShare.createtime;

//         const medSql = `
//           SELECT DISTINCT a.medicine_id, a.medicine_name
//           FROM medication_master m
//           JOIN medicine_master a ON a.medicine_id = m.medicine_id
//           JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//           WHERE m.user_id = ? 
//             AND m.delete_flag = 0 
//             AND tm.delete_flag = 0 
//             AND m.createtime <= ?
//           ORDER BY a.medicine_name ASC
//         `;

//         connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//           if (err2) return reject(err2);

//           resolve({
//             ...patient,
//             diseases: parsedDiseases,
//             medications: meds.map(m => ({
//               id: m.medicine_id,
//               name: m.medicine_name
//             }))
//           });
//         });
//       });
//     }));

//     Promise.all(promises)
//       .then(finalPatients => {

//         let matchedPatients = finalPatients;

//        if (Array.isArray(medication) && medication.length > 0) {

//       const selectedMeds = medication.map(m => m.toLowerCase().trim());

//       // ✅ SINGLE ONLY 
//       if (singleOnly && medication.length === 1) {
//         matchedPatients = finalPatients.filter(p => {
//           const meds = (p.medications || []).map(m => m.name.toLowerCase().trim());
//           return meds.length === 1 && selectedMeds.includes(meds[0]);
//         });
//       }

//       // ✅ COMBINED ONLY 
//       else if (combinedOnly && medication.length >= 2) {
//         matchedPatients = finalPatients.filter(p => {
//           const meds = (p.medications || [])
//             .map(m => m.name.toLowerCase().trim())
//             .sort();

//           return (
//             meds.length === selectedMeds.length &&
//             selectedMeds.every(m => meds.includes(m))
//           );
//         });
//       }

//       // ✅ DEFAULT 
//       else {
//         matchedPatients = finalPatients.filter(p =>
//           (p.medications || []).some(m =>
//             selectedMeds.includes(m.name.toLowerCase().trim())
//           )
//         );
//       }
//     }

//         const totalPatients = finalPatients.length;
//         const matchedCount = matchedPatients.length;

//         const percentage = totalPatients
//           ? ((matchedCount / totalPatients) * 100).toFixed(2) + "%"
//           : "0.00%";

//         // 
//         const totalMedSql = `
//           SELECT COUNT(DISTINCT a.medicine_id) AS total
//           FROM report_share_master r
//           JOIN medication_master m 
//             ON m.user_id = r.user_id 
//             AND m.delete_flag = 0 
//             AND m.createtime <= r.createtime
//           JOIN medicine_master a 
//             ON a.medicine_id = m.medicine_id
//             AND a.delete_flag = 0
//           WHERE r.doctor_id = ?
//             AND r.share_type = 0
//             AND r.delete_flag = 0
//             AND FIND_IN_SET('1', r.information_type)
//         `;

//         connection.query(totalMedSql, [doctor_id], (err2, totalRes) => {
//           if (err2) return res.json({ success: false, msg: err2.message });

//           let selectedMedCount = 0;

//           //
//           if (Array.isArray(medication) && medication.length > 0) {
//             selectedMedCount = medication.length;

//           } else {
            
//             selectedMedCount = totalRes[0].total;
//           }

          

//           const demoMap = {};
//           finalPatients.forEach(u => {
//             const key = `${u.age}-${u.gender}`;
//             if (!demoMap[key]) demoMap[key] = { age_group: u.age, gender: u.gender, count: 0 };
//             demoMap[key].count += 1;
//           });

//           const demographics = Object.values(demoMap).map(d => ({
//             ...d,
//             percentage: totalPatients ? ((d.count / totalPatients) * 100).toFixed(2) : "0.00"
//           }));

//           // const medMap = {};
//           // matchedPatients.forEach(u => {
//           //   (u.medications || []).forEach(m => {
//           //     if (!medMap[m.name]) medMap[m.name] = 0;
//           //     medMap[m.name] += 1;
//           //   });
//           // });
//           const medMap = {};

//         matchedPatients.forEach(u => {
//           const meds = (u.medications || [])
//             .map(m => m.name.trim())
//             .sort(); // important for same combo

//           const key = meds.length ? meds.join(",") : "No Medication";

//           if (!medMap[key]) medMap[key] = 0;
//           medMap[key] += 1;
//         });

//           const summaryArray = Object.keys(medMap).map(name => ({
//             medicine_name: name,
//             patient_count: medMap[name],
//             percentage: totalPatients
//               ? ((medMap[name] / totalPatients) * 100).toFixed(2) + "%"
//               : "0.00%"
//           }))
//           .sort((a, b) => b.patient_count - a.patient_count);;

//           const graph = Object.keys(medMap).map(name => ({
//             name,
//             count: medMap[name]
//           }));

//           const drilldown = [];
//           matchedPatients.forEach(u => {
//             (u.medications || []).forEach(m => {
//               drilldown.push({
//                 user_id: u.user_id,
//                 name: u.name,
//                 medicine_name: m.name
//               });
//             });
//           });

//           return res.json({
//             success: true,
//             total_patients: totalPatients,
//             matched_patients: matchedCount,
//             percentage,
//             selected_medication_count: selectedMedCount, 
//             summary_total: summaryArray.length,
//             patient_total: matchedPatients.length,
//             demographics,
//             details: matchedPatients.slice(patientOffset, patientOffset + Number(patient_limit)),
//             summary: summaryArray.slice(summaryOffset, summaryOffset + Number(summary_limit)),
//             graph,
//             drilldown: drilldown.slice(patientOffset, patientOffset + Number(patient_limit))
//           });
//         });
//       })
//       .catch(err => res.json({ success: false, msg: err.message }));
//   });
// };

const getSubadminMedicationFull = (req, res) => {
  let {
    doctor_id,
    gender,
    age_group,
    medication = [],
    medicine_name,
    search,
    singleOnly = false,
    combinedOnly = false,
    includeExtra = false,
    summary_page = 1,
    summary_limit = 10,
    therapy_page = 1,
    therapy_limit = 10,
    patient_page = 1,
    patient_limit = 10,
  } = req.body;

  if (!doctor_id) return res.json({ success: false, msg: "doctor_id required" });

  if ((!medication || medication.length === 0) && medicine_name) {
    medication = [medicine_name];
  }

  let where = `WHERE pm.doctor_id = ? AND pm.delete_flag = 0 AND u.dob IS NOT NULL AND u.dob <= CURDATE()`;
  let params = [doctor_id];

  const summaryOffset = (Number(summary_page) - 1) * Number(summary_limit);
  const therapyOffset = (Number(therapy_page) - 1) * Number(therapy_limit);
  const patientOffset = (Number(patient_page) - 1) * Number(patient_limit);

  if (gender !== undefined && gender !== null && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group.replace("+", ""));
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-").map(Number);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

  if (search) {
    where += ` AND u.name LIKE ?`;
    params.push(`%${search}%`);
  }

  const patientSql = `
    SELECT u.user_id, u.name, TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
      CASE 
        WHEN u.gender = 1 THEN 'Male'
        WHEN u.gender = 2 THEN 'Female'
        WHEN u.gender = 3 THEN 'Other'
        ELSE 'Not Specified'
      END as gender,
      u.diseases
    FROM patient_master pm
    JOIN user_master u ON u.user_id = pm.user_id
    ${where}
    GROUP BY pm.user_id
    ORDER BY u.name ASC
  `;

  connection.query(patientSql, params, (err, patients) => {
    if (err) return res.json({ success: false, msg: err.message });

    if (patients.length === 0) {
      return res.json({
        success: true,
        total_patients: 0,
        matched_patients: 0,
        percentage: "0.00%",
        selected_medication_count: 0,
        demographics: [],
        details: [],
        // Drug Distribution (individual)
        summary: [],
        summary_total: 0,
        // Therapy Distribution (combos)
        therapy_distribution: [],
        therapy_total: 0,
        graph: [],
        patient_total: 0,
      });
    }

    const promises = patients.map(patient => new Promise((resolve, reject) => {
      let parsedDiseases = [];

      if (patient.diseases && typeof patient.diseases === "string") {
        parsedDiseases = patient.diseases.split("},").map(d => {
          try {
            const clean = d.replace("{", "").replace("}", "");
            const parts = clean.split(",");
            let obj = {};
            parts.forEach(p => {
              const [key, val] = p.split(":");
              obj[key.trim()] = val?.trim();
            });
            return obj;
          } catch { return null; }
        }).filter(Boolean);
      }

      const checkShare = `
        SELECT report_share_id, information_type, createtime 
        FROM report_share_master 
        WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
        ORDER BY createtime DESC
      `;

      connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
        if (err1) return reject(err1);

        const latestShare = shareList.find(r => r.information_type.split(",").includes("1"));

        if (!latestShare) {
          patient.medications = [];
          return resolve({ ...patient, diseases: parsedDiseases });
        }

        const shareTime = latestShare.createtime;

        const medSql = `
          SELECT DISTINCT a.medicine_id, a.medicine_name
          FROM medication_master m
          JOIN medicine_master a ON a.medicine_id = m.medicine_id
          JOIN time_slots_master tm ON tm.medication_id = m.medication_id
          WHERE m.user_id = ? 
            AND m.delete_flag = 0 
            AND tm.delete_flag = 0 
            AND m.createtime <= ?
          ORDER BY a.medicine_name ASC
        `;

        connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
          if (err2) return reject(err2);
          resolve({
            ...patient,
            diseases: parsedDiseases,
            medications: meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }))
          });
        });
      });
    }));

    Promise.all(promises)
      .then(finalPatients => {
        let matchedPatients = finalPatients;

        if (Array.isArray(medication) && medication.length > 0) {
          const selectedMeds = medication.map(m => m.toLowerCase().trim());

          if (singleOnly && medication.length === 1) {
            matchedPatients = finalPatients.filter(p => {
              const meds = (p.medications || []).map(m => m.name.toLowerCase().trim());
              return meds.length === 1 && selectedMeds.includes(meds[0]);
            });
          } else if (combinedOnly && medication.length >= 2) {
            matchedPatients = finalPatients.filter(p => {
              const meds = (p.medications || []).map(m => m.name.toLowerCase().trim()).sort();
              return meds.length === selectedMeds.length && selectedMeds.every(m => meds.includes(m));
            });
          } else if (includeExtra && medication.length >= 2) {
            matchedPatients = finalPatients.filter(p => {
              const meds = (p.medications || []).map(m => m.name.toLowerCase().trim());
              return selectedMeds.every(m => meds.includes(m));
            });
          } else {
            matchedPatients = finalPatients.filter(p =>
              (p.medications || []).some(m => selectedMeds.includes(m.name.toLowerCase().trim()))
            );
          }
        }

        const totalPatients = finalPatients.length;
        const matchedCount = matchedPatients.length;
        const percentage = totalPatients
          ? ((matchedCount / totalPatients) * 100).toFixed(2) + "%"
          : "0.00%";

        const totalMedSql = `
          SELECT COUNT(DISTINCT a.medicine_id) AS total
          FROM report_share_master r
          JOIN medication_master m 
            ON m.user_id = r.user_id 
            AND m.delete_flag = 0 
            AND m.createtime <= r.createtime
          JOIN medicine_master a 
            ON a.medicine_id = m.medicine_id
            AND a.delete_flag = 0
          WHERE r.doctor_id = ?
            AND r.share_type = 0
            AND r.delete_flag = 0
            AND FIND_IN_SET('1', r.information_type)
        `;

        connection.query(totalMedSql, [doctor_id], (err2, totalRes) => {
          if (err2) return res.json({ success: false, msg: err2.message });

          const selectedMedCount = Array.isArray(medication) && medication.length > 0
            ? medication.length
            : totalRes[0].total;

          // ── Demographics ──
          const getAgeGroup = (age) => {
            if (age <= 18) return "0-18";
            if (age <= 30) return "19-30";
            if (age <= 44) return "31-44";
            if (age <= 64) return "45-64";
            if (age <= 74) return "65-74";
            if (age <= 84) return "75-84";
            return "85+";
          };

          const demoMap = {};
          matchedPatients.forEach(u => {
            const ageGroup = getAgeGroup(u.age);
            const key = `${ageGroup}-${u.gender}`;
            if (!demoMap[key]) demoMap[key] = { age_group: ageGroup, gender: u.gender, count: 0 };
            demoMap[key].count += 1;
          });

          const demographics = Object.values(demoMap).map(d => ({
            ...d,
            percentage: totalPatients ? ((d.count / totalPatients) * 100).toFixed(2) : "0.00"
          }));

          // ── Drug Distribution (individual medicines) ──
          const drugMap = {};
          matchedPatients.forEach(u => {
            (u.medications || []).forEach(m => {
              const name = m.name.trim();
              drugMap[name] = (drugMap[name] || 0) + 1;
            });
          });

          const allDrugSummary = Object.keys(drugMap)
            .map(name => ({
              medicine_name: name,
              patient_count: drugMap[name],
              percentage: matchedCount
                ? ((drugMap[name] / matchedCount) * 100).toFixed(2) + "%"
                : "0.00%",
            }))
            .sort((a, b) => b.patient_count - a.patient_count);

          // ── Therapy Distribution (combos per patient) ──
          const therapyMap = {};
          matchedPatients.forEach(u => {
            const meds = (u.medications || []).map(m => m.name.trim()).sort();
            const combo = meds.length > 0 ? meds.join(", ") : "No Medication";
            therapyMap[combo] = (therapyMap[combo] || 0) + 1;
          });

          const allTherapySummary = Object.entries(therapyMap)
            .sort((a, b) => b[1] - a[1])
            .map(([combo, count]) => ({
              medicine_name: combo,
              patient_count: count,
              percentage: matchedCount
                ? ((count / matchedCount) * 100).toFixed(2) + "%"
                : "0.00%",
            }));

          const graph = allDrugSummary.slice(0, 10).map(d => ({
            name: d.medicine_name,
            count: d.patient_count
          }));

          return res.json({
            success: true,
            total_patients: totalPatients,
            matched_patients: matchedCount,
            percentage,
            selected_medication_count: selectedMedCount,
            demographics,
            // Drug Distribution (individual) — paginated
            summary: allDrugSummary.slice(summaryOffset, summaryOffset + Number(summary_limit)),
            summary_total: allDrugSummary.length,
            // Therapy Distribution (combos) — paginated
            therapy_distribution: allTherapySummary.slice(therapyOffset, therapyOffset + Number(therapy_limit)),
            therapy_total: allTherapySummary.length,
            // Patients — paginated
            details: matchedPatients.slice(patientOffset, patientOffset + Number(patient_limit)),
            patient_total: matchedCount,
            graph,
          });
        });
      })
      .catch(err => res.json({ success: false, msg: err.message }));
  });
};
// 3 B)

// const getMedicationDiseaseDashboard = (req, res) => {
//   const {
//     doctor_id,
//     medication = [],
//     age_group,
//     gender,
//     exclude_disease = [],
//     page = 1,
//     limit = 10
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;
//   // gender filter
//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   // age filter
//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-");
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   // medication filter (MULTIPLE)
//   if (medication.length) {
//     where += ` AND med.medicine_name IN (${medication.map(() => '?').join(",")})`;
//     params.push(...medication);
//   }

//   // total patients (doctor only)
//   const totalSql = `
//     SELECT COUNT(DISTINCT user_id) as total
//     FROM patient_master
//     WHERE doctor_id = ? AND delete_flag = 0
//   `;

//   connection.query(totalSql, [doctor_id], (err, totalRes) => {
//     const totalPatients = totalRes[0].total;

//     // matched patients
//     const matchSql = `
//       SELECT DISTINCT p.user_id, u.diseases
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       LEFT JOIN medicine_master med ON med.user_id = u.user_id
//       ${where}
//     `;

//     connection.query(matchSql, params, (err, matchRows) => {

//       const matchedPatients = matchRows.length;

//       let diseaseMap = {};

//       matchRows.forEach(row => {
//         if (!row.diseases) return;

//         // split multiple diseases
//         const parts = row.diseases.split("},");
//         parts.forEach(d => {
//           const match = d.match(/name:\s*([^,}]+)/);
//           if (match) {
//             const name = match[1].trim();

//             // exclude filter
//             if (exclude_disease.includes(name)) return;

//             if (!diseaseMap[name]) {
//               diseaseMap[name] = 0;
//             }
//             diseaseMap[name]++;
//           }
//         });
//       });

//       // convert to array
//       const disease_distribution = Object.keys(diseaseMap).map(name => ({
//         disease: name,
//         patient_count: diseaseMap[name],
//         percent_matched: matchedPatients
//           ? ((diseaseMap[name] / matchedPatients) * 100).toFixed(2)
//           : "0.00",
//         percent_total: totalPatients
//           ? ((diseaseMap[name] / totalPatients) * 100).toFixed(2)
//           : "0.00"
//       }));

//       // top disease
//       let top_disease = "";
//       let max = 0;
//       disease_distribution.forEach(d => {
//         if (d.patient_count > max) {
//           max = d.patient_count;
//           top_disease = d.disease;
//         }
//       });

//       // patient table
//       const patientSql = `
//         SELECT 
//           u.name,
//           TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//           CASE 
//             WHEN u.gender = 1 THEN 'Male'
//             WHEN u.gender = 2 THEN 'Female'
//              WHEN u.gender = 3 THEN 'Other'
//               ELSE 'Not Specified'
//           END as gender,
//           u.diseases,
//           GROUP_CONCAT(DISTINCT med.medicine_name) as medications
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         LEFT JOIN medicine_master med ON med.user_id = u.user_id
//         ${where}
//         GROUP BY p.user_id
//         ORDER BY u.name ASC
//         LIMIT ? OFFSET ?
//       `;

//       connection.query(patientSql, [...params, Number(limit), Number(offset)], (err, patientRows) => {

//         return res.json({
//           success: true,
//           total_patients: totalPatients,
//           matched_patients: matchedPatients,
//           unique_diseases: Object.keys(diseaseMap).length,
//           top_disease,
//           disease_distribution,
//           patients: patientRows
//         });

//       });
//     });
//   });
// };
// const getMedicationDiseaseDashboard = (req, res) => {
//   const {
//     doctor_id,
//     medication = [],
//     age_group,
//     gender,
//     exclude_disease = [],
//     page = 1,
//     limit = 10
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [doctor_id];
//   const offset = (page - 1) * limit;

//   // gender filter
//   if (gender !== undefined && gender !== null && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

//   // age filter
//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-");
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   // total patients (doctor only)
//   const totalSql = `
//     SELECT COUNT(DISTINCT user_id) as total
//     FROM patient_master
//     WHERE doctor_id = ? AND delete_flag = 0
//   `;

//   connection.query(totalSql, [doctor_id], (err, totalRes) => {
//     const totalPatients = totalRes[0].total;

//     // matched patients
//     const matchSql = `
//       SELECT DISTINCT p.user_id, u.diseases
//       FROM patient_master p
//       JOIN user_master u ON u.user_id = p.user_id
//       ${where}
//     `;

//     connection.query(matchSql, params, (err, matchRows) => {

//       const matchedPatients = matchRows.length;

//       let diseaseMap = {};

//       matchRows.forEach(row => {
//         if (!row.diseases) return;

//         // split multiple diseases
//         const parts = row.diseases.split("},");
//         parts.forEach(d => {
//           const match = d.match(/name:\s*([^,}]+)/);
//           if (match) {
//             const name = match[1].trim();

//             // exclude filter
//             if (exclude_disease.includes(name)) return;

//             if (!diseaseMap[name]) {
//               diseaseMap[name] = 0;
//             }
//             diseaseMap[name]++;
//           }
//         });
//       });

//       // convert to array
//       const disease_distribution = Object.keys(diseaseMap).map(name => ({
//         disease: name,
//         patient_count: diseaseMap[name],
//         percent_matched: matchedPatients
//           ? ((diseaseMap[name] / matchedPatients) * 100).toFixed(2)
//           : "0.00",
//         percent_total: totalPatients
//           ? ((diseaseMap[name] / totalPatients) * 100).toFixed(2)
//           : "0.00"
//       }));

//       // top disease
//       let top_disease = "";
//       let max = 0;
//       disease_distribution.forEach(d => {
//         if (d.patient_count > max) {
//           max = d.patient_count;
//           top_disease = d.disease;
//         }
//       });

//       // patient table with shared medications and ID
//       const patientSql = `
//         SELECT 
//           u.user_id,
//           u.name,
//           TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//           CASE 
//             WHEN u.gender = 1 THEN 'Male'
//             WHEN u.gender = 2 THEN 'Female'
//             WHEN u.gender = 3 THEN 'Other'
//             ELSE 'Not Specified'
//           END as gender,
//           u.diseases
//         FROM patient_master p
//         JOIN user_master u ON u.user_id = p.user_id
//         ${where}
//         GROUP BY p.user_id
//         ORDER BY u.name ASC
//         LIMIT ? OFFSET ?
//       `;

//       connection.query(patientSql, [...params, Number(limit), Number(offset)], async (err, patientRows) => {
//         if (err) return res.json({ success: false, msg: err.message });

  
//         const promises = patientRows.map(patient => new Promise((resolve, reject) => {
//           const checkShare = `
//             SELECT createtime 
//             FROM report_share_master 
//             WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
//               AND FIND_IN_SET('1', information_type)
//             ORDER BY createtime DESC
//             LIMIT 1
//           `;
//           connection.query(checkShare, [patient.user_id, doctor_id], (err1, shareList) => {
//             if (err1) return reject(err1);
//             if (!shareList.length) {
//               patient.medications = [];
//               return resolve(patient);
//             }

//             const shareTime = shareList[0].createtime;

//             const medSql = `
//               SELECT DISTINCT a.medicine_id, a.medicine_name
//               FROM medication_master m
//               JOIN medicine_master a ON a.medicine_id = m.medicine_id
//               JOIN time_slots_master tm ON tm.medication_id = m.medication_id
//               WHERE m.user_id = ? AND m.delete_flag = 0 AND tm.delete_flag = 0 AND m.createtime <= ?
//               ORDER BY a.medicine_name ASC
//             `;
//             connection.query(medSql, [patient.user_id, shareTime], (err2, meds) => {
//               if (err2) return reject(err2);
//               patient.medications = meds.map(m => ({ id: m.medicine_id, name: m.medicine_name }));
//               resolve(patient);
//             });
//           });
//         }));

//         const finalPatients = await Promise.all(promises);

//         return res.json({
//           success: true,
//           total_patients: totalPatients,
//           matched_patients: matchedPatients,
//           unique_diseases: Object.keys(diseaseMap).length,
//           top_disease,
//           disease_distribution,
//           patients: finalPatients
//         });
//       });
//     });
//   });
// };

const getMedicationDiseaseDashboard = (req, res) => {
  const {
    doctor_id,
    medication = [],
    diseases = [],
    age_group,
    gender,
    exclude_disease = [],
    singleOnly = false,
    combinedOnly = false,
    includeExtra =false,
    page = 1,
    limit = 10
  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
  let params = [doctor_id];
  const offset = (page - 1) * limit;

  if (gender !== undefined && gender !== null && gender !== "") {
    where += ` AND u.gender = ?`;
    params.push(gender);
  }

  if (age_group) {
    if (age_group.includes("+")) {
      const min = parseInt(age_group);
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
      params.push(min);
    } else {
      const [min, max] = age_group.split("-");
      where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }

  const totalSql = `
    SELECT COUNT(DISTINCT user_id) as total
    FROM patient_master
    WHERE doctor_id = ? AND delete_flag = 0
  `;

  connection.query(totalSql, [doctor_id], (err, totalRes) => {
    const totalPatients = totalRes[0].total;

    const matchSql = `
      SELECT DISTINCT 
        p.user_id, 
        u.name,
        TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
        CASE 
          WHEN u.gender = 1 THEN 'Male'
          WHEN u.gender = 2 THEN 'Female'
          WHEN u.gender = 3 THEN 'Other'
          ELSE 'Not Specified'
        END as gender,
        u.diseases
      FROM patient_master p
      JOIN user_master u ON u.user_id = p.user_id
      ${where}
    `;

    connection.query(matchSql, params, async (err, matchRows) => {

      const promises = matchRows.map(row => new Promise((resolve, reject) => {

        const checkShare = `
          SELECT createtime 
          FROM report_share_master 
          WHERE user_id = ? AND doctor_id = ? AND share_type = 0 AND delete_flag = 0
            AND FIND_IN_SET('1', information_type)
          ORDER BY createtime DESC
          LIMIT 1
        `;

        connection.query(checkShare, [row.user_id, doctor_id], (err1, shareList) => {
          if (err1) return reject(err1);

          if (!shareList.length) {
            row.medications = [];
            return resolve(row);
          }

          const shareTime = shareList[0].createtime;

          const medSql = `
            SELECT DISTINCT a.medicine_id, a.medicine_name
            FROM medication_master m
            JOIN medicine_master a ON a.medicine_id = m.medicine_id
            JOIN time_slots_master tm ON tm.medication_id = m.medication_id
            WHERE m.user_id = ? AND m.delete_flag = 0 AND tm.delete_flag = 0 AND m.createtime <= ?
            ORDER BY a.medicine_name ASC
          `;

          connection.query(medSql, [row.user_id, shareTime], (err2, meds) => {
            if (err2) return reject(err2);

            row.medications = meds.map(m => ({
              id: m.medicine_id,
              name: m.medicine_name
            }));

            resolve(row);
          });
        });
      }));

      let finalRows = await Promise.all(promises);

      // ============================
      // ✅ HELPERS (SAFE)
      // ============================

      const extractDiseases = (dStr) => {
        if (!dStr) return [];
        const matches = dStr.match(/name:\s*([^,}]+)/g) || [];
        return matches.map(d => d.replace("name:", "").trim().toLowerCase());
      };

      const extractMedNames = (medList) => {
        if (!medList) return [];
        return medList.map(m => m.name.toLowerCase());
      };

      const selectedDiseases = (diseases || []).map(d => d.toLowerCase());
      const selectedMeds = (medication || []).map(m => m.toLowerCase());

      // ============================
      // ✅ DISEASE FILTER (FIXED)
      // ============================

      if (singleOnly && selectedDiseases.length === 1) {
        finalRows = finalRows.filter(p => {
          const patientDiseases = extractDiseases(p.diseases);
          return (
            patientDiseases.length === 1 &&
            patientDiseases.includes(selectedDiseases[0])
          );
        });
      }

      else if (combinedOnly && selectedDiseases.length >= 2) {
        finalRows = finalRows.filter(p => {
          const patientDiseases = extractDiseases(p.diseases);

          const hasAll = selectedDiseases.every(d =>
            patientDiseases.includes(d)
          );

          const exactMatch =
            patientDiseases.length === selectedDiseases.length;

          return hasAll && exactMatch;
        });
      }

      else if (selectedDiseases.length > 0) {
        finalRows = finalRows.filter(p => {
          const patientDiseases = extractDiseases(p.diseases);
          return selectedDiseases.some(d =>
            patientDiseases.includes(d)
          );
        });
      }

      // ============================
      // ✅ MEDICATION FILTER (ALIGNED)
      // ============================

      if (selectedMeds.length > 0) {

        if (singleOnly && selectedMeds.length === 1) {
          finalRows = finalRows.filter(p => {
            const meds = extractMedNames(p.medications);
            return (
              meds.length === 1 &&
              meds.some(m => m.includes(selectedMeds[0]))
            );
          });
        }

        else if (combinedOnly && selectedMeds.length >= 2) {
          finalRows = finalRows.filter(p => {
            const meds = extractMedNames(p.medications);

            const matched = selectedMeds.filter(sel =>
              meds.some(m => m.includes(sel))
            );

            return (
              matched.length === selectedMeds.length &&
              meds.length === selectedMeds.length
            );
          });
        }
        else if (includeExtra && selectedMeds.length >= 2) {
          finalRows = finalRows.filter(p => {
            const meds = extractMedNames(p.medications);

            return selectedMeds.every(sel =>
              meds.some(m => m.includes(sel))
            );
          });
        }

        else {
          finalRows = finalRows.filter(p => {
            const meds = extractMedNames(p.medications);
            return selectedMeds.some(sel =>
              meds.some(m => m.includes(sel))
            );
          });
        }
      }

      // ============================
      // ✅ DISTRIBUTION
      // ============================

      const matchedPatients = finalRows.length;

      let diseaseMap = {};

      finalRows.forEach(row => {
        if (!row.diseases) return;

        const parts = row.diseases.split("},");
        parts.forEach(d => {
          const match = d.match(/name:\s*([^,}]+)/);
          if (match) {
            const name = match[1].trim();

            if (exclude_disease.includes(name)) return;

            if (!diseaseMap[name]) diseaseMap[name] = 0;
            diseaseMap[name]++;
          }
        });
      });

      const disease_distribution = Object.keys(diseaseMap).map(name => ({
        disease: name,
        patient_count: diseaseMap[name],
        percent_matched: matchedPatients
          ? ((diseaseMap[name] / matchedPatients) * 100).toFixed(2)
          : "0.00",
        percent_total: totalPatients
          ? ((diseaseMap[name] / totalPatients) * 100).toFixed(2)
          : "0.00"
      }));

      let top_disease = "";
      let max = 0;

      disease_distribution.forEach(d => {
        if (d.patient_count > max) {
          max = d.patient_count;
          top_disease = d.disease;
        }
      });

      return res.json({
        success: true,
        total_patients: totalPatients,
        matched_patients: matchedPatients,
        unique_diseases: Object.keys(diseaseMap).length,
        top_disease,
        disease_distribution,
        patients: finalRows.slice(offset, offset + Number(limit))
      });
    });
  });
};
// const getMedicationReportedHealth = (req, res) => {
//   const {
//     doctor_id,
//     medication = [],
//     gender,
//     age_group,
    
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [doctor_id];

  

  
//   if (gender !== undefined && gender !== "") {
//     where += ` AND u.gender = ?`;
//     params.push(gender);
//   }

  
//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

  
//   if (medication.length > 0) {
//     where += ` AND (` + medication.map(() => `med.medicine_name LIKE ?`).join(" OR ") + `)`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   //  Common JOIN 
//   const baseJoin = `
//     FROM patient_master p
//     JOIN user_master u ON u.user_id = p.user_id

//     LEFT JOIN adverse_reaction_master arm 
//       ON arm.user_id = u.user_id AND arm.delete_flag = 0

//     LEFT JOIN medicine_master med 
//       ON med.medicine_id = arm.medicine_id

//     LEFT JOIN symptoms_master sm 
//       ON sm.symptom_id = arm.symptom_id AND sm.delete_flag = 0
//   `;

//   // Total Patients
//   const totalSql = `
//     SELECT COUNT(DISTINCT p.user_id) as total
//     ${baseJoin}
//     ${where}
//   `;

//   connection.query(totalSql, params, (err, totalRes) => {
//     if (err) return res.json({ success: false, error: err.message });

//     const totalPatients = totalRes[0]?.total || 0;

//     //  Main Data Query
//     const sql = `
//       SELECT 
//         med.medicine_name,
//         u.user_id,
//         u.name,
//         TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//         CASE 
//           WHEN u.gender = 1 THEN 'Male'
//           WHEN u.gender = 2 THEN 'Female'
//           WHEN u.gender = 3 THEN 'Other'
//           ELSE 'Not Specified'
//         END as gender,
//         u.diseases,
//         sm.symptom_name
//       ${baseJoin}
//       ${where}
//       AND med.medicine_name IS NOT NULL
//       ORDER BY med.medicine_name ASC
      
//     `;

//     connection.query(sql,  params, (err2, rows) => {
//       if (err2) return res.json({ success: false, error: err2.message });

//       let result = {};

//       rows.forEach(r => {
//         const med = r.medicine_name;

//         if (!result[med]) {
//           result[med] = {
//             patients: new Set(),
//             symptoms: {},
//             patient_details: {}
//           };
//         }

//         // unique patients
//         result[med].patients.add(r.user_id);

//         // symptom count
//         if (r.symptom_name) {
//           result[med].symptoms[r.symptom_name] =
//             (result[med].symptoms[r.symptom_name] || 0) + 1;
//         }

//         // patient details
//         if (!result[med].patient_details[r.user_id]) {
//           result[med].patient_details[r.user_id] = {
//             name: r.name,
//             age: r.age,
//             gender: r.gender,
//             diseases: r.diseases,
//             medications: med,
//             symptoms: new Set()
//           };
//         }

//         if (r.symptom_name) {
//           result[med].patient_details[r.user_id].symptoms.add(r.symptom_name);
//         }
//       });

//       // Final Response Format
//       let finalData = Object.keys(result).map(med => {
//         const patientCount = result[med].patients.size;

//         const percentage = totalPatients
//           ? ((patientCount / totalPatients) * 100).toFixed(1)
//           : "0.0";

//         // symptoms breakdown
//         let symptomData = Object.keys(result[med].symptoms).map(sym => {
//           const count = result[med].symptoms[sym];

//           const perc = patientCount
//             ? ((count / patientCount) * 100).toFixed(1)
//             : "0.0";

//           return {
//             symptom: sym,
//             count,
//             percentage: perc + "%"
//           };
//         });

//         // patient table
//         let patients = Object.values(result[med].patient_details).map(p => ({
//           patient_name: p.name,
//           age: p.age,
//           gender: p.gender,
//           diseases: p.diseases,
//           medications: p.medications,
//           symptoms: Array.from(p.symptoms).join(", ")
//         }));

//         return {
//           medication: med,
//           total_patients: patientCount,
//           percentage: percentage + "%",
//           symptoms: symptomData,
//           patients
//         };
//       });

//       return res.json({
//         success: true,
//         total_patients: totalPatients,
//         data: finalData
//       });
//     });
//   });
// };

// const getMedicationReportedHealth = (req, res) => {
//   const {
//     doctor_id,
//     medication = [],
//     age_group,
//     page = 1,
//     limit = 10,
//     patient_page = 1,
//     patient_limit = 5
//   } = req.body;

//   if (!doctor_id) {
//     return res.json({ success: false, msg: "doctor_id required" });
//   }

//   let where = `WHERE p.doctor_id = ? AND p.delete_flag = 0`;
//   let params = [];

//   params.push(doctor_id);

//   if (age_group) {
//     if (age_group.includes("+")) {
//       const min = parseInt(age_group.replace("+", ""));
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`;
//       params.push(min);
//     } else {
//       const [min, max] = age_group.split("-").map(Number);
//       where += ` AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`;
//       params.push(min, max);
//     }
//   }

//   if (Array.isArray(medication) && medication.length > 0) {
//     const medCond = medication.map(() => `med.medicine_name LIKE ?`).join(" OR ");
//     where += ` AND (${medCond})`;
//     medication.forEach(m => params.push(`%${m}%`));
//   }

//   const baseJoin = `
//     FROM patient_master p
//     JOIN user_master u ON u.user_id = p.user_id
//     JOIN medication_master m 
//       ON m.user_id = u.user_id AND m.delete_flag = 0
//     JOIN medicine_master med 
//       ON med.medicine_id = m.medicine_id
//     LEFT JOIN adverse_reaction_master arm 
//       ON arm.user_id = u.user_id AND arm.delete_flag = 0
//     LEFT JOIN symptoms_master sm 
//       ON sm.symptom_id = arm.symptom_id AND sm.delete_flag = 0
//   `;

//   // 🔹 total patients (same as before)
//   const totalSql = `
//     SELECT COUNT(DISTINCT p.user_id) as total
//     ${baseJoin}
//     ${where}
//   `;

//   connection.query(totalSql, params, (err, totalRes) => {
//     if (err) return res.json({ success: false, error: err.message });

//     const totalPatients = totalRes[0]?.total || 0;

//     // SQL WITHOUT pagination
//     const sql = `
//       SELECT 
//         m.medicine_id,
//         med.medicine_name,
//         m.user_id,
//         u.name,
//         TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
//         u.diseases,
//         sm.symptom_name
//       ${baseJoin}
//       ${where}
//       GROUP BY m.user_id, m.medicine_id, sm.symptom_name
//       ORDER BY med.medicine_name ASC
//     `;

//     connection.query(sql, params, (err2, rows) => {
//       if (err2) return res.json({ success: false, error: err2.message });

//       let result = {};

//       rows.forEach(r => {
//         const med = r.medicine_name;

//         if (!result[med]) {
//           result[med] = {
//             medicine_id: r.medicine_id,
//             patients: new Set(),
//             symptoms: {},
//             patient_details: {}
//           };
//         }

//         result[med].patients.add(r.user_id);

//         if (r.symptom_name) {
//           result[med].symptoms[r.symptom_name] =
//             (result[med].symptoms[r.symptom_name] || 0) + 1;
//         }

//         if (!result[med].patient_details[r.user_id]) {
//           result[med].patient_details[r.user_id] = {
//             user_id: r.user_id,
//             name: r.name,
//             age: r.age,
//             diseases: r.diseases,
//             medications: {
//               id: r.medicine_id,
//               name: r.medicine_name
//             },
//             symptoms: new Set()
//           };
//         }

//         if (r.symptom_name) {
//           result[med].patient_details[r.user_id].symptoms.add(r.symptom_name);
//         }
//       });

//       let finalData = Object.keys(result).map(med => {
//         const patientCount = result[med].patients.size;

//         const percentage = totalPatients
//           ? ((patientCount / totalPatients) * 100).toFixed(1)
//           : "0.0";

//         let symptomData = Object.keys(result[med].symptoms).map(sym => {
//           const count = result[med].symptoms[sym];

//           const perc = patientCount
//             ? ((count / patientCount) * 100).toFixed(1)
//             : "0.0";

//           return {
//             symptom: sym,
//             count,
//             percentage: perc + "%"
//           };
//         });

//         //  Patient pagination per medication
//         let allPatients = Object.values(result[med].patient_details);

//         const patientOffset = (patient_page - 1) * patient_limit;

//         let patients = allPatients
//           .slice(patientOffset, patientOffset + Number(patient_limit))
//           .map(p => ({
//             user_id: p.user_id,
//             patient_name: p.name,
//             age: p.age,
//             diseases: p.diseases,
//             medications: p.medications,
//             symptoms: Array.from(p.symptoms).join(", ")
//           }));

//         return {
//           medication: {
//             id: result[med].medicine_id,
//             name: med
//           },
//           total_patients: patientCount,
//           percentage: percentage + "%",
//           symptoms: symptomData,
//           total_patients_in_medication: allPatients.length, // optional useful
//           patients
//         };
//       });

//       // Medication pagination
//       const medOffset = (page - 1) * limit;

//       let paginatedMedications = finalData.slice(
//         medOffset,
//         medOffset + Number(limit)
//       );

//       return res.json({
//         success: true,
//         total_patients: totalPatients,
//         total_medications: finalData.length,
//         page: Number(page),
//         limit: Number(limit),
//         patient_page: Number(patient_page),
//         patient_limit: Number(patient_limit),
//         data: paginatedMedications
//       });
//     });
//   });
// };
const getMedicationReportedHealth = (req, res) => {
  const {
    doctor_id,
    medication = [],
    age_group,
    page = 1,
    limit = 10,
    patient_page = 1,
    patient_limit = 5
  } = req.body;

  if (!doctor_id) {
    return res.json({ success: false, msg: "doctor_id required" });
  }

  // First, get the latest share time for each patient
  const latestShareSql = `
    SELECT 
      user_id, 
      MAX(createtime) as latest_share_time
    FROM report_share_master
    WHERE doctor_id = ? 
      AND share_type = 0 
      AND delete_flag = 0
      AND FIND_IN_SET('4', information_type) > 0
    GROUP BY user_id
  `;

  connection.query(latestShareSql, [doctor_id], (err0, shareResults) => {
    if (err0) return res.json({ success: false, error: err0.message });

    // Create a map of user_id -> latest share time
    const shareTimeMap = {};
    shareResults.forEach(row => {
      shareTimeMap[row.user_id] = row.latest_share_time;
    });

    if (Object.keys(shareTimeMap).length === 0) {
      return res.json({
        success: true,
        total_patients: 0,
        total_medications: 0,
        page: Number(page),
        limit: Number(limit),
        patient_page: Number(patient_page),
        patient_limit: Number(patient_limit),
        data: []
      });
    }

    // Get total patients count (only those who have shared at least one adverse reaction)
    const totalPatientsSql = `
      SELECT COUNT(DISTINCT p.user_id) as total
      FROM patient_master p
      WHERE p.doctor_id = ? 
        AND p.delete_flag = 0
        AND p.user_id IN (${Object.keys(shareTimeMap).map(() => '?').join(',')})
    `;

    const patientIds = Object.keys(shareTimeMap);
    connection.query(totalPatientsSql, [doctor_id, ...patientIds], (err1, totalRes) => {
      if (err1) return res.json({ success: false, error: err1.message });

      const totalPatients = totalRes[0]?.total || 0;

      // Build the main query with share time filter
      let whereConditions = [];
      let queryParams = [];

      // Add doctor filter
      whereConditions.push(`p.doctor_id = ?`);
      queryParams.push(doctor_id);

      // Add patient filter - only those who have shared
      whereConditions.push(`p.user_id IN (${patientIds.map(() => '?').join(',')})`);
      queryParams.push(...patientIds);

      // Add age group filter if provided
      if (age_group) {
        if (age_group.includes("+")) {
          const min = parseInt(age_group.replace("+", ""));
          whereConditions.push(`TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) >= ?`);
          queryParams.push(min);
        } else {
          const [min, max] = age_group.split("-").map(Number);
          whereConditions.push(`TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?`);
          queryParams.push(min, max);
        }
      }

      // Add medication filter if provided
      if (Array.isArray(medication) && medication.length > 0) {
        const medConditions = medication.map(() => `med.medicine_name LIKE ?`);
        whereConditions.push(`(${medConditions.join(" OR ")})`);
        medication.forEach(m => queryParams.push(`%${m}%`));
      }

      // Main query - join with share time filter
      const sql = `
        SELECT
          arm.medicine_id,
          med.medicine_name,
          arm.user_id,
          u.name,
          TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age,
          u.diseases,
          sm.symptom_name,
          arm.medication_start_date,
          arm.reaction_date,
          arm.createtime as reaction_createtime
        FROM patient_master p
        JOIN user_master u 
          ON u.user_id = p.user_id
          AND u.delete_flag = 0
        JOIN adverse_reaction_master arm 
          ON arm.user_id = u.user_id 
          AND arm.delete_flag = 0
        JOIN medicine_master med 
          ON med.medicine_id = arm.medicine_id
        LEFT JOIN symptoms_master sm 
          ON sm.symptom_id = arm.symptom_id 
          AND sm.delete_flag = 0
        WHERE ${whereConditions.join(' AND ')}
          AND p.delete_flag = 0
          -- Critical: Only include reactions created BEFORE or AT the share time
          AND EXISTS (
            SELECT 1
            FROM report_share_master rsm
            WHERE rsm.user_id = arm.user_id
              AND rsm.doctor_id = p.doctor_id
              AND rsm.share_type = 0
              AND rsm.delete_flag = 0
              AND FIND_IN_SET('4', rsm.information_type) > 0
              AND arm.createtime <= rsm.createtime
          )
        ORDER BY med.medicine_name ASC
      `;

      connection.query(sql, queryParams, (err2, rows) => {
        if (err2) return res.json({ success: false, error: err2.message });

        // Collect all unique user_ids to fetch their full medication lists
        const userIds = [...new Set(rows.map(r => r.user_id))];

        if (userIds.length === 0) {
          return res.json({
            success: true,
            total_patients: totalPatients,
            total_medications: 0,
            page: Number(page),
            limit: Number(limit),
            patient_page: Number(patient_page),
            patient_limit: Number(patient_limit),
            data: []
          });
        }

        // Fetch all medications for these patients from medication_master
        const allMedsSql = `
          SELECT 
            mm.user_id,
            med2.medicine_id,
            med2.medicine_name
          FROM medication_master mm
          JOIN medicine_master med2 ON med2.medicine_id = mm.medicine_id
          WHERE mm.user_id IN (${userIds.map(() => '?').join(',')})
            AND mm.delete_flag = 0
        `;

        connection.query(allMedsSql, userIds, (err3, medRows) => {
          if (err3) return res.json({ success: false, error: err3.message });

          // Build a map: user_id -> array of all their medications
          const userMedsMap = {};
          medRows.forEach(m => {
            if (!userMedsMap[m.user_id]) {
              userMedsMap[m.user_id] = [];
            }
            userMedsMap[m.user_id].push({
              id: m.medicine_id,
              name: m.medicine_name
            });
          });

          let result = {};

          rows.forEach(r => {
            const med = r.medicine_name;

            if (!result[med]) {
              result[med] = {
                medicine_id: r.medicine_id,
                patients: new Set(),
                symptoms: {},
                patient_details: {}
              };
            }

            result[med].patients.add(r.user_id);

            if (r.symptom_name) {
              if (!result[med].symptoms[r.symptom_name]) {
                result[med].symptoms[r.symptom_name] = new Set();
              }
              result[med].symptoms[r.symptom_name].add(r.user_id);
            }

            if (!result[med].patient_details[r.user_id]) {
              result[med].patient_details[r.user_id] = {
                user_id: r.user_id,
                name: r.name,
                age: r.age,
                diseases: r.diseases,
                reacted_medication: {
                  id: r.medicine_id,
                  name: r.medicine_name
                },
                medication_start_date: r.medication_start_date,
                reaction_date: r.reaction_date,
                symptoms: new Set()
              };
            }

            if (r.symptom_name) {
              result[med].patient_details[r.user_id].symptoms.add(r.symptom_name);
            }
          });

          let finalData = Object.keys(result).map(med => {
            const patientCount = result[med].patients.size;
            const percentage = totalPatients
              ? ((patientCount / totalPatients) * 100).toFixed(1)
              : "0.0";

            let symptomData = Object.keys(result[med].symptoms).map(sym => {
              const count = result[med].symptoms[sym].size;
              const perc = patientCount
                ? ((count / patientCount) * 100).toFixed(1)
                : "0.0";
              return { symptom: sym, count, percentage: perc + "%" };
            });

            let allPatients = Object.values(result[med].patient_details);
            const patientOffset = (patient_page - 1) * patient_limit;
            let patients = allPatients
              .slice(patientOffset, patientOffset + Number(patient_limit))
              .map(p => ({
                user_id: p.user_id,
                patient_name: p.name,
                age: p.age,
                diseases: p.diseases,
                reacted_medication: p.reacted_medication,
                all_medications: userMedsMap[p.user_id] || [],
                medication_start_date: p.medication_start_date,
                reaction_date: p.reaction_date,
                symptoms: Array.from(p.symptoms).join(", ")
              }));

            return {
              medication: { id: result[med].medicine_id, name: med },
              total_patients: patientCount,
              percentage: percentage + "%",
              symptoms: symptomData,
              total_patients_in_medication: allPatients.length,
              patient_page: Number(patient_page),
              patients
            };
          });

          const medOffset = (page - 1) * limit;
          let paginatedMedications = finalData.slice(medOffset, medOffset + Number(limit));

          return res.json({
            success: true,
            total_patients: totalPatients,
            total_medications: finalData.length,
            page: Number(page),
            limit: Number(limit),
            patient_page: Number(patient_page),
            patient_limit: Number(patient_limit),
            data: paginatedMedications
          });
        });
      });
    });
  });
};

// const getDoctorAllSymptoms = async (req, res) => {
//   const doctor_id = req.query.doctor_id;

//   try {
//     if (!doctor_id) {
//       return res.status(200).json({
//         success: false,
//         msg: "doctor_id required"
//       });
//     }

//     // Check if doctor exists
//     const checksql = `
//       SELECT doctor_id 
//       FROM doctor_master 
//       WHERE doctor_id = ? AND delete_flag = 0
//     `;

//     connection.query(checksql, [doctor_id], (err, check) => {
//       if (err) {
//         return res.json({ success: false, msg: "Server error", err: err.message });
//       }

//       if (check.length === 0) {
//         return res.json({ success: false, msg: "Doctor not found" });
//       }

//       // Total shared symptoms
//       const totalSql = `
//         SELECT COUNT(DISTINCT sm.symptom_id) AS totalSymptoms
//         FROM report_share_master r
//         JOIN adverse_reaction_master arm
//           ON arm.user_id = r.user_id
//           AND arm.delete_flag = 0
//           AND arm.createtime <= r.createtime
//         JOIN symptoms_master sm
//           ON sm.symptom_id = arm.symptom_id
//           AND sm.delete_flag = 0
//         WHERE r.doctor_id = ?
//           AND r.share_type = 0
//           AND r.delete_flag = 0
//           AND FIND_IN_SET('1', r.information_type)
//       `;

//       connection.query(totalSql, [doctor_id], (err, totalRes) => {
//         if (err) {
//           return res.json({ success: false, msg: "Error in count", err: err.message });
//         }

//         const totalSymptoms = totalRes[0].totalSymptoms;

//         // List of shared symptoms
//         const symptomListSql = `
//           SELECT DISTINCT sm.symptom_name
//           FROM report_share_master r
//           JOIN adverse_reaction_master arm
//             ON arm.user_id = r.user_id
//             AND arm.delete_flag = 0
//             AND arm.createtime <= r.createtime
//           JOIN symptoms_master sm
//             ON sm.symptom_id = arm.symptom_id
//             AND sm.delete_flag = 0
//           WHERE r.doctor_id = ?
//             AND r.share_type = 0
//             AND r.delete_flag = 0
//             AND FIND_IN_SET('1', r.information_type)
//           ORDER BY sm.symptom_name ASC
//         `;

//         connection.query(symptomListSql, [doctor_id], (err2, symptomList) => {
//           if (err2) {
//             return res.json({ success: false, msg: "Error in list", err: err2.message });
//           }

//           return res.json({
//             success: true,
//             totalSymptoms: totalSymptoms,
//             symptoms: symptomList
//           });
//         });
//       });
//     });

//   } catch (error) {
//     return res.json({
//       success: false,
//       msg: "Server error",
//       err: error.message
//     });
//   }
// };
// ✅ FIXED: getDoctorAllSymptoms
const getDoctorAllSymptoms = async (req, res) => {
  const doctor_id = req.query.doctor_id;

  try {
    if (!doctor_id) {
      return res.json({ success: false, msg: "doctor_id required" });
    }

    const sql = `
      SELECT DISTINCT
        sm.symptom_id,
        sm.symptom_name
      FROM report_share_master r

      JOIN adverse_reaction_master arm
        ON arm.user_id = r.user_id
        AND arm.delete_flag = 0

      JOIN symptoms_master sm
        ON sm.symptom_id = arm.symptom_id
        AND sm.delete_flag = 0

      WHERE r.doctor_id = ?
        AND r.share_type = 0
        AND r.delete_flag = 0
        AND FIND_IN_SET('4', r.information_type)

      ORDER BY sm.symptom_name ASC
    `;

    connection.query(sql, [doctor_id], (err, result) => {
      if (err) {
        return res.json({ success: false, msg: "Error", err: err.message });
      }

      return res.json({
        success: true,
        total: result.length,
        data: result
      });
    });

  } catch (error) {
    return res.json({ success: false, msg: "Server error", err: error.message });
  }
};

const getAppContent = (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.status(200).json({
      success: false,
      msg: "Content type is required"
    });
  }

  const sql = `
    SELECT content 
    FROM content_master 
    WHERE content_type = ? 
    AND delete_flag = 0
    LIMIT 1
  `;

  connection.query(sql, [type], (err, result) => {
    if (err) {
      return res.status(200).json({
        success: false,
        msg: "Database error",
        error: err
      });
    }

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        data: result[0].content
      });
    } else {
      return res.status(200).json({
        success: false,
        msg: "No content found"
      });
    }
  });
};


module.exports = {
  subAdminLogin, verifyLoginOtp, dashboardGraphs, getProfile, UpdateSubAdminPassword, UpdateSubAdminProfile, ForgotPassword, subAdminForgetNewPassword, subAdminDashboard, getAllPatients, getPatientsDetails, getAllMedications, getAllMeasurements, getAllMedicalReports, addNote, getNotes, getTabularMedication,
  getTabularAdverse, getTabularMeasurement, getTabularLabreport, getSharedTabular, deleteNote, updateNote, medicationDashboard, adverseDashboard, labReportDashboard, measurementDashboard, deleteImage,deleteDoctorAccount, getPatientMeasurements,  getPatientMedicationList, getPatientReport, getAdverseofPatient,sendPush,sendNotificationAll,sendNotificationUsers,getNotificationHistory,getAllDiseases,getAllMedicines,getPatientAnalyticsCustomTable,getPatientDemographicsDetails,getPatientDemographics,getPatientDiseasesMedicineAnalytics,getPatientDiseasesMedicineList,getDiseaseMedicineSummary,getSubadminMedicationFull,getDiseaseDashboard,getMedicationDiseaseDashboard
,getMedicationReportedHealth,getDocterAllDiseases,getDocterAllMedicines,getDoctorAllSymptoms, getAppContent, getDiseaseMedicineAnalyticsMerged 
}