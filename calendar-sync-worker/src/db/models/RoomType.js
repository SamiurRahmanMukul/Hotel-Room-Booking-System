/**
 * RoomType (worker mirror, read-mostly).
 *
 * The backend authors room types; the worker only needs `totalUnits` so it can seed
 * counted availability cells correctly (a 4-unit type must not look sold out after one
 * OTA block). Keep in lock-step with backend/src/models/room.type.model.js.
 */

const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: String,
  slug: String,
  totalUnits: { type: Number, default: 1 },
  basePrice: Number,
  capacity: Number,
  bedConfig: String,
  description: String,
  legacyEnum: { type: String, default: null }
}, { timestamps: true });

const MODEL_NAME = 'RoomTypes';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, roomTypeSchema);

module.exports = { schema: roomTypeSchema, modelName: MODEL_NAME, register };
