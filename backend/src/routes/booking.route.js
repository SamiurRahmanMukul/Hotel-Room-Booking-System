/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const { validate } = require('../middleware/validate');
const { placeBookingSchema, updateBookingStatusSchema } = require('../lib/validation.schemas');
const {
  placedBookingOrder, getBookingOrderByUserId, cancelSelfBookingOrder, getBookingOrderForAdmin, updatedBookingOrderByAdmin, patchBookingInline, assignRoomToBooking
} = require('../controllers/booking.controllers');

// route for placed a room booking order
router.route('/placed-booking-order/:id').post(isAuthenticatedUser, isBlocked, validate(placeBookingSchema), placedBookingOrder);

// routes for a user get bookings list and cancel booking order
router.route('/get-user-booking-orders').get(isAuthenticatedUser, isBlocked, getBookingOrderByUserId);
router.route('/cancel-booking-order/:id').put(isAuthenticatedUser, isBlocked, cancelSelfBookingOrder);

// routes for admin get all bookings list, rejected, approved and checkout placed order
router.route('/get-all-booking-orders').get(isAuthenticatedUser, isBlocked, isAdmin, getBookingOrderForAdmin);
router.route('/updated-booking-order/:id').put(isAuthenticatedUser, isBlocked, isAdmin, validate(updateBookingStatusSchema), updatedBookingOrderByAdmin);
router.route('/booking/:id').patch(isAuthenticatedUser, isBlocked, isAdmin, patchBookingInline);
router.route('/booking/:id/assign-room').patch(isAuthenticatedUser, isBlocked, isAdmin, assignRoomToBooking);

module.exports = router;
