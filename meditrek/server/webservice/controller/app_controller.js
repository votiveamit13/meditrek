const commonModel = require("./common_modules");

const connection = require('../connection');

const languageMessage = require('../shared functions/languageMessage');

const { getUserDetails } = require("../shared functions/functions");

const { DateTime } = require("luxon");

const moment = require('moment-timezone');
const { request, response } = require("express");

// Get current time in the desired timezone (e.g., Paris)
const parisTime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris');

// Format it as 'YYYY-MM-DD HH:mm:ss'
const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');
const createtime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris').format("YYYY-MM-DD HH:mm:ss");






//Send Contact Us

const sendContactUs = async (request, response) => {

    const { user_id, f_name, email, message } = request.body;



    if (!user_id) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param, key: "user id" });

    }

    if (!f_name) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param, key: "f_name" });

    }

    if (!email) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param, key: "email" });

    }

    if (!message) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param, key: "message" });

    }



    try {

        const query1 =

            "SELECT user_id, active_flag, email, mobile,delete_flag FROM user_master WHERE  user_id = ?";



        const values1 = [user_id];



        connection.query(query1, values1, async (err, result) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message,

                });

            }

            if (result.length === 0) {

                return response

                    .status(200)

                    .json({ success: false, msg: languageMessage.userNotFound });

            }

            if (result[0].active_flag === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.accountdeactivated,

                    active_flag: result[0].active_flag,

                });

            }

            if (result[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

            }

            // if (!(result[0].email == email)) {

            //     return response

            //         .status(200)

            //         .json({ success: false, msg: languageMessage.wrongEmail });

            // }



            const newUserQuery = `

              INSERT INTO contact_us_master (user_id, name, email, message, createtime)

              VALUES (?, ?, ?, ?, ?)

          `;



            const values = [user_id, f_name, email, message, formattedDate];



            connection.query(newUserQuery, values, async (err, result) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message,

                    });

                }



                const userDetails = await getUserDetails(user_id);

                return response.status(200).json({

                    success: true, msg: languageMessage.sendContactUs, userDataArray: userDetails,

                });



            });

        });

    } catch (err) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.internalServerError,

            key: err.message,

        });

    }

};

//end





//Pause the Medication

const pauseMedication = async (request, response) => {

    const { user_id, medication_id, status } = request.body;



    if (!user_id) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }

    if (!medication_id) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }

    if (!status) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }


    const query1 = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const values1 = [user_id];



    connection.query(query1, values1, async (err, result) => {



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





        const query2 = "UPDATE medication_master SET pause_status = ? WHERE medication_id = ? AND delete_flag = 0";

        const values2 = [status, medication_id];



        connection.query(query2, values2, async (err, result) => {



            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }



            return response.status(200).json({ success: true, msg: languageMessage.medicationPaused });

        });

    });

}



const MedicationMarkASTaken = async (request, response) => {
    const { user_id, time_slots_id } = request.body;

    if (!user_id || !time_slots_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });
    }

    const query1 = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";
    const values1 = [user_id];

    connection.query(query1, values1, async (err, result) => {
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

         // 1. Get medication_id from time_slots_id
        const getMedicationQuery = "SELECT t.medication_id,m.medicine_id,t.time FROM time_slots_master t JOIN medication_master m ON m.medication_id = t.medication_id WHERE t.time_slots_id = ? AND t.delete_flag = 0";
        connection.query(getMedicationQuery, [time_slots_id], (err, medResult) => {
            if (err || medResult.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err?.message || "Medication not found" });
            }


            const medication_id = medResult[0].medication_id;
            const medicine_id = medResult[0].medicine_id;
            const time = medResult[0].time; // e.g., "02:31:00"
            const timeZone = 'Asia/Kolkata';

            // Get today's date
            const todayDate = moment.tz(timeZone).format('YYYY-MM-DD');

            // Get current time in HH:mm:ss format in IST
            const currentTime = new Date().toLocaleTimeString('en-GB', {
                timeZone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Construct full datetime strings
            const nowFullDateStr = `${todayDate}T${currentTime}`;
            const fullDateTimeStr = `${todayDate}T${time}`;
            
            // Convert both strings to moment objects in the correct time zone
            const nowMoment = moment.tz(nowFullDateStr, timeZone);
            const targetMoment = moment.tz(fullDateTimeStr, timeZone);

            // Get difference in minutes
            const diffInMinutes = nowMoment.diff(targetMoment, 'minutes');

            let status = 0;


            if (diffInMinutes > 15) {
                status = 1;
            }

            const averagesql = "INSERT INTO medicine_average_master (status, medicine_id, user_id, time_slots_id, taken_datetime, createtime,updatetime) VALUES(?, ?, ?, ?, ?, now(),now())";
            connection.query(averagesql, [status, medicine_id, user_id, time_slots_id, formattedDate], async (err) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
                }
                // 2. Update taken_status in time_slots_master
                const updateSlotQuery = "UPDATE time_slots_master SET taken_status = 1,updatetime = ? WHERE time_slots_id = ? AND delete_flag = 0";
                connection.query(updateSlotQuery, [formattedDate, time_slots_id], (err, updateResult) => {
                    if (err) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
                    }

                    // 3. Decrease remaining_quantity by 1 in medication_master
                    const updateMedicationQuery = "UPDATE medication_master SET remaining_quantity = remaining_quantity - dosage WHERE medication_id = ? AND delete_flag = 0 AND remaining_quantity > 0";
                    connection.query(updateMedicationQuery, [medication_id], (err, medUpdateResult) => {
                        if (err) {
                            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
                        }

                        return response.status(200).json({ success: true, msg: languageMessage.medicationTaken });
                    });
                });
            })
        });
    });
};


//end





//Create a Medicine

const insertMedicine = async (request, response) => {

    const { user_id, medicine_name, description } = request.body;



    // Check required parameters

    if (!user_id || !medicine_name) {

        return response.status(200).json({

            success: false,
            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Insert medicine into medicine_master

        const insertQuery = `

            INSERT INTO medicine_master (

                medicine_name,
                user_id,
                added_by,
                description,

                createtime,

                delete_flag

            ) VALUES (?, ?,?,?, ?, 0)

        `;

        const insertValues = [medicine_name, user_id, 1, description, formattedDate];



        connection.query(insertQuery, insertValues, async (err, insertResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.medicineCreated,

                insertId: insertResult.insertId

            });

        });

    });

};

//end





//Add Medication

const AddMedicationn = async (request, response) => {

    const {

        user_id,

        medicine_id,

        dosage,

        type,

        schedule,

        weekday,

        schedule_date,

        current_quantity,

        number_of_times,

        remainder_time,

        remainder_quantity,

        instruction,
        toggle_status, medicine_type_name

    } = request.body;



    // Check required parameters

    if (!user_id || !medicine_id || !dosage || !type || !schedule || !remainder_time) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param,

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ?";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Insert medication data into medication_master

        const insertQuery = `

            INSERT INTO medication_master (

                user_id,

                medicine_id,

                dosage,

                type,

                schedule,

                weekday,

                schedule_date,

                current_quantity,

                remaining_quantity,

                number_of_times,

                remainder_quantity,

                instruction,

                createtime,

                delete_flag,

                pause_status, 
                toggle_status,medicine_type_name

            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0,?,?)

        `;



        const insertValues = [

            user_id,

            medicine_id,

            dosage,

            type,

            schedule,

            weekday || 0,

            schedule_date || null,

            current_quantity || 0,

            current_quantity || 0,

            number_of_times || 0,

            remainder_quantity,

            instruction || "", formattedDate,

            toggle_status, medicine_type_name

        ];



        connection.query(insertQuery, insertValues, async (err, insertResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }

            const medicationId = insertResult.insertId;



            // if (remainder_time && typeof remainder_time === 'string') {
            //     const timeSlots = remainder_time.split(',').map(slot => slot.trim()).filter(slot => slot);

            //     // const parseToUTC = (timeStr) => {
            //     //     const dt = DateTime.fromFormat(timeStr.trim(), "hh:mm a");

            //     //     if (!dt.isValid) {
            //     //         console.error("Invalid time string:", timeStr);
            //     //         return null; // or a fallback
            //     //     }

            //     //     return dt.toUTC().toFormat("HH:mm:ss");
            //     // };

            //     // const timeSlots = remainder_time
            //     //     .split(',')
            //     //     .map(slot => slot.trim())
            //     //     .map(slot => parseToUTC(slot))
            //     //     .filter(Boolean); // remove nulls


            //     if (timeSlots.length > 0) {
            //         const timeSlotValues = timeSlots.map(slot => [medicationId, slot]);

            //         const timeSlotQuery = `
            //             INSERT INTO time_slots_master (medication_id, time)
            //             VALUES ?
            //         `;

            //         connection.query(timeSlotQuery, [timeSlotValues], (err, timeSlotResult) => {
            //             if (err) {
            //                 return response.status(200).json({
            //                     success: false,
            //                     msg: languageMessage.internalServerError,
            //                     key: err.message
            //                 });
            //             }

            //             return response.status(200).json({
            //                 success: true,
            //                 msg: languageMessage.medicationCreated,
            //                 insertId: medicationId
            //             });
            //         });
            //     } else {
            //         return response.status(200).json({
            //             success: true,
            //             msg: languageMessage.medicationCreated,
            //             insertId: medicationId
            //         });
            //     }
            // } 
            // else {
            //     return response.status(200).json({
            //         success: true,
            //         msg: languageMessage.medicationCreated,
            //         insertId: medicationId
            //     });
            // }






            if (remainder_time && typeof remainder_time === 'string') {
                const parseTo24Hour = (timeStr) => {
                    const dt = DateTime.fromFormat(timeStr.trim(), "hh:mm a");
                    if (!dt.isValid) {
                        console.error("Invalid time string:", timeStr);
                        return null;
                    }
                    return dt.toFormat("HH:mm");
                };
            
                const timeSlots = remainder_time
                    .split(',')
                    .map(slot => parseTo24Hour(slot))
                    .filter(Boolean); // Remove nulls if parsing fails
            
                if (timeSlots.length > 0) {
                    const timeSlotValues = timeSlots.map(slot => [medicationId, slot]);
            
                    const timeSlotQuery = `
                        INSERT INTO time_slots_master (medication_id, time)
                        VALUES ?
                    `;
            
                    connection.query(timeSlotQuery, [timeSlotValues], (err, timeSlotResult) => {
                        if (err) {
                            return response.status(200).json({
                                success: false,
                                msg: languageMessage.internalServerError,
                                key: err.message
                            });
                        }
            
                        return response.status(200).json({
                            success: true,
                            msg: languageMessage.medicationCreated,
                            insertId: medicationId
                        });
                    });
                } else {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.medicationCreated,
                        insertId: medicationId
                    });
                }
            }
            
        });

    });

};







