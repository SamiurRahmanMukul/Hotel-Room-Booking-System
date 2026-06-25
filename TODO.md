# 🏨 Hotel Room Booking System — TODO List

**Generated:** 2026-06-25
**Source:** Full application audit (see `app-readme.md`)

---

## 🔴 CRITICAL BUGS (Must Fix)

- [x] **BUG-001:** `isBlocked` middleware checks `user.role !== 'blocked'` instead of `user.status !== 'blocked'` — blocked users are never actually blocked
  - File: `backend/src/middleware/app.authentication.js`
  - Fix: Change `user.role !== 'blocked'` to `user.status !== 'blocked'` ✅ **FIXED 2026-06-25**

---

## 🟡 IMPORTANT BUGS (Should Fix)

- [x] **BUG-002:** Duplicate body parsing — `bodyParser.json()` and `express.json()` both called
  - File: `backend/src/app/index.js`
  - Fix: Remove one pair (keep `express.json()` / `express.urlencoded()`) ✅ **FIXED 2026-06-25**

- [x] **BUG-003:** `connectDatabase()` called without `await` — app starts before DB connection
  - File: `backend/src/app/index.js`
  - Fix: Wrap in async IIFE with `await` ✅ **FIXED 2026-06-25**

- [x] **BUG-004:** 20+ separate `Model.find()` calls for dashboard stats — use `countDocuments()` or aggregation
  - File: `backend/src/controllers/apps.controllers.js`
  - Fix: Replace with `Model.countDocuments()` in parallel via `Promise.all` ✅ **FIXED 2026-06-25**

- [x] **BUG-005:** `if (!totalUsers)` check never true — `find()` returns `[]`, not `null`
  - File: `backend/src/controllers/apps.controllers.js`
  - Fix: Removed unreachable error block (countDocuments returns 0, not null) ✅ **FIXED 2026-06-25**

- [x] **BUG-006:** `PublicRoute` redirects to `/dashboard/main` which doesn't exist
  - File: `admin-panel/src/components/middleware/PublicRoute.jsx`
  - Fix: Change to `/main/dashboard` ✅ **FIXED 2026-06-25**

- [x] **BUG-007:** `RoomEdit` missing "family" room type in Select options
  - File: `admin-panel/src/components/rooms/RoomEdit.jsx`
  - Fix: Add `{ label: 'Family', value: 'family' }` to Select options ✅ **FIXED 2026-06-25**

- [x] **BUG-008:** `RoomDetails` shows `$` for price but system uses `€`
  - File: `admin-panel/src/components/rooms/RoomDetails.jsx`
  - Fix: Change `$` to `€` ✅ **FIXED 2026-06-25**

- [x] **BUG-009:** `TapeChart` booking matching logic may be broken — uses `booking_dates[0]`/`[1]` as start/end but data model uses array of date strings
  - File: `admin-panel/src/components/tabs/TapeChart.jsx`
  - Fix: Rewrite matching logic to check if any date in `booking_dates` array matches the day column ✅ **FIXED 2026-06-25**

- [x] **BUG-010:** `HotelChip` navigates to `/main/hotel-settings` but route not defined in App.js
  - File: `admin-panel/src/components/shared/HotelChip.jsx`
  - Fix: Changed navigation target to `/main/profile` (hotel settings not wired yet) ✅ **FIXED 2026-06-25**

- [x] **BUG-011:** `create.hotel.js` references `result.admin.tempPassword` that doesn't exist
  - File: `backend/scripts/create.hotel.js`
  - Fix: Replaced with magic link URL (password is set via magic link, not returned) ✅ **FIXED 2026-06-25**

- [x] **BUG-012:** `review.modal.js` filename typo — "modal" should be "model"
  - File: `backend/src/models/review.modal.js` → `review.model.js`
  - Fix: Renamed file and updated imports in `review.controllers.js` and `tenant.models.js` ✅ **FIXED 2026-06-25**

- [x] **BUG-013:** `getRoomByIdOrSlugName` response says "User information get successful"
  - File: `backend/src/controllers/room.controllers.js`
  - Fix: Changed message to "Room information get successful" ✅ **FIXED 2026-06-25**

- [x] **BUG-014:** Frontend room filter — breakfast/pets filters overwrite each other
  - File: `frontend/components/rooms/RoomsFilter.jsx`
  - Fix: Combined into single `useEffect` that applies both filters cumulatively ✅ **FIXED 2026-06-25**

- [x] **BUG-015:** `apiLimiter` comment says "10 login requests" but code has `max: 5`
  - File: `backend/src/middleware/access.limiter.js`
  - Fix: Aligned comment to say "5 login requests" ✅ **FIXED 2026-06-25**

