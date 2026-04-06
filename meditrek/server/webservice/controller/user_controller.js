const commonModel = require("./common_modules");

const util = require('util');

const connection = require('../connection');

const languageMessage = require('../shared functions/languageMessage')

const { mailer } = require('./mailer');

const jwt = require('jsonwebtoken');

const { DeviceTokenStore_1_Signal, getUserDetails, hashPassword, getNotificationArrSingle, oneSignalNotificationSendCall, getUserPlayerIdAsync } = require("../shared functions/functions");

const SECRET_KEY = "TOKEN-KEY"; // Change to your secure secret

function generate6DigitCode(user_id) {
    const timestamp = Date.now(); // Current timestamp in ms

    const base = parseInt(`${user_id}${timestamp}`); // Combine user_id and timestamp

    const uniqueNumber = base % 1000000; // Get the last 6 digits

    // Pad with zeros if needed to always return 6 digits

    return uniqueNumber.toString().padStart(6, '0');

}



const moment = require('moment-timezone');



// Get current time in the desired timezone (e.g., Paris)

const parisTime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris');



// Format it as 'YYYY-MM-DD HH:mm:ss'

const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');

const query = util.promisify(connection.query).bind(connection);
const { getUserLanguage } = require('../helpers/languageHelper');





// const signUp = async (req, res) => {

//   try {

//     let { f_name, l_name, mobile, email, password, player_id, device_type, device_id, diseases, date } = req.body;



//     if (!f_name || !l_name || !email || !password || !mobile || !player_id || !device_type || !device_id) {

//       return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

//     }



//     const otp = await generateOTP(6);

//     const name = `${f_name} ${l_name}`;

//     const hashedPassword = await hashPassword(password);



//     // Check if user exists

//     const existingUser = await query(

//       "SELECT user_id, otp_verify FROM user_master WHERE email=? AND delete_flag=0",

//       [email]

//     );



//     // If fully verified user already exists

//     if (existingUser.length > 0 && existingUser[0].otp_verify === 1) {

//       return res.status(200).json({ success: false, msg: ["Email already registered"] });

//     }



//     // If unverified user exists, update OTP only

//     if (existingUser.length > 0 && existingUser[0].otp_verify === 0) {

//       await query("UPDATE user_master SET otp=?, updatetime=NOW() WHERE user_id=?", [otp, existingUser[0].user_id]);

//       await mailer(email, "Meditrek Access", "Your OTP for Verification", name, "https://meditrekaccess.com/logo.png", otp);

//       return res.status(200).json({ success: true, msg: languageMessage.otpSuccess });

//     }



//     // Else, create temporary entry with otp_verify=0

//     const deviceTypeId = device_type === "android" ? 0 : 1;

//     const user_unique_id = generate6DigitCode(mobile);

//     const now = new Date().toISOString().slice(0, 19).replace("T", " ");



//     const result = await query(

//       `INSERT INTO user_master 

//       (f_name, l_name, name, mobile, email, password, otp, user_type, player_id, device_type, createtime, updatetime, login_type, signup_step, user_unique_id, diseases, dob, otp_verify)

//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,

//       [f_name, l_name, name, mobile, email, hashedPassword, otp, 1, player_id, deviceTypeId, now, now, 0, 0, user_unique_id, diseases, date]

//     );

//     const user_id_get = result.insertId;

//     const userDetails = await getUserDetails(user_id_get);

//      const token = jwt.sign({ user_id_get, device_id }, SECRET_KEY, { expiresIn: "1h" });

//     // Send OTP email (no admin entry till verified)

//     await mailer(email, "Meditrek Access", "Your OTP for Verification", name, "https://meditrekaccess.com/logo.png", otp);



//     // return res.status(200).json({ success: true, msg: languageMessage.otpSuccess });

//     return response.status(200).json({

//                 success: true,

//                 msg: languageMessage.otpSuccess,

//                 userDataArray: userDetails,

//                 token

//             });

//   } catch (err) {

//     return res.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//   }

// };





const signUp = async (req, res) => {

    try {

        const {

            f_name, l_name, mobile, email, password,

            player_id, device_type, device_id, diseases, date,language_code

        } = req.body;



        if (!f_name || !l_name || !email || !password || !mobile || !player_id || !device_type || !device_id) {

            return res.status(400).json({ success: false, msg: languageMessage.msg_empty_param });

        }
        
        const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : "en";
        req.setLocale(finalLanguage);

        const otp = await generateOTP(6);

        const name = `${f_name} ${l_name}`;

        const hashedPassword = await hashPassword(password);



        const existingUser = await query(

            "SELECT user_id, otp_verify FROM user_master WHERE email=? AND delete_flag=0",

            [email]

        );



        if (existingUser.length > 0 && existingUser[0].otp_verify === 1) {

            return res.status(409).json({ success: false, msg: req.__('email_already_registered') });

        }



        if (existingUser.length > 0 && existingUser[0].otp_verify === 0) {

            await query("UPDATE user_master SET otp=?, updatetime=NOW() WHERE user_id=?", [otp, existingUser[0].user_id]);

            await mailer(email, "Meditrek Access", "Your OTP for Verification", name, "https://meditrekaccess.com/meditrek/server/uploads/meditrek_logo.png", otp);

            const userDetails = await getUserDetails(existingUser[0].user_id);

            const user_id_get = existingUser[0].user_id;

            const token = jwt.sign({ user_id_get, device_id }, SECRET_KEY, { expiresIn: "1h" });

            return res.status(200).json({

                success: true,

                msg: req.__('otp_sent_successfully'),

                userDataArray: userDetails ?? 'NA',

                token: token ?? 'NA'

            });

        }



        const deviceTypeId = device_type === "android" ? 0 : 1;

        const user_unique_id = generate6DigitCode(mobile);





        const result = await query(

            `INSERT INTO user_master 

      (f_name, l_name, name, mobile, email, password, otp, user_type, player_id, device_type, createtime, updatetime, login_type, signup_step, user_unique_id, diseases, dob, otp_verify)

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,

            [f_name, l_name, name, mobile, email, hashedPassword, otp, 1, player_id, deviceTypeId, formattedDate, formattedDate, 0, 0, user_unique_id, diseases, date]

        );



        const userId = result.insertId;

        const userDetails = await getUserDetails(userId);

        const token = jwt.sign({ user_id: userId, device_id }, SECRET_KEY, { expiresIn: "1h" });



        await mailer(email, "Meditrek Access", "Your OTP for Verification", name, "https://meditrekaccess.com/logo.png", otp);



        return res.status(200).json({

            success: true,

            msg: req.__('otp_sent_successfully'),

            userDataArray: userDetails ?? 'NA',

            token: token ?? 'NA'

        });



    } catch (err) {

        return res.status(500).json({

            success: false,

            msg: req.__('internal_server_error'),

            key: err.message

        });

    }

};





// const signUp = async (request, response) => {

//     let { f_name, l_name, mobile, email, password, player_id, device_type, device_id, diseases, date } = request.body;



//     if (!f_name || !l_name || !email || !password || !mobile || !player_id || !device_type || !device_id) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

//     }



//     try {

//         const otp = await generateOTP(6);

//         const name = f_name + ' ' + l_name;

//         const hashedPassword = await hashPassword(password);



//         const query = "SELECT user_id, otp_verify, profile_complete FROM user_master WHERE email = ? AND delete_flag = 0";

//         connection.query(query, [email], async (err, result) => {

//             if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });



//             let user_id_get;



//             if (result.length > 0) {

//                 // Existing user, update OTP

//                 const user = result[0];

//                 if (user.otp_verify === 1) {

//                     return response.status(200).json({ success: false, msg: ["Email already registered"] });

//                 }

//                 const updateQuery = `

//                     UPDATE user_master 

//                     SET otp = ?, f_name = ?, l_name = ?, name = ?, password = ?, diseases = ?, dob = ? 

//                     WHERE user_id = ? AND delete_flag = 0

//                 `;

//                 await new Promise((resolve, reject) => {

//                     connection.query(updateQuery, [otp, f_name, l_name, name, hashedPassword, diseases, date, user.user_id], (err) => err ? reject(err) : resolve());

//                 });

//                 user_id_get = user.user_id;

//             } else {

//                 // New user creation

//                 const user_unique_id = generate6DigitCode(mobile);

//                 const formattedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');



//                 const insertQuery = `

//                     INSERT INTO user_master 

//                     (f_name, l_name, name, mobile, email, password, otp, user_type, player_id, device_type, createtime, updatetime, login_type, signup_step, user_unique_id, diseases, dob)

//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

//                 `;

//                 const values = [f_name, l_name, name, mobile, email, hashedPassword, otp, 1, player_id, device_type === 'android' ? 0 : 1, formattedDate, formattedDate, 0, 0, user_unique_id, diseases, date];



//                 const resultInsert = await new Promise((resolve, reject) => {

//                     connection.query(insertQuery, values, (err, res) => err ? reject(err) : resolve(res));

//                 });

//                 user_id_get = resultInsert.insertId;

//             }



//             // Create session & token

//             const token = jwt.sign({ user_id_get, device_id }, SECRET_KEY, { expiresIn: "1h" });

//             const insertSessionQuery = "INSERT INTO user_sessions (user_id, device_id, token) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?";

//             connection.query(insertSessionQuery, [user_id_get, device_id, token, token]);



//             await DeviceTokenStore_1_Signal(user_id_get, device_type, player_id);

//             const userDetails = await getUserDetails(user_id_get);



//             // ✅ Send push notification on signup

//             const notificationData = {

//                 user_id: 0, // system

//                 other_user_id: user_id_get,

//                 action: "Signup",

//                 action_id: 0,

//                 title: "Welcome!",

//                 message: "Welcome to Meditrek Access! Start exploring our services.",

//             };



//             // Wrap callback-based notification function in a Promise

//             await new Promise((resolve) => {

//                 getNotificationArrSingle(

//                     notificationData.user_id,

//                     notificationData.other_user_id,

//                     notificationData.action,

//                     notificationData.action_id,

//                     notificationData.title, notificationData.title, notificationData.title, notificationData.title, notificationData.title,

//                     notificationData.message, notificationData.message, notificationData.message, notificationData.message, notificationData.message,

//                     { type: "signup" },

//                     resolve

//                 );

//             });



//             // Send OTP email

//             await mailer(email, "Meditrek Access", "Your OTP for Verification", name, "https://meditrekaccess.com/logo.png", otp);



//             return response.status(200).json({

//                 success: true,

//                 msg: languageMessage.userCreatedSuccess,

//                 userDataArray: userDetails,

//                 token

//             });

//         });

//     } catch (err) {

//         return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//     }

// }









//end

//customer Verify Otp 

// const userOtpVerify = async (request, response) => {

//     let { user_id, otp } = request.body;

//     if (!user_id) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

//     }

//     if (!otp) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

//     }

//     try {

//         const query1 = "SELECT mobile, active_flag, otp,delete_flag FROM user_master WHERE user_id = ? ";

//         const values1 = [user_id];

//         connection.query(query1, values1, async (err, result) => {

//             if (err) {

//                 return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//             }

//             if (result.length === 0) {

//                 return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

//             }

//             if (result[0]?.active_flag === 0) {

//                 return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_status: 0 });

//             }

//             if (result[0]?.delete_flag == 1) {

//                 return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

//             }

//             const userOpt = result[0].otp;

//             if (userOpt !== otp) {

//                 return response.status(200).json({ success: false, msg: languageMessage.invalidOtp });

//             }

//             const clearOtpQuery = `

//             UPDATE user_master 

//             SET otp = NULL, otp_verify = 1, profile_complete = 1

//             WHERE user_id = ?

//         `;

//             connection.query(clearOtpQuery, [user_id], async (err) => {

//                 if (err) {

//                     return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//                 }

//                 const userDetails = await getUserDetails(user_id);

//                 return response.status(200).json({ success: true, msg: languageMessage.otpVerifiedSuccess, userDataArray: userDetails });

//             });

//         });

//     } catch (err) {

//         return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//     }

// }



const userOtpVerify = async (req, res) => {

    let { user_id, otp,language_code } = req.body;



    if (!user_id) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "user_id" });

    if (!otp) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "otp" });

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    req.setLocale(finalLanguage);

    try {

        const result = await query("SELECT mobile, active_flag, otp, delete_flag FROM user_master WHERE user_id=?", [user_id]);

        if (result.length === 0) return res.status(200).json({ success: false, msg: req.__('user_not_found') });



        const user = result[0];



        if (user.active_flag === 0) return res.status(200).json({ success: false, msg: req.__('your_account_has_been_deactivated'), active_status: 0 });

        if (user.delete_flag == 1) return res.status(200).json({ success: false, msg: req.__('your_account_is_not_registered_with_us'), active_flag: 0 });



        if (String(user.otp) !== String(otp)) return res.status(200).json({ success: false, msg: req.__('invalid_otp') });



        await query("UPDATE user_master SET otp=NULL, otp_verify=1, profile_complete=1 WHERE user_id=?", [user_id]);



        const userDetails = await getUserDetails(user_id);



        // Send welcome notification

        const notificationArr = [{

            player_id: await getUserPlayerIdAsync(user_id),

            title: "Welcome!",

            message: "Your account has been verified successfully. Start exploring our services!",

            action_json: { type: "otp_verified" }

        }];

        await oneSignalNotificationSendCall(notificationArr);



        return res.status(200).json({ success: true, msg: req.__('otp_verified_successfully'), userDataArray: userDetails });

    } catch (err) {

        return res.status(200).json({ success: false, msg: req.__('internal_server_error'), key: err.message });

    }

};



