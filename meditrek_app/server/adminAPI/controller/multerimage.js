const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = function (req, file, cb) {
  const allowedExtensions = /jpeg|jpg|png|webp|xlsx|xls/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const imageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const excelMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  const mimetype = imageMimes.includes(file.mimetype) || excelMimes.includes(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, WEBP images and Excel files (xls/xlsx) are allowed!'));
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
});

module.exports = upload;
