const mongoose = require('mongoose');
const env = require('dotenv');
const { resolve } = require('path');
env.config({ path: resolve(__dirname, '../.env') });

const { getPlatformConnection } = require('../src/lib/platform.connection');

async function clean() {
  try {
    const { conn, models: { Hotel } } = getPlatformConnection();
    console.log('Connected to Platform DB');

    const hotels = await Hotel.find({});
    for (const h of hotels) {
      if (h.slug !== 'paradise-hotel-lozenets') {
        console.log(`Deleting ${h.name} (${h.slug}) and dropping DB ${h.dbName}...`);
        await Hotel.deleteOne({ _id: h._id });
        // Drop the tenant db
        const tenantDb = conn.useDb(h.dbName, { useCache: true });
        await tenantDb.dropDatabase();
        console.log('Dropped ' + h.dbName);
      } else {
        console.log(`Keeping ${h.name}`);
      }
    }
    
    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clean();
