/**
 * Policy (apaleo) — a cancellation or no-show policy referenced by rate plans / bookings.
 * Cancellation: a free-cancellation window (months/days/hours before arrival or after booking)
 * plus a fee (fixed and/or percent) charged after the window.
 */

const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  type: { type: String, enum: ['cancellation', 'noshow'], required: true },
  code: { type: String, trim: true, uppercase: true, default: '' },
  name: { type: String, required: [true, 'Policy name is required'], trim: true }, // English
  description: { type: String, default: '' }, // English
  translations: {
    bg: {
      name: { type: String, default: '' },
      description: { type: String, default: '' }
    }
  },
  // free-cancellation window (cancellation policies only)
  period: {
    months: { type: Number, default: 0, min: 0 },
    days: { type: Number, default: 0, min: 0 },
    hours: { type: Number, default: 0, min: 0 },
    reference: { type: String, enum: ['after_booking', 'before_arrival'], default: 'before_arrival' }
  },
  // fee charged after the window (or for no-show): fixed amount and/or percent of net
  fee: {
    fixed: { type: Number, default: null },
    percent: { type: Number, default: null }
  },
  vatType: { type: String, default: 'Without' }
}, { timestamps: true });

policySchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $gt: '' } } });

const MODEL_NAME = 'Policies';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, policySchema);

module.exports = { schema: policySchema, modelName: MODEL_NAME, register };
