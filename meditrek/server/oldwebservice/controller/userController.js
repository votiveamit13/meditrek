const connection = require('../connection/connection.js');

const { getUserData, DeviceTokenStore_1_Signal, hashPassword, getUserForgotPasswordDetails } = require('./function.js');

const languageMessages = require('./languageMessages.js');

const moment = require('moment-timezone');

const { getNotificationArrSingle } = require('./notification.js');

const jwt = require('jsonwebtoken');

const { response } = require('express');

require('dotenv').config();





let createtime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');

let updatetime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');

let key = "123456";



//SignUp...

const signUp = async (request, response) => {

    const { f_name, l_name, mobile, email, user_type, password, player_id, device_type } = request.body;



    try {



        if (!password) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'password' });

        }



        if (!f_name) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'f_name' });

        }



        if (!l_name) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'l_name' });

        }



        if (!mobile) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'mobile' });

        }



        if (!email) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'email' });

        }



        if (!user_type) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_type' });

        }

        if (!player_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'player_id' });

        }

        if (!device_type) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'device_type' });

        }









        var otp = 123456;





        // if user exits



        const sqlCheckUser = 'SELECT user_id,f_name,l_name, email, otp_verify FROM user_master WHERE mobile= ? AND delete_flag = 0';

        connection.query(sqlCheckUser, [mobile], async (err, info) => {



            if (err) {

                return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });

            }



            if (info.length > 0) {



                if (info[0].otp_verify == 1) {

                    return response.status(200).json({ success: false, msg: languageMessages.alreadyRegistered })

                }



                var sql = "UPDATE user_master SET otp=?, updatetime=? WHERE mobile=? AND delete_flag=0";



                connection.query(sql, [otp, updatetime, mobile], async (error, queryResult) => {

                    if (error) {

                        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message, key: '1' });

                    }



                    if (queryResult.affectedRow == 0) {

                        return response.status(200).json({ success: false, msg: languageMessages.signupError });

                    }

                    else {

                        const userDataArray = await getUserData(info[0].user_id);



                        DeviceTokenStore_1_Signal(info[0].user_id, device_type, player_id);

                        let payload = { subject: userDataArray.mobile };



                        key = "123456";



                        const token = jwt.sign(payload, key);



                        return response.status(200).json({ success: true, msg: languageMessages.otpsend, token, userDataArray });

                    }

                });





            }

            else {



                //New User register





                const hashedPassword = await hashPassword(password);



                const sqlInsert = "INSERT INTO user_master( password, f_name, l_name, mobile,email, name, user_type, otp, createtime, updatetime) VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ? )";

                connection.query(sqlInsert, [hashedPassword, f_name, l_name, mobile, email, (f_name + ' ' + l_name), user_type, otp, createtime, updatetime], async (err, result) => {





                    if (err) {

                        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message, key: '3' });

                    }



                    const userDataArray = await getUserData(result.insertId);



                    DeviceTokenStore_1_Signal(userDataArray.user_id, device_type, player_id, (result) => {

                    });



                    const user_id_notification = 1;

                    const other_user_id_notification = result.insertId;

                    const action = 'SignUp';

                    const action_id = result.insertId;

                    const title = 'TheraData';

                    const messages = `You are in! welcome to TheraData app`;

                    const action_data = { user_id: user_id_notification, other_user_id: other_user_id_notification, action_id: action_id, action: action };



                    getNotificationArrSingle(user_id_notification, other_user_id_notification, action, action_id, title, messages, action_data, async (notification_arr_check) => {

                        let notification_arr_check_new = [notification_arr_check];







                        if (notification_arr_check_new && notification_arr_check_new.length !== 0) {

                            const notiSendStatus = await oneSignalNotificationSendCall(notification_arr_check_new);

                        } else {

                            console.log('Notification array is empty');

                        }

                    });



                    let payload = { subject: userDataArray.mobile };



                    key = "123456";



                    const token = jwt.sign(payload, key);





                    return response.status(200).json({

                        success: true,

                        msg: languageMessages.otpsend, token: token, userDataArray: userDataArray

                    });



                });

            }

        });

    }

    catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message, key: '5' });

    }

};



//OTP verify...

const otpVerify = async (request, response) => {

    const { user_id, otp } = request.body;





    try {

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_id' });

        }



        if (!otp) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'otp' });

        }





        const sqlCheckUser = 'SELECT  user_id , active_flag FROM user_master WHERE user_id =? AND delete_flag =0';



        connection.query(sqlCheckUser, [user_id], async (err, result) => {

            if (err) {

                return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });

            }



            if (result.length === 0) {

                return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });

            }



            if (result[0].active_flag === 0) {

                return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated });

            }



            const checksql = 'SELECT otp FROM user_master WHERE user_id =? AND otp = ?';

            connection.query(checksql, [user_id, otp], (error, data) => {



                if (error) {

                    return response.status(200).json({ success: false, msg: languageMessages.internalServerError });

                }



                if (data.length > 0) {

                    const updateSql = 'UPDATE user_master SET otp_verify = 1  ,updatetime = ?, signup_step = 2 WHERE user_id = ?';



                    connection.query(updateSql, [updatetime, user_id], async (error, result) => {

                        if (error) {

                            return response.status(200).json({ success: false, msg: languageMessages.internalServerError });

                        }

                        if (result.affectedRows > 0) {

                            const userDataArray = await getUserData(user_id);



                            if (userDataArray.length === 0) {

                                return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });

                            }



                            return response.status(200).json({ success: true, msg: languageMessages.otpverifysuccess, userDataArray });

                        }

                    });

                }

                else {

                    return response.status(200).json({ success: false, msg: languageMessages.wrongotp })

                }

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, nsg: languageMessages.internalServerError, error: error.message });

    }

}



//  OTP Resend  

const resendOtp = async (request, response) => {

    const { user_id } = request.body;

    try {

        if (!user_id) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param, key: "user_id"

            })

        }

        //check user exist

        const query = "SELECT user_id, mobile, active_flag FROM user_master WHERE user_id = ? and delete_flag=0";

        connection.query(query, [user_id], async (err, info) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (info.length <= 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound, user_id: info.length });

            }

            if (info[0].active_flag === 0) {

                return response.status(200).json({ message: languageMessages.accountdeactivated, account_active_status: 0, });

            }

            var mobile = info[0].mobile;

            // const otp = await sendVerificationEmail(email);

            const otp = 123456;





            const updatetime = new Date();

            const sql = "UPDATE user_master SET otp = ?, updatetime = ? WHERE user_id = ? AND delete_flag = 0";

            connection.query(sql, [otp, updatetime, user_id], async (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message, });

                }

                const user_details = await getUserData(user_id);

                return response.status(200).json({ success: true, message: languageMessages.otpsend, user_details: user_details });



            })



        })

    } catch (error) {



    }



}



