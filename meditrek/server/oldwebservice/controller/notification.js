const connection = require("../connection/connection");
const languageMessagess = require("./languageMessages");
const axios = require('axios');
function getNotificationArrSingle(user_id, other_user_id, action, action_id, title, message, action_data, callback) {

  const notification_arr = {};

  const action_json = JSON.stringify(action_data);

  // console.log('action_json',action_json);

  InsertNotification(user_id, other_user_id, action, action_id, action_json, title, message, (insert_status) => {

    if (insert_status === 'yes') {

      // console.log('insert_status',insert_status)

      getNotificationStatus(other_user_id, (notification_status) => {

        //  console.log('notification_status',notification_status)

        if (notification_status === 'yes') {

          getUserPlayerId(other_user_id, async (player_id) => {

            // console.log('player_idssss',player_id)

            if (player_id !== 'no') {

              notification_arr.player_id = player_id;

              notification_arr.title = title;

              notification_arr.message = message;

              notification_arr.action_json = action_data;

              // console.log('notification_arr',notification_arr)
              await oneSignalNotificationSend(title, message, action_json, notification_arr.player_id);

              callback(notification_arr);




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



function InsertNotification(user_id, other_user_id, action, action_id, action_json, title, message, callback) {

  const read_status = '0';

  const delete_flag = '0';

  console.log('sdf');

  const sql = "INSERT INTO user_notification_message (user_id, other_user_id, action, action_id, action_json, title,title_2,title_3,title_4, message,message_2,message_3,message_4, read_status, delete_flag, createtime, updatetime) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?, ?,?, ?,?, ?, now(), now())";

  connection.query(sql, [user_id, other_user_id, action, action_id, action_json, title, title, title, title, message, message, message, message, read_status, delete_flag], (error, results) => {

    if (error) {

      console.log('Error inserting notification:', error);

      callback('no');

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

  console.log(user_id, "user_id");



  try {

    // Query to check if the user exists

    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;

    var values1 = [user_id];

    connection.query(sql1, values1, async (err, information) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, data: {} });

      }

      if (information.length === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.msgUserNotFound });

      }



      // var result = await cheakUseractiveDeactive(user_id);

      if (information[0].active_flag === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.accountdeactivated, active_status: 0 });

      }



      // Query to fetch notifications

      var sql = "SELECT notification_message_id, user_id, other_user_id, action, action_id, action_json, title, message, title_2, title_3, title_4, title_5, message_2, message_3, message_4, message_5, title_ar, message_arr, read_status, createtime FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 ORDER BY notification_message_id DESC";

      connection.query(sql, [user_id], async (err, info) => {

        if (err) {

          return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

        }



        // if (info.length === 0) {

        //     return response.status(200).json({ success: false, msg: languageMessagess.msgDataNotFound });

        // }



        try {

          const dateFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

          const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });



          let notification_arr = await Promise.all(info.map(async row => {

            try {
              // var image1 = "https://meribhiapp.com/2024/musaapp/server/webservice/imagelogo/C:\Users\YD\AppData\Local\Temp\fz3temp-2\icon_admin.png"
              const userData = await getUser(row.user_id);

              const user_image = userData ? userData.image : process.env.NOTIFICATION_LOGO_ADMIN;
              const f_name = userData ? userData.f_name : "NA";
              const l_name = userData ? userData.l_name : "NA";
              const username = userData ? userData.username : "NA"


              const date = new Date(row.createtime);

              const formattedDate = dateFormatter.format(date);

              const formattedTime = timeFormatter.format(date);



              return {

                notification_message_id: row.notification_message_id,

                user_id: row.user_id,

                user_image: user_image,

                other_user_id: row.other_user_id,

                username: username,

                f_name: f_name,

                l_name: l_name,

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

            notification_arr = "NA"

          }

          return response.status(200).json({ success: true, message: languageMessagess.msgDataFound, notification_arr: notification_arr });

        } catch (error) {

          console.error("Error processing notifications:", error);

          return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

        }

      });

    });

  } catch (error) {

    console.error("Error in try block:", error);

    return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

  }

}



// get notification end



// delete notification start

const deleteSingleNotification = (request, response) => {

  const { user_id, notification_message_id } = request.body;

  try {

    if (!user_id) {

      return response.status(200).json({ success: false, msg: languageMessagess.msg_empty_param, key: 'user_id' });

    }

    if (!notification_message_id) {

      return response.status(200).json({ success: false, msg: languageMessagess.msg_empty_param, key: 'notification_message_id' });

    }



    // cheak user start

    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;

    var values1 = [user_id];

    connection.query(sql1, values1, async (err, information) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, data: {} });

      }

      if (information.length === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.msgUserNotFound, data: {} });

      }

      // var result = await cheakUseractiveDeactive(user_id);

      if (information[0].active_flag === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.accountdeactivated, active_status: 0 });

      }

    });

    // cheak user end


    var sql1 = `SELECT notification_message_id FROM user_notification_message WHERE delete_flag = 0 AND notification_message_id = ?`;

    var values1 = [notification_message_id];

    connection.query(sql1, values1, async (err, information) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, data: {} });

      }

      if (information.length === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.NotificatiomsgDataFound, data: {} });

      }

      var sqlNotification = "SELECT notification_message_id,user_id FROM user_notification_message where notification_message_id = ? AND other_user_id = ?  AND delete_flag = 0";

      connection.query(sqlNotification, [notification_message_id, user_id], (err, result) => {

        if (err) {

          return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, key: '6' });

        } else {



          let delete_flag = 1;

          var sqlNotification = "UPDATE user_notification_message SET delete_flag = ? ,updatetime= now() WHERE notification_message_id=? AND other_user_id = ? ";

          connection.query(sqlNotification, [delete_flag, notification_message_id, user_id], (err, result) => {

            if (err) {

              return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, key: '2' });

            } else {

              return response.status(200).json({ success: true, msg: languageMessagess.notificationDelete });

            }

          })

        }

      });

    });










  } catch (error) {

    console.error("Error in try block:", error);

    return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

  }

}