//end

//customer Resend Otp

const userResendOtp = async (req, res) => {

    try {

        const { user_id, language_code } = req.body;

        if (!user_id) {

            return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

        }

        const finalLanguage = language_code && language_code.trim() !== ""
            ? language_code
            : await getUserLanguage({ user_id });

        req.setLocale(finalLanguage);

        // Generate new OTP

        const otp = await generateOTP(6);



        // Fetch user details

        const users = await query(

            "SELECT email, f_name, l_name, active_flag, delete_flag FROM user_master WHERE user_id = ?",

            [user_id]

        );



        if (users.length === 0) {

            return res.status(200).json({ success: false, msg: req.__('user_not_found') });

        }



        const user = users[0];



        if (user.active_flag === 0) {

            return res.status(200).json({ success: false, msg: req.__('your_account_has_been_deactivated'), active_status: 0 });

        }



        // Send OTP even if delete_flag = 1

        const name = `${user.f_name} ${user.l_name}`;

        const email = user.email;



        // Update OTP in DB

        await query("UPDATE user_master SET otp = ? WHERE user_id = ?", [otp, user_id]);



        // Get user details

        const userDetails = await getUserDetails(user_id);



        // Respond first

        res.status(200).json({ success: true, msg: req.__('otp_sent_successfully'), userDataArray: userDetails });
        let app_logo = "https://meditrekaccess.com/logo.png"


        // Send OTP mail asynchronously

        mailer(email, "Meditrek Access", "Your OTP for Verification", name, app_logo, otp)

            .catch(err => console.error("OTP Mail Error:", err));



    } catch (err) {

        console.error("Resend OTP Error:", err);

        return res.status(200).json({ success: false, msg: req.__('internal_server_error'), key: err.message });

    }

};

//end

//Delete Account

const deleteAccount = async (request, response) => {

    let { user_id, reason } = request.body

    if (!user_id || !reason) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }

    try {

        const query1 = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ?  AND user_type=1";

        const values1 = [user_id];

        connection.query(query1, values1, async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }

            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

            }

            if (result[0]?.active_flag === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_status: 0 });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

            }

            const newUserQuery = `

            UPDATE user_master 

            SET delete_reason = ?, delete_flag = 1 

            WHERE user_id = ?

        `;

            connection.query(newUserQuery, [reason, user_id], async (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err });

                }

                const removePlayerID = 'UPDATE user_notification SET player_id = NULL WHERE user_id = ? ';

                connection.query(removePlayerID, [user_id], async (error1, result1) => {

                    if (error1) {

                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: error1 });

                    }



                    const userDetails = await getUserDetails(user_id);

                    return response.status(200).json({ success: true, msg: languageMessage.profileDeleteSuccess, userDataArray: userDetails });

                });

            });

        })

    } catch (err) {

        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

    }

}



//user edit profile 

// const editProfile = async (request, response) => {

//     let { user_id, f_name, l_name, mobile, email, gender, date, diseases, weight, height } = request.body;

//     if (!user_id) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });

//     }

//     if (!f_name) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'f_name' });

//     }

//     if (!l_name) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'l_name' });

//     }

//     if (!mobile) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'mobile' });

//     }

//     if (!email) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });

//     }

//     if (!gender) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'gender' });

//     }

//     if (!date) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'date' });

//     }

//     if (!diseases) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'diseases' });

//     }

//     if (!weight) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'weight' });

//     }

//     if (!height) {

//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'height' });

//     }

//     try {

//         const query1 = "SELECT mobile, active_flag, image,delete_flag FROM user_master WHERE user_id = ?  AND user_type=1";

//         const values1 = [user_id];

//         connection.query(query1, values1, async (err, result) => {

//             if (err) {

//                 return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//             }

//             if (result.length === 0) {

//                 return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

//             }

//             if (result[0]?.active_flag === 0) {

//                 return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_status: 0 });

//             }

//             if (result[0]?.delete_flag == 1) {

//                 return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

//             }

//             const image = request.file ? request.file.filename : result[0].image;

//             const query1 = "SELECT mobile, email, active_flag FROM user_master WHERE mobile = ? AND user_id != ? AND delete_flag=0 AND user_type=1";

//             const values1 = [mobile, user_id];

//             connection.query(query1, values1, async (err, result) => {

//                 if (err) {

//                     return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//                 }

//                 if (result.length > 0) {