//  login 

const login = async (request, response) => {

    let { mobile, password, device_type, player_id, login_type } = request.body;



    try {

        // Validate input parameters

        if (!mobile) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "mobile"

            });

        }

        if (!password) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "password"

            });

        }

        if (!device_type) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "device_type"

            });

        }

        if (!player_id) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "player_id"

            });

        }

        if (!login_type) {

            return response.status(200).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "login_type"

            });

        }



        const checkSql = "SELECT user_id, active_flag, otp_verify, password FROM user_master WHERE mobile = ? AND delete_flag = 0";

        connection.query(checkSql, [mobile], async (err, result) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    message: languageMessages.internalServerError,

                    error: err.message,

                });

            }



            if (result.length > 0) {

                const user = result[0];

                const { user_id, active_flag, otp_verify, password: storedPassword } = user;



                // Check if account is deactivated

                if (active_flag === 0) {

                    return response.status(200).json({

                        success: false,

                        message: languageMessages.accountdeactivated,

                        account_active_status: 0,

                    });

                }



                // Check OTP verification status

                if (otp_verify !== 1) {

                    return response.status(200).json({

                        success: false,

                        message: languageMessages.otpNotVerfied,

                    });

                }



                // Hash the input password

                const hashedPassword = await hashPassword(password);



                // Verify the password

                if (hashedPassword === storedPassword) {

                    try {

                        const user_details = await getUserData(user_id);

                        await DeviceTokenStore_1_Signal(user_id, device_type, player_id, () => { });



                        const token = jwt.sign({ user_id }, 'secret');

                        // user_details.token = token;

                        delete user_details.password;



                        return response.status(200).json({

                            success: true,

                            message: languageMessages.loginSuccessful,

                            user_details,

                            token,

                        });

                    } catch (error) {

                        return response.status(200).json({

                            success: false,

                            message: languageMessages.internalServerError,

                            error: error.message,

                        });

                    }

                } else {

                    // Invalid credentials

                    return response.status(200).json({

                        success: false,

                        message: languageMessages.invalidCredentials,

                    });

                }

            } else {

                // User not found

                return response.status(200).json({

                    success: false,

                    message: languageMessages.mobileNotRegistered,

                });

            }

        });

    } catch (err) {

        // Internal server error

        return response.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

        });

    }

};



// forget password

const forgetPassword = async (request, response) => {

    const { mobile } = request.body;

    try {

        if (!mobile) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "mobile" })

        }

        // check if user exist or not 

        const query = "SELECT user_id, active_flag,user_type,mobile,email FROM user_master WHERE mobile= ? and delete_flag=0";

        connection.query(query, [mobile], async (err, info) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (info.length <= 0) {

                return response.status(200).json({ success: false, message: languageMessages.mobileNotRegistered });

            }

            if (info[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            const email = info[0].email

            const otp = 123456



            const user_id = info[0].user_id;

            const user_type = info[0].user_type;

            const insertsql = "INSERT INTO forgot_password_master (user_id, user_type,email, mobile, otp, createtime, updatetime) VALUES (?, ?, ? , ?, ?, now(), now())";

            const values = [user_id, user_type, email, mobile, otp];

            connection.query(insertsql, values, async (err, info) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (info.affectedRows == 0) {



                }

                const forgot_details = await getUserForgotPasswordDetails(user_id);

                //-----------------response-----------

                return response.status(200).json({ success: true, message: languageMessages.otpsend, forgot_details: forgot_details });

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message })

    }

}



//  Forget password resendotp

const forgetPasswordResendOtp = async (request, response) => {

    const { user_id } = request.body;

    try {

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" })

        }

        // Check if user exists

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, info) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError })

            }

            if (info.length <= 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (info[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            const checkSql = "SELECT forget_id,email FROM forgot_password_master WHERE user_id = ? order by forget_id desc"

            connection.query(checkSql, [user_id], async (err, information) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError })

                }





                const forgot_id = information[0].forget_id;

                const email = information[0].email;

                //generate random otp

                const otp = 123;

                var mobile = info[0].mobile;

                const updatequery = "UPDATE forgot_password_master SET otp = ?, updatetime = ? WHERE user_id = ? AND forget_id = ? AND delete_flag = 0";

                const updatetime = new Date();

                connection.query(updatequery, [otp, updatetime, user_id, forgot_id], async (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }

                    const forgot_details = await getUserForgotPasswordDetails(user_id);

                    return response.status(200).json({ success: true, message: languageMessages.otpsend, forgot_details: forgot_details });

                })

            })

        })



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message })

    }

}



//  Forget password otp verify 

const forgetPasswordOtpVerify = async (request, response) => {

    const { user_id, otp } = request.body;

    try {

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!otp) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "otp" });

        }

        // Check if user exists

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // Verify OTP

            const verifyOtp = "SELECT otp, forget_id FROM forgot_password_master WHERE user_id = ? AND otp = ? ORDER BY forget_id DESC";

            connection.query(verifyOtp, [user_id, otp], async (err, otpInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (otpInfo.length > 0) {

                    const updateQuery = "UPDATE forgot_password_master SET otp_verified = 1 WHERE user_id = ? AND forget_id = ?";

                    connection.query(updateQuery, [user_id, otpInfo[0].forget_id], async (err, updateInfo) => {

                        if (err) {

                            return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                        }

                        const user_details = await getUserData(user_id);

                        return response.status(200).json({ success: true, message: languageMessages.otpverifysuccess, user_details });

                    });

                } else {

                    return response.status(200).json({ success: false, message: languageMessages.wrongotp });

                }

            });

        });

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

};



// change password

