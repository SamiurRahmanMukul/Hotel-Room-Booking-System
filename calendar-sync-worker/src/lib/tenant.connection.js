/**
 * Worker tenant connection cache.
 *
 * A thin adapter over the shared createTenantConnectionCache factory
 * (../../../shared/tenant.connection.cache.js) — the same open/reuse/evict/pool logic the
 * backend uses, with the worker's models injected. On top of it the worker keeps its own
 * hotelId → dbName resolution (via platform.hotels), which the backend doesn't need.
 *
 * Resolution: hotelId → platform.hotels.findOne → dbName → shared connection cache.
 */

const mongoose = require('mongoose');
const createTenantConnectionCache = require('../../../shared/tenant.connection.cache');
const Channel = require('../db/models/Channel');
const Availability = require('../db/models/Availability');
const EventRaw = require('../db/models/EventRaw');
const SyncRun = require('../db/models/SyncRun');
const RoomType = require('../db/models/RoomType');
const { getPlatformConnection } = require('./platform.connection');
const logger = require('./logger');

const WORKER_MODELS = [Channel, Availability, EventRaw, SyncRun, RoomType];
function registerWorkerModels(conn) {
  for (const M of WORKER_MODELS) M.register(conn);
}

const baseUri = () => process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
const idleTimeoutMs = parseInt(process.env.TENANT_IDLE_TIMEOUT_MS, 10) || 1000 * 60 * 30;

const cache = createTenantConnectionCache({
  mongoose,
  baseUri,
  registerModels: registerWorkerModels,
  idleTimeoutMs
});

// worker-only layer: cache the hotelId → dbName lookup so we don't hit platform every time
const cacheByHotelId = new Map();

function connectionFor(dbName) {
  return cache.connectionForDbName(dbName);
}

async function resolveDbNameForHotel(hotelId) {
  const idStr = hotelId?.toString();
  if (!idStr) throw new Error('resolveDbNameForHotel: hotelId required');
  if (cacheByHotelId.has(idStr)) return cacheByHotelId.get(idStr);

  const { conn, Hotel } = getPlatformConnection();
  if (conn.readyState !== 1) await conn.asPromise();

  let hotel = await Hotel.findById(idStr).lean();
  if (!hotel) {
    const fallbackSlug = process.env.DEFAULT_HOTEL_SLUG || 'default';
    hotel = await Hotel.findOne({ slug: fallbackSlug }).lean();
    if (!hotel) throw new Error(`No hotel for id ${idStr} and no default '${fallbackSlug}'`);
    logger.warn({ hotelId: idStr, fallback: hotel.dbName }, 'unknown hotelId, using default');
  }

  cacheByHotelId.set(idStr, hotel.dbName);
  return hotel.dbName;
}

async function getHotelConnection(hotelId) {
  const dbName = await resolveDbNameForHotel(hotelId);
  const conn = connectionFor(dbName);
  if (conn.readyState !== 1) await conn.asPromise();
  return conn;
}

async function closeAll() {
  await cache.closeAll();
  cacheByHotelId.clear();
}

function stats() {
  const s = cache.stats();
  return { dbConnections: s.count, dbNames: s.dbNames };
}

module.exports = {
  getHotelConnection,
  resolveDbNameForHotel,
  connectionFor,
  closeAll,
  stats
};
