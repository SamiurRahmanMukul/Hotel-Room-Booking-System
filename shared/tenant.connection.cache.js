/**
 * Dependency-injected tenant connection cache — the ONE place the per-hotel Mongoose
 * connection lifecycle lives: open, reuse, idle-evict, pool sizing. The backend and the
 * calendar-sync worker each build a cache from this factory instead of carrying their own
 * near-identical copy.
 *
 * `mongoose` is INJECTED, never required here, so the backend (Mongoose 6) and the worker
 * (Mongoose 8) can share this module despite their version skew. This file has ZERO external
 * dependencies on purpose — keep it that way.
 *
 * Two real adapters (backend + worker) justify the seam: eviction / pool / cap policy now
 * changes in one module instead of two copy-pasted files. LRU eviction at scale, connection
 * caps, telemetry — all land here once.
 *
 * Deployment note: both services must ship this `shared/` directory. In dev they run from
 * the repo root, so the relative require resolves. If the services are containerised
 * separately, copy `shared/` into each image (or publish it as a tiny internal package).
 */

module.exports = function createTenantConnectionCache({
  mongoose,
  baseUri,
  registerModels,
  idleTimeoutMs = 1000 * 60 * 30,
  maxPoolSize = 5,
  minPoolSize = 1
}) {
  if (!mongoose) throw new Error('createTenantConnectionCache: mongoose is required');
  if (typeof baseUri !== 'function') {
    throw new Error('createTenantConnectionCache: baseUri must be a function');
  }

  const cache = new Map();

  function evict(dbName) {
    const cached = cache.get(dbName);
    if (!cached) return Promise.resolve();
    cache.delete(dbName);
    clearTimeout(cached.timeoutId);
    return Promise.resolve(cached.conn.close()).catch(() => {});
  }

  function connectionForDbName(dbName) {
    if (!dbName) throw new Error('connectionForDbName: dbName required');

    if (cache.has(dbName)) {
      const cached = cache.get(dbName);
      clearTimeout(cached.timeoutId);
      cached.timeoutId = setTimeout(() => evict(dbName), idleTimeoutMs);
      return cached.conn;
    }

    const conn = mongoose.createConnection(`${baseUri()}/${dbName}`, { maxPoolSize, minPoolSize });
    if (typeof registerModels === 'function') registerModels(conn);

    const timeoutId = setTimeout(() => evict(dbName), idleTimeoutMs);
    cache.set(dbName, { conn, timeoutId });
    return conn;
  }

  async function closeAll() {
    const closes = [];
    for (const cached of cache.values()) {
      clearTimeout(cached.timeoutId);
      closes.push(cached.conn.close());
    }
    cache.clear();
    await Promise.all(closes);
  }

  function stats() {
    return { count: cache.size, dbNames: Array.from(cache.keys()) };
  }

  return {
    connectionForDbName, evict, closeAll, stats
  };
};
