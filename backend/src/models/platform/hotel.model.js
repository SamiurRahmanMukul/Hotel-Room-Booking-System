const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  dbName: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'active', 'suspended'], default: 'draft', index: true },
  contact: {
    email: String,
    phone: String,
    addressLine1: String,
    city: String,
    country: String,
    timezone: String,
    currency: String
  },
  billingPlan: { type: String, default: 'starter' },
  customDomain: String,
  suspendedAt: Date
}, { timestamps: true });

module.exports = hotelSchema;
