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
const appRoot = require('app-root-path');
const rateLimit = require('express-rate-limit');
const FileStreamRotator = require('file-stream-rotator');
const { errorResponse } = require('../configs/app.response');
const currentDateTime = require('../lib/current.date.time');
const logger = require('./winston.logger');

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // limit each IP to 1000 requests per `window` (here, per 10 minutes)
  message: { message: 'Too many login attempts from this IP, please try again after a 60 second pause' },
  handler: async (req, res, _next, options) => {
    try {
      const LOGS_FOLDER = `${appRoot}/logs/limiter`;

      // if not logs folder exists to create folder
      if (!fs.existsSync(`${appRoot}/logs`)) {
        fs.mkdirSync(`${appRoot}/logs`);
      }

      // if not limiter folder exists to create folder
      if (!fs.existsSync(LOGS_FOLDER)) {
        fs.mkdirSync(LOGS_FOLDER);
      }

      // create a rotating write stream
      const apiLimiterRotator = FileStreamRotator.getStream({
        date_format: 'YYYY-MM-DD',
        filename: path.join(LOGS_FOLDER, 'app-limiter-%DATE%.log'),
        frequency: 'daily',
        verbose: false
      });

      const logMessage = `[${currentDateTime()}]\tTITLE: TOO MANY REQUEST\tMETHOD: ${req.method}\tURL: ${req.url}\tCLIENT: ${req.headers['user-agent']}\n`;

      apiLimiterRotator.write(logMessage, 'utf8');
    } catch (err) {
      logger.error('API limiter error: ', err);
    }

    // sending API error response
    res.status(options.statusCode).send(errorResponse(
      29,
      'TOO MANY REQUEST',
      options.message.message
    ));
  },
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // disable the `X-RateLimit-*` headers
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 10 login requests per `window` (here, per 1 minutes)
  message: { message: 'Too many login attempts from this IP, please try again after a 60 second pause' },
  handler: async (req, res, _next, options) => {
    try {
      const LOGS_FOLDER = `${appRoot}/logs/limiter`;

      // if not logs folder exists to create folder
      if (!fs.existsSync(`${appRoot}/logs`)) {
        fs.mkdirSync(`${appRoot}/logs`);
      }

      // if not limiter folder exists to create folder
      if (!fs.existsSync(LOGS_FOLDER)) {
        fs.mkdirSync(LOGS_FOLDER);
      }

      // create a rotating write stream
      const apiLimiterRotator = FileStreamRotator.getStream({
        date_format: 'YYYY-MM-DD',
        filename: path.join(LOGS_FOLDER, 'api-limiter-%DATE%.log'),
        frequency: 'daily',
        verbose: false
      });

      const logMessage = `[${currentDateTime()}]\tTITLE: TOO MANY REQUEST\tMETHOD: ${req.method}\tURL: ${req.url}\tCLIENT: ${req.headers['user-agent']}\n`;

      apiLimiterRotator.write(logMessage, 'utf8');
    } catch (err) {
      logger.error('API limiter error: ', err);
    }

    // sending API error response
    res.status(options.statusCode).send(errorResponse(
      29,
      'TOO MANY REQUEST',
      options.message.message
    ));
  },
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // disable the `X-RateLimit-*` headers
});

module.exports = { limiter, apiLimiter };
