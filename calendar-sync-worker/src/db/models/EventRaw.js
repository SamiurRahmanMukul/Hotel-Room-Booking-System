const mongoose = require('mongoose');

const EventRawSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  eventType: { type: String, enum: ['reservation', 'cancel', 'block', 'modify'], required: true },
  externalId: { type: String, required: true },
  payload: mongoose.Schema.Types.Mixed,
  processedAt: Date
}, { timestamps: true });

EventRawSchema.index({ channelId: 1, externalId: 1 }, { unique: true });

const MODEL_NAME = 'EventRaw';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, EventRawSchema);

module.exports = { schema: EventRawSchema, modelName: MODEL_NAME, register };
