const commonModel = require("./common_modules");

const connection = require('../connection');

const languageMessage = require('../shared functions/languageMessage')
const moment = require('moment-timezone');

//require('moment/min/locales');
require('moment/locale/ar');
require('moment/locale/fr');
require('moment/locale/es');
require('moment/locale/de');
require('moment/locale/it');
require('moment/locale/pt');

const { readv } = require("fs");
const { error } = require("console");
const { request } = require("http");
const { response } = require("express");
const { connect } = require("http2");

const { getUserLanguage } = require('../helpers/languageHelper');

// Get current time in the desired timezone (e.g., Paris)

const parisTime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris');

// Format it as 'YYYY-MM-DD HH:mm:ss'
const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');
const getAllContent = async (request, response) => {

    const data = request.query;

    if (!data) {
        const record = { success: false, msg: languageMessage.msg_empty_param, key: 1 };
        return response.json(record);
    }

    if (!data.user_id) {
        var user_id = 0;
    } else {
        var userData = await commonModel.userCheck(data.user_id);

        if (userData === "NA") {
            return response.json({ success: false, msg: languageMessage.userNotFound, key: 3 });
        } else {

            if (userData.active_flag <= 0) {

                return response.json({

                    success: false,

                    msg: languageMessage.msgAccountdeactivated,

                    key: "deacivate",

                });

            }

        }
    }
    try {
        const content_arr = await commonModel.getAllContent();
        return response.json({
            success: true,
            msg: languageMessage.msgDataFound,
            user_id: user_id,
            content_arr: content_arr,
        });
    } catch (error) {
        console.error("database error key 2");
        const record = { success: false, msg: languageMessage.msgServerError, key: error };
        return response.json(record);
    }
};



const getAllContentUrl = async (request, response) => {



    const data = request.query;

    if (!data) {

        const record = { success: false, msg: languageMessage.msgAllFieldReqired };

        return response.json(record);

    }

    var content_type = 0;

    if (!data.content_type) {

        const record = { success: false, msg: languageMessage.msgAllFieldReqired, key: "content_type" };

        return response.json(record);

    } else {

        content_type = data.content_type;

        try {

            const content_data = await commonModel.getAllContentUrlData(content_type);

            let new12 =

                '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' +

                content_data +

                "</body></html>";

            return response.send(new12);

        } catch (error) {

            const record = { success: false, msg: languageMessage.msgServerError, key: error };

            return response.json(record);

        }

    }

}





//Get My Medications

const getMyMedications = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

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



        const query1 = `

        SELECT 

        mc.medication_id, 

        mc.medicine_id, 

        md.medicine_name,

        mc.dosage, 

        mc.type,

        '1=pill, 2=syrup' AS type_label,

        NULLIF(mc.instruction, '') AS instruction, 

        mc.schedule,

        '0=daily, 1=weekly, 2=monthly' AS schedule_label,

        mc.remaining_quantity,

        mc.pause_status,

        mc.number_of_times,

        mc.remainder_quantity,

        mc.schedule_date,

        mc.weekday,

        mc.medicine_type_name,
        mc.toggle_status,

        '0=Not_Paused, 1=Paused' AS pause_label

        FROM 

        medication_master AS mc 

        LEFT JOIN 

        medicine_master AS md

        ON

        mc.medicine_id = md.medicine_id

        WHERE mc.user_id = ? 

        AND mc.delete_flag=0`;



        connection.query(query1, values1, async (err, subResult) => {



            if (err) {
 
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }

            if (subResult.length === 0) {
                return response.status(200).json({ success: true, msg: languageMessage.dataNotFound, dataArray: "NA" });
            }

            const enrichedResults = await Promise.all(
                subResult.map((item) => {
                    return new Promise((resolve) => {
                        const getsql = `
        SELECT DATE_FORMAT(time, '%h:%i %p') AS formatted_time 
        FROM time_slots_master 
        WHERE medication_id = ? AND delete_flag = 0
      `;
                        connection.query(getsql, [item.medication_id], (err, timeslots) => {
                            if (err || timeslots.length === 0) {
                                item.timeSlots = "NA";
                            } else {
                                const formattedTimes = timeslots.map((slot) => slot.formatted_time);
                                item.timeSlots = formattedTimes.join(",");
                            }
                            resolve(item);
                        });
                    });
                })
            );


            return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



        });

    });

}



//  get today medication 
const getTodayMedicationNew = async (request, response) => {
    try {
        const { user_id } = request.query;

        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param
            });
        }

        const userQuery = `
            SELECT mobile, active_flag, otp_verify ,delete_flag
            FROM user_master 
            WHERE user_id = ? 
        `;
        const userValues = [user_id];

        connection.query(userQuery, userValues, async (err, userResult) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (userResult.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userNotFound
                });
            }

            if (userResult[0]?.active_flag === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userDeleted,
                    active_flag: 0
                });
            }

            if (userResult[0]?.delete_flag == 1) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });
            }
            const today = new Date();
            const dayOfWeek = today.getDay();     // 0 = Sunday
            const dateOfMonth = moment(today).format("YYYY-MM-DD");


            const medicationQuery = `
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
                    DATE_FORMAT(ts.time,  '%h:%i %p') AS time_slot
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
                    AND (
                        mc.schedule = 0
                        OR (mc.schedule = 1 AND FIND_IN_SET(?, mc.weekday)) -- Weekly
                         OR (mc.schedule = 2 AND DATE(mc.schedule_date) = ?) -- Monthly
                    )
                ORDER BY ts.time
            `;

            const medicationValues = [user_id, dayOfWeek.toString(), dateOfMonth];

            connection.query(medicationQuery, medicationValues, async (err, medResult) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }


                // if(medResult.length > 0){
                //     r
                // }
                if (!medResult || medResult.length === 0) {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.dataNotFound,
                        dataArray: "NA"
                    });
                }

                // Helper to categorize time slots
                // const getTimeCategory = (timeString) => {
                //     if (!timeString) return "evening"; // Default fallback
                //     const hour = parseInt(timeString.split(":")[0], 10);
                //     if (isNaN(hour)) return "evening";
                //     if (hour >= 5 && hour < 12) return "morning";
                //     if (hour >= 12 && hour < 18) return "afternoon";
                //     return "evening"; // 17:00 to 04:59
                // };

                const getTimeCategory = (timeString) => {
                    if (!timeString) return "evening"; // Fallback

                    // Normalize time string: e.g., "08:00 PM" → 20:00
                    const [time, meridianRaw] = timeString.trim().split(" ");
                    const [hourStr, minuteStr] = time.split(":");
                    const meridian = meridianRaw?.toUpperCase();

                    let hour = parseInt(hourStr, 10);
                    const minute = parseInt(minuteStr, 10);

                    if (isNaN(hour) || isNaN(minute)) return "evening";

                    // Convert to 24-hour format
                    if (meridian === "PM" && hour !== 12) hour += 12;
                    if (meridian === "AM" && hour === 12) hour = 0;

                    // Categorize time
                    if (hour >= 5 && hour < 12) return "morning";      // 5:00 to 11:59
                    if (hour >= 12 && hour < 17) return "afternoon";   // 12:00 to 16:59
                    return "evening";                                  // 17:00 to 4:59
                };


                const categorized = {
                    all: [],
                    morning: [],
                    afternoon: [],
                    evening: []
                };

                medResult.forEach((med) => {
                    const category = getTimeCategory(med.time_slot);
                    categorized.all.push(med);
                    categorized[category].push(med);
                });

                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataFound,
                    dataArray: categorized
                });
            });
        });
    } catch (error) {
        console.error("Unexpected error in getTodayMedication:", error);
        return response.status(500).json({
            success: false,
            msg: "Unexpected error occurred",
            error: error.message
        });
    }
};
//end



const getDateMedication = async (request, response) => {
    try {
        const { user_id, date } = request.body;

        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param
            });
        }

        const userQuery = `
            SELECT mobile, active_flag, otp_verify ,delete_flag 
            FROM user_master 
            WHERE user_id = ? 
        `;
        const userValues = [user_id];

        connection.query(userQuery, userValues, async (err, userResult) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    key: err.message
                });
            }

            if (userResult.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userNotFound
                });
            }

            if (userResult[0]?.active_flag === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.userDeleted,
                    active_flag: 0
                });
            }

            if (userResult[0]?.delete_flag == 1) {

                return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

            }

            const inputDate = new Date(date);
            if (isNaN(inputDate)) {
                return response.status(200).json({
                    success: false,
                    msg: "Invalid date format"
                });
            }

            const dayOfWeek = inputDate.getDay();
            const dateOfMonth = moment(inputDate).format("YYYY-MM-DD");

            const medicationQuery = `
                SELECT 
                    mc.medication_id, 
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
                    0 AS taken_status,
                    CASE mc.taken_status
                        WHEN 0 THEN 'Not_Taken'
                        WHEN 1 THEN 'Taken'
                        ELSE 'unknown'
                    END AS taken_label,
                    mc.schedule,
                    CASE mc.schedule
                        WHEN 0 THEN 'daily'
                        WHEN 1 THEN 'weekly'
                        WHEN 2 THEN 'monthly'
                        ELSE 'unknown'
                    END AS schedule_label,
                    mc.remaining_quantity,
                    mc.pause_status,
                     mc.medicine_type_name,
                    DATE_FORMAT(ts.time, '%h:%i %p') AS time_slot
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
                    AND ( 
                        mc.schedule = 0
                        OR (mc.schedule = 1 AND FIND_IN_SET(?, mc.weekday)) -- Weekly
                        OR (mc.schedule = 2 AND DATE(mc.schedule_date) = ?) -- Monthly
                    )
                ORDER BY ts.time
            `;

            const medicationValues = [user_id, dayOfWeek.toString(), dateOfMonth];

            connection.query(medicationQuery, medicationValues, async (err, medResult) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }

                if (!medResult || medResult.length === 0) {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.dataNotFound,
                        dataArray: "NA"
                    });
                }

                // Helper to categorize time slots
                // const getTimeCategory = (timeString) => {
                //     if (!timeString) return "evening"; // Default fallback
                //     const hour = parseInt(timeString.split(":")[0], 10);
                //     if (isNaN(hour)) return "evening";
                //     if (hour >= 5 && hour < 12) return "morning";
                //     if (hour >= 12 && hour < 18) return "afternoon";
                //     return "evening"; // 17:00 to 04:59
                // };

                const getTimeCategory = (timeString) => {
                    if (!timeString) return "evening"; // Fallback

                    // Normalize time string: e.g., "08:00 PM" → 20:00
                    const [time, meridianRaw] = timeString.trim().split(" ");
                    const [hourStr, minuteStr] = time.split(":");
                    const meridian = meridianRaw?.toUpperCase();

                    let hour = parseInt(hourStr, 10);
                    const minute = parseInt(minuteStr, 10);

                    if (isNaN(hour) || isNaN(minute)) return "evening";

                    // Convert to 24-hour format
                    if (meridian === "PM" && hour !== 12) hour += 12;
                    if (meridian === "AM" && hour === 12) hour = 0;

                    // Categorize time
                    if (hour >= 5 && hour < 12) return "morning";      // 5:00 to 11:59
                    if (hour >= 12 && hour < 17) return "afternoon";   // 12:00 to 16:59
                    return "evening";                                  // 17:00 to 4:59
                };

                const categorized = {
                    all: [],
                    morning: [],
                    afternoon: [],
                    evening: []
                };

                medResult.forEach((med) => {
                    const category = getTimeCategory(med.time_slot);
                    categorized.all.push(med);
                    categorized[category].push(med);
                });

                return response.status(200).json({
                    success: true,
                    msg: languageMessage.dataFound,
                    dataArray: categorized, dateOfMonth
                });
            });
        });
    } catch (error) {
        console.error("Unexpected error in getTodayMedication:", error);
        return response.status(500).json({
            success: false,
            msg: "Unexpected error occurred",
            error: error.message
        });
    }
};





//Get Medication History

