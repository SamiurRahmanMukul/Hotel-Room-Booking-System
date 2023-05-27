/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const router = require('express').Router();
const avatarUpload = require('../middleware/user.avatar.upload');
const logLimiter = require('../middleware/log.limiter');
const { isAuthenticatedUser, isRefreshTokenValid, isBlocked } = require('../middleware/app.authentication');
const {
  register, loginUser, logoutUser, forgotPassword, resetPassword, changePassword, sendEmailVerificationLink, emailVerification, refreshToken
} = require('../controllers/auth.controllers');

// routes for register, login and logout user
router.route('/auth/registration').post(avatarUpload.single('avatar'), register);
router.route('/auth/login').post(logLimiter, avatarUpload.none(), loginUser);
router.route('/auth/logout').post(isAuthenticatedUser, isBlocked, logoutUser);

// routes for forgot & change password
router.route('/auth/forgot-password').post(forgotPassword);
router.route('/auth/reset-password/:token').post(resetPassword);
router.route('/auth/change-password').post(isAuthenticatedUser, isBlocked, changePassword);

// routes for user email verification
router.route('/auth/send-email-verification-link').post(isAuthenticatedUser, isBlocked, sendEmailVerificationLink);
router.route('/auth/verify-email/:token').post(isAuthenticatedUser, isBlocked, emailVerification);

// route for get user refresh JWT Token
router.route('/auth/refresh-token').get(isRefreshTokenValid, refreshToken);

module.exports = router;