const changePassword = async (request, response) => {

    const { user_id, oldPassword, newPassword } = request.body;

    try {

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!oldPassword) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "oldPassword" });

        }

        if (!newPassword) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "newPassword" });

        }

        // check user exist

        const sql = "SELECT user_id, active_flag,password FROM user_master WHERE user_id = ? and delete_flag=0";

        connection.query(sql, [user_id], async (err, info) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (info.length <= 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (info[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            //fetch old password

            const old_Password = await hashPassword(oldPassword);

            const new_Password = await hashPassword(newPassword);

            const password = info[0].password;

            //check if old password and new password are not same

            if (old_Password != password) {

                return response.status(200).json({ success: false, message: languageMessages.currentPasswordIsIncorrect })

            }

            if (new_Password === password) {

                return response.status(200).json({ success: false, message: languageMessages.oldAndNewPasswordSame })

            }



            const updatePassword = "UPDATE user_master SET password = ? WHERE user_id = ?";

            connection.query(updatePassword, [new_Password, user_id], (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (result.affectedRows > 0) {

                    return response.status(200).json({ success: true, message: languageMessages.PasswordUpdated });

                } else {

                    return response.status(200).json({ success: true, message: languageMessages.changePasswordSuccessfullyError, });

                }

            });

        });

    } catch (err) {

        return response.status(200).json({ success: false, message: languageMessages.changePasswordSuccessfullyError, error: err.message, });

    }

};



// delete account

const deleteAccount = async (request, response) => {

    const { user_id } = request.body;

    try {

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }



        //check user exist

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, info) => {

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

                    message: languageMessages.msgUserNotFound,

                });

            }

            if (info[0].active_flag === 0) {

                return response.status(200).json({

                    success: false,

                    message: languageMessages.accountdeactivated,

                    account_active_status: 0,

                });

            }

            var delete_flag = 1;

            const updatesql = "UPDATE user_master SET delete_flag = ?, updatetime = ? WHERE user_id = ? AND delete_flag = 0";

            connection.query(updatesql, [delete_flag, updatetime, user_id],

                (err, info) => {

                    if (err) {

                        return response.status(200).json({

                            success: false,

                            message: languageMessages.internalServerError,

                            error: err.message,

                        });

                    }

                    return response.status(200).json({

                        success: true,

                        message: languageMessages.AccoundDeleted,

                    });

                }

            );

        });

    } catch (err) {

        return response.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

        });

    }

};





// const add_doctor = async (request, response) => {

//     const { user_id, doctor_name, mobile, email, doctor_category_id } = request.body;



//     try {

//         // Validation

//         if (!user_id) {

//             return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

//         }

//         if (!doctor_name) {

//             return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_name" });

//         }

//         if (!mobile) {

//             return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "mobile" });

//         }

//         if (!email) {

//             return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "email" });

//         }

//         if (!doctor_category_id) {

//             return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_category_id	" });

//         }



//         // Check if user exists

//         const userQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

//         connection.query(userQuery, [user_id], (err, userInfo) => {

//             if (err) {

//                 return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

//             }

//             if (userInfo.length === 0) {

//                 return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

//             }

//             if (userInfo[0].active_flag === 0) {

//                 return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

//             }



//             // Check if the phone number already exists in doctor_master (for any user)

//             const phoneCheckQuery = "SELECT doctor_id FROM doctor_master WHERE mobile = ? and user_id=? AND delete_flag = 0";

//             connection.query(phoneCheckQuery, [user_id, mobile], (err, existingDoctor) => {

//                 if (err) {

//                     return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

//                 }

//                 if (existingDoctor.length > 0) {

//                     return response.status(200).json({ success: false, message: languageMessages.mobileExist });

//                 }



//                 // Insert into doctor_master table if mobile does not exist

//                 const insertDoctorQuery = "INSERT INTO doctor_master (user_id, doctor_name, email, mobile, doctor_category_id	) VALUES (?, ?, ?, ?, ?)";

//                 connection.query(insertDoctorQuery, [user_id, doctor_name, email, mobile, doctor_category_id], (err, result) => {

//                     if (err) {

//                         return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

//                     }

//                     return response.status(200).json({ success: true, message: languageMessages.doctorAdded });

//                 });

//             });

//         });

//     } catch (error) {

//         return response.status(200).json({ success: false, message: languageMessages.internalServerError });

//     }

// };

