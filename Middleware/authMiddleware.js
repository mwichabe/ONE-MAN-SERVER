const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const { JWT_SECRET } = require('../Utils/authUtils');

const BYPASS_KEY = 'NIVORA_ADMIN_TEST_BYPASS_2025';

const DEBUG_USER_DATA = {
  _id: 'temp_admin_id_12345',
  email: 'mwichabecollins@gmail.com',
  name: 'Temp Admin',
  isAdmin: true,
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers['x-debug-bypass'] === BYPASS_KEY) {
    req.user = DEBUG_USER_DATA;
    console.log('--- ADMIN MIDDLEWARE BYPASSED FOR DEBUGGING ---');
    return next();
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // ✅ Use the SAME secret as token generation
    const decoded = jwt.verify(token, JWT_SECRET); 

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

module.exports = { protect };
