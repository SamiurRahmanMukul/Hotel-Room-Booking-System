/**
 * Read-only platform DB connection for the worker.
 * The worker only needs to read `hotels` to resolve hotelId → dbName.
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const hotelSchema = new mongoose.Schema({
  slug: String,
  name: String,
  dbName: String,
  status: String
}, { strict: false, collection: 'hotels' });

let conn = null;
let HotelModel = null;

function platformUri() {
  const base = process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
  const dbName = process.env.PLATFORM_DB_NAME || 'platform';
  return `${base}/${dbName}`;
}

function getPlatformConnection() {
  if (conn) return { conn, Hotel: HotelModel };
  conn = mongoose.createConnection(platformUri());
  HotelModel = conn.model('Hotel', hotelSchema);
  conn.on('connected', () => logger.info('platform DB connected'));
  return { conn, Hotel: HotelModel };
}

module.exports = { getPlatformConnection };
