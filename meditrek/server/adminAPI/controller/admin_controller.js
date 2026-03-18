const connection = require("../connection/connection");

const moment = require("moment-timezone");
const xlsx = require("xlsx");
const crypto = require("crypto");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

const {
  sendDoctorEmail,
  contactUsMailer,
  contactUsMailerDoctor,
  ActivateDeactivatemailer,
  mailer,
  mailerApproveDoctor,
  mailerRejectDoctorByAdmin
} = require("../controller/mailer");

const languageMessages = require("./languageMessages");

const { hashPassword } = require("./function");

dotenv.config();

// const createtime = moment().format("YYYY-MM-DD HH:mm:ss");
const createtime = moment().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss");
const updatetime = moment().tz("Europe/Paris").format("YYYY-MM-DD HH:mm:ss");


// const updatetime = moment().format("YYYY-MM-DD HH:mm:ss");

// const SECRET_KEY = process.env.ADMIN_SECRET_KEY;
const SECRET_KEY = "SECRETKEYHERE";

const { getNotificationArrSingle, oneSignalNotificationSendCall, } = require("./notification");

//-------------------------------------

const adminLogin = async (request, response) => {
  const { email, password } = request.body;
  try {
    if (!email) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "email",
        });
    }
    if (!password) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "password",
        });
    }

    const sqlCheckUser =
      "SELECT user_id,email,name, password, user_id, active_flag, mobile, address, user_type FROM user_master WHERE email = ? AND delete_flag = 0 AND user_type=0";
    connection.query(sqlCheckUser, [email], async (err, userResult) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      if (userResult.length <= 0) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.emailNotRegistered,
            key: "email",
          });
      }
      if (userResult.length > 0) {
        var adminPassword = userResult[0].password;
        const hashedPass = await hashPassword(password);
        if (adminPassword != hashedPass) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.emailNotRegistered,
              a: adminPassword,
              p: hashedPass,
              key: "password",
            });
        } else {
          // const payload = { subject: userResult[0].email };
          // const key = rs.generate();
          // const token = jwt.sign(payload, key);
          const payload = { subject: userResult[0].user_id };
          const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
          // return response.json("check 2")

          return response
            .status(200)
            .json({
              success: true,
              msg: languageMessages.loginSuccessfully,
              key: "login_successfully",
              token: token,
              info: userResult,
            });
        }
      }
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

// const adminLogin = async (request, response) => {

//     const { email, password } = request.body;

//     console.log("hashedPassword", request.body);

//     try {

//         if (!email) {

//             return response.status(200).json({

//                 success: false,

//                 message: languageMessages.msg_empty_param,

//                 key: "email",

//             });

//         }

//         if (!password) {

//             return response.status(200).json({

//                 success: false,

//                 message: languageMessages.msg_empty_param,

//                 key: "password",

//             });

//         }

//         const hashedPassword = await hashPassword(password);

//         const checkAdmin =

//             "SELECT user_id, email, password, mobile, user_type FROM user_master WHERE email = ? AND user_type=0 AND delete_flag = 0";

//         connection.query(checkAdmin, [email], async (err, info) => {

//             if (err) {

//                 return response.status(200).json({

//                     success: false,

//                     message: languageMessages.internalServerError,

//                     error: err.message,

//                 });

//             }

//             if (info.length === 0) {

//                 return response.status(200).json({

//                     success: false,

//                     message: languageMessages.invalidEmail,

//                     key: "email",

//                 });

//             }

//             //login starts

//             const password = info[0].password;

//             if (password !== hashedPassword) {

//                 return response.status(200).json({

//                     success: false,

//                     message: languageMessages.invalidPassword,

//                     key: "password",

//                 });

//             }

//             if (password === hashedPassword) {

//                 var other_user_id = info[0].user_id;

//                 var expireTime = { expiresIn: "1d" };

//                 var token = jwt.sign({ _id: email }, SECRET_KEY, expireTime);

//                 if (!token)

//                     response.render("error", {

//                         message: "Error while generating token inside admin login",

//                     });

//                 var expireTime = { expiresIn: "1d" };

//                 var token = jwt.sign(

//                     { user_id: other_user_id },

//                     SECRET_KEY,

//                     expireTime

//                 );

//                 if (!token) {

//                     response.render("error", {

//                         message: "Error while generating token inside admin login",

//                     });

//                 }

//                 return response.status(200).json({

//                     success: true,

//                     message: languageMessages.loginSuccessfully,

//                     token: token,

//                 });

//             } else {

//                 return response.status(200).json({

//                     success: false,

//                     message: languageMessages.invalidCredentials,

//                 });

//             }

//         });

//     } catch (err) {

//         return response.status(200).json({

//             success: false,

//             message: languageMessages.internalServerError,

//             error: err.message,

//         });

//     }

// };

const UpdateAdminProfile = async (request, response) => {
  const { name, email } = request.body;

  try {
    let image = request.file ? request.file.filename : null;

    if (!name || !email) {
      return response

        .status(200)

        .json({ success: false, msg: languageMessages.msg_empty_param });
    }

    let updateQuery = "UPDATE user_master SET name = ?, email = ?";

    let params = [name, email];

    if (image) {
      updateQuery += ", image = ?";

      params.push(image);
    }

    updateQuery += " WHERE user_type = 0 AND delete_flag = 0";

    connection.query(updateQuery, params, (err, result) => {
      if (err) {
        return response

          .status(200)

          .json({
            success: false,

            msg: languageMessages.internalServerError,

            err: err.message,
          });
      }

      if (result.affectedRows > 0) {
        return response

          .status(200)

          .json({
            success: true,

            msg: "Admin profile updated successfully.",

            key: "Edit",
            image
          });
      } else {
        return response

          .status(200)

          .json({ success: false, msg: "Failed to update profile." });
      }
    });
  } catch (error) {
    return response

      .status(200)

      .json({
        success: false,

        msg: lang.internalServerError,

        error: error.message,
      });
  }
};

const getAdminAllData = async (request, response) => {
  try {
    const sqlCheckUser =
      "SELECT user_id,email,name, password, user_id, active_flag, mobile, address, user_type,image FROM user_master WHERE delete_flag = 0 AND user_type = 0";

    connection.query(sqlCheckUser, async (err, userResult) => {
      if (err) {
        return response

          .status(200)

          .json({
            success: false,

            msg: languageMessages.internalServerError,

            err: err.message,
          });
      }

      if (userResult.length <= 0) {
        return response

          .status(200)

          .json({
            success: false,

            msg: languageMessages.msgDataNotFound,

            key: "email",
          });
      }

      if (userResult.length > 0) {
        return response

          .status(200)

          .json({
            success: true,

            msg: languageMessages.msgDataFound,

            key: "data found",

            info: userResult,
          });
      }
    });
  } catch (error) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      err: error.message,
    });
  }
};

const UpdateAdminPassword = async (request, response) => {
  const { oldpassword, newPassword } = request.body;

  try {
    if (!oldpassword) {
      return response.status(200).json({
        success: false,

        msg: languageMessages.msg_empty_param,

        key: "old_password",
      });
    }

    if (!newPassword) {
      return response.status(200).json({
        success: false,

        msg: languageMessages.msg_empty_param,

        key: "new_password",
      });
    }

    var sql =
      "SELECT user_id FROM user_master WHERE user_type = 0 and delete_flag = 0";

    connection.query(sql, async (err, info) => {
      if (err) {
        return response

          .status(200)

          .json({ success: false, msg: languageMessages.internalServerError });
      }

      if (info.length <= 0) {
        return response

          .status(200)

          .json({ success: false, msg: languageMessages.msgUserNotFound });
      }

      if (info[0].active_flag === 0) {
        return response.status(200).json({
          success: false,

          msg: languageMessages.accountDeactivate,

          active_status: 0,
        });
      }

      console.log(info[0].user_id);

      var sqlforget = "select password from user_master where user_id = ?";

      connection.query(sqlforget, [info[0].user_id], async (err, data) => {
        if (err) {
          return response

            .status(200)

            .json({
              success: false,
              msg: languageMessages.internalServerError,
            });
        } else {
          if (data.length <= 0) {
            return response

              .status(200)

              .json({ success: false, msg: languageMessages.msgDataNotFound });
          }

          var password = data[0].password;

          console.log(password);

          const old_password_hash = await hashPassword(oldpassword);

          // console.log('this is mine ', old_password_hash);

          // console.log('db pass', password);

          if (password === old_password_hash) {
            const new_pass = await hashPassword(newPassword);

            if (new_pass != old_password_hash) {
              var updateSql =
                "UPDATE user_master SET password=?, updatetime = NOW() WHERE user_id = ? AND delete_flag = 0";

              connection.query(
                updateSql,
                [new_pass, info[0].user_id],
                (err) => {
                  if (err) {
                    return response
                      .status(200)
                      .json({
                        success: false,
                        msg: languageMessages.internalServerError,
                      });
                  } else {
                    return response
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
              return response.status(200).json({
                success: true,

                msg: languageMessages.newOldPassword,

                key: "samePassword",
              });
            }
          } else {
            return response.status(200).json({
              success: false,

              msg: languageMessages.newOldPassword,

              key: "failure",
            });
          }
        }
      });
    });
  } catch (error) {
    return response

      .status(200)

      .json({ success: false, msg: languageMessages.internalServerError });
  }
};

const getAllusersData = async (request, response) => {
  try {
    // get user details

    const query = `SELECT user_id, f_name,l_name,name ,mobile,image, email , user_unique_id, active_flag, createtime FROM user_master WHERE delete_flag=0 AND user_type !=0 AND otp_verify = 1 ORDER BY createtime DESC;`;

    connection.query(query, (err, users) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }

      if (users.length == 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.msgUserNotFound });
      }
      users.map((item) => {
        item.createtime = moment(item.createtime).format("YYYY-MM-DD hh:mm A");
      });

      return response
        .status(200)
        .json({ success: true, msg: languageMessages.userFound, users: users });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteUser = (req, res) => {

  const { user_id } = req.body;

  const sql = `
    UPDATE user_master
    SET delete_flag = 1
    WHERE user_id = ?
  `;

  connection.query(sql, [user_id], (err, result) => {

    if (err) {
      return res.json({
        success: false,
        msg: "Database error"
      });
    }

    return res.json({
      success: true,
      msg: "User deleted successfully"
    });

  });

};

// const ViewUserDetails = async (request, response) => {
//   const { user_id } = request.params;

//   if (!user_id) {
//     return response
//       .status(200)
//       .json({
//         success: false,
//         msg: languageMessages.msg_empty_param,
//         key: "user_id",
//       });
//   }

//   var checkUser = "SELECT user_id FROM user_master WHERE user_id = ?";

//   connection.query(checkUser, [user_id], async (err, res) => {
//     if (err) {
//       return response
//         .status(200)
//         .json({ success: false, msg: languageMessages.internalServerError });
//     }

//     if (res.length <= 0) {
//       return response
//         .status(200)
//         .json({ success: false, msg: languageMessages.msgUserNotFound });
//     }

//     if (res[0].active_flag === 0) {
//       return response
//         .status(200)
//         .json({ success: false, msg: languageMessages.accountdeactivated });
//     }

//     if (res.length > 0) {
//       var FetchDetails = "SELECT um.user_id, um.username, um.f_name, um.l_name, um.name, um.email, um.image, um.about, um.dob, um.gender, um.mobile, um.phone_code, um.user_type, um.active_flag, um.weight, um.height, um.createtime FROM user_master WHERE um.user_id = ?";

//       connection.query(FetchDetails, [user_id], async (err, userResult) => {
//         if (err) {
//           return response
//             .status(200)
//             .json({
//               success: false,
//               msg: languageMessages.internalServerError,
//             });
//         } else {
//           if (userResult.length > 0) {
//             var user_arr = [];

//             var data = userResult[0];

//             user_arr.push({
//               user_id: data.user_id,

//               username: data.username,

//               f_name: data.f_name,

//               l_name: data.l_name,

//               name: data.name,

//               email: data.email,

//               image: data.image,

//               bio: data.about,

//               dob: moment(data.dob).format("DD MMM YYYY"),
//               weight: data.weight,
//               height: data.height,

//               gendor: data.gender,

//               gender_lable:
//                 data.gender == 1
//                   ? "Male"
//                   : data.gender == 2
//                     ? "Female"
//                     : data.gender == 3
//                       ? "Other"
//                       : "NA",

//               mobile: data.mobile,

//               phone_code: data.phone_code,

//               user_type: data.user_type,

//               user_type_lable: "0=admin,1=user",

//               active_flag: data.active_flag,

//               createtime: moment(data.createtime).format("DD-MM-YYYY HH:mm A"),
//             });

//             return response
//               .status(200)
//               .json({
//                 success: true,
//                 msg: languageMessages.msgDataFound,
//                 res: user_arr,
//               });
//           }
//         }
//       });
//     } else {
//       return response
//         .status(200)
//         .json({ success: false, msg: languageMessages.msgUserNotFound });
//     }
//   });
// };

// const ActivateDeactivateUser = async (request, response) => {

//     const { user_id } = request.body;

//     if (!user_id) {

//         return response.status(400).json({ success: false, msg: "Missing user_id" });

//     }

//     try {

//         // Check if user exists and update active_flag in a single query

//         const toggleUserQuery = `

//             UPDATE user_master

//             SET active_flag = IF(active_flag = 1, 0, 1)

//             WHERE user_id = ? AND delete_flag = 0;

//         `;

//         connection.query(toggleUserQuery, [user_id], (err, result) => {

//             if (err) {

//                 console.error("Error updating user status:", err);

//                 return response.status(500).json({ success: false, msg: "Internal server error" });

//             }

//             if (result.affectedRows === 0) {

//                 return response.status(404).json({ success: false, msg: "User not found or already deleted" });

//             }

//             return response.status(200).json({ success: true, msg: "User status updated successfully" });

//         });

//     } catch (error) {

//         console.error("Unexpected error:", error);

//         return response.status(500).json({ success: false, msg: "Internal server error" });

//     }

// };

const ViewUserDetails = async (request, response) => {
  const { user_id } = request.params;
  try {

    if (!user_id) {
      return response.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "user_id",
      });
    }

    const checkUser = "SELECT user_id, active_flag FROM user_master WHERE user_id = ?";

    connection.query(checkUser, [user_id], (err, res) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });
      }

      if (res.length <= 0) {
        return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });
      }

      // if (res[0].active_flag === 0) {
      //   return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated });
      // }

      const FetchDetails = `
      SELECT 
        um.user_id,  um.f_name, um.l_name, um.name, um.email, 
        um.image, um.about, um.dob, um.gender, um.mobile, um.phone_code, 
        um.user_type, um.active_flag, um.weight, um.height, um.createtime,
        um.diseases,um.delete_flag
      FROM user_master um 
      WHERE um.user_id = ?
    `;

      connection.query(FetchDetails, [user_id], (err, userResult) => {
        if (err) {
          return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });
        }

        if (userResult.length > 0) {
          const data = userResult[0];
          const diseaseIdsRaw = data.diseases;

          const buildUserResponse = (diseaseNames = []) => {
            const user_arr = [{
              user_id: data.user_id,
              username: data.name,
              f_name: data.f_name,
              l_name: data.l_name,
              name: data.name,
              email: data.email,
              image: data.image,
              bio: data.about,
              dob: moment(data.dob)
                .tz("Europe/Paris")
                .format("DD MMM YYYY"), weight: data.weight,
              height: data.height,
              age: data.dob ? moment().diff(data.dob, 'years') : "NA",
              gendor: data.gender,
              gender_lable: data.gender == 1 ? "Male" : data.gender == 2 ? "Female" : data.gender == 3 ? "Other" : "NA",
              mobile: data.mobile,
              phone_code: "33",
              user_type: data.user_type,
              user_type_lable: "0=admin,1=user",
              diseaseName: data.diseases,
              active_flag: data.active_flag,
              delete_flag: data.delete_flag,
              createtime: moment(data.createtime).format("DD-MM-YYYY hh:mm A"),
              disease_names: diseaseNames.join(", ")
            }];

            return response.status(200).json({
              success: true,
              msg: languageMessages.msgDataFound,
              res: user_arr,
            });
          };

          if (diseaseIdsRaw) {
            const diseaseIds = diseaseIdsRaw.split(",").map(id => parseInt(id)).filter(id => !isNaN(id));

            if (diseaseIds.length > 0) {
              const getDiseasesQuery = `SELECT disease_name FROM disease_master WHERE disease_id IN (?)`;

              connection.query(getDiseasesQuery, [diseaseIds], (err, diseaseResult) => {
                if (err) {
                  return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });
                }

                const diseaseNames = diseaseResult.map(d => d.disease_name);
                buildUserResponse(diseaseNames);
              });
            } else {
              buildUserResponse([]);
            }
          } else {
            buildUserResponse([]);
          }
        }
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: error.message,
    });
  }
};



