/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const mongoose = require('mongoose');
const { validateBookingDates } = require('../lib/booking.dates.validator');

const bookingSchema = new mongoose.Schema({
  // Canonical booking target: the counted room type. Availability is held against this.
  roomTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomTypes'
  },
  // Physical room ASSIGNMENT — filled near check-in, not at booking time (nullable).
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rooms'
  },
  booking_dates: {
    type: [Date],
    required: [true, 'Booking `booking_dates` is required field'],
    validate: [validateBookingDates, 'Please provide valid future dates for `booking_dates`']
  },
  booking_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'cancel', 'approved', 'rejected', 'in-reviews', 'completed'],
    required: [true, 'Room status is required field.']
  },
  booking_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: [true, 'User id is required field']
  },
  reviews: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reviews'
  },
  guests: {
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 }
  },
  guest_country: {
    type: String,
    default: '',
    maxlength: 2 // ISO-3166-1 alpha-2
  },
  booking_source: {
    type: String,
    default: 'direct',
    enum: ['direct', 'airbnb', 'booking.com', 'vrbo', 'expedia', 'other']
  },
  payment: {
    amount: { type: Number, min: 0 },
    currency: { type: String, default: 'EUR' },
    method: {
      type: String,
      enum: [null, '', 'card', 'cash', 'check', 'bank_transfer', 'epay', 'apple_pay', 'google_pay', 'on_arrival'],
      default: null
    },
    status: {
      type: String,
      enum: ['unpaid', 'pending', 'partial', 'paid', 'refunded'],
      default: 'unpaid'
    },
    paid_at: { type: Date, default: null }
  },
  notes: {
    type: String,
    default: '',
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// updatedAt' field before saving or updating a document
bookingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const MODEL_NAME = 'Bookings';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, bookingSchema);

module.exports = { schema: bookingSchema, modelName: MODEL_NAME, register };