//                     return response.status(200).json({ success: false, msg: languageMessage.mobileIsUsed });

//                 }

//                 // Prepare dynamic update

//                 let updateFields = [];

//                 let updateValues = [];

//                 if (f_name !== undefined) {

//                     updateFields.push('f_name = ?');

//                     updateValues.push(f_name);

//                 }

//                 if (l_name !== undefined) {

//                     updateFields.push('l_name = ?');

//                     updateValues.push(l_name);

//                 }

//                 if (mobile !== undefined) {

//                     updateFields.push('mobile = ?');

//                     updateValues.push(mobile);

//                 }

//                 if (email !== undefined) {

//                     updateFields.push('email = ?');

//                     updateValues.push(email);

//                 }

//                 if (gender !== undefined) {

//                     updateFields.push('gender = ?');

//                     updateValues.push(gender);

//                 }

//                 if (date !== undefined) {

//                     updateFields.push('dob = ?');

//                     updateValues.push(date);

//                 }

//                 if (diseases !== undefined) {

//                     updateFields.push('diseases = ?');

//                     updateValues.push(diseases);

//                 }

//                 if (weight !== undefined) {

//                     updateFields.push('weight = ?');

//                     updateValues.push(weight);

//                 }

//                 if (height !== undefined) {

//                     updateFields.push('height = ?');

//                     updateValues.push(height);

//                 }

//                 if (image !== null) {

//                     updateFields.push('image = ?');

//                     updateValues.push(image);

//                 }

//                 if (updateFields.length === 0) {

//                     return response.status(200).json({ success: false, msg: "No fields provided to update" });

//                 }

//                 const updateQuery = `UPDATE user_master SET ${updateFields.join(', ')} WHERE user_id = ?`;

//                 updateValues.push(user_id);

//                 connection.query(updateQuery, updateValues, async (err, result) => {

//                     if (err) {

//                         return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err });

//                     }

//                     const userDetails = await getUserDetails(user_id);

//                     return response.status(200).json({ success: true, msg: languageMessage.profileUpdatedSuccess, userDataArray: userDetails });

//                 });

//             });

//         });

//     } catch (err) {

//         return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

//     }

// };

const editProfile = async (request, response) => {

    let { user_id, f_name, l_name, mobile, email, gender, date, diseases, weight, height, delete_image,language_code } = request.body;

    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });

    }

    if (!f_name) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'f_name' });

    }

    if (!l_name) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'l_name' });

    }

    if (!mobile) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'mobile' });

    }

    if (!email) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });

    }

    if (!gender) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'gender' });

    }

    if (!date) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'date' });

    }

    // if (!diseases) {

    //     return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'diseases' });

    // }

    if (!weight) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'weight' });

    }

    if (!height) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'height' });

    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    req.setLocale(finalLanguage);

    try {

        const query1 = "SELECT mobile, active_flag, image,delete_flag FROM user_master WHERE user_id = ?  AND user_type=1";

        const values1 = [user_id];

        connection.query(query1, values1, async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

            }

            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: request.__('user_not_found') });

            }

            if (result[0]?.active_flag === 0) {

                return response.status(200).json({ success: false, msg: request.__('your_account_has_been_deactivated'), active_status: 0 });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });

            }

            let image = request.file ? request.file.filename : result[0].image;

            if (delete_image == 1) {

                image = null;

            }

            const query1 = "SELECT mobile, email, active_flag FROM user_master WHERE mobile = ? AND user_id != ? AND delete_flag=0 AND user_type=1";

            const values1 = [mobile, user_id];

            connection.query(query1, values1, async (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

                }

                // Prepare dynamic update

                let updateFields = [];

                let updateValues = [];

                updateFields.push('image = ?');

                updateValues.push(image);

                updateFields.push('diseases = ?');

                updateValues.push(diseases);

                if (f_name !== undefined) {

                    updateFields.push('f_name = ?');

                    updateValues.push(f_name);

                }

                if (l_name !== undefined) {

                    updateFields.push('l_name = ?');

                    updateValues.push(l_name);

                }

                const fullName = `${f_name || ''} ${l_name || ''}`.trim();

                if (fullName) {

                    updateFields.push('name = ?');

                    updateValues.push(fullName);

                }

                if (mobile !== undefined) {

                    updateFields.push('mobile = ?');

                    updateValues.push(mobile);

                }

                if (email !== undefined) {

                    updateFields.push('email = ?');

                    updateValues.push(email);

                }

                if (gender !== undefined) {

                    updateFields.push('gender = ?');

                    updateValues.push(gender);

                }

                if (date !== undefined) {

                    updateFields.push('dob = ?');

                    updateValues.push(date);

                }



                if (weight !== undefined) {

                    updateFields.push('weight = ?');

                    updateValues.push(weight);

                }

                if (height !== undefined) {

                    updateFields.push('height = ?');

                    updateValues.push(height);

                }



                if (updateFields.length === 0) {

                    return response.status(200).json({ success: false, msg: request.__('no_fields_provided_to_update') });

                }

                const updateQuery = `UPDATE user_master SET ${updateFields.join(', ')} WHERE user_id = ?`;

                updateValues.push(user_id);

                connection.query(updateQuery, updateValues, async (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err });

                    }

                    const userDetails = await getUserDetails(user_id);

                    return response.status(200).json({ success: true, msg: request.__('user_profile_updated_successfully'), userDataArray: userDetails });

                });

            });

        });

    } catch (err) {

        return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

    }

};



//forgot password

const forgotPassword = async (req, res) => {

    try {

        const { email, language_code } = req.body;

        if (!email) {

            return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

        }


        const finalLanguage = language_code && language_code.trim() !== ""
            ? language_code
            : await getUserLanguage({ email });

        req.setLocale(finalLanguage);


        // Fetch user

        connection.query(

            "SELECT user_id, active_flag, name, delete_flag FROM user_master WHERE email = ? ORDER BY user_id DESC",

            [email],

            async (err, result) => {

                if (err) {

                    return res.status(200).json({ success: false, msg: req.__('internal_server_error'), key: err.message });

                }



                if (result.length === 0) {

                    return res.status(200).json({ success: false, msg: req.__('user_not_found') });

                }



                const user = result[0];



                if (user.active_flag === 0) {

                    return res.status(200).json({ success: false, msg: req.__('your_account_has_been_deactivated'), active_flag: user.active_flag });

                }



                if (user.delete_flag == 1) {

                    return res.status(200).json({ success: false, msg: req.__('your_account_is_not_registered_with_us'), active_flag: 0 });

                }



                // Generate OTP

                const OTP = await generateOTP(6);



                // Update OTP in DB

                connection.query(

                    "UPDATE user_master SET otp = ? WHERE email = ?",

                    [OTP, email],

                    async (err) => {

                        if (err) {

                            return res.status(200).json({ success: false, msg: req.__('internal_server_error'), key: err.message });

                        }



                        // Send OTP mail

                        mailer(

                            email,

                            "Meditrek Access",

                            "Your OTP for Reset Password",

                            user.name, // use user.name

                            "https://meditrekaccess.com/logo.png",

                            OTP

                        ).catch(err => console.error("OTP Mail Error:", err));



                        // Respond to user

                        const userDetails = await getUserDetails(user.user_id);

                        return res.status(200).json({

                            success: true,

                            msg: req.__('otp_sent_successfully'),

                            userDataArray: userDetails
                        });
                    }
                );
            }
        );
    } catch (err) {

        return res.status(200).json({ success: false, msg: req.__('internal_server_error'), key: err.message });

    }

};

//end

//Forgot password Resend otp

const forgotPasswordResendOtp = async (request, response) => {

    let { user_id } = request.body;

    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    try {

        const query1 = "SELECT mobile, email, name, active_flag, otp, delete_flag FROM user_master WHERE user_id = ? ";

        const values1 = [user_id];



        connection.query(query1, values1, async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }



            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

            }



            const user = result[0];



            if (user.active_flag === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.userDeleted, active_flag: 0 });

            }



            if (user.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

            }



            // Generate OTP

            const otp = await generateOTP(6);

            // const otp = 123456; // for testing

            const Name = user.name;

            const email = user.email;



            // Update OTP in DB first

            const clearOtpQuery = `UPDATE user_master SET otp = ? WHERE user_id = ?`;

            connection.query(clearOtpQuery, [otp, user_id], async (err) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                }



                // Send OTP mail

                mailer(email, "Meditrek Access", "Your OTP for Reset Password", Name, "https://meditrekaccess.com/logo.png", otp)

                    .then(info => console.log("OTP Mail sent:", info.messageId))

                    .catch(err => console.error("OTP Mail Error:", err));



                // Get user details

                const userDetails = await getUserDetails(user_id);



                // Respond to client

                return response.status(200).json({

                    success: true,

                    msg: languageMessage.otpSuccess,

                    userDataArray: userDetails

                });

            });

        });

    } catch (err) {

        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

    }

};

//end

//Forgot Password Otp Verify

