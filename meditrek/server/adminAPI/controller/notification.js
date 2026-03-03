const axios = require('axios');
const connection = require("../connection/connection");
const languageMessages = require('./languageMessages');
// const { getUserData } = require('./function.js');
function getNotificationArrSingle(user_id, other_user_id, action, action_id, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5, action_data, callback) {
  const notification_arr = {};
  const action_json = JSON.stringify(action_data);
  InsertNotification(user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5, (insert_status) => {
    if (insert_status === 'yes') {
      getNotificationStatus(other_user_id, (notification_status) => {
        if (notification_status === 'yes') {
          getUserPlayerId(other_user_id, async (player_id) => {
            // callback(player_id)
            // console.log('player_idssss',player_id)
            if (player_id !== 'no') {
              notification_arr.player_id = player_id;
              notification_arr.title = title;
              notification_arr.message = message;
              notification_arr.action_json = action_data;
              // console.log('notification_arr',notification_arr)
              await oneSignalNotificationSend(title, message, action_json, notification_arr.player_id);
              callback(notification_arr);
              // console.log(notification_arr, "");
            } else {
              callback(notification_arr);
            }
          });
        } else {
          callback(notification_arr);
        }
      });
    } else {
      callback(notification_arr);
    }
  });
}
function InsertNotification(user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5, callback) {
  const read_status = '0';
  const delete_flag = '0';
  const sql = "INSERT INTO user_notification_message(user_id, other_user_id, action, action_id, action_json, title,title_2,title_3,title_4,title_5, message,message_2,message_3,message_4,message_5, read_status, delete_flag, createtime, updatetime) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?, ?,?,?,?, ?,?, ?, now(), now())";
  connection.query(sql, [user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, title_5, message, message_2, message_3, message_4, message_5, read_status, delete_flag], (error, results) => {
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


const getNotification = (request, response) => {
  const { user_id } = request.query;
  try {
    // Query to check if the user exists
    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;
    var values1 = [user_id];
    connection.query(sql1, values1, async (err, information) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, data: {} });
      }
      if (information.length === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });
      }
      // var result = await cheakUseractiveDeactive(user_id);
      if (information[0].active_flag === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_status: 0 });
      }
      // Query to fetch notifications
      var sql = "SELECT notification_message_id, user_id, other_user_id, action, action_id, action_json, title, message, title_2, title_3, message_2, message_3, title_ar, message_arr, read_status, createtime FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 ORDER BY notification_message_id DESC";
      connection.query(sql, [user_id], async (err, info) => {
        if (err) {
          return response.status(200).json({ success: false, msg: languageMessages.internalServerError, err2: err.message });
        }
        try {
          const dateFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
          const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          let notification_arr = await Promise.all(info.map(async row => {
            try {
              const userData = await getUserData(row.user_id);
              const user_image = userData ? userData.image : 'NA';
              const date = new Date(row.createtime);
              const formattedDate = dateFormatter.format(date);
              const formattedTime = timeFormatter.format(date);
              return {
                notification_message_id: row.notification_message_id,
                user_id: row.user_id,
                user_image: user_image,
                other_user_id: row.other_user_id,
                action: row.action,
                action_id: row.action_id,
                action_json: row.action_json,
                date_time: `${formattedDate} ${formattedTime}`,
                title: row.title,
                message: row.message,
                read_status: row.read_status,
                status: false
              };
            } catch (error) {
              console.error("Error fetching user data:", error);
              throw error;
            }
          }));
          //update read status start
          const updateRead = `UPDATE user_notification_message SET read_status = 1, updatetime = NOW() WHERE delete_flag = 0 AND other_user_id = '${user_id}'`;
          connection.query(updateRead, (updateError, updateReadResult) => { });
          //update read status end
          if (notification_arr.length <= 0) {
            notification_arr = "NA";
          }
          return response.status(200).json({ success: true, message: languageMessages.msgDataFound, notification_arr: notification_arr });
        } catch (error) {
          return response.status(200).json({ success: false, msg: languageMessages.internalServerError, err1: error.message });
        }
      });
    });
  } catch (error) {
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, err: error.message });
  }
}
// get notification end
// delete notification start
const deleteSingleNotification = (request, response) => {
  const { user_id, notification_message_id } = request.body;
  try {
    if (!user_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_id' });
    }
    if (!notification_message_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'notification_message_id' });
    }
    // cheak user start
    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;
    var values1 = [user_id];
    connection.query(sql1, values1, async (err, information) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, data: {} });
      }
      if (information.length === 0) {
        return response.status(404).json({ success: false, msg: languageMessages.msgUserNotFound, data: {} });
      }
      // var result = await cheakUseractiveDeactive(user_id);
      if (information[0].active_flag === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_status: 0 });
      }
    });
    // cheak user end
    var sqlNotification = "SELECT notification_message_id,user_id FROM user_notification_message where notification_message_id = ? AND other_user_id = ?  AND delete_flag = 0";
    connection.query(sqlNotification, [notification_message_id, user_id], (err, result) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, key: '6' });
      } else {
        let delete_flag = 1;
        var sqlNotification = "UPDATE user_notification_message SET delete_flag = ? ,updatetime= now() WHERE notification_message_id=? AND other_user_id = ? ";
        connection.query(sqlNotification, [delete_flag, notification_message_id, user_id], (err, result) => {
          if (err) {
            return response.status(200).json({ success: false, msg: languageMessages.internalServerError, key: '2' });
          } else {
            return response.status(200).json({ success: true, msg: languageMessages.notificationDelete });
          }
        })
      }
    });
  } catch (error) {
    console.error("Error in try block:", error);
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError });
  }
}
// delete notification end
// delete All notification start
const deleteAllNotification = (request, response) => {
  const { user_id } = request.body;
  try {
    if (!user_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_id' });
    }
    // check user start
    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;
    var values1 = [user_id];
    connection.query(sql1, values1, async (err, information) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, data: {} });
      }
      if (information.length === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound, data: {} });
      }
      //  var result = await cheakUseractiveDeactive(user_id);
      if (information[0].active_flag === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_status: 0 });
      }
    });
    // check user end
    var sqlNotification = "SELECT notification_message_id FROM user_notification_message where other_user_id = ?  AND delete_flag = 0";
    connection.query(sqlNotification, [user_id], (err, result) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError, key: '6' });
      } else {
        let delete_flag = 1;
        var sqlNotification = "UPDATE user_notification_message SET delete_flag = ? ,updatetime= now() WHERE  other_user_id = ? ";
        connection.query(sqlNotification, [delete_flag, user_id], (err, result) => {
          if (err) {
            return response.status(200).json({ success: false, msg: languageMessages.internalServerError, key: '2' });
          } else {
            return response.status(200).json({ success: true, msg: languageMessages.notificationDelete });
          }
        })
      }
    });
  } catch (error) {
    console.error("Error in try block:", error);
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError });
  }
}
// delete all notification end
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
    return null;
  }
}
async function oneSignalNotificationSendCall(notification_arr) {
  console.log('notification_arr', notification_arr)
  if (notification_arr && notification_arr.length > 0) {
    for (const key of notification_arr) {
      const player_id_arr = [];
      if (key.player_id !== '') {
        player_id_arr.push(key.player_id);
        const title = key.title;
        const message = key.message;
        const action_json = key.action_json;
        await oneSignalNotificationSend(title, message, action_json, player_id_arr);
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
// get notification count start
const getNotificationCount = async (request, response) => {
  const { user_id } = request.query;
  try {
    if (!user_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_id' });
    }
    var sqlVal = "SELECT user_id,active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
    await connection.query(sqlVal, [user_id], async (err, info) => {
      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError });
      }
      if (info.length <= 0) {
        return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });
      }
      if (info[0].active_flag === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_status: 0 });
      }
      // check notification count start
      const getCount = "SELECT count(notification_message_id) as count FROM user_notification_message WHERE delete_flag=0 and other_user_id=? and read_status = 0";
      await connection.query(getCount, [user_id], (getCountError, getCountResult) => {
        if (getCountError) {
          return response.status(200).json({ success: false, msg: languageMessages.internalServerError, getCountError });
        }
        let notificationCount = 0;
        if (getCountResult.length > 0) {
          notificationCount = getCountResult[0].count;
        }
        return response.status(200).json({ success: true, msg: languageMessages.msgDataFound, notificationCount });
      })
      // check notification count end
    });
  } catch (error) {
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error });
  }
}
// get notification count end
async function getUserData(userId) {
  return new Promise((resolve, reject) => {
    const query = "SELECT `name`, `image` FROM user_master WHERE user_id = ? and delete_flag=0";
    connection.query(query, [userId], async (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      if (results.length > 0) {
        const userData = results[0];
        console.log(userData);
        try {
          const userDataArray = {
            name: userData.name,
            image: userData.image,
          };
          resolve(userDataArray);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(null);
      }
    });
  });
}



module.exports = {
  getNotificationArrSingle,
  getNotification,
  deleteSingleNotification,
  deleteAllNotification,
  oneSignalNotificationSendCall,
  getNotificationCount
}