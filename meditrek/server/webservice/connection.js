// const mysql = require('mysql');
// require('dotenv').config();

// const connection = mysql.createConnection({
//    host: "198.38.92.6",
//    user: "meditrek_thera_data",
//    password: "T3NZD8S.lX[W)qa,",
//    database: "meditrek_thera_data",
// });

// connection.connect((err) => {
//     if (err) {
//         console.error('Error connecting to MySQL');
//         return;
//     }
//     console.log('Connected to MySQL as id ' + connection.threadId);
// });

// module.exports = connection

const mysql = require('mysql');
require('dotenv').config();

const connection = mysql.createPool({
   host: "198.38.92.6",
   user: "meditrek_thera_data",
   password: "T3NZD8S.lX[W)qa,",
   database: "meditrek_thera_data",
   charset: "utf8mb4",
   connectionLimit: 10
});

connection.getConnection((err, conn) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL as id ' + conn.threadId);
    conn.release();
});

module.exports = connection;