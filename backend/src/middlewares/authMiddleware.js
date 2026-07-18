const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sah_secret_key_change_in_production';

const authMiddleware = (roles = []) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support both { userId } (authRoutes) and { id } (authController)
    req.user = {
      id:    decoded.userId || decoded.id,
      email: decoded.email,
      role:  decoded.role,
    };

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;