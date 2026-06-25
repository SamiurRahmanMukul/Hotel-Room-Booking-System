/**
 * Backend tenant connection cache.
 *
 * A thin adapter over the shared createTenantConnectionCache factory
 * (../../../shared/tenant.connection.cache.js). It injects the backend's mongoose and
 * hotel-model registry; the open/reuse/evict/pool logic itself lives in the shared module,
 * one copy for both the backend and the calendar-sync worker.
 *
 * Given a Mongo dbName (e.g. 'hotel_acme'), getHotelConnection returns a Mongoose connection
 * scoped to that database. Hotel-DB models are registered onto the connection on creation.
 */

const mongoose = require('mongoose');
const createTenantConnectionCache = require('../../../shared/tenant.connection.cache');
const { registerHotelModels } = require('./tenant.models');

const baseUri = () => process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
const idleTimeoutMs = parseInt(process.env.TENANT_IDLE_TIMEOUT_MS, 10) || 1000 * 60 * 30;

const cache = createTenantConnectionCache({
  mongoose,
  baseUri,
  registerModels: registerHotelModels,
  idleTimeoutMs
});

function getHotelConnection(dbName) {
  return cache.connectionForDbName(dbName);
}

module.exports = {
  getHotelConnection,
  closeAll: cache.closeAll,
  evict: cache.evict,
  stats: cache.stats
};
