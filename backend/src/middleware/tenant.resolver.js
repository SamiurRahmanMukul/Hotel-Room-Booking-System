/**
 * tenantResolver — attaches { hotel, db } to the request.
 *
 * Resolution priority:
 *  1. JWT claim `hotelSlug` (set when a hotel-scoped user logs in)
 *  2. Subdomain of the Host header (e.g. acme.book.platform.com → 'acme')
 *  3. process.env.DEFAULT_HOTEL_SLUG (fallback during migration; defaults to 'default')
 *
 * The `default` hotel maps to the legacy `booking-system` DB, so unrouted
 * traffic keeps working unchanged until we cut over.
 */

const jwt = require('jsonwebtoken');
const logger = require('./winston.logger');
const { getPlatformConnection } = require('../lib/platform.connection');
const { getHotelConnection } = require('../lib/tenant.connection');
const { HOTEL_MODELS } = require('../lib/tenant.models');

function slugFromBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.decode(authHeader.slice(7));
    return decoded?.hotelSlug || null;
  } catch {
    return null;
  }
}

const PLATFORM_HOSTS = new Set(
  (process.env.PLATFORM_HOSTS || 'localhost,127.0.0.1,platform.com,book.platform.com,admin.platform.com')
    .split(',').map((h) => h.trim().toLowerCase())
);

function extractSubdomainSlug(hostHeader) {
  if (!hostHeader) return null;
  const host = hostHeader.split(':')[0].toLowerCase();
  if (PLATFORM_HOSTS.has(host)) return null;
  // strip well-known prefixes: <slug>.book.platform.com OR <slug>.admin.platform.com
  const parts = host.split('.');
  if (parts.length < 3) return null;
  return parts[0];
}

async function tenantResolver(req, res, next) {
  try {
    const slug = req.user?.hotelSlug
      || req.get('x-hotel-slug')
      || slugFromBearer(req.headers.authorization)
      || extractSubdomainSlug(req.get('host'))
      || process.env.DEFAULT_HOTEL_SLUG
      || 'default';

    const { models } = getPlatformConnection();
    const hotel = await models.Hotel.findOne({ slug }).lean();

    if (!hotel) {
      return res.status(404).json({
        result_code: 4,
        result: { title: 'TENANT NOT FOUND', error: `No hotel found for slug '${slug}'` }
      });
    }
    // 'draft' hotels keep working for the admin panel — only suspended blocks
    if (hotel.status === 'suspended') {
      return res.status(503).json({
        result_code: 5,
        result: { title: 'TENANT UNAVAILABLE', error: `Hotel '${slug}' is suspended` }
      });
    }

    req.hotel = hotel;
    const db = getHotelConnection(hotel.dbName);
    if (db.readyState !== 1) await db.asPromise();
    req.db = db;
    req.M = {};
    for (const M of HOTEL_MODELS) req.M[M.modelName] = db.model(M.modelName);
    return next();
  } catch (err) {
    logger.error('tenantResolver error: ', err);
    return res.status(500).json({
      result_code: 2,
      result: { title: 'SERVER SIDE ERROR', error: err.message }
    });
  }
}

module.exports = tenantResolver;