const add_doctor = async (request, response) => {
  const { user_id, doctor_name, mobile, email, doctor_category_id } =
    request.body;

  try {
    // Validation
    if (!user_id) {
      return response
        .status(200)
        .json({
          success: false,
          message: languageMessages.msg_empty_param,
          key: "user_id",
        });
    }

    if (!doctor_name) {
      return response
        .status(200)
        .json({
          success: false,
          message: languageMessages.msg_empty_param,
          key: "doctor_name",
        });
    }

    if (!mobile) {
      return response
        .status(200)
        .json({
          success: false,
          message: languageMessages.msg_empty_param,
          key: "mobile",
        });
    }

    if (!email) {
      return response
        .status(200)
        .json({
          success: false,
          message: languageMessages.msg_empty_param,
          key: "email",
        });
    }

    if (!doctor_category_id) {
      return response
        .status(200)
        .json({
          success: false,
          message: languageMessages.msg_empty_param,
          key: "doctor_category_id",
        });
    }

    // Check if user exists
    const userQuery =
      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(userQuery, [user_id], (err, userInfo) => {
      if (err) {
        return response
          .status(200)
          .json({
            success: false,
            message: languageMessages.internalServerError,
            error: err.message,
          });
      }

      if (userInfo.length === 0) {
        return response
          .status(200)
          .json({ success: false, message: languageMessages.msgUserNotFound });
      }

      if (userInfo[0].active_flag === 0) {
        return response
          .status(200)
          .json({
            success: false,
            message: languageMessages.accountdeactivated,
            account_active_status: 0,
          });
      }

      // Check if the phone number already exists in doctor_master (for any user)
      const phoneCheckQuery =
        "SELECT doctor_id FROM doctor_master WHERE mobile = ? AND user_id = ? AND delete_flag = 0";
      connection.query(
        phoneCheckQuery,
        [mobile, user_id],
        (err, existingDoctor) => {
          if (err) {
            return response
              .status(200)
              .json({
                success: false,
                message: languageMessages.internalServerError,
                error: err.message,
              });
          }

          if (existingDoctor.length > 0) {
            return response
              .status(200)
              .json({ success: false, message: languageMessages.mobileExist });
          }

          // Insert into doctor_master table if mobile does not exist
          const insertDoctorQuery =
            "INSERT INTO doctor_master (user_id, doctor_name, email, mobile, doctor_category_id) VALUES (?, ?, ?, ?, ?)";
          connection.query(
            insertDoctorQuery,
            [user_id, doctor_name, email, mobile, doctor_category_id],
            (err, result) => {
              if (err) {
                return response
                  .status(200)
                  .json({
                    success: false,
                    message: languageMessages.internalServerError,
                    error: err.message,
                  });
              }

              const doctor_id = result.insertId; 

              
              const patientInsertQuery = `
                        INSERT INTO patient_master (doctor_id, user_id, createtime, updatetime, mysqltime)
                        VALUES (?, ?, NOW(), NOW(), NOW())`;
              connection.query(
                patientInsertQuery,
                [doctor_id, user_id],
                (err) => {
                  if (err) {
                    return response
                      .status(200)
                      .json({
                        success: false,
                        message: languageMessages.internalServerError,
                        error: err.message,
                      });
                  }

                  return response
                    .status(200)
                    .json({
                      success: true,
                      message: languageMessages.doctorAdded,
                    });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    return response
      .status(200)
      .json({ success: false, message: languageMessages.internalServerError });
  }
};






const get_doctor_list = async (request, response) => {

    const { user_id } = request.query;

    try {

        // validation 

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        // check if user exist or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // get list 

            const getDeatils = "SELECT d.doctor_id,d.doctor_name,d.email,d.mobile,dc.category_name FROM doctor_master as d JOIN doctor_category as dc WHERE d.user_id = ? AND d.delete_flag = 0;";

            connection.query(getDeatils, [user_id], (err, doctorList) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.doctorList, data: doctorList });

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError });

    }

}



const edit_doctor = async (request, response) => {

    const { doctor_id, user_id, doctor_name, mobile, email, doctor_category_id } = request.body;



    try {

        // Validation

        if (!doctor_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_id" })

        }

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" })

        }

        if (!doctor_name) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_name" })

        }

        if (!mobile) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "mobile" })

        }

        if (!email) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "key" })

        }

        if (!doctor_category_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_category_id	" })

        }

        // check if user exist or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Check if doctor exists

            const doctorCheckQuery = "SELECT doctor_id FROM doctor_master WHERE doctor_id = ? AND user_id=? AND delete_flag = 0";

            connection.query(doctorCheckQuery, [doctor_id, user_id], (err, existingDoctor) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (existingDoctor.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.doctor_not_found });

                }

                // Update doctor details

                const updateDoctorQuery = "UPDATE doctor_master SET doctor_name = ?, mobile = ?, email = ?, doctor_category_id	 = ? , updatetime=? WHERE doctor_id = ? AND user_id = ? AND delete_flag = 0 ";

                connection.query(updateDoctorQuery, [doctor_name, mobile, email, doctor_category_id, updatetime, doctor_id, user_id], (err, updatedDoctor) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }

                    return response.status(200).json({ success: true, message: languageMessages.doctorUpdatedSuccessfully });

                })



            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError });

    }

};



// Delete Doctor 

const delete_doctor = async (request, response) => {

    const { doctor_id, user_id } = request.body;



    try {

        // Validation

        if (!doctor_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "doctor_id" });

        }

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        // check if user exist or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Check if doctor exists

            const doctorCheckQuery = "SELECT doctor_id FROM doctor_master WHERE doctor_id = ? AND user_id= ? AND delete_flag = 0";

            connection.query(doctorCheckQuery, [doctor_id, user_id], (err, existingDoctor) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                };

                if (existingDoctor.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.doctor_not_found })

                };



                const deleteQuery = "UPDATE doctor_master SET delete_flag = 1 WHERE doctor_id = ?";

                connection.query(deleteQuery, [doctor_id], (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                    };

                    return response.status(200).json({ success: true, message: languageMessages.doctorDeleted });

                });

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError });

    }

};



const add_adverse_reaction = async (request, response) => {

    const { user_id, medicine_id, dosage, medicine_type, medication_start_date, symptom_id, reaction_date, instruction } = request.body

    try {

        // validate

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!medicine_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "medicine_id" });

        }

        if (!dosage) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "dosage" });

        }

        if (!medication_start_date) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "medication_start_date" });

        }

        if (!symptom_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "symptom_id" });

        }

        if (!reaction_date) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "reaction_date" });

        }

        // check if user exist or not 

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // insert into adverse_reaction_master

            const sql = "INSERT INTO adverse_reaction_master (user_id,medicine_id,dosage,type,medication_start_date,symptom_id,reaction_date,instruction,createtime) VALUES (?,?,?,?,?,?,?,?,?)";

            const values = [user_id, medicine_id, dosage, medicine_type, medication_start_date, symptom_id, reaction_date, instruction, createtime];

            connection.query(sql, values, (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgAdversereactionAdded });

            })

        })



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const get_AdverseReaction = async (request, response) => {

    const { user_id } = request.query;

    try {

        // validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        // check if user exist or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // get adverse reaction list

            const query = `SELECT a.user_id, s.symptom_name, s.description, m.medicine_name, a.dosage, a.medication_start_date, a.reaction_date, DATE_ADD(a.medication_start_date, INTERVAL a.dosage DAY) AS medication_end_date FROM adverse_reaction_master AS a JOIN symptoms_master AS s ON a.symptom_id = s.symptom_id JOIN medicine_master AS m ON a.medicine_id = m.medicine_id WHERE a.user_id = ?;`

            connection.query(query, [user_id], (err, adverseReactionList) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgAdversereactionList, ReactionList: adverseReactionList });

            })

        })

    } catch (error) {



    }

}



const edit_adverse_reaction = async (request, response) => {

    const { reaction_id, user_id, medicine_id, dosage, medicine_type, medication_start_date, symptom_id, reaction_date, instruction } = request.body;



    try {

        // Validation

        if (!reaction_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "reaction_id" });

        }

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!medicine_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "medicine_id" });

        }

        if (!dosage) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "dosage" });

        }

        if (!medication_start_date) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "medication_start_date" });

        }

        if (!symptom_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "symptom_id" });

        }

        if (!reaction_date) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "reaction_date" });

        }



        // Check if user exists

        const sqlUser = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sqlUser, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Check if reaction exists

            const sqlCheckReaction = "SELECT * FROM adverse_reaction_master WHERE adverse_reaction_id = ? AND user_id = ?";

            connection.query(sqlCheckReaction, [reaction_id, user_id], (err, reactionInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (reactionInfo.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgReactionNotFound });

                }



                // Update reaction record

                const sqlUpdate = `

                    UPDATE adverse_reaction_master 

                    SET medicine_id = ?, dosage = ?, type = ?, medication_start_date = ?, symptom_id = ?, reaction_date = ?, instruction = ?, updatetime = ?

                    WHERE adverse_reaction_id = ? AND user_id = ?`;



                const values = [medicine_id, dosage, medicine_type, medication_start_date, symptom_id, reaction_date, instruction, updatetime, reaction_id, user_id];



                connection.query(sqlUpdate, values, (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }

                    return response.status(200).json({ success: true, message: languageMessages.msgAdversereactionUpdated });

                });

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

};



