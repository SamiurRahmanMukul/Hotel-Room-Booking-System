/**
 * Room type — the canonical, hotel-authored unit of sellable inventory.
 *
 * Availability is tracked per room type (counted units), NOT per physical room.
 * See CONTEXT.md → "Room type". A hotel with unique rooms is simply a room type
 * whose `totalUnits = 1`. Each physical `room` references a roomTypeId.
 */

const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Room type name is required'], trim: true },
  slug: { type: String, trim: true, lowercase: true },
  // apaleo unit-group category: only BedRoom counts toward room occupancy.
  category: {
    type: String,
    enum: ['BedRoom', 'MeetingRoom', 'EventSpace', 'ParkingLot'],
    default: 'BedRoom'
  },
  // counted inventory: number of physical rooms generated for this type (set via Total units).
  totalUnits: { type: Number, required: true, min: 0, default: 0 },
  basePrice: { type: Number, default: 0, min: 0 }, // priced via rate plans later, not on this form
  capacity: { type: Number, default: 1, min: 1 }, // = apaleo maxPersons
  // lower rank shows first in availability/offers (apaleo "rank")
  rank: { type: Number, default: 0 },
  bedConfig: { type: String, default: '' }, // legacy — bed config is per physical room now
  description: { type: String, default: '' }, // English description
  // additional-language name/description (English lives in name/description above)
  translations: {
    bg: {
      name: { type: String, default: '' },
      description: { type: String, default: '' }
    }
  },
  // bridge from the legacy room.room_type enum (single/couple/family/presidential).
  // Used only for the one-time migration of existing rooms; null for hotel-authored types.
  legacyEnum: { type: String, default: null }
}, { timestamps: true });

roomTypeSchema.index({ name: 1 }, { unique: true });

roomTypeSchema.pre('save', function setSlug(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().trim().replace(/\s+/g, '-');
  }
  next();
});

const MODEL_NAME = 'RoomTypes';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, roomTypeSchema);

module.exports = { schema: roomTypeSchema, modelName: MODEL_NAME, register };