const getAllDeletedUser = async (request, response) => {
  try {
    const sqlCheckUser =
      "SELECT user_id, login_type, user_type,name, f_name, l_name, name, dob, age, phone_code, mobile, otp, otp_verify, email, password, image, address, latitude, longitude, zipcode, active_flag, gender,notification_status,delete_reason, instagram_id, createtime, updatetime FROM user_master WHERE delete_flag = 1  order by user_id desc";

    connection.query(sqlCheckUser, async (err, userResult) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }

      var user_arr = [];

      if (userResult.length <= 0) {
        return response
          .status(200)
          .json({
            success: true,
            msg: languageMessages.msgDataFound,
            user_arr: [],
          });
      }

      var s_no = 0;

      if (userResult.length > 0) {
        for (var data of userResult) {
          s_no++;

          user_arr.push({
            s_no: s_no,

            user_id: data.user_id,

            username: data.username,

            f_name: data.f_name,

            l_name: data.l_name,

            name: data.name,

            email: data.email,

            image: data.image,

            address: data.address,

            latitude: data.latitude,

            longitude: data.longitude,

            mobile: data.mobile,

            delete_reason: data.delete_reason ? data.delete_reason : "NA",

            active_flag: data.active_flag,

            createtime: moment(data.updatetime).format("DD-MM-YYYY HH:mm A"),

            active_flag_lable:
              data.active_flag == 1 ? "Activate" : "Deactivate",
          });
        }

        return response
          .status(200)
          .json({
            success: true,
            msg: languageMessages.msgDataFound,
            user_arr: user_arr.length > 0 ? user_arr : [],
          });
      }
    });
  } catch (error) {
    return response
      .status(200)
      .json({ success: false, msg: languageMessages.msgDataFound });
  }
};

const getDoctorSpecialization = async (request, response) => {
  try {
    const DoctorSpecializationSql =
      "SELECT * FROM doctor_category WHERE delete_flag = 0 ORDER by doctor_category_id desc";

    connection.query(
      DoctorSpecializationSql,
      async (err, DoctorSpecializationResult) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              err: err.message,
            });
        }

        const DoctorSpecialization_arr = [];

        if (DoctorSpecializationResult.length <= 0) {
          return response
            .status(200)
            .json({
              success: true,
              msg: languageMessages.msgDataFound,
              DoctorSpecialization_arr: [],
            });
        }

        var s_no = 0;

        if (DoctorSpecializationResult.length > 0) {
          for (var data of DoctorSpecializationResult) {
            s_no++;

            DoctorSpecialization_arr.push({
              s_no: s_no,

              doctor_specialization_id: data.doctor_category_id,

              doctor_specialization_name: data.category_name,

              delete_flag: data.delete_flag,


              createtime: moment(data.createtime)
                .tz("Europe/Paris")
                .format("DD-MM-YYYY hh:mm A"),

              updatetime: moment(data.updatetime)
                .tz("Europe/Paris")
                .format("DD-MM-YYYY hh:mm A"),
            });
          }

          return response
            .status(200)
            .json({
              success: true,
              msg: languageMessages.msgDataFound,
              DoctorSpecialization_arr: DoctorSpecialization_arr,
            });
        }
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({ success: false, msg: languageMessages.internalServerError });
  }
};

const addDoctorSpecialization = async (request, response) => {
  try {
    const { category_name } = request.body;

    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }

    // Check if category_name already exists

    const checkSql =
      "SELECT doctor_category_id  FROM doctor_category WHERE category_name = ? AND delete_flag = 0";

    connection.query(checkSql, [category_name], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryExists });
      }

      // Insert new category if not exists

      const insertSql =
        "INSERT INTO doctor_category (category_name, createtime,updatetime) VALUES (?, ?,now())";

      connection.query(insertSql, [category_name, createtime], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.categoryAdded });
      });
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editDoctorSpecialization = async (request, response) => {
  try {
    const { doctor_specialization_id, category_name } = request.body;

    if (!doctor_specialization_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_specialization_id",
        });
    }

    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }

    // Check if category_name already exists

    const checkSql =
      "SELECT doctor_category_id FROM doctor_category WHERE category_name = ? AND doctor_category_id != ? AND delete_flag = 0";

    connection.query(
      checkSql,
      [category_name, doctor_specialization_id],
      (err, results) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        if (results.length > 0) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.categoryAlreadyExists,
            });
        }

        const sql =
          "UPDATE doctor_category SET category_name = ? , updatetime = ? WHERE doctor_category_id = ?";

        connection.query(
          sql,
          [category_name, updatetime, doctor_specialization_id],
          (err) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  error: err.message,
                });
            }

            response
              .status(200)
              .json({ success: true, msg: languageMessages.DetailsUpdated });
          }
        );
      }
    );
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteDoctorSpecialization = async (request, response) => {
  try {
    const { doctor_specialization_id } = request.body;

    if (!doctor_specialization_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_specialization_id",
        });
    }

    // Check if doctor_specialization_id exists

    const checkSql =
      "SELECT doctor_category_id FROM doctor_category WHERE doctor_category_id = ? AND delete_flag = 0";

    connection.query(checkSql, [doctor_specialization_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.msgDataNotFound });
      }

      const sql =
        "UPDATE doctor_category SET delete_flag = 1,updatetime=?  WHERE doctor_category_id = ?";

      connection.query(sql, [updatetime, doctor_specialization_id], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.deleteCatgory });
      });
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getAllDoctor = async (request, response) => {
  try {
    const sql =
      "SELECT d.approve_status, d.active_flag, d.doctor_id,d.doctor_name,d.image,d.mobile,d.email,c.category_name,d.createtime,d.updatetime FROM doctor_master as d JOIN doctor_category as c on d.doctor_category_id=c.doctor_category_id WHERE d.delete_flag=0 ORDER by d.doctor_id desc;";

    connection.query(sql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const Doctor_arr = [];

      var s_no = 0;

      results.forEach((doctor) => {
        s_no++;

        Doctor_arr.push({
          s_no: s_no,

          doctor_id: doctor.doctor_id,

          image: doctor.image,

          doctor_name: doctor.doctor_name,

          mobile: doctor.mobile,

          email: doctor.email,

          category_name: doctor.category_name,

          approve_status: doctor.approve_status,

          active_flag: doctor.active_flag,

          approve_status_lable:
            doctor.approve_status == 1 ? "Approved" : "Pending",

          createtime: moment(doctor.createtime).format("DD-MM-YYYY hh:mm A"),
        });
      });

      response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          data: Doctor_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getAllDeletedDoctor = async (request, response) => {
  try {
    const sql =
      "SELECT d.approve_status, d.doctor_id,d.doctor_name,d.image,d.mobile,d.email,c.category_name,d.createtime,d.updatetime,d.delete_reason FROM doctor_master as d JOIN doctor_category as c on d.doctor_category_id=c.doctor_category_id WHERE d.delete_flag=1 ORDER by d.doctor_id desc;";

    connection.query(sql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const Doctor_arr = [];

      var s_no = 0;

      results.forEach((doctor) => {
        s_no++;

        Doctor_arr.push({
          s_no: s_no,

          doctor_id: doctor.doctor_id,

          image: doctor.image,

          doctor_name: doctor.doctor_name,

          mobile: doctor.mobile,

          email: doctor.email,

          category_name: doctor.category_name,

          approve_status: doctor.approve_status,
          delete_reason: doctor.delete_reason,

          approve_status_lable:
            doctor.approve_status == 1 ? "Approved" : "Pending",

          createtime: moment(doctor.createtime).format("DD-MM-YYYY HH:mm A"),
        });
      });

      response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          data: Doctor_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};


// OLD API

const addDoctor = async (request, response) => {
  try {
    const { doctor_name, mobile, email, doctor_category_id } = request.body;
    const image = request.file ? request.file.filename : null;

    // Validation
    if (!doctor_name) return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_name" });
    if (!mobile) return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "mobile" });
    if (!email) return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "email" });
    if (!doctor_category_id) return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_category_id" });

    // Default password
    const password = "123456";
    const hashedPass = await hashPassword(password);

    // Check if doctor already exists
    const checkSql = `SELECT * FROM doctor_master WHERE (mobile = ? OR email = ?) AND delete_flag = 0`;
    connection.query(checkSql, [mobile, email], async (checkErr, checkResults) => {
      if (checkErr) return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: checkErr.message });
      if (checkResults.length > 0) return response.status(200).json({ success: false, msg: languageMessages.doctorAlreadyExists });

      // Insert new doctor
      const sql = `INSERT INTO doctor_master (doctor_name, mobile, email, password, doctor_category_id, image, approve_status, createtime, updatetime) VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`;
      const values = [doctor_name, mobile, email, hashedPass, doctor_category_id, image];

      connection.query(sql, values, async (err, result) => {
        if (err) return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });

        // Send email with login info
        try {
          await sendDoctorEmail(email, doctor_name, password);
          response.status(200).json({ success: true, msg: languageMessages.doctorAddSuccessfully + " & Email sent." });
        } catch (emailErr) {
          response.status(200).json({ success: true, msg: languageMessages.doctorAddSuccessfully + " but failed to send email.", error: emailErr.message });
        }
      });
    });
  } catch (error) {
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });
  }
};



