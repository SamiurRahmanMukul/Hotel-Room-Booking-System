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
  room_name: {
    type: String,
    unique: true,
    required: [true, 'Room name filed is required']
  },
  room_slug: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, 'Room slug filed is required']
  },
  room_type: {
    type: String,
    enum: ['single', 'couple', 'family', 'presidential'],
    required: [true, 'Room type filed is required']
  },
  room_price: {
    type: Number,
    required: [true, 'Room price filed is required']
  },
  room_size: {
    type: Number,
    required: [true, 'Room size filed is required']
  },
  room_capacity: {
    type: Number,
    required: [true, 'Room capacity filed is required']
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
    required: [true, 'Room description filed is required']
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

// Replace spaces with dashes in room_slug before saving
roomsSchema.pre('save', function (next) {
  if (this.room_slug) {
    this.room_slug = this.room_slug.replace(/\s/g, '-');
  }
  next();
});

module.exports = mongoose.model('Rooms', roomsSchema);
