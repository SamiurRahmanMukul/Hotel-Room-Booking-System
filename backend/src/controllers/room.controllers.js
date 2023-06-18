/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const fs = require('fs');
const appRoot = require('app-root-path');
const Room = require('../models/room.model');
const logger = require('../middleware/winston.logger');
const { errorResponse, successResponse } = require('../configs/app.response');

// TODO: Controller for registration new user
exports.createRoom = async (req, res) => {
  try {
    const {
      room_name, room_slug, room_type, room_price, room_size, room_capacity, allow_pets, provide_breakfast, featured_room, room_description, extra_facilities
    } = req.body;

    // check `room_name` filed exits
    if (!room_name) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_name` filed is required '
      ));
    }

    // check `room_slug` filed exits
    if (!room_slug) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_slug` filed is required '
      ));
    }

    // check `room_type` filed exits
    if (!room_type) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_type` filed is required '
      ));
    }

    // check `room_price` filed exits
    if (!room_price) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_price` filed is required '
      ));
    }

    // check `room_size` filed exits
    if (!room_size) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_size` filed is required '
      ));
    }

    // check `room_capacity` filed exits
    if (!room_capacity) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_capacity` filed is required '
      ));
    }

    // check `room_description` filed exits
    if (!room_description) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_description` filed is required '
      ));
    }

    // check `extra_facilities[0]` filed exits
    if (!extra_facilities[0]) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `extra_facilities` filed is required '
      ));
    }

    // check `req.files[0]` filed exits
    if (!req.files[0]) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `room_images` filed is required '
      ));
    }

    // check `room_name` already exist in database
    const roomName = await Room.findOne({ room_name });
    if (roomName) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(409).json(errorResponse(
        9,
        'ALREADY EXIST',
        'Sorry, `room_name` already exists'
      ));
    }
    // check `room_slug` already exist in database
    const roomSlug = await Room.findOne({ room_slug });
    if (roomSlug) {
      for (const element of req.files) {
        fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
      return res.status(409).json(errorResponse(
        9,
        'ALREADY EXIST',
        'Sorry, `room_slug` already exists'
      ));
    }

    // prepared user input room data to store database
    const data = {
      room_name,
      room_slug,
      room_type,
      room_price,
      room_size,
      room_capacity,
      allow_pets,
      provide_breakfast,
      featured_room,
      room_description,
      extra_facilities,
      room_images: req?.files?.map((file) => ({ url: `/uploads/rooms/${file.filename}` })),
      created_by: req.user.id
    };

    // save room data in database
    const room = await Room.create(data);

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'New room create successful',
      room
    ));
  } catch (error) {
    for (const element of req.files) {
      fs.unlink(`${appRoot}/public/uploads/rooms/${element.filename}`, (err) => {
        if (err) { logger.error(err); }
      });
    }

    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
