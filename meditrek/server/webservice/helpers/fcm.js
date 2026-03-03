const admin = require('./firebase');

async function sendFCMPush({ token, title, body, data }) {
  try {
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: data ? data : {},
      android: {
        priority: "high"
      },
      apns: {
        headers: {
          "apns-priority": "10"
        },
        payload: {
          aps: {
            alert: {
              title,
              body
            },
            sound: "default",
            badge: 1
          }
        }
      }
    };


    const response = await admin.messaging().send(message);
    console.log("FCM Sent:", response);
    return true;
  } catch (err) {
    console.error("FCM Error:", err.message);
    return {
      ok: false,
      error: err.message,
      code: err.code || null,
      raw: err
    };
    
  }
}

module.exports = sendFCMPush;