const addFromWebsiteDoctor = async (request, response) => {
  try {
    const { doctor_name, mobile, email, doctor_category_id } = request.body;
    const image = request.file ? request.file.filename : null;

    // Validation
    if (!doctor_name || !mobile || !email || !doctor_category_id) {
      return response.status(400).json({
        success: false,
        msg: "Missing required fields",
        key: !doctor_name ? "doctor_name" :
          !mobile ? "mobile" :
            !email ? "email" : "doctor_category_id",
      });
    }

    const categoryId = parseInt(doctor_category_id);
    if (isNaN(categoryId)) {
      return response.status(400).json({
        success: false,
        msg: "doctor_category_id must be a number",
        key: "doctor_category_id",
      });
    }

    const hashedPass = await hashPassword("123456");

    // Check if doctor exists
    const existingDoctor = await new Promise((resolve, reject) => {
      const checkSql = `SELECT * FROM doctor_master WHERE (mobile = ? OR email = ?) AND delete_flag = 0`;
      connection.query(checkSql, [mobile, email], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (existingDoctor.length > 0) {
      return response.status(409).json({
        success: false,
        msg: "Doctor with this email/mobile already exists",
      });
    }

    // Insert new doctor
    const insertResult = await new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO doctor_master 
        (doctor_name, mobile, email, password, doctor_category_id, image, approve_status, createtime, updatetime) 
        VALUES (?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 19800 SECOND), DATE_ADD(NOW(), INTERVAL 19800 SECOND))
      `;
      connection.query(sql, [doctor_name, mobile, email, hashedPass, categoryId, image], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    response.status(201).json({
      success: true,
      msg: "Doctor added successfully",
      doctor_id: insertResult.insertId,
    });

  } catch (error) {
    console.error("Unexpected Error:", error);
    response.status(500).json({
      success: false,
      msg: "Internal server error",
      error: error.message,
    });
  }
};


const editDoctor = async (request, response) => {
  try {
    const { doctor_id, doctor_name, mobile, email, doctor_category_id } =
      request.body;

    if (!doctor_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_id",
        });
    }
    if (!doctor_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_name",
        });
    }
    if (!mobile) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "mobile",
        });
    }
    if (!email) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "email",
        });
    }
    if (!doctor_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_category_id",
        });
    }
    const image = request.file ? request.file.filename : null;

    const checkSql = `SELECT * FROM doctor_master WHERE (mobile = ? OR email = ?) AND doctor_id != ? AND delete_flag = 0`;
    connection.query(
      checkSql,
      [mobile, email, doctor_id],
      (checkErr, checkResults) => {
        if (checkErr)
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: checkErr.message,
            });

        if (checkResults.length > 0) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.doctorAlreadyExists,
            });
        }

        const sql = `UPDATE doctor_master SET doctor_name = ?, mobile = ?, email = ?, doctor_category_id = ?, image= ?,updatetime = NOW() WHERE doctor_id = ?`;
        const values = [
          doctor_name,
          mobile,
          email,
          doctor_category_id,
          image,
          doctor_id,
        ];

        connection.query(sql, values, (err, result) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          if (result.affectedRows === 0) {
            return response
              .status(200)
              .json({ success: false, msg: languageMessages.msgDataNotFound });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.doctorUpdated });
        });
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteDoctor = async (request, response) => {
  try {
    const { doctor_id } = request.body;

    if (!doctor_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "doctor_id",
        });
    }

    const sql = `UPDATE doctor_master SET delete_flag = 1, updatetime = NOW() WHERE doctor_id = ?`;

    connection.query(sql, [doctor_id], (err, result) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (result.affectedRows === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.msgDataNotFound });
      }

      response
        .status(200)
        .json({ success: true, msg: languageMessages.doctorDeleteSucessfully });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getAllMedicine = async (request, response) => {
  try {
    // const sql =
    //   "SELECT medicine_id,medicine_name,description,createtime,updatetime FROM medicine_master WHERE delete_flag=0 ORDER BY medicine_id desc";

    const sql =
      "SELECT m.medicine_id, m.medicine_name, m.description, m.createtime, m.updatetime, CONCAT(u.f_name,' ',u.l_name) AS patient_name FROM medicine_master m LEFT JOIN medication_master mm ON mm.medicine_id = m.medicine_id LEFT JOIN user_master u ON u.user_id = mm.user_id WHERE m.delete_flag = 0 ORDER BY m.medicine_id DESC;";

    connection.query(sql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const medicine_arr = [];

      var s_no = 0;

      results.forEach((medicine) => {
        s_no++;

        medicine_arr.push({
          s_no: s_no,

          medicine_id: medicine.medicine_id,
          patient_name: medicine.patient_name, 
          medicine_name: medicine.medicine_name,

          medicine_description: medicine.description,

          createtime: moment(medicine.createtime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),

          updatetime: moment(medicine.updatetime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),
        });
      });

      response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          data: medicine_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const addMedicine = async (request, response) => {
  try {
    const { medicine_name, description } = request.body;

    if (!medicine_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_name",
        });
    }

    if (!description) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "description",
        });
    }

    // Check if medicine_name already exists

    const checkSql =
      "SELECT medicine_id FROM medicine_master WHERE medicine_name = ? AND delete_flag = 0";

    connection.query(checkSql, [medicine_name], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.medicineExists, key: 'Exists' });
      }

      // Insert new medicine if not exists

      const sql =
        "INSERT INTO medicine_master (medicine_name, description, createtime,updatetime) VALUES (?,?, ?,now())";

      connection.query(sql, [medicine_name, description, createtime], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.medicineAdded });
      });
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editMedicine = async (request, response) => {
  try {
    const { medicine_id, medicine_name, description } = request.body;

    if (!medicine_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_id",
        });
    }

    if (!medicine_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_name",
        });
    }
    if (!description) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "description",
        });
    }

    // Check if medicine_name already exists

    const checkSql =
      "SELECT medicine_id FROM medicine_master WHERE medicine_name = ? AND medicine_id != ? AND delete_flag = 0";

    connection.query(checkSql, [medicine_name, medicine_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.medicineExists });
      }

      const sql =
        "UPDATE medicine_master SET medicine_name = ?, description = ? WHERE medicine_id = ?";

      connection.query(
        sql,
        [medicine_name, description, medicine_id],
        (err) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.medicineUpdated });
        }
      );
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteMedicine = async (request, response) => {
  try {
    const { medicine_id } = request.body;

    if (!medicine_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_id",
        });
    }

    // Check if medicine_id exists

    const checkSql =
      "SELECT medicine_id FROM medicine_master WHERE medicine_id = ? AND delete_flag = 0";

    connection.query(checkSql, [medicine_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.medicineNotFound });
      }

      const sql =
        "UPDATE medicine_master SET delete_flag = 1 WHERE medicine_id = ?";

      connection.query(sql, [medicine_id], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.medicineDeleted });
      });
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getdisease = async (request, response) => {
  try {
    const getDiseaseSql =
      "SELECT disease_id, disease_name,description,createtime,updatetime FROM disease_master WHERE delete_flag = 0 Order by disease_id desc";

    connection.query(getDiseaseSql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const disease_arr = [];

      var s_no = 0;

      results.forEach((item) => {
        s_no++;

        disease_arr.push({
          s_no: s_no,

          disease_id: item.disease_id,

          disease_name: item.disease_name,

          description: item.description,

          createtime: moment(item.createtime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),

          updatetime: moment(item.updatetime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),
        });
      });

      response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.diseaseList,
          data: disease_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const addDisease = async (request, response) => {
  try {
    const { disease_name, description } = request.body;

    if (!disease_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "disease_name",
        });
    }

    if (!description) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "description",
        });
    }

    // Check if disease_name already exists

    const checkSql =
      "SELECT disease_id FROM disease_master WHERE disease_name = ? AND delete_flag = 0";

    connection.query(checkSql, [disease_name], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.diseaseExists });
      }

      // Insert new disease if not exists

      const addDiseaseSql =
        "INSERT INTO disease_master (disease_name, description, createtime,updatetime) VALUES (?, ?, ?,now())";

      connection.query(
        addDiseaseSql,
        [disease_name, description, createtime],
        (err) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.diseaseAdded });
        }
      );
    });
  } catch (error) {
    response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editDisease = async (request, response) => {
  try {
    const { disease_id, disease_name, description } = request.body;

    if (!disease_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "disease_id",
        });
    }

    if (!disease_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "disease_name",
        });
    }

    if (!description) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "description",
        });
    }

    // Check if disease_name already exists

    const checkDiseaseSql =
      "SELECT disease_id FROM disease_master WHERE disease_name = ? AND disease_id != ? AND delete_flag = 0";

    connection.query(
      checkDiseaseSql,
      [disease_name, disease_id],
      (err, results) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        if (results.length > 0) {
          return response
            .status(200)
            .json({ success: false, msg: languageMessages.diseaseExists });
        }

        const updateDiseaseSql =
          "UPDATE disease_master SET disease_name = ?, description = ?, updatetime=? WHERE disease_id = ?";

        const updatetime = new Date();

        connection.query(
          updateDiseaseSql,
          [disease_name, description, updatetime, disease_id],
          (err) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  error: err.message,
                });
            }

            response
              .status(200)
              .json({ success: true, msg: languageMessages.diseaseUpdated });
          }
        );
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteDisease = async (request, response) => {
  try {
    const { disease_id } = request.body;

    if (!disease_id) {
      return response
        .status(200)
        .json({ success: false, msg: languageMessages.missingFields });
    }

    // Check if disease_id exists

    const checkDiseaseSql =
      "SELECT disease_id FROM disease_master WHERE disease_id = ? AND delete_flag = 0";

    connection.query(checkDiseaseSql, [disease_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.diseaseNotFound });
      }

      const deleteDiseaseSql =
        "UPDATE disease_master SET delete_flag = 1, updatetime=? WHERE disease_id = ?";

      const updatetime = new Date();

      connection.query(deleteDiseaseSql, [updatetime, disease_id], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.diseaseDeleted });
      });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getAllSymptoms = async (request, response) => {
  try {
    const getsymptomsql = `SELECT symptom_id,symptom_name,description,createtime FROM symptoms_master WHERE delete_flag=0 ORDER BY symptom_id DESC`;

    connection.query(getsymptomsql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const symptom_arr = [];

      var s_no = 0;

      results.forEach((symptom) => {
        s_no++;

        symptom_arr.push({
          s_no: s_no,

          symptom_id: symptom.symptom_id,

          symptom_name: symptom.symptom_name,

          description: symptom.description,

          createtime: symptom.createtime,
        });
      });

      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.symptomsList,
          data: symptom_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const addSymptom = async (request, response) => {
  try {
    const { symptom_name } = request.body;

    if (!symptom_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "symptom_name",
        });
    }


    // Check if symptom_name already exists

    const checkSql =
      "SELECT symptom_id FROM symptoms_master WHERE symptom_name = ? AND delete_flag = 0";

    connection.query(checkSql, [symptom_name], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.symptomExists });
      }

      // Insert new symptom if not exists

      const addSymptomSql =
        "INSERT INTO symptoms_master (symptom_name, createtime) VALUES (?, ?)";

      connection.query(
        addSymptomSql,
        [symptom_name, createtime],
        (err) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.symptomAdded });
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editSymptom = async (request, response) => {
  try {
    const { symptom_id, symptom_name } = request.body;

    if (!symptom_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: " symptom_id",
        });
    }

    if (!symptom_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: " symptom_name",
        });
    }

    // Check if symptom_name already exists

    const checkSymptomSql =
      "SELECT symptom_id FROM symptoms_master WHERE symptom_name = ? AND symptom_id != ? AND delete_flag = 0";

    connection.query(
      checkSymptomSql,
      [symptom_name, symptom_id],
      (err, results) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        if (results.length > 0) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.symptomAlreadyExists,
            });
        }

        const updateSymptomSql =
          "UPDATE symptoms_master SET symptom_name = ?, updatetime=? WHERE symptom_id = ?";

        const updatetime = new Date();

        connection.query(
          updateSymptomSql,
          [symptom_name, updatetime, symptom_id],
          (err) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  error: err.message,
                });
            }

            response
              .status(200)
              .json({ success: true, msg: languageMessages.symptomUpdated });
          }
        );
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteSymptom = async (request, response) => {
  try {
    const { symptom_id } = request.body;

    if (!symptom_id) {
      return response
        .status(200)
        .json({ success: false, msg: languageMessages.missingFields });
    }

    // Check if symptom_id exists

    const checkSymptomSql =
      "SELECT symptom_id FROM symptoms_master WHERE symptom_id = ? AND delete_flag = 0";

    connection.query(checkSymptomSql, [symptom_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.symptomNotFound });
      }

      const deleteSymptomSql =
        "UPDATE symptoms_master SET delete_flag = 1 WHERE symptom_id = ?";

      connection.query(deleteSymptomSql, [symptom_id], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.symptomDeleted });
      });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getReportCategory = async (request, response) => {
  try {
    const getReportCategorySql = `SELECT report_category_id,category_name, category_image,createtime FROM report_category WHERE delete_flag=0;`;

    connection.query(getReportCategorySql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const category_arr = [];

      var s_no = 0;

      results.forEach((category) => {
        s_no++;

        category_arr.push({
          s_no: s_no,

          report_category_id: category.report_category_id,

          category_name: category.category_name,

          image: category.category_image,

          createtime: category.createtime,
        });
      });

      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.categorylist,
          data: category_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const addReportCategory = async (request, response) => {
  try {
    const { category_name } = request.body;

    const image = request.file ? request.file.filename : null

    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }
    if (!image) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "image",
        });
    }

    const checkCategorySql =
      "SELECT report_category_id FROM report_category WHERE category_name = ? AND delete_flag = 0";

    connection.query(checkCategorySql, [category_name], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryExists });
      }

      const addCategorySql =
        "INSERT INTO report_category (category_name, category_image, createtime) VALUES (?, ?, ?)";

      connection.query(addCategorySql, [category_name, image, createtime], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.categoryAdded });
      });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editReportCategory = async (request, response) => {
  try {
    const { report_category_id, category_name } = request.body;

    const image = request.file ? request.file.filename : null

    if (!report_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "report_category_id",
        });
    }

    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }

    const checkCategorySql =
      "SELECT report_category_id FROM report_category WHERE category_name = ? AND report_category_id != ? AND delete_flag = 0";

    connection.query(
      checkCategorySql,
      [category_name, report_category_id],
      (err, results) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        if (results.length > 0) {
          return response
            .status(200)
            .json({ success: false, msg: languageMessages.categoryExists });
        }

        const editCategorySql =
          "UPDATE report_category SET category_name = ?, category_image = ?, updatetime = ? WHERE report_category_id = ?";

        connection.query(
          editCategorySql,
          [category_name, image, updatetime, report_category_id],
          (err) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  error: err.message,
                });
            }

            response
              .status(200)
              .json({ success: true, msg: languageMessages.categoryUpdated });
          }
        );
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteReportCategory = async (request, response) => {
  try {
    const { report_category_id } = request.body;

    if (!report_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "report_category_id",
        });
    }

    const checkCategorySql =
      "SELECT report_category_id FROM report_category WHERE report_category_id = ? AND delete_flag = 0";

    connection.query(checkCategorySql, [report_category_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryNotFound });
      }

      const deleteCategorySql =
        "UPDATE report_category SET delete_flag = 1, updatetime = ? WHERE report_category_id = ?";

      connection.query(
        deleteCategorySql,
        [updatetime, report_category_id],
        (err) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.categoryDeleted });
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const getFaq = async (request, response) => {
  try {
    const getsql = `SELECT faq_id,question,	user_type, answer, DATE_FORMAT(createtime, '%d-%m-%y, %h:%i %p') AS createtime
 FROM faq_master WHERE delete_flag=0 ORDER BY faq_id DESC`;

    connection.query(getsql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const faq_arr = [];

      var s_no = 0;

      results.forEach((faq) => {
        s_no++;

        faq_arr.push({
          s_no: s_no,
          faq_id: faq.faq_id,
          user_type: faq.user_type,
          user_type_label: (faq.user_type == 1) ? "User" : (faq.user_type == 2) ? "Doctor" : "NA",
          question: faq.question,
          answer: faq.answer,
          createtime: faq.createtime,
        });
      });

      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.faqlist,
          data: faq_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};


const getFaqDoctor = async (request, response) => {
  try {
    const getsql = `SELECT faq_id,question,	user_type, answer, DATE_FORMAT(createtime, '%d-%m-%y, %h:%i %p') AS createtime
 FROM faq_master WHERE delete_flag=0 AND user_type = 2 ORDER BY faq_id DESC`;

    connection.query(getsql, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const faq_arr = [];

      var s_no = 0;

      results.forEach((faq) => {
        s_no++;

        faq_arr.push({
          s_no: s_no,
          faq_id: faq.faq_id,
          user_type: faq.user_type,
          user_type_label: (faq.user_type == 1) ? "User" : (faq.user_type == 2) ? "Doctor" : "NA",
          question: faq.question,
          answer: faq.answer,
          createtime: faq.createtime,
        });
      });

      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.faqlist,
          data: faq_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};
const addFaq = async (request, response) => {
  try {
    const { question, answer, userType } = request.body;

    if (!question) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "question",
        });
    }
    if (!answer) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "answer",
        });
    }
    if (!userType) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "userType",
        });
    }

    const checkCategorySql =
      "SELECT faq_id FROM faq_master WHERE question = ? AND delete_flag = 0";

    connection.query(checkCategorySql, [question], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryExists, key: 'exists' });
      }

      const addCategorySql =
        "INSERT INTO faq_master (question, answer,user_type, createtime) VALUES (?,?,?, ?)";

      connection.query(addCategorySql, [question, answer, userType, createtime], (err) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        response
          .status(200)
          .json({ success: true, msg: languageMessages.categoryAdded });
      });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const editFaq = async (request, response) => {
  try {
    const { faq_id, question, answer, userType } = request.body;

    if (!faq_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "faq_id",
        });
    }

    if (!question || !answer || !userType) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "1",
        });
    }

    const checksql =
      "SELECT faq_id FROM faq_master WHERE question = ? AND faq_id != ? AND delete_flag = 0";

    connection.query(
      checksql,
      [question, faq_id],
      (err, results) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: err.message,
            });
        }

        if (results.length > 0) {
          return response
            .status(200)
            .json({ success: false, msg: 'Faq already exist', key: 'exists' });
        }

        const updatesqls =
          "UPDATE faq_master SET question = ?, answer = ?,user_type = ?, updatetime = ? WHERE faq_id = ?";

        connection.query(
          updatesqls,
          [question, answer, userType, updatetime, faq_id],
          (err) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  error: err.message,
                });
            }

            response
              .status(200)
              .json({ success: true, msg: languageMessages.categoryUpdated });
          }
        );
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const deleteFaq = async (request, response) => {
  try {
    const { faq_id } = request.body;

    if (!faq_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "faq_id",
        });
    }

    const checkCategorySql =
      "SELECT faq_id FROM faq_master WHERE faq_id = ? AND delete_flag = 0";

    connection.query(checkCategorySql, [faq_id], (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (results.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryNotFound });
      }

      const deleteCategorySql =
        "UPDATE faq_master SET delete_flag = 1, updatetime = ? WHERE faq_id = ?";

      connection.query(
        deleteCategorySql,
        [updatetime, faq_id],
        (err) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
          }

          response
            .status(200)
            .json({ success: true, msg: languageMessages.categoryDeleted });
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

//========================================================================

const getHelpAndSupport = async (request, response) => {
  try {
    const query = `SELECT contact_id,user_type ,user_id, name, email, message, status, createtime,reply_datetime FROM contact_us_master ORDER BY createtime DESC`;

    connection.query(query, (err, results) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            error: err.message,
          });
      }

      const help_and_support_arr = [];

      var s_no = 0;

      results.forEach((result) => {
        s_no++;

        help_and_support_arr.push({
          s_no: s_no,
          contact_id: result.contact_id,

          user_id: result.user_id,

          user_type: result.user_type,

          user_type_label: (result.user_type == 2) ? "Doctor" : "User",

          name: result.name,

          email: result.email,

          message: result.message,

          status: result.status,
          reply_datetime: moment(result.reply_datetime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),


          createtime: moment(result.createtime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A")
        });
      });

      response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.helpAndSupport,
          data: help_and_support_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        error: error.message,
      });
  }
};

const sendReply = async (request, response) => {
  const { contact_id, reply, title } = request.body;

  try {
    if (!contact_id) {
      return response.status(200).json({
        success: false,

        message: languageMessages.msg_empty_param,

        key: "contact_id",
      });
    }

    if (!reply) {
      return response.status(200).json({
        success: false,

        message: languageMessages.msg_empty_param,

        key: "reply",
      });
    }

    if (!title) {
      return response.status(200).json({
        success: false,

        message: languageMessages.msg_empty_param,

        key: "title",
      });
    }

    //check mail exist

    const checkAdmin = 'SELECT email FROM user_master WHERE user_type = 0 AND delete_flag = 0';
    connection.query(checkAdmin, async (adminError, adminResult) => {
      if (adminError) {
        return response.status(200).json({success: false, message: languageMessages.internalServerError, error: adminError.message });
      }
      
        let admin_contact = adminResult[0].email;
      
    const sql =
      "SELECT contact_id ,email, user_id, name FROM contact_us_master WHERE contact_id = ? AND delete_flag=0 ORDER BY contact_id  DESC";

    connection.query(sql, [contact_id], async (err, info) => {
      if (err) {
        return response.status(200).json({
          success: false,

          message: languageMessages.internalServerError,

          error: err.message,
        });
      }
      if (info.length <= 0) {
        return response.status(200).json({
          success: false,

          message: languageMessages.msgDataNotFound,

          key: "contact",
        });
      }
      const userName = info[0].name;
      const email = info[0].email;

      //send mail start

      const postData = {
        fromName: "Meditrek",

        userEmail: email,

        app_name: "Meditrek",

        app_logo:
          "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png",

        message: reply,

        title: title,

        mailContent: `<p>Dear ${userName}, <br>
              Thank you for reaching out to us. We have received your message, and our team has reviewed your inquiry.<br>
            
              ${reply}  <br>
            
              If you have any further questions or need additional assistance,
              please don’t hesitate to reply to this email or contact us at - ${admin_contact}.<br>
              We appreciate your patience and look forward to helping you resolve this matter.
            
              </p>`,
      };

      console.log("app name", postData.message);

      try {
        await contactUsMailer(postData).then(async (data) => {
          if (data.status === "yes") {
            //update replied date time

            const repliedsql =
              "UPDATE contact_us_master SET status = 1, reply = ?, reply_datetime = ? WHERE contact_id = ?";

            connection.query(
              repliedsql,
              [postData.message, createtime, contact_id],
              (repliedError, repliedResult) => {
                if (repliedError) {
                  return response.status(200).json({
                    success: false,

                    message: languageMessages.internalServerError,

                    error: repliedError.message,
                  });
                }

                if (repliedResult.affectedRows > 0) {
                  return response.status(200).json({
                    success: true,

                    message: languageMessages.EmailSent,

                    info: info,
                  });
                }
              }
            );
          } else {
            return response.status(200).json({
              success: false,

              message: languageMessages.emailNotSent,
            });
          }
        });
      } catch (mailError) {
        return response.status(200).json({
          success: false,

          message: languageMessages.emailNotSent,

          error: mailError.message,
        });
      }
    });
  })
  } catch (err) {
    return response.status(200).json({
      success: false,

      message: languageMessages.internalServerError,

      error: err.message,
    });
  }
};


const sendMessageByDoctorToAdmin = async (request, response) => {
  const { doctor_id, name, email, reply } = request.body;

  try {
    if (!doctor_id) {
      return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_id" });
    }

    if (!name) {
      return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "name" });
    }
    if (!email) {
      return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "email" });
    }

    if (!reply) {
      return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "reply" });
    }


    //check mail exist
    connection.query("SELECT user_id,email,name FROM user_master WHERE user_type = 0 AND delete_flag = 0", async (error, resultAdmin) => {
      if (error) {
        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });
      }
      if (resultAdmin.length > 0) {
        const userName = resultAdmin[0].name;
        const AdminEmail = resultAdmin[0].email;

        const postData = {
          fromName: userName,
          userEmail: AdminEmail,
          app_name: "Meditrek",
          app_logo: "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png",
          message: reply,
          // title: title,
          mailContent: `<pre>Dear ${userName},
You have received a new message from Dr. ${name}.
Email : ${email}
Message:
${reply}
Please review this query and respond at your earliest convenience.</pre>`,
        };
        try {
          await contactUsMailerDoctor(postData).then(async (data) => {
            if (data.status === "yes") {
              const repliedsql = "INSERT INTO contact_us_master(user_id,user_type,email,name,message,updatetime,createtime) VALUES (?,?,?,?,?,NOW(),NOW())";
              connection.query(repliedsql, [doctor_id, 2, email, name, reply], (repliedError, repliedResult) => {
                if (repliedError) {
                  return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: repliedError.message });
                }

                if (repliedResult.affectedRows > 0) {
                  return response.status(200).json({ success: true, message: languageMessages.EmailSent });
                }
              }
              );
            } else {
              return response.status(200).json({ success: false, message: languageMessages.emailNotSent });
            }
          });
        } catch (mailError) {
          return response.status(200).json({ success: false, message: languageMessages.emailNotSent, error: mailError.message });
        }
      } else {

      }
    })


  } catch (err) {
    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });
  }
};

const sendBroadcastMessageAllUser = async (request, response) => {
  const { title_user, message_user, userType, select_arr } = request.body;

  try {
    if (!title_user) {
      return response
        .status(200)
        .json({
          status: false,
          msg: languageMessages.msg_empty_param,
          key: "title_user",
        });
    }

    if (!message_user) {
      return response
        .status(200)
        .json({
          status: false,
          msg: languageMessages.msg_empty_param,
          key: "message_user",
        });
    }

    if (!userType) {
      return response
        .status(200)
        .json({
          status: false,
          msg: languageMessages.msg_empty_param,
          key: "userType",
        });
    }

    if (userType == "user") {
      if (!select_arr) {
        return response
          .status(200)
          .json({
            status: false,
            msg: languageMessages.msg_empty_param,
            key: "select_arr",
          });
      }
    }

    if (userType == "user") {
      if (select_arr.length > 0) {
        for (var user_id of select_arr) {
          const user_id_notification = 1;

          const other_user_id_notification = user_id;

          const action = "Broadcast";

          const action_id = user_id;

          const title = title_user;

          const title_2 = title_user;

          const title_3 = title_user;

          const title_4 = title_user;

          const title_5 = title_user;

          const messages = message_user;

          const message_2 = message_user;

          const message_3 = message_user;

          const message_4 = message_user;

          const message_5 = message_user;

          const action_data = {
            user_id: user_id_notification,
            other_user_id: other_user_id_notification,
            action_id: action_id,
            action: action,
          };

          getNotificationArrSingle(
            user_id_notification,
            other_user_id_notification,
            action,
            action_id,
            title,
            title_2,
            title_3,
            title_4,
            title_5,
            messages,
            message_2,
            message_3,
            message_4,
            message_5,
            action_data,
            async (notification_arr_check) => {
              let notification_arr_check_new = [notification_arr_check];
              if (
                notification_arr_check_new &&
                notification_arr_check_new.length !== 0
              ) {
                const notiSendStatus = await oneSignalNotificationSendCall(
                  notification_arr_check_new
                );

                return response
                  .status(200)
                  .json({
                    success: true,
                    msg: "Broadcast Message Sent Successfully",
                    notiSendStatus: notiSendStatus,
                    notification_arr_check_new: notification_arr_check_new,
                  });
              }
            }
          );

          // send notification end
        }
      } else {
        return response
          .status(200)
          .json({
            success: true,
            msg: "Broadcast Message Sent Successfully",
            key: select_arr,
            key: "user",
          });
      }
    } else {
      var sqlSeletUser =
        "SELECT user_id FROM user_master WHERE delete_flag = 0 AND profile_complete = 1 AND user_type = 1 AND otp_verify = 1 order by user_id desc";

      connection.query(sqlSeletUser, async (error, resultUser) => {
        if (error) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              error: error.message,
            });
        }

        if (resultUser.length > 0) {
          for (var data of resultUser) {
            const user_id_notification = 1;

            const other_user_id_notification = data.user_id;

            const action = "Broadcast";

            const action_id = data.user_id;

            const title = title_user;

            const title_2 = title_user;

            const title_3 = title_user;

            const title_4 = title_user;

            const title_5 = title_user;

            const messages = message_user;

            const message_2 = message_user;

            const message_3 = message_user;

            const message_4 = message_user;

            const message_5 = message_user;

            const action_data = {
              user_id: user_id_notification,
              other_user_id: other_user_id_notification,
              action_id: action_id,
              action: action,
            };

            getNotificationArrSingle(
              user_id_notification,
              other_user_id_notification,
              action,
              action_id,
              title,
              title_2,
              title_3,
              title_4,
              title_5,
              messages,
              message_2,
              message_3,
              message_4,
              message_5,
              action_data,
              async (notification_arr_check) => {
                let notification_arr_check_new = [notification_arr_check];

                if (
                  notification_arr_check_new &&
                  notification_arr_check_new.length !== 0
                ) {
                  const notiSendStatus = await oneSignalNotificationSendCall(
                    notification_arr_check_new
                  );

                  return response
                    .status(200)
                    .json({
                      success: true,
                      msg: "Broadcast Message Sent Successfully",
                      notification_arr_check_new: notification_arr_check_new,
                    });
                }

                return response
                  .status(200)
                  .json({
                    success: true,
                    msg: "Broadcast Message Sent Successfully...!!",
                  });
              }
            );

            // send notification end
          }
        } else {
          return response
            .status(200)
            .json({
              success: true,
              msg: "Broadcast Message Sent Successfully",
              key: "all",
            });
        }
      });
    }
  } catch (error) {
    const record = {
      success: false,
      msg: languageMessages.internalServerError,
      key: error,
    };
    s;

    return res.json(record);
  }
};

const getTabularUser = async (request, response) => {
  const { from_date, to_date } = request.query;

  try {
    if (!from_date) {
      return response
        .status(200)
        .json({
          status: true,
          msg: languageMessages.msg_empty_param,
          key: "from_date",
        });
    }

    if (!to_date) {
      return response
        .status(200)
        .json({
          status: true,
          msg: languageMessages.msg_empty_param,
          key: "to_date",
        });
    }

    var sqlSelect = `SELECT * FROM user_master  WHERE delete_flag = 0 AND profile_complete = 1 AND otp_verify = 1 AND user_type = 1  AND Date(createtime) BETWEEN ? AND ?  ORDER BY user_id DESC`;

    connection.query(sqlSelect, [from_date, to_date], (err, result) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      var user_arr = [];

      if (result.length <= 0) {
        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          user_arr: user_arr,
        });
      }

      // if (result.length > 0) {

      var s_no = 0;

      if (result.length > 0) {
        for (var data of result) {
          s_no++;

          user_arr.push({
            s_no: s_no,

            user_id: data.user_id,

            username: data.username,

            f_name: data.f_name,

            l_name: data.l_name,

            name: data.name,

            email: data.email,

            image: data.image,

            mobile: data.mobile,

            active_flag: data.active_flag,

            active_flag_lable:
              data.active_flag == 1 ? "Activate" : "Deactivate",

            createtime: moment(data.createtime)
              .tz("Europe/Paris")
              .format("DD-MM-YYYY hh:mm A"),
          });
        }

        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          user_arr: user_arr.length > 0 ? user_arr : "NA",
        });
      }
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const get_medicine_types = async (request, response) => {
  try {
    const type = `SELECT medicine_category_id,category_name,createtime FROM medicine_category_master WHERE delete_flag=0`;
    connection.query(type, (err, rows) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      var medicine_type_arr = [];
      if (rows.length <= 0) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.msgDataFound,
            medicine_type_arr: medicine_type_arr,
          });
      }
      var s_no = 0;
      if (rows.length > 0) {
        for (var data of rows) {
          s_no++;
          medicine_type_arr.push({
            s_no: s_no,
            medicine_category_id: data.medicine_category_id,
            category_name: data.category_name,
            createtime: moment(data.createtime)
              .tz("Europe/Paris")
              .format("DD-MM-YYYY hh:mm A"),
          });
        }
        return response
          .status(200)
          .json({
            success: true,
            msg: languageMessages.msgDataFound,
            medicine_type_arr: medicine_type_arr,
          });
      }
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const add_medicine_type = async (request, response) => {
  try {
    const { category_name } = request.body;
    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }

    const checkQuery = `SELECT * FROM medicine_category_master WHERE category_name = ? AND delete_flag = 0`;
    connection.query(checkQuery, [category_name], (err, rows) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      if (rows.length > 0) {
        return response
          .status(200)
          .json({ success: false, msg: languageMessages.categoryExits });
      }

      const query = `INSERT INTO medicine_category_master (category_name,createtime ) VALUES (?,NOW())`;
      connection.query(query, [category_name], (err, result) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              err: err.message,
            });
        }
        return response
          .status(200)
          .json({ success: true, msg: languageMessages.categoryAdded });
      });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const update_medicine_type = async (request, response) => {
  try {
    const { medicine_category_id, category_name } = request.body;
    if (!medicine_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_category_id",
        });
    }
    if (!category_name) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "category_name",
        });
    }
    const checkQuery = `SELECT * FROM medicine_category_master WHERE category_name = ? AND medicine_category_id != ? AND delete_flag = 0`;
    connection.query(
      checkQuery,
      [category_name, medicine_category_id],
      (err, rows) => {
        if (err) {
          return response
            .status(200)
            .json({
              success: false,
              msg: languageMessages.internalServerError,
              err: err.message,
            });
        }
        if (rows.length > 0) {
          return response
            .status(200)
            .json({ success: false, msg: languageMessages.categoryExits });
        }

        const query = `UPDATE medicine_category_master SET category_name = ?, updatetime = NOW () WHERE medicine_category_id = ? AND delete_flag = 0`;
        connection.query(
          query,
          [category_name, medicine_category_id],
          (err, result) => {
            if (err) {
              return response
                .status(200)
                .json({
                  success: false,
                  msg: languageMessages.internalServerError,
                  err: err.message,
                });
            }
            return response
              .status(200)
              .json({ success: true, msg: languageMessages.categoryUpdated });
          }
        );
      }
    );
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};
const delete_medicine_type = async (request, response) => {
  try {
    const { medicine_category_id } = request.body;
    if (!medicine_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          msg: languageMessages.msg_empty_param,
          key: "medicine_category_id",
        });
    }

    const query = `UPDATE medicine_category_master SET delete_flag = 1 WHERE medicine_category_id = ? AND delete_flag = 0`;
    connection.query(query, [medicine_category_id], (err, result) => {
      if (err) {
        return response
          .status(500)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      if (result.affectedRows === 0) {
        return response
          .status(404)
          .json({ success: false, msg: languageMessages.msgDataNotFound });
      }
      return response
        .status(200)
        .json({ success: true, msg: languageMessages.categoryDeleted });
    });
  } catch (error) {
    return response
      .status(500)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const getUserAnalyticalReports = async (req, res) => {
  const data = req.query;

  if (!data) {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 1,
    };

    return res.json(record);
  } else if (!data.action) {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 2,
    };

    return res.json(record);
  } else if (data.action !== "get_users_analytical_report") {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 3,
    };

    return res.json(record);
  } else {
    try {
      const month_report_arr = [];

      const year_report_arr = [];

      const month_arr = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const current_year = new Date().getFullYear();

      for (let i = 0; i < month_arr.length; i++) {
        const month_text = month_arr[i];

        const current_month = i + 1;

        const month_user_arr = await getUserAnalyticalReportsFunction(
          "monthly",
          current_year,
          current_month,
          "All"
        );

        month_report_arr.push({
          month: month_text,
          month_user_arr: month_user_arr,
        });
      }

      for (let i = 2020; i <= current_year; i++) {
        const year_user_arr = await getUserAnalyticalReportsFunction(
          "yearly",
          i,
          "",
          "All"
        );

        year_report_arr.push({ year: i, year_user_arr: year_user_arr });
      }

      const record = {
        success: true,
        msg: languageMessages.msgDataFound,
        data: { month_report_arr, year_report_arr },
      };

      return res.json(record);
    } catch (error) {
      const record = {
        success: false,
        msg: languageMessages.internalServerError,
        key: error,
      };

      return res.json(record);
    }
  }
};

async function getUserAnalyticalReportsFunction(
  type,
  current_year,
  current_month,
  get_by_type
) {
  return new Promise((resolve, reject) => {
    let where = "";

    if (type === "monthly") {
      if (get_by_type === "All") {
        where = `AND YEAR(createtime) = ${current_year} AND MONTH(createtime) = ${current_month}`;
      }
    } else if (type === "yearly") {
      if (get_by_type === "All") {
        where = `AND YEAR(createtime) = ${current_year}`;
      }
    }

    const query1 = `SELECT user_id FROM user_master WHERE profile_complete = 1 AND delete_flag = 0 AND user_type != 0 ${where} ORDER BY user_id DESC`;

    connection.query(query1, (error, rows) => {
      if (error) {
        return reject(error); // Reject the promise with the error
      }

      const user_arr = rows.length > 0 ? rows.length : 0;

      resolve(user_arr); // Resolve the promise with the rows
    });
  });
}

const getContent = async (request, response) => {
  const { content_type } = request.query;

  try {
    const delete_flag = 0;

    const value = [delete_flag, content_type];

    const query =
      "SELECT content_id, content_type, content FROM content_master WHERE delete_flag = ? AND content_type = ?";

    connection.query(query, value, (err, info) => {
      if (err) {
        return response.status(200).json({
          success: false,

          message: languageMessages.internalServerError,

          error: err.message,
        });
      }

      let webservice_url = process.env.WEBSERVICE_URL;

      const content_arr = info.map((data) => ({
        content_id: data.content_id,

        content_type: data.content_type,

        content_url: `${webservice_url}get_all_content_url?content_type=${data.content_type}`,

        content: data.content,
      }));

      if (content_arr.length === 0) {
        const content_arr = "NA";

        return response
          .status(200)
          .json({
            success: true,
            message: languageMessages.msgDataFound,
            content_arr,
          });
      }

      return response.status(200).json({
        success: true,

        message: languageMessages.msgDataFound,
        content_arr,
      });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,

      message: languageMessages.internalServerError,

      error: err.message,
    });
  }
};

//get content url

const getContentUrl = (request, response) => {
  const { content_type } = request.query;

  try {
    const query =
      "SELECT content, content_1, content_2 FROM content_master WHERE delete_flag = 0 AND content_type = ?";

    connection.query(query, [content_type], (error, result) => {
      if (error) {
        return response.status(200).json({
          success: false,

          message: languageMessages.internalServerError,

          error: error.message,
        });
      }

      if (result.length === 0) {
        return response.status(200).json({
          success: false,

          message: languageMessages.msgDataNotFound,
        });
      }

      // let content = result[0].content;

      // let new_url = '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' + content + '</body></html>';

      // return response.send(new_url);

      return response.status(200).json({
        success: true,

        message: languageMessages.msgDataFound,

        result: result,
      });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,

      message: languageMessages.internalServerError,

      error: err.message,
    });
  }
};

const updateContent = async (request, response) => {
  const contentType = request.body.contentType;

  const content = request.body.content;

  const language = request.body.lang;

  console.log("Received contentType:", contentType);

  console.log("Received content:", content);

  // Check if contentType or content is missing

  if (contentType === undefined || content === undefined) {
    console.log("Missing parameters");

    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "none",
    });
  }

  // if (language === undefined) {

  //   console.log("Missing parameters");

  //   return response.status(200).json({

  //     success: false,

  //     msg: languageMessages.msg_empty_param,

  //     key: "language",

  //   });

  // }

  const language_type = language === "english" ? "content" : "content";

  try {
    const check =
      "SELECT content_type FROM content_master WHERE content_type = ? AND delete_flag = 0";

    connection.query(check, [contentType], async (err, res) => {
      if (err) {
        console.error("Error executing SELECT query:", err);

        return response

          .status(200)

          .json({ success: false, msg: languageMessages.internalServerError });
      }

      console.log("SELECT query result:", res);

      if (res.length <= 0) {
        return response

          .status(200)

          .json({ success: false, msg: languageMessages.msgDataNotFound });
      }

      const updateQuery = `UPDATE content_master SET ${language_type} = ? WHERE content_type = ?`;

      connection.query(
        updateQuery,

        [content, contentType],

        async (err, res1) => {
          if (err) {
            console.error("Error executing UPDATE query:", err);

            return response.status(200).json({
              success: false,

              msg: languageMessages.internalServerError,
            });
          }

          console.log("UPDATE query result:", res1);

          if (res1.affectedRows > 0) {
            return response

              .status(200)

              .json({ success: true, msg: languageMessages.ContentUpdated });
          } else {
            return response

              .status(200)

              .json({ success: false, msg: "No rows affected" });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error updating content:", error);

    response

      .status(200)

      .json({ success: false, msg: languageMessages.internalServerError });
  }
};

const get_all_count = async (request, response) => {
  try {
    const count = `SELECT 

    (SELECT COUNT(user_id) FROM user_master WHERE user_type !=0 and delete_flag = 0   AND otp_verify = 1 ) AS active_users,

    (SELECT COUNT(user_id) FROM user_master WHERE delete_flag = 1) AS deleted_users,

    (SELECT COUNT(doctor_category_id) FROM doctor_category WHERE delete_flag = 0) AS total_doctor_category,

    (SELECT COUNT(doctor_id) FROM doctor_master WHERE delete_flag = 0) AS total_doctors,

    (SELECT COUNT(medicine_id) FROM medicine_master WHERE delete_flag = 0) AS total_medicine,

    (SELECT COUNT(disease_id) FROM disease_master WHERE delete_flag = 0) AS total_disease,

    (SELECT COUNT(symptom_id) FROM symptoms_master WHERE delete_flag = 0) AS total_symptoms,
    (SELECT COUNT(contact_id) FROM contact_us_master WHERE delete_flag = 0) AS total_contactUs,

    (SELECT COUNT(report_category_id) FROM report_category WHERE delete_flag = 0) AS total_report_category;`;

    connection.query(count, (err, rows) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: error.message,
          });
      }

      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          data: rows[0],
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const fetchUsers = async (request, response) => {
  var fetch =
    "SELECT user_id,name FROM user_master WHERE delete_flag = 0 AND user_type = 1 AND otp_verify = 1 AND  profile_complete = 1 order by user_id desc";

  connection.query(fetch, async (err, res) => {
    if (err) {
      return response
        .status(200)
        .json({ success: false, msg: languageMessages.internalServerError });
    }
    if (res.length <= 0) {
      return response
        .status(200)
        .json({ success: false, msg: "data not foung" });
    }
    if (res.length > 0) {
      return response
        .status(200)
        .json({ success: true, msg: "data foung", res });
    } else {
      return response
        .status(200)
        .json({ success: false, msg: "user not foung" });
    }
  });
};

const fetchdoctorbyuser = async (request, response) => {
  const { user_id } = request.params;
  try {
    const getDoctor = `SELECT d.doctor_id, d.user_id,d.image, d.doctor_name, d.mobile, d.email,d.createtime, dc.category_name FROM patient_master AS pm LEFT JOIN doctor_master AS d ON pm.doctor_id = d.doctor_id LEFT JOIN doctor_category AS dc ON d.doctor_category_id = dc.doctor_category_id WHERE pm.user_id = ?;`;
    connection.query(getDoctor, [user_id], async (err, rows) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      const doctor_arr = [];
      if (rows.length <= 0) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.msgDataNotFound,
            doctor_arr: doctor_arr,
          });
      }
      var s_no = 0;
      rows.forEach((element) => {
        s_no++;
        doctor_arr.push({
          s_no: s_no,
          doctor_id: element.doctor_id,
          user_id: element.user_id,
          image: element.image,
          doctor_name: element.doctor_name,
          category_name: element.category_name,
          mobile: element.mobile,
          email: element.email,
          createtime: moment(element.createtime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),
        });
      });
      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          doctor_arr: doctor_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const getAdverseofUser = async (request, response) => {
  const { user_id } = request.params;
  try {
    const getadverse = `SELECT a.adverse_reaction_id,a.type,a.user_id,m.medicine_name,a.dosage,mm.category_name,a.details,s.symptom_name,a.medication_start_date,a.reaction_date, a.createtime FROM adverse_reaction_master AS a LEFT JOIN medicine_master as m on m.medicine_id=a.medicine_id LEFT JOIN medicine_category_master as mm on mm.medicine_category_id=a.medicine_category_id LEFT JOIN symptoms_master as s on s.symptom_id=a.symptom_id WHERE a.user_id=?
`;
    connection.query(getadverse, [user_id], async (err, rows) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.internalServerError,
            err: err.message,
          });
      }
      const adverse_arr = [];
      if (rows.length <= 0) {
        return response
          .status(200)
          .json({
            success: false,
            msg: languageMessages.msgDataNotFound,
            adverse_arr: adverse_arr,
          });
      }
      var s_no = 0;
      rows.forEach((element) => {
        s_no++;
        adverse_arr.push({
          sr_no: s_no,
          adverse_reaction_id: element.adverse_reaction_id,
          user_id: element.user_id,
          medicine_name: element.medicine_name,
          dosage: element.dosage,
          category_name: element.type == 1 ? "Tablet" : element.type == 2 ? "Capsule" : element.type == 3 ? "Lozenge" : element.type == 4 ? "Cream" : element.type == 5 ? "Drops" : element.type == 6 ? "Foam" : element.type == 7 ? "Gel" : element.type == 8 ? "Inhaler" : element.type == 9 ? "Injection" : element.type == 10 ? "Ointment" : element.type == 11 ? "Patch" : element.type == 12 ? "Powder" : element.type == 13 ? "Spray" : element.type == 14 ? "Suppository" : element.type == 15 ? "Syrup" : element.type == 16 ? "Granule" : element.type == 17 ? "Lotion" : element.type == 18 ? "Other" : "Unknown",
          symptom_name: element.symptom_name,
          medication_start_date: moment(element.medication_start_date)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY"),
          reaction_date: moment(element.reaction_date)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY"),

          instruction: element.details,

          createtime: moment(element.createtime)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY hh:mm A"),
        });
      });
      return response
        .status(200)
        .json({
          success: true,
          msg: languageMessages.msgDataFound,
          adverse_arr: adverse_arr,
        });
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

const ActivateDeactivateUser = async (request, response) => {
  const data = request.body;
  const { user_id } = data;
  if (!user_id) {
    return response
      .status(200)
      .json({ success: false, msg: "Missing user_id" });
  }
  try {
    const checkUserQuery =
      "SELECT * FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(checkUserQuery, [user_id], async (err, res) => {
      if (err) {
        return response
          .status(200)
          .json({ success: false, msg: "Internal server error" });
      }
      if (res.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: "User not found" });
      }
      const user = res[0];
      const userName = user.f_name + " " + user.l_name;
      const userEmail = user.email;
      const newActiveFlag = user.active_flag === 1 ? 0 : 1;
      const newStatusMsg = user.active_flag === 1 ? "Deactivated" : "Activated";
      const updateUserQuery =
        "UPDATE user_master SET active_flag = ? WHERE user_id = ?";
      connection.query(
        updateUserQuery,
        [newActiveFlag, user_id],
        async (err, result) => {
          if (err) {
            return response
              .status(200)
              .json({ success: false, msg: "Internal server error" });
          }
          const { affectedRows } = result;
          if (affectedRows > 0) {
            const subject = "Account Info";
            const app_name = "Meditrek";
            const app_logo =
              "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";
            //   const mailBody = ActivateDeactivatemailer({ userName, newStatusMsg, app_name, app_logo });
            try {
              const mailResponse = await ActivateDeactivatemailer(
                userEmail,
                app_name,
                subject,
                userName,
                app_logo,
                newStatusMsg
              );
              if (mailResponse.status == "yes") {
                return response
                  .status(200)
                  .json({
                    success: true,
                    msg: languageMessages.EmailSent,
                    newStatusMsg,
                  });
              } else {
                return response
                  .status(200)
                  .json({
                    success: false,
                    msg: "Error sending email ",
                    mailResponse,
                  });
              }
            } catch (error) {
              return response.status(200).json({
                success: false,
                msg: "Failed to send email ",
              });
            }
          } else {
            return response
              .status(200)
              .json({ success: false, msg: "Failed to update user status" });
          }
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({ success: false, msg: languageMessages.internalServerError });
  }
};

const AdminForgetPassword = async (request, response) => {
  const { email } = request.body;

  // Check if email is provided

  if (!email) {
    return response.status(200).json({
      success: false,

      msg: "Email is required.", // Change this to your actual error message or language constant
    });
  }

  try {
    // Query to fetch admin details by email

    const sql =
      "SELECT user_id, name, email FROM user_master WHERE email = ? AND user_type = 0 AND delete_flag = 0";

    connection.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);

        return response.status(200).json({
          success: false,

          msg: "Database error occurred.",

          error: err.message,
        });
      }

      if (results.length === 0) {
        return response.status(200).json({
          success: false,

          msg: languageMessages.emailNotRegistered,

          key: "email",
        });
      }

      const adminEmail = results[0].email;

      const adminName = results[0].name;

      const subject = "Forget Password";

      const app_name = "Meditrek";

      const app_logo =
        "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";

      // Generate email body for forget password

      // const mailBody = mailBodyForgetPassword({
      //     app_name,

      //     app_logo,

      //     adminName,

      //     adminEmail,
      // });

      // Send forget password email

      try {
        const mailRes = await mailer(
          adminEmail,
          app_name,
          subject,
          adminName,
          app_logo,
          results[0].user_id
        );

        if (mailRes.status == "yes") {
          return response.status(200).json({
            success: true,

            msg: "Reset password link sent to your email",

            user_id: results[0].user_id,
          });
        } else {
          return response.status(200).json({
            success: false,

            msg: "Failed to send forget password email.",

            error: mailRes,
          });
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);

        return response.status(200).json({
          success: false,

          msg: "Error sending forget password email.",

          error: emailError.message,
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);

    return response.status(200).json({
      success: false,

      msg: "Unexpected error occurred.",

      error: error.message,
    });
  }
};

const adminForgetNewPassword = async (request, response) => {
  const { newPassword } = request.body;

  if (!newPassword) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "password",
    });
  }

  try {
    console.log(newPassword);

    const hashedPass = await hashPassword(newPassword);

    console.log(hashedPass);

    var updatepassword =
      "UPDATE user_master SET password = ?, updatetime = NOW() WHERE user_type = 0 AND delete_flag = 0";

    connection.query(updatepassword, [hashedPass], async (err) => {
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
  } catch (err) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      error: err,
    });
  }
};

//--------------------------get medication list-------------
const getMedicationList = async (request, response) => {
  const { user_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
      key: "user_id",
    });
  }

  try {
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
        m.remainder_quantity,
        m.remaining_quantity,
        m.instruction,
        m.status,
        m.updatetime, 
        a.added_by, 
        a.medicine_name,
        a.description,
        tm.time AS time
      FROM medication_master m
      JOIN medicine_master a ON a.medicine_id = m.medicine_id
      JOIN time_slots_master tm ON tm.medication_id = m.medication_id
      WHERE m.user_id = ? AND m.delete_flag = 0 AND tm.delete_flag = 0 AND tm.taken_status = 0
      ORDER BY m.medication_id DESC
    `;

    const medications = await new Promise((resolve, reject) => {
      connection.query(checksql, [user_id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!medications || medications.length === 0) {
      return response.status(200).json({
        success: true,
        message: languageMessages.msgDataNotFound,
        list: "NA",
      });
    }

    const formattedList = medications.map((item, index) => {
      // Serial number
      item.sr_no = index + 1;

      // Schedule
      item.schedule = item.schedule == 0 ? "Daily" : item.schedule == 1 ? "Weekly" : "Monthly";

      // Type
      item.type = item.type == 1 ? "Pill" : item.type == 2 ? "Syrup" : "Injection";

      // Update time
      item.updatetime = moment(item.updatetime).format("DD-MM-YYYY h:mm A");

      // Schedule date
      item.schedule_date = item.schedule_date ? moment(item.schedule_date).format("DD-MM-YYYY") : "NA";

      // Added by
      item.added_by = item.added_by == 0 ? "Admin" : item.added_by == 1 ? "User" : "NA";

      // Proper time formatting (convert DB time → local → string)
      item.time = item.time ? moment(item.time, "HH:mm:ss").format("h:mm A") : "NA";

      // Reminder time (same as time, unless you want different logic)
      item.reminder_time = item.time !== "NA" ? item.time : "NA";

      return item;
    });

    return response.status(200).json({
      success: true,
      message: languageMessages.msgDataFound,
      list: formattedList,
    });

  } catch (err) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: err.message,
    });
  }
};

//view compliance 
const viewCompliance = async (request, response) => {
  const { user_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "user_id",
    });
  }

  try {
    var checksql =
      "SELECT m.medication_id,m.user_id,m.medicine_id,m.dosage,m.type,m.schedule, m.schedule_date, m.pause_status, m.number_of_times, tm.taken_status, m.weekday,m.current_quantity, DATE_FORMAT(CONVERT_TZ(CONCAT('2024-01-01 ', tm.time), '+00:00', '+05:30'), '%h:%i %p') AS time,m.remainder_quantity,m.remaining_quantity,m.instruction,m.status,m.updatetime,a.medicine_name,a.description FROM medication_master m JOIN medicine_master a ON a.medicine_id = m.medicine_id JOIN time_slots_master tm ON tm.medication_id = m.medication_id WHERE m.user_id = ? AND m.delete_flag = 0 AND tm.taken_status = 1 ORDER BY m.medication_id desc";

    connection.query(checksql, [user_id], async (err, check) => {
      if (err) {
        return response.status(200).json({
          success: false,

          msg: languageMessages.internalServerError,

          error: err,
        });
      }
      if (check.length <= 0) {
        return response
          .status(200)
          .json({
            success: true,
            message: languageMessages.msgDataNotFound,
            list: [],
          });
      }




      check.map((item, index) => {
        item.sr_no = index + 1;
        item.schedule = item.schedule == 0 ? "Daily" : item.schedule == 1 ? "Weekly" : "Monthly"
        item.pause_status_label = item.pause_status == 0 ? "Resume" : "Pause"
        // item.pause_status = item.pause_status == 0 ? "Resume" : "Pause"
        item.type = item.type == 1 ? "Pill" : item.type == 2 ? "Syrup" : "Injection"
        item.updatetime = moment(item.updatetime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A");

        item.schedule_date = item.schedule_date
          ? moment(item.schedule_date)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY")
          : "NA";
        item.time = item.time

      });
      return response
        .status(200)
        .json({
          success: true,
          message: languageMessages.msgDataNotFound,
          list: check,
        });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      error: err,
    });
  }
};

//--------------------------get medication list-------------
const getReport = async (request, response) => {
  const { user_id } = request.query;

  if (!user_id) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.msg_empty_param,

      key: "user_id",
    });
  }

  try {
    var checksql =
      "SELECT m.medical_report_id,m.user_id,m.report_category_id,m.file,m.file_size,m.createtime,m.updatetime,a.category_name FROM medical_report_master m JOIN report_category a ON a.report_category_id = m.report_category_id WHERE m.user_id = ? AND m.delete_flag = 0 ORDER BY m.medical_report_id desc";

    connection.query(checksql, [user_id], async (err, check) => {
      if (err) {
        return response.status(200).json({
          success: false,

          msg: languageMessages.internalServerError,

          error: err,
        });
      }
      if (check.length <= 0) {
        return response
          .status(200)
          .json({
            success: true,
            message: languageMessages.msgDataNotFound,
            list: "NA",
          });
      }
      check.map((item) => {
        item.updatetime = moment(item.updatetime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A");

        item.createtime = moment(item.createtime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A");
      });
      return response
        .status(200)
        .json({
          success: true,
          message: languageMessages.msgDataNotFound,
          list: check,
        });
    });
  } catch (err) {
    return response.status(200).json({
      success: false,

      msg: languageMessages.internalServerError,

      error: err,
    });
  }
};

const approveDoctor = async (request, response) => {
  const { doctor_id, doctor_name, mobile, email, doctor_category_id } =
    request.body;

  if (!doctor_id || !doctor_name || !mobile || !email || !doctor_category_id) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
    });
  }

  // Check if admin exists
  const checkAdminSql = `SELECT * FROM user_master WHERE user_type = 0 AND delete_flag = 0`;
  connection.query(checkAdminSql, (checkErr, adminResults) => {
    if (checkErr) {
      return response.status(200).json({
        success: false,
        msg: languageMessages.internalServerError,
        error: checkErr.message,
      });
    }

    if (adminResults.length === 0) {
      return response.status(200).json({
        success: false,
        msg: "Admin not found",
      });
    }

    const adminEmail = adminResults[0].email;
    const adminName = adminResults[0].name;

    // Check if doctor already exists with given mobile or email
    const checkDoctorSql = `SELECT * FROM doctor_master WHERE  email = ? AND doctor_id != ? AND delete_flag = 0`;
    connection.query(
      checkDoctorSql,
      [mobile, email, doctor_id],
      async (checkErr, checkResults) => {
        if (checkErr) {
          return response.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            error: checkErr.message,
          });
        }

        if (checkResults.length > 0) {
          return response.status(200).json({
            success: false,
            msg: languageMessages.doctorAlreadyExists,
          });
        }

        // Generate new password
        const password = await generateUniquePassword();
        const password_hash = await hashPassword(password);

        // Approve doctor and update password
        const updateDoctorSql = `UPDATE doctor_master SET password = ?, approve_status = 1, active_flag = 1, updatetime = NOW() WHERE doctor_id = ?
`;
        connection.query(
          updateDoctorSql,
          [password_hash, doctor_id],
          async (err, result) => {
            if (err) {
              return response.status(200).json({
                success: false,
                msg: languageMessages.internalServerError,
                error: err.message,
              });
            }

            if (result.affectedRows === 0) {
              return response.status(200).json({
                success: false,
                msg: languageMessages.adoctorApproveUnSuccess,
              });
            }

            // Send approval email
            try {
              const title = "Doctor Approval";
              const app_name = "Meditrek";
              const app_logo =
                "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";
              const mailRes = await mailerApproveDoctor(
                email,            // recipient email
                app_name,
                title,
                doctor_name,
                email,            // for content
                password,
                doctor_category_id,
                app_logo
              );

              if (mailRes.status === "yes") {
                return response.status(200).json({
                  success: true,
                  msg: languageMessages.adoctorApproveSuccess,
                });
              } else {
                return response.status(200).json({
                  success: false,
                  msg: "Failed to send approval email.",
                  error: mailRes,
                });
              }
            } catch (emailError) {
              console.error("Error sending email:", emailError);
              return response.status(200).json({
                success: false,
                msg: "Error sending approval email.",
                error: emailError.message,
              });
            }
          }
        );
      }
    );
  });
};

