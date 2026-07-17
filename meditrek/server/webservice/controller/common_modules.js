require("dotenv").config();



const mysql = require("mysql");



const moment = require('moment-timezone');

// Get current time in the desired timezone (e.g., Paris)
const parisTime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris');

// Format it as 'YYYY-MM-DD HH:mm:ss'
const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');



const crypto = require("crypto");

const connection = require('../connection');

// const commonFunction = require("../common/commonFunction");



// const { resolve } = require("path");



// console.log(process.env.PORT);







module.exports = {

    async authenticateToken(req, res, next) {
        const authHeader = req.headers.authorization;
        const SECRET_KEY = "TOKEN-KEY";
        const userId = req.body.user_id || req.query.user_id || 0; // Get user_id from request
        if (userId == 0) {
            return next(); // Skip authentication if user_id is 0
        }
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // return res.status(401).json({ success: false, msg: "Unauthorized" });
            return res.status(401).json({ success: false, msg: languageMessage.checkUnathorizedToken, active_status: 0 });
        }
        const token = authHeader.split(" ")[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                // return res.status(200).json({ success: false, msg: "Invalid token" });
                return res.status(200).json({ success: false, msg: languageMessage.checkToken, active_status: 0 });
            }
            console.log("Decoded Token:", decoded);  //Debugging: Check what’s inside the token
            const userId = decoded.user_id_get; //Extract user_id
            const deviceId = decoded.device_id; //Extract device_id
            if (!userId || !deviceId) {
                // return res.status(200).json({ success: false, msg: "Invalid token data" });
                return res.status(200).json({ success: false, msg: languageMessage.checkInvalidToken, active_status: 0 });
            }
            // Check session in DB
            const checkSessionQuery = `
                SELECT token FROM user_sessions 
                WHERE user_id = ? AND device_id = ? 
                ORDER BY session_id DESC LIMIT 1
            `;
            connection.query(checkSessionQuery, [userId, deviceId], (err, result) => {
                if (err) {
                    // return res.status(200).json({ success: false, msg: "Database error",active_status:0 });
                    return res.status(200).json({ success: false, msg: languageMessage.checkToken, active_status: 0 });
                }
                if (result.length === 0 || result[0].token !== token) {
                    return res.status(200).json({ success: false, msg: languageMessage.checkToken, active_status: 0 });
                }
                req.user = decoded;
                next();
            });
        });
    },

    async userCheck(user_id) {

        return new Promise((resolve, reject) => {

            sqlCheck =

                "SELECT event_id,user_id, active_flag,mobile,phone_code,category_id FROM user_master WHERE user_id =? AND delete_flag = 0";



            connection.query(sqlCheck, [user_id], (err, result) => {

                // console.log(err);



                if (err) {

                    console.log("database user check error ");



                    reject(err); // Reject the promise with the error

                } else {

                    if (result.length > 0) {

                        // console.log("user check in commn model: ", result[0]);



                        resolve(result[0]);

                    } else {

                        console.log(

                            "user not found in commn model",



                            result.length + "--->" + result[0]

                        );



                        resolve("NA");

                    }

                }

            });

        });

    },



    async getAllContent(language_code = "en") {

        return new Promise((resolve, reject) => {

const sql = `
    SELECT
        cm.content_id,
        cm.content_type,
        COALESCE(ct.content, ct_en.content) AS content,
        cm.content_1,
        cm.content_2,
        cm.content_3
    FROM content_master cm
    LEFT JOIN content_translation ct
        ON cm.content_id = ct.content_id
        AND ct.language_code = ?
    LEFT JOIN content_translation ct_en
        ON cm.content_id = ct_en.content_id
        AND ct_en.language_code = 'en'
    WHERE cm.delete_flag = 0
`;

connection.query(sql, [language_code],



                (error, rows) => {

                    if (error) {

                        console.log("database content_type get all error ");



                        reject(error); // Reject the promise with the error

                    } else {

                        let content_arr = [];

                        var webservice_url = process.env.WEBSERVICE_URL;

                        if (rows.length > 0) {

                            for (var data of rows) {

                                content_arr.push({

                                    content_id: data.content_id,

                                    content_type: data.content_type,

                                    content: data.content,

                                    content_1: data.content_1,

                                    content_2: data.content_2,

                                    content_3: data.content_3,

                                    content_url: `${webservice_url}get_all_content_url?content_type=${data.content_type}`,

                                    status: false,

                                });

                            }

                        } else {

                            content_arr = "NA";

                        }



                        resolve(content_arr);



                        // resolve the promise with the rows

                    }

                }

            );

        });

    },



    // async getAllContentUrlData(content_type) {

    //     return new Promise((resolve, reject) => {

    //         const sqlSelect =

    //             "SELECT content_id, content_type, content FROM content_master WHERE delete_flag = 0 AND content_type = ?";



    //         connection.query(sqlSelect, [content_type], (error, result) => {

    //             if (error) {

    //                 return reject(error);

    //             }



    //             let content_en = "NA";

    //             if (result.length > 0) {

    //                 content_en = result[0].content;

    //             }



    //             // const htmlContent = `

    //             //   <html>

    //             //     <head>

    //             //       <meta charset="utf-8">

    //             //       <meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:">

    //             //       <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui">

    //             //       <title>Data</title>

    //             //     </head>

    //             //     <body style="word-break: break-all;">

    //             //       ${content_en}

    //             //     </body>

    //             //   </html>

    //             // `;



    //             resolve(content_en);

    //         });

    //     });

    // },

    async getAllContentUrlData(content_type, language_code = "en") {

        return new Promise((resolve, reject) => {

            const sql = `
                SELECT 
                    COALESCE(ct.content, ct_en.content) AS content
                FROM content_master cm
                LEFT JOIN content_translation ct 
                    ON cm.content_id = ct.content_id 
                    AND ct.language_code = ?
                LEFT JOIN content_translation ct_en 
                    ON cm.content_id = ct_en.content_id 
                    AND ct_en.language_code = 'en'
                WHERE cm.delete_flag = 0 
                AND cm.content_type = ?
                LIMIT 1
            `;

            connection.query(sql, [language_code, content_type], (error, result) => {

                if (error) return reject(error);

                let content_data = "";

                if (result.length > 0 && result[0].content) {
                    content_data = result[0].content;
                }

                resolve(content_data);

            });

        });

    },

    async getCategory() {

        return new Promise((resolve, reject) => {

            connection.query(

                "select category_id ,category_name, image from category_master where delete_flag = 0 order by category_id desc",



                (err, result) => {

                    if (err) {

                        reject(err);

                    }



                    if (result.length > 0) {

                        const categoryData = result.map((category) => ({

                            category_id: category.category_id,



                            category_name: category.category_name,



                            image: category.image,



                            status: false,

                        }));



                        resolve(categoryData);

                    }



                    resolve("NA");

                }

            );

        });

    },



    async getDay(day_id) {

        return new Promise((resolve, reject) => {

            // console.log(day_id);



            const dayArr = day_id.split(",").map(Number);



            connection.query(

                `select name from day_master where delete_flag = 0 AND day_id IN(?)`,

                [dayArr],



                (err, result) => {

                    console.log(err);



                    if (err) {

                        reject(err);

                    }



                    if (result.length > 0) {

                        resolve(result);

                    }



                    resolve("NA");

                }

            );

        });

    },



    async getEventQuestions() {

        return new Promise((resolve, reject) => {

            connection.query(

                "select event_id,user_id , event_name, event_created_by ,start_date,end_date from event_master where delete_flag = 0 AND event_created_by =?",

                [0],



                (err, result) => {

                    if (err) {

                        reject(err);

                    }



                    if (result.length > 0) {

                        const event_arr = result.map((event) => ({

                            event_id: event.event_id,



                            event: event.event_name,



                            user_id: event.user_id,



                            event_created_by: event.event_created_by,



                            status: false,

                        }));



                        resolve(event_arr);

                    }



                    resolve("NA");

                }

            );

        });

    },



    // async getUserEventQuestions(user_id, event_ids_str) {



    //   return new Promise((resolve, reject) => {

    //     connection.query(

    //       "select event_id,user_id , event_name, event_created_by from event_master where delete_flag = 0 AND event_id = ?",

    //       [event_ids_str],



    //       (err, result) => {

    //         if (err) {

    //           reject(err);

    //         }

    //         if (result.length > 0) {

    //           const event_arr = result.map((event) => ({

    // event_id: event.event_id,



    // event: event.event_name,



    // user_id: event.user_id,



    // event_created_by: event.event_created_by,



    // status: true

    //           }));



    //           resolve(event_arr);

    //         }



    //         resolve("NA");

    //       }

    //     );

    //   });

    // },



    async getUserEventQuestions(user_id, event_ids_str) {

        return new Promise((resolve, reject) => {

            try {

                if (event_ids_str != 0) {

                    const event_ids = event_ids_str.split(',').map(id => id.trim());

                    // Execute the query

                    connection.query(`select event_id,user_id , event_name, event_created_by from event_master where delete_flag = 0 AND event_id IN (?)`,

                        [event_ids],

                        (err, result) => {

                            if (err) {

                                return reject(err);

                            }



                            if (result.length > 0) {

                                const event_arr = result.map((event) => ({

                                    event_id: event.event_id,



                                    event: event.event_name,



                                    user_id: event.user_id,



                                    event_created_by: event.event_created_by,



                                    status: true,

                                }));



                                return resolve(event_arr);

                            }



                            return resolve("NA");

                        }

                    );

                } else {

                    return resolve("NA");

                }



            } catch (err) {

                reject(err); // Catch any unexpected errors

            }

        });

    },



    async getQuestion() {

        return new Promise((resolve, reject) => {

            connection.query(

                "select question_id ,user_id ,question,question_created_by from question_master where delete_flag = 0 and question_created_by =0",

                [],



                (err, result) => {

                    if (err) {

                        reject(err);

                    }



                    if (result.length > 0) {

                        const question_arr = result.map((question) => ({

                            question_id: question.question_id,



                            question: question.question,



                            user_id: question.user_id,



                            question_created_by: question.question_created_by,



                            status: false,

                        }));



                        resolve(question_arr);

                    }



                    resolve("NA");

                }

            );

        });

    },





    async getQuestionForAntoher(category_id) {

        return new Promise((resolve, reject) => {

            // var sqlSelect = "select question_id ,user_id ,question,question_created_by from question_master where delete_flag = 0 and question_created_by =0";

            var sqlSelect = `SELECT question_id, user_id, category_id, question, question_created_by, delete_flag, createtime, updatetime, mysqltime FROM question_master WHERE delete_flag = 0 AND category_id IN (${category_id}) and question_created_by = 0`;

            connection.query(sqlSelect, [], (err, result) => {

                if (err) {

                    reject(err);

                }



                if (result.length > 0) {

                    const question_arr = result.map((question) => ({

                        question_id: question.question_id,



                        question: question.question,



                        user_id: question.user_id,



                        question_created_by: question.question_created_by,



                        status: false,

                    }));



                    resolve(question_arr);

                }



                resolve("NA");

            }

            );

        });

    },



    async getQuestionForAntoherNew() {

        return new Promise((resolve, reject) => {

            // var sqlSelect = "select question_id ,user_id ,question,question_created_by from question_master where delete_flag = 0 and question_created_by =0";

            var sqlSelect = `SELECT question_id, user_id, category_id, question, question_created_by, delete_flag, createtime, updatetime, mysqltime FROM question_master WHERE delete_flag = 0 AND question_created_by = 0`;

            connection.query(sqlSelect, [], (err, result) => {

                if (err) {

                    reject(err);

                }



                if (result.length > 0) {

                    const question_arr = result.map((question) => ({

                        question_id: question.question_id,



                        question: question.question,



                        user_id: question.user_id,



                        question_created_by: question.question_created_by,



                        status: false,

                    }));



                    resolve(question_arr);

                }



                resolve("NA");

            }

            );

        });

    },



    // async getUserQuestions(user_id, question_ids_str) {



    //   return new Promise((resolve, reject) => {

    //     connection.query(

    //       "select question_id,user_id ,question,question_created_by from question_master where delete_flag = 0 and question_id IN (?)",

    //       [question_ids_str],



    //       (err, result) => {

    //         if (err) {

    //           reject(err);

    //         }

    //         const questionIds = question_ids_str ? question_ids_str.split(",").map(Number) : [];

    //         if (result.length > 0) {

    //           const question_arr = result.map((question) => ({

    //             question_id: question.question_id,



    //             question: question.question,



    //             user_id: question.user_id,



    //             question_created_by: question.question_created_by,



    //             status:  questionIds.includes(question.question_id),



    //           }));



    //           resolve(question_arr);

    //         }



    //         resolve("NA");

    //       }

    //     );

    //   });

    // },



    async getUserQuestions(user_id, question_ids_str) {

        return new Promise((resolve, reject) => {

            try {

                const questionIds = question_ids_str

                    ? question_ids_str.split(",").map(Number)

                    : [];



                if (questionIds.length === 0) {

                    return resolve("NA");

                }



                // Execute the query

                connection.query(

                    `

          SELECT question_id, user_id, question, question_created_by 

          FROM question_master 

          WHERE delete_flag = 0 AND question_id IN (${questionIds})`,

                    (err, result) => {

                        if (err) {

                            return reject(err);

                        }



                        if (result.length > 0) {

                            const question_arr = result.map((question) => ({

                                question_id: question.question_id,

                                question: question.question,

                                user_id: question.user_id,

                                question_created_by: question.question_created_by,

                                status: questionIds.includes(question.question_id),

                            }));



                            return resolve(question_arr);

                        }



                        return resolve("NA");

                    }

                );

            } catch (err) {

                reject(err); // Catch any unexpected errors

            }

        });

    },



    // async getUserDetails(user_id) {

    //     // console.log(user_id)



    //     return new Promise((resolve, reject) => {

    //         connection.query(

    //             "select * from user_master where user_id = ? AND delete_flag = 0",



    //             [user_id],



    //             async (error, rows) => {

    //                 if (error) {

    //                     console.log("database  get all user details error ");



    //                     reject(error); // Reject the promise with the error

    //                 } else {

    //                     if (rows.length > 0) {

    //                         const userData = rows[0];



    //                         let age = 0;



    //                         let dob_new;



    //                         if (userData.dob) {

    //                             dob_new = userData.dob;



    //                             age = moment().diff(dob_new, "years");

    //                         }



    //                         const questions = await this.getUserQuestions(

    //                             user_id,

    //                             userData.question_id

    //                         );



    //                         const events = await this.getUserEventQuestions(

    //                             user_id,

    //                             userData.event_id

    //                         );



    //                         const avtar_image = await this.getAvtarImageUser(

    //                             userData.avatar_id

    //                         );



    //                         const userDataArray = {

    //                             user_id: userData.user_id,



    //                             user_type: userData.user_type,



    //                             user_type_label: "0=admin,1=user",



    //                             login_type: userData.login_type,



    //                             login_type_first: userData.login_type_first,



    //                             login_type_label: "0=app, 1=google, 2=apple, 3=facebook",



    //                             // avatar_id: userData.avatar_id,



    //                             category_id: userData.category_id,



    //                             email: userData.email,



    //                             // password



    //                             username: userData.username,



    //                             f_name: userData.f_name,



    //                             l_name: userData.l_name,



    //                             full_name: userData.name,



    //                             name: userData.name,



    //                             dob: moment(userData.dob).format("YYYY/MM/DD"),



    //                             age: age,



    //                             phone_code: userData.phone_code,



    //                             mobile: userData.mobile,



    //                             country_id: userData.country_id,



    //                             otp_type: userData.otp_type,



    //                             otp: userData.otp,



    //                             otp_verify: userData.otp_verify,



    //                             image: userData.image,



    //                             avatar_id: userData.avatar_id,



    //                             avatar_id_lable: "0 for image , other avatar_id",



    //                             avtar_image: avtar_image,



    //                             gender: userData.gender,



    //                             gender_lebal: "1 for woman, 2 for man,3 other",



    //                             address: userData.address,



    //                             latitude: userData.latitude,



    //                             longitude: userData.longitude,



    //                             zipcode: userData.zipcode,



    //                             bio: userData.bio,



    //                             active_flag: userData.active_flag,



    //                             approve_flag: userData.approve_flag,



    //                             profile_complete: userData.profile_complete,



    //                             language_id: userData.language_id,



    //                             facebook_id: userData.facebook_id,



    //                             google_id: userData.google_id,



    //                             apple_id: userData.apple_id,



    //                             notification_status: userData.notification_status,



    //                             delete_flag: userData.delete_flag,



    //                             delete_reason: userData.delete_reason,



    //                             createtime: moment(userData.createtime).format(

    //                                 "DD-MM-YYYY h:mm A"

    //                             ),



    //                             updatetime: moment(userData.updatetime).format(

    //                                 "DD-MM-YYYY h:mm A"

    //                             ),



    //                             signup_step: userData.signup_step,



    //                             currect_location_permanent: userData.currect_location_permanent,



    //                             about: userData.about,



    //                             day_id: userData.day_id,



    //                             day_name: userData.day_name,



    //                             reminded_throughout: userData.reminded_throughout,



    //                             start_time: userData.start_time,



    //                             end_time: userData.end_time,



    //                             notification_starttime: userData.notification_starttime,



    //                             notification_endtime: userData.notification_endtime,



    //                             notification_per_day_count: userData.notification_per_day_count,



    //                             question_id: userData.question_id,



    //                             questions: questions,



    //                             event_id: userData.event_id,



    //                             events: events,



    //                             start_date: userData.start_date,



    //                             end_date: userData.end_date,



    //                             app_update_status: userData.app_update_status,



    //                             app_update_status_lable: "0 for not update , 1 for update"

    //                         };



    //                         resolve(userDataArray);

    //                     } else {

    //                         resolve("NA");

    //                     }

    //                 }



    //                 resolve("NA");

    //             }

    //         );

    //     });

    // },



    // async getUserAllDetails(user_id) {

    //     return new Promise((resolve, reject) => {

    //         connection.query(

    //             "select * from user_master where user_id = ? AND delete_flag = 0",



    //             [user_id],



    //             (error, rows) => {

    //                 if (error) {

    //                     console.log("database  get all user details error ");



    //                     reject(error); // Reject the promise with the error

    //                 } else {

    //                     if (rows.length > 0) {

    //                         const userData = rows[0];



    //                         let age = 0;



    //                         let dob_new;



    //                         if (userData.dob) {

    //                             dob_new = formatDate(userData.dob);



    //                             age = moment().diff(dob_new, "years");

    //                         }



    //                         const userDataArray = {

    //                             user_id: userData.user_id,



    //                             user_type: userData.user_type,



    //                             user_type_lebal: "0=admin,1=user,2=college, 3 for sub admin",



    //                             login_type: userData.login_type,



    //                             login_type_lebal: "0=app, 1=google, 2=apple, 3=facebook",



    //                             email: userData.email,



    //                             username: userData.username,



    //                             f_name: userData.f_name,



    //                             l_name: userData.l_name,



    //                             full_name: userData.name,



    //                             dob: moment(userData.dob).format("DD-MM-YYYY"),



    //                             age: age,



    //                             phone_code: userData.phone_code,



    //                             mobile: userData.mobile,



    //                             country_id: userData.country_id,



    //                             otp_type: userData.otp_type,



    //                             otp: userData.otp,



    //                             otp_verify: userData.otp_verify,



    //                             image: userData.image,



    //                             gender: userData.gender,



    //                             gender_lebal: "1=men,2=women,3=other",



    //                             address: userData.address,



    //                             latitude: userData.latitude,



    //                             longitude: userData.longitude,



    //                             zipcode: userData.zipcode,



    //                             bio: userData.bio,



    //                             active_flag: userData.active_flag,



    //                             approve_flag: userData.approve_flag,



    //                             profile_complete: userData.profile_complete,



    //                             language_id: userData.language_id,



    //                             facebook_id: userData.facebook_id,



    //                             google_id: userData.google_id,



    //                             apple_id: userData.apple_id,



    //                             notification_status: userData.notification_status,



    //                             delete_flag: userData.delete_flag,



    //                             delete_reason: userData.delete_reason,



    //                             createtime: moment(userData.createtime).format(

    //                                 "DD-MM-YYYY h:mm A"

    //                             ),



    //                             updatetime: moment(userData.updatetime).format(

    //                                 "DD-MM-YYYY h:mm A"

    //                             ),

    //                         };



    //                         resolve(userDataArray);

    //                     } else {

    //                         resolve("NA");

    //                     }

    //                 }

    //             }

    //         );

    //     });

    // },



    async getCurrantWorkProgress(user_id) {

        var date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

        return new Promise((resolve, reject) => {

            var sqlSelect = `

        SELECT COUNT(*) AS today_workProgress 

        FROM feeling_master 

        WHERE user_id = ? 

          AND delete_flag = 0 

          AND DATE(createtime) = ?

      `;

            connection.query(sqlSelect, [user_id, formattedDate], (err, result) => {

                if (err) {

                    return reject(err.message);

                }

                resolve(result[0].today_workProgress);

            });

        });

    },





    async getTodayFeelingCount(user_id) {

        var date = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

        return new Promise((resolve, reject) => {

            var sqlSelect = `

        SELECT COUNT(*) AS today_workProgress 

        FROM feeling_master 

        WHERE user_id = ? 

          AND delete_flag = 0 

          AND DATE(createtime) = ?

      `;

            connection.query(sqlSelect, [user_id, formattedDate], (err, result) => {

                if (err) {

                    return reject(err.message);

                }

                resolve(result[0].today_workProgress);



            });

        });

    },



    async getNotificationCount(user_id) {

        return new Promise((resolve, reject) => {

            var sqlSelect = `SELECT COUNT(*) AS notification_count FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 AND read_status = 0`;

            connection.query(sqlSelect, [user_id], (err, result) => {

                if (err) {

                    return reject(err.message);

                }

                resolve(result[0].notification_count);

            });

        });

    },





    async getLowFeeling14Day(user_id) {



        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND updatetime >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND frequency < 3 ";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },





    async getMid14DayFeeling(user_id) {





        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND updatetime >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND frequency > 2 AND frequency < 8 limit 2";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },



    async getHigh14DayFeeling(user_id) {



        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND updatetime >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND frequency > 7 limit 2";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },





    async getLowFeeling(user_id) {



        // return new Promise((resolve, reject) =>{

        //   // SELECT WEEK(CURDATE(), 1) AS current_week;



        //   // data.date;

        //   const sql = "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency < 3"

        //   connection.query(sql,[user_id],(err,result) =>{

        //     if(err){

        //       reject(err);

        //     }

        //     else if(result.length > 0){

        //       // const question_arr = result.map((question) => ({



        //       const feeling_arr = result.map(async(data) =>({



        //         // user_id : feeling.user_id,



        //         // title: feeling.title,



        //         // content: feeling.content,



        //         // frequency: feeling.frequency,



        //         // updateDate: moment(feeling.updatetime).format('MMM DD '),



        //         // updatetime: moment(feeling.updatetime).format('hh:mm A')

        //         feeling_id: data.feeling_id,

        //           user_id: data.user_id,

        //           event_id: data.event_id,

        //           question_id: data.question_id,

        //           event_name: await this.getEventName(data.event_id),

        //           question: await this.getQuestionDetails(data.question_id),

        //           title: data.title,

        //           content: data.content,

        //           image: data.image,

        //           video: data.video,

        //           thumbnail_image: data.thumbnail_image,

        //           frequency: data.frequency,

        //           type: data.type,

        //           formattedDate: moment(data.createtime).format(

        //             "MMM DD [at] hh:mm A"

        //           ),

        //           updateDate: moment(data.updatetime).format('MMM DD '),



        //           updatetime: moment(data.updatetime).format('hh:mm A')

        //         // CURDATE()



        //       }))



        //     resolve(feeling_arr);

        //     }

        //     resolve("NA")

        //   })



        // })



        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency < 3 ";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },



    async getMidFeeling(user_id) {



        // return new Promise((resolve, reject) =>{

        //   // SELECT WEEK(CURDATE(), 1) AS current_week;



        //   // data.date;

        //   const sql = "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency > 2 AND frequency < 8"

        //   connection.query(sql,[user_id],(err,result) =>{

        //     if(err){

        //       reject(err);

        //     }

        //     else if(result.length > 0){

        //       // const question_arr = result.map((question) => ({



        //       const feeling_arr = result.map(async(data) =>({



        //         // user_id : feeling.user_id,



        //         // title: feeling.title,



        //         // content: feeling.content,



        //         // frequency: feeling.frequency,





        //         feeling_id: data.feeling_id,

        //           user_id: data.user_id,

        //           event_id: data.event_id,

        //           question_id: data.question_id,

        //           event_name: await this.getEventName(data.event_id),

        //           question: await this.getQuestionDetails(data.question_id),

        //           title: data.title,

        //           content: data.content,

        //           image: data.image,

        //           video: data.video,

        //           thumbnail_image: data.thumbnail_image,

        //           frequency: data.frequency,

        //           type: data.type,

        //           formattedDate: moment(data.createtime).format(

        //             "MMM DD [at] hh:mm A"

        //           ),

        //           updateDate: moment(data.updatetime).format('MMM DD '),



        //           updatetime: moment(data.updatetime).format('hh:mm A')

        //         // CURDATE()



        //       }))



        //     resolve(feeling_arr);

        //     }

        //     resolve("NA")

        //   })



        // })

        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency > 2 AND frequency < 8 limit 2";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },

    async getHighFeeling(user_id) {



        // return new Promise((resolve, reject) =>{

        //   // SELECT WEEK(CURDATE(), 1) AS current_week;



        //   // data.date;

        //   const sql = "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency > 7 limit 2"

        //   connection.query(sql,[user_id],(err,result) =>{

        //     if(err){

        //       reject(err);

        //     }

        //     else if(result.length > 0){

        //       // const question_arr = result.map((question) => ({



        //       const feeling_arr = result.map(async(data) =>({



        //         // user_id : feeling.user_id,



        //         // title: feeling.title,



        //         // content: feeling.content,



        //         // frequency: feeling.frequency,

        //         feeling_id: data.feeling_id,

        //           user_id: data.user_id,

        //           event_id: data.event_id,

        //           question_id: data.question_id,

        //           event_name: await this.getEventName(data.event_id),

        //           question: await this.getQuestionDetails(data.question_id),

        //           title: data.title,

        //           content: data.content,

        //           image: data.image,

        //           video: data.video,

        //           thumbnail_image: data.thumbnail_image,

        //           frequency: data.frequency,

        //           type: data.type,

        //           formattedDate: moment(data.createtime).format(

        //             "MMM DD [at] hh:mm A"

        //           ),



        //         updateDate: moment(data.updatetime).format('MMM DD '),



        //         updatetime: moment(data.updatetime).format('hh:mm A')

        //         // CURDATE()



        //       }))



        //     resolve(feeling_arr);

        //     }

        //     resolve("NA")

        //   })



        // })



        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency > 7 limit 2";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },



    async getLowFeelingEvent(user_id, event_id, start_date, end_date) {



        const start_date1 = new Date(start_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });

        const end_date1 = new Date(end_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });



        return new Promise((resolve, reject) => {

            const sqlSelect = `

        SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, 

               thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime 

        FROM feeling_master 

        WHERE delete_flag = 0 

          AND user_id = ? 

          AND event_id = ? 

          AND DATE(updatetime) >= ? 

          AND DATE(updatetime) <= ? 

          AND frequency < 3 AND frequency < 8

      `;



            const values = [user_id, event_id, start_date1, end_date1];



            connection.query(sqlSelect, values, async (err, result) => {

                if (err) {

                    reject(err);

                    return;

                }



                if (result.length === 0) {

                    resolve("NA");

                    return;

                }



                const feeling_arr = [];

                for (const data of result) {

                    feeling_arr.push({

                        feeling_id: data.feeling_id,

                        user_id: data.user_id,

                        event_id: data.event_id,

                        question_id: data.question_id,

                        event_name: await this.getEventName(data.event_id),

                        question: await this.getQuestionDetails(data.question_id),

                        title: data.title,

                        content: data.content,

                        image: data.image,

                        video: data.video,

                        thumbnail_image: data.thumbnail_image,

                        frequency: data.frequency,

                        type: data.type,

                        formattedDate: moment(data.createtime).format("MMM DD [at] hh:mm A"),

                    });

                }



                resolve(feeling_arr);

            });

        });

    },



    async getMidFeelingEvent(user_id, event_id, start_date, end_date) {

        const start_date1 = new Date(start_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });

        const end_date1 = new Date(end_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });



        return new Promise((resolve, reject) => {

            const sqlSelect = `

        SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, 

               thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime 

        FROM feeling_master 

        WHERE delete_flag = 0 

          AND user_id = ? 

          AND event_id = ? 

          AND DATE(updatetime) >= ? 

          AND DATE(updatetime) <= ? 

          AND frequency > 2 AND frequency < 8

      `;



            const values = [user_id, event_id, start_date1, end_date1];



            connection.query(sqlSelect, values, async (err, result) => {

                if (err) {

                    reject(err);

                    return;

                }



                if (result.length === 0) {

                    resolve("NA");

                    return;

                }



                const feeling_arr = [];

                for (const data of result) {

                    feeling_arr.push({

                        feeling_id: data.feeling_id,

                        user_id: data.user_id,

                        event_id: data.event_id,

                        question_id: data.question_id,

                        event_name: await this.getEventName(data.event_id),

                        question: await this.getQuestionDetails(data.question_id),

                        title: data.title,

                        content: data.content,

                        image: data.image,

                        video: data.video,

                        thumbnail_image: data.thumbnail_image,

                        frequency: data.frequency,

                        type: data.type,

                        formattedDate: moment(data.createtime).format("MMM DD [at] hh:mm A"),

                    });

                }



                resolve(feeling_arr);

            });

        });

    },

    async getHighFeelingEvent(user_id, event_id, start_date, end_date) {

        const start_date1 = new Date(start_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });

        const end_date1 = new Date(end_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });



        return new Promise((resolve, reject) => {

            const sqlSelect = `

        SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, 

               thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime 

        FROM feeling_master 

        WHERE delete_flag = 0 

          AND user_id = ? 

          AND event_id = ? 

          AND DATE(updatetime) >= ? 

          AND DATE(updatetime) <= ? 

          AND frequency > 7

      `;



            const values = [user_id, event_id, start_date1, end_date1];



            connection.query(sqlSelect, values, async (err, result) => {

                if (err) {

                    reject(err);

                    return;

                }



                if (result.length === 0) {

                    resolve("NA");

                    return;

                }



                const feeling_arr = [];

                for (const data of result) {

                    feeling_arr.push({

                        feeling_id: data.feeling_id,

                        user_id: data.user_id,

                        event_id: data.event_id,

                        question_id: data.question_id,

                        event_name: await this.getEventName(data.event_id),

                        question: await this.getQuestionDetails(data.question_id),

                        title: data.title,

                        content: data.content,

                        image: data.image,

                        video: data.video,

                        thumbnail_image: data.thumbnail_image,

                        frequency: data.frequency,

                        type: data.type,

                        formattedDate: moment(data.createtime).format("MMM DD [at] hh:mm A"),

                    });

                }



                resolve(feeling_arr);

            });

        });

    },



    async getLastWeekFeeling(user_id) {

        return new Promise((resolve, reject) => {

            var sqlSelect = "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND WEEK(updatetime, 1) = WEEK(CURDATE(), 1) - 1 AND YEAR(updatetime) = YEAR(CURDATE()) AND frequency > 7 limit 2";

            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },

    async get14DayHighFeeling(user_id) {

        return new Promise((resolve, reject) => {

            var sqlSelect = "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND updatetime >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND frequency > 7 limit 2";

            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr.length > 0 ? feeling_arr : "NA");

                }

            });

        });

    },









    async getProfile(user_id) {

        return new Promise((resolve, reject) => {

            connection.query(

                "SELECT `email`,`mobile`,`avatar_id`,`gender`,address,latitude,longitude,zipcode,image FROM `user_master` WHERE user_id =? AND delete_flag = 0",



                [user_id],



                (err, rows) => {

                    if (err) {

                        reject(err);

                    }



                    if (rows.length > 0) {

                        resolve(rows[0]);

                    }

                    resolve(0);

                }

            );

        });

    },



    async getUserInterest(user_id) {

        return new Promise((resolve, reject) => {

            connection.query(

                "SELECT category_id FROM user_master WHERE user_id = ? AND delete_flag = 0 order by category_id desc",



                [user_id],



                (err, result) => {

                    if (err) {

                        reject(err);

                    }



                    if (result.length > 0) {

                        resolve(result[0]);

                    }

                    resolve(0);

                }

            );

        });

    },



    async selectedCategories(catArr) {

        return new Promise((resolve, reject) => {

            const sql = `SELECT 



               category_id, 



               category_name, 



               image,



               CASE WHEN category_id IN (${catArr}) THEN 1 ELSE 0 END AS status



             FROM category_master 



             WHERE delete_flag = 0 order by category_id desc`;



            connection.query(sql, (err, result) => {

                if (err) {

                    reject(err);

                }



                if (result.length > 0) {

                    resolve(result);

                }



                resolve(0);

            });

        });

    },



    async getBlogs(category_id) {

        return new Promise((resolve, reject) => {

            if (typeof category_id !== "string" || category_id.trim() === "") {

                reject(new Error("category_id must be a non-empty string"));

                return;

            }



            // Convert the comma-separated string into an array of integers

            const categoryList = category_id

                .split(",") // Split into an array

                .map(id => parseInt(id.trim())) // Convert to integers & trim spaces

                .filter(id => !isNaN(id)) // Remove invalid numbers

                .join(","); // Convert back to a string for SQL



            if (!categoryList) {

                reject(new Error("Invalid category_id format"));

                return;

            }



            const sql = `SELECT blog_id,title,description,image FROM blog_master WHERE delete_flag = 0 ORDER BY CASE WHEN category_id IN(${categoryList}) THEN 1 ELSE 2 END,blog_id DESC LIMIT 5`;

            connection.query(sql, (err, result) => {

                if (err) {

                    reject();

                } else if (result.length > 0) {

                    resolve(result);

                } else {

                    resolve("NA");

                }

            });

        });

    },



    async getAllBlogs(category_id) {

        return new Promise((resolve, reject) => {

            if (typeof category_id !== "string" || category_id.trim() === "") {

                reject(new Error("category_id must be a non-empty string"));

                return;

            }



            // Convert the comma-separated string into an array of integers

            const categoryList = category_id

                .split(",") // Split into an array

                .map(id => parseInt(id.trim())) // Convert to integers & trim spaces

                .filter(id => !isNaN(id)) // Remove invalid numbers

                .join(","); // Convert back to a string for SQL



            if (!categoryList) {

                reject(new Error("Invalid category_id format"));

                return;

            }



            const sql = `SELECT blog_id,title,description,image FROM blog_master WHERE delete_flag = 0 ORDER BY CASE WHEN category_id IN(${categoryList}) THEN 1 ELSE 2 END,blog_id DESC `;

            connection.query(sql, (err, result) => {

                if (err) {

                    reject();

                } else if (result.length > 0) {

                    resolve(result);

                } else {

                    resolve("NA");

                }

            });

        });

    },



    async getSchedule(user_id) {

        console.log(user_id);



        return new Promise((resolve, reject) => {

            const sql =

                "SELECT event_id,day_id,day_name,notification_per_day_count,start_date,end_date,start_time,end_time,reminded_throughout FROM schedule_notification_master WHERE delete_flag = 0 AND user_id = ?";



            connection.query(sql, [user_id], (err, result) => {

                if (err) {

                    reject();

                } else if (result.length > 0) {

                    // console.log("schedule11", result[0]);



                    resolve(result[0]);

                } else {

                    resolve("NA");

                }

            });

        });

    },

    async getFeeling(user_id) {

        return new Promise((resolve, reject) => {

            const sql =

                "SELECT title,content,image,video,frequency FROM feeling_master WHERE delete_flag = 0 AND user_id = ?";



            connection.query(sql, [user_id], (err, result) => {

                if (err) {

                    reject(err);

                } else if (result.length > 0) {

                    resolve(result);

                }

                resolve("NA");

            });

        });

    },

    async getHighlights(user_id) {

        try {

            const sql = `SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, DAYNAME(updatetime) AS day, updatetime FROM feeling_master  WHERE delete_flag = 0 AND user_id = ?  ORDER BY updatetime DESC  LIMIT 5`;



            const results = await new Promise((resolve, reject) => {

                connection.query(sql, [user_id], (err, result) => {

                    if (err) return reject(err);

                    resolve(result);

                });

            });



            if (results.length === 0) {

                return "NA";

            }



            // Process the highlight(s)

            const highlightArr = await Promise.all(

                results.map(async (highlight) => ({

                    user_id: highlight.user_id,

                    feeling_id: highlight.feeling_id,

                    event_id: highlight.event_id,

                    event_name: await this.getEventName(highlight.event_id),

                    question: await this.getQuestionDetails(highlight.question_id),

                    question_id: highlight.question_id,

                    image: highlight.image,

                    video: highlight.video,

                    thumbnail_image: highlight.thumbnail_image,

                    frequency: highlight.frequency,

                    type: highlight.type,

                    formattedDate: moment(highlight.updatetime).format(

                        "MMM DD [at] hh:mm A"

                    ),

                    title: highlight.title,

                    content: highlight.content,

                    updateDay: highlight.day,

                    updateDate: moment(highlight.updatetime).format("MMM DD"),

                    updatetime: moment(highlight.updatetime).format("hh:mm A"),

                }))

            );



            return highlightArr;

        } catch (error) {

            throw new Error(`Error fetching highlights: ${error.message}`);

        }

    },



    async getEventName(event_id) {

        try {

            const sqlSelect = `SELECT event_id, event_name FROM event_master WHERE event_id = ? AND delete_flag = 0`;



            // Query the database for the event name

            const result = await new Promise((resolve, reject) => {

                connection.query(sqlSelect, [event_id], (err, result) => {

                    if (err) return reject(err);

                    resolve(result);

                });

            });



            return result.length > 0 ? result[0].event_name : "NA";

        } catch (error) {

            throw new Error(`Error fetching event name: ${error.message}`);

        }

    },

    // async getQuestionDetails(question_id) {

    //   try {

    //     const sqlSelect = `SELECT question_id, user_id, question, question_created_by, delete_flag, createtime, updatetime, mysqltime FROM question_master WHERE question_id = ? AND delete_flag = 0`;



    //     // Query the database for the event name

    //     const result = await new Promise((resolve, reject) => {

    //       connection.query(sqlSelect, [question_id], (err, result) => {

    //         if (err) return reject(err);

    //         resolve(result);

    //       });

    //     });



    //     return result.length > 0 ? result[0] : "NA";

    //   } catch (error) {

    //     throw new Error(`Error fetching event name: ${error.message}`);

    //   }

    // },



    async getQuestionDetails(question_id) {

        try {

            const sqlSelect = `SELECT question_id,user_id,question,question_created_by,delete_flag,DATE_FORMAT(createtime, '%Y-%m-%d %H:%i:%s') AS createtime,DATE_FORMAT(updatetime, '%Y-%m-%d %H:%i:%s') AS updatetime,mysqltime FROM question_master WHERE question_id = ? AND delete_flag = 0`;

            // Query the database for the question details

            const result = await new Promise((resolve, reject) => {

                connection.query(sqlSelect, [question_id], (err, result) => {

                    if (err) return reject(err);

                    resolve(result);

                });

            });

            return result.length > 0 ? result[0] : "NA";

        } catch (error) {

            throw new Error(`Error fetching question details: ${error.message}`);

        }

    },





    // async getFeelingsByDate(data){



    //   return new Promise((resolve, reject) =>{



    //     // data.date;

    //     const sql = "SELECT type,thumbnail_image,video,image,question_id,event_id,feeling_id,user_id,title,content,frequency,updatetime,DAYNAME(updatetime) AS day,YEAR(updatetime) AS year FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND DATE(updatetime) = STR_TO_DATE(?, '%d-%m-%Y') ORDER BY updatetime DESC;"



    //     connection.query(sql,[data.user_id,data.date],async(err,result) =>{

    //       if(err){

    //         reject(err);

    //       }

    //       else if(result.length > 0){



    //         const feeling_arr = result.map(async(feeling) =>({

    //           feeling_id : data.feeling_id,

    //           user_id : data.user_id,

    //           event_id : data.event_id,

    //           question_id : data.question_id,

    //           event_name: await this.getEventName(data.event_id),

    //           question: await this.getQuestionDetails(data.question_id),

    //           title : data.title,

    //           content : data.content,

    //           image : data.image,

    //           video : data.video,

    //           thumbnail_image : data.thumbnail_image,

    //           frequency : data.frequency,

    //           type : data.type,

    //           formattedDate : moment(data.createtime).format("MMM DD [at] hh:mm A"),

    //           updateDate: moment(feeling.updatetime).format('MMM DD '),

    //           updatetime: moment(feeling.updatetime).format('hh:mm A'),

    //           updateDay: feeling.day,

    //           updateYear: feeling.year,

    //           content: feeling.content,



    //         }))



    //       resolve(feeling_arr);

    //       }

    //       resolve("NA")

    //     })



    //   })

    // },

    async getFeelingsByDate(data) {

        return new Promise((resolve, reject) => {

            const sql = `

        SELECT type, thumbnail_image, video, image, question_id, event_id, feeling_id, user_id, title, content, frequency, updatetime, DAYNAME(updatetime) AS day, YEAR(updatetime) AS year FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND DATE(updatetime) = STR_TO_DATE(?, '%d-%m-%Y')

        ORDER BY feeling_id DESC;`;



            connection.query(sql, [data.user_id, data.date], async (err, result) => {

                if (err) {

                    console.error("Database error:", err);

                    return reject(err);

                }



                if (result.length === 0) {

                    return resolve("NA");

                }



                try {

                    const feelingArr = await Promise.all(

                        result.map(async (feeling) => ({

                            feeling_id: feeling.feeling_id,

                            user_id: feeling.user_id,

                            event_id: feeling.event_id,

                            question_id: feeling.question_id,

                            event_name: await this.getEventName(feeling.event_id),

                            question: await this.getQuestionDetails(feeling.question_id),

                            title: feeling.title,

                            content: feeling.content,

                            image: feeling.image,

                            video: feeling.video,

                            thumbnail_image: feeling.thumbnail_image,

                            frequency: feeling.frequency,

                            type: feeling.type,

                            formattedDate: moment(feeling.updatetime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                            updateDate: moment(feeling.updatetime).format("MMM DD"),

                            updatetime: moment(feeling.updatetime).format("hh:mm A"),

                            updateDay: feeling.day,

                            updateYear: feeling.year,

                        }))

                    );



                    resolve(feelingArr);

                } catch (error) {

                    console.error("Error processing feelings:", error); // Log the error

                    reject(error);

                }

            });

        });

    },



    async getNotification(data) {

        return new Promise((resolve, reject) => {

            const limit = Number(data.limit);

            const offset = Number(data.offset);



            const sql = `

            SELECT notification_message_id, user_id, other_user_id, action, action_id, action_json, title, title_2, message, read_status, createtime, message_2, message_3

            FROM user_notification_message

            WHERE delete_flag = 0 AND other_user_id = ? AND title != 'Login'

            ORDER BY notification_message_id DESC

            LIMIT ? OFFSET ?

        `;

            const values = [data.user_id, limit, offset];



            connection.query(sql, values, async (err, result) => {

                if (err) {

                    return reject(err);

                }



                if (result.length === 0) {

                    return resolve("NA");

                }



                try {

                    const notifications = await Promise.all(

                        result.map(async (notification) => {

                            let name = "NA";

                            let image = "NA";



                            // Fetch user details based on the action

                            let userDetails;

                            if (

                                notification.action === "broadcast" ||

                                notification.action === "signup"

                            ) {

                                userDetails = await this.getUserDetails(1);

                            } else {

                                userDetails = await this.getUserDetails(notification.user_id);

                            }



                            if (userDetails !== "NA") {

                                name = userDetails.name;

                                image = userDetails.image;

                            }



                            return {

                                notification_message_id: notification.notification_message_id,

                                user_id: notification.user_id,

                                other_user_id: notification.other_user_id,

                                action: notification.action,

                                action_id: notification.action_id,

                                action_json: notification.action_json,

                                title: notification.title,

                                title_2: notification.title_2,

                                message: notification.message,

                                message_2: notification.message_2,

                                message_3: notification.message_3,

                                read_status: notification.read_status,

                                createtime: notification.createtime,

                                name: name,

                                image: image,

                            };

                        })

                    );



                    resolve(notifications);

                } catch (error) {

                    reject(error);

                }

            });

        });

    },

    async getLastWeek(data) {

        return new Promise((resolve, reject) => {

            const limit = Number(data.limit);

            const offset = Number(data.offset);



            const sql = `SELECT notification_message_id, user_id, other_user_id, action, action_id, action_json, title, title_2, message, read_status, createtime, message_2, message_3 FROM user_notification_message WHERE delete_flag = 0 AND other_user_id = ? AND title != 'Login' AND (createtime <= NOW() - INTERVAL 7 DAY) ORDER BY notification_message_id DESC LIMIT ? OFFSET ?;`;

            const values = [data.user_id, limit, offset];



            connection.query(sql, values, async (err, result) => {

                if (err) {

                    return reject(err);

                }



                if (result.length === 0) {

                    return resolve("NA");

                }



                try {

                    const notifications = await Promise.all(

                        result.map(async (notification) => {

                            let name = "NA";

                            let image = "NA";



                            // Fetch user details based on the action

                            let userDetails;

                            if (

                                notification.action === "broadcast" ||

                                notification.action === "signup"

                            ) {

                                userDetails = await this.getUserDetails(1);

                            } else {

                                userDetails = await this.getUserDetails(notification.user_id);

                            }



                            if (userDetails !== "NA") {

                                name = userDetails.name;

                                image = userDetails.image;

                            }



                            return {

                                notification_message_id: notification.notification_message_id,

                                user_id: notification.user_id,

                                other_user_id: notification.other_user_id,

                                action: notification.action,

                                action_id: notification.action_id,

                                action_json: notification.action_json,

                                title: notification.title,

                                title_2: notification.title_2,

                                message: notification.message,

                                message_2: notification.message_2,

                                message_3: notification.message_3,

                                read_status: notification.read_status,

                                createtime: moment(notification.createtime).format(

                                    "DD-MMMM-YYYY HH:MM:SS"

                                ),

                                name: name,

                                image: image,

                            };

                        })

                    );



                    resolve(notifications);

                } catch (error) {

                    reject(error);

                }

            });

        });

    },

    async getEarlyWeek(data) {

        return new Promise((resolve, reject) => {

            const limit = Number(data.limit);

            const offset = Number(data.offset);



            const sql = `SELECT notification_message_id, user_id, other_user_id, action, action_id, action_json, title, title_2, message, read_status, createtime, message_2, message_3 FROM user_notification_message WHERE delete_flag = 0 AND other_user_id = ? AND title != 'Login' AND (createtime >= NOW() - INTERVAL 7 DAY) ORDER BY notification_message_id DESC LIMIT ? OFFSET ?;`;

            const values = [data.user_id, limit, offset];



            connection.query(sql, values, async (err, result) => {

                if (err) {

                    return reject(err);

                }



                if (result.length === 0) {

                    return resolve("NA");

                }



                try {

                    const notifications = await Promise.all(

                        result.map(async (notification) => {

                            let name = "NA";

                            let image = "NA";



                            // Fetch user details based on the action

                            let userDetails;

                            if (

                                notification.action === "broadcast" ||

                                notification.action === "signup"

                            ) {

                                userDetails = await this.getUserDetails(1);

                            } else {

                                userDetails = await this.getUserDetails(notification.user_id);

                            }



                            if (userDetails !== "NA") {

                                name = userDetails.name;

                                image = userDetails.image;

                            }



                            return {

                                notification_message_id: notification.notification_message_id,

                                user_id: notification.user_id,

                                other_user_id: notification.other_user_id,

                                action: notification.action,

                                action_id: notification.action_id,

                                action_json: notification.action_json,

                                title: notification.title,

                                title_2: notification.title_2,

                                message: notification.message,

                                message_2: notification.message_2,

                                message_3: notification.message_3,

                                read_status: notification.read_status,

                                createtime: moment(notification.createtime).format(

                                    "DD-MMMM-YYYY HH:MM:SS"

                                ),

                                name: name,

                                image: image,

                            };

                        })

                    );



                    resolve(notifications);

                } catch (error) {

                    reject(error);

                }

            });

        });

    },

    async getAvtarData() {

        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT avtar_id, image FROM avtar_image WHERE delete_flag = 0";

            connection.query(sqlSelect, async (err, result) => {

                if (err) {

                    reject(err);

                } else if (result.length <= 0) {

                    resolve("NA");

                } else {

                    resolve(result.length > 0 ? result : "NA");

                }

            });

        });

    },



    async getAvtarImageUser(avatar_id) {

        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT avtar_id, image FROM avtar_image WHERE delete_flag = 0 AND avtar_id = ?";

            connection.query(sqlSelect, [avatar_id], async (err, result) => {

                if (err) {

                    reject(err);

                } else if (result.length <= 0) {

                    resolve("NA");

                } else {

                    resolve(result.length > 0 ? result[0].image : "NA");

                }

            });

        });

    },



    async deleteNotification(data) {

        return new Promise((resolve, reject) => {

            const sql =

                " UPDATE user_notification_message SET delete_flag = 1 WHERE other_user_id =? AND notification_message_id =? ";

            const values = [data.user_id, data.notification_message_id];

            connection.query(sql, values, (err, result) => {

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    resolve(1);

                }

            });

        });

    },

    async deleteAllNotification(data) {

        return new Promise((resolve, reject) => {

            const sql =

                "UPDATE user_notification_message SET delete_flag = 1 WHERE other_user_id =? ";

            const values = [data.user_id];

            connection.query(sql, values, (err, result) => {

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    resolve(1);

                }

            });

        });

    },

    // async getProgressData(user_id){

    //   return new Promise((resolve,reject) => {

    //     var sqlSelect = ""

    //   })

    // },

    async getFealingData(user_id) {

        return new Promise((resolve, reject) => {

            var sqlSelect =

                "SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime, updatetime, mysqltime FROM feeling_master WHERE  user_id = ? AND delete_flag = 0 order by feeling_id desc ";



            const values = [user_id];

            connection.query(sqlSelect, values, async (err, result) => {

                var feeling_arr = [];

                if (err) {

                    reject(err);

                } else if (result.affectedRows < 0) {

                    resolve("NA");

                } else {

                    for (var data of result) {

                        feeling_arr.push({

                            feeling_id: data.feeling_id,

                            user_id: data.user_id,

                            event_id: data.event_id,

                            question_id: data.question_id,

                            event_name: await this.getEventName(data.event_id),

                            question: await this.getQuestionDetails(data.question_id),

                            title: data.title,

                            content: data.content,

                            image: data.image,

                            video: data.video,

                            thumbnail_image: data.thumbnail_image,

                            frequency: data.frequency,

                            type: data.type,

                            formattedDate: moment(data.createtime).format(

                                "MMM DD [at] hh:mm A"

                            ),

                        });

                    }

                    resolve(feeling_arr);

                }

            });

        });

    },



    async getTimeLineArr(userId) {

        return new Promise((resolve, reject) => {

            const currentDate = new Date();

            const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));



            const weekStatus = [];

            const queryPromises = [];



            for (let i = 0; i < 7; i++) {

                const day = new Date(monday);

                day.setDate(monday.getDate() + i);



                const dayStr = day.toISOString().split('T')[0];

                const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `

            SELECT DATE(createtime) AS date

            FROM feeling_master

            WHERE user_id = ? 

              AND delete_flag = 0 AND DATE(createtime) = ?

            ORDER BY createtime DESC

          `;



                    connection.query(query, [userId, dayStr], (err, results) => {

                        if (err) {

                            console.error('Error fetching timeline array:', err.message);

                            return rejectQuery(err);

                        }

                        weekStatus.push({

                            date: dayStr,

                            day_name: dayName,

                            status: results.length > 0 ? 1 : 0,

                            status_label: results.length > 0 ? "1 for feeling created" : "0 for not feeling created",

                            day: "Day " + (i + 1),

                        });

                        resolveQuery();

                    });

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => resolve(weekStatus))

                .catch(reject);

        });

    },



    async getTimeLineCountArr(userId) {

        return new Promise((resolve, reject) => {

            const currentDate = new Date();

            const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));



            const weekStatus = [];

            const queryPromises = [];



            for (let i = 0; i < 7; i++) {

                const day = new Date(monday);

                day.setDate(monday.getDate() + i);



                const dayStr = day.toISOString().split('T')[0];

                const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `

            SELECT count(*) as feling_count, DATE(createtime) AS date

            FROM feeling_master

            WHERE user_id = ? 

              AND delete_flag = 0 AND DATE(createtime) = ?

            ORDER BY createtime DESC

          `;



                    connection.query(query, [userId, dayStr], (err, results) => {

                        if (err) {

                            console.error('Error fetching timeline array:', err.message);

                            return rejectQuery(err);

                        }

                        weekStatus.push({

                            date: dayStr,

                            day_name: dayName,

                            feling_count: results[0].feling_count,

                            status: results.length > 0 ? 1 : 0,

                            status_label: results.length > 0 ? "1 for feeling created" : "0 for not feeling created",

                        });

                        resolveQuery();

                    });

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => resolve(weekStatus))

                .catch(reject);

        });

    },









    // async getTimeLineCountArr(userId) {

    //   return new Promise((resolve, reject) => {

    //     const currentDate = new Date();

    //     const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)); 



    //     const weekStatus = [];

    //     const queryPromises = [];



    //     for (let i = 0; i < 7; i++) {

    //       const day = new Date(monday);

    //       day.setDate(monday.getDate() + i);



    //       const dayStr = day.toISOString().split('T')[0];

    //       const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();



    //       const queryPromise = new Promise((resolveQuery, rejectQuery) => {

    //         const query = `

    //           SELECT count(*) as feling_count, DATE(createtime) AS date

    //           FROM feeling_master

    //           WHERE user_id = ? 

    //             AND delete_flag = 0 AND DATE(createtime) = ?

    //           ORDER BY createtime DESC

    //         `;



    //         connection.query(query, [userId, dayStr], (err, results) => {

    //           if (err) {

    //             return rejectQuery(err);

    //           }

    //           weekStatus.push({

    //             date: dayStr, 

    //             day_name: dayName,

    //             feling_count : results[0]?.feling_count || 0,

    //             status: results.length > 0 ? 1 : 0,

    //             status_label: results.length > 0 ? "1 for feeling created" : "0 for not feeling created",

    //           });

    //           resolveQuery(); 

    //         });

    //       });



    //       queryPromises.push(queryPromise);

    //     }



    //     Promise.all(queryPromises)

    //       .then(() => resolve(weekStatus))

    //       .catch(reject); 

    //   });

    // },

    // async getStatistics(user_id) {

    //   return new Promise((resolve, reject) => {

    //     const currentDate = new Date();

    //     const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));



    //     const weekStatus = [];

    //     const queryPromises = [];



    //     for (let i = 0; i < 7; i++) {

    //       const day = new Date(monday);

    //       day.setDate(monday.getDate() + i);



    //       const dayStr = day.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

    //       const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Get day name



    //       const queryPromise = new Promise((resolveQuery, rejectQuery) => {

    //         const query = `

    //           SELECT 

    //             qm.question_id, 

    //             qm.user_id,  

    //             qm.question, 

    //             IFNULL(answer_count, 0) AS answer_count 

    //           FROM 

    //             question_master qm 

    //           LEFT JOIN 

    //             (SELECT question_id, COUNT(feeling_id) AS answer_count  

    //              FROM feeling_master 

    //              GROUP BY question_id) fm 

    //           ON 

    //             qm.question_id = fm.question_id 

    //           WHERE 

    //             qm.user_id = ? 

    //             AND qm.delete_flag = 0

    //             AND DATE(qm.createtime) = ?; 

    //         `;



    //         connection.query(query, [user_id, dayStr], (err, results) => {

    //           if (err) {

    //             return rejectQuery(err);

    //           }



    //           weekStatus.push({

    //             date: dayStr,

    //             day_name: dayName,

    //             answer_count: results.reduce((sum, result) => sum + result.answer_count, 0),

    //             questions : (results.length > 0) ?  results.map(result => ({

    //               question_id: result.question_id,

    //               question: (result.question.length > 0) ? (result.question > 100) ? 100 :result.question  : "NA",

    //               answer_count: result.answer_count

    //             })) : "NA"

    //           });

    //           resolveQuery();

    //         });

    //       });



    //       queryPromises.push(queryPromise);

    //     }



    //     Promise.all(queryPromises)

    //       .then(() => resolve(weekStatus))

    //       .catch(reject);

    //   });

    // },





    async getStatistics(user_id) {

        return new Promise((resolve, reject) => {

            const currentDate = new Date();

            const monday = new Date(currentDate.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1))); // Get Monday



            const question_arr = [];

            const queryPromises = [];



            for (let i = 0; i < 7; i++) {

                const day = new Date(monday);

                day.setDate(monday.getDate() + i);



                const dayStr = day.toISOString().split('T')[0]; // Format date as YYYY-MM-DD



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `

            SELECT 

              qm.question_id, 

              qm.user_id,  

              qm.question, 

              IFNULL(answer_count, 0) AS answer_count 

            FROM 

              question_master qm 

            LEFT JOIN 

              (SELECT question_id, COUNT(feeling_id) AS answer_count  

               FROM feeling_master 

               GROUP BY question_id) fm 

            ON 

              qm.question_id = fm.question_id 

            WHERE 

              qm.user_id = ? 

              AND qm.delete_flag = 0

              AND DATE(qm.createtime) = ?;

          `;



                    connection.query(query, [user_id, dayStr], (err, results) => {

                        if (err) {

                            return rejectQuery(err);

                        }

                        if (results.length > 0) {

                            results.forEach(result => {

                                question_arr.push({

                                    question_id: result.question_id,

                                    question: result.question.length > 0 ?

                                        (result.question.length > 100 ? result.question.substring(0, 100) : result.question) : "NA",

                                    answer_count: result.answer_count,

                                    answer_count_par: result.answer_count / 100

                                });

                            });

                        }

                        resolveQuery();

                    });

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => resolve(question_arr))

                .catch(reject);

        });

    },



    async getStatisticsEvent(user_id, event_id, start_date, end_date) {

        const start_date1 = new Date(start_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });

        const end_date1 = new Date(end_date).toLocaleDateString("en-CA", { timeZone: process.env.TIME_ZONE });



        const question_arr = [];

        const queryPromises = [];



        return new Promise((resolve, reject) => {

            const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                const query = `SELECT feeling_id, user_id, event_id, question_id, title, content, image, video, thumbnail_image, frequency, type, delete_flag, createtime 

                           FROM feeling_master 

                           WHERE DATE(createtime) >= ? AND DATE(createtime) <= ? AND event_id = ? AND user_id = ?`;



                connection.query(query, [start_date1, end_date1, event_id, user_id], (err, results) => {

                    if (err) {

                        return rejectQuery(err);

                    }

                    if (results.length > 0) {

                        const innerQueryPromises = results.map(data => {

                            return new Promise((resolveInner, rejectInner) => {

                                const sqlSelect = `SELECT COUNT(feeling_id) AS answer_count 

                                               FROM feeling_master 

                                               WHERE event_id = ? AND user_id = ? AND question_id = ?`;

                                connection.query(sqlSelect, [event_id, user_id, data.question_id], (err, questionresult) => {

                                    if (err) {

                                        return rejectInner(err);

                                    }

                                    if (questionresult.length > 0) {

                                        const answer_count = questionresult[0].answer_count;

                                        question_arr.push({

                                            feeling_id: data.feeling_id,

                                            question_id: data.question_id,

                                            question: data.title.length > 0 ?

                                                (data.title.length > 100 ? data.title.substring(0, 100) : data.title) : "NA",

                                            answer_count: answer_count,

                                            answer_count_par: answer_count / 100

                                        });

                                    }

                                    resolveInner();

                                });

                            });

                        });



                        // Wait for all inner queries to complete

                        Promise.all(innerQueryPromises)

                            .then(() => resolveQuery())

                            .catch(rejectQuery);

                    } else {

                        resolveQuery(); // Resolve if no results

                    }

                });

            });



            queryPromises.push(queryPromise);



            Promise.all(queryPromises)

                .then(() => resolve(question_arr))

                .catch(reject);

        });

    },



    async getUserRandomQuestion(user_id, question_ids_str) {

        const question_ids = question_ids_str.split(',').map(id => id.trim());

        return new Promise((resolve, reject) => {

            // Convert string to array

            connection.query(

                `SELECT question_id,user_id,question,question_created_by FROM question_master WHERE delete_flag = 0 AND question_id IN(?) ORDER BY RAND() LIMIT 1`,

                [question_ids],

                (err, result) => {

                    if (err) {

                        reject(err);

                    }



                    const questionIds = question_ids_str

                        ? question_ids_str.split(",").map(Number)

                        : [];

                    if (result.length > 0) {

                        const randomQuestion = {

                            question_id: result[0].question_id,

                            question: result[0].question,

                            user_id: result[0].user_id,

                            question_created_by: result[0].question_created_by,

                            status: questionIds.includes(result[0].question_id),

                        };



                        resolve(randomQuestion);

                    } else {

                        resolve("NA");

                    }

                }

            );

        });

    },



    //   async getGraf(user_id) {

    //     return new Promise((resolve, reject) => {

    //         const currentDate = new Date();

    //         // const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1)); 

    //         const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())); 



    //         const weekStatus = [];

    //         const queryPromises = [];



    //         for (let i = 0; i < 7; i++) {

    //             const day = new Date(monday);

    //             day.setDate(monday.getDate());



    //             const dayStr = day.toISOString().split('T')[0];

    //             const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    //             resolve(dayName)

    //             const queryPromise = new Promise((resolveQuery, rejectQuery) => {

    //                 const query = `SELECT SUM(frequency) AS frequency_count FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND DATE(updatetime) = ?`;



    //                 connection.query(query, [user_id, dayStr], (err, results) => {

    //                     if (err) {

    //                         console.error('Error fetching timeline array:', err.message);

    //                         return rejectQuery(err);

    //                     }

    //                     weekStatus.push({

    //                         day: dayName,

    //                         frequency_count: results[0].frequency_count || 0, 

    //                         fequency : (results[0].frequency_count == null || results[0].frequency_count <= 30 ) ? "Low" : (results[0].frequency_count > 30 && results[0].frequency_count <= 70) ? "Medium" : "High",

    //                     });

    //                     resolveQuery(); 

    //                 });

    //             });



    //             queryPromises.push(queryPromise);

    //         }



    //         Promise.all(queryPromises).then(() => resolve(weekStatus)).catch(reject); 

    //     });

    // },



    async getGraf(user_id) {

        return new Promise((resolve, reject) => {

            const currentDate = new Date(); // Get today's date



            const weekStatus = [];

            const queryPromises = [];



            for (let i = 0; i < 7; i++) {

                const day = new Date(currentDate);

                day.setDate(currentDate.getDate() + i); // Move forward for the next 7 days



                const dayStr = day.toISOString().split('T')[0]; // Format as YYYY-MM-DD

                const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // Get day name



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `SELECT SUM(frequency) AS frequency_count FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND DATE(updatetime) = ?`;



                    connection.query(query, [user_id, dayStr], (err, results) => {

                        if (err) {

                            console.error('Error fetching timeline array:', err.message);

                            return rejectQuery(err);

                        }

                        weekStatus.push({

                            day: dayName,

                            date: dayStr, // Added date for clarity

                            frequency_count: results[0]?.frequency_count || 0,

                            frequency: (results[0]?.frequency_count == null || results[0]?.frequency_count <= 30) ? "Low"

                                : (results[0]?.frequency_count > 30 && results[0]?.frequency_count <= 70) ? "Medium"

                                    : "High",

                        });

                        resolveQuery();

                    });

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => resolve(weekStatus)) // No need to reverse, already in correct order

                .catch(reject);

        });

    },





    async getWeeklyGraf(user_id) {

        return new Promise((resolve, reject) => {

            const currentDate = new Date();

            const monday = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));



            const weekStatus = [];

            const queryPromises = [];



            for (let week = 0; week < 4; week++) {

                const weekKey = `week_${week + 1}`;

                let totalFrequencyCount = 0;



                for (let dayOffset = 0; dayOffset < 7; dayOffset++) {

                    const day = new Date(monday);

                    day.setDate(monday.getDate() + (week * 7) + dayOffset);



                    const dayStr = day.toISOString().split('T')[0];



                    const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                        const query = `SELECT SUM(frequency) AS frequency_count FROM feeling_master WHERE delete_flag = 0 AND user_id = ? AND DATE(updatetime) = ?`;



                        connection.query(query, [user_id, dayStr], (err, results) => {

                            if (err) {

                                console.error('Error fetching weekly data:', err.message);

                                return rejectQuery(err);

                            }



                            const frequencyCount = results[0].frequency_count || 0;

                            totalFrequencyCount += frequencyCount;

                            resolveQuery();

                        });

                    });



                    queryPromises.push(queryPromise);

                }



                const weekPromise = Promise.all(queryPromises).then(() => {

                    const frequencyCategory = (totalFrequencyCount <= 30) ? "Low" :

                        (totalFrequencyCount > 30 && totalFrequencyCount <= 70) ? "Medium" : "High";



                    weekStatus.push({

                        day: weekKey,

                        frequency_count: totalFrequencyCount,

                        frequency: frequencyCategory,

                    });

                });



                queryPromises.push(weekPromise);

            }



            Promise.all(queryPromises)

                .then(() => resolve(weekStatus))

                .catch(reject);

        });

    },

    async getYearlyGraf(user_id) {

        return new Promise((resolve, reject) => {

            const currentYear = new Date().getFullYear();

            const monthStatus = [];

            const queryPromises = [];



            for (let month = 0; month < 12; month++) {

                const monthStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-01`;



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `

          SELECT SUM(frequency) AS frequency_count 

          FROM feeling_master 

          WHERE delete_flag = 0 

            AND user_id = ? 

            AND DATE(updatetime) >= ? 

            AND DATE(updatetime) < ?`;



                    const startDate = new Date(monthStr);

                    const endDate = new Date(startDate);

                    endDate.setMonth(endDate.getMonth() + 1);



                    connection.query(query, [user_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]], (err, results) => {

                        if (err) {

                            console.error('Error fetching yearly data:', err.message);

                            return rejectQuery(err);

                        }

                        const frequencyCount = results[0].frequency_count || 0;

                        monthStatus.push({

                            day: startDate.toLocaleString('default', { month: 'long' }),

                            frequency_count: frequencyCount,

                            frequency: (frequencyCount == null || frequencyCount <= 30) ? "Low" :

                                (frequencyCount > 30 && frequencyCount <= 70) ? "Medium" : "High",

                        });

                        resolveQuery();

                    });

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => {

                    // Sort the monthStatus array in desired order

                    monthStatus.sort((a, b) => {

                        const monthOrder = new Date(`${a.day} 1, ${currentYear}`).getMonth() - new Date(`${b.day} 1, ${currentYear}`).getMonth();

                        return monthOrder; // Change this to `-monthOrder` for December to January

                    });



                    resolve(monthStatus);

                })

                .catch(reject);

        });

    },

    async getQutargrafGraf(user_id) {

        return new Promise((resolve, reject) => {

            const currentYear = new Date().getFullYear();

            const quarterStatus = [];

            const queryPromises = [];



            // Define quarterly ranges

            const quarters = [

                { startMonth: 0, endMonth: 3, name: "Quarters 1" },

                { startMonth: 3, endMonth: 6, name: "Quarters 2" },

                { startMonth: 6, endMonth: 9, name: "Quarters 3" },

                { startMonth: 9, endMonth: 12, name: "Quarters 4" },

            ];



            for (const quarter of quarters) {

                const startDate = new Date(currentYear, quarter.startMonth, 1);

                const endDate = new Date(currentYear, quarter.endMonth, 1);



                const queryPromise = new Promise((resolveQuery, rejectQuery) => {

                    const query = `

          SELECT SUM(frequency) AS frequency_count 

          FROM feeling_master 

          WHERE delete_flag = 0 

            AND user_id = ? 

            AND DATE(updatetime) >= ? 

            AND DATE(updatetime) < ?`;



                    connection.query(

                        query,

                        [user_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],

                        (err, results) => {

                            if (err) {

                                console.error('Error fetching quarterly data:', err.message);

                                return rejectQuery(err);

                            }

                            const frequencyCount = results[0].frequency_count || 0;

                            quarterStatus.push({

                                day: quarter.name,

                                frequency_count: frequencyCount,

                                frequency: (frequencyCount == null || frequencyCount <= 30) ? "Low" :

                                    (frequencyCount > 30 && frequencyCount <= 70) ? "Medium" : "High",

                            });

                            resolveQuery();

                        }

                    );

                });



                queryPromises.push(queryPromise);

            }



            Promise.all(queryPromises)

                .then(() => {

                    // Resolve the final quarterly data

                    resolve(quarterStatus);

                })

                .catch(reject);

        });

    }



};



