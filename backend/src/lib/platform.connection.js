const mongoose = require('mongoose');
const hotelSchema = require('../models/platform/hotel.model');
const superadminSchema = require('../models/platform/superadmin.model');

let conn = null;
let models = null;

function buildPlatformUri() {
  const base = process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
  const dbName = process.env.PLATFORM_DB_NAME || 'platform';
  return `${base}/${dbName}`;
}

function getPlatformConnection() {
  if (conn) return { conn, models };
  conn = mongoose.createConnection(buildPlatformUri());
  models = {
    Hotel: conn.model('Hotel', hotelSchema),
    Superadmin: conn.model('Superadmin', superadminSchema)
  };
  return { conn, models };
}

module.exports = { getPlatformConnection };
