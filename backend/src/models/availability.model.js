/**
 * Availability cell — (hotelId, roomTypeId, date) → counted units.
 *
 * This is the SINGLE canonical store for "is room-type T sellable on date D, and
 * who holds the rest?" It is the SAME `availabilities` collection the calendar-sync
 * worker writes (identical schema + unique index on purpose). The backend writes
 * firm holds (direct bookings) here as an in-process atomic decrement; the worker
 * writes soft blocks (OTA iCal) here. One collection, two writers. See CONTEXT.md.
 *
 * Keep this schema in lock-step with calendar-sync-worker/src/db/models/Availability.js.
 */

const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, required: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
  totalUnits: { type: Number, default: 1 },
  soldUnits: { type: Number, default: 0 }, // firm holds (direct bookings)
  blockedUnits: { type: Number, default: 0 }, // soft blocks (OTA channels)
  bySource: { type: Map, of: Number, default: {} },
  conflict: { type: Boolean, default: false },
  conflictDetails: String
}, { timestamps: true });

availabilitySchema.index({ hotelId: 1, roomTypeId: 1, date: 1 }, { unique: true });

const MODEL_NAME = 'Availability';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, availabilitySchema);

module.exports = { schema: availabilitySchema, modelName: MODEL_NAME, register };
