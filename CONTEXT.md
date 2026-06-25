# Domain context — Hotel Booking Platform

Domain language for the multi-tenant hotel booking platform. Architecture vocabulary
(module, interface, seam, deep/shallow, leverage, locality) lives in the review skill,
not here. This file is the source of truth for *domain* terms and decisions.

## Terms

- **Tenant** — one hotel. Each tenant has its own MongoDB database (`hotel_<slug>`).
- **Room type** — a sellable, *counted* inventory unit (e.g. "Standard Double × 4"),
  **defined by each hotel** (name, capacity, bed config, base price, `totalUnits`). Each
  hotel has a different set; there is no fixed platform-wide list. **This is the canonical
  unit availability is tracked against** — not the individual physical room. A hotel with
  unique rooms is just a room type whose `totalUnits = 1`. The legacy
  `room.room_type` enum (`single/couple/family/presidential`) is NOT the model — it is a
  migration bridge for existing rooms only (see Decisions). Decided 2026-06-25.
- **Physical room** — a specific room (#207). Assignment of a guest to a physical room is
  a separate, later concern (near check-in), *not* part of availability or selling.
- **Floor** — a hotel-level, **named and ordered** building level, defined once per hotel and
  reused across all room types. Has a free-text `label` (hotels name levels differently —
  "Ground" vs "1", "Mezzanine", "Penthouse", "B1"), an `order` (top-to-bottom, independent of
  the label), and a `numberPrefix` that drives auto room numbers (default derived from the
  label, editable: "Ground"→`G`→G01; "1"→`1`→101; "Penthouse"→`P`→P01).
- **Availability cell** — `(roomType, date)` → `{ totalUnits, soldUnits, blockedUnits, bySource }`.
  The consolidated answer to "how many units of this room type are sellable on this date,
  and who is holding the rest?"
- **Source** — anything that holds inventory in a cell: `direct` (our booking site),
  an OTA channel (Airbnb, Booking.com, Vrbo…), or `manual` (maintenance block).
  Tracked in `bySource`.
- **Firm hold** — a synchronous, transactional claim on a unit (a direct booking). Must
  never oversell. Implemented as an atomic guarded decrement (`soldUnits < totalUnits`).
- **Soft block** — an eventual, poll-derived block from an OTA iCal feed. Idempotent,
  keyed on `(channelId, externalId)`. May lag reality by the poll interval.
- **Echo** — our own outbound `.ics` read back through an OTA's feed. Prevented by a
  `bookingsystem-` UID prefix on outbound events.
- **OTA** — Online Travel Agency (Booking.com, Expedia, Airbnb…).

## Decisions

- **2026-06-25 — Price list: per-date price grid + paid services (apaleo Rates, lite).**
  Top-level **Price list** menu item with two tabs. **Prices** = a room-type × date grid
  (`Prices` model: (roomTypeId, date) → amount; `GET/POST /api/v1/prices`); empty cells fall
  back to the room type's `basePrice`. **Services** = paid extras CRUD (`Services` model:
  name/code/type/price/vatPct/deliveredTo; `/api/v1/services`). Bookings snapshot their total
  at creation from the grid (sum of per-date override else basePrice → `payment.amount`), so
  the reservation drawer shows a real total.
  Extended 2026-06-25: a third **Policies** tab (`Policies` model + `/api/v1/policies`) covers
  cancellation & no-show policies (code, EN/BG translations, cancellation period
  months/days/hours + reference point after-booking/before-arrival, fixed and/or percent fee,
  VAT type). The **Service** form gained apaleo fields (EN/BG translations, availability
  when/offered-days/next-day, per-room vs per-guest pricing). Still deferred: full rate plans
  (derived/promo), age categories, VAT-type registry, accounting sub-accounts, distribution.

- **2026-06-25 — Unit attributes (apaleo): reusable tags attached to rooms many-to-many.**
  A hotel defines attributes once (Balcony, Street view, King bed…) under **Hotel & units
  setup → Attributes** (`Attributes` model + `/api/v1/attributes` CRUD). Each `room` holds an
  `attributes: [ObjectId ref Attributes]` array; set from the room's **Settings** modal
  (multi-select) via `PATCH /rooms/:id/settings { attributes }`. Deleting an attribute detaches
  it from all rooms ($pull). The rooms list returns populated `attributes: [{ id, name }]`.

