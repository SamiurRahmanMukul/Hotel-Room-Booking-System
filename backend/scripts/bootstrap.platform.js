/**
 * Bootstrap the platform DB.
 *  - Inserts a default hotel pointing at the existing booking-system DB
 *    so the running app keeps working unchanged.
 *  - Inserts the current admin user as a superadmin (idempotent).
 *
 * Run from backend/ with:  node scripts/bootstrap.platform.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getPlatformConnection } = require('../src/lib/platform.connection');

async function main() {
  const { conn, models } = getPlatformConnection();
  await conn.asPromise();

  const { Hotel, Superadmin } = models;

  // 1. ensure default hotel exists pointing at booking-system DB
  const existingHotel = await Hotel.findOne({ slug: 'default' });
  if (existingHotel) {
    console.log('default hotel already exists:', existingHotel._id.toString());
  } else {
    const hotel = await Hotel.create({
      slug: 'default',
      name: 'Default Hotel (legacy)',
      dbName: 'booking-system',
      status: 'active',
      contact: { email: 'k.velkov@msve.io', country: 'BG', currency: 'EUR', timezone: 'Europe/Sofia' }
    });
    console.log('created default hotel:', hotel._id.toString());
  }

  // 2. ensure superadmin exists (idempotent)
  const SUPERADMIN_EMAIL = 'k.velkov@msve.io';
  const existingSa = await Superadmin.findOne({ email: SUPERADMIN_EMAIL });
  if (existingSa) {
    console.log('superadmin already exists:', existingSa._id.toString());
  } else {
    const sa = await Superadmin.create({
      email: SUPERADMIN_EMAIL,
      password: 'admin123',
      fullName: 'Kiril Velkov',
      mustChangePassword: true
    });
    console.log('created superadmin:', sa._id.toString());
  }

  console.log('\n✅ platform bootstrap complete');
  await mongoose.disconnect();
  await conn.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('bootstrap failed:', err);
  process.exit(1);
});
