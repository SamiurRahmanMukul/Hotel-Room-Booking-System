/**
 * RoomCalendar — prove the five invariants the deep module owns.
 *   1. firmHold claims units; view reflects them.
 *   2. Concurrent oversell on the last unit: exactly one wins (replaces the
 *      BookingClaims unique-index guarantee).
 *   3. release returns units; the date can be held again.
 *   4. Counted units: sell 1 of N → not sold out; sell N of N → sold out (drives .ics).
 *   5. Multi-day hold rolls back fully when any day is sold out.
 *
 * Run against a live MongoDB. Uses an ephemeral DB it drops at the end.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getHotelConnection, closeAll } = require('../src/lib/tenant.connection');
const RoomCalendar = require('../src/lib/room.calendar');

const DB = '__hotel_test_calendar__';
const HOTEL = new mongoose.Types.ObjectId();

async function main() {
  let pass = 0; let fail = 0;
  const t = (label, ok) => { if (ok) { pass += 1; console.log(`  ✅ ${label}`); } else { fail += 1; console.log(`  ❌ ${label}`); } };

  const db = getHotelConnection(DB);
  await db.asPromise();
  const Availability = db.model('Availability');
  const RoomType = db.model('RoomTypes');
  await Availability.deleteMany({});
  await RoomType.deleteMany({});

  const D1 = '2026-07-01';
  const D2 = '2026-07-02';

  console.log('--- 1. firmHold claims a unit; view reflects it ---');
  const single = await RoomType.create({ name: 'Unique Suite', totalUnits: 1, basePrice: 200 });
  await RoomCalendar.firmHold(db, {
    hotelId: HOTEL, roomTypeId: single._id, dates: [D1], totalUnits: single.totalUnits
  });
  let cells = await RoomCalendar.view(db, HOTEL, single._id, D1, D2);
  t('one cell created for the held day', cells.length === 1);
  t('soldUnits == 1', cells[0] && cells[0].soldUnits === 1);
  t("bySource.direct == 1", cells[0] && cells[0].bySource && cells[0].bySource.direct === 1);

  console.log('\n--- 2. concurrent oversell on the last unit: exactly one wins ---');
  const hot = await RoomType.create({ name: 'Last Room', totalUnits: 1, basePrice: 100 });
  const attempts = await Promise.allSettled(
    Array.from({ length: 6 }, () => RoomCalendar.firmHold(db, {
      hotelId: HOTEL, roomTypeId: hot._id, dates: [D1], totalUnits: hot.totalUnits
    }))
  );
  const won = attempts.filter((a) => a.status === 'fulfilled').length;
  const lost = attempts.filter((a) => a.status === 'rejected' && a.reason.code === 'SOLD_OUT').length;
  t(`exactly 1 of 6 concurrent holds won (got ${won})`, won === 1);
  t(`other 5 rejected with SOLD_OUT (got ${lost})`, lost === 5);
  cells = await RoomCalendar.view(db, HOTEL, hot._id, D1, D2);
  t('soldUnits never exceeded totalUnits', cells[0].soldUnits === 1);

  console.log('\n--- 3. release returns the unit; date can be held again ---');
  await RoomCalendar.release(db, { hotelId: HOTEL, roomTypeId: hot._id, dates: [D1] });
  cells = await RoomCalendar.view(db, HOTEL, hot._id, D1, D2);
  t('soldUnits back to 0 after release', cells[0].soldUnits === 0);
  const reheld = await RoomCalendar.firmHold(db, {
    hotelId: HOTEL, roomTypeId: hot._id, dates: [D1], totalUnits: hot.totalUnits
  }).then(() => true).catch(() => false);
  t('can hold the released date again', reheld === true);

  console.log('\n--- 4. counted units: sell 1 of 4 → free; sell 4 of 4 → sold out ---');
  const pooled = await RoomType.create({ name: 'Standard Double', totalUnits: 4, basePrice: 80 });
  await RoomCalendar.firmHold(db, {
    hotelId: HOTEL, roomTypeId: pooled._id, dates: [D1], totalUnits: pooled.totalUnits
  });
  let soldOut = await RoomCalendar.soldOutDates(db, HOTEL, pooled._id, D1, D2);
  t('1 of 4 sold → NOT sold out (still sellable on OTAs)', soldOut.length === 0);
  await Promise.all([2, 3, 4].map(() => RoomCalendar.firmHold(db, {
    hotelId: HOTEL, roomTypeId: pooled._id, dates: [D1], totalUnits: pooled.totalUnits
  })));
  soldOut = await RoomCalendar.soldOutDates(db, HOTEL, pooled._id, D1, D2);
  t('4 of 4 sold → sold out (date emitted to outbound .ics)', soldOut.length === 1);

  console.log('\n--- 5. multi-day hold rolls back fully when any day is sold out ---');
  const tight = await RoomType.create({ name: 'Tight Type', totalUnits: 1, basePrice: 90 });
  // pre-sell D2 so a [D1, D2] hold must fail on D2
  await RoomCalendar.firmHold(db, {
    hotelId: HOTEL, roomTypeId: tight._id, dates: [D2], totalUnits: tight.totalUnits
  });
  let threw = false;
  try {
    await RoomCalendar.firmHold(db, {
      hotelId: HOTEL, roomTypeId: tight._id, dates: [D1, D2], totalUnits: tight.totalUnits
    });
  } catch (e) { threw = e.code === 'SOLD_OUT'; }
  t('multi-day hold threw SOLD_OUT on the taken day', threw);
  const d1cell = (await RoomCalendar.view(db, HOTEL, tight._id, D1, D2)).find((c) => c.soldUnits > 0);
  t('D1 was rolled back (not left held)', !d1cell);

  // cleanup
  await db.dropDatabase();
  await closeAll();

  console.log(`\n${fail === 0 ? '✅ all' : `❌ ${fail} of`} ${pass + fail} assertions passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test crashed:', err);
  process.exit(1);
});
