require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect } = require('./db/connect');
const { createQueue, startWorker, scheduleAllChannels, triggerNow } = require('./jobs/queue');
const { serveOutboundIcal, getAvailability } = require('./server/icalRoute');
const { getHotelConnection } = require('./lib/tenant.connection');
const logger = require('./lib/logger');

async function main() {
  await connect();

  const queue = createQueue();
  const worker = startWorker();
  await scheduleAllChannels(queue);

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Shared-secret auth middleware for mutating endpoints
  const WORKER_API_SECRET = process.env.WORKER_API_SECRET;
  const requireSecret = (req, res, next) => {
    if (!WORKER_API_SECRET) return next(); // not configured — allow all (dev mode)
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${WORKER_API_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  };

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.get('/__test/fake-airbnb.ics', (_req, res) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const d = (offset) => { const x = new Date(today); x.setUTCDate(x.getUTCDate() + offset); return x; };
    const events = [
      { uid: 'fake-001', start: d(7),  end: d(10) },
      { uid: 'fake-002', start: d(15), end: d(18) },
      { uid: 'fake-003', start: d(25), end: d(27) }
    ];
    const ics = [
      'BEGIN:VCALENDAR',
      'PRODID:-//Test//Fake Airbnb//EN',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      ...events.flatMap((e) => [
        'BEGIN:VEVENT',
        `UID:${e.uid}`,
        `DTSTART;VALUE=DATE:${fmt(e.start)}`,
        `DTEND;VALUE=DATE:${fmt(e.end)}`,
        'SUMMARY:Reserved (Airbnb)',
        'END:VEVENT'
      ]),
      'END:VCALENDAR'
    ].join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.send(ics);
  });

  app.get('/', (_req, res) => {
    res.json({
      service: 'calendar-sync-worker',
      endpoints: [
        'GET  /health',
        'GET  /channels?hotelId=<id>',
        'POST /channels',
        'POST /channels/:id/sync',
        'GET  /ical/:hotelId/:roomTypeId.ics',
        'GET  /availability/:hotelId/:roomTypeId?from=&to='
      ]
    });
  });

  app.get('/ical/:hotelId/:roomTypeId.ics', serveOutboundIcal);
  app.get('/availability/:hotelId/:roomTypeId', getAvailability);

  app.post('/channels', requireSecret, async (req, res) => {
    if (!req.body?.hotelId) return res.status(400).json({ error: 'hotelId required' });
    const conn = await getHotelConnection(req.body.hotelId);
    const ch = await conn.model('Channel').create(req.body);
    if (ch.enabled && ch.type === 'ical_in') {
      await queue.add(
        `sync:${ch._id}`,
        { hotelId: req.body.hotelId.toString(), channelId: ch._id.toString() },
        {
          repeat: { every: ch.pollIntervalSeconds * 1000 },
          jobId: `repeat:${ch._id}`
        }
      );
    }
    return res.status(201).json(ch);
  });

  app.get('/channels', async (req, res) => {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ error: 'hotelId query required' });
    const conn = await getHotelConnection(hotelId);
    return res.json(await conn.model('Channel').find({}).lean());
  });

  app.post('/channels/:id/sync', requireSecret, async (req, res) => {
    const { hotelId } = req.body || {};
    if (!hotelId) return res.status(400).json({ error: 'hotelId required in body' });
    await triggerNow(queue, hotelId, req.params.id);
    return res.json({ queued: true });
  });

  const port = process.env.PORT || 8001;
  app.listen(port, () => logger.info({ port }, 'calendar-sync-worker listening'));

  const shutdown = async (sig) => {
    logger.info({ sig }, 'shutting down');
    await worker.close();
    await queue.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
