# 🏨 Hotel Booking Platform — Multi-Tenant SaaS

A multi-tenant booking platform that hosts many hotels on shared infrastructure. Each hotel gets its own isolated database, branded admin panel, and public booking site. Built for a small platform operator (you) to onboard ~20–200 hotels with no-code setup, OTA channel synchronization, and per-tenant operational independence.

> Originally forked from [SamiurRahmanMukul/Hotel-Room-Booking-System](https://github.com/SamiurRahmanMukul/Hotel-Room-Booking-System) and evolved into a multi-tenant platform with super-admin controls, calendar sync worker, and magic-link onboarding.

---

## 📑 Table of Contents

- [Architecture overview](#️-architecture-overview)
- [Roles & access](#-roles--access)
- [Local URLs (dev)](#-local-urls-dev)
- [What's in the repo](#-whats-in-the-repo)
- [Features](#-features)
- [Tech stack](#️-tech-stack)
- [Database design](#️-database-design)
- [Local setup](#-local-setup)
- [Day-to-day commands](#-day-to-day-commands)
- [Bootstrapping & first run](#-bootstrapping--first-run)
- [Email delivery](#-email-delivery)
- [Operational notes](#️-operational-notes)
- [Roadmap](#️-roadmap)

---

## 🏗️ Architecture overview

```
                  ┌───────────────────────────────────────────────┐
                  │  Super-admin console (you, platform owner)    │
                  │  http://localhost:3001/superadmin/login       │
                  └────────────────────┬──────────────────────────┘
                                       │ reads/writes platform DB
                                       ▼
            ┌──────────────────────────────────────────────────────┐
            │  Backend API  (Node/Express, port 8000)              │
            │  • /platform-api/*  → platform-scoped (super-admin)  │
            │  • /api/v1/*        → tenant-scoped (auto-routed)    │
            │  • tenantResolver middleware sets req.db, req.M      │
            │  • per-hotel Mongoose connection cache               │
            └─┬──────────────────────────────────────┬─────────────┘
              │                                      │
              ▼                                      ▼
   ┌─────────────────────┐          ┌──────────────────────────────────────┐
   │ MongoDB cluster     │          │ Calendar-sync worker (port 8001)     │
   │                     │          │ • polls each hotel's iCal feeds      │
   │  ├─ platform        │          │ • serves outbound .ics for OTAs      │
   │  │   ├─ hotels      │          │ • POST /events for direct bookings   │
   │  │   ├─ superadmins │          │ • BullMQ + Redis                     │
   │  │   └─ audit       │          └──┬───────────────────────────────────┘
   │  │                  │             │ resolves dbName from platform.hotels
   │  ├─ booking-system  │◄────────────┘ then writes to that hotel's DB
   │  │   (= default)    │
   │  ├─ hotel_acme      │
   │  ├─ hotel_grandprix │
   │  └─ hotel_*         │
   └─────────────────────┘

  Per hotel surface (after publish):
    • <slug>.admin.platform.com  → hotel-admin panel (managers, staff)
    • <slug>.book.platform.com   → branded public booking site (guests)
```

**Tenancy model**: shared cluster, **one MongoDB database per hotel**. Cross-tenant data leak is impossible by construction — Hotel A's connection literally can't see Hotel B's collections. The booking site, admin panel, and worker all resolve which DB to talk to from a single `platform.hotels` registry (slug → dbName).

---

## 👤 Roles & access

| Role | Logs in at | Database scope | Capabilities |
|---|---|---|---|
| **super-admin** (you) | `/superadmin/login` | `platform` DB only (can act-as a hotel admin to touch hotel DBs) | Create hotels (DB + admin user + magic link), suspend/reactivate/delete, invite & remove super-admins, view cross-hotel dashboard |
| **hotel admin** | `/auth/login` (or `<slug>.admin.platform.com` in prod) | one `hotel_<slug>` DB only | Manage rooms, bookings, staff, channels, reviews for their hotel only |
| **staff** | same as hotel admin (role-gated) | same hotel | Check-in/out, view bookings, mark rooms out-of-service |
| **customer (guest)** | public booking site | their record lives in the booked hotel's DB | Browse rooms, book, manage own reservations, leave reviews |

---

## 🔗 Local URLs (dev)

| Surface | URL |
|---|---|
| Super-admin login | http://localhost:3001/superadmin/login |
| Super-admin dashboard | http://localhost:3001/superadmin/dashboard |
| Hotel admin login | http://localhost:3001/auth/login |
| Public booking site (frontend) | http://localhost:3034 |
| Backend API | http://localhost:8000 |
| Calendar-sync worker | http://localhost:8001 |
| Magic-link set-password | http://localhost:3001/auth/set-password?slug=…&token=… |

**Default super-admin** seeded by bootstrap:
- email: `k.velkov@msve.io`
- password: `admin123` (must change on first login)

---

## 📁 What's in the repo

```
.
├── backend/                       # Express API (multi-tenant)
│   ├── src/
│   │   ├── app/                   # Express app + middleware mount
│   │   ├── controllers/           # 6 controllers, all using req.M.*
│   │   ├── lib/
│   │   │   ├── platform.connection.js     # connection to platform DB
│   │   │   ├── tenant.connection.js       # per-hotel connection cache
│   │   │   ├── tenant.models.js           # registry of hotel-DB models
│   │   │   ├── hotel.provisioning.js      # provision / list / suspend / delete
│   │   │   ├── magic.link.js              # token gen / hash / URL builder
│   │   │   ├── mailer.js                  # console / resend / sendgrid transports
│   │   │   └── calendar.sync.client.js    # backend → worker push for direct bookings
│   │   ├── middleware/
│   │   │   ├── tenant.resolver.js         # subdomain / X-Hotel-Slug / JWT → req.db
│   │   │   └── superadmin.auth.js         # JWT for /platform-api
│   │   ├── models/
│   │   │   ├── platform/hotel.model.js
│   │   │   ├── platform/superadmin.model.js
│   │   │   └── { user, room, booking, booking.claim, review }.model.js
│   │   ├── routes/
│   │   │   ├── superadmin.routes.js       # /platform-api/*
│   │   │   ├── magic.link.routes.js       # /api/v1/auth/magic-link/*
│   │   │   └── { auth, user, room, booking, review, apps }.routes.js
│   │   └── …
│   └── scripts/
│       ├── bootstrap.platform.js          # seed platform DB + default hotel + superadmin
│       ├── create.hotel.js                # CLI: provision a new hotel
│       └── apply.tenant.refactor.js       # one-shot: inject req.M into controllers
│
├── admin-panel/                   # React (Create-React-App), port 3001
│   └── src/pages/
│       ├── Superadmin/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx              # cross-hotel KPIs
│       │   ├── Hotels.jsx                 # list + create
│       │   ├── HotelDetail.jsx            # occupancy, admins, sync, billing
│       │   └── Profile.jsx                # change pw, invite/remove super-admins
│       ├── SetPassword.jsx                # magic-link first-login
│       └── { Home, Login, Main, Error }.jsx   # legacy hotel-admin pages
│
├── frontend/                      # Next.js public booking site, port 3034
│   └── components/utilities/
│       ├── BookingCalendar.jsx            # react-day-picker v9 (modern, two-month, prices below dates)
│       └── OrderPlaceModal.jsx
│
├── calendar-sync-worker/          # Node worker, port 8001
│   ├── src/
│   │   ├── index.js                       # boot + HTTP API + BullMQ worker
│   │   ├── adapters/ical.js               # node-ical inbound
│   │   ├── jobs/{queue,inboundSync}.js
│   │   ├── server/icalRoute.js            # GET /ical/.../*.ics + POST /events
│   │   ├── lib/{platform,tenant}.connection.js
│   │   └── db/models/{Channel,Availability,EventRaw,SyncRun}.js
│   └── scripts/migrate.calendar-sync-to-tenant.js   # one-time migration (already run)
│
└── Multi-Tenant DB & Onboarding Wizard Plan.md      # full plan doc
```

---

## ✨ Features

### Platform / Super-admin
- **One-click hotel provisioning**: enter name + manager email → spins up a new MongoDB database, seeds default `hotel_settings`, creates the initial admin user, and emails them a 24-hour magic link to set a password.
- **Cross-hotel dashboard**: total hotels, status breakdown, total bookings/users/channels, per-hotel summary table.
- **Hotel detail page**: occupancy %, recent bookings, sync errors, list of admins with resend-link / remove / invite actions, suspend / reactivate / delete.
- **Manage super-admins**: invite via magic link, change own password, remove peers (with last-active-protection).

### Hotel admin
- Per-hotel dashboard, rooms, bookings, users, profile.
- Force-change password on first login (when `mustChangePassword: true`).
- Atomic booking claims (Mongo unique index on `(room_id, date)`) — concurrent same-room bookings are physically impossible.

### Customer (booking)
- Modern two-month calendar built on **`react-day-picker` v9** with per-night prices below dates and grey-out for blocked nights.
- Live availability merged from the calendar-sync worker (direct bookings + OTA-blocked dates).

### Calendar sync (OTA integration)
- **iCal in/out** for Airbnb, Vrbo, small-property Booking.com — working today.
- **Outbound `.ics`** at `/ical/:hotelId/:roomTypeId.ics` for OTAs to subscribe to.
- **Direct-booking push**: backend fires a fire-and-forget POST to the worker after each booking → instantly added to outbound `.ics` and the local availability map.
- **Echo prevention**: outbound UIDs prefixed with `bookingsystem-` so our own bookings round-tripping back from an OTA don't double-count.
- **Idempotent**: every external event uniquely keyed by `(channelId, externalId)`.
- **Worker telemetry**: `sync_runs` collection per hotel.
- Future adapters scaffolded: Google Hotels XML, Cloudbeds/MyAllocator aggregator, Booking.com Connectivity (cert needed), Expedia EQC (cert needed).

### Magic-link auth
- 32-byte random token, sha256-hashed at rest, 24h expiry, single-use.
- Backend routes for verify + set-password.
- Used for: hotel-admin first login, super-admin invites, password reset.

---

## 🛠️ Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | matches the original codebase |
| DB | MongoDB (one cluster, many DBs) | DB-per-tenant gives hard isolation without per-tenant ops cost |
| ORM | Mongoose 8 | per-connection model registration enables tenancy |
| Job queue | BullMQ + Redis | robust scheduling for OTA polling |
| Auth | JWT | both hotel-scoped and super-admin tokens |
| Email | Resend (default) / SendGrid / SMTP / console | swappable via `MAIL_TRANSPORT` env |
| iCal parser | `node-ical` | mature, widely used |
| iCal generator | `ical-generator` | same maintainer |
| Hotel admin panel | React 18 + antd + react-router | from the original codebase |
| Public booking site | Next.js 16 + antd + dayjs | from the original codebase |
| Calendar widget | `react-day-picker` v9 + `date-fns` | modern, headless, themeable |

---

## 🗄️ Database design

### `platform` DB
```
hotels             { slug, name, dbName, status, contact, billingPlan, createdAt }
superadmins        { email, password, fullName, mustChangePassword, status }
billing_invoices   (TBD)
platform_audit_log (TBD)
```

### Each `hotel_<slug>` DB (identical structure across all tenants)
```
users              { email, password, role, fullName, mustChangePassword, magicLinkTokenHash }
hotel_settings     (singleton: branding, contact, policies, amenities, taxRate, onboardingStep)
rooms              (the room inventory)
room_types         (TBD)
rate_plans         (TBD)
seasonal_pricing   (TBD)
bookings           (the reservations)
booking_claims     UNIQUE(room_id, date) — atomic-claim safety net
reviews            (guest reviews)
channels           OTA connections (iCal URLs, credentials, last sync status)
availability       UNIQUE(roomTypeId, date) — source of truth for blocked dates
events_raw         UNIQUE(channelId, externalId) — idempotent inbound OTA events
rate_pushes        (outbound updates to OTAs, TBD)
sync_runs          (per-job telemetry)
hotel_audit_log    (TBD)
```

### Tenant routing flow
```
1. Request arrives → tenantResolver middleware extracts hotel slug from:
   a. JWT claim `hotelSlug`
   b. X-Hotel-Slug header (dev / internal)
   c. Subdomain of Host header
   d. fallback DEFAULT_HOTEL_SLUG (default)
2. platform.hotels.findOne({ slug }) → returns dbName
3. tenant.connection cache returns (or opens) Mongoose connection scoped to dbName
4. req.db = connection; req.M = { Users, Rooms, Bookings, BookingClaims, Reviews }
5. Controller queries via req.M.Users.find(...) — physically isolated from other hotels
```

---

## 💻 Local setup

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`brew services start mongodb-community` or Docker)
- **Redis** running locally (`brew install redis && brew services start redis` or `docker run -d -p 6379:6379 redis:7-alpine`)

### Install
```bash
# from repo root
cd backend && npm install && cd ..
cd admin-panel && npm install && cd ..
cd frontend && npm install && cd ..
cd calendar-sync-worker && npm install && cd ..
```

### Env files
Each app has a `.env.example` you can copy. Notable vars:

**`backend/.env`**
```ini
APP_PORT=8000
APP_BASE_URL=http://localhost:8000
MONGO_BASE_URI=mongodb://localhost:27017
PLATFORM_DB_NAME=platform
DEFAULT_HOTEL_SLUG=default
JWT_SECRET_KEY=...
SUPERADMIN_JWT_SECRET=...
ADMIN_PANEL_BASE_URL=http://localhost:3001
CALENDAR_SYNC_URL=http://localhost:8001
# Email
MAIL_TRANSPORT=resend           # console (dev) | resend | sendgrid
MAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=re_...
```

**`calendar-sync-worker/.env`**
```ini
MONGO_BASE_URI=mongodb://localhost:27017
PLATFORM_DB_NAME=platform
DEFAULT_HOTEL_SLUG=default
REDIS_URL=redis://localhost:6379
PORT=8001
```

**`admin-panel/.env`** and **`frontend/.env.local`** — see existing files; key vars are `REACT_APP_API_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_CALENDAR_SYNC_URL`, `NEXT_PUBLIC_DEFAULT_HOTEL_ID`.

---

## 🚀 Day-to-day commands

### The Easy Way (All-in-One)
From the root folder, simply run the start script to spin up all 4 servers simultaneously. Press `Ctrl+C` to stop them all.
```bash
./start-all.sh
```

### The Manual Way (Separate Terminals)

```bash
# Backend (port 8000)
cd backend && npm run dev

# Calendar-sync worker (port 8001)
cd calendar-sync-worker && npm run dev

# Hotel admin panel + super-admin console (port 3001)
cd admin-panel && BROWSER=none npm start

# Public booking site (port 3034)
cd frontend && npm run dev
```

---

## 🌱 Bootstrapping & first run

The first time you set up the platform (or after wiping Mongo):

```bash
# 1. seed the platform DB with the default hotel + your super-admin user
cd backend && node scripts/bootstrap.platform.js

# Output:
#   created default hotel: <id>
#   created superadmin: <id>
#   ✅ platform bootstrap complete
```

The bootstrap is **idempotent** — safe to re-run. It will not overwrite existing records.

After bootstrap:
1. Open http://localhost:3001/superadmin/login
2. Sign in with `k.velkov@msve.io` / `admin123`
3. Click **"Create new hotel"** → enter name + manager email → check the manager's inbox for the magic link

To headlessly create hotels (CI / scripts):
```bash
node scripts/create.hotel.js "Acme Boutique Hotel" admin@acme.com "Acme Manager"
```

---

## 📧 Email delivery

Configured via `MAIL_TRANSPORT` env in `backend/.env`:

| Transport | Behaviour | When to use |
|---|---|---|
| `console` (default) | Logs the email to backend stdout, never sends | dev — copy the magic link from the terminal |
| `resend` | Sends via Resend API (`RESEND_API_KEY` required) | recommended for prod (free 3000/mo, 100/day) |
| `sendgrid` | Sends via SendGrid (`SENDGRID_API_KEY` required) | if you already have a SG account (100/day free) |

Resend's free `onboarding@resend.dev` sender only delivers to your own account email. To send to anyone, **verify a domain** in the Resend dashboard.

---

## 🌐 Subdomain routing (optional, for production-like dev)

By default, all four services run on different ports — you access them via `localhost:3001`, `localhost:3034`, etc. and the admin panel sends an `X-Hotel-Slug` header to tell the backend which tenant.

For a **production-like single-domain experience**, run the included **[Caddyfile](Caddyfile)**:

```bash
brew install caddy        # one-time
caddy run                 # picks up the Caddyfile automatically
```

Then everything is reachable at:

| URL | Goes to |
|---|---|
| `http://admin.localhost` | super-admin console |
| `http://<slug>.admin.localhost` | hotel admin panel for that slug |
| `http://<slug>.book.localhost` | public booking site for that slug |
| `http://api.localhost` | backend API |
| `http://sync.localhost` | calendar-sync worker |

`*.localhost` resolves to 127.0.0.1 natively on macOS/Linux — no `/etc/hosts` edits needed. Caddy injects the `X-Hotel-Slug` header from the subdomain so the backend's tenantResolver picks the right tenant DB.

For **production**: replace `localhost` with your real domain in the Caddyfile (e.g. `*.book.platform.com`) and Caddy will auto-provision Let's Encrypt wildcard certs. Zero code change required on the apps.

---

## ⚙️ Operational notes

### Adding a new model that lives in every hotel's DB
1. Create the schema in `backend/src/models/<thing>.model.js` exporting `{ schema, modelName, register }`.
2. Add it to `HOTEL_MODELS` in `backend/src/lib/tenant.models.js`.
3. Done — every existing and future hotel's connection will register it on next use.

### Schema migrations across all hotels
There is no migration runner yet (this is a Phase 1 follow-up). For now, write a script that:
1. Lists all hotels via `platform.hotels.find({})`
2. Loops through them, opens a connection to each, and applies the migration
3. Records the schema version in `platform.hotels.schemaVersion`

### Connection cap
Each Mongoose connection has 5 sockets by default. At 200 hotels = ~1000 sockets. MongoDB Atlas M10+ handles this trivially; self-hosted defaults are 65k. We'll add LRU eviction to the cache when we cross ~100 hotels.

### Calendar sync — double-booking prevention
Layered defense (see `Multi-Tenant DB & Onboarding Wizard Plan.md` §5.3):
1. **Atomic claim** ✅ — Mongo unique index on `(room_id, date)` in `booking_claims`.
2. **Pending-state reconciliation** — TBD: accept booking as `pending`, force-sync, confirm/refund within 60 s.
3. **Inventory buffer** — TBD: hold back N rooms per room type.
4. **Channel allocation** — TBD: cap each channel.
5. **Stop-sell triggers** — TBD: close slow channels when stock low.
6. **Adaptive polling** — TBD: faster near check-in.
7. **Native API push** — TBD: certified Booking.com / Expedia integration.

---

## 🗺️ Roadmap

See **[Multi-Tenant DB & Onboarding Wizard Plan.md](Multi-Tenant%20DB%20%26%20Onboarding%20Wizard%20Plan.md)** for the full plan.

### ✅ Done
- Multi-tenant architecture (DB per hotel, platform DB for registry)
- Tenant routing middleware + per-hotel Mongoose connection cache
- All 33 hotel-scoped controllers refactored to `req.M.*`
- Calendar-sync worker (iCal in/out, BullMQ scheduling, idempotent, echo-proof)
- Modern booking calendar (`react-day-picker` v9)
- Atomic booking claims (Mongo unique index)
- Backend → worker direct-booking push
- Super-admin "Create Hotel" one-click flow + magic-link emailing
- Magic-link first-login + set-password page
- Real email via Resend (configurable)
- Super-admin: dashboard, hotels list, hotel detail (occupancy, admins, sync errors, billing card)
- Manage hotel admins (invite, resend link, remove)
- Manage super-admins (invite, change password, remove)
- Suspend / reactivate / delete hotels (with rollback + DB drop)

### 🚧 Next up
- Combined login experience: **booking-site preview tab** inside hotel admin panel (Option C)
- Force-change password on super-admin first login
- Onboarding wizard for hotel managers (8 steps from the plan doc)
- Per-hotel branding feed-through to public site

### 📋 Later
- Subdomain routing in production (Caddy/Nginx wildcard + per-tenant TLS)
- Audit log UI
- Channel sync UI for hotel admins (manage their own iCal URLs)
- Billing & contracts (Stripe Connect)
- Native OTA APIs (Booking.com Connectivity, Expedia EQC)
- Reports & analytics (occupancy, ADR, RevPAR)
- 2FA for super-admin

---

## 📜 License

MIT — original work by [Md. Samiur Rahman (Mukul)](https://github.com/SamiurRahmanMukul).

---

## 🙏 Acknowledgments

- Original codebase by **Md. Samiur Rahman (Mukul)** — [Hotel-Room-Booking-System](https://github.com/SamiurRahmanMukul/Hotel-Room-Booking-System)
- Multi-tenant evolution, super-admin platform, calendar sync, and magic-link auth: this fork.
