const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'skill_tracker_secure_jwt_secret_key_2024', {
    expiresIn: '30d',
  });
};

module.exports = { generateToken };