const delete_adverse_reaction = async (request, response) => {

    const { user_id, reaction_id } = request.body;

    try {

        // validate

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" })

        }

        if (!reaction_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "reaction_id" })

        }

        // check if user exists or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // check if reaction exists or not

            const sqlReaction = "SELECT adverse_reaction_id FROM adverse_reaction_master WHERE adverse_reaction_id = ? AND user_id = ? AND delete_flag = 0";

            connection.query(sqlReaction, [reaction_id, user_id], (err, reactionInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (reactionInfo.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound })

                }

                // delete reaction

                const sqlDelete = "UPDATE adverse_reaction_master SET delete_flag = 1, updatetime = ? WHERE adverse_reaction_id = ? AND user_id = ?";

                const values = [updatetime, reaction_id, user_id]

                connection.query(sqlDelete, values, (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }

                    return response.status(200).json({ success: true, message: languageMessages.msgAdversereactionDeleted });

                })

            })

        })



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const add_measurement = async (request, response) => {

    const { user_id, type, systolic_bp, diastolic_bp, pulse, weight, date, time } = request.body;

    try {

        // validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!type) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "type" });

        }

        // check if user exist or not 

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // insert into measurement master

            const query = `INSERT INTO measurement_master (user_id, type, systolic_bp, diastolic_bp, pulse, weight, date, time,createtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`;

            const values = [user_id, type, systolic_bp, diastolic_bp, pulse, weight, date, time, createtime]

            connection.query(query, values, (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgMeasurementAdded });

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const add_custom_measurement = async (request, response) => {

    const { user_id, symptom_id, fever_rating } = request.body

    try {

        // validation

        if (!symptom_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "symptom_id" })

        }

        if (!fever_rating) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "fever_rating" })

        }

        // check if user is exists or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // insert into measurement_master table

            const query = `INSERT INTO custom_measurement_master (user_id, symptom_id, rate,createtime) VALUES (?,?,?,?)`

            connection.query(query, [user_id, symptom_id, fever_rating, createtime], (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgMeasurementAdded });

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const get_custom_measurement = async (request, response) => {

    const { user_id } = request.query;

    try {

        // validate 

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" })

        }

        // check if user is exists or not

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // get data

            const sql = `SELECT c.custom_measurement_id,s.symptom_name, c.rate,c.createtime FROM custom_measurement_master as c JOIN symptoms_master as s on c.symptom_id=s.symptom_id WHERE c.user_id=? AND c.delete_flag=0;`

            connection.query(sql, [user_id], (err, measurementData) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, data: measurementData });

            })

        })



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const getMeasurement = async (request, response) => {

    const { user_id, type } = request.query;



    try {

        // Validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!type) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "type" });

        }

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            let selectQuery = "";

            let values = [user_id, type];



            if (type == 0) {

                selectQuery = `SELECT measurement_id, user_id, type, systolic_bp, diastolic_bp, pulse, date, time, createtime FROM measurement_master WHERE user_id = ? AND type = ? AND delete_flag = 0 ORDER BY date DESC, time DESC`;



            } else if (type == 1) {

                selectQuery = `SELECT measurement_id, user_id, type, systolic_bp as fbg, diastolic_bp as ppbg, pulse, date, time, createtime FROM measurement_master WHERE user_id = ? AND type = ? AND delete_flag = 0 ORDER BY date DESC, time DESC;`;



            } else if (type == 2) {

                selectQuery = `SELECT measurement_id, user_id, type, weight, date, time, createtime FROM measurement_master WHERE user_id = ? AND type = ? AND delete_flag = 0 ORDER BY date DESC, time DESC`;



            } else {

                return response.status(200).json({ success: false, message: "Invalid measurement type" });

            }



            // Execute query

            connection.query(selectQuery, values, (err, results) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, data: results });

            })

        });



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

};





const add_report = async (request, response) => {

    const { user_id, report_category_id } = request.body;

    const file = request.file;

    try {

        // Validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!report_category_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "report_category_id" });

        }

        if (!file) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "file" });

        }



        // Check if user exists

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            const filepath = file.filename;

            const filesize = file.size;



            const query = `INSERT INTO medical_report_master (user_id, report_category_id, file,file_size,createtime) VALUES (?, ?, ?,? ,?)`;

            connection.query(query, [user_id, report_category_id, filepath, filesize, createtime], (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgReportAdded });

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

};



const delete_report = async (request, response) => {

    const { user_id, report_id } = request.body;



    try {

        // Validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!report_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "report_id" });

        }



        // Check if user exists

        const sql = "SELECT user_id FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Delete report

            const deleteQuery = "update medical_report_master set delete_flag= 1  WHERE medical_report_id = ? AND user_id = ?";

            connection.query(deleteQuery, [report_id, user_id], (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (result.affectedRows === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgReportNotFound });

                }

                return response.status(200).json({ success: true, message: languageMessages.msgReportDeleted });

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

};



const get_all_report = async (request, response) => {

    const { user_id } = request.query;

    try {

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });

        }



        const userCheckQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userCheckQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            const reportQuery = `SELECT medical_report_id, report_category_id, file, file_size FROM medical_report_master WHERE user_id = ? AND delete_flag=0;`;

            connection.query(reportQuery, [user_id], (err, reports) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (reports.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound });

                }



                const categoryCounts = reports.reduce((acc, report) => {

                    acc[report.report_category_id] = (acc[report.report_category_id] || 0) + 1;

                    return acc;

                }, {});



                return response.status(200).json({ success: true, data: { reports, counts_based_on_category: categoryCounts } });

            });

        });



    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

};