//Edit Medication

// const editMedication = async (request, response) => {

//     const {

//         medication_id,

//         user_id,

//         medicine_id,

//         dosage,

//         type,

//         schedule,

//         weekday,

//         schedule_date,

//         current_quantity,

//         remainder_time,

//         remainder_quantity,

//         instruction

//     } = request.body;



//     // Validate required params

//     if (!medication_id || !user_id || !medicine_id || !dosage || !type || !schedule) {

//         return response.status(200).json({

//             success: false,

//             msg: languageMessage.msg_empty_param,

//         });

//     }



//     // Validate user

//     const userQuery = "SELECT mobile, active_flag, otp_verify FROM user_master WHERE user_id = ? AND delete_flag = 0";

//     const userValues = [user_id];



//     connection.query(userQuery, userValues, async (err, result) => {

//         if (err) {

//             return response.status(200).json({

//                 success: false,

//                 msg: languageMessage.internalServerError,

//                 key: err.message

//             });

//         }



//         if (result.length === 0) {

//             return response.status(200).json({

//                 success: false,

//                 msg: languageMessage.userNotFound

//             });

//         }



//         if (result[0]?.active_flag === 0) {

//             return response.status(200).json({

//                 success: false,

//                 msg: languageMessage.userDeleted,

//                 active_flag: 0

//             });

//         }



//         const medQuery = `SELECT 

//         medication_id, user_id, medicine_id, type, schedule, weekday, schedule_date, 

//         current_quantity, remainder_time, remainder_quantity, instruction 

//         FROM medication_master 

//         WHERE user_id = ? AND medication_id = ? AND delete_flag = 0`;

//         const medValues = [user_id, medication_id];



//         connection.query(medQuery, medValues, async (err, result) => {

//             if (err) {

//                 return response.status(200).json({

//                     success: false,

//                     msg: languageMessage.internalServerError,

//                     key: err.message

//                 });

//             }

//             const prevResult = result[0];



//             // Update medication record

//             const updateQuery = `

//             UPDATE medication_master SET

//                 medicine_id = ?,

//                 dosage = ?,

//                 type = ?,

//                 schedule = ?,

//                 weekday = ?,

//                 schedule_date = ?,

//                 current_quantity = ?,

//                 remaining_quantity = ?,

//                 remainder_time = ?,

//                 remainder_quantity = ?,

//                 instruction = ?,

//                 updatetime = NOW()

//             WHERE medication_id = ? AND user_id = ? AND delete_flag = 0

//         `;



//             const updateValues = [

//                 medicine_id,

//                 dosage,

//                 type,

//                 schedule,

//                 weekday || prevResult.weekday,

//                 schedule_date || prevResult.schedule_date,

//                 current_quantity || prevResult.current_quantity,

//                 current_quantity || prevResult.current_quantity,

//                 remainder_time || prevResult.remainder_time,

//                 remainder_quantity || prevResult.remainder_quantity,

//                 instruction || prevResult.instruction,

//                 medication_id,

//                 user_id

//             ];



//             connection.query(updateQuery, updateValues, async (err, updateResult) => {

//                 if (err) {

//                     return response.status(200).json({

//                         success: false,

//                         msg: languageMessage.internalServerError,

//                         key: err.message

//                     });

//                 }



//                 if (updateResult.affectedRows === 0) {

//                     return response.status(200).json({

//                         success: false,

//                         msg: languageMessage.dataNotFound

//                     });

//                 }



//                 return response.status(200).json({

//                     success: true,

//                     msg: languageMessage.medicationUpdated,

//                     affectedRows: updateResult.affectedRows

//                 });

//             });

//         });

//     });

// };

const editNewMedication = async (request, response) => {

    const {

        user_id,

        medication_id,

        medicine_id,

        dosage,

        type,

        schedule,

        weekday,

        schedule_date,

        remaining_quantity,

        number_of_times,

        remainder_time,

        remainder_quantity,

        instruction,
        toggle_status, medicine_type_name

    } = request.body;



    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }


        const checksql = "SELECT medication_id  ,user_id ,medicine_id FROM medication_master WHERE user_id = ? AND medication_id = ? AND delete_flag = 0";
        connection.query(checksql, [user_id, medication_id], async (err, check) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }
            if (check.length <= 0) {
                return response.status(200).json({ success: false, msg: languageMessage.dataNotFound, key: "medication" })
            }

            const insertQuery = `

            UPDATE medication_master SET 

                medicine_id = ? ,

                dosage = ? ,

                type = ?,

                schedule = ? ,

                weekday = ?,

                schedule_date = ?,

                remaining_quantity = ?,

                number_of_times = ?,

                remainder_quantity = ?,

                instruction = ?,
                
                updatetime = ?,

                refill_status = 0,

                toggle_status = ?,

                medicine_type_name = ?

            WHERE medication_id = ? AND delete_flag = 0 `;
            const insertValues = [


                medicine_id,

                dosage,

                type,

                schedule,

                weekday || 0,

                schedule_date || null,

                remaining_quantity || 0,

                number_of_times || 0,

                remainder_quantity || 0,

                instruction || "", formattedDate,

                toggle_status,
                medicine_type_name,

                medication_id

            ];



            connection.query(insertQuery, insertValues, async (err, insertResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }

                const medicationId = medication_id;



                if (remainder_time && typeof remainder_time === 'string') {
                    const timeSlots = remainder_time.split(',').map(slot => slot.trim()).filter(slot => slot);

                    // const parseToUTC = (timeStr) => {
                    //     const dt = DateTime.fromFormat(timeStr.trim(), "hh:mm a");

                    //     if (!dt.isValid) {
                    //         console.error("Invalid time string:", timeStr);
                    //         return null; // or a fallback
                    //     }

                    //     return dt.toUTC().toFormat("HH:mm:ss");
                    // };

                    // const timeSlots = remainder_time
                    //     .split(',')
                    //     .map(slot => slot.trim())
                    //     .map(slot => parseToUTC(slot))
                    //     .filter(Boolean); // remove nulls


                    if (timeSlots.length > 0) {
                        const timeSlotValues = timeSlots.map(slot => [medicationId, slot]);

                        const timeSlotQuery = `
                        INSERT INTO time_slots_master (medication_id, time)
                        VALUES ?
                    `;

                        const updatesql = "UPDATE time_slots_master SET delete_flag = 1 ,updatetime = ? WHERE medication_id = ? ";
                        connection.query(updatesql, [formattedDate, medication_id], async (err) => {
                            if (err) {
                                return response.status(200).json({
                                    success: false,
                                    msg: languageMessage.internalServerError,
                                    key: err.message
                                });
                            }
                        })

                        connection.query(timeSlotQuery, [timeSlotValues], (err, timeSlotResult) => {
                            if (err) {
                                return response.status(200).json({
                                    success: false,
                                    msg: languageMessage.internalServerError,
                                    key: err.message
                                });
                            }

                            return response.status(200).json({
                                success: true,
                                msg: languageMessage.medicationUpdated,
                            });
                        });
                    } else {
                        return response.status(200).json({
                            success: true,
                            msg: languageMessage.medicationUpdated,
                        });
                    }
                } else {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.medicationUpdated,
                    });
                }


            });

        })



        // Insert medication data into medication_master


    });

};

//end





//Delete Medication

const DeleteMedication = async (request, response) => {

    const { user_id, medication_id } = request.body;



    // Validate required parameters

    if (!user_id || !medication_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param,

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message,

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound,

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0,

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Perform soft delete on medication record
        const deleteQuery = `

            UPDATE medication_master

            SET delete_flag = 1, updatetime = ?

            WHERE medication_id = ? AND user_id = ? AND delete_flag = 0

        `;

        const deleteValues = [formattedDate, medication_id, user_id];



        connection.query(deleteQuery, deleteValues, async (err, deleteResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message,

                });

            }



            if (deleteResult.affectedRows === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.dataNotFound,

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.MedicationDeleted,

            });

        });

    });

};

//end





//Add Document