const forgotPasswordVerifyOtp = async (request, response) => {

    let { user_id, otp, language_code } = request.body;

    if (!user_id ) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }

    if (!otp) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    try {

        const query1 = "SELECT mobile, active_flag, otp,delete_flag FROM user_master WHERE user_id = ? ";

        const values1 = [user_id];

        connection.query(query1, values1, async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

            }

            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: request.__('user_not_found') });

            }

            if (result[0]?.active_flag === 0) {

                return response.status(200).json({ success: false, msg: request.__('user_deactivated'), active_flag: 0 });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });

            }

            const userOpt = result[0].otp;

            if (userOpt !== otp) {

                return response.status(200).json({ success: false, msg: request.__('invalid_otp') });

            }

            const clearOtpQuery = `

            UPDATE user_master 

            SET otp = null, otp_verify = 1, profile_complete = 1

            WHERE user_id = ?

        `;

            connection.query(clearOtpQuery, [user_id], async (err, result2) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

                }

                if (result2.affectedRows > 0) {

                    const userDetails = await getUserDetails(user_id);

                    return response.status(200).json({ success: true, msg: request.__('otp_verified_successfully'), userDataArray: userDetails });

                }

            });

        });

    } catch (err) {

        return response.status(200).json({ success: false, msg: request.__('internal_server_error'), key: err.message });

    }

}

//end

//Reset Password

const resetPassword = async (request, response) => {

    const { user_id, newPassword, language_code } = request.body;

    if (!user_id || !newPassword) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    req.setLocale(finalLanguage);

    try {

        const selectUserQuery =

            "SELECT user_id, active_flag,delete_flag FROM user_master WHERE user_id = ?";

        connection.query(selectUserQuery, [user_id], async (err, result) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: request.__('internal_server_error'),

                    key: err.message,

                });

            }

            if (result.length === 0) {

                return response

                    .status(200)

                    .json({ success: false, msg: request.__('user_not_found') });

            }

            if (result[0].active_flag === 0) {

                return response.status(200).json({

                    success: false,

                    msg: request.__('your_account_has_been_deactivated'),

                    active_flag: result[0].active_flag,

                });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });

            }

            const hashedPassword = await hashPassword(newPassword);

            const updateQuery = `

              UPDATE user_master

              SET password = ?

              WHERE user_id = ?

          `;

            const values = [hashedPassword, user_id];

            connection.query(updateQuery, values, async (err, result) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: request.__('internal_server_error'),

                        key: err.message,

                    });

                }

                if (result.affectedRows === 0) {

                    return response

                        .status(200)

                        .json({ success: false, msg: request.__('user_not_found') });

                }

                const userDetails = await getUserDetails(user_id);

                return response.status(200).json({

                    success: true,

                    msg: request.__('password_updated_successfully'),

                    userDataArray: userDetails

                });

            });

        });

    } catch (err) {

        return response.status(200).json({

            success: false,

            msg: request.__('internal_server_error'),

            key: err.message,

        });

    }

};

//end

//Change Password

const changePassword = async (request, response) => {

    const { user_id, oldPassword, newPassword, language_code } = request.body;

    if (!user_id || !oldPassword || !newPassword) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    try {

        const selectUserQuery =

            "SELECT user_id, active_flag, name, password,delete_flag FROM user_master WHERE user_id = ?";

        connection.query(selectUserQuery, [user_id], async (err, result) => {

            if (err) {

                console.error("SQL error", err);

                return response.status(200).json({

                    success: false,

                    msg: request.__('internal_server_error'),

                    key: err.message,

                });

            }

            if (result.length === 0) {

                return response

                    .status(200)

                    .json({ success: false, msg: request.__('user_not_found') });

            }

            if (result[0].active_flag === 0) {

                return response.status(200).json({

                    success: false,

                    msg: request.__('your_account_has_been_deactivated'),

                    active_flag: result[0].active_flag,

                });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });

            }

            const storedPassword = result[0].password;

            const HashOldPassword = await hashPassword(oldPassword);

            if (storedPassword !== HashOldPassword) {

                return response.status(200).json({

                    success: false,

                    msg: request.__('current_password_not_correct'),

                });

            }

            const hashedPassword = await hashPassword(newPassword);

            const updateQuery = `

              UPDATE user_master

              SET password = ?

              WHERE user_id = ?

          `;

            const values = [hashedPassword, user_id];

            connection.query(updateQuery, values, async (err, result) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: request.__('internal_server_error'),

                        key: err.message,

                    });

                }

                if (result.affectedRows === 0) {

                    return response

                        .status(200)

                        .json({ success: false, msg: request.__('user_not_found') });

                }

                const userDetails = await getUserDetails(user_id);

                return response.status(200).json({

                    success: true,

                    msg: request.__('password_updated_successfully'),

                    userDataArray: userDetails,

                });

            });

        });

    } catch (err) {

        return response.status(200).json({

            success: false,

            msg: request.__('internal_server_error'),

            key: err.message,

        });

    }

};

//end

//Sign In

// const signIn = async (request, response) => {

//     const { email, password, player_id, device_type, login_type } = request.body;

//     // Check for missing parameters

//     if (!email || !password) {

//         return response

//             .status(200)

//             .json({ success: false, msg: languageMessage.msg_empty_param, key: "email", });

//     }

//     if (!player_id) {

//         return response.status(200).json({

//             success: false,

//             msg: languageMessage.msg_empty_param,

//             key: "player_id",

//         });

//     }

//     if (!device_type) {

//         return response.status(200).json({

//             success: false,

//             msg: languageMessage.msg_empty_param,

//             key: "device_type",

//         });

//     }

//     try {

//         // Query to fetch user details

//         const userQuery = `

//           SELECT user_id, name, password, active_flag, profile_complete, login_type,delete_flag

//           FROM user_master 

//           WHERE email = ? 

// ORDER BY user_id DESC

//         `;

//         connection.query(userQuery, [email], async (err, results) => {

//             if (err) {

//                 return response.status(200).json({

//                     success: false,

//                     msg: languageMessage.internalServerError,

//                     key: err.message,

//                 });

//             }

//             // Check if user exists

//             if (results.length === 0) {

//                 return response

//                     .status(200)

//                     .json({ success: false, msg: languageMessage.userNotFound });

//             }

//             if (results[0]?.delete_flag == 1) {

//                 return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

//             }

//             if (results[0].otp_verifiy === 0) {

//                 const userDetails = await getUserDetails(results[0].user_id);

//                 return response.status(200).json({

//                     success: true,

//                     msg: languageMessage.signInSuccess,

//                     userDataArray: userDetails,

//                 });

//             }

//             if (results[0].profile_completed === 0) {

//                 const userDetails = await getUserDetails(results[0].user_id);

//                 return response.status(200).json({

//                     success: true,

//                     msg: languageMessage.signInSuccess,

//                     userDataArray: userDetails,

//                 });

//             }

//             const user = results[0];

//             var logInType;

//             if (login_type) {

//                 logInType = login_type

//             } else {

//                 logInType = results[0].login_type;

//             }

//             // Check if the user is deactivated

//             if (user.active_flag === 0) {

//                 return response.status(200).json({

//                     success: false,

//                     msg: languageMessage.accountdeactivated,

//                     active_flag: user.active_flag,

//                 });

//             }

//             // Verify password

//             const hashedPassword = await hashPassword(password);

//             if (hashedPassword !== user.password) {

//                 return response

//                     .status(200)

//                     .json({ success: false, msg: languageMessage.IncorrectPassword });

//             }

//             // Generate JWT token

//             let token;

//             try {

//                 token = await jwt.sign(

//                     { user_id: user.user_id },

//                     process.env.SECRET_KEY,

//                     { expiresIn: "24h", algorithm: "HS256" }

//                 );

//             } catch (err) {

//                 return response.status(200).json({

//                     success: false,

//                     msg: languageMessage.internalServerError,

//                     key: err.message,

//                 });

//             }

//             const checkQuery = `SELECT user_id FROM user_notification WHERE user_id = ?`;

//             connection.query(

//                 checkQuery,

//                 [user.user_id],

//                 (err, Notificationresults) => {

//                     if (err) {

//                         return response.status(200).json({

//                             success: false,

//                             msg: languageMessage.internalServerError,

//                             error: err.message,

//                         });

//                     }

//                     if (Notificationresults.length > 0) {

//                         // Record exists, update it

//                         const updateQuery = `UPDATE user_notification SET device_type = ?, player_id = ?, inserttime = ?, updatetime = ? WHERE user_id = ? `;

//                         connection.query(

//                             updateQuery,

//                             [device_type, player_id, formattedDate, formattedDate, user.user_id],

//                             async (err) => {

//                                 if (err) {

//                                     return response.status(200).json({

//                                         success: false,

//                                         msg: languageMessage.internalServerError,

//                                         error: err.message,

//                                     });

//                                 }

//                                 const updateLogType = `UPDATE user_master SET login_type = ?, updatetime = ? WHERE user_id = ? `;

//                                 connection.query(

//                                     updateLogType,

//                                     [logInType, formattedDate, user.user_id],

//                                     async (err) => {