const getMyMedicationsHistory = async (request, response) => {

    const { user_id } = request.query;

    if (!user_id) {
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

        const query1 = `SELECT  mc.medication_id, 

        mc.medicine_id, 

        md.medicine_name,

        mc.dosage, 

        mc.type,

        '1=pill, 2=syrup' AS type_label,

        NULLIF(mc.instruction, '') AS instruction, 

        mc.schedule,

        '0=daily, 1=weekly, 2=monthly' AS schedule_label,

        mc.remaining_quantity,

        mc.pause_status,

        mc.number_of_times,

        mc.remainder_quantity,

        mc.schedule_date,

        mc.weekday,

        mc.updatetime,

     mc.medicine_type_name,

        '0=Not_Paused, 1=Paused' AS pause_label

        FROM 

        medication_master AS mc 

        LEFT JOIN 

        medicine_master AS md

        ON

        mc.medicine_id = md.medicine_id

        WHERE mc.user_id = ? AND mc.final_delete_flag = 0`;



        connection.query(query1, values1, async (err, subResult) => {



            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }



            if (subResult.length === 0) {

                return response.status(200).json({ success: true, msg: languageMessage.dataNotFound, dataArray: "NA" });

            }

            const enrichedResults = await Promise.all(
                subResult.map((item) => {
                    return new Promise((resolve) => {
                        const getsql = `
        SELECT DATE_FORMAT(time,  '%h:%i %p') AS formatted_time 
        FROM time_slots_master 
        WHERE medication_id = ? AND delete_flag = 0
      `;
                        connection.query(getsql, [item.medication_id], (err, timeslots) => {
                            if (err || timeslots.length === 0) {
                                item.timeSlots = "NA";
                            } else {
                                const formattedTimes = timeslots.map((slot) => slot.formatted_time);
                                item.timeSlots = formattedTimes.join(",");
                            }

                            if (item.updatetime) {
                                item.date = moment(item.updatetime).format("DD MMM YYYY");
                                item.time = moment(item.updatetime).format("hh:mm A");
                            } else {
                                item.date = "NA";
                                item.time = "NA";
                            }
                            resolve(item);
                        });
                    });
                })
            );

            return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



        });

    });

}

//end





//Get Medicines Names

const getMedicine = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

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



        const query2 = "SELECT medicine_id, medicine_name, description, createtime FROM medicine_master WHERE delete_flag=0 AND ( added_by = 0  OR (added_by = 1 AND user_id = ?))";

        const values2 = [user_id];



        connection.query(query2, values2, async (err, subResult) => {



            if (err) {

                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

            }



            return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult, });



        });

    });

}

//end





//Get Ducument type

const getDocumentType = async (request, response) => {

    const { user_id } = request.query;

    if (!user_id) {

        return response

            .status(200)

            .json({ success: false, msg: languageMessage.msg_empty_param });

    }

    const query1 = "SELECT mobile, active_flag, otp_verify, delete_flag FROM user_master WHERE user_id = ? ";

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

        const query2 = "SELECT report_category_id, category_name, category_image, createtime FROM report_category WHERE delete_flag=0";

        const values2 = [user_id];


        connection.query(query2, values2, async (err, subResult) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });
            }


            let category_arr = [];
            for(let data of subResult){
                let total_items = await getDocumentCountByCategory(data.report_category_id, user_id);
                let file_size = await getDocumentFileSizeByCategory(data.report_category_id, user_id);
                category_arr.push({
                    report_category_id : data.report_category_id,
                    category_name : data.category_name,
                    category_image : data.category_image, 
                    createtime : data.createtime, 
                    total_items : total_items, 
                    file_size : file_size
                });
            }
            return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: category_arr });



        });

    });

}

//end

//Get Laboratory Reports

const getReports = async (request, response) => {

    const { user_id, report_category_id } = request.query;



    if (!user_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

        });

    }



    if (!report_category_id) {

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

            const Query = "SELECT mrm.medical_report_id, mrm.report_category_id,rc.category_name, mrm.file,mrm.file_size, mrm.createtime FROM medical_report_master mrm LEFT JOIN report_category rc ON mrm.report_category_id=rc.report_category_id WHERE mrm.user_id = ? AND mrm.report_category_id = ? AND mrm.delete_flag=0";

            const Values = [user_id, report_category_id];

            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Recent added Reports of user

const getResentReports = async (request, response) => {

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

            const Query = "SELECT mrm.medical_report_id, mrm.report_category_id, rc.category_name, mrm.file, mrm.file_size, mrm.createtime FROM medical_report_master mrm LEFT JOIN report_category rc ON rc.report_category_id = mrm.report_category_id  WHERE mrm.user_id = ? AND mrm.delete_flag=0 ORDER BY mrm.medical_report_id DESC LIMIT 5";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }

                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });
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





//Get BP records of user

const getBPData = async (request, response) => {

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

            const Query = "SELECT measurement_id, systolic_bp, diastolic_bp, pulse, createtime FROM measurement_master WHERE user_id = ? AND type = 0 AND delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Fasting Glucose of user
const getFastingGlucose = async (request, response) => {

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

            const Query = "SELECT measurement_id, fasting_glucose, createtime FROM measurement_master WHERE user_id = ? AND type = 1 AND delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get PPBGS of user

const getPPBGS = async (request, response) => {

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

            const Query = "SELECT measurement_id, ppbgs, createtime FROM measurement_master WHERE user_id = ? AND type = 2 AND delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Weight Measurement

const getWeightMeasurement = async (request, response) => {

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

            const Query = "SELECT measurement_id, weight, createtime FROM measurement_master WHERE user_id = ? AND type = 3 AND delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Temperature Measurement

const getTemperature = async (request, response) => {

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

            const Query = "SELECT measurement_id, temperature, createtime FROM measurement_master WHERE user_id = ? AND type = 4 AND delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Custom Measurement

const getCustomMeasurement = async (request, response) => {

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

            const Query = "SELECT mm.measurement_id, mm.symptom, sm.symptom_name, mm.symptom_range, mm.createtime FROM measurement_master AS mm LEFT JOIN symptoms_master AS sm ON mm.symptom = sm.symptom_id WHERE mm.user_id = ? AND mm.type = 5 AND mm.delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get BP Data Graph

const getBPDataStatus = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

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



        const currentYear = new Date().getFullYear();

        const dailyQuery = `

            SELECT 

                DATE(createtime) AS day,

                systolic_bp,     

                diastolic_bp,

                pulse

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 0

                AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)

        `;


        const monthlyQuery = `

            SELECT 
                MONTH(createtime) AS month,
                createtime,

                systolic_bp,

                diastolic_bp,

                pulse

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 0

                AND YEAR(createtime) = ?

        `;



        const yearlyQuery = `

            SELECT 

                YEAR(createtime) AS year,

                createtime,

                systolic_bp,

                diastolic_bp,

                pulse

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 0

                AND YEAR(createtime) BETWEEN ? AND ?

        `;



        connection.query(dailyQuery, [user_id], (err, dailyResult) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



            connection.query(monthlyQuery, [user_id, currentYear], (err, monthlyResult) => {

                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                connection.query(yearlyQuery, [user_id, currentYear - 2, currentYear + 2], (err, yearlyResult) => {

                    if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                    return response.status(200).json({

                        success: true,

                        data: {

                            daily: dailyResult,

                            monthly: monthlyResult,

                            yearly: yearlyResult

                        }

                    });

                });

            });

        });

    });

};

//end





//Get Fasting Glucose Graph

const getFastingGlucoseDataStatus = async (request, response) => {

    const { user_id } = request.query;

    if (!user_id) {

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


        const currentYear = new Date().getFullYear();

        const dailyQuery = `

            SELECT 

                DATE(createtime) AS day,

                fasting_glucose

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 1

                AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)

        `;



        const monthlyQuery = `

            SELECT 

                MONTH(createtime) AS month,

                createtime,

                fasting_glucose

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 1

                AND YEAR(createtime) = ?

        `;



        const yearlyQuery = `

            SELECT 

                YEAR(createtime) AS year,

                createtime,

                fasting_glucose

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 1

                AND YEAR(createtime) BETWEEN ? AND ?

        `;



        connection.query(dailyQuery, [user_id], (err, dailyResult) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



            connection.query(monthlyQuery, [user_id, currentYear], (err, monthlyResult) => {

                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                connection.query(yearlyQuery, [user_id, currentYear - 2, currentYear + 2], (err, yearlyResult) => {

                    if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                    return response.status(200).json({

                        success: true,

                        data: {

                            daily: dailyResult,

                            monthly: monthlyResult,

                            yearly: yearlyResult

                        }

                    });

                });

            });

        });

    });

};

//end





//Get PPBGS Graph

const getPPBGSDataStatus = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag FROM user_master,delete_flag WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }
        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const currentYear = new Date().getFullYear();



        const dailyQuery = `

            SELECT 

                DATE(createtime) AS day,

                ppbgs

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 2

                AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)

        `;



        const monthlyQuery = `

            SELECT 

                MONTH(createtime) AS month,

                createtime,

                ppbgs

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 2

                AND YEAR(createtime) = ?

        `;



        const yearlyQuery = `

            SELECT 

                YEAR(createtime) AS year,

                createtime,

                ppbgs

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 2

                AND YEAR(createtime) BETWEEN ? AND ?

        `;



        connection.query(dailyQuery, [user_id], (err, dailyResult) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



            connection.query(monthlyQuery, [user_id, currentYear], (err, monthlyResult) => {

                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                connection.query(yearlyQuery, [user_id, currentYear - 2, currentYear + 2], (err, yearlyResult) => {

                    if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                    return response.status(200).json({

                        success: true,

                        data: {

                            daily: dailyResult,

                            monthly: monthlyResult,

                            yearly: yearlyResult

                        }

                    });

                });

            });

        });

    });

};

//end





//Get weight Measurement Graph

const getWeightMeasurementDataStatus = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag FROM user_master,delete_flag WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }
        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const currentYear = new Date().getFullYear();



        const dailyQuery = `

            SELECT 

                DATE(createtime) AS day,

                weight

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 3

                AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)

        `;



        const monthlyQuery = `

            SELECT 

                MONTH(createtime) AS month,

                createtime,

                weight

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 3

                AND YEAR(createtime) = ?

        `;



        const yearlyQuery = `

            SELECT 

                YEAR(createtime) AS year,

                createtime,

                weight

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 3

                AND YEAR(createtime) BETWEEN ? AND ?

        `;



        connection.query(dailyQuery, [user_id], (err, dailyResult) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



            connection.query(monthlyQuery, [user_id, currentYear], (err, monthlyResult) => {

                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                connection.query(yearlyQuery, [user_id, currentYear - 2, currentYear + 2], (err, yearlyResult) => {

                    if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                    return response.status(200).json({

                        success: true,

                        data: {

                            daily: dailyResult,

                            monthly: monthlyResult,

                            yearly: yearlyResult

                        }

                    });

                });

            });

        });

    });

};

//end





//Get Temperature Graph

const getTemperatureDataStatus = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param });

    }



    const userQuery = "SELECT active_flag FROM user_master,delete_flag WHERE user_id = ? ";

    connection.query(userQuery, [user_id], (err, result) => {

        if (err || result.length === 0 || result[0].active_flag === 0) {

            return response.status(200).json({ success: false, msg: languageMessage.userNotFound });

        }

        if (result[0]?.delete_flag == 1) {

            return response.status(200).json({ success: false, msg: languageMessage.msgUserDeleted, active_flag: 0 });

        }



        const currentYear = new Date().getFullYear();



        const dailyQuery = `

            SELECT 

                DATE(createtime) AS day,

                temperature

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 4

                AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)

        `;



        const monthlyQuery = `

            SELECT 

                MONTH(createtime) AS month,

                createtime,

                temperature

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 4

                AND YEAR(createtime) = ?

        `;



        const yearlyQuery = `

            SELECT 

                YEAR(createtime) AS year,

                createtime,

                temperature

            FROM measurement_master

            WHERE 

                user_id = ?

                AND type = 4

                AND YEAR(createtime) BETWEEN ? AND ?

        `;



        connection.query(dailyQuery, [user_id], (err, dailyResult) => {

            if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



            connection.query(monthlyQuery, [user_id, currentYear], (err, monthlyResult) => {

                if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                connection.query(yearlyQuery, [user_id, currentYear - 2, currentYear + 2], (err, yearlyResult) => {

                    if (err) return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });



                    return response.status(200).json({

                        success: true,

                        data: {

                            daily: dailyResult,

                            monthly: monthlyResult,

                            yearly: yearlyResult

                        }

                    });

                });

            });

        });

    });

};

