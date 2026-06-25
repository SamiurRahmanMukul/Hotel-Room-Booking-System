const mongoose = require('mongoose');

const bookingClaimSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rooms',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookings',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookingClaimSchema.index({ room_id: 1, date: 1 }, { unique: true });

const MODEL_NAME = 'BookingClaims';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, bookingClaimSchema);

module.exports = { schema: bookingClaimSchema, modelName: MODEL_NAME, register };
