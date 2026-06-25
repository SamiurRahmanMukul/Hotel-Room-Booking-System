/**
 * One-time migration: introduce room types and the availability calendar.
 *
 * For every hotel:
 *   1. Group existing rooms by their legacy `room_type` enum and create one RoomTypes
 *      doc per group (totalUnits = count of rooms, basePrice = cheapest room).
 *   2. Link each room to its new roomTypeId.
 *   3. Re-hold every active (pending/approved) booking against the new availability
 *      collection so no held date silently frees up at cutover.
 *
 * Idempotent: re-running skips rooms/bookings already linked to a roomTypeId and reuses
 * an existing type for a given legacy enum.
 *
 * Usage:  node scripts/migrate.room.types.js
 */

require('dotenv').config();
const { getPlatformConnection } = require('../src/lib/platform.connection');
const { getHotelConnection, closeAll } = require('../src/lib/tenant.connection');
const RoomCalendar = require('../src/lib/room.calendar');

const ENUM_LABELS = {
  single: 'Single Room',
  couple: 'Couple Room',
  family: 'Family Room',
  presidential: 'Presidential Suite'
};

async function migrateHotel(hotel) {
  const db = getHotelConnection(hotel.dbName);
  await db.asPromise();
  const Room = db.model('Rooms');
  const RoomType = db.model('RoomTypes');
  const Booking = db.model('Bookings');
  await RoomType.init();

  const rooms = await Room.find({});
  const byEnum = {};
  for (const r of rooms) {
    const key = r.room_type || 'single';
    (byEnum[key] = byEnum[key] || []).push(r);
  }

  let typesCreated = 0;
  let roomsLinked = 0;
  for (const [enumKey, group] of Object.entries(byEnum)) {
    let rt = await RoomType.findOne({ legacyEnum: enumKey });
    if (!rt) {
      const prices = group.map((g) => g.room_price).filter((n) => typeof n === 'number');
      rt = await RoomType.create({
        name: ENUM_LABELS[enumKey] || enumKey,
        legacyEnum: enumKey,
        totalUnits: group.length,
        basePrice: prices.length ? Math.min(...prices) : 0,
        capacity: Math.max(1, ...group.map((g) => g.room_capacity || 1))
      });
      typesCreated += 1;
    }
    for (const r of group) {
      if (!r.roomTypeId) {
        r.roomTypeId = rt._id;
        await r.save({ validateBeforeSave: false });
        roomsLinked += 1;
      }
    }
  }

  // re-hold active bookings that predate the calendar
  let bookingsHeld = 0;
  const active = await Booking.find({
    booking_status: { $in: ['pending', 'approved'] },
    roomTypeId: { $in: [null, undefined] }
  });
  for (const b of active) {
    const room = b.room_id ? await Room.findById(b.room_id) : null;
    const roomTypeId = (room && room.roomTypeId) || b.room_id;
    if (!roomTypeId) continue;
    const rt = await RoomType.findById(roomTypeId).lean();
    const totalUnits = rt && rt.totalUnits != null ? rt.totalUnits : 1;
    try {
      await RoomCalendar.firmHold(db, {
        hotelId: hotel._id, roomTypeId, dates: b.booking_dates, totalUnits, source: 'direct'
      });
      b.roomTypeId = roomTypeId;
      await b.save({ validateBeforeSave: false });
      bookingsHeld += 1;
    } catch (e) {
      console.warn(`  ! booking ${b._id}: ${e.code || e.message}`);
    }
  }

  return {
    slug: hotel.slug, rooms: rooms.length, typesCreated, roomsLinked, bookingsHeld
  };
}

async function main() {
  const { conn, models } = getPlatformConnection();
  const hotels = await models.Hotel.find({}).lean();
  if (!hotels.length) {
    console.log('no hotels in platform DB — nothing to migrate');
  }
  for (const h of hotels) {
    const r = await migrateHotel(h);
    console.log(`✅ ${r.slug}: ${r.rooms} rooms → +${r.typesCreated} types, ${r.roomsLinked} linked, ${r.bookingsHeld} bookings re-held`);
  }
  await closeAll();
  await conn.close();
  console.log('✅ room-types migration complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('migration crashed:', err);
  process.exit(1);
});
