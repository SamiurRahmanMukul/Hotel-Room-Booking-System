const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: {
    type: String,
    enum: [
      'ical_in',
      'ical_out',
      'booking_com_api',
      'expedia_eqc',
      'airbnb_api',
      'aggregator_cloudbeds',
      'aggregator_siteminder',
      'google_hotels'
    ],
    required: true
  },
  name: { type: String, required: true },
  icalUrl: String,
  credentials: { type: String },
  pollIntervalSeconds: { type: Number, default: 1800 },
  enabled: { type: Boolean, default: true },
  lastSyncAt: Date,
  lastSyncStatus: { type: String, enum: ['ok', 'error', 'pending'], default: 'pending' },
  lastError: String
}, { timestamps: true });

ChannelSchema.index({ hotelId: 1, roomTypeId: 1, type: 1 });

const MODEL_NAME = 'Channel';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, ChannelSchema);

module.exports = { schema: ChannelSchema, modelName: MODEL_NAME, register };
