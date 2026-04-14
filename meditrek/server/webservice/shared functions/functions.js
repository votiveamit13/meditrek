const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const languageMessage = require('./languageMessage')
const moment = require('moment-timezone');
const sendFCMPush = require('../helpers/fcm');
// Get current time in the desired timezone (e.g., Paris)
const parisTime = moment().tz(process.env.TIME_ZONE || 'Europe/Paris');

// Format it as 'YYYY-MM-DD HH:mm:ss'
const formattedDate = parisTime.format('YYYY-MM-DD HH:mm:ss');
const connection = require('../connection');
const axios = require('axios');

async function hashPassword(password) {
    const hash = crypto.createHash('md5');
    hash.update(password);
    return hash.digest('hex');
}
async function generateOTP(limit) {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < limit; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}
const authenticateToken = (req, res, next) => {
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
};
async function DeviceTokenStore_1_Signal(user_id, device_type, player_id) {
    const inserttime = moment().format("YYYY-MM-DD HH:mm:ss");
    try {
        connection.query(
            "INSERT INTO user_notification (user_id, device_type, player_id, inserttime) VALUES (?, ?, ?, ?)",
            [user_id, device_type, player_id, formattedDate]
        );
        return "yes";
    } catch (error) {
        throw error;
    }
}
// async function getUserDetails(user_id) {
//     return new Promise((resolve, reject) => {
//         connection.query(
//             `SELECT 
//     u.user_id, u.f_name, u.l_name, u.name, u.email, u.mobile, u.age, u.otp, u.otp_verify, u.image, 
//     u.gender, u.dob, u.diseases, u.weight, u.height, u.player_id, u.active_flag, u.profile_complete,
//     u.notification_status, u.delete_flag, u.delete_reason,
//     GROUP_CONCAT(d.disease_name) AS disease_names
//     FROM user_master u
//     LEFT JOIN disease_master d ON FIND_IN_SET(d.disease_id, u.diseases) AND d.delete_flag = 0
//     WHERE u.user_id = ? AND u.delete_flag = 0 
//     GROUP BY u.user_id`,
//             [user_id],
//             (error, rows) => {
//                 if (error) {
//                     console.error("Database error while fetching user details:", error);
//                     reject(error);
//                 } else {
//                     if (rows.length > 0) {
//                       rows.map((item) => {
//                          if(item.diseases != null){
//                        item.diseases = item.diseases.replace(/^"|"$/g, '').split('},{').map((s, i, arr) => {
//     if (!s.startsWith('{')) s = '{' + s;
//     if (!s.endsWith('}')) s = s + '}';
//     s = s.replace(/(\w+):/g, '"$1":')            // Quote keys
//          .replace(/:\s*([^",\}\{]+)/g, ': "$1"'); // Quote values
//     return JSON.parse(s);
//   });
//                           if(item.diseases.length > 1){
//                           item.diseases.map((data) => {
//                             data.status = true;
//                             data.length = item.diseases.length
//                           })
//                         }
//                          }
//                       })
//                         resolve(rows[0]);
//                     } else {
//                         resolve(null);
//                     }
//                 }
//             }
//         );
//     });
// }