- [x] **BUG-016:** `forgotPassword` uses legacy `sendEmail` instead of new `mailer.js`
  - File: `backend/src/controllers/auth.controllers.js`
  - Fix: Switched both `forgotPassword` and `sendEmailVerificationLink` to `sendMail` from `lib/mailer.js` with proper error rollback ✅ **FIXED 2026-06-25**

- [x] **BUG-017:** No cancellation detection in iCal sync
  - File: `calendar-sync-worker/src/jobs/inboundSync.js`
  - Fix: Added cancellation detection — compares previous EventRaw IDs with current iCal feed, marks removed events as cancelled and releases blocked units ✅ **FIXED 2026-06-25**

- [x] **BUG-018:** No conflict resolution logic — `Availability.conflict` field never set
  - File: `calendar-sync-worker/src/jobs/inboundSync.js`
  - Fix: Sets `conflict=true` and `conflictDetails` when multiple sources block the same date ✅ **FIXED 2026-06-25**

- [x] **BUG-019:** No authentication on worker API
  - File: `calendar-sync-worker/src/index.js`
  - Fix: Added shared-secret Bearer token auth middleware (`WORKER_API_SECRET` env var) on mutating endpoints; backend's `calendar.sync.client.js` now sends the token ✅ **FIXED 2026-06-25**

- [x] **BUG-020:** `start-all.sh` says frontend on port 3000 but it's actually 3034
  - File: `start-all.sh`
  - Fix: Updated echo message to "Port 3034" ✅ **FIXED 2026-06-25**

---

## 🔧 TECHNICAL DEBT (Should Address)

- [x] **DEBT-001:** Consolidate two email systems — remove legacy `configs/send.mail.js`, use only `lib/mailer.js`
  - Removed `send.mail.js` (no remaining imports). All email now flows through `lib/mailer.js`. ✅ **FIXED 2026-06-25**

- [x] **DEBT-002:** Unify two auth systems in admin panel — hotel admin and super-admin should use same pattern
  - Created shared `SuperadminApi` axios client with token interceptor + auto-redirect on 401. All 4 superadmin pages now use it instead of raw axios. ✅ **FIXED 2026-06-25**

- [x] **DEBT-003:** Add route guards to super-admin routes (currently each page self-checks auth)
  - Created `SuperadminPrivateRoute` component. All 5 superadmin routes in App.js now use it. ✅ **FIXED 2026-06-25**

- [ ] **DEBT-004:** Migrate to TypeScript across all 4 services

- [x] **DEBT-005:** Add React Error Boundaries to both frontends
  - Created `ErrorBoundary` component in both admin-panel and frontend. Wrapped in index.js and _app.js respectively. ✅ **FIXED 2026-06-25**

- [ ] **DEBT-006:** Switch from localStorage JWT to httpOnly cookies for XSS protection
- [ ] **DEBT-007:** Upgrade backend Mongoose from 6.x to 8.x (match worker)

- [x] **DEBT-008:** Add `await` to `connectDatabase()` call in app startup
  - Wrapped in async IIFE. ✅ **FIXED 2026-06-25** (done as part of BUG-003)

- [x] **DEBT-009:** Add retry logic to `calendar.sync.client.js` (currently fire-and-forget, failures silently logged)
  - Added 3 retries with exponential backoff, non-retryable status code detection (400/401/403), and proper error logging. ✅ **FIXED 2026-06-25**

- [x] **DEBT-010:** Extract file-cleanup logic in room controllers to shared helper function
  - Created `lib/cleanup.files.js` with `cleanupUploadedFiles(req)`. Replaced 22 duplicate blocks in `room.controllers.js`. ✅ **FIXED 2026-06-25**

- [ ] **DEBT-011:** Unify `createRoom` and `editRoomByAdmin` validation logic
  - Both now use `cleanupUploadedFiles(req)` helper. Full unification into a shared validation function is a larger refactor for later.

- [x] **DEBT-012:** Refactor `updatedBookingOrderByAdmin` switch statement into state machine helper
  - Replaced 60-line switch with `BOOKING_TRANSITIONS` state machine object. Each transition defines `from`, `validate`, and `onSuccess`. ✅ **FIXED 2026-06-25**

- [x] **DEBT-013:** Standardize table implementations — all Ant Design Table or all custom `<table>`
  - Created shared `DataTable.jsx` with `CounterChip`, `StatusPill`, `FilterBar`, `SearchInput`, `SortSelect`, `RowsPerPageSelect`, `DataTable`, `TableContainer`. Refactored `RoomsList.jsx` and `UsersList.jsx` to use them. `Orders.jsx` kept custom due to inline editing complexity. ✅ **FIXED 2026-06-25**

