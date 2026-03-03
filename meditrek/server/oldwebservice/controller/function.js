const crypto = require('crypto');
const connection = require('../connection/connection');

async function hashPassword(password) {
    const hash = crypto.createHash('md5');

    hash.update(password);

    return hash.digest('hex');
}

// const hashPassword = (password) => {
//     return crypto.createHash('md5').update(password).digest('hex'); // MD5 Hashing
// };


async function generateOTP(limit) {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < limit; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}



async function DeviceTokenStore_1_Signal(user_id, device_type, player_id) {
    
    return new Promise((resolve, reject) => {
        try {
            // Check if player_id exists
            const checkQuery = "SELECT player_id FROM user_notification WHERE user_id=?";
            connection.query(checkQuery, [user_id], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                if (rows.length > 0) {
                    // Update record if player_id exists
                    const updateQuery = `UPDATE user_notification SET user_id = ?, device_type = ?,player_id=?, inserttime = now() WHERE user_id=?`;
                    connection.query(updateQuery, [user_id, device_type,player_id,user_id], (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve("Updated successfully.");
                    });
                } else {
                    // Insert a new record if player_id does not exist
                    const insertQuery = `INSERT INTO user_notification (user_id, device_type, player_id, inserttime) 
                        VALUES (?, ?, ?, now())`;
                    connection.query(insertQuery, [user_id, device_type, player_id], (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve("Inserted successfully.");
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}
async function getUserData(userId) {
    const query = `
        SELECT user_id, login_type, login_type_first, user_type, email, password, f_name, l_name, name, 
               owner_name, business_name, dob, age, phone_code, mobile, otp, otp_verify, image, background_image, 
               gender, address, latitude, longitude, zipcode, bio, active_flag, approve_flag, profile_complete, 
               language_id, facebook_id, google_id, twitter_id, instagram_id, apple_id, signup_step, about, 
               category_id, qr_code, qr_image, delete_flag, delete_reason, createtime, updatetime, mysqltime 
        FROM user_master 
        WHERE user_id = ? AND delete_flag = 0`;

    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.length > 0) {
            const userData = results[0];
            return {
                user_id: userData.user_id,
                login_type: userData.login_type,
                login_type_first: userData.login_type_first,
                user_type: userData.user_type,
                email: userData.email,
                password: userData.password,
                f_name: userData.f_name,
                l_name: userData.l_name,
                name: userData.name,
                owner_name: userData.owner_name,
                business_name: userData.business_name,
                dob: userData.dob,
                age: userData.age,
                phone_code: userData.phone_code,
                mobile: userData.mobile,
                otp: userData.otp,
                otp_verify: userData.otp_verify,
                image: userData.image,
                background_image: userData.background_image,
                gender: userData.gender,
                address: userData.address,
                latitude: userData.latitude,
                longitude: userData.longitude,
                zipcode: userData.zipcode,
                bio: userData.bio,
                disease_id: userData.disease_id,
                active_flag: userData.active_flag,
                approve_flag: userData.approve_flag,
                profile_complete: userData.profile_complete,
                language_id: userData.language_id,
                facebook_id: userData.facebook_id,
                google_id: userData.google_id,
                twitter_id: userData.twitter_id,
                instagram_id: userData.instagram_id,
                apple_id: userData.apple_id,
                signup_step: userData.signup_step,
                about: userData.about,
                category_id: userData.category_id,
                qr_code: userData.qr_code,
                qr_image: userData.qr_image,
                delete_flag: userData.delete_flag,
                delete_reason: userData.delete_reason,
                createtime: userData.createtime,
                updatetime: userData.updatetime,
                mysqltime: userData.mysqltime
            };
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
}

async function getUserForgotPasswordDetails(user_id){
    return new Promise(async (resolve, reject) => {
      connection.query("select * from forgot_password_master where user_id = ? AND delete_flag = 0",[user_id],async (error, rows) => {
        if(error){
          reject(error); // Reject the promise with the error
        }else{
          if(rows.length > 0){
            const userData = rows[0];
            resolve(userData);
        }else{
          resolve("NA");
        }
      }
      resolve("NA");
    });
  });
  }


module.exports={
    hashPassword,
    generateOTP,
    DeviceTokenStore_1_Signal,
    getUserData,
    getUserForgotPasswordDetails
}