async function getUserDetails(user_id) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT 
        u.user_id, u.f_name, u.l_name, u.name, u.email, u.mobile, u.age, u.otp, u.otp_verify, u.image, 
        u.gender, u.dob, u.diseases, u.weight, u.height, u.player_id, u.active_flag, u.profile_complete,
        u.notification_status, u.delete_flag, u.delete_reason,
        GROUP_CONCAT(d.disease_name) AS disease_names
      FROM user_master u
      LEFT JOIN disease_master d ON FIND_IN_SET(d.disease_id, u.diseases) AND d.delete_flag = 0
      WHERE u.user_id = ? AND u.delete_flag = 0 
      GROUP BY u.user_id`,
      [user_id],
      async (error, rows) => {
        if (error) {
          console.error("Database error while fetching user details:", error);
          reject(error);
        } else {
          if (rows.length > 0) {
            const item = rows[0];

            // Calculate age from dob
            if (item.dob) {
              const dob = new Date(item.dob);
              const today = new Date();
              let age = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
              }
              item.age = age;
            }

            // Parse diseases field
            if (item.diseases && item.diseases.trim() !== '') {
              try {
                const cleaned = item.diseases
                  .replace(/^"|"$/g, '')
                  .split('},{')
                  .map((s, i, arr) => {
                    if (!s.startsWith('{')) s = '{' + s;
                    if (!s.endsWith('}')) s = s + '}';
                    s = s
                      .replace(/(\w+):/g, '"$1":')
                      .replace(/:\s*([^",\}\{]+)/g, ': "$1"');
                    return JSON.parse(s);
                  })
                  .filter(obj => Object.keys(obj).length > 0);

                if (cleaned.length > 0) {
                  item.diseases = cleaned.map(d => ({
                    ...d,
                    status: true,
                    length: cleaned.length
                  }));
                } else {
                  item.diseases = null;
                }
              } catch (parseErr) {
                console.error('Error parsing diseases:', parseErr);
                item.diseases = null;
              }
            } else {
              item.diseases = null;
            }

              resolve(item);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
}


// Async helper to get player_id
async function getUserPlayerIdAsync(user_id) {
  return new Promise((resolve) => {
    connection.query(
      "SELECT player_id FROM user_notification WHERE user_id = ?",
      [user_id],
      (err, result) => {
        if (err || result.length === 0) return resolve(null);
        return resolve(result[0].player_id);
      }
    );
  });
}

async function getUserCurrentTZ(user_id) {
  return new Promise((resolve) => {
    connection.query(
      "SELECT current_timezone FROM user_notification WHERE user_id=?",
      [user_id],
      (err, result) => {
        if (err || result.length === 0) return resolve("UTC");
        return resolve(result[0].current_timezone || "UTC");
      }
    );
  });
}

async function getNotificationArrSingle(
  user_id,
  other_user_id,
  action,
  action_id,
  title,
  title_2,
  title_3,
  title_4,
  title_5,
  message,
  message_2,
  message_3,
  message_4,
  message_5,
  action_json_lang_data = {},
  title_json_lang_data = {},
  message_json_lang_data = {},
  fcmAction, fcmTitle, fcmMessage,
  action_data,
  callback
) {
  const notification_arr = {};
  const action_json = JSON.stringify(action_data);
  const action_json_lang = JSON.stringify(action_json_lang_data);
  const title_json_lang = JSON.stringify(title_json_lang_data);
  const message_json_lang = JSON.stringify(message_json_lang_data);

  InsertNotification(
    user_id,
    other_user_id,
    action,
    action_id,
    action_json,
    title,
    title_2,
    title_3,
    title_4,
    title_5,
    message,
    message_2,
    message_3,
    message_4,
    message_5,
    action_json_lang,
    title_json_lang,
    message_json_lang,
    fcmAction, fcmTitle, fcmMessage,
    async (insert_status) => {
      if (insert_status !== "yes") return callback(notification_arr);

      getNotificationStatus(other_user_id, async (notification_status) => {
        if (notification_status !== "yes") return callback(notification_arr);

        const player_id = await getUserPlayerIdAsync(other_user_id);

        if (!player_id) return callback(notification_arr);

        // Build return payload
        notification_arr.player_id = player_id;
        notification_arr.title = fcmTitle;
        notification_arr.message = fcmMessage;
        notification_arr.action_json = action_data;
        notification_arr.action_json_lang = action_json_lang_data;
        notification_arr.title_json_lang = title_json_lang_data;
        notification_arr.message_json_lang = message_json_lang_data;

        // Send via FCM
        try {
          await sendFCMPush({
            token: player_id,
            title: fcmTitle,
            body: fcmMessage,
            data: { action_data: JSON.stringify(action_data) }
          });
        } catch (e) {
          console.error("FCM Send Error:", e.message);
        }


        return callback(notification_arr);
      });
    }
  );
}



function InsertNotification(user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5,action_json_lang, title_json_lang, message_json_lang, callback) {
  const utcDate = moment().utc().format('YYYY-MM-DD HH:mm:ss');
  const read_status = '0';
  const delete_flag = '0';
  const sql = "INSERT INTO user_notification_message(user_id, other_user_id, action, action_id, action_json, title,title_2,title_3,title_4,title_5, message,message_2,message_3,message_4,message_5,action_json_lang,title_json_lang,message_json_lang, read_status, delete_flag, createtime, updatetime) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?, ?,?,?,?, ?,?, ?, ?, ?,?,?,?)";
  connection.query(sql, [user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5, action_json_lang, title_json_lang, message_json_lang, read_status, delete_flag, utcDate, utcDate], (error, results) => {
    if (error) {
      callback(error.message);
    } else {
      callback('yes');
    }
  });
}
function getNotificationStatus(user_id, callback) {
  const sql = "SELECT user_id FROM user_master WHERE user_id = ? AND notification_status = '1'";
  connection.query(sql, [user_id], (error, results) => {
    if (error) {
      console.error('Error getting notification status:', error);
      callback('no');
    } else {
      if (results.length > 0) {
        callback('yes');
      } else {
        callback('no');
      }
    }
  });
}



async function oneSignalNotificationSend(title, message, jsonData, player_id_arr) {
  try {
    const oneSignalAppId = "cf2dfcd5-46c4-41f9-9179-d34076cda4d7";
    const oneSignalAuthorization="os_v2_app_z4w7zvkgyra7telz2nahntne25am2qlj2n2ubsvmuxxjqb4cf6ewlmkg3oai3hgndyfjteij5xeeumrme7egfoy2c3phj6xq2o6uwci";
    console.log('player_id_arr', player_id_arr)
    const fields = {
      app_id: oneSignalAppId,
      contents: { en: message },
      headings: { en: title },
      include_player_ids: player_id_arr,
      data: { action_json: jsonData },
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      priority: 10
    };
    const config = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Basic ' + oneSignalAuthorization
      }
    };
    const response = await axios.post('https://onesignal.com/api/v1/notifications', fields, config);
    return response.data;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error.message);
    return error.message;
  }
}
async function oneSignalNotificationSendCall(notification_arr) {
  if (notification_arr && notification_arr.length > 0) {
    for (const key of notification_arr) {
      const player_id_arr = [];
      if (key.player_id !== '') {
        player_id_arr.push(key.player_id);
        const title = key.title;
        const message = key.message;
        const action_json = key.action_json;
        return await oneSignalNotificationSend(title, message, action_json, player_id_arr);
      }
    }
  } else {
    console.log('Notification array is empty. No notifications to send.');
  }
}
async function getUserPlayerId(user_id, callback) {
  try {
    if (!user_id) return 'no';
    connection.query("SELECT player_id FROM user_notification WHERE user_id = ?", [user_id], (err, result) => {
      if (err) {
        console.log("error : ", err);
      }
      if (result.length > 0) {
        let player_id = result[0].player_id;
        if (player_id === '123456') {
          player_id = 'no';
        }
        //console.log('player_id',player_id)
        callback(player_id);
      } else {
        //console.log('player_id',player_id)
        // return 'no';
        callback('no');
      }
    })
  } catch (error) {
    console.error('Error executing query:', error.message);
    return null;
  }
}








module.exports = { generateOTP, hashPassword, authenticateToken, DeviceTokenStore_1_Signal, getUserDetails,oneSignalNotificationSendCall,getNotificationArrSingle, getUserPlayerIdAsync, getUserCurrentTZ };