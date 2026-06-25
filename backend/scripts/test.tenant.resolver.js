/**
 * Smoke-test tenantResolver middleware end-to-end.
 *  - Spins up a tiny Express app
 *  - Mounts tenantResolver on /probe
 *  - Hits /probe with various Host headers and JWT claims
 *  - Asserts the resolved hotel + DB are correct
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const tenantResolver = require('../src/middleware/tenant.resolver');
const { getPlatformConnection } = require('../src/lib/platform.connection');
const { closeAll } = require('../src/lib/tenant.connection');

const PORT = 9099;

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: PORT, path, method: 'GET', headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: body && JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // ensure platform connection ready
  const { conn } = getPlatformConnection();
  await conn.asPromise();

  const app = express();
  app.use((req, _res, next) => {
    if (req.headers['x-test-jwt-slug']) req.user = { hotelSlug: req.headers['x-test-jwt-slug'] };
    next();
  });
  app.use('/probe', tenantResolver, (req, res) => {
    res.json({
      hotelSlug: req.hotel.slug,
      hotelName: req.hotel.name,
      dbName: req.db.name
    });
  });

  const server = app.listen(PORT);

  let pass = 0; let fail = 0;
  const t = (label, ok) => { if (ok) { pass += 1; console.log(`  ✅ ${label}`); } else { fail += 1; console.log(`  ❌ ${label}`); } };

  console.log('\n--- 1. fallback to DEFAULT_HOTEL_SLUG when no hint ---');
  let r = await get('/probe', { Host: 'localhost' });
  t('returns 200', r.status === 200);
  t(`resolves to slug 'default' (got '${r.body?.hotelSlug}')`, r.body?.hotelSlug === 'default');
  t(`points at booking-system DB (got '${r.body?.dbName}')`, r.body?.dbName === 'booking-system');

  console.log('\n--- 2. subdomain wins over default ---');
  r = await get('/probe', { Host: 'default.book.platform.com' });
  t(`subdomain 'default' resolves`, r.status === 200 && r.body?.hotelSlug === 'default');

  console.log('\n--- 3. unknown subdomain → 404 ---');
  r = await get('/probe', { Host: 'nope-i-dont-exist.book.platform.com' });
  t('returns 404', r.status === 404);
  t('error mentions tenant', r.body?.result?.title === 'TENANT NOT FOUND');

  console.log('\n--- 4. JWT slug wins over subdomain ---');
  r = await get('/probe', { Host: 'something-else.book.platform.com', 'x-test-jwt-slug': 'default' });
  t(`JWT 'default' overrides subdomain`, r.status === 200 && r.body?.hotelSlug === 'default');

  server.close();
  await conn.close();
  await closeAll();

  console.log(`\n${fail === 0 ? '✅ all' : `❌ ${fail} of`} ${pass + fail} assertions passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test crashed:', err);
  process.exit(1);
});
