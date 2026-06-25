/**
 * Hotel-DB model registry.
 *
 * Lists every model that should exist inside each hotel's database.
 * When `tenant.connection.js` opens a new connection (for hotel_acme,
 * hotel_grandprix, etc.), it calls registerHotelModels(conn) which
 * attaches all of these to that connection.
 *
 * Adding a new collection? Add it here.
 */

const Users = require('../models/user.model');
const Rooms = require('../models/room.model');
const RoomTypes = require('../models/room.type.model');
const Bookings = require('../models/booking.model');
const BookingClaims = require('../models/booking.claim.model');
const Reviews = require('../models/review.model');
const Availability = require('../models/availability.model');
const Attributes = require('../models/attribute.model');
const Prices = require('../models/price.model');
const Services = require('../models/service.model');
const Policies = require('../models/policy.model');

const HOTEL_MODELS = [Users, Rooms, RoomTypes, Bookings, BookingClaims, Reviews, Availability, Attributes, Prices, Services, Policies];

function registerHotelModels(conn) {
  for (const M of HOTEL_MODELS) M.register(conn);
}

module.exports = { registerHotelModels, HOTEL_MODELS };