//end





//Get Symptoms

const getSymtoms = async (request, response) => {

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

            const Query = "SELECT symptom_id, symptom_name, description, createtime FROM symptoms_master WHERE delete_flag=0";



            connection.query(Query, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });

                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



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





//Get Adverse Reaction

const getAdverseReaction = async (request, response) => {

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
            const Query = "SELECT arm.adverse_reaction_id,arm.medicine_id,mm.medicine_name, arm.dosage, arm.type, arm.symptom_id, sm.symptom_name,  arm.medication_start_date,DATE_FORMAT(arm.reaction_date,'%d %b %Y %h:%i:%s %p') reaction_date, DATE_FORMAT(arm.createtime,'%d %b %Y %h:%i:%s %p') as createtime, arm.details FROM adverse_reaction_master AS arm LEFT JOIN symptoms_master AS sm ON arm.symptom_id = sm.symptom_id LEFT JOIN medicine_master AS mm ON arm.medicine_id = mm.medicine_id WHERE arm.user_id = ? AND arm.delete_flag=0 ORDER BY arm.adverse_reaction_id DESC";

            const Values = [user_id];

            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message

                    });
                }
                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });
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





//Get Adverse Reaction Details

const getAdverseReactionById = async (request, response) => {

    const { user_id, reaction_id } = request.query;


    if (!user_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: "user_id"
        });
    }

    if (!reaction_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param,
            key: "reaction_id"

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
            const Query = "SELECT arm.adverse_reaction_id, arm.medicine_id, arm.symptom_id, sm.symptom_name, arm.type, arm.dosage, arm.medication_start_date, arm.reaction_date, arm.details, arm.createtime, arm.medicine_category_id, mcm.category_name, mm.medicine_name FROM adverse_reaction_master AS arm LEFT JOIN symptoms_master AS sm ON arm.symptom_id = sm.symptom_id LEFT JOIN medicine_master AS mm ON arm.medicine_id = mm.medicine_id LEFT JOIN medicine_category_master mcm ON arm.medicine_category_id = mcm.medicine_category_id   WHERE arm.user_id = ? AND arm.adverse_reaction_id = ?  AND arm.delete_flag=0";

            const Values = [user_id, reaction_id];

            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,

                        key: err.message

                    });
                }
                if (subResult.length == 0) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.dataNotFound
                    })
                }



                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });
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





//Get Doctors 

const getDoctors = async (request, response) => {
    const { user_id } = request.query;

    if (!user_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param
        });
    }

    const userQuery = "SELECT mobile, active_flag, otp_verify, delete_flag FROM user_master WHERE user_id = ?";
    connection.query(userQuery, [user_id], (err, result) => {
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
                msg: languageMessage.msgUserDeleted,
                active_flag: 0
            });
        }

        try {
            const checkDoctor = 'SELECT doctor_id FROM patient_master WHERE user_id = ? AND delete_flag = 0';
            connection.query(checkDoctor, [user_id], (docErr, docRes) => {
                if (docErr) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        error: docErr.message
                    });
                }

                // Extract doctor IDs
                const excludedDoctorIds = docRes.map(row => row.doctor_id);
             
                let doctorQuery = `
                    SELECT dm.doctor_id, dm.doctor_name, dm.mobile, dm.email, 
                           dm.doctor_category_id, dc.category_name AS doctor_category, 
                           dm.image, dm.createtime 
                    FROM doctor_master AS dm 
                    LEFT JOIN doctor_category AS dc ON dm.doctor_category_id = dc.doctor_category_id 
                    WHERE dm.delete_flag = 0 AND dm.approve_status = 1 AND dm.active_flag = 1 
                `;

                let queryParams = [];

                if (excludedDoctorIds.length > 0) {
                    // Exclude doctors already linked to the user
                    const placeholders = excludedDoctorIds.map(() => '?').join(', ');
                    doctorQuery += ` AND dm.doctor_id NOT IN (${placeholders})`;
                    queryParams.push(...excludedDoctorIds);
                }

           
                connection.query(doctorQuery, queryParams, (err, subResult) => {
                    if (err) {
                        return response.status(200).json({
                            success: false,
                            msg: languageMessage.internalServerError,
                            key: err.message
                        });
                    }

                    return response.status(200).json({
                        success: true,
                        msg: subResult.length > 0 ? languageMessage.dataFound : languageMessage.dataNotFound,
                        dataArray: subResult
                    });
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





//Get My Doctors

const getMyDoctors = async (request, response) => {

    const { user_id } = request.query;



    if (!user_id) {

        return response.status(200).json({

            success: false,

            msg: languageMessage.msg_empty_param

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

        try {
            const Query = "SELECT dm.doctor_id, dm.doctor_name, dm.mobile, dm.email, dm.doctor_category_id, dc.category_name AS doctor_category, dm.image, pm.createtime FROM patient_master AS pm LEFT JOIN doctor_master AS dm ON pm.doctor_id = dm.doctor_id LEFT JOIN doctor_category AS dc ON dm.doctor_category_id = dc.doctor_category_id WHERE pm.user_id = ? AND pm.delete_flag=0";

            const Values = [user_id];



            connection.query(Query, Values, async (err, subResult) => {

                if (err) {

                    return response.status(200).json({

                        success: false,

                        msg: languageMessage.internalServerError,

                        key: err.message

                    });
                }
                return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });
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




const ShareInformation = async (request, response) => {
    const { user_id,  } = request.query;

    if (!user_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
        });
    }

    const userQuery = "SELECT mobile, active_flag, otp_verify,delete_flag FROM user_master WHERE user_id = ? ";
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

        try {
            // Fetch medications and reports in parallel
            const [medications, reports1, reports2, bpData, glucoseData, ppbgsData, weightData, temperatureData, adverseReactionData] = await Promise.all([
                fetchMyMedications(user_id),
                fetchReports(user_id, 1),
                fetchReports(user_id, 2),
                getBPDataPromise(user_id),
                getFastingGlucosePromise(user_id),
                getPPBGSPromise(user_id),
                getWeightMeasurementPromise(user_id),
                getTemperaturePromise(user_id),
                getAdverseReactionPromise(user_id)
            ]);

            return response.status(200).json({
                success: true,
                msg: languageMessage.dataFound,
                data: {
                    medications: medications.length > 0 ? medications : "NA",
                    reportsLaboratory: reports1.length > 0 ? reports1 : "NA",
                    reportsPrescription: reports2.length > 0 ? reports2 : "NA",
                    bpData,
                    glucoseData,
                    ppbgsData,
                    weightData,
                    temperatureData,
                    adverseReactionData,
                }
            });

        } catch (error) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.internalServerError,
                error: error.message,
            });
        }
    });
};



const fetchMyMedications = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                mc.medication_id, 
                mc.medicine_id, 
                md.medicine_name,
                mc.dosage, 
                mc.type,
                '1=pill, 2=syrup' AS type_label,
                NULLIF(mc.instruction, '') AS instruction, 
                mc.schedule,
                '0=daily, 1=weekly, 2=monthly' AS schedule_label,
                mc.remaining_quantity,
                mc.pause_status,
                '0=Not_Paused, 1=Paused' AS pause_label
            FROM 
                medication_master AS mc 
            LEFT JOIN 
                medicine_master AS md
            ON
                mc.medicine_id = md.medicine_id
            WHERE mc.user_id = ? 
            AND mc.delete_flag=0
        `;

        connection.query(query, [user_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};



const fetchReports = (user_id, report_category_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                medical_report_id, 
                report_category_id, 
                file, 
                createtime 
            FROM 
                medical_report_master 
            WHERE 
                user_id = ? 
                AND report_category_id = ? 
                AND delete_flag=0
        `;

        connection.query(query, [user_id, report_category_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Promise function to get BP Data
const getBPDataPromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT measurement_id, systolic_bp, diastolic_bp, pulse, createtime FROM measurement_master WHERE user_id = ? AND type = 0 AND delete_flag=0";
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};

// Promise function to get Fasting Glucose
const getFastingGlucosePromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT measurement_id, fasting_glucose, createtime FROM measurement_master WHERE user_id = ? AND type = 1 AND delete_flag=0";
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};

// Promise function to get PPBGS
const getPPBGSPromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT measurement_id, ppbgs, createtime FROM measurement_master WHERE user_id = ? AND type = 2 AND delete_flag=0";
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};

// Promise function to get Weight Measurement
const getWeightMeasurementPromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT measurement_id, weight, createtime FROM measurement_master WHERE user_id = ? AND type = 3 AND delete_flag=0";
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};

// Promise function to get Temperature Measurement
const getTemperaturePromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT measurement_id, temperature, createtime FROM measurement_master WHERE user_id = ? AND type = 4 AND delete_flag=0";
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};

// Get Adverse Reaction Data
const getAdverseReactionPromise = (user_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT arm.adverse_reaction_id, arm.medicine_id, sm.symptom_name, arm.dosage, 
                   arm.medication_start_date, arm.reaction_date, arm.details, arm.createtime 
            FROM adverse_reaction_master AS arm
            LEFT JOIN symptoms_master AS sm ON arm.symptom_id = sm.symptom_id
            LEFT JOIN medicine_master AS mm ON arm.medicine_id = mm.medicine_id
            WHERE arm.user_id = ? AND arm.delete_flag = 0
        `;
        connection.query(query, [user_id], (err, result) => {
            if (err) return reject({ success: false, msg: languageMessage.internalServerError, key: err.message });
            resolve(result);
        });
    });
};



const getDisease = async (request, response) => {
    const query1 = `

        SELECT 
        disease_id, disease_name, description, createtime
        FROM 
        disease_master
        WHERE delete_flag=0`;



    connection.query(query1, async (err, subResult) => {



        if (err) {

            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: err.message });

        }



        if (subResult.length === 0) {

            return response.status(200).json({ success: true, msg: languageMessage.dataNotFound, dataArray: "NA" });

        }

        subResult.map((item) => {
            item.status = false
        })


        return response.status(200).json({ success: true, msg: languageMessage.dataFound, dataArray: subResult });



    });

}



const getFaq = async (request, response) => {

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

            const Query = "SELECT faq_id ,question,answer FROM faq_master WHERE delete_flag = 0  AND user_type = 1 ORDER BY faq_id DESC";
            connection.query(Query, async (err, faq) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        key: err.message
                    });
                }
                if (faq.length <= 0) {
                    return response.status(200).json({ success: true, msg: languageMessage.dataNotFound, faq: "NA" })
                }
                faq.map((item) => {
                    item.status = false;
                })
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, faq })
            })
        } catch (error) {

            return response.status(200).json({

                success: false,

                msg: languageMessage.internalServerError,

                error: error.message

            });

        }

    });

};


//  new api - get reports by category wise 
const getDocumentsByReportCategory = async ( request, response) =>{
    const { user_id} = request.query;
    try{
         if(!user_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key:'user_id'});
         }
         const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ?  AND delete_flag = 0';
         connection.query(checkUser, [user_id], async(err, res) =>{
            if(err){
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message});
            }

            if(res.length == 0){
                return response.status(200).json({ success: false, msg: languageMessage.userNotFound})
            }

            if(res[0].active_flag == 0){
                return response.status(200).json({ successs : false, msg: languageMessage.msgAccountdeactivated, active_flag : 0});
            }
        const sql = 'SELECT report_category_id FROM medical_report_master WHERE user_id =? AND delete_flag =0';
        connection.query(sql, [user_id], async(err1, res1) =>{
            if(err1){
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message});
            }

            if(res1.length == 0){
                return response.status(200).json({ success: false, msg: languageMessage.dataNotFound});
            }

            let report_category_ids = [...new Set(res1.map(item => item.report_category_id))];
               let document_arr = [];
            for (const categoryId of report_category_ids) {
                let document_count = await getDocumentCountByCategory(categoryId, user_id);
                let category_name = await getReportCategoryName(categoryId);
                
       document_arr.push({
      
        report_category_id : categoryId, 
        category_name : category_name, 
        total_items : document_count, 
       })
  }            
  return response.status(200).json({ success : true, msg: languageMessage.msgDataFound, document_arr : document_arr})
        })  
         })
    }
    catch(error){
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, key: error.message})
    }
}
async function getDocumentCountByCategory(categoryId, user_id) {
    return new Promise(( resolve, reject) =>{
        const sql = 'SELECT COUNT(medical_report_id) AS total_count FROM medical_report_master WHERE report_category_id = ? AND user_id = ? AND delete_flag = 0';
        connection.query(sql, [categoryId, user_id], async(err, res) =>{
            if(err){
                return reject(err);
            }
            if(res.length == 0){
                resolve(0);
            }
            else{
                resolve(res[0].total_count)
            }
        });
    });
}
async function getReportCategoryName(categoryId) {
return new Promise(( resolve, reject) =>{
    const sql = 'SELECT category_name FROM report_category WHERE report_category_id  = ? AND delete_flag = 0';
    connection.query(sql, [categoryId], async(err, res) =>{
        if(err){
           return reject(err);
        }
        if(res.length == 0){
            resolve('NA');
        }
        else{
            resolve(res[0].category_name);
        }
    });
});
}
async function getDocumentFileSizeByCategory(category_id, user_id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT file_size 
        FROM medical_report_master 
        WHERE user_id = ? 
          AND report_category_id = ? 
          AND delete_flag = 0
      `;
  
      connection.query(sql, [user_id, category_id], (err, results) => {
        if (err) return reject(err);
  
        if (!results || results.length === 0) {
          return resolve(0.00); // No files → 0 MB
        }
  
        //  Sum all bytes
        let totalBytes = 0;
        for (let data of results) {
          totalBytes += parseFloat(data.file_size) || 0; // ensure number
        }
  
        //     Convert bytes → MB
        let totalMB = totalBytes / (1024 * 1024);
  
        //  If 0, return 0; else round to 2 decimals
        totalMB = totalMB === 0 ? 0 : parseFloat(totalMB.toFixed(2));
  
        resolve(totalMB);
      });
    });
  }
  


