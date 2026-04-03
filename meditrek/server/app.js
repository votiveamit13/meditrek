const express = require('express');

const bodyParser = require('body-parser');

const adminRouter = require('./adminAPI/router/router');

const userRouter = require('./webservice/routes/app_routes');

const cors = require('cors');
var cron = require('node-cron');
const { cronJobFunction } = require('./webservice/controller/app_controller');






const app = express();
const i18n = require('i18n');
const path = require('path');


i18n.configure({
  locales: ['en', 'fr', 'de', 'es', 'pt', 'ar', 'it'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  queryParameter: 'lang',
  autoReload: true,
  syncFiles: true
});

app.use(i18n.init);
app.use(cors());



app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.use('/meditrek/server/adminAPI', adminRouter);

app.use('/meditrek/server/webservice', userRouter);


app.get('/meditrek/server',(req,res) => {
    res.send('Server Is Running');
})



// Cron Job Setup
// cron.schedule('0 0 * * *', () => {
//     console.log('Running Cron Job at:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
//     cronJobFunction();
// }, {
//     scheduled: true,
//     timezone: "Asia/Kolkata"
// });

cron.schedule('* * * * *', () => {
    cronJobFunction();
});





app.listen(3009, () => {

    console.log('Server running at http://localhost:3009');

});







