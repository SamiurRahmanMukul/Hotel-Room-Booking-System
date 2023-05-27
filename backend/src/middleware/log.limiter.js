/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const appRoot = require('app-root-path');
const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../configs/app.response');
const currentDateTime = require('../lib/current.date.time');
const logger = require('./winston.logger');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 login requests per `window` per minute
  message: { message: 'Too many login attempts from this IP, please try again after a 60 second pause' },
  handler: async (req, res, _next, options) => {
    try {
      const LOGS_FOLDER = `${appRoot}/logs`;

      if (!fs.existsSync(path.join(LOGS_FOLDER))) {
        await fsPromises.mkdir(path.join(LOGS_FOLDER));
      }
      await fsPromises.appendFile(path.join(LOGS_FOLDER, 'log-limiter.log'), `::29 - - [${currentDateTime()}]\tMSG: ${options.message.message}\tMETHOD: ${req.method}\tURL: ${req.url}\tORIGIN: ${req.headers.origin}\n`);
    } catch (err) {
      logger.error('Login limiter error: ', err);
    }
    res.status(options.statusCode).send(errorResponse(
      29,
      'TOO MANY REQUEST',
      options.message.message
    ));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