// get bp data graph
const getBPDataStats = async (request, response) => {
    const { user_id, type, language_code } = request.query;
    const timezone =
        request.headers['x-timezone'] ||
        request.query.timezone ||
        'UTC';
    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
    }
    if (!type) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'type' });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    const userQuery = "SELECT active_flag, delete_flag FROM user_master WHERE user_id = ?";
    connection.query(userQuery, [user_id], (err, result) => {
        if (err || result.length === 0 || result[0].active_flag === 0) {
            return response.status(200).json({ success: false, msg: request.__('user_not_found') });
        }
        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });
        }

        // SQL Queries
        const weeklyQuery = `
            SELECT createtime, systolic_bp, diastolic_bp, pulse, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 0 AND delete_flag = 0
            AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)
          ORDER BY createtime DESC
        `;

        const monthlyQuery = `
            SELECT createtime, systolic_bp, diastolic_bp, pulse, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 0 AND delete_flag = 0
            AND MONTH(createtime) = MONTH(CURDATE()) 
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const yearlyQuery = `
            SELECT createtime, systolic_bp, diastolic_bp, pulse, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 0 AND delete_flag = 0
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const todayQuery = `
            SELECT systolic_bp, diastolic_bp, pulse, createtime, measurement_id
            FROM measurement_master
            WHERE user_id = ? AND type = 0 AND delete_flag = 0
            ORDER BY createtime DESC
        `;

        // Fetch today's data first
        connection.query(todayQuery, [user_id], (err, todayResult) => {
            if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

            const todayData = (() => {
                if (todayResult.length === 0) return [];
            
                return todayResult.map(row => {
                    // let new_createtime = new Date(new Date(row.createtime).getTime() + 2 * 60 * 60 * 1000);
                    // Add 5:30 offset
            
                    return {
                        measurement_id: row.measurement_id,
                        systolic_bp: row.systolic_bp,
                        diastolic_bp: row.diastolic_bp,
                        pulse: row.pulse == 0 ? 'NA' : row.pulse,
                        //date: moment.utc(row.createtime).tz(timezone).format("MMMM DD, YYYY"),
                        //time: moment.utc(row.createtime).tz(timezone).format("hh:mm A")
                        date: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("MMMM DD, YYYY"),

                        time: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("hh:mm A")
                    };
                });
            })();
            
            // Fetch weekly, monthly, yearly
            connection.query(weeklyQuery, [user_id], (err, weeklyResult) => {
                if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                connection.query(monthlyQuery, [user_id], (err, monthlyResult) => {
                    if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                    connection.query(yearlyQuery, [user_id], (err, yearlyResult) => {
                        if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                        // Transform data with proper averaging
                        const weeklyData = transformWeeklyData(weeklyResult, timezone, finalLanguage);
                        const monthlyData = transformMonthlyData(monthlyResult);
                        const yearlyData = transformYearlyData(yearlyResult,finalLanguage);

                        let filteredData = {};

                        if (type == 1) {
                            filteredData.weekly = weeklyData;
                        } else if (type == 2) {
                            filteredData.monthly = monthlyData;
                        } else if (type == 3) {
                            filteredData.yearly = yearlyData;
                        } else {
                            filteredData = {
                                weekly: weeklyData,
                                monthly: monthlyData,
                                yearly: yearlyData
                            };
                        }

                        // Always include today's reading
                        filteredData.today = todayData;

                        return response.status(200).json({
                            success: true,
                            data: filteredData
                        });
                    });
                });
            });
        });
    });
};

// Group raw readings by day or month, then average
function groupByDateAndAverage(rawData, type = 'daily') {
    const grouped = {};

    rawData.forEach(row => {
        const d = new Date(row.createtime || row.day);
        let key;
        
        if (type === 'yearly') {
            key = d.getMonth(); // 0-11 for months
        } else {
            key = d.toDateString(); // group by exact day
        }
        
        if (!grouped[key]) {
            grouped[key] = { systolicSum: 0, diastolicSum: 0, pulseSum: 0, count: 0, date: d };
        }

        grouped[key].systolicSum += row.systolic_bp;
        grouped[key].diastolicSum += row.diastolic_bp;
        grouped[key].pulseSum += row.pulse;
        grouped[key].count++;
    });

    // Compute average for each bucket
    const averaged = {};
    for (let key in grouped) {
        const g = grouped[key];
        averaged[key] = {
            date: g.date,
            systolic_bp: parseInt(g.systolicSum / g.count),
            diastolic_bp: parseInt(g.diastolicSum / g.count),
            pulse: parseInt(g.pulseSum / g.count)
        };
    }
    return averaged;
}
// WEEKLY TRANSFORMATION
function transformWeeklyData(rawData, timezone, finalLanguage) {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const averaged = groupByDateAndAverage(rawData); // avg per day

    // Get current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    // Build full week with dates
    let weekly = [];
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const key = currentDate.toDateString();

        // FIX: use currentDate instead of row
        const formattedDay = moment(currentDate)
            .tz(timezone)
            .locale(finalLanguage)
            .format("DD MMM");

        if (averaged[key]) {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                systolic_bp: averaged[key].systolic_bp,
                diastolic_bp: averaged[key].diastolic_bp,
                pulse: averaged[key].pulse
            });
        } else {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                systolic_bp: 0,
                diastolic_bp: 0,
                pulse: 0
            });
        }
    }

    const averages = calcAverage(weekly);
    return {
        average_systolic: averages.avgSys,
        average_diastolic: averages.avgDia,
        average_pulse: averages.avgPulse,
        records: weekly
    };
}

// MONTHLY TRANSFORMATION
function transformMonthlyData(rawData) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShortName = today.toLocaleString('en-US', { month: 'short' }); // e.g., "Aug"

    const averaged = groupByDateAndAverage(rawData);

    let monthly = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const key = dateObj.toDateString();

        // Always 2-digit day format
        const dayNumber = i.toString().padStart(2, '0');

        // First day format: '01 Aug', rest: '02', '03', etc.
        const dayLabel = i === 1 ? `${dayNumber}` : dayNumber;

        monthly.push({
            day: dayLabel,
            systolic_bp: averaged[key]?.systolic_bp || 0,
            diastolic_bp: averaged[key]?.diastolic_bp || 0,
            pulse: averaged[key]?.pulse || 0
        });
    }

    const averages = calcAverage(monthly);
    return {
        average_systolic: averages.avgSys,
        average_diastolic: averages.avgDia,
        average_pulse: averages.avgPulse,
        records: monthly
    };
}

// YEARLY TRANSFORMATION
// function transformYearlyData(rawData) {
//     const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

//     const averaged = groupByDateAndAverage(rawData, 'yearly');

//     let yearly = months.map((m, idx) => {
//         const found = Object.keys(averaged).find(k => parseInt(k) === idx);
//         if (found !== undefined) {
//             return {
//                 day: months[idx],
//                 systolic_bp: averaged[found].systolic_bp,
//                 diastolic_bp: averaged[found].diastolic_bp,
//                 pulse: averaged[found].pulse
//             };
//         }
//         return { day: months[idx], systolic_bp: 0, diastolic_bp: 0, pulse: 0 };
//     });

//     const averages = calcAverage(yearly);
//     return {
//         average_systolic: averages.avgSys,
//         average_diastolic: averages.avgDia,
//         average_pulse: averages.avgPulse,
//         records: yearly
//     };
// }

function transformYearlyData(rawData, finalLanguage) {
    const averaged = groupByDateAndAverage(rawData, 'yearly');

    let yearly = [];

    for (let idx = 0; idx < 12; idx++) {

        // SAFE: generate month using moment
        const monthLabel = moment()
            .month(idx)
            .locale(finalLanguage || "en")
            .format("MMM");  // Jan / يناير / janv.

        const found = Object.keys(averaged).find(k => parseInt(k) === idx);

        if (found !== undefined) {
            yearly.push({
                day: monthLabel,
                systolic_bp: averaged[found].systolic_bp,
                diastolic_bp: averaged[found].diastolic_bp,
                pulse: averaged[found].pulse
            });
        } else {
            yearly.push({
                day: monthLabel,
                systolic_bp: 0,
                diastolic_bp: 0,
                pulse: 0
            });
        }
    }

    const averages = calcAverage(yearly);

    return {
        average_systolic: averages.avgSys,
        average_diastolic: averages.avgDia,
        average_pulse: averages.avgPulse,
        records: yearly
    };
}
// Utility: Calculate overall average for a list of records
function calcAverage(records) {
    let totalSys = 0, totalDia = 0, totalPulse = 0, count = 0;

    records.forEach(r => {
        if (r.systolic_bp > 0 || r.diastolic_bp > 0 || r.pulse > 0) {
            totalSys += r.systolic_bp;
            totalDia += r.diastolic_bp;
            totalPulse += r.pulse;
            count++;
        }
    });
    return {
        avgSys: count > 0 ? parseInt(totalSys / count) : 0,
        avgDia: count > 0 ? parseInt(totalDia / count) : 0,
        avgPulse: count > 0 ? parseInt(totalPulse / count) : 0
    };
}
//  bp data graph api end..