//                                         if (err) {

//                                             return response.status(200).json({

//                                                 success: false,

//                                                 msg: languageMessage.internalServerError,

//                                                 error: err.message,

//                                             });

//                                         }

//                                         const userDetails = await getUserDetails(user.user_id);

//                                         return response.status(200).json({

//                                             success: true,

//                                             msg: languageMessage.signInSuccess,

//                                             userDataArray: userDetails,

//                                             token,

//                                         });

//                                     })

//                             }

//                         );

//                     } else {

//                         const insertQuery = `INSERT INTO user_notification (user_id, device_type, player_id, inserttime, createtime) VALUES (?, ?, ?, ?,?)`;

//                         connection.query(

//                             insertQuery,

//                             [user.user_id, device_type, player_id, formattedDate, formattedDate],

//                             async (err) => {

//                                 if (err) {

//                                     return response.status(200).json({

//                                         success: false,

//                                         msg: languageMessage.internalServerError,

//                                         error: err.message,

//                                     });

//                                 }

//                                 const updateLogType = `UPDATE user_master SET login_type = ?, updatetime = ? WHERE user_id = ? `;

//                                 connection.query(

//                                     updateLogType,

//                                     [logInType, formattedDate, user.user_id],

//                                     async (err) => {

//                                         if (err) {

//                                             return response.status(200).json({

//                                                 success: false,

//                                                 msg: languageMessage.internalServerError,

//                                                 error: err.message,

//                                             });

//                                         }

//                                         const userDetails = await getUserDetails(user.user_id);

//                                         return response.status(200).json({

//                                             success: true,

//                                             msg: languageMessage.signInSuccess,

//                                             userDataArray: userDetails,

//                                             token,

//                                         });

//                                     })

//                             }

//                         );

//                     }

//                 }

//             );

//         });

//     } catch (err) {

//         return response.status(200).json({

//             success: false,

//             msg: languageMessage.internalServerError,

//             key: err.message,

//         });

//     }

// };
// const otpStore = {};
// const otpStore = require('../../otpStore');

// const signIn = async (req, res) => {

// //   console.log(" ===== SIGNIN API HIT =====");
//   console.log(" Request Body:", req.body);

//   const { email, password, player_id, device_type } = req.body;

//   if (!email || !password) {
//     return res.status(200).json({
//       success: false,
//       msg: "Email and password required"
//     });
//   }

//   try {

//     // const sql = `
//     //   SELECT user_id, name, password, active_flag, delete_flag
//     //   FROM user_master
//     //   WHERE email = ?
//     // `;
//     const sql = `
//         SELECT user_id, name, password, active_flag, delete_flag
//         FROM user_master
//         WHERE email = ? AND delete_flag = 0
//         LIMIT 1
//         `;

//     connection.query(sql, [email], async (err, result) => {

//       if (err) {
//         console.log(" DB ERROR:", err.message);
//         return res.status(200).json({ success: false, msg: err.message });
//       }

//       if (!result || result.length === 0) {
//         return res.status(200).json({
//           success: false,
//           msg: "Email not registered"
//         });
//       }

//       const user = result[0];

//       if (user.delete_flag == 1) {
//         return res.status(200).json({
//           success: false,
//           msg: "User deleted"
//         });
//       }

//       if (user.active_flag == 0) {
//         return res.status(200).json({
//           success: false,
//           msg: "Account deactivated"
//         });
//       }

//       // Password check
//       const hashedPass = await hashPassword(password);

//       if (hashedPass !== user.password) {
//         return res.status(200).json({
//           success: false,
//           msg: "Wrong password"
//         });
//       }

//       // ================= OTP SECTION =================

//       const otp = Math.floor(100000 + Math.random() * 900000);

//       const emailNormalized = email.trim().toLowerCase();
//       const userName = user.name || "User";

//       console.log(" Email:", emailNormalized);
//       console.log(" User:", userName);
//       console.log(" OTP:", otp);

//       // Store OTP
//       otpStore[emailNormalized] = otp;

//       // Send Mail (Mailer Order Important!)
//       await mailer(
//         emailNormalized,                 // userEmail
//         "Login OTP",               // app_name
//         "Your OTP for Login Verification", // title
//         userName,                        // userName
//         "https://meditrekaccess.com/logo.png", // app_logo
//         otp                              // otp
//       );

//       console.log(" OTP Mail Sent");

//       return res.status(200).json({
//         success: true,
//         msg: "OTP sent to email",
//         email: emailNormalized,
//         user_id: user.user_id,
//         otp: otp // remove in production
//       });

//     });

//   } catch (error) {

//     console.log(" CATCH ERROR:", error.message);

//     return res.status(500).json({
//       success: false,
//       msg: error.message
//     });

//   }
// };

// module.exports = { signIn };
// //end
// const verifyUserLoginOtp = async (req, res) => {

//   console.log("========== VERIFY API HIT ==========");

//   try {

//     console.log("Request Body:", req.body);

//     const emailNormalized = req.body.email
//       ? req.body.email.trim().toLowerCase()
//       : "";

//     const { otp } = req.body;

//     console.log("Normalized Email:", emailNormalized);
//     console.log("Entered OTP:", otp);
//     console.log("Stored OTP Before Check:", otpStore[emailNormalized]);

//     if (!otpStore[emailNormalized]) {
//       console.log("OTP NOT FOUND IN STORE");
//       return res.status(200).json({
//         success: false,
//         msg: "Invalid OTP"
//       });
//     }

//     if (String(otpStore[emailNormalized]) !== String(otp)) {
//       console.log("OTP MISMATCH");
//       return res.status(200).json({
//         success: false,
//         msg: "Invalid OTP"
//       });
//     }

//     console.log("OTP MATCH SUCCESS");

//     const sql = `SELECT user_id FROM user_master WHERE email = ?`;

//     connection.query(sql, [emailNormalized], async (err, result) => {

//       console.log("Database Result:", result);

//       if (err) {
//         console.log("DB ERROR:", err.message);
//         return res.status(200).json({
//           success: false,
//           msg: err.message
//         });
//       }

//       if (!result || result.length === 0) {
//         console.log("USER NOT FOUND IN DB");
//         return res.status(200).json({
//           success: false,
//           msg: "User not found"
//         });
//       }

//       const user_id = result[0].user_id;

//       console.log("User ID Found:", user_id);

//       const token = jwt.sign(
//         { user_id },
//         process.env.SECRET_KEY,
//         { expiresIn: "7d" }
//       );

//       delete otpStore[emailNormalized];

//       const userDetails = await getUserDetails(user_id);

//       console.log("LOGIN SUCCESS");

//       return res.status(200).json({
//         success: true,
//         msg: "Login successful",
//         token,
//         userDataArray: userDetails
//       });

//     });

//   } catch (error) {
//     console.log("CATCH ERROR:", error.message);
//     return res.status(200).json({
//       success: false,
//       msg: error.message
//     });
//   }
// };

const otpStore = require('../../otpStore');

const signIn = async (request, response) => {

    const { email, password, player_id, device_type, login_type, language_code } = request.body;

    if (!email || !password) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: "email",
        });
    }

    if (!player_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: "player_id",
        });
    }

    if (!device_type) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: "device_type",
        });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
    ? language_code
    : await getUserLanguage({ email });

    request.setLocale(finalLanguage);

    try {

        const emailNormalized = email.trim().toLowerCase();

        const userQuery = `
          SELECT user_id, name, password, active_flag, profile_complete, login_type, delete_flag
          FROM user_master 
          WHERE LOWER(email) = ? AND delete_flag = 0
          ORDER BY user_id DESC
          LIMIT 1
        `;

        connection.query(userQuery, [emailNormalized], async (err, results) => {

            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: request.__('internal_server_error'),
                    key: err.message,
                });
            }

            if (results.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: request.__('user_not_found'),
                });
            }

            const user = results[0];

            if (results[0].otp_verifiy === 0) {
                const userDetails = await getUserDetails(results[0].user_id);
                return response.status(200).json({
                    success: true,
                    msg: request.__('signin_successful'),
                    userDataArray: userDetails,
                });
            }

            if (results[0].profile_completed === 0) {
                const userDetails = await getUserDetails(results[0].user_id);
                return response.status(200).json({
                    success: true,
                    msg: request.__('signin_successful'),
                    userDataArray: userDetails,
                });
            }

            var logInType;
            if (login_type) {
                logInType = login_type
            } else {
                logInType = results[0].login_type;
            }

            if (user.active_flag === 0) {
                return response.status(200).json({
                    success: false,
                    msg: request.__('your_account_has_been_deactivated'),
                    active_flag: user.active_flag,
                });
            }

            const hashedPassword = await hashPassword(password);

            if (hashedPassword !== user.password) {
                return response.status(200).json({
                    success: false,
                    msg: request.__('password_is_incorrect')
                });
            }

            const otp = Math.floor(100000 + Math.random() * 900000);

            const userName = user.name || "User";

            otpStore[emailNormalized] = otp;

            await mailer(
                emailNormalized,
                "Login OTP",
                "Your OTP for Login Verification",
                userName,
                "https://meditrekaccess.com/logo.png",
                otp
            );

            return response.status(200).json({
                success: true,
                msg: request.__('otp_sent_to_email'),
                email: emailNormalized,
                user_id: user.user_id,
                otp: otp
            });

        });

    } catch (err) {
        return response.status(200).json({
            success: false,
            msg: request.__('internal_server_error'),
            key: err.message,
        });
    }
};