const get_report_by_category = async (request, response) => {

    const { user_id, report_category_id } = request.query;

    try {

        // validation

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });

        }

        // check id user is exist or not 

        const sql = "SELECT user_id FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // get report by category

            const reportQuery = `SELECT medical_report_id, report_category_id, file, file_size FROM medical_report_master WHERE user_id = ? AND report_category_id = ? AND delete_flag=0; `;

            connection.query(reportQuery, [user_id, report_category_id], (err, reports) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (reports.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound });

                }

                return response.status(200).json({ success: true, data: reports });

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

}



const get_content = async (request, response) => {

    const { user_id } = request.query;

    try {

        // validation

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });

        }

        // check if user exist or not

        const queryUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';

        connection.query(queryUser, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length == 0) {

                return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag == 0) {

                return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_flag: 0 });

            }

            // get content

            const query = "SELECT content_id, content_type, content,content_1,content_2,content_3 FROM content_master WHERE delete_flag = 0";

            connection.query(query, (err, info) => {

                if (err) {

                    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message });

                }

                let webservice_url = process.env.WEBSERVICE_URL;

                content_arr = info.map(data => ({

                    content_id: data.content_id,

                    content_type: data.content_type,

                    content_url: `${webservice_url}get_all_content_url?content_type=${data.content_type}&content_id=${data.content_id}`,

                    content: data.content_1

                }))

                // console.log(content_arr,"<=====content")

                return response.status(200).json({ success: true, message: languageMessages.msgDataFound, content_arr });



            })



        })



    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

}



const getContentById = async (request, response) => {



    const { content_id, content_type } = request.query;







    try {



        if (!content_id) {



            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'content_id' })



        }



        if (!content_type) {



            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'content_type' })



        }









        let checkContent = "SELECT content_id, content_type, content, createtime FROM content_master WHERE delete_flag = 0 AND content_type = ?";







        connection.query(checkContent, [content_type], async (err, res) => {







            if (err) {



                return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: err.message })



            }



            if (res.length === 0) {



                return response.status(200).json({ success: false, msg: languageMessages.msgDataNotFound })



            }



            if (res.length > 0) {













                let content_en = res[0].content;



                let new12 = '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' + content_en + '</body></html>';







                return response.status(200).send(new12)



            }



            // if (language_id == 1) {



            //     let content_french = res[0].content_3;



            //     let new12 = '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' + content_french + '</body></html>';







            //     return response.status(200).send(new12)



            // }



            else {



                return response.status(200).json({ success: false, msg: languageMessages.msgDataNotFound })



            }



        })







    }



    catch (error) {



        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message, key: '2' })



    }



}



const get_medicine_detail = async (request, response) => {

    const { user_id, medicine_id } = request.query

    try {

        //validation

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" })

        }

        if (!medicine_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "medicine_id" })

        }

        // check if user is exist or not 

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // check if medicine is exist or not

            const sql = "SELECT medicine_id FROM medicine_master WHERE medicine_id = ? AND delete_flag = 0";

            connection.query(sql, [medicine_id], (err, medicineInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (medicineInfo.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound })

                }

                // get medicine detail

                const sql = `SELECT medicine_id,medicine_name,description FROM medicine_master WHERE medicine_id=? AND delete_flag=0`

                connection.query(sql, [medicine_id], (err, medicineDetail) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }

                    if (medicineDetail.length === 0) {

                        return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound })

                    }

                    return response.status(200).json({ success: true, message: languageMessages.msgDataFound, data: medicineDetail[0] })

                })

            })

        })





    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message })

    }

}



const help_and_support = async (request, response) => {

    const { user_id, name, email, message } = request.body;

    try {

        // validate

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" })

        }

        if (!name) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "name" })

        }

        if (!email) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "email" })

        }

        // check if user exist or not 

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            // insert help and support data

            const sql = "INSERT INTO contact_us_master (user_id,name,email,message,createtime) VALUES (?,?,?,?,?)";

            connection.query(sql, [user_id, name, email, message, createtime], (err, helpAndSupportData) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                return response.status(200).json({ success: true, message: languageMessages.contactUsMsg })

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message })

    }

}





const update_profile = async (request, response) => {

    const { user_id, f_name, l_name, mobile, email, gender, dob, disease_id } = request.body;



    const file = request.file;

    const imagepath = file.filename;





    try {

        //validation 

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" })

        }

        if (!f_name) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "f_name" })

        }

        if (!l_name) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "l_name" })

        }

        if (!mobile) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "mobile" })

        }

        if (!email) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "email" })

        }

        if (!gender) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "gender" })

        }

        if (!dob) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "dob" })

        }

        if (!disease_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "disease_id" })

        }

        //check if user exist or not 

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }

            //update user profile

            const sql = "UPDATE user_master SET f_name = ?, l_name = ?, name = ?, mobile = ?, email = ?, gender = ?, dob = ?, disease_id = ?, image= ?,updatetime= ? WHERE user_id = ?";

            connection.query(sql, [f_name, l_name, (f_name + ' ' + l_name), mobile, email, gender, dob, disease_id, imagepath, updatetime, user_id], (err, result) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (result.affectedRows === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgFailedToUpdaterecord });

                }

                return response.status(200).json({ success: true, message: languageMessages.profileUpdateSuccessfully });



            })

        })



    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message })

    }

}



const view_Profile = async (request, response) => {

    const { user_id } = request.query;



    try {

        // Validation 

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });

        }



        // Check if user exists

        const sql = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(sql, [user_id], async (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Fetch user profile details

            const profileQuery = "SELECT f_name, l_name, mobile, email, gender, dob, disease_id FROM user_master WHERE user_id = ? AND delete_flag = 0";

            connection.query(profileQuery, [user_id], (err, userData) => {

                if (err) {

                    return response.status(500).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                // Respond with user data

                return response.status(200).json({ success: true, user_profile: userData[0] });

            });

        });



    } catch (error) {

        return response.status(500).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

};



