/**
 * Paid service (apaleo "Service") — a sellable extra: breakfast, cleaning, WLAN, etc.
 * Has a price, VAT, and who it's delivered to (per guest / per unit / per night).
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Service name is required'], trim: true },
  code: { type: String, trim: true, uppercase: true, default: '' },
  serviceType: {
    type: String,
    enum: ['FoodAndBeverages', 'Other', 'CityTax', 'Parking'],
    default: 'Other'
  },
  price: { type: Number, default: 0, min: 0 },
  vatPct: { type: Number, default: 0, min: 0 },
  // apaleo pricing: Per Room or Per Guest
  pricingMode: { type: String, enum: ['per_room', 'per_guest'], default: 'per_guest' },
  deliveredTo: {
    type: String,
    enum: ['per_guest', 'per_unit', 'per_night'],
    default: 'per_guest'
  },
  // when the service is offered during a stay
  availability: {
    when: { type: String, enum: ['entire_stay', 'first_night', 'last_night'], default: 'entire_stay' },
    offeredDays: { type: String, enum: ['everyday', 'weekdays', 'weekends'], default: 'everyday' },
    nextDay: { type: Boolean, default: false }
  },
  description: { type: String, default: '' }, // English
  translations: {
    bg: {
      name: { type: String, default: '' },
      description: { type: String, default: '' }
    }
  }
}, { timestamps: true });

// service codes are unique when set (empty exempt)
serviceSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $gt: '' } } });

const MODEL_NAME = 'Services';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, serviceSchema);

module.exports = { schema: serviceSchema, modelName: MODEL_NAME, register };