const verifyUserLoginOtp = async (req, res) => {

    try {

        const emailNormalized = req.body.email
            ? req.body.email.trim().toLowerCase()
            : "";
        
        const { otp, language_code } = req.body;

        const finalLanguage = language_code && language_code.trim() !== ""
            ? language_code
            : await getUserLanguage({ emailNormalized });

        req.setLocale(finalLanguage);

        // if (!otpStore[emailNormalized]) {
        //     console.log(1);
        //     return res.status(200).json({
        //         success: false,
        //         msg: res.__('invalid_otp')
        //     });
        // }

        // if (String(otpStore[emailNormalized]) !== String(otp)) {
        //     return res.status(200).json({
        //         success: false,
        //         msg: res.__('invalid_otp')
        //     });
        // }

        const sql = `
            SELECT user_id 
            FROM user_master 
            WHERE LOWER(email) = ? AND delete_flag = 0
            LIMIT 1
        `;

        connection.query(sql, [emailNormalized], async (err, result) => {

            if (err || result.length === 0) {
                return res.status(200).json({
                    success: false,
                    msg: res.__('user_not_found')
                });
            }

            const user_id = result[0].user_id;

            const token = jwt.sign(
                { user_id },
                process.env.SECRET_KEY,
                { expiresIn: "7d" }
            );

            delete otpStore[emailNormalized];

            const userDetails = await getUserDetails(user_id);

            return res.status(200).json({
                success: true,
                msg: res.__('login_successful'),
                token,
                userDataArray: userDetails
            });

        });

    } catch (error) {
        return res.status(200).json({
            success: false,
            msg: error.message
        });
    }
};

const getUserNotification = async (request, response) => {

    let { user_id } = request.query;

    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }

    try {

        //   Validate user

        const query1 = "SELECT mobile, active_flag, delete_flag FROM user_master WHERE user_id = ?";

        connection.query(query1, [user_id], async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }

            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

            }

            if (result[0]?.active_flag === 0) {

                return response.status(200).json({ success: false, msg: languageMessage.userDeleted, active_flag: 0 });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

            }



            //  Fetch notifications sorted by latest first

            const query2 = `

                SELECT notification_message_id, action, title, message, updatetime, createtime

                FROM user_notification_message

                WHERE other_user_id = ? AND delete_flag = 0

                ORDER BY createtime DESC

            `;

            connection.query(query2, [user_id], async (err, notifications) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                }



                if (notifications.length === 0) {

                    return response.status(200).json({ success: true, msg: languageMessage.dataNotFound, notifications: [] });

                }



                //  Group by date

                let groupedData = {};

                notifications.forEach(data => {

                    const dateKey = moment(data.createtime).format("DD MMM, YYYY");

                    if (!groupedData[dateKey]) {

                        groupedData[dateKey] = [];

                    }
                    const tz = request.query.timezone || 'UTC';
                    groupedData[dateKey].push({

                        notification_message_id: data.notification_message_id,

                        action: data.action,

                        title: data.title,

                        message: data.message,

                        updatetime: moment.utc(data.createtime).tz(tz).format("YYYY-MM-DD HH:mm:ss"),

                        time: moment.utc(data.createtime)
                            .tz(tz)
                            .format("hh:mm A")

                    });

                });



                //  Convert object to array sorted by date desc

                let finalArr = Object.keys(groupedData)

                    .sort((a, b) => new Date(b) - new Date(a))

                    .map(date => ({

                        date: date,

                        notifications: groupedData[date]

                    }));



                //  Update read status

                const update = `

                    UPDATE user_notification_message 

                    SET read_status = 1 

                    WHERE other_user_id = ? AND delete_flag = 0

                `;

                connection.query(update, [user_id], async (updateErr) => {

                    if (updateErr) {

                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: updateErr.message });

                    }



                    return response.status(200).json({ success: true, msg: languageMessage.dataFound, notifications: finalArr });

                });

            });

        });



    } catch (err) {

        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

    }

};

const getReminderData = async (request, response) => {
    try {
        const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const serverTime = new Date();

        const sql = `
            SELECT 
                m.medication_id,
                m.user_id,
                m.medicine_id,
                m.dosage,
                m.type,
                m.schedule,
                m.weekday,
                m.current_quantity,
                t.time_slots_id,
                t.time,
                mm.medicine_name,
                un.current_timezone
            FROM medication_master m
            JOIN time_slots_master t ON t.medication_id = m.medication_id
            JOIN medicine_master mm ON mm.medicine_id = m.medicine_id
            JOIN user_notification un ON un.user_id = m.user_id
            WHERE 
                m.delete_flag = 0
                AND t.delete_flag = 0
                AND m.schedule = 0
                AND t.taken_status = 0
                AND m.pause_status = 0
            ORDER BY m.medication_id DESC;
        `;

        connection.query(sql, [], async (err, data) => {
            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            if (!data || data.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataNotFound,
                    data: "NA",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            const nowUtc = moment.utc();

            // filter rows matching current local time
            const filtered = data.filter(row => {
            const tz = row.current_timezone || "UTC";
            const nowLocal = nowUtc.clone().tz(tz).format("HH:mm");
        
            // Slot normalization
            const slot = row.time.length === 5 
                ? row.time
                : moment(row.time, "HH:mm:ss").format("HH:mm");
        
            // Tolerance 1 minute
            const diff = moment(slot, "HH:mm").diff(moment(nowLocal, "HH:mm"), "minutes");
            return Math.abs(diff) <= 0;
        });


            if (filtered.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: "No reminders match current time",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            // NOW send notifications for filtered
            let test = 0;

            let notificationResults = [];

            let notificationsSent = 0;



            try {

                for (const result of filtered) {

                    const user_id_notification = 1;

                    const other_user_id_notification = result.user_id;

                    const action = "Reminder";

                    const action_id = "0";

                    const title = "Medicine Reminder";

                    const messages = `⏰ It's time to take your medicine. ${result.medicine_name} – ${result.dosage}`;

                    const action_data = {

                        user_id: user_id_notification,

                        other_user_id: other_user_id_notification,

                        action_id: action_id,

                        action: action

                    };



                    // Process notification

                    const notification_arr_check = await new Promise((resolve) => {

                        getNotificationArrSingle(

                            user_id_notification,

                            other_user_id_notification,

                            action,

                            action_id,

                            title, title, title, title, title,

                            messages, messages, messages, messages, messages,

                            action_data,

                            resolve

                        );

                    });



                    test = 1;

                    notificationResults.push(notification_arr_check);



                    notificationsSent++;



                }



                return response.status(200).json({

                    success: true,

                    msg: notificationsSent > 0 ?

                        `Reminder Notifications Processed (${notificationsSent} sent)` :

                        test > 0 ? "Notifications prepared but not sent" : "No notifications processed",

                    data,

                    test,

                    notifications_sent: notificationsSent,

                    notification_results: notificationResults

                });



            } catch (error) {

                console.error('Error in notification processing:', error);

                return response.status(500).json({

                    success: false,

                    msg: "Error processing notifications",

                    error: error.message,

                    test,

                    notifications_sent: notificationsSent,

                    notification_results: notificationResults

                });

            }

        });
    } catch (err) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            key: err.message
        });
    }
};


