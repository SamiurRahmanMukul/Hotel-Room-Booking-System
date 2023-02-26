const jwt = require('jsonwebtoken');
const { errorResponse } = require('../configs/app.response');
const User = require('../models/user.model');

// TODO: Middleware for detect authenticated logging user
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    // get access token form authorization headers
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(403).json(errorResponse(
        3,
        'ACCESS FORBIDDEN',
        'Authorization headers is required'
      ));
    }

    // split token from authorization header
    const token = authorization.split(' ')[1];

    // verify token
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, dec) => {
      if (err) {
        return res.status(404).json(errorResponse(
          11,
          'JWT TOKEN INVALID',
          'JWT token is expired/invalid. Please logout and login again'
        ));
      }

      // check if user exists
      const user = await User.findById(dec.id);

      if (!user) {
        return res.status(404).json(errorResponse(
          4,
          'UNKNOWN ACCESS',
          'Authorization headers is missing/invalid'
        ));
      }

      // check if user is logged in
      if (user.status === 'login') {
        req.user = user;
        next();
      } else {
        return res.status(401).json(errorResponse(
          1,
          'FAILED',
          'Unauthorized access. Please login to continue'
        ));
      }
    });
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Middleware for login user JWT refresh-token validate
exports.isRefreshTokenValid = async (req, res, next) => {
  try {
    // get refresh token form authorization headers
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(403).json(errorResponse(
        3,
        'ACCESS FORBIDDEN',
        'Authorization headers is required'
      ));
    }

    // split token from authorization header
    const token = authorization.split(' ')[1];

    // verify token
    jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET_KEY, async (err, dec) => {
      if (err) {
        return res.status(404).json(errorResponse(
          11,
          'JWT TOKEN INVALID',
          'JWT token is expired/invalid. Please logout and login again'
        ));
      }

      // check if user exists
      const user = await User.findById(dec.id);

      if (!user) {
        return res.status(404).json(errorResponse(
          4,
          'UNKNOWN ACCESS',
          'Authorization headers is missing/invalid'
        ));
      }

      // check if user is logged in
      if (user.status === 'login') {
        req.user = user;
        next();
      } else {
        return res.status(401).json(errorResponse(
          1,
          'FAILED',
          'Unauthorized access. Please login to continue'
        ));
      }
    });
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Middleware for check user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    // get user from requested user
    const { user } = req;

    if (!user) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Sorry, User does not exist'
      ));
    }

    // check user status is admin
    if (user.role === 'admin') {
      next();
    } else {
      return res.status(406).json(errorResponse(
        6,
        'UNABLE TO ACCESS',
        'Accessing the page or resource you were trying to reach is forbidden'
      ));
    }
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Middleware for check user is blocked
exports.isBlocked = async (req, res, next) => {
  try {
    // get user from requested user
    const { user } = req;

    if (!user) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Sorry, User does not exist'
      ));
    }

    // check user status is blocked
    if (user.role !== 'blocked') {
      next();
    } else {
      return res.status(406).json(errorResponse(
        6,
        'UNABLE TO ACCESS',
        'Accessing the page or resource you were trying to reach is forbidden'
      ));
    }
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
