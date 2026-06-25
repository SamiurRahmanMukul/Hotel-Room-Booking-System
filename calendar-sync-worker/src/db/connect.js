const { getPlatformConnection } = require('../lib/platform.connection');
const logger = require('../lib/logger');

async function connect() {
  const { conn } = getPlatformConnection();
  await conn.asPromise();
  logger.info({ db: conn.name }, 'platform DB connected');
}

module.exports = { connect };
