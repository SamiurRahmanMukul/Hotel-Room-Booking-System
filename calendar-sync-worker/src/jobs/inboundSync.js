const { fetchAndParse, eachDateInRange } = require('../adapters/ical');
const { getHotelConnection } = require('../lib/tenant.connection');
const logger = require('../lib/logger');

async function runInboundSync(hotelId, channelId) {
  const startedAt = Date.now();
  const conn = await getHotelConnection(hotelId);
  const Channel = conn.model('Channel');
  const EventRaw = conn.model('EventRaw');
  const Availability = conn.model('Availability');
  const SyncRun = conn.model('SyncRun');

  const RoomType = conn.model('RoomTypes');
  const run = await SyncRun.create({ channelId });
  const channel = await Channel.findById(channelId);
  if (!channel || !channel.enabled) {
    await SyncRun.findByIdAndUpdate(run._id, {
      status: 'ok', finishedAt: new Date(), durationMs: Date.now() - startedAt
    });
    return { skipped: true };
  }

  const errorMessages = [];
  let eventsProcessed = 0;
  let newReservations = 0;
  let cancellations = 0;

  try {
    if (channel.type !== 'ical_in') {
      throw new Error(`adapter not implemented for type: ${channel.type}`);
    }
    if (!channel.icalUrl) throw new Error('channel has no icalUrl');

    const events = await fetchAndParse(channel.icalUrl);
    const sourceKey = `channel:${channel.name}`;

    // counted inventory: seed availability cells with the room type's real unit count so a
    // multi-unit type doesn't look sold out after a single OTA block.
    const roomType = channel.roomTypeId ? await RoomType.findById(channel.roomTypeId).lean() : null;
    const totalUnits = roomType && roomType.totalUnits != null ? roomType.totalUnits : 1;

    // Get current external IDs from this channel to detect cancellations
    const previousEventIds = await EventRaw.find(
      { channelId: channel._id },
      { externalId: 1, payload: 1 }
    ).lean();
    const previousIdSet = new Set(previousEventIds.map((e) => e.externalId));
    const currentIdSet = new Set();

    for (const ev of events) {
      eventsProcessed += 1;

      // skip echoes of our own bookings round-tripping back from an OTA
      if (typeof ev.externalId === 'string' && ev.externalId.startsWith('bookingsystem-')) continue;

      currentIdSet.add(ev.externalId);

      const result = await EventRaw.updateOne(
        { channelId: channel._id, externalId: ev.externalId },
        {
          $setOnInsert: {
            hotelId: channel.hotelId,
            channelId: channel._id,
            eventType: 'reservation',
            externalId: ev.externalId,
            payload: { summary: ev.summary, start: ev.start, end: ev.end }
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount !== 1) continue;
      newReservations += 1;

      for (const date of eachDateInRange(ev.start, ev.end)) {
        const updated = await Availability.findOneAndUpdate(
          { hotelId: channel.hotelId, roomTypeId: channel.roomTypeId, date },
          {
            $inc: { blockedUnits: 1, [`bySource.${sourceKey}`]: 1 },
            $setOnInsert: { totalUnits }
          },
          { upsert: true, new: true }
        );

        // Conflict = true oversell: held (sold + blocked) exceeds the type's unit count.
        // For a multi-unit type, two channels each selling one unit is NOT a conflict.
        const held = (updated.soldUnits || 0) + (updated.blockedUnits || 0);
        const units = updated.totalUnits == null ? 1 : updated.totalUnits;
        if (held > units) {
          const bySource = updated.bySource instanceof Map
            ? Object.fromEntries(updated.bySource)
            : (updated.bySource || {});
          const sources = Object.keys(bySource).filter((k) => bySource[k] > 0).join(', ');
          await Availability.findByIdAndUpdate(updated._id, {
            conflict: true,
            conflictDetails: `Oversold: ${held} held vs ${units} unit(s) — sources: ${sources}`
          });
        }
      }
    }

    // Detect cancellations: events that were in the previous sync but not in the current one
    for (const prevId of previousIdSet) {
      if (!currentIdSet.has(prevId)) {
        const prevEvent = previousEventIds.find((e) => e.externalId === prevId);
        if (prevEvent && prevEvent.payload && prevEvent.payload.start && prevEvent.payload.end) {
          cancellations += 1;

          // Mark as cancelled in EventRaw
          await EventRaw.updateOne(
            { channelId: channel._id, externalId: prevId },
            { $set: { eventType: 'cancel' } }
          );

          // Release blocked units for each date
          for (const date of eachDateInRange(prevEvent.payload.start, prevEvent.payload.end)) {
            await Availability.findOneAndUpdate(
              { hotelId: channel.hotelId, roomTypeId: channel.roomTypeId, date },
              {
                $inc: { blockedUnits: -1, [`bySource.${sourceKey}`]: -1 },
                $setOnInsert: { totalUnits }
              },
              { upsert: true }
            );
          }
        }
      }
    }

    await Channel.findByIdAndUpdate(channel._id, {
      lastSyncAt: new Date(),
      lastSyncStatus: 'ok',
      lastError: null
    });
  } catch (err) {
    errorMessages.push(err.message);
    await Channel.findByIdAndUpdate(channel._id, {
      lastSyncAt: new Date(),
      lastSyncStatus: 'error',
      lastError: err.message
    });
    logger.error({ err, hotelId, channelId }, 'inbound sync failed');
  }

  await SyncRun.findByIdAndUpdate(run._id, {
    finishedAt: new Date(),
    durationMs: Date.now() - startedAt,
    eventsProcessed,
    newReservations,
    cancellations,
    errorMessages,
    status: errorMessages.length ? 'error' : 'ok'
  });

  return { eventsProcessed, newReservations, cancellations, errorMessages };
}

module.exports = { runInboundSync };