- [x] **DEBT-014:** Create shared API service layer in frontends (no direct axios calls in components)
  - Frontend already uses `ApiService` for client-side calls. SSR pages correctly use raw axios for `getServerSideProps`. Admin panel has `ApiService` + `SuperadminApi`. No further changes needed. ✅ **VERIFIED 2026-06-25**

- [x] **DEBT-015:** Add input validation library (Joi or Zod) to backend
  - Installed Zod. Created `middleware/validate.js` and `lib/validation.schemas.js` with schemas for auth (login, register, changePassword, forgotPassword, resetPassword), rooms (createRoom), bookings (placeBooking, updateBookingStatus), users (updateUser), and hotel settings. Wired into auth and booking routes. ✅ **FIXED 2026-06-25**

- [x] **DEBT-016:** Fix `redux-persist` whitelist — either use it or remove PersistGate wrapper
  - Changed `whitelist: []` to `whitelist: ['app']` in both admin-panel and frontend stores. Theme/timeZone now persist across refreshes. ✅ **FIXED 2026-06-25**

- [ ] **DEBT-017:** Add frontend tests (Jest + React Testing Library)
- [ ] **DEBT-018:** Add E2E tests (Playwright or Cypress)
- [ ] **DEBT-019:** Add CI/CD pipeline
- [ ] **DEBT-020:** Add schema migration runner (loop through all hotels, apply migration, record version)

---

## 🗑️ DEAD CODE (Remove)

- [x] **DEAD-001:** `admin-panel/src/components/dashboard/StatCard.jsx` — unused (Dashboard defines inline) ✅ **REMOVED 2026-06-25**
- [x] **DEAD-002:** `admin-panel/src/components/dashboard/RoomCard.jsx` — unused legacy ✅ **REMOVED 2026-06-25**
- [x] **DEAD-003:** `admin-panel/src/components/dashboard/UsersCard.jsx` — unused legacy ✅ **REMOVED 2026-06-25**
- [x] **DEAD-004:** `admin-panel/src/components/dashboard/BookingCard.jsx` — unused legacy ✅ **REMOVED 2026-06-25**
- [x] **DEAD-005:** `admin-panel/src/components/shared/QueryOptions.jsx` — unused ✅ **REMOVED 2026-06-25**
- [x] **DEAD-006:** `admin-panel/src/components/shared/RoomStatusUpdateModal.jsx` — replaced by inline StatusPill ✅ **REMOVED 2026-06-25**
- [x] **DEAD-007:** `admin-panel/src/hooks/useScreenSize.jsx` — not imported anywhere ✅ **REMOVED 2026-06-25**
- [x] **DEAD-008:** `admin-panel/src/utils/arrayToCommaSeparatedText.js` — not imported anywhere ✅ **REMOVED 2026-06-25**
- [x] **DEAD-009:** `admin-panel/src/components/shared/HotelLogo.jsx` — not used in Main.jsx header ✅ **REMOVED 2026-06-25**
- [x] **DEAD-010:** `frontend/data/rooms.js` — 13 hardcoded rooms in Contentful format ✅ **REMOVED 2026-06-25**
- [x] **DEAD-011:** `frontend/data/service.js` — lorem ipsum service descriptions ✅ **REMOVED 2026-06-25**

---

## 🔗 UNREACHABLE FEATURES (Wire Up)

- [x] **WIRE-001:** Add `BookingSitePreview` / `Channels` tab to sidebar menu in Main.jsx ✅ **WIRED 2026-06-25**
- [x] **WIRE-002:** Add `HotelSettings` tab to sidebar menu in Main.jsx ✅ **WIRED 2026-06-25**
- [x] **WIRE-003:** Add `/main/hotel-settings` route in App.js (or fix HotelChip navigation) ✅ **WIRED 2026-06-25**
  - Route already handled by `/main/:tab` dynamic param. HotelChip now navigates to `/main/hotel-settings`.

---

## 🚧 MISSING FEATURES (Phase 3 — Onboarding Wizard MVP)

