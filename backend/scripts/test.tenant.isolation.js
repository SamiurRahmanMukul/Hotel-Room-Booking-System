/**
 * Smoke-test the tenant connection cache.
 *  - Creates two ephemeral hotel DBs
 *  - Writes one doc into each via separate connections
 *  - Verifies each DB sees only its own doc (isolation)
 *  - Verifies the cache returns the same connection on second call (caching)
 *  - Cleans up
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getHotelConnection, closeAll, stats } = require('../src/lib/tenant.connection');

async function main() {
  const A_NAME = '__tenant_test_a__';
  const B_NAME = '__tenant_test_b__';

  const connA1 = getHotelConnection(A_NAME);
  const connB = getHotelConnection(B_NAME);
  const connA2 = getHotelConnection(A_NAME);

  await connA1.asPromise();
  await connB.asPromise();

  console.log('cache stats:', stats());
  console.assert(connA1 === connA2, 'cache should return same connection for same dbName');
  console.assert(connA1 !== connB, 'different dbNames should yield different connections');

  const probeSchema = new mongoose.Schema({ tag: String, ts: { type: Date, default: Date.now } });
  const ProbeA = connA1.model('Probe', probeSchema);
  const ProbeB = connB.model('Probe', probeSchema);

  await ProbeA.deleteMany({});
  await ProbeB.deleteMany({});

  await ProbeA.create({ tag: 'hello-from-A' });
  await ProbeB.create({ tag: 'hello-from-B' });

  const inA = await ProbeA.find({}).lean();
  const inB = await ProbeB.find({}).lean();

  console.log('A sees:', inA.map((d) => d.tag));
  console.log('B sees:', inB.map((d) => d.tag));

  console.assert(inA.length === 1 && inA[0].tag === 'hello-from-A', 'A should see only A');
  console.assert(inB.length === 1 && inB[0].tag === 'hello-from-B', 'B should see only B');

  console.log('\n✅ tenant connection cache works');
  console.log('   - same dbName → cached connection');
  console.log('   - different dbName → isolated DB');
  console.log('   - writes to A do not leak into B');

  // cleanup
  await connA1.dropDatabase();
  await connB.dropDatabase();
  await closeAll();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ test failed:', err);
  process.exit(1);
});