const rejectDoctor = (req, res) => {
  const { doctor_id } = req.body;

  if (!doctor_id) {
    return res.status(200).json({
      success: false,
      msg: languageMessages.msg_empty_param,
    });
  }

  // Get admin info
  const checkAdminSql = `SELECT * FROM user_master WHERE user_type = 0 AND delete_flag = 0`;
  connection.query(checkAdminSql, (adminErr, adminResults) => {
    if (adminErr) {
      return res.status(200).json({
        success: false,
        msg: languageMessages.internalServerError,
        error: adminErr.message,
      });
    }

    if (adminResults.length === 0) {
      return res.status(200).json({
        success: false,
        msg: "Admin not found",
      });
    }

    const adminEmail = adminResults[0].email;
    const app_name = "Meditrek";
    const app_logo =
      "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";

    // Fetch doctor details
    const fetchDoctorSql = `SELECT doctor_name, email, doctor_category_id FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0`;
    connection.query(fetchDoctorSql, [doctor_id], (docErr, doctorResults) => {
      if (docErr) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          error: docErr.message,
        });
      }

      if (doctorResults.length === 0) {
        return res.status(200).json({
          success: false,
          msg: languageMessages.doctorNotFound,
        });
      }

      const { doctor_name, email, doctor_category_id } = doctorResults[0];

      // Update doctor as rejected
      const updateDoctorSql = `UPDATE doctor_master SET approve_status = 2, updatetime = NOW() WHERE doctor_id = ?`;
      connection.query(updateDoctorSql, [doctor_id], async (updateErr, updateResult) => {
        if (updateErr) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.internalServerError,
            error: updateErr.message,
          });
        }

        if (updateResult.affectedRows === 0) {
          return res.status(200).json({
            success: false,
            msg: languageMessages.adoctorRejectUnSuccess,
          });
        }

        // Send rejection email
        try {
          const mailRes = await mailerRejectDoctorByAdmin(
            adminEmail,
            app_name,
            "Doctor Rejected",
            doctor_name,
            email,
            doctor_category_id,
            app_logo
          );

          if (mailRes.status === "yes") {
            return res.status(200).json({
              success: true,
              msg: languageMessages.adoctorRejectSuccess,
            });
          } else {
            return res.status(200).json({
              success: false,
              msg: "Failed to send rejection email.",
              error: mailRes.error,
            });
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          return res.status(200).json({
            success: false,
            msg: "Error sending rejection email.",
            error: emailError.message,
          });
        }
      });
    });
  });
};