const addMedicalReport = async (request, response) => {

    const { user_id, report_category_id, document_size } = request.body;



    // Check required parameters  

    if (!user_id || !report_category_id || !document_size) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    const file = request.file ? request.file.filename : null;



    if (file == null) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Insert medicine into medicine_master

        const insertQuery = `

            INSERT INTO medical_report_master (
              user_id,
              report_category_id,
              file,
              file_size
            ) VALUES (?, ?, ?, ?)

        `;

        const insertValues = [
          user_id,
          report_category_id,
          file,
          document_size
        ];




        connection.query(insertQuery, insertValues, async (err, insertResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.reportAdded,

                insertId: insertResult.insertId

            });

        });

    });

};

//end





//Delete Report

const deleteMedicalReport = async (request, response) => {                                          

    const { user_id, medical_report_id } = request.body;

    if (!user_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Check if report_id is provided

    if (!medical_report_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Check if report exists and not already deleted

        const checkQuery = `

      SELECT medical_report_id, file FROM medical_report_master

      WHERE medical_report_id = ? AND delete_flag = 0

    `;



        connection.query(checkQuery, [medical_report_id], (err, result) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            if (result.length === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.reportNotFound

                });

            }



            // Soft delete: set delete_flag = 1

            const deleteQuery = `

        UPDATE medical_report_master

        SET delete_flag = 1

        WHERE medical_report_id = ?

      `;



            connection.query(deleteQuery, [medical_report_id], (err, deleteResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({

                    success: true,

                    msg: languageMessage.reportDeleted

                });

            });

        });

    });

};

//end





//Get Laboratory Graph Data

const getLaboratoryReportCounts = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }



        if (result[0]?.active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userDeleted,

                active_flag: 0

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }





        try {

            const currentYear = new Date().getFullYear();



            const query = `

            SELECT 

                MONTH(createtime) AS month, 

                COUNT(*) AS report_count 

            FROM medical_report_master 

            WHERE YEAR(createtime) = ? 

            GROUP BY MONTH(createtime)

            ORDER BY MONTH(createtime)

        `;



            connection.query(query, [currentYear], (err, results) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        error: err.message

                    });

                }



                // Create a map of month number to count

                const reportData = Array(12).fill(0); // Initialize months 1–12 with 0 count

                results.forEach(row => {

                    reportData[row.month - 1] = row.report_count;

                });



                return response.status(200).json({

                    success: true,

                    msg: languageMessage.reportGraphSuccess,

                    data: reportData // index 0 = January, 11 = December

                });

            });



        } catch (error) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                error: error.message

            });

        }

    });

};

//end





//Add BP Data

const addBPData = async (request, response) => {

    const { user_id, systolic_bp, diastolic_bp, pulse } = request.body;



    if (!user_id || !systolic_bp || !diastolic_bp ) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }

        const insertQuery = `INSERT INTO measurement_master (user_id, type, systolic_bp, diastolic_bp, pulse) VALUES (?, 0, ?, ?, ?)`;

        connection.query(insertQuery, [user_id, systolic_bp, diastolic_bp, pulse ? pulse : 0], (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            return response.status(200).json({ success: true, msg: languageMessage.BPAdded });

        });

    });

};

//end





//Add Fasting Glucose

const addFastingGlucose = async (request, response) => {

    const { user_id, fasting_glucose } = request.body;



    if (!user_id || !fasting_glucose) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const insertQuery = `INSERT INTO measurement_master (user_id, type, fasting_glucose) VALUES (?, 1, ?)`;

        connection.query(insertQuery, [user_id, fasting_glucose], (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            return response.status(200).json({ success: true, msg: languageMessage.FastingGlucoseAdd });

        });

    });

};

//end





//Add PPBGS

const addPPBGS = async (request, response) => {

    const { user_id, ppbgs } = request.body;



    if (!user_id || !ppbgs) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const insertQuery = `INSERT INTO measurement_master (user_id, type, ppbgs) VALUES (?, 2, ?)`;

        connection.query(insertQuery, [user_id, ppbgs], (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            return response.status(200).json({ success: true, msg: languageMessage.PPBGSAdded });

        });
    });

};

//end





//Add Weight Measurement

const addWeightMeasurement = async (request, response) => {

    const { user_id, weight } = request.body;



    if (!user_id || !weight) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });
        }

        const insertQuery = `INSERT INTO measurement_master (user_id, type, weight) VALUES (?, 3, ?)`;

        connection.query(insertQuery, [user_id, weight], async (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            
            const userDataArray = await  getUserDetails(user_id);
            
            return response.status(200).json({ success: true, msg: languageMessage.WeightAdded, userDataArray : userDataArray });
        });
    });
};

//end





//Add Temprature

const addTemperature = async (request, response) => {

    const { user_id, temperature } = request.body;



    if (!user_id || !temperature) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const insertQuery = `INSERT INTO measurement_master (user_id, type, temperature) VALUES (?, 4, ?)`;

        connection.query(insertQuery, [user_id, temperature], (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            return response.status(200).json({ success: true, msg: languageMessage.TempAdded });

        });

    });

};

//end





//Add Customer Measurement

const addCustomMeasure = async (request, response) => {

    const { user_id, symptom, symptom_range } = request.body;



    if (!user_id || !symptom || !symptom_range) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }
        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const insertQuery = `INSERT INTO measurement_master (user_id, type, symptom, symptom_range) VALUES (?, 5, ?, ?)`;

        connection.query(insertQuery, [user_id, symptom, symptom_range], (err) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });

            return response.status(200).json({ success: true, msg: languageMessage.dataInserted });

        });

    });

};

//end





//Edit Custom Measurement

const editCustomMeasure = async (request, response) => {

    const { user_id, measurement_id, symptom, symptom_range } = request.body;



    if (!user_id || !measurement_id || !symptom || !symptom_range) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }
        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const updateQuery = `

            UPDATE measurement_master 

            SET symptom = ?, symptom_range = ? 

            WHERE measurement_id = ? AND user_id = ? AND type = 5 AND delete_flag = 0

        `;

        const values = [symptom, symptom_range, measurement_id, user_id];



        connection.query(updateQuery, values, (err, updateResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    error: err.message

                });

            }



            if (updateResult.affectedRows === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.dataNotFound

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.dataUpdated

            });

        });

    });

};

//end





//Delete Custom Measurement

const deleteCustomMeasure = async (request, response) => {

    const { user_id, measurement_id } = request.body;



    if (!user_id || !measurement_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const updateQuery = `

            UPDATE measurement_master 

            SET delete_flag = 1

            WHERE measurement_id = ? AND user_id = ? AND type = 5 AND delete_flag = 0

        `;

        const values = [measurement_id, user_id];



        connection.query(updateQuery, values, (err, updateResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    error: err.message

                });

            }



            if (updateResult.affectedRows === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.dataNotFound

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.dataDeleted

            });

        });

    });

};

//end





//Get Adverse Reaction

const addAdverseReaction = async (request, response) => {

    const { user_id, medicine_id, symptom_id, type, dosage, medication_start_date, reaction_date, details } = request.body;



    if (!user_id || !medicine_id || !symptom_id || !type || !dosage || !medication_start_date || !reaction_date || !details) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const insertQuery = `

            INSERT INTO adverse_reaction_master 

            (user_id, medicine_id, symptom_id, type, dosage, medication_start_date, reaction_date, details)

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

        `;



        const insertValues = [

            user_id,

            medicine_id,

            symptom_id,

            type,

            dosage,

            medication_start_date,

            reaction_date,

            details

        ];



        connection.query(insertQuery, insertValues, (err, insertResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.dataInserted

            });

        });

    });

};
// const addAdverseReaction = async (request, response) => {
//     const { 
//         user_id, 
//         medicine_id, 
//         symptom_id, 
//         type, 
//         dosage, 
//         medication_start_date, 
//         reaction_date, 
//         details 
//     } = request.body;

//     if (!user_id || !medicine_id || !symptom_id || !type || !dosage || !medication_start_date || !reaction_date || !details) {
//         return response.status(200).json({
//             success: false,
//             msg: languageMessage.msg_empty_param
//         });
//     }

//     // Validate user
//     const userQuery = "SELECT active_flag, delete_flag FROM user_master WHERE user_id = ? ";
//     connection.query(userQuery, [user_id], (err, result) => {
//         if (err) {
//             return response.status(200).json({
//                 success: false,
//                 msg: languageMessage.internalServerError,
//                 key: err.message
//             });
//         }

//         if (result.length === 0 || result[0].active_flag === 0) {
//             return response.status(200).json({
//                 success: false,
//                 msg: languageMessage.userNotFound
//             });
//         }

//         if (result[0]?.delete_flag == 1) {
//             return response.status(200).json({ 
//                 success: false, 
//                 msg: languageMessage.msgUserDeleted, 
//                 active_flag: 0 
//             });
//         }

//         // Insert without createtime → DB will automatically store current timestamp
//         const insertQuery = `
//             INSERT INTO adverse_reaction_master 
//             (user_id, medicine_id, symptom_id, type, dosage, medication_start_date, reaction_date, details)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const insertValues = [
//             user_id,
//             medicine_id,
//             symptom_id,
//             type,
//             dosage,
//             medication_start_date,
//             reaction_date,
//             details
//         ];

//         connection.query(insertQuery, insertValues, (err, insertResult) => {
//             if (err) {
//                 return response.status(200).json({
//                     success: false,
//                     msg: languageMessage.internalServerError,
//                     key: err.message
//                 });
//             }