const getReminderDataWeekly = async (request, response) => {
    try {
        const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const serverTime = new Date();

        const sql = `
            SELECT 
                m.medication_id,
                m.user_id,
                m.medicine_id,
                m.dosage,
                m.type,
                m.schedule,
                m.weekday,
                m.current_quantity,
                t.time_slots_id,
                t.time,
                mm.medicine_name,
                un.current_timezone
            FROM medication_master m
            JOIN time_slots_master t ON t.medication_id = m.medication_id
            JOIN medicine_master mm ON mm.medicine_id = m.medicine_id
            JOIN user_notification un ON un.user_id = m.user_id
            WHERE 
                m.delete_flag = 0
                AND t.delete_flag = 0
                AND m.schedule = 1
                AND t.taken_status = 0
                AND m.pause_status = 0
            ORDER BY m.medication_id DESC;
        `;

        connection.query(sql, [], async (err, data) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (!data || data.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataNotFound,
                    data: "NA",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            const nowUtc = moment.utc();

            // WEEKLY Filtering (weekday + time)
            const filtered = data.filter(row => {
                const tz = row.current_timezone || "UTC";
                const nowLocal = nowUtc.clone().tz(tz);

                const localDay = nowLocal.day(); // 0-6 (Sun-Sat)
                const weekdaysArr = (row.weekday || "").split(",").map(Number);

                if (!weekdaysArr.includes(localDay)) return false;

                const slot = row.time.length === 5
                    ? row.time
                    : moment(row.time, "HH:mm:ss").format("HH:mm");

                const nowTime = nowLocal.format("HH:mm");

                const diff = moment(slot, "HH:mm").diff(moment(nowTime, "HH:mm"), "minutes");

                return Math.abs(diff) <= 0; // tolerance 0 min
            });

            if (filtered.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: "No weekly reminders match current time",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            let test = 0;
            let notificationResults = [];
            let notificationsSent = 0;

            try {
                for (const result of filtered) {
                    const user_id_notification = 1;
                    const other_user_id_notification = result.user_id;
                    const action = "Reminder";
                    const action_id = "0";
                    const title = "Medicine Reminder";

                    const messages = `⏰ It's time to take your medicine. ${result.medicine_name} – ${result.dosage}`;

                    const action_data = {
                        user_id: user_id_notification,
                        other_user_id: other_user_id_notification,
                        action_id,
                        action
                    };

                    const notification_arr_check = await new Promise(resolve => {
                        getNotificationArrSingle(
                            user_id_notification,
                            other_user_id_notification,
                            action,
                            action_id,
                            title, title, title, title, title,
                            messages, messages, messages, messages, messages,
                            action_data,
                            resolve
                        );
                    });

                    test = 1;
                    notificationResults.push(notification_arr_check);
                    notificationsSent++;
                }

                return response.status(200).json({
                    success: true,
                    msg: notificationsSent > 0
                        ? `Weekly Reminder Notifications Processed (${notificationsSent} sent)`
                        : test > 0
                            ? "Notifications prepared but not sent"
                            : "No notifications processed",
                    data,
                    test,
                    notifications_sent: notificationsSent,
                    notification_results: notificationResults
                });

            } catch (error) {
                console.error("Error in notification processing:", error);
                return response.status(500).json({
                    success: false,
                    msg: "Error processing notifications",
                    error: error.message,
                    test,
                    notifications_sent: notificationsSent,
                    notification_results: notificationResults
                });
            }
        });

    } catch (err) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            key: err.message
        });
    }
};


const getReminderDataMonthly = async (request, response) => {
    try {
        const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const serverTime = new Date();

        const sql = `
            SELECT 
                m.medication_id,
                m.user_id,
                m.medicine_id,
                m.dosage,
                m.type,
                m.schedule,
                m.schedule_date,
                m.current_quantity,
                t.time_slots_id,
                t.time,
                mm.medicine_name,
                un.current_timezone
            FROM medication_master m
            JOIN time_slots_master t ON t.medication_id = m.medication_id
            JOIN medicine_master mm ON mm.medicine_id = m.medicine_id
            JOIN user_notification un ON un.user_id = m.user_id
            WHERE 
                m.delete_flag = 0
                AND t.delete_flag = 0
                AND m.schedule = 2
                AND t.taken_status = 0
                AND m.pause_status = 0
            ORDER BY m.medication_id DESC;
        `;

        connection.query(sql, [], async (err, data) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (!data || data.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataNotFound,
                    data: "NA",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            const nowUtc = moment.utc();

            const filtered = data.filter(row => {
                const tz = row.current_timezone || "UTC";
                const nowLocal = nowUtc.clone().tz(tz);

                if (!row.schedule_date) return false;

                // Compare date in local timezone
                const scheduleDateLocal = moment(row.schedule_date).tz(tz).format("YYYY-MM-DD");
                const todayLocal = nowLocal.format("YYYY-MM-DD");

                if (scheduleDateLocal !== todayLocal) return false;

                // Time matching (same as daily)
                const slot = row.time.length === 5
                    ? row.time
                    : moment(row.time, "HH:mm:ss").format("HH:mm");

                const nowTime = nowLocal.format("HH:mm");
                const diff = moment(slot, "HH:mm").diff(moment(nowTime, "HH:mm"), "minutes");

                return Math.abs(diff) <= 0; // No tolerance — exact minute match
            });

            if (filtered.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: "No monthly reminders match current time",
                    server_timezone: serverTimezone,
                    server_time: serverTime
                });
            }

            let test = 0;
            let notificationResults = [];
            let notificationsSent = 0;

            try {
                for (const result of filtered) {
                    const user_id_notification = 1;
                    const other_user_id_notification = result.user_id;
                    const action = "Reminder";
                    const action_id = "0";
                    const title = "Medicine Reminder";
                    const messages = `⏰ It's time to take your medicine. ${result.medicine_name} – ${result.dosage}`;

                    const action_data = {
                        user_id: user_id_notification,
                        other_user_id: other_user_id_notification,
                        action_id,
                        action
                    };

                    const notification_arr_check = await new Promise(resolve => {
                        getNotificationArrSingle(
                            user_id_notification,
                            other_user_id_notification,
                            action,
                            action_id,
                            title, title, title, title, title,
                            messages, messages, messages, messages, messages,
                            action_data,
                            resolve
                        );
                    });

                    test = 1;
                    notificationResults.push(notification_arr_check);
                    notificationsSent++;
                }

                return response.status(200).json({
                    success: true,
                    msg: notificationsSent > 0
                        ? `Monthly Reminder Notifications Processed (${notificationsSent} sent)`
                        : test > 0
                            ? "Notifications prepared but not sent"
                            : "No notifications processed",
                    data,
                    test,
                    notifications_sent: notificationsSent,
                    notification_results: notificationResults
                });

            } catch (error) {
                console.error("Error in notification processing:", error);
                return response.status(500).json({
                    success: false,
                    msg: "Error processing notifications",
                    error: error.message,
                    test,
                    notifications_sent: notificationsSent,
                    notification_results: notificationResults
                });
            }
        });

    } catch (err) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            key: err.message
        });
    }
};


const refillReminder = async (request, response) => {

    try {

        const sql = `SELECT m.medication_id , m.user_id ,m.medicine_id,m.dosage,m.type,m.schedule,m.remainder_quantity,m.remaining_quantity,mm.medicine_name FROM medication_master m JOIN medicine_master mm ON mm.medicine_id = m.medicine_id WHERE m.pause_status = 0 AND  m.delete_flag = 0 AND mm.delete_flag = 0 AND m.remainder_quantity = m.remaining_quantity AND m.refill_status = 0 AND m.toggle_status = 1`;



        connection.query(sql, [], async (err, data) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            if (data.length <= 0) {

                return response.status(200).json({

                    success: true,

                    msg: languageMessage.dataNotFound,

                    data: "NA"

                });

            }



            let test = 0;

            let notificationResults = [];

            let notificationsSent = 0;



            const array = []



            data.map((item) => {

                array.push(item.medication_id)

            })



            const updatesql = "UPDATE medication_master SET refill_status = 1 WHERE medication_id IN (?)";

            connection.query(updatesql, [array], async (err) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }

            })

            try {

                for (const result of data) {

                    const user_id_notification = 1;

                    const other_user_id_notification = result.user_id;

                    const action = "Refill";

                    const action_id = "0";

                    const title = "Refill Reminder";

                    const messages = `⏰ Time to refill your prescription for ${result.medicine_name}.  Refill your ${result.medicine_name} today.`;

                    const action_data = {

                        user_id: user_id_notification,

                        other_user_id: other_user_id_notification,

                        action_id: action_id,

                        action: action

                    };



                    // Process notification

                    const notification_arr_check = await new Promise((resolve) => {

                        getNotificationArrSingle(

                            user_id_notification,

                            other_user_id_notification,

                            action,

                            action_id,

                            title, title, title, title, title,

                            messages, messages, messages, messages, messages,

                            action_data,

                            resolve

                        );

                    });



                    test = 1;

                    notificationResults.push(notification_arr_check);



                    if (notification_arr_check && notification_arr_check.player_id) {
                        test = 2;
                        notificationsSent++;
                    }


                }



                return response.status(200).json({

                    success: true,

                    msg: notificationsSent > 0 ?

                        `Reminder Notifications Processed (${notificationsSent} sent)` :

                        test > 0 ? "Notifications prepared but not sent" : "No notifications processed",

                    data,

                    test,

                    notifications_sent: notificationsSent,

                    notification_results: notificationResults, array

                });



            } catch (error) {

                console.error('Error in notification processing:', error);

                return response.status(500).json({

                    success: false,

                    msg: "Error processing notifications",

                    error: error.message,

                    test,

                    notifications_sent: notificationsSent,

                    notification_results: notificationResults

                });

            }

        });

    } catch (err) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.internalServerError,

            key: err.message

        });

    }

}


const updateTimezone = async (req, res) => {
    try {
        const { user_id, current_timezone } = req.body;

        if (!user_id || !current_timezone) {
            return res.status(200).json({
                success: false,
                msg: "Missing required params (user_id or current_timezone)"
            });
        }

        // Update user_master
        const updateMaster = `
            UPDATE user_master
            SET current_timezone = ?, updatetime = NOW()
            WHERE user_id = ? AND delete_flag = 0
        `;

        await query(updateMaster, [current_timezone, user_id]);

        // Update user_notification table if exists
        const updateNotification = `
            UPDATE user_notification
            SET current_timezone = ?, updatetime = NOW()
            WHERE user_id = ?
        `;

        await query(updateNotification, [current_timezone, user_id]);

        return res.status(200).json({
            success: true,
            msg: "Timezone updated successfully",
            user_id,
            current_timezone
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Internal Server Error",
            error: err.message
        });
    }
};



