/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const Room = require('../models/room.model');
const Booking = require('../models/booking.model');
const { errorResponse, successResponse } = require('../configs/app.response');

// TODO: controller for placed booking order
exports.placedBookingOrder = async (req, res) => {
  try {
    // finding by room by room id
    let myRoom = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      myRoom = await Room.findById(req.params.id);
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably room id missing/incorrect'
      ));
    }

    // check room available
    if (!myRoom) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // check room status is`unavailable`
    if (myRoom.room_status === 'unavailable') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! Current your sleeted room can\'t available'
      ));
    }

    // check room status is `booked`
    if (myRoom.room_status === 'booked') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! Current your sleeted already booked. Please try again later'
      ));
    }

    // prepared user provided data to store database
    const data = {
      room_id: req.params.id,
      booking_dates: req.body.booking_dates,
      booking_by: req.user.id
    };

    // save room data in database
    const booking = await Booking.create(data);

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'Your room booking order placed successful',
      booking
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