- **2026-06-25 — Room Types form: edit-only, translations + rank, quantity-driven units;
  floors moved to Rooms.** The Room Types table row has only an **Edit** button (delete lives
  in the modal). The modal mirrors apaleo's unit-group form: **Translations** (English name*/
  description*, Bulgarian name/description → `translations.bg`), **Inventory attributes**
  (Type/category*, Max persons = capacity*, Rank), and a single **Total units** number that
  generates that many unassigned rooms. Price (rate plans later) and bed config (per physical
  room) were removed from this form. Floors + numbers are assigned in **Hotel Rooms** by
  selecting rooms → "Assign floor" (`POST /rooms/assign-floor`, auto-numbers 1→100/101,
  Ground→G01). This replaces the apaleo per-type bulk naming-rule from earlier the same day.

- **2026-06-25 — New-hotel onboarding is gated on capturing the property first.**
  Journey: super-admin provisions the hotel (DB + admin user + magic link) → admin logs in,
  changes password → lands on the Dashboard whose first task is **Create hotel property**
  (apaleo-style form: General / Location / Company, stored in `hotel_settings` under
  `name`, `description`, `location.*`, `company.*`). Until every required property field is
  filled (`GET /api/v1/onboarding/status` → `propertyComplete`), the sidebar shows only
  Property / Dashboard / Profile / Logout and operational tabs redirect to the dashboard.
  Once complete, the rest unlocks behind a **"Hotel & units setup"** sidebar group
  (Hotel specifics / Room Types / Rooms) + a Dashboard button. The Property form notifies
  the shell on save so the gate lifts immediately.

- **2026-06-25 — Inventory realigned to the apaleo PMS model (supersedes the earlier
  quantity-then-assign capture flow).** Room Type = apaleo *unit group*; Room = apaleo *unit*.
  - Room Type carries `category` (BedRoom/MeetingRoom/EventSpace/ParkingLot — only BedRoom
    counts toward occupancy), `capacity` (= maxPersons), `basePrice`, `bedConfig`. `totalUnits`
    (= memberCount) is ALWAYS derived from its rooms.
  - Rooms are created **only** via a bulk naming rule (apaleo style): `Room Types → Add units`
    → `POST /api/v1/room-types/:id/units/bulk { floor, prefix, startNumber, count, pad }`
    (Floor 1, start 101, count 10 → 101…110; Ground, prefix G, pad 2 → G01…G05). No manual
    one-off "Add room" form, no blank/unassigned rooms.
  - Room number (`room_name`) is optional with a partial unique index (assigned numbers unique,
    empties exempt). Old `room_name_1`/`room_slug_1` unique indexes were dropped.
  - Rooms carry an apaleo housekeeping **`condition`** (Clean/Dirty/Inspected/OutOfService),
    separate from booking occupancy. Hotel Rooms = list with row checkboxes → bulk delete +
    per-room settings (number/floor/condition). `POST /rooms/bulk-delete`, `PATCH /rooms/:id/settings`.
  - Dead after this: `CreateRoom`/`RoomEdit` (legacy image-heavy forms) and `/create-room` are
    no longer wired into the UI.


- **2026-06-25 — Availability is tracked per counted room type, not per physical room.**
  OTAs sell counted room-types ("1 of 4 left"), never specific rooms. Direct bookings
  decrement the same pool. Requires introducing the `room_types` collection (currently
  TBD). Physical-room assignment is deferred to a later assignment concern. This resolves
  the `roomTypeId == room_id` collision at `backend/src/lib/calendar.sync.client.js:21`.

- **2026-06-25 — One `RoomCalendar` module over one `availability` collection.**
  Availability lives in a single collection per hotel DB. A shared `RoomCalendar` module
  (alongside the shared Tenancy module) is the only reader/writer. Both backend and worker
  import it. The firm hold is an in-process atomic guarded decrement in the backend (never
  an HTTP call into the worker). Consequences: `BookingClaims` is absorbed into the guarded
  decrement; the outbound `.ics` is derived from `availability` (emit a blocked date only
  when a room type is sold out), not from `EventRaw`; the fire-and-forget direct-booking
  push is deleted, not made durable.

