# 🏨 Hotel Room Booking System — Full Application Audit & Breakdown

**Audit Date:** 2026-06-25
**Repository:** [SamiurRahmanMukul/Hotel-Room-Booking-System](https://github.com/SamiurRahmanMukul/Hotel-Room-Booking-System)
**Branch:** main

---

## 📑 Table of Contents

- [What Is This App?](#-what-is-this-app)
- [Purpose & Business Model](#-purpose--business-model)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Multi-Tenant Model](#-multi-tenant-model)
- [Roles & Access](#-roles--access)
- [Service Breakdown](#-service-breakdown)
  - [Backend API](#1-backend-api-express-port-8000)
  - [Admin Panel](#2-admin-panel-react-port-3001)
  - [Public Booking Site](#3-public-booking-site-nextjs-port-3034)
  - [Calendar Sync Worker](#4-calendar-sync-worker-node-port-8001)
  - [Reverse Proxy (Caddy)](#5-reverse-proxy-caddy)
- [Database Design](#-database-design)
- [Key Features Implemented](#-key-features-implemented)
- [Implementation Progress](#-implementation-progress-vs-plan)
- [What's Left (Gap Analysis)](#-whats-left-gap-analysis)
- [Known Bugs](#-known-bugs)
- [Technical Debt & Issues](#-technical-debt--issues)
- [Nice-to-Haves](#-nice-to-haves)
- [Local Setup Guide](#-local-setup-guide)
- [Day-to-Day Commands](#-day-to-day-commands)
- [Bootstrapping & First Run](#-bootstrapping--first-run)
- [Email Delivery](#-email-delivery)
- [Operational Notes](#-operational-notes)
- [Roadmap (from Plan Document)](#-roadmap-from-plan-document)
- [Open Questions](#-open-questions)
- [Glossary](#-glossary)

---

## 🎯 What Is This App?

This is a **multi-tenant SaaS hotel booking platform** — originally forked from a single-hotel booking system by [Md. Samiur Rahman (Mukul)](https://github.com/SamiurRahmanMukul) and evolved into a platform that can host **20–200+ hotels** on shared infrastructure.

Each hotel gets its own **isolated MongoDB database**, a branded admin panel, and a public booking site. The platform includes OTA (Online Travel Agency) channel synchronization with Airbnb, Booking.com, Vrbo, and others via iCal.

The platform operator uses a **super-admin console** to provision hotels with one click, and hotel managers onboard through a **magic-link flow** — no code, no DB access, no support ticket needed.

---

## 💼 Purpose & Business Model

**Target customer:** Small-to-medium hotels (20–200 properties) that need:
- A direct booking website (branded, not a generic OTA listing)
- Channel management across Airbnb, Booking.com, Vrbo, Expedia, etc.
- A property management interface for staff
- No technical expertise to set up

**Platform operator (you):**
- Hosts all hotels on shared MongoDB + Node.js infrastructure
- Provisions new hotels via a super-admin console (one click → DB created, admin user created, magic link emailed)
- Manages billing, monitors cross-hotel health, can suspend/reactivate/delete hotels
- Each hotel is fully isolated — Hotel A cannot see Hotel B's data

**Revenue model (TBD):** Per-hotel flat fee, % of bookings, or tiered by room count. Stripe Connect integration planned.

---

## 🏗️ Architecture Overview

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

### Service Topology (4 services + 1 reverse proxy)

```
┌──────────────────────┐    ┌──────────────────────┐
│  Admin Panel (CRA)   │    │  Public Site (Next.js)│
│  Port 3001           │    │  Port 3034            │
│  React 18 + AntD 5   │    │  Next.js 16 + AntD 5  │
└──────────┬───────────┘    └──────────┬───────────┘
           │                           │
           ▼                           ▼
┌──────────────────────────────────────────────────┐
│           Backend API (Express, Port 8000)        │
│  • tenantResolver middleware → req.db, req.M     │
│  • /platform-api/* (super-admin, no tenant)      │
│  • /api/v1/* (tenant-scoped, auto-routed)        │
│  • Per-hotel Mongoose connection cache           │
└──────────┬───────────────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐  ┌──────────────────────────────┐
│ MongoDB  │  │ Calendar-Sync Worker          │
│ Cluster  │  │ (Express + BullMQ, Port 8001) │
│          │  │ • iCal in/out                 │
│ ├ platform│  │ • Per-hotel DB connections    │
│ ├ hotel_1 │  │ • Redis-backed job queue      │
│ ├ hotel_2 │  └──────────────────────────────┘
│ └ hotel_N │
└──────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Node.js | ≥ 18 |
| Backend framework | Express | 4.18 |
| Database | MongoDB (one cluster, many DBs) | — |
| ORM/ODM | Mongoose | 6.6 (backend) / 8.6 (worker) |
| Job queue | BullMQ + Redis | 5.12 |
| Admin panel | React (Create React App) | 18 |
| Admin UI library | Ant Design | 5.x |
| Admin CSS | Tailwind CSS | 3.x |
| Admin state | Redux Toolkit + redux-persist | — |
| Admin routing | React Router | 6.x |
| Public site | Next.js | 16.2.4 |
| Public site UI | Ant Design + styled-components | 5.x |
| Calendar widget | react-day-picker | 9.x |
| Date handling | dayjs + date-fns | — |
| Auth | JWT (access + refresh tokens) | — |
| Magic link | crypto (SHA-256 hashed tokens) | — |
| Email | Resend / SendGrid / SMTP / console | configurable |
| iCal parser | node-ical | 0.18 |
| iCal generator | ical-generator | 7.2 |
| Logging | Winston (backend), Pino (worker) | — |
| Reverse proxy | Caddy | v2 |
| Testing | Jest + Supertest (backend only) | 29 |

---

## 🗄️ Multi-Tenant Model

### Tenancy Model: DB-per-Tenant

**Shared cluster, one MongoDB database per hotel.** Cross-tenant data leak is impossible by construction — Hotel A's connection literally can't see Hotel B's collections.

### `platform` DB (shared, super-admin only)

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

### Tenant Routing Flow

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

## 👤 Roles & Access

| Role | Logs in at | Database scope | Capabilities |
|---|---|---|---|
| **super-admin** (you) | `/superadmin/login` | `platform` DB only (can act-as a hotel admin to touch hotel DBs) | Create hotels (DB + admin user + magic link), suspend/reactivate/delete, invite & remove super-admins, view cross-hotel dashboard |
| **hotel admin** | `/auth/login` (or `<slug>.admin.platform.com` in prod) | one `hotel_<slug>` DB only | Manage rooms, bookings, staff, channels, reviews for their hotel only |
| **staff** | same as hotel admin (role-gated) | same hotel | Check-in/out, view bookings, mark rooms out-of-service |
| **customer (guest)** | public booking site | their record lives in the booked hotel's DB | Browse rooms, book, manage own reservations, leave reviews |

---

## 📦 Service Breakdown

### 1. Backend API (Express, Port 8000)

**Location:** `backend/`
**Entry:** `server.js` → `src/app/index.js`

#### Middleware Stack (in order)
1. `limiter` — rate limiter (1000 req/10min)
2. `connectDatabase()` — MongoDB connection
3. `morganLogger()` — HTTP access logs (dev only)
4. `helmet` — security headers
5. `cors` — configured whitelist
6. `cookieParser` — parse cookies
7. `bodyParser` / `express.json` — body parsing (⚠️ duplicated)
8. `serve-favicon` — favicon (dev only)
9. `express.static('public')` — static files

#### Route Mounting
- `GET /` → welcome message
- `/platform-api` → superadmin routes (BEFORE tenantResolver — bypasses tenant scoping)
- `/api/v1` → tenantResolver middleware, then auth, magic-link, onboarding, user, apps, room, booking, review routes

#### Controllers (6 total, all using `req.M.*` pattern)
| Controller | Exports | Purpose |
|---|---|---|
| `auth.controllers.js` | register, loginUser, logoutUser, forgotPassword, resetPassword, changePassword, sendEmailVerificationLink, emailVerification, refreshToken | Authentication & user management |
| `user.controllers.js` | getUser, getUserById, updateUser, avatarUpdate, deleteUser, deleteUserById, getUsersList, blockedUser, unblockedUser | User CRUD + admin user management |
| `apps.controllers.js` | getDashboardData | Dashboard statistics aggregation |
| `room.controllers.js` | createRoom, getRoomsList, getRoomByIdOrSlugName, editRoomByAdmin, deleteRoomById, getFeaturedRoomsList | Room CRUD |
| `booking.controllers.js` | placedBookingOrder, getBookingOrderByUserId, cancelSelfBookingOrder, getBookingOrderForAdmin, updatedBookingOrderByAdmin, patchBookingInline | Booking management with atomic claims |
| `review.controllers.js` | roomReviewAdd, getRoomReviewsList, editSelfRoomReview | Guest reviews |

#### Key Libraries (`src/lib/`)
| Module | Purpose |
|---|---|
| `platform.connection.js` | Singleton connection to `platform` DB |
| `tenant.connection.js` | Per-hotel Mongoose connection cache with idle eviction (30 min) |
| `tenant.models.js` | Registers 5 hotel-scoped models on each tenant connection |
| `hotel.provisioning.js` | Core multi-tenant provisioning: create, list, suspend, delete hotels |
| `magic.link.js` | Token generation (32 random bytes), SHA-256 hashing, URL building |
| `mailer.js` | Multi-transport email abstraction (console/SendGrid/Resend) |
| `calendar.sync.client.js` | Fire-and-forget POST to worker for direct booking pushes |
| `hotel.backup.js` | mongodump/mongorestore per-hotel backup/restore |
| `booking.dates.validator.js` | Date array validation for bookings |

#### Middleware (`src/middleware/`)
| Middleware | Purpose |
|---|---|
| `tenant.resolver.js` | Core multi-tenant: resolves slug → dbName → connection → req.db + req.M |
| `superadmin.auth.js` | JWT-based superadmin authentication |
| `app.authentication.js` | Hotel-scoped auth: isAuthenticatedUser, isAdmin, isBlocked, isRefreshTokenValid |
| `access.limiter.js` | Rate limiting (general + login-specific) |
| `error.handler.js` | 404 + 500 error handlers |
| `morgan.logger.js` | HTTP request logging with rotating files |
| `winston.logger.js` | Application-level Winston logger |
| `room.image.upload.js` | Multer config for room images (max 8MB) |
| `user.avatar.upload.js` | Multer config for user avatars (max 5MB) |

#### Scripts (`scripts/`)
| Script | Purpose |
|---|---|
| `bootstrap.platform.js` | Seed platform DB + default hotel + superadmin (idempotent) |
| `create.hotel.js` | CLI: provision a new hotel |
| `apply.tenant.refactor.js` | One-shot: inject `req.M` into controllers (idempotent) |
| `clean-hotels.js` | Delete all hotels except a specific one |
| `test.tenant.isolation.js` | Smoke test for tenant connection isolation |
| `test.tenant.models.js` | Verify multi-tenant model architecture |
| `test.tenant.resolver.js` | E2E test of tenantResolver middleware |

---

### 2. Admin Panel (React, Port 3001)

**Location:** `admin-panel/`
**Stack:** React 18 + Ant Design 5 + Tailwind CSS 3 + Redux Toolkit + React Router 6
**Build tool:** Create React App (react-scripts 5.0.1)

#### Routes
| Path | Component | Guard |
|---|---|---|
| `/` | `Home` | Public |
| `/main/:tab` | `Main` | `PrivateRoute` |
| `/auth/login` | `Login` | `PublicRoute` |
| `/auth/set-password` | `SetPassword` | Public (magic link) |
| `/auth/change-password` | `ChangePassword` | `PrivateRoute` |
| `/superadmin/login` | `SuperadminLogin` | Public (self-checks auth) |
| `/superadmin/dashboard` | `SuperadminDashboard` | Public (self-checks auth) |
| `/superadmin/hotels` | `SuperadminHotels` | Public (self-checks auth) |
| `/superadmin/hotels/:slug` | `HotelDetail` | Public (self-checks auth) |
| `/superadmin/profile` | `SuperadminProfile` | Public (self-checks auth) |
| `*` | `NotFound` (Error.jsx) | Public |

#### Hotel Admin Tabs (sidebar menu in Main.jsx)
| Tab | Component | Purpose |
|---|---|---|
| Dashboard | `Dashboard` | Stats: occupancy, rooms available, guests, pending, check-ins, cancellations |
| Users | `Users` | User list + create + details |
| Hotel Rooms | `Rooms` | Room list + create + edit |
| Tape Chart | `TapeChart` | 8-day PMS grid (today + 7 days) |
| Booking Orders | `Orders` | Full booking management with inline editing |
| My Profile | `MyProfile` | Avatar upload, edit profile, change password |

#### Unreachable Tabs (exist but not in sidebar)
| Tab | Component | Purpose |
|---|---|---|
| Booking Site Preview | `BookingSitePreview` / `Channels` | OTA channel management (connect iCal URLs, force sync) |
| Hotel Settings | `HotelSettings` | 5-section settings: basics, property, photos, policies, branding |

#### Super-Admin Pages
| Page | Purpose |
|---|---|
| `Superadmin/Dashboard.jsx` | Platform overview: total hotels, bookings, channels, rooms, users, per-hotel table |
| `Superadmin/Hotels.jsx` | Hotel list + create modal (name, manager email, magic link result) |
| `Superadmin/HotelDetail.jsx` | Per-hotel detail: stats, occupancy, admins, bookings, sync health, billing, backups |
| `Superadmin/Profile.jsx` | Change password, manage peer super-admins (invite, remove) |

#### Key Components
| Component | Purpose |
|---|---|
| `SuperadminLayout.jsx` | Fixed sidebar layout for super-admin pages |
| `OnboardingChecklist.jsx` | Getting-started checklist with progress bar + publish flow |
| `Channels.jsx` | OTA channel management: connect iCal URLs, force sync, disconnect, outbound URLs |
| `HotelSettings.jsx` | 5-section hotel settings (basics, property, photos, policies, branding) |
| `HotelChip.jsx` | Sidebar hotel info card (fetches branding from API) |
| `HotelLogo.jsx` | Fetches hotel branding, renders logo or fallback wordmark |

#### Hooks
| Hook | Purpose |
|---|---|
| `useFetchData` | Generic data fetching with Redux reFetch trigger |
| `useFullScreen` | Fullscreen toggle tracking |
| `useScreenSize` | Window size tracking (⚠️ unused) |
| `useTimeout` | Debounced timeout with cleanup |

#### State Management
- Redux store with `redux-persist` (sessionStorage)
- **Whitelist is empty** — nothing persists across refreshes
- Only used for `reFetch` toggle to trigger data re-fetches
- All real state is component-local `useState` or localStorage

#### Auth Systems (two separate)
1. **Hotel admin:** `ApiService` axios instance with refresh token rotation → localStorage keys: `BEACH-RESORT-*`
2. **Super-admin:** Raw axios → localStorage keys: `superadmin_*`

---

### 3. Public Booking Site (Next.js, Port 3034)

**Location:** `frontend/`
**Stack:** Next.js 16.2.4 + React 18 + Ant Design 5 + styled-components + Redux Toolkit

#### Pages
| Page | Render | Purpose |
|---|---|---|
| `index.js` | SSR | Homepage: Hero → Banner → Services → FeaturedRooms |
| `rooms/index.js` | SSR | Room listing with client-side filters |
| `rooms/[slug].js` | SSR | Room detail + booking modal + reviews |
| `auth/login.js` | Client | Login form |
| `auth/registration.js` | Client | Registration form |
| `auth/forgot-password/index.js` | Client | Forgot password |
| `auth/forgot-password/[token].js` | Client | Reset password |
| `auth/verify-email/[token].js` | Client | Email verification |
| `profile/index.js` | Client | User profile + booking history (tabbed) |
| `404.js` | Client | Custom 404 |

#### Key Components
| Component | Purpose |
|---|---|
| `layout/MainLayout` | Shell: Head, Navbar, main, Footer |
| `layout/HotelLogo` | Multi-tenant aware: reads `?slug=` from URL, fetches branding |
| `utilities/BookingCalendar` | Modern calendar (react-day-picker v9): two-month, prices below dates, blocked dates from worker |
| `utilities/OrderPlaceModal` | Booking modal with calendar + confirm |
| `utilities/RoomReviewList` | Reviews list with load-more + edit |
| `profile/BookingHistory` | User's booking history with cancel/review actions |

#### State Management
- Redux store with `redux-persist` (localStorage)
- **Whitelist is empty** — nothing persists via Redux
- Auth uses raw localStorage: `BRF-USER-STORAGE`, `BRF-ACCESS-TOKEN`, `BRF-REFRESH-TOKEN`

---

### 4. Calendar Sync Worker (Node, Port 8001)

**Location:** `calendar-sync-worker/`
**Stack:** Express 4.21 + Mongoose 8.6 + BullMQ 5.12 + ioredis 5.4

#### HTTP Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check |
| `GET /ical/:hotelId/:roomTypeId.ics` | Outbound iCal feed for OTAs |
| `GET /availability/:hotelId/:roomTypeId?from=&to=` | Availability JSON (used by BookingCalendar) |
| `POST /events` | Direct event ingestion from backend |
| `POST /channels` | Register a new OTA channel |
| `GET /channels?hotelId=` | List channels for a hotel |
| `POST /channels/:id/sync` | Manual force-sync trigger |
| `GET /__test/fake-airbnb.ics` | Test fixture (3 fake booking events) |

#### Core Logic
| Module | Purpose |
|---|---|
| `adapters/ical.js` | Fetch + parse iCal feeds via node-ical |
| `jobs/queue.js` | BullMQ queue creation, worker (concurrency 4), schedule all channels, manual trigger |
| `jobs/inboundSync.js` | Core sync: fetch → parse → skip echoes → upsert EventRaw → update Availability → record SyncRun |
| `server/icalRoute.js` | Generate outbound iCal, serve availability, ingest direct events |
| `lib/tenant.connection.js` | Per-hotel DB connection cache (same pattern as backend) |
| `lib/platform.connection.js` | Read-only platform DB connection |

#### Database Models (per-tenant)
| Model | Purpose |
|---|---|
| `Channel` | OTA connection config (type, iCal URL, poll interval, status) |
| `Availability` | Source of truth for blocked dates (UNIQUE on roomTypeId+date) |
| `EventRaw` | Idempotent inbound events (UNIQUE on channelId+externalId) |
| `SyncRun` | Per-job telemetry (events processed, errors, duration) |

#### Double-Booking Prevention (Layered Defense)
1. **Atomic claim** ✅ — `BookingClaim` UNIQUE(`room_id`, `date`)
2. **Pending-state reconciliation** — TBD
3. **Inventory buffer** — TBD
4. **Channel allocation** — TBD
5. **Stop-sell triggers** — TBD
6. **Adaptive polling** — TBD
7. **Native API push** — TBD

#### Echo Prevention
Outbound `.ics` UIDs prefixed with `bookingsystem-`. Inbound parser skips events with that prefix. Prevents our own bookings from round-tripping through an OTA and double-counting.

---

### 5. Reverse Proxy (Caddy)

**Location:** `Caddyfile` (repo root)

Routes in dev (all on `*.localhost` — resolves to 127.0.0.1 natively):
| URL | Goes to |
|---|---|
| `http://admin.localhost` | super-admin console (port 3001) |
| `http://<slug>.admin.localhost` | hotel admin panel for that slug |
| `http://<slug>.book.localhost` | public booking site for that slug |
| `http://api.localhost` | backend API (port 8000) |
| `http://sync.localhost` | calendar-sync worker (port 8001) |

Caddy injects `X-Hotel-Slug` header from subdomain → backend tenantResolver picks the right tenant DB.

---

## 🗄️ Database Design

### `platform` DB
```
hotels             { slug, name, dbName, status, contact, billingPlan, customDomain, createdAt, suspendedAt }
superadmins        { email, password, fullName, role, mustChangePassword, lastLoginAt, status, magicLinkTokenHash, magicLinkExpiresAt }
billing_invoices   (TBD)
platform_audit_log (TBD)
```

### Each `hotel_<slug>` DB
```
users              { userName, fullName, email, phone, password, avatar, gender, dob, address, role, verified, mustChangePassword, status, resetPasswordToken, resetPasswordExpire, magicLinkTokenHash, magicLinkExpiresAt, emailVerificationToken, emailVerificationExpire }
hotel_settings     { branding, contact, policies, amenities, taxRate, serviceFeePct, inventoryBuffer, onboardingStep }
rooms              { room_name, room_slug, room_type, room_price, room_size, room_capacity, allow_pets, provide_breakfast, featured_room, room_description, extra_facilities, room_images, room_status, created_by }
bookings           { room_id, booking_dates, booking_status, booking_by, reviews, guests, guest_country, booking_source, payment, notes }
booking_claims     { room_id, date, booking_id } — UNIQUE(room_id, date)
reviews            { user_id, room_id, booking_id, rating, message }
channels           { hotelId, roomTypeId, type, name, icalUrl, credentials, pollIntervalSeconds, enabled, lastSyncAt, lastSyncStatus, lastError }
availability       { hotelId, roomTypeId, date, totalUnits, soldUnits, blockedUnits, bySource, conflict } — UNIQUE(roomTypeId, date)
events_raw         { hotelId, channelId, eventType, externalId, payload, processedAt } — UNIQUE(channelId, externalId)
sync_runs          { channelId, startedAt, finishedAt, eventsProcessed, newReservations, cancellations, errorMessages, durationMs, status }
```

---

## ✅ Key Features Implemented

| # | Feature | Status |
|---|---|---|
| 1 | Multi-tenant DB-per-hotel architecture | ✅ |
| 2 | Tenant routing middleware + per-hotel Mongoose connection cache | ✅ |
| 3 | All 33 hotel-scoped controllers refactored to `req.M.*` pattern | ✅ |
| 4 | Super-admin console (dashboard, hotels CRUD, hotel detail, admin management) | ✅ |
| 5 | One-click hotel provisioning (creates DB + admin user + magic link email) | ✅ |
| 6 | Magic-link first-login + set-password page (hotel admins + super-admins) | ✅ |
| 7 | Hotel admin panel (dashboard, users, rooms, bookings, tape chart, profile) | ✅ |
| 8 | Public booking site (browse rooms, book, reviews, profile, booking history) | ✅ |
| 9 | Modern booking calendar (react-day-picker v9, two-month, prices below dates, blocked dates) | ✅ |
| 10 | Atomic booking claims (Mongo unique index on `room_id, date`) | ✅ |
| 11 | Calendar-sync worker (iCal in/out, BullMQ scheduling, idempotent, echo-proof) | ✅ |
| 12 | Backend → worker direct-booking push (fire-and-forget POST) | ✅ |
| 13 | OTA channel management UI (connect iCal URLs, force sync, disconnect, outbound URLs) | ✅ |
| 14 | Hotel backup/restore (mongodump/mongorestore CLI) | ✅ |
| 15 | Suspend / reactivate / delete hotels (with rollback + DB drop) | ✅ |
| 16 | Super-admin peer management (invite via magic link, remove) | ✅ |
| 17 | Real email delivery via Resend / SendGrid / console (configurable) | ✅ |
| 18 | Caddy reverse proxy for subdomain routing (dev + prod ready) | ✅ |
| 19 | Hotel admin management (invite, resend magic link, remove) | ✅ |
| 20 | Force-change password on first login (hotel admins) | ✅ |
| 21 | Refresh token rotation with concurrent 401 coalescing | ✅ |
| 22 | Onboarding checklist API (8 items) + publish endpoint | ✅ |
| 23 | Hotel settings API (basics, property, policies, branding) | ✅ |
| 24 | Public branding endpoint (for booking site to read hotel theme) | ✅ |

---

## 📊 Implementation Progress vs. Plan

Based on the [Multi-Tenant DB & Onboarding Wizard Plan](Multi-Tenant%20DB%20%26%20Onboarding%20Wizard%20Plan.md):

```
Phase 0 (Repo prep + calendar sync MVP):  ████████████████████ 100%
Phase 1 (Platform DB + connection cache): ████████████████░░░░  90%
Phase 2 (Super-admin console):            ███████████████░░░░░  85%
Phase 3 (Onboarding wizard MVP):          ████░░░░░░░░░░░░░░░░  20%
Phase 4 (Wizard depth):                   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5 (Day-2 features):                 ███░░░░░░░░░░░░░░░░░  15%
Phase 6 (More channel adapters):          ██░░░░░░░░░░░░░░░░░░  10%
Phase 7 (Polish & native APIs):           ░░░░░░░░░░░░░░░░░░░░   0%
```

**Overall: ~45% complete.**

---

## 🚧 What's Left (Gap Analysis)

### Phase 1 — Platform DB + Connection Cache (90%)
- [ ] Automated integration test for 2nd hotel isolation (scripts exist but not in CI)
- [ ] Schema migration runner (loop through all hotels, apply migration, record version)

### Phase 2 — Super-Admin Console (85%)
- [ ] Enforce `mustChangePassword` on super-admin first login (flag exists, not enforced)
- [ ] Combined login experience: booking-site preview tab inside hotel admin panel

### Phase 3 — Onboarding Wizard MVP (20%)
- [ ] Stepper UI component with save-on-Next and resume-from-email
- [ ] Steps 1–3 (basics, branding, property) — required for publish
- [ ] Step 8 (review & launch) — API exists, no UI
- [ ] Themed public booking site reading `hotel_settings.branding` (only `HotelLogo` does this)
- [ ] End-to-end demo: super-admin creates hotel → manager publishes → guest books

### Phase 4 — Wizard Depth (0%)
- [ ] Step 4 (room types)
- [ ] Step 5 (pricing) with one-click templates
- [ ] Step 6 (channels) — wire existing channel adapter code into wizard
- [ ] Step 7 (policies)

### Phase 5 — Day-2 Features (15%)
- [ ] Calendar page (month grid with conflict UI) — only 8-day TapeChart exists
- [ ] Wire `BookingSitePreview`/`Channels` into sidebar menu (component exists, unreachable)
- [ ] Wire `HotelSettings` into sidebar menu (component exists, unreachable)
- [ ] Reports/analytics (occupancy %, ADR, RevPAR per hotel)
- [ ] Staff management UI (staff role exists in schema, no staff-specific UI)
- [ ] Per-hotel branding feed-through to public booking site

### Phase 6 — More Channel Adapters (10%)
- [ ] Google Hotels adapter (XML feed)
- [ ] Aggregator adapter (Cloudbeds/MyAllocator/SiteMinder/STAAH)
- [ ] Booking.com Connectivity API adapter
- [ ] Expedia EQC adapter
- [ ] Airbnb API adapter
- [ ] Tripadvisor TripConnect adapter
- [ ] Webhook receiver for native push
- [ ] Cancellation detection in iCal sync (EventRaw supports it, logic doesn't)
- [ ] Conflict resolution logic (Availability.conflict field exists, never set)

### Phase 7 — Polish & Native APIs (0%)
- [ ] Booking.com Connectivity certification
- [ ] Expedia EQC certification
- [ ] Custom-domain CNAME flow + per-tenant TLS
- [ ] Cross-tenant analytics for super-admin
- [ ] Stripe billing integration
- [ ] Audit log UI
- [ ] 2FA for super-admin
- [ ] i18n / multi-language support

---

## 🐛 Known Bugs

### 🔴 Critical
| # | Bug | File | Impact |
|---|---|---|---|
| 1 | `isBlocked` middleware checks `user.role !== 'blocked'` instead of `user.status !== 'blocked'` | `backend/src/middleware/app.authentication.js` | **Blocked users are never actually blocked.** The `role` field is `'admin'` or `'user'`, never `'blocked'`. |

### 🟡 Important
| # | Bug | File | Impact |
|---|---|---|---|
| 2 | Duplicate body parsing: `bodyParser.json()` and `express.json()` both called | `backend/src/app/index.js` | Redundant, wastes cycles |
| 3 | `connectDatabase()` called without `await` — app starts before DB connection guaranteed | `backend/src/app/index.js` | Race condition on startup |
| 4 | 20+ separate `Model.find()` calls for dashboard stats instead of `countDocuments()` or aggregation | `backend/src/controllers/apps.controllers.js` | Performance issue at scale |
| 5 | `if (!totalUsers)` check never true — `find()` returns `[]`, not `null` | `backend/src/controllers/apps.controllers.js` | Unreachable error response |
| 6 | `PublicRoute` redirects to `/dashboard/main` which doesn't exist (should be `/main/dashboard`) | `admin-panel/src/components/middleware/PublicRoute.jsx` | Broken redirect after login |
| 7 | `RoomEdit` missing "family" room type in Select options (CreateRoom has it) | `admin-panel/src/components/rooms/RoomEdit.jsx` | Can't edit family rooms |
| 8 | `RoomDetails` shows `$` for price but system uses `€` | `admin-panel/src/components/rooms/RoomDetails.jsx` | Wrong currency symbol |
| 9 | `TapeChart` booking matching uses `booking_dates[0]` and `booking_dates[1]` as start/end, but data model uses array of date strings | `admin-panel/src/components/tabs/TapeChart.jsx` | Tape chart may not display bookings correctly |
| 10 | `HotelChip` navigates to `/main/hotel-settings` but route not defined in App.js | `admin-panel/src/components/shared/HotelChip.jsx` | Clicking hotel chip does nothing |
| 11 | `create.hotel.js` references `result.adminUrl` and `result.bookingUrl` which don't exist in `provisionHotel` return value | `backend/scripts/create.hotel.js` | Prints `undefined` for URLs |
| 12 | `review.modal.js` filename typo: "modal" should be "model" | `backend/src/models/review.modal.js` | Confusing, but works |
| 13 | `getRoomByIdOrSlugName` response says "User information get successful" but returns room data | `backend/src/controllers/room.controllers.js` | Copy-paste error in response message |
| 14 | Frontend room filter: breakfast and pets filters are independent `useEffect` hooks that overwrite each other | `frontend/components/rooms/RoomsFilter.jsx` | Can't combine breakfast + pets filters |
| 15 | `BookingCard` has duplicate "Approved Bookings" stat (slots 4 and 6) | `admin-panel/src/components/dashboard/BookingCard.jsx` | Wrong stats display (component is unused anyway) |
| 16 | `apiLimiter` comment says "10 login requests" but code has `max: 5` | `backend/src/middleware/access.limiter.js` | Misleading comment |
| 17 | `forgotPassword` uses legacy `sendEmail` from `configs/send.mail.js`, not the new `mailer.js` abstraction | `backend/src/controllers/auth.controllers.js` | Two email systems in use |
| 18 | No cancellation detection in iCal sync — `EventRaw` supports `cancel`/`modify` event types but sync logic only processes new reservations | `calendar-sync-worker/src/jobs/inboundSync.js` | Cancelled OTA bookings won't free up availability |
| 19 | No conflict resolution logic — `Availability.conflict` field exists but is never set | `calendar-sync-worker/src/db/models/Availability.js` | Double-booking conflicts not flagged |
| 20 | No authentication on worker API — designed as internal service but exposed on port 8001 | `calendar-sync-worker/src/index.js` | Security risk if exposed |

### 🟢 Minor
| # | Bug | File |
|---|---|---|
| 21 | Deprecated Mongoose 6 options (`useNewUrlParser`, `useUnifiedTopology`) — no-ops, harmless | `backend/src/database/connect.mongo.db.js` |
| 22 | `validateBookingDates` uses global `isNaN()` instead of `Number.isNaN()` | `backend/src/lib/booking.dates.validator.js` |
| 23 | `loginUser` uses `req.M` destructuring but falls back to global `User` model in some error paths | `backend/src/controllers/auth.controllers.js` |
| 24 | `deleteUser` and `deleteUserById` have significant code duplication | `backend/src/controllers/user.controllers.js` |
| 25 | `createRoom` and `editRoomByAdmin` share nearly identical validation logic | `backend/src/controllers/room.controllers.js` |
| 26 | `updatedBookingOrderByAdmin` switch statement is long and could be refactored into state machine | `backend/src/controllers/booking.controllers.js` |
| 27 | `calendar.sync.client.js` uses `fetch` with no retry logic — failures silently logged | `backend/src/lib/calendar.sync.client.js` |
| 28 | `hotel.backup.js` depends on `mongodump`/`mongorestore` being installed on host | `backend/src/lib/hotel.backup.js` |
| 29 | `start-all.sh` says frontend on port 3000 but it's actually 3034 | `start-all.sh` |

---

## 🔧 Technical Debt & Issues

### Architecture
| # | Issue | Detail |
|---|---|---|
| 1 | Two email systems | Legacy `configs/send.mail.js` (SendGrid-only) and new `lib/mailer.js` (multi-transport). Some code uses old, some uses new. |
| 2 | Two auth systems in admin panel | Hotel admin uses `ApiService` with refresh token logic + `BEACH-RESORT-*` localStorage keys. Super-admin uses raw `axios` + `superadmin_*` keys. |
| 3 | Super-admin routes lack route guards | Each page manually checks `superadmin_token` in localStorage and redirects on 401 — no `PrivateRoute` wrapper. |
| 4 | No TypeScript anywhere | Entire codebase (backend, admin-panel, frontend, worker) is plain JavaScript/JSX. |
| 5 | No error boundaries in React apps | Uncaught React errors will crash the entire app (white screen). |
| 6 | No frontend tests | Jest configured but no test files for admin-panel or frontend. Backend has some test scripts. |
| 7 | localStorage JWT (XSS-vulnerable) | Both frontends store tokens in localStorage instead of httpOnly cookies. |
| 8 | `redux-persist` whitelist is empty in both frontends | PersistGate wrapper is doing nothing — no state survives page refresh. |
| 9 | Inconsistent table implementations | Some pages use Ant Design `Table`, others use custom `<table>` elements. |
| 10 | Multi-tenancy partially implemented in frontend | `HotelLogo` reads hotel slug from URL and fetches branding, but rest of frontend doesn't pass hotel context to API calls. |
| 11 | Mongoose version mismatch | Backend uses Mongoose 6.6, worker uses Mongoose 8.6. |
| 12 | No API layer abstraction in frontends | Components directly call API endpoints — no service layer. |

### Dead / Unused Code
| # | File | Notes |
|---|---|---|
| 1 | `admin-panel/src/components/dashboard/StatCard.jsx` | Legacy — Dashboard.jsx defines its own inline StatCard |
| 2 | `admin-panel/src/components/dashboard/RoomCard.jsx` | Legacy — not used in redesigned Dashboard |
| 3 | `admin-panel/src/components/dashboard/UsersCard.jsx` | Legacy — not used in redesigned Dashboard |
| 4 | `admin-panel/src/components/dashboard/BookingCard.jsx` | Legacy — not used in redesigned Dashboard |
| 5 | `admin-panel/src/components/shared/QueryOptions.jsx` | Not used in any redesigned list page |
| 6 | `admin-panel/src/components/shared/RoomStatusUpdateModal.jsx` | Replaced by inline StatusPill in Orders.jsx |
| 7 | `admin-panel/src/hooks/useScreenSize.jsx` | Not imported anywhere |
| 8 | `admin-panel/src/utils/arrayToCommaSeparatedText.js` | Not imported anywhere |
| 9 | `admin-panel/src/components/shared/HotelLogo.jsx` | Not used in Main.jsx header (uses static logo.svg) |
| 10 | `frontend/data/rooms.js` | 13 hardcoded rooms in Contentful format — dead code |
| 11 | `frontend/data/service.js` | Lorem ipsum service descriptions — dead code |

### Unreachable Features
| # | Feature | Detail |
|---|---|---|
| 1 | `BookingSitePreview` / `Channels` tab | Component exists but not in sidebar menu — users can't navigate to OTA channel management |
| 2 | `HotelSettings` tab | Component exists but not in sidebar menu — users can't access hotel settings |
| 3 | `/main/hotel-settings` route | Referenced by `HotelChip` component but not defined in `App.js` |

---

## 💡 Nice-to-Haves

### Developer Experience
- [ ] Migrate to TypeScript across all 4 services
- [ ] Add React Error Boundaries to both frontends
- [ ] Add frontend tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Add CI/CD pipeline
- [ ] Switch from localStorage JWT to httpOnly cookies for XSS protection
- [ ] Create shared API service layer in frontends
- [ ] Upgrade backend Mongoose from 6.x to 8.x (match worker)
- [ ] Remove duplicate body parsing in Express app
- [ ] Consolidate to single email system (remove legacy `send.mail.js`)
- [ ] Add `await` to `connectDatabase()` call in app startup
- [ ] Add retry logic to `calendar.sync.client.js`

### Code Quality
- [ ] Extract file-cleanup logic in room controllers to helper function
- [ ] Refactor dashboard stats to use `countDocuments()` or aggregation pipeline
- [ ] Unify `createRoom` and `editRoomByAdmin` validation logic
- [ ] Refactor `updatedBookingOrderByAdmin` switch into state machine helper
- [ ] Fix `review.modal.js` → `review.model.js` filename
- [ ] Remove all dead/unused components and utilities
- [ ] Standardize table implementations (all Ant Design Table or all custom)
- [ ] Add input validation library (Joi or Zod)

### Features
- [ ] Month-view calendar page (replacing 8-day TapeChart)
- [ ] Conflict resolution UI for double-bookings
- [ ] Staff-specific dashboard (limited view)
- [ ] Reports & analytics (occupancy %, ADR, RevPAR)
- [ ] Audit log UI (both platform and hotel level)
- [ ] i18n / multi-language support
- [ ] Dark mode
- [ ] Mobile-responsive admin panel
- [ ] PWA support for booking site
- [ ] Email templates (currently plain text)
- [ ] PDF invoice generation
- [ ] Bulk room operations (e.g., mark multiple rooms out-of-service)
- [ ] Guest communication (pre-arrival emails, post-stay review requests)
- [ ] Rate plan comparison tool
- [ ] Export data to CSV/Excel

### Infrastructure
- [ ] Docker Compose for local development (MongoDB + Redis + all 4 services)
- [ ] Schema migration runner (loop through all hotels, apply migration, record version)
- [ ] Connection pool monitoring and alerting
- [ ] LRU eviction for tenant connection cache at scale
- [ ] Automated backups with retention policy
- [ ] Health check endpoints with dependency status
- [ ] Rate limiting per tenant (not just global)
- [ ] Request ID tracking across services

---

## 💻 Local Setup Guide

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`brew services start mongodb-community` or Docker)
- **Redis** running locally (`brew install redis && brew services start redis` or `docker run -d -p 6379:6379 redis:7-alpine`)
- **Caddy** (optional, for subdomain routing): `brew install caddy`

### Install
```bash
# from repo root
cd backend && npm install && cd ..
cd admin-panel && npm install && cd ..
cd frontend && npm install && cd ..
cd calendar-sync-worker && npm install && cd ..
```

### Env Files
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
MAIL_TRANSPORT=console           # console (dev) | resend | sendgrid
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

**`admin-panel/.env`** and **`frontend/.env.local`** — see existing files.

---

## 🚀 Day-to-Day Commands

### All-in-One (Recommended)
```bash
./start-all.sh
```
Press `Ctrl+C` to stop all 4 services.

### Manual (Separate Terminals)
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

### With Subdomain Routing (Production-like)
```bash
caddy run    # picks up Caddyfile from repo root
```
Then access at `http://admin.localhost`, `http://<slug>.admin.localhost`, etc.

---

## 🌱 Bootstrapping & First Run

```bash
# 1. Seed the platform DB with default hotel + super-admin user
cd backend && node scripts/bootstrap.platform.js

# Output:
#   created default hotel: <id>
#   created superadmin: <id>
#   ✅ platform bootstrap complete
```

The bootstrap is **idempotent** — safe to re-run.

After bootstrap:
1. Open http://localhost:3001/superadmin/login
2. Sign in with `k.velkov@msve.io` / `admin123`
3. Click **"Create new hotel"** → enter name + manager email → check manager's inbox for magic link

To headlessly create hotels:
```bash
node scripts/create.hotel.js "Acme Boutique Hotel" admin@acme.com "Acme Manager"
```

---

## 📧 Email Delivery

Configured via `MAIL_TRANSPORT` env in `backend/.env`:

| Transport | Behaviour | When to use |
|---|---|---|
| `console` (default) | Logs email to backend stdout, never sends | dev — copy magic link from terminal |
| `resend` | Sends via Resend API (`RESEND_API_KEY` required) | recommended for prod (free 3000/mo, 100/day) |
| `sendgrid` | Sends via SendGrid (`SENDGRID_API_KEY` required) | if you already have a SG account (100/day free) |

Resend's free `onboarding@resend.dev` sender only delivers to your own account email. To send to anyone, **verify a domain** in the Resend dashboard.

---

## ⚙️ Operational Notes

### Adding a new model that lives in every hotel's DB
1. Create the schema in `backend/src/models/<thing>.model.js` exporting `{ schema, modelName, register }`.
2. Add it to `HOTEL_MODELS` in `backend/src/lib/tenant.models.js`.
3. Done — every existing and future hotel's connection will register it on next use.

### Schema migrations across all hotels
No migration runner yet. For now, write a script that:
1. Lists all hotels via `platform.hotels.find({})`
2. Loops through them, opens a connection to each, and applies the migration
3. Records the schema version in `platform.hotels.schemaVersion`

### Connection cap
Each Mongoose connection has 5 sockets by default. At 200 hotels = ~1000 sockets. MongoDB Atlas M10+ handles this trivially; self-hosted defaults are 65k. Add LRU eviction to cache when crossing ~100 hotels.

---

## 🗺️ Roadmap (from Plan Document)

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

### 🚧 Next Up
- Combined login experience: **booking-site preview tab** inside hotel admin panel
- Force-change password on super-admin first login
- Onboarding wizard for hotel managers (8 steps from plan doc)
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

## ❓ Open Questions

1. Billing model — per-hotel flat fee, % of bookings, or tiered by room count?
2. Channel sync as a paid add-on or included in base?
3. Single payment processor (Stripe Connect) or each hotel uses their own merchant?
4. PMS imports — do hotels need to migrate existing reservations from Cloudbeds/Mews on onboarding?
5. Languages — English only at launch, or i18n from day one?
6. Aggregator choice — Cloudbeds (MyAllocator), SiteMinder, STAAH, or eviivo?
7. Cover Chinese OTAs (Trip.com / Ctrip / Yanolja) at launch or wait for APAC expansion?
8. Where do `sync_runs` live — per-hotel DB (clean) or `platform_telemetry` DB (easier monitoring)?

---

## 📚 Glossary

- **Tenant** — one hotel.
- **DB-per-tenant** — chosen architecture: each hotel has its own MongoDB database.
- **Connection cache** — in-memory map of `dbName → mongoose connection`, populated on demand.
- **OTA** — Online Travel Agency (Booking.com, Expedia, Airbnb…).
- **Channel manager** — service that keeps inventory and rates in sync across OTAs and the direct site.
- **Aggregator** — third-party channel manager whose API we integrate once to reach many OTAs (Cloudbeds, SiteMinder, STAAH).
- **iCal** — calendar exchange format (`.ics`); the lowest-common-denominator OTA integration.
- **EQC** — Expedia QuickConnect, Expedia's partner API.
- **Connectivity API** — Booking.com's partner API.
- **TripConnect** — Tripadvisor's booking integration.
- **Hotel Center** — Google's hotel listing feed (Hotel Ads + free booking links).
- **ADR / RevPAR** — Average Daily Rate / Revenue Per Available Room.
- **PMS** — Property Management System.
- **Stop-sell** — closing inventory on a channel when stock runs low.
- **Echo loop** — when our outbound `.ics` is read back through an OTA's iCal feed, double-counting our own bookings. Prevented by UID prefix.

---

## 📜 License

MIT — original work by [Md. Samiur Rahman (Mukul)](https://github.com/SamiurRahmanMukul). Multi-tenant evolution, super-admin platform, calendar sync, and magic-link auth: this fork.

---

## 🙏 Acknowledgments

- Original codebase by **Md. Samiur Rahman (Mukul)** — [Hotel-Room-Booking-System](https://github.com/SamiurRahmanMukul/Hotel-Room-Booking-System)
- Multi-tenant evolution, super-admin platform, calendar sync, and magic-link auth: this fork.

---

*Audit generated 2026-06-25 — comprehensive review of all 4 services, ~150+ files examined.*
