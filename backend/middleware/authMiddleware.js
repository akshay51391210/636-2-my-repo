
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// backend/middleware/checkRole.js
module.exports = (...allow) => (req, res, next) => {
  try {
    if (!req.user || !allow.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = { protect };