- **2026-06-25 — Room types are hotel-authored; bookings target a room type.**
  Each hotel defines its own room types (onboarding wizard Step 4 / a room-types CRUD).
  Each physical `room` references a `roomTypeId`. `totalUnits` defaults to the count of
  physical rooms mapped to the type but can be set directly (e.g. OTA-only listings).
  Forced consequence: a guest books a *room type*, not a specific room — `firmHold`
  decrements the type pool, and the physical-room field on a booking becomes a nullable
  *assignment* set near check-in (the deferred assignment concern). The four-value
  `room.room_type` enum is used ONLY for a one-time migration of existing rooms into
  provisional types so current data keeps working; new hotels never see it.

- **2026-06-25 — One shared tenant connection cache (`shared/tenant.connection.cache.js`).**
  The per-hotel Mongoose connection lifecycle (open / reuse / idle-evict / pool) lives in a
  single dependency-injected factory. Backend and the calendar-sync worker each build a cache
  from it via thin adapters, instead of two copy-pasted files. `mongoose` is INJECTED (never
  required by the shared file) so the backend (Mongoose 6) and worker (Mongoose 8) share it
  despite the version skew. Deployment: both services must ship the repo-root `shared/` dir.

- **2026-06-25 — Frontend resolves the tenant in one place (`frontend/utils/tenant.js`).**
  The public booking site resolves its hotel slug from the SUBDOMAIN (prod) or an explicit
  `?hotel=` override (dev) → env default — never from a route param (`/rooms/[slug]` uses
  `slug` for the room). `ApiService` attaches `X-Hotel-Slug` to every client call; SSR pages
  use `getHotelSlugFromCtx(ctx)`; `HotelContext`/`useHotel()` fetches the hotel id + branding
  once from `/api/v1/public/branding` (now returns `hotelId`). Components read `useHotel()`
  instead of `NEXT_PUBLIC_DEFAULT_HOTEL_ID`, prop-drilling, or hardcoded fallbacks.

- **2026-06-25 — Room capture: one screen, count-first, optional floor depth.**
  A hotel always creates room **types** first (name, capacity, bed config, base price) — that
  alone makes it sell-ready. Capture is a single card per type with progressive depth, NOT a
  mode toggle:
  1. Type + unit count (e.g. "Double — 30"). Stop here = the fast path.
  2. Optional "Floors" panel: allocate the count across floors → the system AUTO-GENERATES
     numbered physical rooms (`floor×100 + index`, editable, unique per hotel).
  3. Optional per-room edits (rename number, out-of-order, etc.).
  Every type is editable after the basic pass — capture counts fast, add floor detail later.

  Single source of truth for the count: with NO floor detail, `totalUnits` is TYPED and there are
  no physical rooms; once floors are allocated, `totalUnits` is DERIVED = sum of the floor
  allocations (= count of generated rooms) and the typed field goes read-only. The two are never
  independently editable, so there is no "30 vs 28" drift. Marking a room out-of-order is a
  `blockedUnits` block on availability for those dates, NOT a `totalUnits` edit. Physical-room
  assignment on a booking stays the nullable `booking.room_id` set near check-in. (Wizard Step 4.)

  Implementation: Room Types is the capture surface (`/api/v1/room-types` CRUD +
  `POST /room-types/:id/generate-rooms`). Generated physical rooms are LIGHTWEIGHT — just
  `room_name`(number) + `floor` + `roomTypeId` + `room_status`; price/capacity come from the
  type, so the room schema's old per-room required fields (room_type/price/size/description)
  were relaxed to optional. FOLLOW-UP: the public booking site still lists individual rooms —
  with type-driven generation it should list TYPES (type photos/price), and the legacy per-room
  "Add room" form (`CreateRoom`, enum + image-heavy) is now secondary and should be retired.

- **2026-06-25 — Oversell policy at launch: detect and flag only.**
  Cross-channel oversell between polls is unavoidable with iCal. At launch the module sets
  `Availability.conflict = true` and surfaces it for manual resolution by hotel staff.
  Inventory buffer (`hotel_settings.inventoryBuffer`) and auto stop-sell are deferred
  later layers the interface must allow for, but are NOT built at launch.