// delete notification end



// delete All notification start

const deleteAllNotification = (request, response) => {

  const { user_id } = request.body;

  try {

    if (!user_id) {

      return response.status(200).json({ success: false, msg: languageMessagess.msg_empty_param, key: 'user_id' });

    }

    // cheak user start

    var sql1 = `SELECT user_id,active_flag FROM user_master WHERE delete_flag = 0 AND user_id = ?`;

    var values1 = [user_id];

    connection.query(sql1, values1, async (err, information) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, data: {} });

      }

      if (information.length === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.msgUserNotFound, data: {} });

      }


      if (information[0].active_flag === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.accountdeactivated, active_status: 0 });

      }

    });

    // cheak user end





    var sqlNotification = "SELECT notification_message_id FROM user_notification_message where other_user_id = ?  AND delete_flag = 0";

    connection.query(sqlNotification, [user_id], (err, result) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, key: '6' });

      } else {



        let delete_flag = 1;

        var sqlNotification = "UPDATE user_notification_message SET delete_flag = ? ,updatetime= now() WHERE  other_user_id = ? ";

        connection.query(sqlNotification, [delete_flag, user_id], (err, result) => {

          if (err) {

            return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, key: '2' });

          } else {
            return response.status(200).json({ success: true, msg: languageMessagess.notificationDelete });

          }

        })

      }

    });

  } catch (error) {

    console.error("Error in try block:", error);

    return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

  }

}

// delete all notification end


async function oneSignalNotificationSend(title, message, jsonData, player_id_arr) {

  try {

    const oneSignalAppId = "682007cb-c945-49d5-9d56-eba288e0f821";

    const oneSignalAuthorization = "YzhhYzNlNzQtZWQ5Mi00NzNmLWExNDgtMmVlZWYwMGJlNmMz";



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

      return response.status(200).json({ success: false, msg: languageMessagess.msg_empty_param, key: 'user_id' });

    }



    var sqlVal = "SELECT user_id,active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";

    await connection.query(sqlVal, [user_id], async (err, info) => {

      if (err) {

        return response.status(200).json({ success: false, msg: languageMessagess.internalServerError });

      }

      if (info.length <= 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.msgUserNotFound });

      }



      if (info[0].active_flag === 0) {

        return response.status(200).json({ success: false, msg: languageMessagess.accountdeactivated, active_status: 0 });

      }





      // check notification count start



      const getCount = "SELECT count(notification_message_id) as count FROM user_notification_message WHERE delete_flag=0 and other_user_id=? and read_status = 0";

      await connection.query(getCount, [user_id], (getCountError, getCountResult) => {



        if (getCountError) {

          return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, getCountError });

        }



        let notificationCount = 0;



        if (getCountResult.length > 0) {



          notificationCount = getCountResult[0].count;



        }



        return response.status(200).json({ success: true, msg: languageMessagess.msgDataFound, notificationCount });



      })



      // check notification count end



    });







  } catch (error) {

    return response.status(200).json({ success: false, msg: languageMessagess.internalServerError, error });

  }



}



// get notification count end


async function getUser(userId) {
  return new Promise((resolve, reject) => {
    const query1 = "SELECT  `user_id`, `login_type`, `login_type_first`, `user_type`, `email`, `password`, `username`, `f_name`, `l_name`, `name`, `dob`, `age`, `phone_code`, `mobile`, `otp`, `otp_verify`, `image`, `gender`, `address`, `latitude`, `longitude`, `zipcode`, `bio`, `bio_type`, `active_flag`, `approve_flag`, `profile_complete`, `language_id`, `facebook_id`, `google_id`, `twitter_id`, `instagram_id`, `apple_id`, `notification_status`, `delete_flag`, `delete_reason`, `createtime`, `updatetime`, `mysqltime`, `signup_step`, `avatar_id`, `currect_location_permanent`, `about` FROM user_master WHERE user_id = ? and delete_flag=0";

    connection.query(query1, [userId], async (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      if (results.length > 0) {
        const user = results[0];
        try {
          const userDataArray = {
            user_id: user.user_id,
            login_type: user.login_type,
            login_type_first: user.login_type_first,
            user_type: user.user_type,
            email: user.email,
            username: user.username,
            f_name: user.f_name,
            l_name: user.l_name,
            name: user.name,
            dob: user.dob,
            age: user.age,
            phone_code: user.phone_code,
            mobile: user.mobile,
            otp: user.otp,
            otp_verify: user.otp_verify,
            image: user.image,
            gender: user.gender,
            address: user.address,
            latitude: user.latitude,
            longitude: user.longitude,
            zipcode: user.zipcode,
            active_flag: user.active_flag,
            approve_flag: user.approve_flag,
            profile_complete: user.profile_complete,
            language_id: user.language_id,
            facebook_id: user.facebook_id,
            google_id: user.google_id,
            apple_id: user.apple_id,
            notification_status: user.notification_status,
            delete_reason: user.delete_reason,
            createtime: user.createtime,
            updatetime: user.updatetime,
            bio: user.bio,
            bio_type: user.bio_type,
            signup_step: user.signup_step,
            about: user.about,
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


