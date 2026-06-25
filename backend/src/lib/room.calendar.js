/**
 * RoomCalendar — the one module that owns the availability calendar.
 *
 * Interface (everything a caller needs to know):
 *   view(db, hotelId, roomTypeId, from, to)            → availability cells in a range
 *   firmHold(db, { hotelId, roomTypeId, dates, totalUnits, source })
 *                                                        → atomic per-day claim; throws SoldOutError
 *   release(db, { hotelId, roomTypeId, dates, source }) → return held units
 *   soldOutDates(db, hotelId, roomTypeId, from, to)     → dates with no remaining units (drives outbound .ics)
 *   isSoldOut(cell)                                      → pure predicate on a cell
 *
 * Invariants the module owns (the depth):
 *   - A firm hold is an atomic guarded decrement (soldUnits + blockedUnits < totalUnits).
 *     This REPLACES the old BookingClaims unique-index trick. totalUnits=1 degrades to the
 *     exact same hard guarantee. Concurrent holds on the last unit: exactly one wins.
 *   - Dates are normalised to UTC midnight so every writer keys cells identically.
 *   - release never drives a counter below zero.
 *
 * The collection (`availabilities`) is shared with the calendar-sync worker, which writes
 * soft blocks (blockedUnits) and conflict flags. This module only touches soldUnits /
 * bySource for firm holds — the two writers never fight over the same field.
 */

class SoldOutError extends Error {
  constructor(date) {
    super('SOLD_OUT');
    this.name = 'SoldOutError';
    this.code = 'SOLD_OUT';
    this.date = date;
  }
}

/** Normalise any date-ish value to a UTC-midnight Date. */
function dayKey(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Unique, sorted list of UTC-midnight days from an array of date-ish values. */
function normaliseDays(dates) {
  const seen = new Map();
  for (const d of dates) {
    const k = dayKey(d);
    seen.set(k.getTime(), k);
  }
  return Array.from(seen.values()).sort((a, b) => a - b);
}

/** A cell is sold out when no units remain from any source. */
function isSoldOut(cell) {
  if (!cell) return false;
  const total = cell.totalUnits == null ? 1 : cell.totalUnits;
  return (cell.soldUnits || 0) + (cell.blockedUnits || 0) >= total;
}

/** Ensure a cell exists for each day, seeding totalUnits from the room type. Idempotent.
 *  Swallows the duplicate-key race (two concurrent upserts both insert) — E11000 just
 *  means the cell now exists, which is the goal. Correctness depends on the unique index
 *  on (hotelId, roomTypeId, date) being present; firmHold guarantees it via Model.init(). */
async function ensureCells(Availability, hotelId, roomTypeId, days, totalUnits) {
  await Promise.all(days.map(async (date) => {
    try {
      await Availability.updateOne(
        { hotelId, roomTypeId, date },
        {
          $setOnInsert: {
            hotelId, roomTypeId, date, totalUnits, soldUnits: 0, blockedUnits: 0
          }
        },
        { upsert: true }
      );
    } catch (err) {
      if (err && err.code === 11000) return; // cell already exists — fine
      throw err;
    }
  }));
}

/**
 * Place a firm hold of one unit on each date. Atomic per day:
 * findOneAndUpdate only matches a cell with units remaining, so concurrent holds on the
 * last unit serialise — exactly one succeeds. On any sold-out day, rolls back the days
 * already held and throws SoldOutError.
 */
async function firmHold(db, {
  hotelId, roomTypeId, dates, totalUnits = 1, source = 'direct'
}) {
  const Availability = db.model('Availability');
  const days = normaliseDays(dates);
  if (days.length === 0) return [];

  // The atomic guard is only as strong as the unique index on (hotelId, roomTypeId, date).
  // Model.init() is memoised by Mongoose, so this is a one-time cost per connection that
  // guarantees the index exists before the first concurrent hold on a brand-new hotel DB.
  await Availability.init();
  await ensureCells(Availability, hotelId, roomTypeId, days, totalUnits);

  const held = [];
  for (const date of days) {
    // eslint-disable-next-line no-await-in-loop
    const cell = await Availability.findOneAndUpdate(
      {
        hotelId,
        roomTypeId,
        date,
        $expr: { $lt: [{ $add: ['$soldUnits', '$blockedUnits'] }, '$totalUnits'] }
      },
      { $inc: { soldUnits: 1, [`bySource.${source}`]: 1 } },
      { new: true }
    );
    if (!cell) {
      // roll back the days we already held, then signal the conflict
      // eslint-disable-next-line no-await-in-loop
      await release(db, {
        hotelId, roomTypeId, dates: held, source
      });
      throw new SoldOutError(date);
    }
    held.push(date);
  }
  return held;
}

/** Return one held unit per date. Never drives soldUnits below zero. */
async function release(db, {
  hotelId, roomTypeId, dates, source = 'direct'
}) {
  const Availability = db.model('Availability');
  const days = normaliseDays(dates);
  await Promise.all(days.map((date) => Availability.updateOne(
    { hotelId, roomTypeId, date, soldUnits: { $gt: 0 } },
    { $inc: { soldUnits: -1, [`bySource.${source}`]: -1 } }
  )));
}

/** All cells for a room type within [from, to). */
async function view(db, hotelId, roomTypeId, from, to) {
  const Availability = db.model('Availability');
  return Availability.find({
    hotelId,
    roomTypeId,
    date: { $gte: dayKey(from), $lt: dayKey(to) }
  }).sort({ date: 1 }).lean();
}

/** Dates within [from, to) that have no remaining units — the outbound .ics block list. */
async function soldOutDates(db, hotelId, roomTypeId, from, to) {
  const cells = await view(db, hotelId, roomTypeId, from, to);
  return cells.filter(isSoldOut).map((c) => c.date);
}

module.exports = {
  firmHold,
  release,
  view,
  soldOutDates,
  isSoldOut,
  dayKey,
  normaliseDays,
  SoldOutError
};