- [ ] **WIZ-001:** Build stepper UI component with save-on-Next and resume-from-email
- [ ] **WIZ-002:** Step 1 — Hotel basics (name, slug, country, city, timezone, currency, contact)
- [ ] **WIZ-003:** Step 2 — Branding (logo, hero image, primary/secondary color, tagline, font)
- [ ] **WIZ-004:** Step 3 — Property details (address, floors, amenities, languages, photos)
- [ ] **WIZ-005:** Step 8 — Review & Launch (read-only summary + "Publish" button)
- [ ] **WIZ-006:** Themed public booking site reading `hotel_settings.branding` (currently only HotelLogo does this)
- [ ] **WIZ-007:** End-to-end demo flow: super-admin creates hotel → manager publishes → guest books

---

## 🚧 MISSING FEATURES (Phase 4 — Wizard Depth)

- [ ] **WIZ-008:** Step 4 — Room types (name, capacity, bed config, base price, photos, # physical rooms)
- [ ] **WIZ-009:** Step 5 — Pricing & rate plans with one-click templates
- [ ] **WIZ-010:** Step 6 — Channels (wire existing channel adapter code into wizard)
- [ ] **WIZ-011:** Step 7 — Policies (check-in/out times, cancellation, child/pet/smoking, payment methods)

---

## 🚧 MISSING FEATURES (Phase 5 — Day-2 Features)

- [ ] **DAY2-001:** Month-view calendar page with conflict UI (replacing 8-day TapeChart)
- [ ] **DAY2-002:** Staff management UI (staff role exists in schema, no staff-specific UI)
- [ ] **DAY2-003:** Reports & analytics (occupancy %, ADR, RevPAR per hotel)
- [ ] **DAY2-004:** Per-hotel branding feed-through to public booking site
- [ ] **DAY2-005:** Force-change password on super-admin first login (flag exists, not enforced)

---

## 🚧 MISSING FEATURES (Phase 6 — More Channel Adapters)

- [ ] **CHAN-001:** Google Hotels adapter (XML feed)
- [ ] **CHAN-002:** Aggregator adapter (Cloudbeds/MyAllocator/SiteMinder/STAAH)
- [ ] **CHAN-003:** Booking.com Connectivity API adapter
- [ ] **CHAN-004:** Expedia EQC adapter
- [ ] **CHAN-005:** Airbnb API adapter
- [ ] **CHAN-006:** Tripadvisor TripConnect adapter
- [ ] **CHAN-007:** Webhook receiver for native push from OTAs

---

## 🚧 MISSING FEATURES (Phase 7 — Polish & Native APIs)

- [ ] **POL-001:** Booking.com Connectivity certification
- [ ] **POL-002:** Expedia EQC certification
- [ ] **POL-003:** Custom-domain CNAME flow + per-tenant TLS
- [ ] **POL-004:** Cross-tenant analytics for super-admin
- [ ] **POL-005:** Stripe billing integration
- [ ] **POL-006:** Audit log UI (both platform and hotel level)
- [ ] **POL-007:** 2FA for super-admin
- [ ] **POL-008:** i18n / multi-language support

---

## 💡 NICE-TO-HAVES

### Developer Experience
- [ ] **NICE-001:** Docker Compose for local development (MongoDB + Redis + all 4 services)
- [ ] **NICE-002:** Health check endpoints with dependency status
- [ ] **NICE-003:** Request ID tracking across services
- [ ] **NICE-004:** Rate limiting per tenant (not just global)
- [ ] **NICE-005:** Connection pool monitoring and alerting
- [ ] **NICE-006:** LRU eviction for tenant connection cache at scale
- [ ] **NICE-007:** Automated backups with retention policy

### Features
- [ ] **NICE-008:** Dark mode for admin panel and booking site
- [ ] **NICE-009:** Mobile-responsive admin panel
- [ ] **NICE-010:** PWA support for booking site
- [ ] **NICE-011:** Email templates (currently plain text)
- [ ] **NICE-012:** PDF invoice generation
- [ ] **NICE-013:** Bulk room operations (e.g., mark multiple rooms out-of-service)
- [ ] **NICE-014:** Guest communication (pre-arrival emails, post-stay review requests)
- [ ] **NICE-015:** Rate plan comparison tool
- [ ] **NICE-016:** Export data to CSV/Excel
- [ ] **NICE-017:** Conflict resolution UI for double-bookings
- [ ] **NICE-018:** Staff-specific dashboard (limited view)

---

## 📊 SUMMARY COUNTS

| Category | Count |
|---|---|
| 🔴 Critical Bugs | 1 |
| 🟡 Important Bugs | 19 |
| 🔧 Technical Debt | 20 |
| 🗑️ Dead Code | 11 |
| 🔗 Unreachable Features | 3 |
| 🚧 Missing Features | 28 |
| 💡 Nice-to-Haves | 18 |
| **TOTAL** | **100** |
