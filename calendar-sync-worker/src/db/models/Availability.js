const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  totalUnits: { type: Number, default: 1 },
  soldUnits: { type: Number, default: 0 },
  blockedUnits: { type: Number, default: 0 },
  bySource: { type: Map, of: Number, default: {} },
  conflict: { type: Boolean, default: false },
  conflictDetails: String
}, { timestamps: true });

AvailabilitySchema.index({ hotelId: 1, roomTypeId: 1, date: 1 }, { unique: true });

const MODEL_NAME = 'Availability';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, AvailabilitySchema);

module.exports = { schema: AvailabilitySchema, modelName: MODEL_NAME, register };
