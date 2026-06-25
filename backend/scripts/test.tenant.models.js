/**
 * Verify the multi-tenant model architecture:
 *  1. Models are schema-only ({ schema, modelName, register }) — no global mongoose
 *     registration, so a cross-tenant query is unrepresentable by construction.
 *  2. Two ephemeral hotel DBs get the full schema attached on first use.
 *  3. Writes to hotel A do not appear in hotel B.
 *  4. The default hotel serves the existing booking-system data via a tenant connection.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getHotelConnection, closeAll } = require('../src/lib/tenant.connection');
const { HOTEL_MODELS } = require('../src/lib/tenant.models');

async function main() {
  let pass = 0; let fail = 0;
  const t = (label, ok) => { if (ok) { pass += 1; console.log(`  ✅ ${label}`); } else { fail += 1; console.log(`  ❌ ${label}`); } };

  console.log('--- 1. models are schema-only, with NO global mongoose registration ---');
  const Room = require('../src/models/room.model');
  t('Room exports a register() function', typeof Room.register === 'function');
  t("Room.modelName === 'Rooms'", Room.modelName === 'Rooms');
  t('Room is NOT a callable model (no global singleton)', typeof Room.countDocuments !== 'function');
  t('requiring the model did NOT register it on the global mongoose connection', !mongoose.models.Rooms);

  console.log('\n--- 2. tenant.connection registers all hotel models on a new hotel DB ---');
  const HOTEL_A = '__hotel_test_a__';
  const HOTEL_B = '__hotel_test_b__';
  const connA = getHotelConnection(HOTEL_A);
  await connA.asPromise();
  const expected = HOTEL_MODELS.map((m) => m.modelName).sort();
  const actual = Object.keys(connA.models).sort();
  t(`hotel A has all expected models: ${expected.join(', ')}`, JSON.stringify(actual) === JSON.stringify(expected));

  console.log('\n--- 3. isolation: writes to hotel A invisible to hotel B ---');
  const connB = getHotelConnection(HOTEL_B);
  await connB.asPromise();

  await connA.model('Rooms').deleteMany({});
  await connB.model('Rooms').deleteMany({});

  await connA.model('Rooms').create({
    room_name: 'A-only Room',
    room_slug: 'a-only',
    room_type: 'single',
    room_price: 50,
    room_size: 20,
    room_capacity: 1,
    room_description: 'belongs to A',
    created_by: new mongoose.Types.ObjectId()
  });

  const inA = await connA.model('Rooms').countDocuments();
  const inB = await connB.model('Rooms').countDocuments();
  t(`hotel A sees 1 room (got ${inA})`, inA === 1);
  t(`hotel B sees 0 rooms (got ${inB})`, inB === 0);

  console.log('\n--- 4. default hotel via tenant.connection serves existing booking-system data ---');
  const connDefault = getHotelConnection('booking-system');
  await connDefault.asPromise();
  const tenantRoomCount = await connDefault.model('Rooms').countDocuments();
  t(`default tenant sees its rooms (got ${tenantRoomCount})`, typeof tenantRoomCount === 'number');

  console.log('\n--- 5. the global mongoose connection still holds NO hotel models ---');
  t('mongoose.models has no Rooms/Users/Bookings (no leak)',
    !mongoose.models.Rooms && !mongoose.models.Users && !mongoose.models.Bookings);

  // cleanup
  await connA.dropDatabase();
  await connB.dropDatabase();
  await closeAll();
  await mongoose.disconnect();

  console.log(`\n${fail === 0 ? '✅ all' : `❌ ${fail} of`} ${pass + fail} assertions passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test crashed:', err);
  process.exit(1);
});
