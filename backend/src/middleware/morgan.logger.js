/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const FileStreamRotator = require('file-stream-rotator');
const morgan = require('morgan');

function morganLogger() {
  const LOGS_FOLDER = `${appRoot}/logs/access`;

  // if not exist logs folder to create
  if (!fs.existsSync(`${appRoot}/logs`)) {
    fs.mkdirSync(`${appRoot}/logs`);
  }

  // if not exist access folder to create
  if (!fs.existsSync(LOGS_FOLDER)) {
    fs.mkdirSync(LOGS_FOLDER);
  }

  // create a rotating write stream
  const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(LOGS_FOLDER, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
  });

  return (morgan('combined', { stream: accessLogStream }));
}

module.exports = morganLogger;
