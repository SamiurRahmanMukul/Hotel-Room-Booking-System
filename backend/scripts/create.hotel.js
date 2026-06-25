/**
 * CLI: provision a new hotel.
 *
 * Usage:
 *   node scripts/create.hotel.js "Acme Boutique Hotel" admin@acme.com
 *   node scripts/create.hotel.js "Grand Prix Hotel" gp@example.com "Mario Andretti"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { provisionHotel } = require('../src/lib/hotel.provisioning');
const { getPlatformConnection } = require('../src/lib/platform.connection');

async function main() {
  const [, , name, contact_email, ...nameParts] = process.argv;
  const admin_full_name = nameParts.length ? nameParts.join(' ') : null;

  if (!name || !contact_email) {
    console.error('Usage: node scripts/create.hotel.js "Hotel Name" admin@email.com [Admin Full Name]');
    process.exit(1);
  }

  const { conn } = getPlatformConnection();
  await conn.asPromise();

  const result = await provisionHotel({ name, contact_email, admin_full_name });

  console.log('\n✅ hotel provisioned\n');
  console.log('  Name:        ', result.hotel.name);
  console.log('  Slug:        ', result.hotel.slug);
  console.log('  DB:          ', result.hotel.dbName);
  console.log('  Status:      ', result.hotel.status);
  console.log('  Admin URL:   ', result.adminUrl);
  console.log('  Booking URL: ', result.bookingUrl);
  console.log('  Magic Link:  ', result.magicLink.url);
  console.log('\n  Initial admin login:');
  console.log('    email:     ', result.admin.email);
  console.log('    (use the magic link above to set password)\n');

  await conn.close();
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