const getTemperatureDataStats = async (request, response) => {
    const { user_id, type, language_code } = request.query;
    
     const timezone =
        request.headers['x-timezone'] ||
        request.query.timezone ||
        'UTC';

    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
    }
    if (!type) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'type' });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    const userQuery = "SELECT active_flag, delete_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
    connection.query(userQuery, [user_id], (err, result) => {
        if (err || result.length === 0 || result[0].active_flag === 0) {
            return response.status(200).json({ success: false, msg: request.__('user_not_found') });
        }

        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });
        }

        // SQL Queries
        const weeklyQuery = `
            SELECT createtime, temperature, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 4 AND delete_flag = 0
            AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)
            ORDER BY createtime DESC
        `;

        const monthlyQuery = `
            SELECT createtime, temperature, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 4 AND delete_flag = 0
            AND MONTH(createtime) = MONTH(CURDATE()) 
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const yearlyQuery = `
            SELECT createtime, temperature, measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 4 AND delete_flag = 0
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const todayQuery = `
            SELECT createtime, temperature, measurement_id
            FROM measurement_master
            WHERE user_id = ? AND type = 4 AND delete_flag = 0
            ORDER BY createtime DESC
        `;


        // Fetch today's data
        connection.query(todayQuery, [user_id], (err, todayResult) => {
            if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

            const todayData = todayResult.map(row => ({
                    measurement_id: row.measurement_id,
                    temperature: row.temperature ?? 0,
                    //date: moment.utc(row.createtime).tz(timezone).format("MMMM DD, YYYY"),
                    //time: moment.utc(row.createtime).tz(timezone).format("hh:mm A")
                    date: moment.utc(row.createtime)
                    .tz(timezone)
                    .locale(finalLanguage)
                    .format("MMMM DD, YYYY"),

                    time: moment.utc(row.createtime)
                    .tz(timezone)
                    .locale(finalLanguage)
                    .format("hh:mm A")
                }));

            // Weekly data
            connection.query(weeklyQuery, [user_id], (err, weeklyResult) => {
                if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                // Monthly data
                connection.query(monthlyQuery, [user_id], (err, monthlyResult) => {
                    if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                    // Yearly data
                    connection.query(yearlyQuery, [user_id], (err, yearlyResult) => {
                        if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                        // Transform data for graphs
                        const weeklyData = transformWeeklyTemperatureData(weeklyResult || [], timezone, finalLanguage);
                        const monthlyData = transformMonthlyTemperatureData(monthlyResult || []);
                        const yearlyData = transformYearlyTemperatureData(yearlyResult || [], finalLanguage);

                        let filteredData = {};

                        if (type == 1) filteredData.weekly = weeklyData;
                        else if (type == 2) filteredData.monthly = monthlyData;
                        else if (type == 3) filteredData.yearly = yearlyData;
                        else {
                            filteredData = {
                                weekly: weeklyData,
                                monthly: monthlyData,
                                yearly: yearlyData
                            };
                        }

                        filteredData.today = todayData;

                        return response.status(200).json({
                            success: true,
                            data: filteredData
                        });
                    });
                });
            });
        });
    });
};

//  delete doctor api 
const deleteDoctor = async( request, response) =>{
    const { user_id, doctor_id, language_code} = request.body;
    try{
        if(!user_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key :'user_id'});
        }

        if(!doctor_id){
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key:'doctor_id'});
        }

        const finalLanguage = language_code && language_code.trim() !== ""
            ? language_code
            : await getUserLanguage({ user_id });

        request.setLocale(finalLanguage);

        const sql = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id], async(err, res) =>{
            if(err){
                return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message});
            }
            if(res.length == 0){
                return response.status(200).json({ success: false, msg: request.__('data_not_found') })
            }

            if(res[0].active_flag == 0){
                return response.status(200).json({ success: false, msg: request.__('your_account_has_been_deactivated'), active_flag : 0});
            }

        const sql = 'SELECT doctor_id, user_id FROM patient_master WHERE user_id = ? AND doctor_id = ? AND delete_flag = 0';
        connection.query(sql, [user_id, doctor_id], async(err1, res1) =>{
            if(err1){
                return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err1.message});
            }

            if(res1.length > 0){
                const update = 'UPDATE patient_master SET delete_flag = 1, updatetime = NOW() WHERE user_id = ? AND doctor_id = ?';
                connection.query(update, [user_id, doctor_id], async(err2, res2) =>{
                    if(err1){
                        return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err1.message});
                    }
                    if(res2.affectedRows > 0){
                        return response.status(200).json({ success: true, msg : request.__('doctor_deleted_successfully') });
                    }
                    else{
                        return response.status(200).json({ success: false, msg: request.__('doctor_has_not_been_deleted_please_try_again') });
                    }
                })
            }
            else{
                return response.status(200).json({ success: false, msg: request.__('data_not_found') });
            }
        })
        })
    }
    catch(error){
        return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: error.message});
    }
}
// delete doctor end 



// Fasting Glucose API with Weekly/Monthly/Yearly Breakdown
const getFastingGlucoseDataStats = async (request, response) => {
    const { user_id, type, language_code } = request.query;
    
    const timezone =
        request.headers['x-timezone'] ||
        request.query.timezone ||
        'UTC';

    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
    }
    if (!type) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'type' });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    const userQuery = "SELECT active_flag, delete_flag FROM user_master WHERE user_id = ?";
    connection.query(userQuery, [user_id], (err, result) => {
        if (err || result.length === 0 || result[0].active_flag === 0) {
            return response.status(200).json({ success: false, msg: request.__('user_not_found') });
        }
        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });
        }

        // Queries
        const weeklyQuery = `
            SELECT createtime, fasting_glucose, measurement_id 
            FROM measurement_master 
            WHERE user_id = ? AND type = 1 AND delete_flag = 0
            AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)
            ORDER BY createtime DESC
        `;

        const monthlyQuery = `
            SELECT createtime, fasting_glucose, measurement_id 
            FROM measurement_master 
            WHERE user_id = ? AND type = 1  AND delete_flag = 0
            AND MONTH(createtime) = MONTH(CURDATE()) 
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const yearlyQuery = `
            SELECT createtime, fasting_glucose, measurement_id 
            FROM measurement_master 
            WHERE user_id = ? AND type = 1  AND delete_flag = 0
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const todayQuery = `
            SELECT createtime, fasting_glucose, measurement_id
            FROM measurement_master
            WHERE user_id = ? AND type = 1 AND delete_flag = 0
            ORDER BY createtime DESC
        `;

        connection.query(todayQuery, [user_id], (err, todayResult) => {
            if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

            const todayData = (() => {
                if (todayResult.length === 0) return [];
            
                return todayResult.map(row => {
                    // let new_createtime = new Date(new Date(row.createtime).getTime() + 2 * 60 * 60 * 1000);
            
                    return {
                        measurement_id: row.measurement_id,
                        fasting_glucose: row.fasting_glucose,
                        //date: moment.utc(row.createtime).tz(timezone).format("MMMM DD, YYYY"),
                        //time: moment.utc(row.createtime).tz(timezone).format("hh:mm A")
                        date: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("MMMM DD, YYYY"),

                        time: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("hh:mm A")
                    };
                });
            })();
            
            connection.query(weeklyQuery, [user_id], (err, weeklyResult) => {
                if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                connection.query(monthlyQuery, [user_id], (err, monthlyResult) => {
                    if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                    connection.query(yearlyQuery, [user_id], (err, yearlyResult) => {
                        if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                        const weeklyData = transformWeeklyGlucoseData(weeklyResult, timezone, finalLanguage);
                        const monthlyData = transformMonthlyGlucoseData(monthlyResult);
                        const yearlyData = transformYearlyGlucoseData(yearlyResult,finalLanguage);

                        let filteredData = {};

                        if (type == 1) {
                            filteredData.weekly = weeklyData;
                        } else if (type == 2) {
                            filteredData.monthly = monthlyData;
                        } else if (type == 3) {
                            filteredData.yearly = yearlyData;
                        } else {
                            filteredData = {
                                weekly: weeklyData,
                                monthly: monthlyData,
                                yearly: yearlyData
                            };
                        }

                        filteredData.today = todayData;

                        return response.status(200).json({
                            success: true,
                            data: filteredData
                        });
                    });
                });
            });
        });
    });
};

// ===== GROUPING & AVERAGING HELPER =====
function groupGlucoseByDate(rawData, type = 'daily') {
    const grouped = {};

    rawData.forEach(row => {
        const d = new Date(row.createtime);
        let key;

        if (type === 'yearly') {
            key = d.getMonth(); // month index
        } else {
            key = d.toDateString(); // day
        }

        if (!grouped[key]) {
            grouped[key] = { sum: 0, count: 0, date: d };
        }

        grouped[key].sum += row.fasting_glucose;
        grouped[key].count++;
    });

    const averaged = {};
    for (let key in grouped) {
        const g = grouped[key];
        averaged[key] = {
            date: g.date,
            fasting_glucose: parseInt(g.sum / g.count)
        };
    }
    return averaged;
}
// ===== Weekly Transformation =====
function transformWeeklyGlucoseData(rawData, timezone, finalLanguage) {
    const averaged = groupGlucoseByDate(rawData); // grouped by toDateString()

    // Get current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    let weekly = [];
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const key = currentDate.toDateString(); // match with grouped keys

        // FIX: use currentDate instead of row
        const formattedDay = moment(currentDate)
            .tz(timezone)
            .locale(finalLanguage)
            .format("DD MMM");

        if (averaged[key]) {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                fasting_glucose: averaged[key].fasting_glucose
            });
        } else {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                fasting_glucose: 0
            });
        }
    }

    const avg = calcGlucoseAverage(weekly);
    return {
        average_fasting_glucose: avg,
        records: weekly
    };
}

// ===== Monthly Transformation =====
function transformMonthlyGlucoseData(rawData) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShortName = today.toLocaleString('en-US', { month: 'short' }); // e.g., "Aug"

    const averaged = groupGlucoseByDate(rawData);

    let monthly = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const key = dateObj.toDateString();

        // Format day as two digits
        const dayNumber = i.toString().padStart(2, '0');
        // Use "01 Aug" for the first day, "02", "03", etc. for others
        const dayLabel = i === 1 ? `${dayNumber}` : dayNumber;

        monthly.push({
            day: dayLabel,
            fasting_glucose: averaged[key]?.fasting_glucose || 0
        });
    }

    const avg = calcGlucoseAverage(monthly);
    return {
        average_fasting_glucose: avg,
        records: monthly
    };
}

// ===== Yearly Transformation =====
// function transformYearlyGlucoseData(rawData) {
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     const averaged = groupGlucoseByDate(rawData, 'yearly');

//     let yearly = months.map((m, idx) => {
//         const found = Object.keys(averaged).find(k => parseInt(k) === idx);
//         if (found !== undefined) {
//             return {
//                 day: months[idx],
//                 fasting_glucose: averaged[found].fasting_glucose
//             };
//         }
//         return { day: months[idx], fasting_glucose: 0 };
//     });

//     const avg = calcGlucoseAverage(yearly);
//     return {
//         average_fasting_glucose: avg,
//         records: yearly
//     };
// }
function transformYearlyGlucoseData(rawData, finalLanguage) {

    const averaged = groupGlucoseByDate(rawData, 'yearly');

    let yearly = [];

    for (let idx = 0; idx < 12; idx++) {

        // Multilingual month label (SAFE)
        const monthLabel = moment()
            .month(idx)
            .locale(finalLanguage || "en")
            .format("MMM");

        const found = Object.keys(averaged).find(k => parseInt(k) === idx);

        if (found !== undefined) {
            yearly.push({
                day: monthLabel,
                fasting_glucose: averaged[found].fasting_glucose
            });
        } else {
            yearly.push({
                day: monthLabel,
                fasting_glucose: 0
            });
        }
    }

    const avg = calcGlucoseAverage(yearly);

    return {
        average_fasting_glucose: avg,
        records: yearly
    };
}
// ===== Glucose Average Utility =====
function calcGlucoseAverage(records) {
    let total = 0, count = 0;

    records.forEach(r => {
        if (r.fasting_glucose > 0) {
            total += r.fasting_glucose;
            count++;
        }
    });

    return count > 0 ? parseInt(total / count) : 0;
}

//  Fasting Glucose Graph API End 