//             return response.status(200).json({
//                 success: true,
//                 msg: languageMessage.dataInserted
//             });
//         });
//     });
// };

//end





//Edit ADverse Reaction

const editAdverseReaction = async (request, response) => {

    const { adverse_reaction_id, user_id, medicine_id, symptom_id, type, dosage, medication_start_date, reaction_date, details } = request.body;



    if (!adverse_reaction_id || !user_id || !medicine_id || !symptom_id || !type || !dosage || !medication_start_date || !reaction_date || !details) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const updateQuery = `

            UPDATE adverse_reaction_master 

            SET medicine_id = ?, symptom_id = ?, type = ?, dosage = ?, medication_start_date = ?, 

                reaction_date = ?, details = ?, updatetime = ?

            WHERE adverse_reaction_id = ? AND user_id = ?

        `;



        const updateValues = [

            medicine_id,

            symptom_id,

            type,

            dosage,

            medication_start_date,

            reaction_date,

            details,
            formattedDate,

            adverse_reaction_id,

            user_id

        ];



        connection.query(updateQuery, updateValues, (err, updateResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            if (updateResult.affectedRows === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.dataNotFound

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.dataUpdated

            });

        });

    });

};

//end





//Delete Adverse Reaction

const deleteAdverseReaction = async (request, response) => {

    const { adverse_reaction_id, user_id } = request.body;



    if (!adverse_reaction_id || !user_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT active_flag,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];



    connection.query(userQuery, userValues, (err, result) => {

        if (err) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                key: err.message

            });

        }



        if (result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.userNotFound

            });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        // Perform soft delete

        const deleteQuery = `

            UPDATE adverse_reaction_master 

            SET delete_flag = 1

            WHERE adverse_reaction_id = ? AND user_id = ? AND delete_flag = 0

        `;

        const deleteValues = [adverse_reaction_id, user_id];



        connection.query(deleteQuery, deleteValues, (err, deleteResult) => {

            if (err) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.internalServerError,

                    key: err.message

                });

            }



            if (deleteResult.affectedRows === 0) {

                return response.status(200).json({

                    success: false,

                    msg: languageMessage.dataNotFound

                });

            }



            return response.status(200).json({

                success: true,

                msg: languageMessage.dataDeleted

            });

        });

    });

};

//end





//Add Doctors

const addDoctors = async (request, response) => {

    const { user_id, doctor_id } = request.body;



    if (!user_id || !doctor_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    // Validate user

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";

    const userValues = [user_id];
    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {
            return response.status(200).json({success: false,msg: languageMessage.internalServerError,key: err.message});
        }
        if (result.length === 0) return response.status(200).json({success: false,msg: languageMessage.userNotFound});

        if (result[0]?.active_flag === 0)  return response.status(200).json({ success: false, msg: languageMessage.userDeleted, active_flag: 0 });

        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });
        }

        try {
            const Query = `INSERT INTO patient_master (user_id, doctor_id, createtime)
                           VALUES (?, ?, ?)`;
            const Values = [user_id, doctor_id, createtime];
            connection.query(Query, Values, async (err, subResult) => {

                if (err) return response.status(200).json({success: false,msg: languageMessage.internalServerError,key: err.message});return response.status(200).json({ success: true, msg: languageMessage.dataInserted });



            });

        } catch (error) {
            return response.status(200).json({success: false,msg: languageMessage.internalServerError,error: error.message});
        }

    });

};
// End
const cronJobFunction = async (request, response) => {
    const updateQuery = `
            UPDATE medication_master 
            SET taken_status = 0
            WHERE delete_flag = 0
        `;
    connection.query(updateQuery, [], (err, updateResult) => {
        // if (err) {
        //     return response.status(200).json({
        //         success: false,
        //         msg: languageMessage.internalServerError,
        //         key: err.message
        //     });
        // }
         if (err) {
            if(response){
                return response.status(200).json({
                    success:false,
                    msg: err.message
                });
            } else {
                console.log(err.message);
            }
        }

        if (updateResult.affectedRows === 0) {
            // return response.status(200).json({
            //     success: false,
            //     msg: languageMessage.dataNotFound
            // });
            console.log(languageMessage.dataUpdated)
        }
        console.log(languageMessage.dataUpdated)
        // });
    });
};



//clear all notification
const clearAllNotifications = async (request, response) => {
    const { user_id } = request.body;

    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });
    }

    try {
        const query1 = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ? ";
        const values1 = [user_id];

        connection.query(query1, values1, async (err, result) => {
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

            const query = `
            UPDATE user_notification_message 
            SET delete_flag = 1, updatetime = ?
            WHERE other_user_id = ?
        `;
            const values = [formattedDate, user_id];
            connection.query(query, values, (err, result) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
                }
                if (result.affectedRows === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.dataNotFound });
                }
                return response.status(200).json({ success: true, msg: ["All notifications deleted successfully."] });
            });
        });

    } catch (err) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
    }
};
//end




//  clear single notifications 
const clearSingleNotifications = async (request, response) => {
    const { notification_message_id, user_id } = request.body;

    if (!notification_message_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });
    }
    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });
    }

    try {
        const query1 = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ? ";
        const values1 = [user_id];

        connection.query(query1, values1, async (err, result) => {
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

            const query = `
            UPDATE user_notification_message 
            SET delete_flag = 1, updatetime = ?
            WHERE notification_message_id = ? AND other_user_id = ?
        `;
            const values = [formattedDate, notification_message_id, user_id];

            connection.query(query, values, (err, result) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
                }

                if (result.affectedRows === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.dataNotFound });
                }

                return response.status(200).json({ success: true, msg: ["Notification deleted successfully"] });
            });
        });

    } catch (err) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
    }
};


// try {
//     const getsql = "SELECT time_slots_id, medication_id, time, taken_status, updatetime FROM time_slots_master WHERE updatetime < NOW() - INTERVAL 24 HOUR";

//     connection.query(getsql,async(err,data) => {
//         if (err) {
//                     return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
//                 }
//                 if(data.length <= 0){
//                     return response.status(200).json({success : true,msg : languageMessage.msgDataNotFound,data : "NA"});
//                 }else{
//                     let array = []
//                    data.map((item) => {
//                         array.push(item.time_slots_id)
//                     })

//                     const updatesql = "UPDATE time_slots_master SET taken_status = 0,updatetime = now() WHERE delete_flag = 0 AND time_slots_id IN (?)";
//                     connection.query(updatesql,[array],async(err) => {
//                         if (err) {
//                     return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
//                 }
//                 return response.status(200).json({success : true ,msg : ["Timeslots update successfully"],data,array})

//                     })
//                 }
//     })



// } catch (error) {
//       return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
// }

// };



