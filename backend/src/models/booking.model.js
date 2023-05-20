const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rooms',
    required: [true, 'Room id is required field']
  },
  booking_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User id is required field']
  },
  booking_status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'running', 'competed'],
    required: [true, 'Category name is required field.']
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

module.exports = mongoose.model('Booking', bookingSchema);
