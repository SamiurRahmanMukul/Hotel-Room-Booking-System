/**
 * Nightly price override for a room type on a specific date.
 * (roomTypeId, date) → amount. When no override exists for a date, callers fall back to the
 * room type's basePrice. This is the apaleo "Prices" grid, one cell per type per night.
 */

const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomTypes', required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

priceSchema.index({ roomTypeId: 1, date: 1 }, { unique: true });

const MODEL_NAME = 'Prices';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, priceSchema);

module.exports = { schema: priceSchema, modelName: MODEL_NAME, register };
