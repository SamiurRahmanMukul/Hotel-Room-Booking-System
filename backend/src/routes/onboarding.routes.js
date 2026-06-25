/**
 * Onboarding-related routes (after the manager has logged in).
 * Mounted under /api/v1 so they run inside the tenant context.
 *
 *   GET  /api/v1/onboarding/checklist
 *     → list of todo items with `done` flag and `linkTo` deep-link
 *
 *   POST /api/v1/onboarding/publish
 *     → flips platform.hotels.status from 'draft' to 'active'
 *
 *   GET  /api/v1/hotel-settings        → current settings doc
 *   PATCH /api/v1/hotel-settings       → patch fields (used by Hotel Settings page)
 */

const express = require('express');
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const { getPlatformConnection } = require('../lib/platform.connection');

const router = express.Router();

const SETTINGS_COLLECTION = 'hotel_settings';

async function loadSettings(req) {
  const settings = await req.db.collection(SETTINGS_COLLECTION).findOne({}) || {};
  return settings;
}

// The hotel property is "complete" once all the required Create-Property fields are filled.
// Until then, the admin's only task is to capture the property (gates the rest of the app).
function isPropertyComplete(s) {
  if (!s) return false;
  const loc = s.location || {};
  const co = s.company || {};
  return Boolean(
    s.name && loc.country && loc.addressLine1 && loc.postalCode && loc.city
    && loc.timezone && loc.currency && loc.checkInTime && loc.checkOutTime
    && co.companyName && co.commercialRegisterEntry && co.taxId && co.paymentTerms
  );
}

// Public — anonymous booking site uses this to render logo + name
router.get('/public/branding', async (req, res) => {
  try {
    const s = await loadSettings(req);
    res.json({
      hotelId: req.hotel?._id,
      slug: req.hotel?.slug,
      name: s?.name || req.hotel?.name,
      branding: s?.branding || {},
      tagline: s?.tagline || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', isAuthenticatedUser, isBlocked, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      mustChangePassword: !!req.user.mustChangePassword
    },
    hotel: {
      id: req.hotel._id,
      slug: req.hotel.slug,
      name: req.hotel.name,
      status: req.hotel.status
    }
  });
});

router.get('/onboarding/checklist', isAuthenticatedUser, isBlocked, async (req, res) => {
  try {
    const settings = await loadSettings(req);
    const Rooms = req.M.Rooms;
    const totalRooms = await Rooms.countDocuments();
    const roomsWithPrice = await Rooms.countDocuments({ room_price: { $gt: 0 } });
    let channelCount = 0;
    try {
      channelCount = await req.db.collection('channels').countDocuments();
    } catch (_) { /* collection may not exist yet */ }

    const items = [
      {
        id: 'account',
        label: 'Create your account',
        done: true,
        linkTo: null
      },
      {
        id: 'address',
        label: 'Confirm hotel name and address',
        done: !!settings?.contact?.addressLine1,
        linkTo: '/main/hotel-settings#basics'
      },
      {
        id: 'rooms',
        label: 'Add at least one room',
        done: totalRooms >= 1,
        linkTo: '/main/hotel-rooms'
      },
      {
        id: 'pricing',
        label: 'Set base price for every room',
        done: totalRooms >= 1 && roomsWithPrice === totalRooms,
        linkTo: '/main/hotel-rooms'
      },
      {
        id: 'photos',
        label: 'Add hotel photos',
        done: Array.isArray(settings?.photos) && settings.photos.length >= 1,
        linkTo: '/main/hotel-settings#photos'
      },
      {
        id: 'policies',
        label: 'Confirm check-in / check-out times',
        done: !!settings?.policies?.checkInTime && !!settings?.policies?.checkOutTime,
        linkTo: '/main/hotel-settings#policies'
      },
      {
        id: 'channels',
        label: 'Connect a booking channel (Airbnb, Booking.com, …)',
        done: channelCount >= 1,
        linkTo: '/main/booking-site#channels'
      },
      {
        id: 'publish',
        label: 'Publish your booking site',
        done: req.hotel?.status === 'active',
        linkTo: null,
        action: 'publish'
      }
    ];

    const requiredIds = new Set(['address', 'rooms', 'pricing', 'policies']);
    const canPublish = items.filter((i) => requiredIds.has(i.id)).every((i) => i.done);
    const doneCount = items.filter((i) => i.done).length;

    return res.json({
      items,
      doneCount,
      total: items.length,
      percent: Math.round((doneCount / items.length) * 100),
      canPublish,
      hotel: { slug: req.hotel.slug, name: req.hotel.name, status: req.hotel.status }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/onboarding/publish', isAuthenticatedUser, isBlocked, isAdmin, async (req, res) => {
  try {
    const settings = await loadSettings(req);
    const Rooms = req.M.Rooms;
    const totalRooms = await Rooms.countDocuments();
    const unpriced = await Rooms.countDocuments({ $or: [{ room_price: { $lte: 0 } }, { room_price: { $exists: false } }] });

    const reasons = [];
    if (!settings?.contact?.addressLine1) reasons.push('hotel address is required');
    if (totalRooms < 1) reasons.push('at least one room is required');
    if (unpriced > 0) reasons.push(`${unpriced} room(s) have no price`);

    if (reasons.length) return res.status(400).json({ error: 'Cannot publish', reasons });

    const { models } = getPlatformConnection();
    const updated = await models.Hotel.findOneAndUpdate(
      { slug: req.hotel.slug },
      { status: 'active', publishedAt: new Date(), suspendedAt: null },
      { new: true }
    ).lean();

    await req.db.collection(SETTINGS_COLLECTION).updateOne(
      {},
      { $set: { publishedAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );

    return res.json({ hotel: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/hotel-settings', isAuthenticatedUser, isBlocked, async (req, res) => {
  try {
    const s = await loadSettings(req);
    return res.json(s);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup gate: is the hotel property captured yet?
router.get('/onboarding/status', isAuthenticatedUser, isBlocked, async (req, res) => {
  try {
    const s = await loadSettings(req);
    return res.json({ propertyComplete: isPropertyComplete(s), hotelStatus: req.hotel?.status || null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/hotel-settings', isAuthenticatedUser, isBlocked, isAdmin, async (req, res) => {
  try {
    const ALLOWED_TOP = new Set([
      'name', 'description', 'amenities', 'languages', 'photos', 'taxRate',
      'serviceFeePct', 'inventoryBuffer', 'floors', 'yearBuilt'
    ]);
    const ALLOWED_NESTED = new Set(['contact', 'branding', 'policies', 'location', 'company']);
    const $set = { updatedAt: new Date() };

    for (const [k, v] of Object.entries(req.body || {})) {
      if (ALLOWED_TOP.has(k)) {
        $set[k] = v;
      } else if (ALLOWED_NESTED.has(k) && v && typeof v === 'object') {
        for (const [nk, nv] of Object.entries(v)) {
          $set[`${k}.${nk}`] = nv;
        }
      }
    }

    await req.db.collection(SETTINGS_COLLECTION).updateOne({}, { $set }, { upsert: true });
    const fresh = await loadSettings(req);
    return res.json(fresh);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