const add_medication = async (request, response) => {

    const { user_id, medicine_id, medicine_name, description, dosage, type, schedule, current_quantity, remind_time, remind_quantity, instruction } = request.body;

    try {

        // Validation

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" })

        };

        if (!medicine_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "medicine_id" })

        };

        if (!dosage) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "dosage" })

        };

        if (!type) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "type" })

        };

        if (!schedule) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "schedule" })

        };

        if (!remind_time) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "remind_time" })

        };

        if (!instruction) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "instruction" })

        };



        // Format remind_time for MySQL

        // const formattedRemindTime = new Date(remind_time).toISOString().slice(0, 19).replace



        const userCheckQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userCheckQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

            };

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound })

            };

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated })

            };



            const medicineCheckQuery = "SELECT medicine_id FROM medicine_master WHERE medicine_name = ? AND description = ? AND delete_flag = 0";

            connection.query(medicineCheckQuery, [medicine_name, description], (err, medicineInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                };



                const insertMedication = (medId) => {

                    const medicationQuery = "INSERT INTO medication_master (user_id, medicine_id, dosage, type, schedule, current_quantity, reminder_time, remind_quantity, instruction, createtime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    connection.query(medicationQuery, [user_id, medId, dosage, type, schedule, current_quantity, remind_time, remind_quantity, instruction, createtime], (err) => {

                        if (err) return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                        return response.status(200).json({ success: true, message: languageMessages.msgMedicationAdded });

                    });

                };



                if (medicineInfo.length === 0) {

                    const insertMedicineQuery = "INSERT INTO medicine_master (medicine_name, description, delete_flag, createtime) VALUES (?, ?, 0, ?)";

                    connection.query(insertMedicineQuery, [medicine_name, description, createtime], (err, result) => {

                        if (err) return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                        insertMedication(result.insertId);

                    });

                } else {

                    insertMedication(medicineInfo[0].medicine_id);

                }

            });

        });

    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

};





const edit_medication = async (request, response) => {

    const { medication_id, user_id, medicine_name, description, dosage, type, schedule, current_quantity, remind_time, remind_quantity, instruction } = request.body;



    try {

        // Validation

        if (!medication_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "medication_id" })

        };

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" })

        };

        if (!dosage) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "dosage" })

        };

        if (!type) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "type" })

        };

        if (!schedule) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "schedule" })

        };

        if (!remind_time) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "remind_time" })

        };

        if (!instruction) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "instruction" })

        };



        const userCheckQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userCheckQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

            };

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound })

            };

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 })

            };



            // Check if the medicine already exists based on name and description

            const medicineCheckQuery = "SELECT medicine_id FROM medicine_master WHERE medicine_name = ? AND description = ? AND delete_flag = 0";

            connection.query(medicineCheckQuery, [medicine_name, description], (err, medicineInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                };



                if (medicineInfo.length === 0) {

                    // Insert the new medicine if not found

                    const insertMedicineQuery = "INSERT INTO medicine_master (medicine_name, description, delete_flag, createtime) VALUES (?, ?, 0, NOW())";

                    connection.query(insertMedicineQuery, [medicine_name, description], (err, result) => {

                        if (err) {

                            return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                        };



                        const newMedicineId = result.insertId;

                        updateMedication(newMedicineId);

                    });

                } else {

                    // Use the existing medicine_id

                    updateMedication(medicineInfo[0].medicine_id);

                }



                function updateMedication(medId) {

                    const updateQuery = `

                        UPDATE medication_master 

                        SET medicine_id = ?, dosage = ?, type = ?, schedule = ?, current_quantity = ?, reminder_time = ?, remind_quantity = ?, instruction = ?, updatetime = NOW() 

                        WHERE medication_id = ? AND user_id = ?`;



                    connection.query(updateQuery, [medId, dosage, type, schedule, current_quantity, remind_time, remind_quantity, instruction, medication_id, user_id], (err, result) => {

                        if (err) {

                            return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                        };

                        return response.status(200).json({ success: true, message: languageMessages.msgMedicationUpdated });

                    });

                }

            });

        });

    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

};



const delete_medication = async (request, response) => {

    const { user_id, medication_id } = request.body;

    try {

        // validation

        if (!user_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!medication_id) {

            return response.status(200).json({ success: false, message: languageMessages.msg_empty_param, key: "medication_id" });

        }

        // check if user is exist or not 

        const userQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

            };

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound })

            };

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 })

            };

            // check if medication is exist or not

            const medQuery = "SELECT medication_id FROM medication_master WHERE medication_id = ? AND user_id = ? AND delete_flag = 0";

            connection.query(medQuery, [medication_id, user_id], (err, medInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                }

                if (medInfo.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgDataNotFound })

                }

                // delete medication

                const deleteQuery = "UPDATE medication_master SET delete_flag = 1, updatetime = ? WHERE medication_id = ? AND user_id = ?";

                connection.query(deleteQuery, [updatetime, medication_id, user_id], (err, result) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message })

                    }

                    return response.status(200).json({ success: true, message: languageMessages.msgMedicationDeleted });

                })

            })

        })

    } catch (error) {

        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: error.message });

    }

}



const medicine_taken = async (request, response) => {

    const { user_id, medication_id, status } = request.body; // status: 0 = taken, 1 = not taken



    try {

        // Validation

        if (!user_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "user_id" });

        }

        if (!medication_id) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "medication_id" });

        }

        if (status === undefined) {

            return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: "status" });

        }



        // Check if user exists

        const userCheckQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userCheckQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

            }

            if (userInfo.length === 0) {

                return response.status(200).json({ success: false, message: languageMessages.msgUserNotFound });

            }

            if (userInfo[0].active_flag === 0) {

                return response.status(200).json({ success: false, message: languageMessages.accountdeactivated, account_active_status: 0 });

            }



            // Check if medication exists and get dosage

            const medicationCheckQuery = "SELECT medication_id, dosage FROM medication_master WHERE medication_id = ? AND delete_flag = 0";

            connection.query(medicationCheckQuery, [medication_id], (err, medInfo) => {

                if (err) {

                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                }

                if (medInfo.length === 0) {

                    return response.status(200).json({ success: false, message: languageMessages.msgMedicationNotFound });

                }



                const dosage = medInfo[0].dosage; // Get the dosage from the result



                // Check if an entry already exists for this medication on the same day

                const checkUserMedicationQuery = `

                    SELECT user_medication_id FROM user_medication 

                    WHERE user_id = ? AND medication_id = ? AND DATE(createtime) = CURDATE()`;

                connection.query(checkUserMedicationQuery, [user_id, medication_id], (err, existingEntry) => {

                    if (err) {

                        return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                    }



                    if (existingEntry.length > 0) {

                        // Update the existing entry

                        const updateUserMedicationQuery = `

                            UPDATE user_medication 

                            SET status = ?, updatetime = ? 

                            WHERE user_medication_id = ?`;

                        connection.query(updateUserMedicationQuery, [status, updatetime, existingEntry[0].id], (err, result) => {

                            if (err) {

                                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                            }

                            // Update the quantity in medication_master based on dosage

                            const updateQuantityQuery = `

                                UPDATE medication_master 

                                SET current_quantity = current_quantity - ? 

                                WHERE medication_id = ? AND delete_flag = 0`;

                            connection.query(updateQuantityQuery, [dosage, medication_id], (err, result) => {

                                if (err) {

                                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                                }

                                return response.status(200).json({ success: true, message: languageMessages.msgMedicationUpdated });

                            });

                        });

                    } else {

                        // Insert new entry

                        const insertUserMedicationQuery = `

                            INSERT INTO user_medication (user_id, medication_id, status, delete_flag, createtime, updatetime) 

                            VALUES (?, ?, ?, 0, ?, ?)`;

                        connection.query(insertUserMedicationQuery, [user_id, medication_id, status, createtime, updatetime], (err, result) => {

                            if (err) {

                                return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                            }

                            // Update the quantity in medication_master

                            const updateQuantityQuery = `

                                UPDATE medication_master 

                                SET current_quantity = current_quantity - ? 

                                WHERE medication_id = ? AND delete_flag = 0`;

                            connection.query(updateQuantityQuery, [dosage, medication_id], (err, result) => {

                                if (err) {

                                    return response.status(200).json({ success: false, message: languageMessages.internalServerError, error: err.message });

                                }

                                return response.status(200).json({ success: true, message: languageMessages.msgMedicationStatusInserted });

                            });

                        });

                    }

                });

            });

        });

    } catch (error) {

        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error: error.message });

    }

};



