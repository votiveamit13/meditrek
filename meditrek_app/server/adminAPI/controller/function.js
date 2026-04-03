const crypto = require('crypto');
const connection = require('../connection/connection');
const moment = require('moment');
const languageMessage = require('../controller/languageMessages');
const { error, info } = require('console');

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

async function getUserData(userId) {
    const query = `
        SELECT user_id, login_type, login_type_first, user_type, email, password, f_name, l_name, name, dob, 
               age, phone_code, mobile, otp, otp_verify, image, background_image, gender, address, latitude, 
               longitude, zipcode, bio, disease_id, active_flag, approve_flag, profile_complete, language_id, 
               facebook_id, google_id, twitter_id, instagram_id, apple_id, signup_step, about, qr_code, 
               qr_image, delete_flag, delete_reason, createtime, updatetime, mysqltime 
        FROM user_master 
        WHERE user_id = ? AND delete_flag = 0
    `;

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
                login_type: userData.login_type, // 0=app, 1=google, 2=apple, 3=facebook
                login_type_first: userData.login_type_first, // 0=app, 1=google, 2=apple, 3=facebook, 4=admin
                user_type: userData.user_type, // 0=admin, 1=user
                email: userData.email,
                name: userData.name,
                f_name: userData.f_name,
                l_name: userData.l_name,
                dob: userData.dob,
                age: userData.age,
                phone_code: userData.phone_code,
                mobile: userData.mobile,
                otp: userData.otp,
                otp_verify: userData.otp_verify, // 0=no, 1=yes
                image: userData.image,
                background_image: userData.background_image,
                gender: userData.gender, // 1=male, 2=female, 3=other
                address: userData.address,
                latitude: userData.latitude,
                longitude: userData.longitude,
                zipcode: userData.zipcode,
                bio: userData.bio,
                disease_id: userData.disease_id,
                active_flag: userData.active_flag, // 1=activate, 0=deactivate
                approve_flag: userData.approve_flag, // 0=unapprove, 1=approve
                profile_complete: userData.profile_complete, // 0=no, 1=yes
                language_id: userData.language_id, // 0=English
                facebook_id: userData.facebook_id,
                google_id: userData.google_id,
                twitter_id: userData.twitter_id,
                instagram_id: userData.instagram_id,
                apple_id: userData.apple_id,
                signup_step: userData.signup_step, // 1=signup, 2=otp verify, 3=add business
                about: userData.about,
                qr_code: userData.qr_code,
                qr_image: userData.qr_image,
                delete_flag: userData.delete_flag, // 0=no, 1=yes
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

module.exports = { hashPassword, generateOTP };