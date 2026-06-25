/**
 * Helper: clean up uploaded room images on validation failure.
 * Used by room.controllers.js to avoid duplicating the fs.unlink loop.
 */

const fs = require('fs');
const appRoot = require('app-root-path');
const logger = require('../middleware/winston.logger');

/**
 * Delete all files in req.files (typically room images uploaded via multer).
 * Safe to call even if req.files is undefined or empty.
 */
function cleanupUploadedFiles(req) {
  if (!req.files || req.files.length === 0) return;
  for (const element of req.files) {
    fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
      if (err) { logger.error(err); }
    });
  }
}

module.exports = { cleanupUploadedFiles };