const getBeforeTimeSlots = async (request, response) => {
    try {
    //     const getsql = `
    //   SELECT t.time_slots_id, t.medication_id, t.time, t.taken_status, t.updatetime ,m.medicine_id,m.user_id
    //   FROM time_slots_master t JOIN medication_master m ON m.medication_id = t.medication_id
    //   WHERE t.updatetime < ? - INTERVAL 24 HOUR
    // `;


    // updated query to reset status 0 as the next arrives
    const getsql = `
    SELECT t.time_slots_id, t.medication_id, t.time, t.taken_status, t.updatetime ,m.medicine_id,m.user_id
    FROM time_slots_master t JOIN medication_master m ON m.medication_id = t.medication_id
    WHERE t.updatetime <  CURDATE() 
  `;

        connection.query(getsql, [], async (err, data) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message,
                });
            }

            if (data.length === 0) {
                return response.status(200).json({
                    success: true,
                    msg: languageMessage.msgDataNotFound,
                    data: [],
                });
            }

            const timeSlotIds = data.map(item => item.time_slots_id);
            const result = data.filter(item => item.taken_status != 1);

            const averageSql = `
      INSERT INTO medicine_average_master (status, medicine_id, user_id, createtime, updatetime)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
            const insertData = Promise.all(result.map((item) => {
                return new Promise((resolve, reject) => {
                    const params = [2, item.medicine_id, item.user_id];
                    connection.query(averageSql, params, (error, results) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });
            }));

            const updatesql = `
        UPDATE time_slots_master 
        SET taken_status = 0, updatetime = ? 
        WHERE delete_flag = 0 AND time_slots_id IN (?)`;

            connection.query(updatesql, [formattedDate, timeSlotIds], async (updateErr) => {
                if (updateErr) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: updateErr.message,
                    });
                }

                return response.status(200).json({
                    success: true,
                    msg: ['Timeslots updated successfully'],
                    data,
                    updated_ids: timeSlotIds,
                });
            });
        });

    } catch (error) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            key: error.message,
        });
    }
};



// New updated apis
// add medication..
const AddMedication = async (request, response) => {
    const {
      user_id,
      medicine_id,
      dosage,
      type,
      schedule,
      weekday,           
      schedule_date,     
      current_quantity,
      number_of_times,
      remainder_time,
      remainder_quantity,
      instruction,
      toggle_status,
      medicine_type_name,
      timezone
    } = request.body;
  
    // Required param check
    if (!user_id || !medicine_id || !dosage || !type || schedule === undefined || !remainder_time) {
      return response.status(200).json({
        success: false,
        msg: languageMessage.msg_empty_param,
      });
    }


  
    // Validate user
    const userQuery = `SELECT mobile, active_flag, otp_verify, delete_flag FROM user_master WHERE user_id = ?`;
    connection.query(userQuery, [user_id], async (err, result) => {
      if (err) {
        return response.status(200).json({
          success: false,
          msg: languageMessage.internalServerError,
          key: err.message
        });
      }
  
      if (result.length === 0) {
        return response.status(200).json({
          success: false,
          msg: languageMessage.userNotFound
        });
      }
  
      if (result[0]?.active_flag === 0 || result[0]?.delete_flag == 1) {
        return response.status(200).json({
          success: false,
          msg: languageMessage.userDeleted,
          active_flag: 0
        });
      }
  
      let finalWeekday = null;
      let finalScheduleDate = null;
  
      if (schedule == 0) {
        // Daily → no need for multiple values
        finalWeekday = 0;
        finalScheduleDate = null;
  
      } else if (schedule == 1) {
     
        if (!weekday || weekday.trim() === "") {
          return response.status(200).json({
            success: false,
            msg: "Please provide weekday(s) as comma-separated values for weekly schedule"
          });
        }
        finalWeekday = weekday.trim(); // e.g. "1,3,5"
        finalScheduleDate = null;
  
      } else if (schedule == 2) {
     
        if (!schedule_date || schedule_date.trim() === "") {
          return response.status(200).json({
            success: false,
            msg: "Please provide date(s) in YYYY-MM-DD format as comma-separated values for monthly schedule"
          });
        }
        finalWeekday = 0;
        finalScheduleDate = schedule_date.trim(); 
      }
  
      
  
      // Insert medication
      const insertQuery = `
      INSERT INTO medication_master (
        user_id,
        medicine_id,
        dosage,
        type,
        schedule,
        weekday,
        schedule_date,
        current_quantity,
        remaining_quantity,
        number_of_times,
        remainder_quantity,
        instruction,
        toggle_status,
        medicine_type_name,
        timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  
      const insertValues = [
          user_id,
          medicine_id,
          dosage,
          type,
          schedule,
          finalWeekday,
          finalScheduleDate,
          current_quantity || 0,
          current_quantity || 0,
          number_of_times || 0,
          remainder_quantity,
          instruction || "",
          toggle_status,
          medicine_type_name,
          timezone
        ];

  
      connection.query(insertQuery, insertValues, async (err, insertResult) => {
        if (err) {
          return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            key: err.message
          });
        }
  
        const medicationId = insertResult.insertId;
  
        // Handle remainder_time slots
        // if (remainder_time && typeof remainder_time === 'string') {
        //   const timeSlots = remainder_time.split(',').map(slot => slot.trim()).filter(slot => slot);
  
        //   if (timeSlots.length > 0) {
        //     const timeSlotValues = timeSlots.map(slot => [medicationId, slot]);
  
        //     const timeSlotQuery = `INSERT INTO time_slots_master (medication_id, time) VALUES ?`;
        //     connection.query(timeSlotQuery, [timeSlotValues], (err, timeSlotResult) => {
        //       if (err) {
        //         return response.status(200).json({
        //           success: false,
        //           msg: languageMessage.internalServerError,
        //           key: err.message
        //         });
        //       }
  
        //       return response.status(200).json({
        //         success: true,
        //         msg: languageMessage.medicationCreated,
        //         insertId: medicationId
        //       });
        //     });
        //   } else {
        //     return response.status(200).json({
        //       success: true,
        //       msg: languageMessage.medicationCreated,
        //       insertId: medicationId
        //     });
        //   }
        // } else {
        //   return response.status(200).json({
        //     success: true,
        //     msg: languageMessage.medicationCreated,
        //     insertId: medicationId
        //   });
        // }
        if (remainder_time && typeof remainder_time === 'string') {
            const { DateTime } = require('luxon');
        
            const parseTo24Hour = (timeStr) => {
                const dt = DateTime.fromFormat(timeStr.trim(), "hh:mm a");
                if (!dt.isValid) {
                    console.error("Invalid time string:", timeStr);
                    return null;
                }
                return dt.toFormat("HH:mm");
            };
        
            const timeSlots = remainder_time
                .split(',')
                .map(slot => parseTo24Hour(slot))
                .filter(Boolean); // remove nulls if parsing failed
        
            if (timeSlots.length > 0) {
                const timeSlotValues = timeSlots.map(slot => [medicationId, slot]);
        
                const timeSlotQuery = `INSERT INTO time_slots_master (medication_id, time) VALUES ?`;
                connection.query(timeSlotQuery, [timeSlotValues], (err, timeSlotResult) => {
                    if (err) {
                        return response.status(200).json({
                            success: false,
                            msg: languageMessage.internalServerError,
                            key: err.message
                        });
                    }
        
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.medicationCreated,
                        insertId: medicationId
                    });
                });
            } else {
                return response.status(200).json({
                    success: true,
                    msg: languageMessage.medicationCreated,
                    insertId: medicationId
                });
            }
        } else {
            return response.status(200).json({
                success: true,
                msg: languageMessage.medicationCreated,
                insertId: medicationId
            });
        }
        
      });
    });
  };
//end   


// edit new medication 
const editMedication = async (request, response) => {
    const {
      user_id,
      medication_id,
      medicine_id,
      dosage,
      type,
      schedule,
      weekday,          // comma-separated like "1,3,5"
      schedule_date,    // comma-separated like "2025-07-28,2025-07-30"
      remaining_quantity,
      number_of_times,
      remainder_time,
      remainder_quantity,
      instruction,
      toggle_status,
      medicine_type_name
    } = request.body;
  
    //   Validate required params
    if (!user_id || !medication_id || !medicine_id || !dosage || !type || schedule === undefined) {
      return response.status(200).json({
        success: false,
        msg: languageMessage.msg_empty_param
      });
    }
  
    //   Validate user
    const userQuery = "SELECT mobile, active_flag, otp_verify, delete_flag FROM user_master WHERE user_id = ?";
    connection.query(userQuery, [user_id], async (err, result) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
      }
  
      if (result.length === 0) {
        return response.status(200).json({ success: false, msg: languageMessage.userNotFound });
      }
  
      if (result[0]?.active_flag === 0 || result[0]?.delete_flag == 1) {
        return response.status(200).json({
          success: false,
          msg: languageMessage.accountdeactivated,
          active_flag: 0
        });
      }

      const checkSql = "SELECT medication_id FROM medication_master WHERE user_id = ? AND medication_id = ? AND delete_flag = 0";
      connection.query(checkSql, [user_id, medication_id], async (err, check) => {
        if (err) {
          return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
        }
        if (check.length === 0) {
          return response.status(200).json({ success: false, msg: languageMessage.dataNotFound, key: "medication" });
        }
  
        //   Prepare weekday/schedule_date based on schedule type
        let finalWeekday = null;
        let finalScheduleDate = null;
  
        if (schedule == 0) {
          finalWeekday = 0;
          finalScheduleDate = null;
  
        } else if (schedule == 1) {
          // Weekly → directly store the comma-separated weekdays (e.g. "1,3,5")
          if (!weekday || weekday.trim() === "") {
            return response.status(200).json({
              success: false,
              msg: "Please provide weekday(s) as comma-separated values for weekly schedule"
            });
          }
          finalWeekday = weekday.trim();
          finalScheduleDate = null;
  
        } else if (schedule == 2) {
          // Monthly → directly store the comma-separated dates (e.g. "2025-07-28,2025-07-30")
          if (!schedule_date || schedule_date.trim() === "") {
            return response.status(200).json({
              success: false,
              msg: languageMessage.msg_empty_param, key:'schedule_date'
            });
          }
          finalWeekday = 0;
          finalScheduleDate = schedule_date.trim();
        }
  
     
  
        //   Update medication
        const updateQuery = `
          UPDATE medication_master SET 
            medicine_id = ?,
            dosage = ?,
            type = ?,
            schedule = ?,
            weekday = ?,
            schedule_date = ?,
            remaining_quantity = ?,
            number_of_times = ?,
            remainder_quantity = ?,
            instruction = ?,
            updatetime = ?,
            refill_status = 0,
            toggle_status = ?,
            medicine_type_name = ?
          WHERE medication_id = ? AND delete_flag = 0
        `;
  
        const updateValues = [
          medicine_id,
          dosage,
          type,
          schedule,
          finalWeekday,
          finalScheduleDate,
          remaining_quantity || 0,
          number_of_times || 0,
          remainder_quantity || 0,
          instruction || "",
          formattedDate,
          toggle_status,
          medicine_type_name,
          medication_id
        ];
  
        connection.query(updateQuery, updateValues, async (err) => {
          if (err) {
            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
          }
  
          //   Handle time slots (delete old + insert new)
        //   if (remainder_time && typeof remainder_time === 'string') {
        //     const timeSlots = remainder_time.split(',').map(slot => slot.trim()).filter(Boolean);
  
        //     if (timeSlots.length > 0) {
        //       const timeSlotValues = timeSlots.map(slot => [medication_id, slot]);
  
        //       // Mark old time slots as deleted
        //       const updateTimeSlotSql = "UPDATE time_slots_master SET delete_flag = 1, updatetime = ? WHERE medication_id = ?";
        //       connection.query(updateTimeSlotSql, [formattedDate, medication_id], (err) => {
        //         if (err) {
        //           return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
        //         }
  
        //         // Insert new time slots
        //         const timeSlotInsertSql = `INSERT INTO time_slots_master (medication_id, time) VALUES ?`;
        //         connection.query(timeSlotInsertSql, [timeSlotValues], (err) => {
        //           if (err) {
        //             return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
        //           }
  
        //           return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
        //         });
        //       });
        //     } else {
        //       return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
        //     }
        //   } else {
        //     return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
        //   }


        //   Handle time slots (delete old + insert new)
if (remainder_time && typeof remainder_time === 'string') {
    const parseTo24Hour = (timeStr) => {
      const dt = DateTime.fromFormat(timeStr.trim(), "hh:mm a");
      if (!dt.isValid) {
        console.error("Invalid time string:", timeStr);
        return null;
      }
      return dt.toFormat("HH:mm");
    };
  
    const timeSlots = remainder_time
      .split(',')
      .map(slot => parseTo24Hour(slot))
      .filter(Boolean); // remove invalid/null entries
  
    if (timeSlots.length > 0) {
      const timeSlotValues = timeSlots.map(slot => [medication_id, slot]);
  
      // Mark old time slots as deleted
      const updateTimeSlotSql = "UPDATE time_slots_master SET delete_flag = 1, updatetime = ? WHERE medication_id = ?";
      connection.query(updateTimeSlotSql, [formattedDate, medication_id], (err) => {
        if (err) {
          return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
        }
  
        // Insert new time slots
        const timeSlotInsertSql = `INSERT INTO time_slots_master (medication_id, time) VALUES ?`;
        connection.query(timeSlotInsertSql, [timeSlotValues], (err) => {
          if (err) {
            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
          }
  
          return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
        });
      });
    } else {
      return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
    }
  } else {
    return response.status(200).json({ success: true, msg: languageMessage.medicationUpdated });
  }
        });
      });
    });
  };
