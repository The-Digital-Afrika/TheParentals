const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

const authMiddleware = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
