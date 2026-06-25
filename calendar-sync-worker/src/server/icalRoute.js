const ICalGenerator = require('ical-generator').default;
const { getHotelConnection } = require('../lib/tenant.connection');

async function serveOutboundIcal(req, res) {
  const { hotelId, roomTypeId } = req.params;
  const conn = await getHotelConnection(hotelId);
  const Availability = conn.model('Availability');

  const cal = ICalGenerator({
    name: `Hotel ${hotelId} / RoomType ${roomTypeId}`,
    timezone: 'UTC',
    ttl: 60 * 60
  });

  // Derive the outbound feed from the SINGLE availability collection — the same store
  // direct holds and OTA blocks write to. A date is emitted as "blocked" only when the
  // room type is genuinely SOLD OUT (no units remain). For a counted type, selling 1 of 4
  // leaves the listing open on OTAs — which reading EventRaw per-reservation got wrong.
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 365);

  const cells = await Availability.find({
    roomTypeId,
    date: { $gte: from, $lt: to }
  }).sort({ date: 1 }).lean();

  const soldOut = cells
    .filter((c) => (c.soldUnits || 0) + (c.blockedUnits || 0) >= (c.totalUnits == null ? 1 : c.totalUnits))
    .map((c) => { const d = new Date(c.date); d.setUTCHours(0, 0, 0, 0); return d; });

  // merge consecutive sold-out days into [start, end) ranges → one VEVENT each
  let i = 0;
  while (i < soldOut.length) {
    const start = soldOut[i];
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    let j = i + 1;
    while (j < soldOut.length && soldOut[j].getTime() === end.getTime()) {
      end.setUTCDate(end.getUTCDate() + 1);
      j += 1;
    }
    cal.createEvent({
      start,
      end,
      summary: 'Booked',
      id: `bookingsystem-${hotelId}-${roomTypeId}-${start.toISOString().slice(0, 10)}@booking.local`
    });
    i = j;
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${hotelId}-${roomTypeId}.ics"`);
  res.send(cal.toString());
}

async function getAvailability(req, res) {
  const { hotelId, roomTypeId } = req.params;
  const { from, to } = req.query;
  const start = from ? new Date(from) : new Date();
  const end = to ? new Date(to) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

  const conn = await getHotelConnection(hotelId);
  const Availability = conn.model('Availability');

  const docs = await Availability.find({
    roomTypeId,
    date: { $gte: start, $lt: end }
  }).lean();

  res.json({ from: start, to: end, days: docs });
}

module.exports = { serveOutboundIcal, getAvailability };
