const mongoose = require('mongoose');

const SyncRunSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: Date,
  eventsProcessed: { type: Number, default: 0 },
  newReservations: { type: Number, default: 0 },
  cancellations: { type: Number, default: 0 },
  errorMessages: [String],
  durationMs: Number,
  status: { type: String, enum: ['running', 'ok', 'error'], default: 'running' }
});

const MODEL_NAME = 'SyncRun';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, SyncRunSchema);

module.exports = { schema: SyncRunSchema, modelName: MODEL_NAME, register };
