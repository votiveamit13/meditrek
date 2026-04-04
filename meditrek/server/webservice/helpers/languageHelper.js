const connection = require('../connection'); // adjust path

const getUserLanguage = ({ email = null, user_id = null }) => {
    return new Promise((resolve, reject) => {

        // Default fallback
        if (!email && !user_id) {
            return resolve("en");
        }

        let query = `
            SELECT current_language 
            FROM user_master 
            WHERE delete_flag = 0
        `;

        let params = [];

        // Dynamic condition
        if (email) {
            query += ` AND LOWER(email) = ?`;
            params.push(email.trim().toLowerCase());
        } else if (user_id) {
            query += ` AND user_id = ?`;
            params.push(user_id);
        }

        query += ` ORDER BY user_id DESC LIMIT 1`;

        connection.query(query, params, (err, results) => {

            if (err) {
                return reject(err);
            }

            if (results.length === 0) {
                return resolve("en");
            }

            resolve(results[0].current_language || "en");
        });
    });
};

module.exports = {
    getUserLanguage
};