const get_medication_details = async (request, response) => {

    const { user_id, date } = request.query;



    try {

        // Validate user_id

        if (!user_id) {

            return response.status(400).json({

                success: false,

                message: languageMessages.msg_empty_param,

                key: "user_id"

            });

        }



        // Validate date if provided

        let targetDate;

        if (date) {

            targetDate = new Date(date); // convert the string to a Date object

            if (isNaN(targetDate)) {

                return response.status(400).json({

                    success: false,

                    message: "Invalid date format. Please provide a valid date."

                });

            }

        }



        // Check if user exists

        const userCheckQuery = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

        connection.query(userCheckQuery, [user_id], (err, userInfo) => {

            if (err) {

                return response.status(500).json({

                    success: false,

                    message: languageMessages.internalServerError,

                    error: err.message

                });

            }



            if (userInfo.length === 0) {

                return response.status(404).json({

                    success: false,

                    message: languageMessages.msgUserNotFound

                });

            }



            if (userInfo[0].active_flag === 0) {

                return response.status(403).json({

                    success: false,

                    message: languageMessages.accountdeactivated,

                    account_active_status: 0

                });

            }



            // Get user medication details and check status from user_medication

            const medicationQuery = `

                SELECT m.*,md.medicine_name, um.status as user_status FROM medication_master m LEFT JOIN user_medication um ON m.medication_id = um.medication_id AND um.user_id = ? JOIN medicine_master as md on m.medicine_id=md.medicine_id WHERE m.user_id = ? AND m.delete_flag = 0;



            `;



            connection.query(medicationQuery, [user_id, user_id], (medErr, medicationInfo) => {

                if (medErr) {

                    return response.status(500).json({

                        success: false,

                        message: languageMessages.internalServerError,

                        error: medErr.message

                    });

                }



                if (medicationInfo.length === 0) {

                    return response.status(404).json({

                        success: false,

                        message: languageMessages.msgMedicationNotFound

                    });

                }



                // Process medication details and filter by date if provided

                const currentDateTime = new Date();

                const medicationsStatus = medicationInfo.map(medication => {

                    const medicationTime = new Date(medication.createtime); // assuming createtime is stored as timestamp

                    const takenStatus = (medication.user_status === 0) ? 'Taken' : 'Not Taken';



                    // If a date is provided, check if the medication date matches

                    if (targetDate && medicationTime.toDateString() !== targetDate.toDateString()) {

                        return null; // Skip this medication if it's not for the specified date

                    }



                    // Check if current date/time falls within the reminder time logic

                    let reminderStatus = 'No reminder needed';

                    if (medication.reminder_time <= currentDateTime && medication.remaining_quantity > 0) {

                        reminderStatus = 'Reminder: Medicine needs to be taken or refilled';

                    }



                    // Return all medication details along with the status and reminder info

                    return {

                        medication_id: medication.medication_id,

                        medicine_id: medication.medicine_id,

                        medicine_name: medication.medicine_name,

                        dosage: medication.dosage,

                        type: medication.type, // 1=pill, 2=syrup

                        schedule: medication.schedule, // 0=daily, 1=weekly, 2=monthly

                        weekday: medication.weekday,

                        current_quantity: medication.current_quantity,

                        reminder_time: medication.reminder_time,

                        remind_quantity: medication.remind_quantity,

                        remaining_quantity: medication.remaining_quantity,

                        instruction: medication.instruction,

                        status: takenStatus,

                        reminderStatus: reminderStatus,

                        delete_flag: medication.delete_flag,

                        createtime: medication.createtime,

                        updatetime: medication.updatetime

                    };

                }).filter(medication => medication !== null); // Remove null entries



                return response.status(200).json({

                    success: true,

                    medications: medicationsStatus

                });

            });

        });

    } catch (error) {

        return response.status(500).json({

            success: false,

            message: languageMessages.internalServerError,

            error: error.message

        });

    }

};







module.exports = {

    signUp,

    otpVerify,

    resendOtp,

    login,

    forgetPassword,

    forgetPasswordResendOtp,

    forgetPasswordOtpVerify,

    changePassword,

    deleteAccount,

    add_doctor,

    get_doctor_list,

    edit_doctor,

    delete_doctor,

    add_adverse_reaction,

    get_AdverseReaction,

    edit_adverse_reaction,

    delete_adverse_reaction,

    add_measurement,

    add_custom_measurement,

    add_report,

    delete_report,

    get_all_report,

    get_report_by_category,

    get_content,

    getContentById,

    get_custom_measurement,

    getMeasurement,// wekly monthly 

    get_medicine_detail,

    help_and_support,

    view_Profile,

    update_profile,

    add_medication,

    edit_medication,

    delete_medication,

    medicine_taken,

    get_medication_details,

    // recent_medication



}