// end


// get today medication new api 
const getTodayMedication = async (request, response) => {
    try {
        const { user_id, date, type } = request.query;

        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param
            });
        }

        const userQuery = `
            SELECT active_flag, delete_flag, current_timezone 
            FROM user_master 
            WHERE user_id = ?
        `;

        connection.query(userQuery, [user_id], (err, userRes) => {
            if (err) return response.status(200).json({ success:false,msg:'DB Error', key:err.message });
            if (!userRes.length) return response.status(200).json({ success:false,msg:'User Not Found' });
            if (userRes[0].active_flag == 0 || userRes[0].delete_flag == 1)
                return response.status(200).json({ success:false,msg:'User Deleted' });

            const userTimezone = userRes[0].current_timezone || "UTC";
            const selectedDate = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
            const dayOfWeek = moment(selectedDate).day();

            const medicationQuery = `
                SELECT 
                    mc.medication_id,
                    ts.time_slots_id,
                    ts.time,
                    ts.taken_status,
                    ts.updatetime,
                    md.medicine_name,
                    mc.type,
                    mc.dosage,
                    mc.schedule,
                    mc.pause_status,
                    mc.medicine_type_name,
                    mc.remaining_quantity,
                    mc.timezone AS med_timezone
                FROM medication_master mc
                LEFT JOIN time_slots_master ts ON mc.medication_id = ts.medication_id
                LEFT JOIN medicine_master md ON mc.medicine_id = md.medicine_id
                WHERE mc.user_id = ?
                AND mc.delete_flag = 0
                AND ts.delete_flag = 0
                AND mc.pause_status = 0
                AND (
                    mc.schedule = 0 OR
                    (mc.schedule = 1 AND FIND_IN_SET(?, mc.weekday)) OR
                    (mc.schedule = 2 AND FIND_IN_SET(?, mc.schedule_date))
                )
                AND NOT EXISTS (
                    SELECT 1 FROM medicine_average_master mam
                    WHERE mam.user_id = mc.user_id
                    AND mam.medicine_id = mc.medicine_id
                    AND mam.time_slots_id = ts.time_slots_id
                    AND mam.status = 2
                    AND DATE(mam.createtime) = ?
                )
                ORDER BY ts.time ASC
            `;

            const medicationValues = [user_id, dayOfWeek.toString(), selectedDate, selectedDate];

            connection.query(medicationQuery, medicationValues, (err, medRes) => {
                if (err) return response.status(200).json({ success:false,msg:'DB Error', key:err.message });
                if (!medRes.length) return response.status(200).json({ success:true,msg:'Data Not Found', dataArray:"NA" });

                const timeSlotIds = medRes.map(m => m.time_slots_id);

                const avgQuery = `
                    SELECT time_slots_id, taken_datetime, status
                    FROM medicine_average_master
                    WHERE user_id = ?
                    AND time_slots_id IN (?)
                    AND status IN (0,1)
                    AND DATE(taken_datetime) = ?
                `;

                connection.query(avgQuery, [user_id, timeSlotIds, selectedDate], (err, avgRes) => {
                    const avgMap = {};
                    if (!err && avgRes.length) {
                        avgRes.forEach(r => { avgMap[r.time_slots_id] = r.taken_datetime });
                    }


                    // FINAL TIME MERGING LOGIC
                    medRes = medRes.map(m => {
    const medTZ = m.med_timezone || "UTC";
    const userTZ = userTimezone;

    let finalMoment;

    if (selectedDate == moment().format("YYYY-MM-DD") && m.taken_status == 1 && avgMap[m.time_slots_id])
 {
        // today taken → show taken time
        finalMoment = moment.utc(avgMap[m.time_slots_id]).tz(userTZ);

    } else {
        // show original scheduled slot
        finalMoment = moment(
    `${selectedDate} ${m.time}`,
    "YYYY-MM-DD HH:mm:ss"
);
    }

    return {
        ...m,
        time_slot: finalMoment.format("hh:mm A"),
        time_moment: finalMoment
    };
});



                    // Sort by time so listing is in correct order
                    medRes.sort((a, b) => {
                        const t1 = moment(a.time_slot, "hh:mm A").valueOf();
                        const t2 = moment(b.time_slot, "hh:mm A").valueOf();
                        return t1 - t2;
                    });

                    const getTimeCategory = (timeString) => {
    const [time, meridian] = timeString.split(" ");
    let [hour] = time.split(":").map(Number);

    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    return "evening";
};

const categorized = {
    all: [],
    morning: [],
    afternoon: [],
    evening: []
};

medRes.forEach(m => {
    const category = getTimeCategory(m.time_slot);

    categorized.all.push({ ...m, time_category: category });
    categorized[category].push({ ...m, time_category: category });
});

let filteredData = [];

switch (parseInt(type, 10)) {
    case 1:
        filteredData = categorized.all;
        break;
    case 2:
        filteredData = categorized.morning;
        break;
    case 3:
        filteredData = categorized.afternoon;
        break;
    case 4:
        filteredData = categorized.evening;
        break;
    default:
        filteredData = categorized.all;
}
                    
                    return response.status(200).json({
                        success:true,
                        msg:'Data Found',
                        dataArray: filteredData
                    });

                });
            });
        });

    } catch (error) {
        return response.status(500).json({
            success:false,
            msg:'Internal Server Error',
            error:error.message
        });
    }
};

// end



//  share report to doctor   
const shareReportToDoctor = async ( request, response) =>{
    const { user_id, doctor_id, medical_report_id} = request.body;
    try{
         if(!user_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key:'user_id'});
         }

         if(!doctor_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key:'doctor_id'});
         }

         const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
         connection.query(checkUser, [user_id], async( err, res) =>{
            if(err){
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message});
            }
            if(res.length == 0){
                return response.status(200).json({ success : false, msg: languageMessage.userNotFound});
            }
            if(res[0].active_flag == 0){
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag : 0});
            }

            const checkDoctor = 'SELECT doctor_id FROM doctor_master WHERE doctor_id = ? AND delete_flag = 0';
            connection.query(checkDoctor, [doctor_id], async( err, res) =>{
                if(err){
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message});
                }
                if(res.length == 0){
                    return response.status(200).json({ success : false, msg: languageMessage.doctorNotFound});
                }

            const insert = 'INSERT INTO report_share_master(user_id, medical_report_id, doctor_id, share_type, createtime, updatetime) VALUES(?, ?, ?, 1, ?, ?)';
            connection.query(insert,[ user_id, medical_report_id, doctor_id, formattedDate, formattedDate], async (err, res) =>{
                if(err){
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message});
                }
                if(res.affectedRows == 0){
                    return response.status(200).json({ success : false, msg: languageMessage.ReportNotShared});
                }
                return response.status(200).json({ success: true, msg: languageMessage.ReportShared});
            });
            });
         })
    }
    catch (error) {
        return response.status(500).json({
            success: false,
            msg: languageMessage.internalServerError, 
            error: error.message
        });
    }
}


// home page 
const homepage1 = async (request, response) => {
    const { user_id } = request.query;

    try {
        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param,
                key: "user_id"
            });
        }

        //  Check if user exists & active
        const checkUser = `
            SELECT user_id, active_flag, delete_flag 
            FROM user_master 
            WHERE user_id = ? AND delete_flag = 0
        `;

        connection.query(checkUser, [user_id], async (err, userRes) => {

            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (userRes.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userNotFound
                });
            }
            if (userRes[0].active_flag == 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.accountdeactivated,
                    active_flag: 0
                });
            }

            // Get today's date & current time
            const todayDate = moment().format("YYYY-MM-DD");
            // const currentTime = moment().add(5, 'hours').add(30, 'minutes').format("HH:mm:ss");
            const currentTime = parisTime.format('HH:mm:ss');
            const todayDayOfWeek = moment().day(); // 0=Sunday