const getDoctorDetail = async (request, response) => {
  let { doctor_id } = request.query;

  try {
    if (!doctor_id) {
      return response.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "doctor_id",
      });
    }

    const sql =
      "SELECT d.approve_status, d.doctor_id, d.doctor_name, d.image, d.mobile, d.email, c.category_name, d.createtime, d.updatetime, d.active_flag FROM doctor_master AS d JOIN doctor_category AS c ON d.doctor_category_id = c.doctor_category_id WHERE d.doctor_id = ? ORDER BY d.doctor_id DESC;";

    connection.query(sql, [doctor_id], (err, results) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (results.length === 0) {
        return response.status(200).json({
          success: false,
          msg: "No doctor found",
          data: {},
        });
      }

      const doctor = results[0];

      const Doctor_arr = {
        doctor_id: doctor.doctor_id,
        image: doctor.image,
        doctor_name: doctor.doctor_name,
        mobile: doctor.mobile,
        email: doctor.email,
        category_name: doctor.category_name,
        approve_status: doctor.approve_status,
        approve_status_lable: doctor.approve_status == 1 ? "Approved" : "Pending",
        active_flag : doctor.active_flag,
        activestatus_label : doctor.active_flag == 1 ? "Active" : "Deactive",
        createtime: moment(doctor.createtime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A"),
      };

      return response.status(200).json({
        success: true,
        msg: languageMessages.msgDataFound,
        data: Doctor_arr,
      });
    });
  } catch (error) {
    return response.status(200).json({
      success: false,
      msg: languageMessages.internalServerError,
      error: error.message,
    });
  }
};