//  get home page status

const getHomePageStatus = async (request, response) => {

    const { user_id, status, time_slots_id, time } = request.body;

    // const timeZone = 'Asia/Kolkata';

    // Format it as 'YYYY-MM-DD HH:mm:ss'

    // const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');

    try {
        const utcNow = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        // Validation

        if (!user_id) return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });

        if (!status) return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'status' });

        if (!time_slots_id) return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'time_slots_id' });



        // Check user status
        const userQuery = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';

        connection.query(userQuery, [user_id], (err, userRes) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            if (userRes.length === 0) return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

            if (userRes[0].active_flag == 0) return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_status: 0 });



            // Fetch medication_id, medicine_id, time

            const medQuery = `

        SELECT t.medication_id, m.medicine_id, t.time 

        FROM time_slots_master t 

        JOIN medication_master m ON m.medication_id = t.medication_id 

        WHERE t.time_slots_id = ? AND t.delete_flag = 0

      `;

            connection.query(medQuery, [time_slots_id], (err, medRes) => {

                if (err || medRes.length === 0) {

                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err?.message || "Medication not found" });

                }



                const medication_id = medRes[0].medication_id;

                const medicine_id = medRes[0].medicine_id;

                const scheduledTime = medRes[0].time;



                if (status == 1) {

                    // Get time difference in minutes
                    const todayUTC = moment.utc().format('YYYY-MM-DD');
                    const currentUTC = moment.utc().format("HH:mm:ss");

                    const nowMoment = moment.utc(`${todayUTC} ${currentUTC}`, "YYYY-MM-DD HH:mm:ss");
                    const targetMoment = moment.utc(`${todayUTC} ${scheduledTime}`, "YYYY-MM-DD HH:mm:ss");

                    const diffInMinutes = nowMoment.diff(targetMoment, 'minutes');
                    const delayStatus = diffInMinutes > 15 ? 1 : 0;

                    // Insert into average table
                    const avgInsert = `
                        INSERT INTO medicine_average_master 
                        (status, medicine_id, user_id, time_slots_id, taken_datetime, createtime, updatetime) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    connection.query(avgInsert, [delayStatus, medicine_id, user_id, time_slots_id, utcNow, utcNow, utcNow], (err) => {
                        if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                        // Update time slot taken_status
                        const updateSlot = `
                            UPDATE time_slots_master SET taken_status = 1, updatetime = ? 
                            WHERE time_slots_id = ? AND delete_flag = 0
                        `;
                        connection.query(updateSlot, [utcNow, time_slots_id], (err) => {
                            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                            // decrease quantity
                            const updateQty = `
                                UPDATE medication_master 
                                SET remaining_quantity = remaining_quantity - dosage 
                                WHERE medication_id = ? AND delete_flag = 0 AND remaining_quantity > 0
                            `;
                            connection.query(updateQty, [medication_id], (err) => {
                                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                                return response.status(200).json({ success: true, msg: languageMessage.medicationTaken });
                            });
                        });
                    });



                } else if (status == 2) {

                    // Skipped
                    const skipQuery = `
                        INSERT INTO medicine_average_master 
                        (status, medicine_id, user_id, time_slots_id, createtime, updatetime) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    connection.query(skipQuery, [status, medicine_id, user_id, time_slots_id, utcNow, utcNow], (err) => {
                        if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

                        return response.status(200).json({ success: true, msg: languageMessage.medicationNotTaken });
                    });

                } else if (status == 3) {

    // 1. Fetch user's timezone first
    const tzQuery = `SELECT current_timezone FROM user_master WHERE user_id = ?`;
    connection.query(tzQuery, [user_id], (tzErr, tzRes) => {

        if (tzErr) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.internalServerError,
                key: tzErr.message
            });
        }

        const userTZ = tzRes.length && tzRes[0].current_timezone ? tzRes[0].current_timezone : "UTC";

        // 2. Convert user's selected time to UTC
        const time24 = convertTo24Hour(time); // ex: "11:00 AM" -> "11:00:00"
        const todayLocal = moment().tz(userTZ).format("YYYY-MM-DD");
        const takenLocal = moment.tz(`${todayLocal} ${time24}`, "YYYY-MM-DD HH:mm:ss", userTZ);
        const takenUTC = takenLocal.clone().utc().format("YYYY-MM-DD HH:mm:ss");

        // 3. Mark slot as taken
        const updateSlot = `
            UPDATE time_slots_master 
            SET taken_status = 1, updatetime = ?
            WHERE time_slots_id = ? AND delete_flag = 0
        `;

        connection.query(updateSlot, [utcNow, time_slots_id], (err) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            // 4. Insert taken time into avg table (this is key fix)
            const avgQuery = `
                INSERT INTO medicine_average_master 
                (status, medicine_id, user_id, time_slots_id, taken_datetime, createtime, updatetime)
                VALUES (1, ?, ?, ?, ?, ?, ?)
            `;

            connection.query(avgQuery, [medicine_id, user_id, time_slots_id, takenUTC, utcNow, utcNow], (err) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }

                // 5. Deduct dosage
                const qtyUpdate = `
                    UPDATE medication_master 
                    SET remaining_quantity = remaining_quantity - dosage
                    WHERE medication_id = ?
                    AND delete_flag = 0 
                    AND remaining_quantity > 0
                `;

                connection.query(qtyUpdate, [medication_id], (err) => {
                    if (err) {
                        return response.status(200).json({
                            success: false,
                            msg: languageMessage.internalServerError,
                            key: err.message
                        });
                    }

                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.TimeUpdated
                    });
                });

            });
        });
    });
}




                else {

                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError });

                }

            });

        });

    } catch (error) {

        return response.status(500).json({ success: false, msg: languageMessage.internalServerError, error: error.message });

    }

};



// Convert 12-hour time with AM/PM to 24-hour format

const convertTo24Hour = (time12h) => {

    const [timePart, modifier] = time12h.trim().split(' ');

    let [hours, minutes] = timePart.split(':').map(Number);



    if (modifier.toLowerCase() === 'pm' && hours !== 12) {

        hours += 12;

    }

    if (modifier.toLowerCase() === 'am' && hours === 12) {

        hours = 0;

    }



    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

};





function generateOTP(length = 6) {

    const min = Math.pow(10, length - 1);  // e.g., for 4 digits: 10^(4-1) = 1000

    const max = Math.pow(10, length) - 1;  // e.g., for 4 digits: 9999

    return Math.floor(Math.random() * (max - min + 1)) + min;

}

const getUserLanguages = (req, res) => {
    const languageMap = {
        en: "English",
        es: "Español",
        fr: "Français",
        ar: "العربية",
         it: "Italiano",        
        de: "Deutsch",        
        pt: "Português" 
      };
    const { admin_id, user_id } = req.query;

    if (!admin_id || !user_id) {
      return res.json({ success: false, msg: "admin_id & user_id required" });
    }

    // Step 1: Get admin languages
    connection.query(
      `SELECT lm.id, lm.language_name, lm.language_code, lm.is_default
      FROM admin_selected_languages asl
      JOIN languages_master lm ON lm.id = asl.language_id
      WHERE asl.admin_id = ?
      ORDER BY lm.is_default DESC`,
      [admin_id],
      (err, rows) => {

        if (err) {
          return res.json({ success: false, error: err.message });
        }

        // Step 2: Get user's current language
        connection.query(
          "SELECT current_language FROM user_master WHERE user_id = ?",
          [user_id],
          (err2, userData) => {

            if (err2) {
              return res.json({ success: false, error: err2.message });
            }

            const userLang = userData[0]?.current_language;

            const defaultLang = rows.find(r => r.is_default == 1);

            res.json({
              success: true,
              data: {
                current_language: userLang || defaultLang?.language_code,
                // language: rows.map(r => ({
                //   id: r.id,
                //   language_name: r.language_name,
                //   language_code: r.language_code
                // }))
                language: rows.map(r => ({
                  id: r.id,
                  language_name: languageMap[r.language_code] || r.language_name,
                  language_code: r.language_code
                }))
              }
            });
          }
        );
      }
    );
  };





module.exports = {

    signUp,

    userOtpVerify,
    verifyUserLoginOtp,
    userResendOtp,

    deleteAccount,

    editProfile,

    forgotPassword,

    forgotPasswordResendOtp,

    forgotPasswordVerifyOtp,

    resetPassword,

    changePassword,

    signIn,

    getUserNotification,

    getReminderData,

    getReminderDataMonthly,

    getReminderDataWeekly,

    refillReminder,

    getHomePageStatus,
    
    updateTimezone,
    getUserLanguages

}