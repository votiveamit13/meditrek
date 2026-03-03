const jwt = require('jsonwebtoken')
const key = '123456'

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(200).json({ success: false, message: 'No token provided.' });
  }

  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(200).json({ success: false, message: 'Token expired.', tokenExpire: 1 });
      }
      return res.status(200).json({ success: false, message: 'Failed to authenticate token.' });
    }

    req.userId = decoded.subject;
    next();
  });
};

module.exports = { verifyToken }