async function generateUniquePassword() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  let usedIndexes = new Set();

  while (password.length < 8) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    if (!usedIndexes.has(randomIndex)) {
      password += chars[randomIndex];
      usedIndexes.add(randomIndex);
    }
  }

  return password;
}

const getDoctorUserSharedReport = async (request, response) => {
  let { doctor_id } = request.query;
  try {
    if (!doctor_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "doctor_id" });
    }
    var sqlSelect = `SELECT um.name,um.mobile,um.email,rm.category_name,rsm.report_share_id, rsm.user_id, rsm.medical_report_id,mrp.file, rsm.doctor_id, DATE_FORMAT(rsm.createtime, '%Y-%m-%d %H:%i:%s') AS formatted_date FROM report_share_master as rsm 
    JOIN medical_report_master as mrp ON rsm.medical_report_id = mrp.medical_report_id 
    JOIN report_category as rm ON mrp.report_category_id = rm.report_category_id 
    JOIN user_master as um ON rsm.user_id = um.user_id 
    WHERE rsm.delete_flag = 0 AND rsm.doctor_id = ? AND mrp.delete_flag = 0 AND rm.delete_flag = 0;`;
    connection.query(sqlSelect, [doctor_id], async (error, result) => {
      if (error) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });
      }
      return response.status(200).json({ success: true, msg: languageMessages.msgDataFound, report_data: result });
    })
  } catch (error) {
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });
  }
}