//  get ppbgs data stats graph new api...
const getPPBGSDataStats = async (request, response) => {
    const { user_id, type, language_code } = request.query;
    
    const timezone =
        request.headers['x-timezone'] ||
        request.query.timezone ||
        'UTC';

    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
    }
    if (!type) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'type' });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    const userQuery = "SELECT active_flag, delete_flag FROM user_master WHERE user_id = ?";
    connection.query(userQuery, [user_id], (err, result) => {
        if (err || result.length === 0 || result[0].active_flag === 0) {
            return response.status(200).json({ success: false, msg: request.__('user_not_found') });
        }
        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({ success: false, msg: request.__('your_account_is_not_registered_with_us'), active_flag: 0 });
        }

        // Queries
        const weeklyQuery = `
            SELECT createtime, ppbgs,measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 2 AND delete_flag = 0
            AND YEARWEEK(createtime, 1) = YEARWEEK(CURDATE(), 1)
            ORDER BY createtime DESC
        `;

        const monthlyQuery = `
            SELECT createtime, ppbgs,measurement_id
            FROM measurement_master 
            WHERE user_id = ? AND type = 2 AND delete_flag = 0
            AND MONTH(createtime) = MONTH(CURDATE()) 
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const yearlyQuery = `
            SELECT createtime, ppbgs, measurement_id
            FROM measurement_master  
            WHERE user_id = ? AND type = 2 AND delete_flag = 0
            AND YEAR(createtime) = YEAR(CURDATE())
            ORDER BY createtime DESC
        `;

        const todayQuery = `
            SELECT createtime, ppbgs, measurement_id
            FROM measurement_master
            WHERE user_id = ? AND type = 2 AND delete_flag = 0
            ORDER BY createtime DESC
        `;

        // Get Today's Data
        connection.query(todayQuery, [user_id], (err, todayResult) => {
            if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

            const todayData = (() => {
                if (todayResult.length === 0) return [];
            
                return todayResult.map(row => {
                    // let new_createtime = new Date(new Date(row.createtime).getTime() + 2 * 60 * 60 * 1000);
            
                    return {
                        measurement_id: row.measurement_id,
                        ppbgs: row.ppbgs,
                        //date: moment.utc(row.createtime).tz(timezone).format("MMMM DD, YYYY"),
                        //time: moment.utc(row.createtime).tz(timezone).format("hh:mm A")
                        date: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("MMMM DD, YYYY"),

                        time: moment.utc(row.createtime)
                        .tz(timezone)
                        .locale(finalLanguage)
                        .format("hh:mm A")
                    };
                });
            })();
            
            
            // Weekly Data
            connection.query(weeklyQuery, [user_id], (err, weeklyResult) => {
                if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                // Monthly Data
                connection.query(monthlyQuery, [user_id], (err, monthlyResult) => {
                    if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                    // Yearly Data
                    connection.query(yearlyQuery, [user_id], (err, yearlyResult) => {
                        if (err) return response.status(200).json({ success: false, msg: request.__('internal_server_error'), error: err.message });

                        const weeklyData = transformWeeklyPPBGSData(weeklyResult, timezone, finalLanguage);
                        const monthlyData = transformMonthlyPPBGSData(monthlyResult);
                        const yearlyData = transformYearlyPPBGSData(yearlyResult,finalLanguage);

                        let filteredData = {};

                        if (type == 1) {
                            filteredData.weekly = weeklyData;
                        } else if (type == 2) {
                            filteredData.monthly = monthlyData;
                        } else if (type == 3) {
                            filteredData.yearly = yearlyData;
                        } else {
                            filteredData = {
                                weekly: weeklyData,
                                monthly: monthlyData,
                                yearly: yearlyData
                            };
                        }

                        filteredData.today = todayData;

                        return response.status(200).json({
                            success: true,
                            data: filteredData
                        });
                    });
                });
            });
        });
    });
};

// ===== Grouping & Averaging Helper (Same logic as glucose) =====
function groupPPBGSByDate(rawData, type = 'daily') {
    const grouped = {};

    rawData.forEach(row => {
        const d = new Date(row.createtime);
        let key;

        if (type === 'yearly') {
            key = d.getMonth(); // month index
        } else {
            key = d.toDateString(); // day
        }

        if (!grouped[key]) {
            grouped[key] = { sum: 0, count: 0, date: d };
        }

        grouped[key].sum += row.ppbgs;
        grouped[key].count++;
    });

    const averaged = {};
    for (let key in grouped) {
        const g = grouped[key];
        averaged[key] = {
            date: g.date,
            ppbgs: parseInt(g.sum / g.count)
        };
    }
    return averaged;
}
// ===== Weekly Transformation =====
function transformWeeklyPPBGSData(rawData, timezone, finalLanguage) {
    const averaged = groupPPBGSByDate(rawData); // keys should be toDateString()

    // Get Monday of current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    let weekly = [];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const key = currentDate.toDateString(); // match with group keys

        // FIX: use currentDate instead of row
        const formattedDay = moment(currentDate)
            .tz(timezone)
            .locale(finalLanguage)
            .format("DD MMM");

        if (averaged[key]) {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                ppbgs: averaged[key].ppbgs
            });
        } else {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                ppbgs: 0
            });
        }
    }

    const avg = calcPPBGSAverage(weekly);
    return {
        average_ppbgs: avg,
        records: weekly
    };
}


// ===== Monthly Transformation =====
function transformMonthlyPPBGSData(rawData) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShortName = today.toLocaleString('en-US', { month: 'short' }); // e.g., "Aug"

    const averaged = groupPPBGSByDate(rawData);

    let monthly = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const key = dateObj.toDateString();

        const dayNumber = i.toString().padStart(2, '0');
        const dayLabel = i === 1 ? `${dayNumber}` : dayNumber;

        monthly.push({
            day: dayLabel,
            ppbgs: averaged[key]?.ppbgs || 0
        });
    }

    const avg = calcPPBGSAverage(monthly);
    return {
        average_ppbgs: avg,
        records: monthly
    };
}

// ===== Yearly Transformation =====
// function transformYearlyPPBGSData(rawData) {
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     const averaged = groupPPBGSByDate(rawData, 'yearly');

//     let yearly = months.map((m, idx) => {
//         const found = Object.keys(averaged).find(k => parseInt(k) === idx);
//         if (found !== undefined) {
//             return {
//                 day: months[idx],
//                 ppbgs: averaged[found].ppbgs
//             };
//         }
//         return { day: months[idx], ppbgs: 0 };
//     });

//     const avg = calcPPBGSAverage(yearly);
//     return {
//         average_ppbgs: avg,
//         records: yearly
//     };
// }
function transformYearlyPPBGSData(rawData, finalLanguage) {

    const averaged = groupPPBGSByDate(rawData, 'yearly');

    let yearly = [];

    for (let idx = 0; idx < 12; idx++) {

        // Multilingual month label (SAFE)
        const monthLabel = moment()
            .month(idx)
            .locale(finalLanguage || "en")
            .format("MMM");

        const found = Object.keys(averaged).find(k => parseInt(k) === idx);

        if (found !== undefined) {
            yearly.push({
                day: monthLabel,
                ppbgs: averaged[found].ppbgs
            });
        } else {
            yearly.push({
                day: monthLabel,
                ppbgs: 0
            });
        }
    }

    const avg = calcPPBGSAverage(yearly);

    return {
        average_ppbgs: avg,
        records: yearly
    };
}

// ===== PPBGS Average Utility =====
function calcPPBGSAverage(records) {
    let total = 0, count = 0;

    records.forEach(r => {
        if (r.ppbgs > 0) {
            total += r.ppbgs;
            count++;
        }
    });

    return count > 0 ? parseInt(total / count) : 0;
}

//  ppbgs data graph api end 




//  get weight graph api 
const getWeightMeasurementDataStats = async (request, response) => {
    const { user_id, type, language_code } = request.query;

    // ✅ Read device timezone (fallback to UTC)
    const timezone =
        request.headers['x-timezone'] ||
        request.query.timezone ||
        'UTC';

    if (!user_id) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: 'user_id'
        });
    }

    if (!type) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.msg_empty_param,
            key: 'type'
        });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    request.setLocale(finalLanguage);

    const userQuery = `
        SELECT active_flag, delete_flag
        FROM user_master
        WHERE user_id = ? AND delete_flag = 0
    `;

    connection.query(userQuery, [user_id], (err, result) => {
        if (err || result.length === 0 || result[0].active_flag === 0) {
            return response.status(200).json({
                success: false,
                msg: request.__('user_not_found')
            });
        }

        if (result[0]?.delete_flag == 1) {
            return response.status(200).json({
                success: false,
                msg: request.__('your_account_is_not_registered_with_us'),
                active_flag: 0
            });
        }

        /* -------------------------------------------------
           ✅ TIME RANGES (DEVICE TZ → UTC)
        ------------------------------------------------- */

        const todayStartUTC = moment().tz(timezone).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
        const todayEndUTC   = moment().tz(timezone).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');

        const weekStartUTC  = moment().tz(timezone).startOf('week').utc().format('YYYY-MM-DD HH:mm:ss');
        const weekEndUTC    = moment().tz(timezone).endOf('week').utc().format('YYYY-MM-DD HH:mm:ss');

        const monthStartUTC = moment().tz(timezone).startOf('month').utc().format('YYYY-MM-DD HH:mm:ss');
        const monthEndUTC   = moment().tz(timezone).endOf('month').utc().format('YYYY-MM-DD HH:mm:ss');

        const yearStartUTC  = moment().tz(timezone).startOf('year').utc().format('YYYY-MM-DD HH:mm:ss');
        const yearEndUTC    = moment().tz(timezone).endOf('year').utc().format('YYYY-MM-DD HH:mm:ss');

        /* -------------------------------------------------
           ✅ QUERIES (UTC SAFE)
        ------------------------------------------------- */

        const todayQuery = `
            SELECT createtime, weight, measurement_id
            FROM measurement_master
            WHERE user_id = ?
              AND type = 3
              AND delete_flag = 0
            ORDER BY createtime DESC
        `;


        const weeklyQuery = `
            SELECT createtime, weight, measurement_id
            FROM measurement_master
            WHERE user_id = ?
              AND type = 3
              AND delete_flag = 0
              AND createtime BETWEEN ? AND ?
            ORDER BY createtime DESC
        `;

        const monthlyQuery = weeklyQuery;
        const yearlyQuery  = weeklyQuery;

        /* -------------------------------------------------
           ✅ TODAY DATA (UTC → DEVICE TIME)
        ------------------------------------------------- */

        connection.query(
            todayQuery,
            [user_id],
            (err, todayResult) => {
                if (err) {
                    return response.status(200).json({
                        success: false,
                        msg: request.__('internal_server_error'),
                        error: err.message
                    });
                }

                const todayData = todayResult.map(row => ({
                    measurement_id: row.measurement_id,
                    weight: row.weight,
                    //date: moment.utc(row.createtime).tz(timezone).format("MMMM DD, YYYY"),
                    //time: moment.utc(row.createtime).tz(timezone).format("hh:mm A")
                    date: moment.utc(row.createtime)
                    .tz(timezone)
                    .locale(finalLanguage)
                    .format("MMMM DD, YYYY"),

                    time: moment.utc(row.createtime)
                    .tz(timezone)
                    .locale(finalLanguage)
                    .format("hh:mm A")
                }));

                /* -------------------------------------------------
                   ✅ WEEKLY
                ------------------------------------------------- */
                connection.query(
                    weeklyQuery,
                    [user_id, weekStartUTC, weekEndUTC],
                    (err, weeklyResult) => {
                        if (err) {
                            return response.status(200).json({
                                success: false,
                                msg: request.__('internal_server_error'),
                                error: err.message
                            });
                        }

                        /* -------------------------------------------------
                           ✅ MONTHLY
                        ------------------------------------------------- */
                        connection.query(
                            monthlyQuery,
                            [user_id, monthStartUTC, monthEndUTC],
                            (err, monthlyResult) => {
                                if (err) {
                                    return response.status(200).json({
                                        success: false,
                                        msg: request.__('internal_server_error'),
                                        error: err.message
                                    });
                                }

                                /* -------------------------------------------------
                                   ✅ YEARLY
                                ------------------------------------------------- */
                                connection.query(
                                    yearlyQuery,
                                    [user_id, yearStartUTC, yearEndUTC],
                                    (err, yearlyResult) => {
                                        if (err) {
                                            return response.status(200).json({
                                                success: false,
                                                msg: request.__('internal_server_error'),
                                                error: err.message
                                            });
                                        }

                                        // Existing transformers
                                        const weeklyData  = transformWeeklyWeightData(weeklyResult, timezone, finalLanguage);
                                        const monthlyData = transformMonthlyWeightData(monthlyResult);
                                        const yearlyData  = transformYearlyWeightData(yearlyResult,finalLanguage);

                                        let filteredData = {};

                                        if (type == 1) {
                                            filteredData.weekly = weeklyData;
                                        } else if (type == 2) {
                                            filteredData.monthly = monthlyData;
                                        } else if (type == 3) {
                                            filteredData.yearly = yearlyData;
                                        } else {
                                            filteredData = {
                                                weekly: weeklyData,
                                                monthly: monthlyData,
                                                yearly: yearlyData
                                            };
                                        }

                                        filteredData.today = todayData;

                                        return response.status(200).json({
                                            success: true,
                                            data: filteredData
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};

// ===== Group & Average Helper =====
function groupWeightByDate(rawData, type = 'daily') {
    const grouped = {};

    rawData.forEach(row => {
        const d = new Date(row.createtime);
        let key;

        if (type === 'yearly') {
            key = d.getMonth(); // month index
        } else {
            key = d.toDateString(); // day
        }

        if (!grouped[key]) {
            grouped[key] = { sum: 0, count: 0, date: d };
        }

        grouped[key].sum += row.weight;
        grouped[key].count++;
    });

    const averaged = {};
    for (let key in grouped) {
        const g = grouped[key];
        averaged[key] = {
            date: g.date,
            weight: parseFloat((g.sum / g.count).toFixed(1))
        };
    }
    return averaged;
}

// ===== Weekly Transformation =====
function transformWeeklyWeightData(rawData, timezone, finalLanguage) {
    const averaged = groupWeightByDate(rawData); // keys should be toDateString()

    // Get Monday of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    let weekly = [];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const key = currentDate.toDateString(); // match the format used in grouping

        // FIX: use currentDate instead of row
        const formattedDay = moment(currentDate)
            .tz(timezone)
            .locale(finalLanguage)
            .format("DD MMM");

        if (averaged[key]) {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                weight: averaged[key].weight
            });
        } else {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                weight: 0
            });
        }
    }

    const avg = calcWeightAverage(weekly);
    return {
        average_weight: avg,
        records: weekly
    };
}

// ===== Monthly Transformation =====
function transformMonthlyWeightData(rawData) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShortName = today.toLocaleString('en-US', { month: 'short' }); // e.g., "Aug"

    const averaged = groupWeightByDate(rawData);

    let monthly = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const key = dateObj.toDateString();

        const dayNumber = i.toString().padStart(2, '0');
        const dayLabel = i === 1 ? `${dayNumber}` : dayNumber;

        monthly.push({
            day: dayLabel,
            weight: averaged[key]?.weight || 0
        });
    }

    const avg = calcWeightAverage(monthly);
    return {
        average_weight: avg,
        records: monthly
    };
}

// ===== Yearly Transformation =====
// function transformYearlyWeightData(rawData) {
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     const averaged = groupWeightByDate(rawData, 'yearly');

//     let yearly = months.map((m, idx) => {
//         const found = Object.keys(averaged).find(k => parseInt(k) === idx);
//         if (found !== undefined) {
//             return {
//                 day: months[idx],
//                 weight: averaged[found].weight
//             };
//         }
//         return { day: months[idx], weight: 0 };
//     });

//     const avg = calcWeightAverage(yearly);
//     return {
//         average_weight: avg,
//         records: yearly
//     };
// }
function transformYearlyWeightData(rawData, finalLanguage) {

    const averaged = groupWeightByDate(rawData, 'yearly');

    let yearly = [];

    for (let idx = 0; idx < 12; idx++) {

        // Multilingual month label (SAFE)
        const monthLabel = moment()
            .month(idx)
            .locale(finalLanguage || "en")
            .format("MMM");

        const found = Object.keys(averaged).find(k => parseInt(k) === idx);

        if (found !== undefined) {
            yearly.push({
                day: monthLabel,
                weight: averaged[found].weight
            });
        } else {
            yearly.push({
                day: monthLabel,
                weight: 0
            });
        }
    }

    const avg = calcWeightAverage(yearly);

    return {
        average_weight: avg,
        records: yearly
    };
}

// ===== Utility to calculate average weight =====
function calcWeightAverage(records) {
    let total = 0, count = 0;

    records.forEach(r => {
        if (r.weight > 0) {
            total += r.weight;
            count++;
        }
    });

    return count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
}
// weight graph api end.................




// get temperature data graph stats.....
const getServiceOrPackageRelatedDetails = async (req, res) => {
  try {
    const { service_id = null, package_id = null, city, type, user_id } = req.query;

    if (!user_id) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "user_id" });
    if (!city) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "city" });
    if (!type) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "type" });

    // 1️⃣ Validate user
    const checkUser = await new Promise((resolve, reject) => {
      const sqlCheck = "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
      connection.query(sqlCheck, [user_id], (err, result) => (err ? reject(err) : resolve(result)));
    });
    if (!checkUser.length) return res.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
    if (checkUser[0].active_flag === 0) return res.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });

    // 2️⃣ Fetch FAQs for user_type = 0
    let faqArr = await new Promise((resolve, reject) => {
      const sql = `SELECT faq_id, faq_question as question, faq_answer as answer FROM faq_master WHERE user_type = 0 AND delete_flag = 0 ORDER BY faq_id ASC`;
      connection.query(sql, (err, result) => (err ? reject(err) : resolve(result)));
    });
    faqArr = faqArr.map(faq => ({ ...faq, status: true }));

    // ------------------------------ Service ------------------------------
    if (type == 0) {
      if (!service_id) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "service_id" });

      // 3️⃣ Get service details
      const serviceResult = await new Promise((resolve, reject) => {
        const sql = `SELECT * FROM service_master WHERE service_id = ? AND delete_flag = 0`;
        connection.query(sql, [service_id], (err, result) => (err ? reject(err) : resolve(result)));
      });
      if (!serviceResult.length) return res.status(200).json({ success: false, msg: "No service found" });
      const service = serviceResult[0];

      // 4️⃣ Get city price
      const cityPriceResult = await new Promise((resolve, reject) => {
        const sql = `SELECT price FROM service_price_master WHERE service_id = ? AND city_name = ? AND delete_flag = 0`;
        connection.query(sql, [service_id, city], (err, result) => (err ? reject(err) : resolve(result)));
      });
      const cityPrice = cityPriceResult.length ? cityPriceResult[0].price : service.price;

      // 5️⃣ Get reviews (array)
      const reviewsResult = await new Promise((resolve, reject) => {
        const sql = `SELECT review_id, user_id, rating, comment, created_at FROM rating_review_master WHERE service_id = ? AND delete_flag = 0 ORDER BY created_at DESC`;
        connection.query(sql, [service_id], (err, result) => (err ? reject(err) : resolve(result)));
      });

      // 6️⃣ Aggregate total reviews and avg rating
      const totalReviews = reviewsResult.length;
      const avgRating = totalReviews
        ? (reviewsResult.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : "0";

      // 7️⃣ Check cart
      const cartResult = await new Promise((resolve, reject) => {
        const sqlCartMaster = `SELECT cart_id FROM cart_master WHERE user_id = ? AND delete_flag = 0`;
        connection.query(sqlCartMaster, [user_id], (err, carts) => {
          if (err) return reject(err);
          if (!carts.length) return resolve({ service_count: 0, cart_flag: 0 });
          const cart_id = carts[0].cart_id;
          const sqlCartItem = `SELECT service_count FROM cart_item_master WHERE cart_id = ? AND service_id = ? AND delete_flag = 0`;
          connection.query(sqlCartItem, [cart_id, service_id], (err, items) => {
            if (err) return reject(err);
            if (!items.length) return resolve({ service_count: 0, cart_flag: 0 });
            return resolve({ service_count: items[0].service_count, cart_flag: 1 });
          });
        });
      });

      // 8️⃣ Get category name
      const categoryResult = await new Promise((resolve, reject) => {
        const sql = `SELECT name FROM category_master WHERE category_id = ? AND delete_flag = 0`;
        connection.query(sql, [service.category_id], (err, result) => (err ? reject(err) : resolve(result)));
      });
      const categoryName = categoryResult.length ? categoryResult[0].name : "NA";

      // 9️⃣ Get service work steps
      const serviceStepArr = await new Promise((resolve, reject) => {
        const sql = `SELECT description, image FROM work_step_master WHERE service_id = ? AND delete_flag = 0`;
        connection.query(sql, [service_id], (err, result) => (err ? reject(err) : resolve(result)));
      });

      const services = {
        service_id: service.service_id,
        title: service.service_title,
        description: service.description,
        image: service.image,
        video: service.video,
        category_name: categoryName,
        duration: formatDurationMoment(service.duration),
        base_price: service.price,
        city_price: cityPrice,
        total_reviews: totalReviews,
        service_rating: avgRating,
        service_count: cartResult.service_count,
        cartFlag: cartResult.cart_flag,
        service_step_arr: serviceStepArr.length ? serviceStepArr : 'NA',
        reviews: reviewsResult.length ? reviewsResult : 'NA'
      };

      return res.status(200).json({ success: true, msg: languageMessage.dataFound, services, faq_arr: faqArr });
    }

    // ------------------------------ Package ------------------------------
    if (type == 1) {
      if (!package_id) return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: "package_id" });

      // 3️⃣ Get package details
      const packageResult = await new Promise((resolve, reject) => {
        const sql = `SELECT * FROM package_master WHERE package_id = ? AND delete_flag = 0`;
        connection.query(sql, [package_id], (err, result) => (err ? reject(err) : resolve(result)));
      });
      if (!packageResult.length) return res.status(200).json({ success: false, msg: "No package found" });
      const pkg = packageResult[0];

      // 4️⃣ Get city price
      const cityPriceResult = await new Promise((resolve, reject) => {
        const sql = `SELECT price FROM service_price_master WHERE service_id = ? AND city_name = ? AND delete_flag = 0`;
        connection.query(sql, [package_id, city], (err, result) => (err ? reject(err) : resolve(result)));
      });
      const cityPrice = cityPriceResult.length ? cityPriceResult[0].price : pkg.price;

      const packages = [{
        package_id: pkg.package_id,
        title: pkg.package_title,
        description: pkg.description,
        image: pkg.image,
        video: pkg.video,
        duration: formatDurationMoment(pkg.duration),
        cost: pkg.price,
        cityPrice,
        faq_arr: faqArr
      }];

      return res.status(200).json({ success: true, msg: languageMessage.dataFound, packages });
    }

  } catch (error) {
    console.error("Error in getServiceOrPackageRelatedDetails:", error);
    return res.status(200).json({ success: false, msg: languageMessage.internalServerError, error });
  }
};

// ===== Group & Average Helper =====
function groupTemperatureByDate(rawData, type = 'daily') {
    const grouped = {};

    rawData.forEach(row => {
        const d = new Date(row.createtime);
        let key;

        if (type === 'yearly') {
            key = d.getMonth(); // month index
        } else {
            key = d.toDateString(); // unique day
        }

        if (!grouped[key]) {
            grouped[key] = { sum: 0, count: 0, date: d };
        }

        grouped[key].sum += row.temperature;
        grouped[key].count++;
    });

    const averaged = {};
    for (let key in grouped) {
        const g = grouped[key];
        averaged[key] = {
            date: g.date,
            temperature: parseFloat((g.sum / g.count).toFixed(1))
        };
    }
    return averaged;
}
// ===== Weekly Transformation =====
function transformWeeklyTemperatureData(rawData, timezone, finalLanguage) {
    const averaged = groupTemperatureByDate(rawData); 

    // Get the Monday of the current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    let weekly = [];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const key = currentDate.toDateString(); // used for matching grouped data

        // FIX: use currentDate instead of row
        const formattedDay = moment(currentDate)
            .tz(timezone)
            .locale(finalLanguage)
            .format("DD MMM");

        if (averaged[key]) {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                temperature: averaged[key].temperature
            });
        } else {
            weekly.push({
                //day: moment(currentDate).format("DD MMM"),
                day: formattedDay,
                temperature: 0
            });
        }
    }

    const avg = calcTemperatureAverage(weekly);
    return {
        average_temperature: avg,
        records: weekly
    };
}

// ===== Monthly Transformation =====
function transformMonthlyTemperatureData(rawData) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthShortName = today.toLocaleString('en-US', { month: 'short' }); // e.g., "Aug"

    const averaged = groupTemperatureByDate(rawData);

    let monthly = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const key = dateObj.toDateString();

        const dayNumber = i.toString().padStart(2, '0');
        const dayLabel = i === 1 ? `${dayNumber}` : dayNumber;

        monthly.push({
            day: dayLabel,
            temperature: averaged[key]?.temperature || 0
        });
    }

    const avg = calcTemperatureAverage(monthly);
    return {
        average_temperature: avg,
        records: monthly
    };
}

// ===== Yearly Transformation =====
// function transformYearlyTemperatureData(rawData) {
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     const averaged = groupTemperatureByDate(rawData, 'yearly');

//     let yearly = months.map((m, idx) => {
//         const found = Object.keys(averaged).find(k => parseInt(k) === idx);
//         if (found !== undefined) {
//             return {
//                 day: months[idx],
//                 temperature: averaged[found].temperature
//             };
//         }
//         return { day: months[idx], temperature: 0 };
//     });

//     const avg = calcTemperatureAverage(yearly);
//     return {
//         average_temperature: avg,
//         records: yearly
//     };
// }
function transformYearlyTemperatureData(rawData, finalLanguage) {

    const averaged = groupTemperatureByDate(rawData, 'yearly');

    let yearly = [];

    for (let idx = 0; idx < 12; idx++) {

        // Multilingual month label (SAFE)
        const monthLabel = moment()
            .month(idx)
            .locale(finalLanguage || "en")
            .format("MMM");

        const found = Object.keys(averaged).find(k => parseInt(k) === idx);

        if (found !== undefined) {
            yearly.push({
                day: monthLabel,
                temperature: averaged[found].temperature
            });
        } else {
            yearly.push({
                day: monthLabel,
                temperature: 0
            });
        }
    }

    const avg = calcTemperatureAverage(yearly);

    return {
        average_temperature: avg,
        records: yearly
    };
}
// ===== Utility to calculate average temperature =====
function calcTemperatureAverage(records) {
    let total = 0, count = 0;

    records.forEach(r => {
        if (r.temperature > 0) {
            total += r.temperature;
            count++;
        }
    });

    return count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
}
//  temperature graph api end....





//   share information 
const shareInfoToDoctor = async (req, res) => {
  const { user_id, doctor_id, information_type, language_code } = req.body;

  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessage.msg_empty_param,
        key: "user_id"
      });
    }

    if (!doctor_id) {
      return res.status(200).json({
        success: false,
        msg: languageMessage.msg_empty_param,
        key: "doctor_id"
      });
    }

    const finalLanguage = language_code && language_code.trim() !== ""
        ? language_code
        : await getUserLanguage({ user_id });

    req.setLocale(finalLanguage);

    // Normalize information_type → "1,2,3"
    let infoTypeStr = "";
    if (Array.isArray(information_type)) {
      infoTypeStr = information_type.join(",");
    } else if (typeof information_type === "string") {
      infoTypeStr = information_type
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
        .join(",");
    } else {
      return res.status(200).json({
        success: false,
        msg: "Invalid information_type format"
      });
    }

    // Validate user
    const userSql = `
      SELECT user_id, active_flag
      FROM user_master
      WHERE user_id = ? AND delete_flag = 0
    `;

    connection.query(userSql, [user_id], (err, user) => {
      if (err) {
        return res.status(200).json({
          success: false,
          msg: req.__('internal_server_error')
        });
      }

      if (user.length === 0) {
        return res.status(200).json({
          success: false,
          msg: req.__('user_not_found')
        });
      }

      if (user[0].active_flag === 0) {
        return res.status(200).json({
          success: false,
          msg: req.__('your_account_has_been_deactivated'),
          active_flag: 0
        });
      }

      const insertSql = `
        INSERT INTO report_share_master
        (user_id, doctor_id, information_type)
        VALUES (?, ?, ?)
      `;

      connection.query(
        insertSql,
        [user_id, doctor_id, infoTypeStr],
        (err2) => {
          if (err2) {
            return res.status(200).json({
              success: false,
              msg: req.__('internal_server_error'),
              error: err2.message
            });
          }

          return res.status(200).json({
            success: true,
            msg: req.__('information_shared_successfully')
          });
        }
      );
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      msg: req.__('internal_server_error'),
      error: error.message
    });
  }
};



//  get medicines 
const getMedicines = async (request, response) => {
    const { user_id, text } = request.query;
    const limit = parseInt(request.query.limit) || 10;  
    const offset = parseInt(request.query.offset) || 0; 
            
    try {
        if (!user_id) {
            return response.status(200).json({
                success: false,
                msg: languageMessage.msg_empty_param,
                key: 'user_id'
            });
        }

        // If no search text is passed, return no data
        if (!text || text.trim() === "") {
            return response.status(200).json({
                success: true,
                msg: languageMessage.dataNotFound,
                dataArray: 'NA'
            });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(checkUser, [user_id], async (err, res) => {
            if (err) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    error: err.message
                });
            }
            if (res.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.userNotFound });
            }
            if (res[0].active_flag == 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.msgAccountdeactivated,
                    active_flag: 0
                });
            }

            //      Search only medicines starting with text
            // const whereClause = `WHERE delete_flag = 0 AND medicine_name LIKE ?`;
            // const params = [`${text}%`, limit, offset];
            const whereClause = `
            WHERE 
              delete_flag = 0 
              AND medicine_name LIKE ? 
              AND (
                (user_id = 0 AND added_by = 0)        
                OR 
                (user_id = ? AND added_by = 1)        
              )
          `;
          const params = [`${text}%`, user_id, limit, offset]; 
            const getQuery = `
                SELECT medicine_id, medicine_name, description, createtime 
                FROM medicine_master 
                ${whereClause}
                ORDER BY medicine_name ASC
                LIMIT ? OFFSET ?
            `;

            connection.query(getQuery, params, (err1, res1) => {
                if (err1) {
                    return response.status(200).json({
                        success: false,
                        msg: languageMessage.internalServerError,
                        error: err1.message
                    });
                }

                if (res1.length === 0) {
                    return response.status(200).json({
                        success: true,
                        msg: languageMessage.dataNotFound,
                        dataArray: 'NA'
                    });
                }

                return response.status(200).json({
                    success: true,
                    msg: languageMessage.fetchDataSuccess,
                    dataArray: res1,
                    limit,
                    offset,
                    next_offset: offset + limit,
                    has_more: res1.length === limit
                });
            });
        });

    } catch (error) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            error: error.message
        });
    }
};



//  get taken medcine history 
const getMedicineHistory = async( request, response) =>{
    const { user_id } = request.query;
    try{
        if(!user_id){
            return response.status(200).json({ success : false, msg: languageMessage.msg_empty_param, key:'user_id'});
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag =0';
        connection.query(checkUser, [user_id], async( err, res) =>{
            if(err){
                return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error: err.message});
            }
            if(res.length == 0){
                return response.status(200).json({ success : false, msg: languageMessage.userNotFound});
            }
            if(res[0].active_flag == 0){
                return response.status(200).json({ success: false, msg: languageMessage.msgAccountdeactivated, active_flag : 0});
            }
        const checksql = 'SELECT mam.medicine_average_id,  mam.medicine_id, mam.taken_datetime, mm.medicine_name, mam.time_slots_id, ts.medication_id, ts.time,  mem.dosage, mem.type,  mem.schedule, mem.weekday, mem.schedule_date, mem.status, mem.number_of_times, mem.remainder_quantity, mem.medicine_type_name, mem.remaining_quantity, mem.instruction, mem.pause_status FROM medicine_average_master mam JOIN medicine_master mm ON mam.medicine_id = mm.medicine_id JOIN time_slots_master ts ON mam.time_slots_id = ts.time_slots_id JOIN medication_master mem ON ts.medication_id = mem.medication_id WHERE mam.user_id = ? AND mam.delete_flag = 0 AND mam.status!=2 ORDER BY mam.createtime DESC';
        connection.query(checksql, [user_id], async(err1, res1)=>{
            if(err1){
                return response.status(200).json({ success : false, msg: languageMessage.internalServerError, error: err1.message});
            }
            if(res1.length == 0){
                return response.status(200).json({ success : true, msg: languageMessage.dataNotFound, medicine_arr: 'NA'});
            }
        let medicine_arr = [];
        for(let data of res1){
            medicine_arr.push({
                medicine_average_id : data.medicine_average_id,
                medication_id : data.medication_id,
                medicine_id : data.medicine_id,
                medicine_name : data.medicine_name,
                date : moment(data.taken_datetime).format("DD MMM YYYY"),
                time : moment(data.taken_datetime).format("hh:mm A"),
                time_slots_id : data.time_slots_id,
                dosage : data.dosage,
                type : data.type,
                type_label : '1 - pill, 2 - Syrup',
                instruction : data.instruction,
                schedule : data.schedule,
                schedule_label : '0=daily, 1=weekly, 2=monthly',
                weekday : data.weekday,
                schedule_date : data.schedule_date,
                status : data.status,
                number_of_times : data.number_of_times,
                remainder_quantity : data.remainder_quantity,
                medicine_type_name : data.medicine_type_name,
                remaining_quantity : data.remaining_quantity,
                pause_status : data.pause_status, 
                pause_label : '0=Not_Paused, 1=Paused',
            })
        }
        return response.status(200).json({ success : true, msg: languageMessage.dataFound, medicine_arr : medicine_arr});
        })
        });
    }
    catch(error){
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message});
    }
}

const deleteMeasurement = (req, res) => {
    try {
        const { measurement_id, user_id } = req.body;

        // Validate user_id and measurement_id
        if (!user_id) {
            return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!measurement_id) {
            return res.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'measurement_id' });
        }

        const checkUserQuery = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(checkUserQuery, [user_id], (err, userResult) => {
            if (err) {
                return res.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (userResult.length === 0) {
                return res.status(200).json({ success: false, msg: languageMessage.userNotFound });
            }

            if (userResult[0].active_flag === 0) {
                return res.status(200).json({ success: false, msg: languageMessage.msgAccountdeactivated, active_flag: 0 });
            }

            const updateQuery = 'UPDATE measurement_master SET delete_flag = 1 WHERE measurement_id = ? AND user_id = ? AND delete_flag = 0';
            connection.query(updateQuery, [measurement_id, user_id], (err1, updateResult) => {
                if (err1) {
                    return res.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (updateResult.affectedRows === 0) {
                    return res.status(200).json({ success: true, msg: languageMessage.dataNotFound, medicine_arr: 'NA' });
                }

                return res.status(200).json({ success: true, msg: languageMessage.dataDeletedSuccessfully });
            });
        });
    } catch (error) {
        return res.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
};



module.exports = {

    getAllContent,

    getAllContentUrl,

    getMyMedications,

    getTodayMedicationNew,

    getMyMedicationsHistory,

    getMedicine,

    getDocumentType,

    getReports,

    getResentReports,

    getBPData,

    getFastingGlucose,

    getPPBGS,

    getWeightMeasurement,

    getTemperature,

    getCustomMeasurement,

    getBPDataStats,

    getFastingGlucoseDataStats,

    getPPBGSDataStats,

    getWeightMeasurementDataStats,

    getTemperatureDataStats,

    getSymtoms,

    getAdverseReaction,

    getAdverseReactionById,

    getDoctors,

    getMyDoctors,

    ShareInformation,

    getDisease,

    getDateMedication,
    getFaq, 

    getDocumentsByReportCategory, 

    getBPDataStatus, 
    deleteDoctor, 
    getFastingGlucoseDataStatus, 
    getPPBGSDataStatus, 
    getWeightMeasurementDataStatus, 
    getTemperatureDataStatus, 
    shareInfoToDoctor, 
    getMedicines, 
    getMedicineHistory,
    deleteMeasurement

}