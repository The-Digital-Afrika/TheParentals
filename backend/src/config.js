require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  port: process.env.PORT || 5000,
};