//--------------------get doctor tabular  reports--------------
const getTabuldoctor = async (request, response) => {
  const { from_date, to_date } = request.query;

  try {
    if (!from_date) {
      return response
        .status(200)
        .json({
          status: true,
          msg: languageMessages.msg_empty_param,
          key: "from_date",
        });
    }

    if (!to_date) {
      return response
        .status(200)
        .json({
          status: true,
          msg: languageMessages.msg_empty_param,
          key: "to_date",
        });
    }

    var sqlSelect = ` SELECT d.approve_status, d.doctor_id, d.doctor_name, d.image, d.mobile, d.email, c.category_name, d.createtime, d.updatetime
  FROM doctor_master AS d
  JOIN doctor_category AS c ON d.doctor_category_id = c.doctor_category_id
  WHERE d.delete_flag = 0
  ORDER BY d.doctor_id DESC`;

    connection.query(sqlSelect, [from_date, to_date], (err, result) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessages.internalServerError,
          err: err.message,
        });
      }

      var user_arr = [];

      if (result.length <= 0) {
        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          user_arr: user_arr,
        });
      }

      // if (result.length > 0) {

      var s_no = 0;

      if (result.length > 0) {
        for (var data of result) {
          s_no++;

          user_arr.push({
            s_no: s_no,

            doctor_id: data.doctor_id,

            image: data.image,

            doctor_name: data.doctor_name,

            mobile: data.mobile,

            email: data.email,

            category_name: data.category_name,

            approve_status: data.approve_status,

            approve_status_lable:
              data.approve_status == 1 ? "Approved" : "Pending",


            createtime: moment(data.createtime)
              .tz("Europe/Paris")
              .format("DD-MM-YYYY hh:mm A"),
          });
        }

        return response.status(200).json({
          success: true,
          msg: languageMessages.msgDataFound,
          doctor_arr: user_arr.length > 0 ? user_arr : "NA",
        });
      }
    });
  } catch (error) {
    return response
      .status(200)
      .json({
        success: false,
        msg: languageMessages.internalServerError,
        err: error.message,
      });
  }
};

//--------------------doctor analytical reports-------------

const getDoctorAnalyticalReports = async (req, res) => {
  const data = req.query;

  if (!data) {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 1,
    };

    return res.json(record);
  } else if (!data.action) {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 2,
    };

    return res.json(record);
  } else if (data.action !== "get_users_analytical_report") {
    const record = {
      success: false,
      msg: languageMessages.msg_empty_param,
      key: 3,
    };

    return res.json(record);
  } else {
    try {
      const month_report_arr = [];

      const year_report_arr = [];

      const month_arr = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const current_year = new Date().getFullYear();

      for (let i = 0; i < month_arr.length; i++) {
        const month_text = month_arr[i];

        const current_month = i + 1;

        const month_user_arr = await getDoctorAnalyticalReportsFunction(
          "monthly",
          current_year,
          current_month,
          "All"
        );

        month_report_arr.push({
          month: month_text,
          month_user_arr: month_user_arr,
        });
      }

      for (let i = 2020; i <= current_year; i++) {
        const year_user_arr = await getDoctorAnalyticalReportsFunction(
          "yearly",
          i,
          "",
          "All"
        );

        year_report_arr.push({ year: i, year_user_arr: year_user_arr });
      }

      const record = {
        success: true,
        msg: languageMessages.msgDataFound,
        data: { month_report_arr, year_report_arr },
      };

      return res.json(record);
    } catch (error) {
      const record = {
        success: false,
        msg: languageMessages.internalServerError,
        key: error,
      };

      return res.json(record);
    }
  }
};

async function getDoctorAnalyticalReportsFunction(
  type,
  current_year,
  current_month,
  get_by_type
) {
  return new Promise((resolve, reject) => {
    let where = "";

    if (type === "monthly") {
      if (get_by_type === "All") {
        where = `AND YEAR(createtime) = ${current_year} AND MONTH(createtime) = ${current_month}`;
      }
    } else if (type === "yearly") {
      if (get_by_type === "All") {
        where = `AND YEAR(createtime) = ${current_year}`;
      }
    }

    const query1 = `SELECT doctor_id FROM doctor_master WHERE  delete_flag = 0  ${where} ORDER BY doctor_id DESC`;

    connection.query(query1, (error, rows) => {
      if (error) {
        return reject(error); // Reject the promise with the error
      }

      const user_arr = rows.length > 0 ? rows.length : 0;

      resolve(user_arr); // Resolve the promise with the rows
    });
  });
}





