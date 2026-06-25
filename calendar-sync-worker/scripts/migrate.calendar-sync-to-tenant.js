/**
 * One-time migration: move data from the standalone `calendar-sync` DB
 * into the appropriate hotel DB (looked up via platform.hotels).
 *
 *  - For each channel in calendar-sync.channels, find platform.hotels._id == channel.hotelId
 *    → if found, copy into <hotel.dbName>.channels
 *    → if not found, copy into <DEFAULT_HOTEL.dbName>.channels (and rewrite hotelId)
 *  - Same for availabilities, eventraws, syncruns
 *  - Idempotent: uses upsert by _id
 *  - Does NOT drop the source DB; do that manually after verifying.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const SRC = 'calendar-sync';
const PLATFORM = process.env.PLATFORM_DB_NAME || 'platform';
const BASE = process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
const DEFAULT_SLUG = process.env.DEFAULT_HOTEL_SLUG || 'default';

const COLLECTIONS = ['channels', 'availabilities', 'eventraws', 'syncruns'];

async function main() {
  const client = await mongoose.createConnection(BASE).asPromise();
  const sysDb = client.client.db('admin');

  const dbs = (await sysDb.admin().listDatabases()).databases.map((d) => d.name);
  if (!dbs.includes(SRC)) {
    console.log(`source DB '${SRC}' not present — nothing to migrate`);
    await client.close();
    return;
  }

  const platformDb = client.useDb(PLATFORM);
  const hotels = await platformDb.collection('hotels').find({}).toArray();
  const hotelById = new Map(hotels.map((h) => [h._id.toString(), h]));
  const defaultHotel = hotels.find((h) => h.slug === DEFAULT_SLUG);
  if (!defaultHotel) throw new Error(`default hotel '${DEFAULT_SLUG}' not in platform.hotels — run platform bootstrap first`);

  console.log(`Found ${hotels.length} hotel(s); default = ${defaultHotel.dbName}`);

  const srcDb = client.useDb(SRC);

  // Group source docs by destination dbName
  const grouped = new Map();
  for (const col of COLLECTIONS) {
    const docs = await srcDb.collection(col).find({}).toArray();
    for (const doc of docs) {
      const idStr = doc.hotelId?.toString();
      const target = (idStr && hotelById.get(idStr)) || defaultHotel;
      const key = `${target.dbName}::${col}`;
      if (!grouped.has(key)) grouped.set(key, []);
      // rewrite hotelId to default if it was unknown
      if (!hotelById.has(idStr)) doc.hotelId = defaultHotel._id;
      grouped.get(key).push(doc);
    }
  }

  // Write into per-hotel DBs
  let written = 0;
  for (const [key, docs] of grouped.entries()) {
    const [dbName, col] = key.split('::');
    const dst = client.useDb(dbName).collection(col);
    for (const doc of docs) {
      // upsert by _id so re-running is idempotent
      const { _id, ...rest } = doc;
      await dst.updateOne({ _id }, { $setOnInsert: { _id, ...rest } }, { upsert: true });
      written += 1;
    }
    console.log(`  ${dbName}.${col}: +${docs.length}`);
  }

  console.log(`\n✅ migrated ${written} docs`);
  console.log(`   to drop source: mongosh --eval 'db.getSiblingDB("${SRC}").dropDatabase()'`);

  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
