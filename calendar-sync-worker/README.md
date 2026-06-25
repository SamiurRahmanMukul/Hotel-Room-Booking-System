# calendar-sync-worker

Single-tenant-per-channel calendar synchronization worker for the Hotel-Room-Booking-System platform.

Polls each hotel's OTA iCal feeds (Airbnb, Vrbo, small-property Booking.com, etc.), writes availability into a dedicated MongoDB database (`calendar-sync`), and serves outbound `.ics` so OTAs can subscribe to our merged calendar.

## Run locally

```
cp .env.example .env
docker run -d -p 6379:6379 --name calsync-redis redis:7-alpine   # if you don't have redis running
npm install
npm run dev
```

Worker listens on `:8001`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ical/:hotelId/:roomTypeId.ics` | Outbound merged iCal (paste this URL into each OTA) |
| `GET` | `/availability/:hotelId/:roomTypeId?from=&to=` | Availability JSON for the booking site calendar |
| `POST` | `/channels` | Register a new channel (body: `{hotelId, roomTypeId, type, name, icalUrl, pollIntervalSeconds}`) |
| `GET` | `/channels?hotelId=…` | List channels |
| `POST` | `/channels/:id/sync` | Force an immediate sync for one channel |

## Architecture

- **Mongo DB**: `calendar-sync` (separate from `booking-system`).
- **Job queue**: BullMQ + Redis. Each channel has a recurring job at its `pollIntervalSeconds`.
- **Adapters**: one per OTA family. `ical.js` is the only one implemented today. Add `googleHotels.js`, `aggregatorCloudbeds.js`, etc. without changing the worker shell.
- **Idempotency**: every external event is uniquely keyed by `(channelId, externalId)` — re-processing the same iCal entry is a no-op.

## Single-tenant

The worker doesn't enforce multi-tenancy internally. Each `Channel` document carries its `hotelId`, and jobs operate on one channel at a time. The platform's main API is the multi-tenant boundary.

## Adding a new adapter

1. Create `src/adapters/<name>.js` exporting `fetchAndParse(channel)` returning `[{externalId, summary, start, end, raw}]`.
2. Add the type to the `Channel.type` enum.
3. Branch on the type in `src/jobs/inboundSync.js`.

## Plan reference

See [Multi-Tenant DB & Onboarding Wizard Plan.md](../Multi-Tenant DB & Onboarding Wizard Plan.md) — sections §2.2 (DB), §2.3 (worker design), §2.6 (double-booking defenses), §2.7 (OTA matrix).
