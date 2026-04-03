const multer = require('multer');



// Set up multer storage

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, 'uploads/');

    },

    filename: (req, file, cb) => {

        cb(null, Date.now() + '-' + file.originalname);

    },

});

const upload1 = multer({ storage: storage });



module.exports = upload1;