const getMedicationQuery = `
  SELECT 
      mc.medication_id,
      ts.time_slots_id,
      md.medicine_name,
      mc.dosage,
      mc.type,
      CASE mc.type WHEN 1 THEN 'pill' WHEN 2 THEN 'syrup' ELSE 'unknown' END AS type_label,
      NULLIF(mc.instruction, '') AS instruction,
      ts.taken_status,
      CASE ts.taken_status WHEN 0 THEN 'Not_Taken' WHEN 1 THEN 'Taken' ELSE 'unknown' END AS taken_label,
      mc.schedule,
      CASE mc.schedule WHEN 0 THEN 'daily' WHEN 1 THEN 'weekly' WHEN 2 THEN 'monthly' ELSE 'unknown' END AS schedule_label,
      DATE_FORMAT(ts.time, '%h:%i %p') AS time_slot,
      ts.time AS raw_time
  FROM 
      time_slots_master ts
  JOIN 
      medication_master mc ON mc.medication_id = ts.medication_id
  LEFT JOIN 
      medicine_master md ON mc.medicine_id = md.medicine_id
  WHERE 
      mc.user_id = ?
      AND mc.delete_flag = 0
      AND mc.pause_status = 0
      AND ts.delete_flag = 0
      AND ts.taken_status = 0
      AND ts.time > ?
  ORDER BY ts.time ASC
  LIMIT 5;
`;

            const values = [user_id, currentTime, todayDayOfWeek.toString(), todayDate];

            connection.query(getMedicationQuery, values, async (err, meds) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }

                if (!meds || meds.length === 0) {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.dataNotFound,
                        dataArray: "NA"
                    });
                }

                //   Optional: categorize morning/afternoon/evening like previous API
                const getTimeCategory = (timeString) => {
                    if (!timeString) return "evening";
                    const [time, meridianRaw] = timeString.trim().split(" ");
                    const [hourStr, minuteStr] = time.split(":");
                    const meridian = meridianRaw?.toUpperCase();

                    let hour = parseInt(hourStr, 10);
                    const minute = parseInt(minuteStr, 10);

                    if (isNaN(hour) || isNaN(minute)) return "evening";

                    if (meridian === "PM" && hour !== 12) hour += 12;
                    if (meridian === "AM" && hour === 12) hour = 0;

                    if (hour >= 5 && hour < 12) return "morning";
                    if (hour >= 12 && hour < 17) return "afternoon";
                    return "evening";
                };

                const categorizedMeds = meds.map(med => ({
                    ...med,
                    time_category: getTimeCategory(med.time_slot)
                }));

                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataFound,
                    current_time: currentTime,
                    upcoming_total: categorizedMeds.length,
                    dataArray: categorizedMeds[0]
                });
            });
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            msg: languageMessage.internalServerError,
            error: error.message
        });
    }
};


//  check useradded reports 
const checkReportsAddedStatus = async( request, response) =>{
    const { user_id} = request.query;
    try{
        if(!user_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key:'user_id'});
        }
        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(checkUser, [user_id], async (err, userRes) => {

            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (userRes.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userNotFound
                });
            }
            if (userRes[0].active_flag == 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.accountdeactivated,
                    active_flag: 0
                });
            }
           const  medication_status = await getUserMedicineAdded(user_id);
           const report_status = await getUserReportAdded(user_id);
           const measurement_status = await getMeasurementAdded(user_id);
           const adverse_reaction_status = await getAdverseReactionAdded(user_id);
           return response.status(200).json({
            success: true,
            msg: languageMessage.dataFound,
            medication_status,
            report_status, 
            measurement_status, 
            adverse_reaction_status, 
            status_label : '0 = not added, 1 - added'
           })
        })
    }
    catch(error){
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message});
    }
}


async function getUserMedicineAdded(user_id) {
    return new Promise(( resolve, reject) =>{
        const sql = 'SELECT user_id, medication_id FROM medication_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id], (err, res) => {
            if (err) {
                reject(err);
            }
           else{
             let status = res.length > 0 ? 1 : 0;
             resolve(status);
           }
        })
    })
}

async function getUserReportAdded(user_id) {
    return new Promise(( resolve, reject) =>{
        const sql = 'SELECT user_id, medical_report_id FROM medical_report_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id], (err, res) => {
            if (err) {
                reject(err);
            }
           else{
             let status = res.length > 0 ? 1 : 0;
             resolve(status);
           }
        })
    })
}


async function getMeasurementAdded(user_id){
    return new Promise(( resolve, reject) =>{
        const sql = 'SELECT user_id, measurement_id FROM measurement_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id], (err, res) => {
            if (err) {
                reject(err);
            }
           else{
             let status = res.length > 0 ? 1 : 0;
             resolve(status);
           }
        })
    })
}

async function getAdverseReactionAdded(user_id){
    return new Promise(( resolve, reject) =>{
        const sql = 'SELECT user_id, adverse_reaction_id FROM adverse_reaction_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id], (err, res) => {
            if (err) {
                reject(err);
            }
           else{
             let status = res.length > 0 ? 1 : 0;
             resolve(status);
           }
        })
    })
}


//  get notification status
const getNotificationStatus = async( request, response) =>{
    const { user_id} = request.query;
    try{
         if(!user_id){
            return response.status(200).json({ success : false, msg: languageMessage.msg_empty_param, key:'user_id'});
         }

         const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
         connection.query(checkUser, [user_id], async (err, userRes) => {
 
             if (err) {
                 return response.status(200).json({
                     success: false,
                     msg: languageMessage.internalServerError,
                     key: err.message
                 });
             }
 
             if (userRes.length === 0) {
                 return response.status(200).json({
                     success: false,
                     msg: languageMessage.userNotFound
                 });
             }
             if (userRes[0].active_flag == 0) {
                 return response.status(200).json({
                     success: false,
                     msg: languageMessage.accountdeactivated,
                     active_flag: 0
                 });
             }

            const sql = 'SELECT notification_message_id FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 AND read_status = 0'; 
            connection.query(sql, [user_id], async( err1, res1) =>{
                if(err1){
                    return response.status(200).json({ success : false, msg : languageMessage.internalServerError, error : err1.message});
                }

                let notification_status = res1.length > 0 ? true : false;
                return response.status(200).json({ success : true, msg : languageMessage.dataFound, notification_status});
            })

            }); 
    }
    catch(error){
        return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error: error.message});
    }
}



// //  delete medication from history 
const DeleteMedicationFromHistory = async (request, response) => {
    const { user_id, medication_id } = request.body;


    if (!user_id || !medication_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
        });
    }

    // Validate user
    const userQuery = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ? ";
    const userValues = [user_id];

    connection.query(userQuery, userValues, async (err, result) => {

        if (err) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.internalServerError,
                key: err.message,
            });
        }

        if (result.length == 0) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.userNotFound,
            });
        }


        if (result[0]?.active_flag === 0) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.userDeleted,
                active_flag: 0,
            });
        }

        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });
        }

const check = 'SELECT user_id, delete_flag FROM medication_master WHERE user_id = ? AND medication_id = ?';
connection.query(check, [user_id, medication_id], async(checkErr, checkRes) =>{

    if(checkErr){
        return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error : checkErr.message});
    }
  let deleteQuery; 

  if(checkRes.length > 0){
    if(checkRes[0].delete_flag == 1){
         deleteQuery = `UPDATE medication_master SET final_delete_flag = 1, updatetime = ? WHERE medication_id = ? AND user_id = ?`;
    }
    else{
         deleteQuery = `UPDATE medication_master SET delete_flag = 1, final_delete_flag = 1, updatetime = ? WHERE medication_id = ? AND user_id = ?`;
    }
        const deleteValues = [formattedDate, medication_id, user_id];
        connection.query(deleteQuery, deleteValues, async (err, deleteResult) => {

         if (err) {
             return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message})
         }
        return response.status(200).json({ success: true, msg: languageMessage.MedicationDeleted });
        });
    }
    else{
        return response.status(200).json({ success : false, msg: languageMessage.msgDataNotFound})
    }
 });
})
}



//  delete medication history new api 
// const DeleteMedicationFromHistory = async (request, response) => {
//     const { user_id, medicine_average_id  } = request.body;

//     // Validate required parameters
//     if (!user_id ) {
//         return response.status(200).json({
//             success: false,
//             msg: languageMessage.msg_empty_param,
//         });
//     }
//     if(!medicine_average_id ){
//         return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'medication_id' })
//     }

//     // Validate user
//     const userQuery = "SELECT mobile, active_flag,delete_flag FROM user_master WHERE user_id = ? ";
//     const userValues = [user_id];

//     connection.query(userQuery, userValues, async (err, result) => {

//         if (err) {
//             return response.status(200).json({
//                 success: false,
//                 msg: languageMessage.internalServerError,
//                 key: err.message,
//             });
//         }

//         if (result.length == 0) {
//             return response.status(200).json({
//                 success: false,
//                 msg: languageMessage.userNotFound,
//             });
//         }

//         if (result[0]?.active_flag === 0) {
//             return response.status(200).json({
//                 success: false,
//                 msg: languageMessage.userDeleted,
//                 active_flag: 0,
//             });
//         }

//         if (result[0]?.delete_flag == 1) {
//             return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });
//         }

// const check = 'SELECT user_id, medicine_average_id  FROM medicine_average_master WHERE user_id = ? AND medicine_average_id = ?';
// connection.query(check, [user_id, medicine_average_id], async(checkErr, checkRes) =>{

