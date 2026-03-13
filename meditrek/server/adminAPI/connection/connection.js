var mysql = require("mysql");

var connection = mysql.createConnection({
  // host: "localhost",
  host:"198.38.92.6",
  user: "meditrek_thera_data",
  password: "T3NZD8S.lX[W)qa,",
  database: "meditrek_thera_data",
});

connection.connect((err) => {

  if (err) {
    console.log("error in connection database...!!", err);
  }

  else {
    console.log("database Connected successfully..!!");
  }

});

module.exports = connection;

