/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const Booking = require('../models/booking.model');
const Review = require('../models/review.modal');
const { errorResponse, successResponse } = require('../configs/app.response');

// TODO: controller for room review add
exports.roomReviewAdd = async (req, res) => {
  try {
    const { rating, message } = req.body;

    // check `rating` filed exits
    if (!rating) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`rating` filed is required'
      ));
    }

    // check `message` filed exits
    if (!message) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`message` filed is required'
      ));
    }

    // finding by a booking by id
    let myBooking = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      myBooking = await Booking.findById(req.params.id);
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably booking id missing/incorrect'
      ));
    }

    // check room available
    if (!myBooking) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Booking does not exist'
      ));
    }

    // check booking already add reviews
    if (myBooking.reviews) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! This booking already add an review'
      ));
    }

    // check booking status is `in-reviews`
    if (myBooking.booking_status !== 'in-reviews') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Invalid booking status for adding a review'
      ));
    }

    // create a user new room review
    const newReview = new Review({
      user_id: req.user.id,
      room_id: myBooking.room_id,
      booking_id: req.params.id,
      rating,
      message
    });

    // save the review in database
    const savedReview = await newReview.save();

    // update the booking with the review ID
    myBooking.reviews = savedReview._id;
    myBooking.booking_status = 'completed';
    await myBooking.save();

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'Your room booking order placed successful',
      savedReview
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