const bulkUploadMedicine = async (request, response) => {
  try {
    const file = request.file;

    if (!file) {
      return response.status(200).json({
        success: false,
        msg: "File is required",
        key: "file"
      });
    }

    const filePath = file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return response.status(200).json({
        success: false,
        msg: "Excel file is empty or invalid",
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of jsonData) {
      const category_name = row["Medicine_Name"];
      const description = row["Medicine_Description"];
      if (!category_name) continue;

      try {
        const checkSql = "SELECT medicine_id FROM medicine_master WHERE medicine_name = ? AND delete_flag = 0";
        const checkResult = await new Promise((resolve, reject) => {
          connection.query(checkSql, [category_name], (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        });

        if (checkResult.length > 0) {
          skippedCount++;
          continue;
        }

        const insertSql = "INSERT INTO medicine_master (medicine_name, description, createtime, updatetime) VALUES (?, ?, now(), now())";
        await new Promise((resolve, reject) => {
          connection.query(insertSql, [category_name, description], (err) => {
            if (err) return reject(err);
            insertedCount++;
            resolve();
          });
        });
      } catch (innerErr) {
        console.error("DB Error:", innerErr.message);
        continue;
      }
    }

    fs.unlinkSync(filePath);

    return response.status(200).json({
      success: true,
      msg: "Bulk category upload completed",
      inserted: insertedCount,
      skipped: skippedCount,
    });

  } catch (error) {
    console.error("Main Error:", error.message);
    return response.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

const bulkUploadDisease = async (request, response) => {
  try {
    const file = request.file;

    if (!file) {
      return response.status(200).json({
        success: false,
        msg: "File is required",
        key: "file"
      });
    }

    const filePath = file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return response.status(200).json({
        success: false,
        msg: "Excel file is empty or invalid",
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of jsonData) {
      const category_name = row["disease_name"];
      const description = row["disease_description"];
      if (!category_name) continue;

      try {
        const checkSql = "SELECT disease_id FROM disease_master WHERE disease_name = ? AND delete_flag = 0";
        const checkResult = await new Promise((resolve, reject) => {
          connection.query(checkSql, [category_name], (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        });

        if (checkResult.length > 0) {
          skippedCount++;
          continue;
        }

        const insertSql = "INSERT INTO disease_master (disease_name, description, createtime, updatetime) VALUES (?, ?, now(), now())";
        await new Promise((resolve, reject) => {
          connection.query(insertSql, [category_name, description], (err) => {
            if (err) return reject(err);
            insertedCount++;
            resolve();
          });
        });
      } catch (innerErr) {
        console.error("DB Error:", innerErr.message);
        continue;
      }
    }

    fs.unlinkSync(filePath);

    return response.status(200).json({
      success: true,
      msg: "Bulk category upload completed",
      inserted: insertedCount,
      skipped: skippedCount,
    });

  } catch (error) {
    console.error("Main Error:", error.message);
    return response.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

const bulkUploadSymptoms = async (request, response) => {
  try {
    const file = request.file;

    if (!file) {
      return response.status(200).json({
        success: false,
        msg: "File is required",
        key: "file"
      });
    }

    const filePath = file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return response.status(200).json({
        success: false,
        msg: "Excel file is empty or invalid",
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of jsonData) {
      const category_name = row["symptoms_name"];
      // const description = row["symptoms_description"];
      if (!category_name) continue;

      try {
        const checkSql = "SELECT symptom_id FROM symptoms_master WHERE symptom_name = ? AND delete_flag = 0";
        const checkResult = await new Promise((resolve, reject) => {
          connection.query(checkSql, [category_name], (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        });

        if (checkResult.length > 0) {
          skippedCount++;
          continue;
        }

        const insertSql = "INSERT INTO symptoms_master (symptom_name, createtime, updatetime) VALUES (?, now(), now())";
        await new Promise((resolve, reject) => {
          connection.query(insertSql, [category_name], (err) => {
            if (err) return reject(err);
            insertedCount++;
            resolve();
          });
        });
      } catch (innerErr) {
        console.error("DB Error:", innerErr.message);
        continue;
      }
    }

    fs.unlinkSync(filePath);

    return response.status(200).json({
      success: true,
      msg: "Bulk category upload completed",
      inserted: insertedCount,
      skipped: skippedCount,
    });

  } catch (error) {
    console.error("Main Error:", error.message);
    return response.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};

//get compliance of user 
const getAllCompliance = async (request, response) => {
  try {
    const delete_flag = 0
    const sql = "SELECT um.user_id, um.f_name, um.l_name, um.name, m.medicine_name, mm.medication_id, mm.type, mm.schedule, mm.weekday, mm.schedule, mm.schedule_date, mm.number_of_times, mm.reminder_time, tm.taken_status, mm.instruction, mm.createtime FROM user_master um JOIN medication_master mm ON um.user_id = mm.user_id JOIN medicine_master m ON mm.medicine_id = m.medicine_id JOIN time_slots_master tm ON tm.medication_id = mm.medication_id WHERE um.delete_flag = ? AND mm.delete_flag = 0 AND tm.delete_flag = 0 ORDER BY mm.medication_id DESC"
    connection.query(sql, [delete_flag], (err, result) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message })
      }

      if (result.length <= 0) {
        return response.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, result: [] })
      }


      result.map((item, index) => {
        item.sr_no = index + 1;

        item.schedule =
          item.schedule == 0
            ? "Daily"
            : item.schedule == 1
              ? "Weekly"
              : "Monthly";

        item.type =
          item.type == 1 ? "Pill" : item.type == 2 ? "Syrup" : "Injection";

        // France time 12-hour format for createtime
        item.createtime = moment(item.createtime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A");

        // France date only format for schedule_date
        item.schedule_date = item.schedule_date
          ? moment(item.schedule_date)
            .tz("Europe/Paris")
            .format("DD-MM-YYYY")
          : "NA";  // <-- added missing closing

        // 12-hour format for reminder_time
        item.reminder_time = item.reminder_time
          ? moment(item.reminder_time, "HH:mm:ss")
            .tz("Europe/Paris")
            .format("hh:mm A")
          : "NA";
      });

      return response.status(200).json({ success: true, msg: languageMessages.msgDataFound, result: result })
    })

  } catch (error) {
    console.error("Main Error:", error.message);
    return response.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
}

//get user medicine 
const getUserMedicine = async (request, response) => {
  const { user_id } = request.query
  try {
    if (!user_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });
    }

    const sql = "SELECT medicine_id, medicine_name, createtime FROM medicine_master WHERE delete_flag = 0 AND user_id = ? AND added_by = 1 ORDER BY createtime DESC"
    connection.query(sql, [user_id], (err, res) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message })
      }
      if (res.length == 0) {
        return response.status(200).json({ success: true, msg: languageMessages.msgDataNotFound, result: [] })
      }
      res.map((item, index) => {
        item.sr_no = index + 1
        item.createtime = moment(item.createtime)
          .tz("Europe/Paris")
          .format("DD-MM-YYYY hh:mm A");
      })
      return response.status(200).json({ success: true, msg: languageMessages.msgDataFound, result: res })
    })


  } catch (error) {
    console.error("Main Error:", error.message);
    return response.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
}




const DoctorActivateDeactivateUser = async (request, response) => {

  const data = request.body;

  const { doctor_id } = data;

  if (!doctor_id) {
    return response
      .status(200)
      .json({ success: false, msg: "Missing doctor_id" });
  }
  try {

    const checkUserQuery =
      "SELECT * FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0";
    connection.query(checkUserQuery, [doctor_id], async (err, res) => {
      if (err) {
        return response
          .status(200)
          .json({ success: false, msg: "Internal server error" });
      }
      if (res.length === 0) {
        return response
          .status(200)
          .json({ success: false, msg: "Doctor not found" });
      }
      const user = res[0];
      const userName = user.doctor_name;
      const userEmail = user.email;
      const newActiveFlag = user.active_flag === 1 ? 0 : 1;
      const newStatusMsg = user.active_flag === 1 ? "Deactivated" : "Activated";
      const updateUserQuery =
        "UPDATE doctor_master SET active_flag = ? WHERE doctor_id = ?";
      connection.query(
        updateUserQuery,
        [newActiveFlag, doctor_id],
        async (err, result) => {
          if (err) {
            return response
              .status(200)
              .json({ success: false, msg: "Internal server error" });
          }
          const { affectedRows } = result;
          if (affectedRows > 0) {
            const subject = "Account Info";
            const app_name = "Meditrek Access";
            const app_logo =
              "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png";
            //   const mailBody = ActivateDeactivatemailer({ userName, newStatusMsg, app_name, app_logo });
            try {
              const mailResponse = await ActivateDeactivatemailer(
                userEmail,
                app_name,
                subject,
                userName,
                app_logo,
                newStatusMsg
              );
              if (mailResponse.status == "yes") {
                return response
                  .status(200)
                  .json({
                    success: true,
                    msg: languageMessages.EmailSent,
                    newStatusMsg,
                  });
              } else {
                return response
                  .status(200)
                  .json({
                    success: false,
                    msg: "Error sending email ",
                    mailResponse,
                  });
              }
            } catch (error) {
              return response.status(200).json({
                success: false,
                msg: "Failed to send email ",
              });
            }
          } else {
            return response
              .status(200)
              .json({ success: false, msg: "Failed to update user status" });
          }
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({ success: false, msg: languageMessages.internalServerError });
  }
};
// languages api 
const getLanguages = (req, res) => {
  try {
    connection.query(
      "SELECT id, language_name, language_code, is_default FROM languages_master WHERE status = 1",
      (err, rows) => {
        if (err) {
          return res.json({ success: false, error: err.message });
        }

        res.json({ success: true, data: rows });
      }
    );
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

const saveLanguages = (req, res) => {
  const { admin_id, languages } = req.body;

  if (!admin_id) {
    return res.json({ success: false, msg: "admin_id required" });
  }

  // 1. Get default language
  connection.query(
    "SELECT id FROM languages_master WHERE is_default = 1",
    (err, defaultLang) => {
      if (err) {
        return res.json({ success: false, error: err.message });
      }

      const defaultLangId = defaultLang[0].id;

      // 2. Ensure English included
      let finalLanguages = languages || [];

      if (!finalLanguages.includes(defaultLangId)) {
        finalLanguages.push(defaultLangId);
      }

      finalLanguages = [...new Set(finalLanguages)];

      // 3. Delete old
      connection.query(
        "DELETE FROM admin_selected_languages WHERE admin_id = ?",
        [admin_id],
        (err) => {
          if (err) {
            return res.json({ success: false, error: err.message });
          }

          // 4. Insert new
          const values = finalLanguages.map(lang_id => [admin_id, lang_id]);

          connection.query(
            "INSERT INTO admin_selected_languages (admin_id, language_id) VALUES ?",
            [values],
            (err) => {
              if (err) {
                return res.json({ success: false, error: err.message });
              }

              res.json({
                success: true,
                msg: "Languages saved (English always included)"
              });
            }
          );
        }
      );
    }
  );
};

const getUserLanguages = (req, res) => {
  const { admin_id } = req.query;

  if (!admin_id) {
    return res.json({ success: false, msg: "admin_id required" });
  }

  connection.query(
    `SELECT lm.id, lm.language_name, lm.language_code
     FROM admin_selected_languages asl
     JOIN languages_master lm ON lm.id = asl.language_id
     WHERE asl.admin_id = ?
     ORDER BY lm.is_default DESC`,
    [admin_id],
    (err, rows) => {
      if (err) {
        return res.json({ success: false, error: err.message });
      }

      res.json({ success: true, data: rows });
    }
  );
};







module.exports = {
  // abhich

  DoctorActivateDeactivateUser,

  adminLogin,

  UpdateAdminProfile,

  UpdateAdminPassword,

  getAdminAllData,

  getAllusersData,

  ViewUserDetails,

  ActivateDeactivateUser,

  getAllDeletedUser,

  getDoctorSpecialization,

  addDoctorSpecialization,

  editDoctorSpecialization,

  deleteDoctorSpecialization,

  getAllDoctor,

  addDoctor,

  addFromWebsiteDoctor,

  editDoctor,

  deleteDoctor,

  getAllMedicine,

  addMedicine,

  editMedicine,

  deleteMedicine,

  getdisease,

  addDisease,

  editDisease,

  deleteDisease,

  getAllSymptoms,

  addSymptom,

  editSymptom,

  deleteSymptom,

  getReportCategory,

  addReportCategory,

  editReportCategory,

  deleteReportCategory,

  getHelpAndSupport,

  sendReply,

  getContent,

  getContentUrl,

  updateContent,

  sendBroadcastMessageAllUser,

  getTabularUser,

  get_medicine_types,

  add_medicine_type,

  update_medicine_type,

  delete_medicine_type,

  getUserAnalyticalReports,

  get_all_count,

  fetchUsers,

  fetchdoctorbyuser,

  getAdverseofUser,
  AdminForgetPassword,
  adminForgetNewPassword,
  getMedicationList,
  getReport,
  approveDoctor,
  getDoctorDetail,
  getDoctorUserSharedReport,
  getTabuldoctor,
  getDoctorAnalyticalReports,
  bulkUploadMedicine,
  bulkUploadDisease,
  bulkUploadSymptoms,
  getAllCompliance,
  viewCompliance,
  getFaq,
  getFaqDoctor,
  deleteFaq,
  addFaq,
  editFaq,
  getUserMedicine,
  sendMessageByDoctorToAdmin, getAllDeletedDoctor,
  rejectDoctor,
  deleteUser,
  getLanguages,
  saveLanguages,
  getUserLanguages,
};
