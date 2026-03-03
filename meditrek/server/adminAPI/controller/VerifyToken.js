const jwt = require("jsonwebtoken");

const SECRET_KEY = "SECRETKEYHERE";

const verifyToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if (!authHeader) {

      return res.status(401).json({ error: 'Authorization header is missing' });

    }

    // Check if the authorization header starts with 'Bearer '

    if (!authHeader.startsWith('Bearer ')) {

      return res.status(401).json({ error: 'Invalid token format' });

    }

    const token = authHeader.split(' ')[1];

    if (!token) {

      return res

        .status(200)

        .json({ success: false, message: "Access denied. No token provided." });

    }

    try {

      const decoded = jwt.verify(token, SECRET_KEY);

      req.doctor_id = decoded.subject;

      next();

    } catch (err) {

      return res.status(200).json({ success: false, message: "Invalid token.",});

    }

  };



module.exports = { verifyToken }