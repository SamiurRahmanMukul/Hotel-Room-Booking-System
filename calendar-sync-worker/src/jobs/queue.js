const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { getPlatformConnection } = require('../lib/platform.connection');
const { getHotelConnection } = require('../lib/tenant.connection');
const { runInboundSync } = require('./inboundSync');
const logger = require('../lib/logger');

const QUEUE_NAME = 'calendar-sync';

function buildConnection() {
  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
  });
}

function createQueue() {
  return new Queue(QUEUE_NAME, { connection: buildConnection() });
}

function startWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { hotelId, channelId } = job.data;
      logger.info({ jobId: job.id, hotelId, channelId }, 'processing sync job');
      return runInboundSync(hotelId, channelId);
    },
    { connection: buildConnection(), concurrency: 4 }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'sync job failed');
  });

  return worker;
}

async function scheduleAllChannels(queue) {
  // Walk every active hotel, list its enabled channels, schedule a recurring job
  const { conn, Hotel } = getPlatformConnection();
  if (conn.readyState !== 1) await conn.asPromise();
  const hotels = await Hotel.find({ status: 'active' }).lean();

  let total = 0;
  for (const hotel of hotels) {
    const conn2 = await getHotelConnection(hotel._id);
    const Channel = conn2.model('Channel');
    const channels = await Channel.find({ enabled: true, type: 'ical_in' });
    for (const ch of channels) {
      await queue.add(
        `sync:${ch._id}`,
        { hotelId: hotel._id.toString(), channelId: ch._id.toString() },
        {
          repeat: { every: ch.pollIntervalSeconds * 1000 },
          jobId: `repeat:${ch._id}`
        }
      );
      total += 1;
    }
  }
  logger.info({ count: total, hotels: hotels.length }, 'scheduled recurring sync jobs');
}

async function triggerNow(queue, hotelId, channelId) {
  await queue.add(
    'sync:manual',
    { hotelId: hotelId.toString(), channelId: channelId.toString() },
    { removeOnComplete: true }
  );
}

module.exports = { createQueue, startWorker, scheduleAllChannels, triggerNow, QUEUE_NAME };
