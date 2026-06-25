/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = () => {
  const UPLOADS_FOLDER = './public/uploads/rooms';

  // if not exists to `upload` folder to create
  if (!fs.existsSync('./public/uploads')) {
    fs.mkdirSync('./public/uploads', { recursive: true });
  }

  // if not exists to `rooms` folder to create
  if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
  }

  return UPLOADS_FOLDER;
};

// define the storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath());
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${file.originalname.replace(fileExt, '').toLowerCase().split(' ').join('-')}-${Date.now()}`;

    cb(null, fileName + fileExt);
  }
});

// Accept the formats most cameras and CMSs export today.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif'
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB per image

// prepare the final multer upload object
const roomImageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_BYTES
  },
  fileFilter: (_req, files, cb) => {
    if (files.fieldname === 'room_images' || files.fieldname === 'avatar') {
      if (ALLOWED_MIME.has(files.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Allowed image formats: JPG, PNG, WEBP, AVIF, HEIC. Got: ' + files.mimetype));
      }
    } else {
      cb(new Error('Unexpected upload field: ' + files.fieldname));
    }
  }
});

module.exports = roomImageUpload;
