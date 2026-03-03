const mysql = require('mysql');
require('dotenv').config();


// Create a MySQL connection
const connection = mysql.createConnection({
   host: "localhost",
   user: "meditrek_thera_data",
   password: "T3NZD8S.lX[W)qa,",
   database: "meditrek_thera_data",
});



// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL');
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

module.exports = connection