//     if(checkErr){
//         return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error : checkErr.message});
//     }
//   let deleteQuery; 

//   if(checkRes.length > 0){
   
//          deleteQuery = `UPDATE medicine_average_master SET delete_flag = 1, updatetime = ? WHERE medicine_average_id = ? AND user_id = ?`
//           const deleteValues = [formattedDate, medicine_average_id, user_id];
//           connection.query(deleteQuery, deleteValues, async (err, deleteResult) => {
  
//          if (err) {
//              return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message})
//          }
//         return response.status(200).json({ success: true, msg: languageMessage.MedicationDeleted });
//         });
//     }
//     else{
//         return response.status(200).json({ success : false, msg: languageMessage.msgDataNotFound})
//     }
//  });
// })
// }




//  clear player id 
const removePlayerId = async( request, response) =>{
    const { user_id} = request.body;
    try{
        if(!user_id){
            return response.status(200).json({ success : false, msg: languageMessage.msg_empty_param, key:'user_id'});
        }
        const check = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(check, [user_id], async(checkErr, checkRes) =>{
            if(checkErr){
                return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error : checkErr.message});
            }
            if(checkRes.length == 0){
                return response.status(200).json({ success : false, msg: languageMessage.userNotFound});
            }
            if(checkRes[0].active_flag == 0){
                return response.status(200).json({ success : false, msg: languageMessage.userDeleted, active_flag: 0});
            }
    
            const update = 'UPDATE user_notification SET player_id = NULL WHERE user_id = ?';
            connection.query(update, [user_id], async(updateErr, updateRes) =>{
                if(updateErr){
                    return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error : updateErr.message});
                }
                return response.status(200).json({ success : true, msg: languageMessage.playerIdRemoved});
            });
        });
    }
    catch(error){
        return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error: error.message});
    }
}



//  get homepage 1 
const homepage = async (request, response) => {
    const { user_id } = request.query;

    try {
        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param,
                key: "user_id"
            });
        }

        // Check if user exists & active
        const checkUser = `
            SELECT user_id, active_flag, delete_flag, current_timezone
            FROM user_master 
            WHERE user_id = ? AND delete_flag = 0
        `;

        connection.query(checkUser, [user_id], async (err, userRes) => {

            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (userRes.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userNotFound
                });
            }

            if (userRes[0].active_flag == 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.accountdeactivated,
                    active_flag: 0
                });
            }

            // Get today's date & current time
            const userTimezone = userRes[0].current_timezone || "UTC";
            const todayDate = moment().tz(userTimezone).format("YYYY-MM-DD");
            const now = moment().tz(userTimezone); // current moment in user timezone
            const currentTime = now.format("HH:mm:ss");
            const todayDayOfWeek = now.day(); // 0=Sunday

            // Fetch all not-taken reminders only for today
            const getMedicationQuery = `
                SELECT 
                    mc.medication_id,
                    ts.time_slots_id,
                    mc.medicine_id,
                    md.medicine_name,
                    mc.dosage,
                    mc.type,
                    CASE mc.type
                        WHEN 1 THEN 'pill'
                        WHEN 2 THEN 'syrup'
                        ELSE 'unknown'
                    END AS type_label,
                    NULLIF(mc.instruction, '') AS instruction,
                    ts.taken_status,
                    CASE ts.taken_status
                        WHEN 0 THEN 'Not_Taken'
                        WHEN 1 THEN 'Taken'
                        ELSE 'unknown'
                    END AS taken_label,
                    mc.schedule,
                    mc.medicine_type_name,
                    CASE mc.schedule
                        WHEN 0 THEN 'daily'
                        WHEN 1 THEN 'weekly'
                        WHEN 2 THEN 'monthly'
                        ELSE 'unknown'
                    END AS schedule_label,
                    mc.remaining_quantity,
                    mc.pause_status,
                    mc.number_of_times,
                    mc.timezone AS med_timezone,
                    ts.time AS raw_time
                FROM 
                    medication_master AS mc
                LEFT JOIN 
                    medicine_master AS md ON mc.medicine_id = md.medicine_id
                LEFT JOIN 
                    time_slots_master AS ts ON mc.medication_id = ts.medication_id
                WHERE 
                    mc.user_id = ?
                    AND mc.delete_flag = 0
                    AND mc.pause_status = 0
                    AND ts.delete_flag = 0
                    AND ts.taken_status = 0
                    AND (
                        mc.schedule = 0  
                        OR (mc.schedule = 1 AND FIND_IN_SET(?, mc.weekday)) 
                        OR (mc.schedule = 2 AND FIND_IN_SET(?, mc.schedule_date)) 
                    ) 
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM medicine_average_master mam 
                        WHERE mam.user_id = mc.user_id 
                          AND mam.medicine_id = mc.medicine_id 
                          AND mam.time_slots_id = ts.time_slots_id
                          AND mam.status = 2 
                          AND DATE(mam.createtime) = ?
                    )
                ORDER BY ts.time ASC
            `;

            const values = [user_id, todayDayOfWeek.toString(), todayDate, todayDate];

            connection.query(getMedicationQuery, values, async (err, meds) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }

                if (!meds || meds.length === 0) {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.dataNotFound,
                        dataArray: []
                    });
                }

                // categorize time
                const getTimeCategory = (timeString) => {
                    if (!timeString) return "evening";
                    const [time, meridianRaw] = timeString.trim().split(" ");
                    const [hourStr, minuteStr] = time.split(":");
                    const meridian = meridianRaw?.toUpperCase();

                    let hour = parseInt(hourStr, 10);
                    const minute = parseInt(minuteStr, 10);

                    if (isNaN(hour) || isNaN(minute)) return "evening";

                    if (meridian === "PM" && hour !== 12) hour += 12;
                    if (meridian === "AM" && hour === 12) hour = 0;

                    if (hour >= 5 && hour < 12) return "morning";
                    if (hour >= 12 && hour < 17) return "afternoon";
                    return "evening";
                };

                // Convert DB time (HH:mm:ss) → user timezone wall clock (no UTC shift)
                const categorizedMeds = meds.map(med => {
                const raw = med.raw_time;
                const medTZ = med.med_timezone || "UTC";
                const userTZ = userTimezone;
            
                // medication "today" in its own timezone
                // const medToday = moment().tz(medTZ).format("YYYY-MM-DD");
            
                // interpret as wall time in med timezone
                // const medMoment = moment.tz(
                //     `${medToday} ${raw}`,
                //     "YYYY-MM-DD HH:mm:ss",
                //     medTZ
                // );
            
                // convert to user's current timezone
                // const userMoment = medMoment.clone().tz(userTZ);
                // Interpret raw_time as local wall-clock time (NO timezone conversion)
                const userMoment = moment(
                    `${todayDate} ${raw}`,
                    "YYYY-MM-DD HH:mm:ss"
                );

            
                return {
                    ...med,
                    time_slot: userMoment.format("hh:mm A"),
                    time_category: getTimeCategory(userMoment.format("hh:mm A")),
                    time_moment: userMoment
                };
            });


                const CURRENT_TIME_WINDOW = 5; // minutes

                categorizedMeds.sort((a, b) => {
                    const aDiff = a.time_moment.diff(now, 'minutes');
                    const bDiff = b.time_moment.diff(now, 'minutes');

                    const aCurrent = Math.abs(aDiff) <= CURRENT_TIME_WINDOW;
                    const bCurrent = Math.abs(bDiff) <= CURRENT_TIME_WINDOW;

                    if (aCurrent && !bCurrent) return -1;
                    if (!aCurrent && bCurrent) return 1;
                    if (aCurrent && bCurrent) return Math.abs(aDiff) - Math.abs(bDiff);

                    if (aDiff > 0 && bDiff < 0) return -1;
                    if (aDiff < 0 && bDiff > 0) return 1;
                    return a.time_moment - b.time_moment;
                });

                const upcomingCount = categorizedMeds.filter(med => {
                    const diff = med.time_moment.diff(now, 'minutes');
                    return diff >= -CURRENT_TIME_WINDOW;
                }).length;

                const finalResponse = categorizedMeds.map(med => {
                    const { time_moment, ...rest } = med;
                    return rest;
                });

                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataFound,
                    current_time: currentTime,
                    upcoming_total: upcomingCount,
                    dataArray: finalResponse
                });
            });
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            msg: languageMessage.internalServerError,
            error: error.message
        });
    }
};





module.exports = {

    sendContactUs,

    pauseMedication,

    MedicationMarkASTaken,

    insertMedicine,

    AddMedication,

    editMedication,

    DeleteMedication,

    addMedicalReport,

    deleteMedicalReport,

    getLaboratoryReportCounts,

    addBPData,

    addFastingGlucose,

    addPPBGS,

    addWeightMeasurement,

    addTemperature,

    addCustomMeasure,

    editCustomMeasure,

    deleteCustomMeasure,

    addAdverseReaction,

    editAdverseReaction,

    deleteAdverseReaction,

    addDoctors,
    cronJobFunction,
    clearAllNotifications,
    clearSingleNotifications,
    getBeforeTimeSlots, 
    AddMedicationn, 
    editNewMedication, 
    getTodayMedication, 
    shareReportToDoctor, 
    homepage, 
    checkReportsAddedStatus, 
    getNotificationStatus, 
    DeleteMedicationFromHistory, 
    removePlayerId,
    homepage1
    

}

