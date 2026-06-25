/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
  // Room number / identifier. Empty until a floor is assigned (rooms are generated from the
  // type quantity first, then numbered per floor). Uniqueness of ASSIGNED numbers is enforced
  // by a partial unique index below (empty values are exempt).
  room_name: {
    type: String,
    default: ''
  },
  room_slug: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  // Legacy category enum — optional now that the canonical type is roomTypeId.
  room_type: {
    type: String,
    enum: ['single', 'couple', 'family', 'presidential']
  },
  // Canonical room type this physical room belongs to. Availability is counted per type,
  // not per room. A physical room is lightweight — its price/capacity come from the type.
  roomTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomTypes'
  },
  // building level this room sits on (label, e.g. "Ground", "1", "Penthouse")
  floor: {
    type: String,
    default: ''
  },
  // apaleo unit condition — housekeeping state, separate from booking occupancy
  condition: {
    type: String,
    enum: ['Clean', 'Dirty', 'Inspected', 'OutOfService'],
    default: 'Clean'
  },
  // reusable unit attributes attached to this room (Balcony, Street view, King bed…)
  attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attributes' }],
  room_price: {
    type: Number,
    default: 0
  },
  room_size: {
    type: Number,
    default: 0
  },
  room_capacity: {
    type: Number,
    default: 1
  },
  allow_pets: {
    type: Boolean,
    default: false
  },
  provide_breakfast: {
    type: Boolean,
    default: false
  },
  featured_room: {
    type: Boolean,
    default: false
  },
  room_description: {
    type: String,
    default: ''
  },
  extra_facilities: [String],
  room_images: [
    {
      url: {
        type: String,
        required: [true, 'Room image filed is required']
      }
    }
  ],
  room_status: {
    type: String,
    enum: ['available', 'unavailable', 'booked'],
    required: [true, 'Room status filed is required'],
    default: 'available'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: [true, 'Room created by is required field']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Assigned room numbers must be unique within the hotel; unassigned (empty) rooms are exempt.
roomsSchema.index(
  { room_name: 1 },
  { unique: true, partialFilterExpression: { room_name: { $gt: '' } } }
);

// Replace spaces with dashes in room_slug before saving
roomsSchema.pre('save', function (next) {
  if (this.room_slug) {
    this.room_slug = this.room_slug.replace(/\s/g, '-');
  }
  next();
});

const MODEL_NAME = 'Rooms';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, roomsSchema);

module.exports = { schema: roomsSchema, modelName: MODEL_NAME, register };
