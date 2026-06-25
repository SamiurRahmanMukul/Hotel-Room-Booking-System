/**
 * Atomic-ish provisioning of a new hotel tenant.
 *
 * Given just `{ name, contact_email }`, this:
 *   1. Generates a URL-safe slug from the name (with collision suffix).
 *   2. Inserts a row in platform.hotels (status='active', dbName='hotel_<slug>').
 *   3. Connects to the new hotel's DB (Mongo creates it on first write).
 *   4. Inserts a default hotel_settings document.
 *   5. Generates a temporary password and inserts the initial hotel_admin user.
 *   6. Returns the new hotel + temp credentials. Caller is responsible for
 *      delivering the credentials (email later; for now the API just returns them).
 *
 * The temp password is shown ONCE — `mustChangePassword` is set, so the manager
 * is forced to change it on first login.
 *
 * Rollback: if any step after the platform.hotels insert fails, we delete the
 * hotel record and drop the partially-created DB so re-creation can use the
 * same slug.
 */

const crypto = require('crypto');
const { getPlatformConnection } = require('./platform.connection');
const { getHotelConnection, evict } = require('./tenant.connection');
const {
  generateToken, hashToken, buildUrl, DEFAULT_TTL_MS
} = require('./magic.link');
const { sendMail } = require('./mailer');
const logger = require('../middleware/winston.logger');

const SLUG_FORBIDDEN = new Set([
  'admin', 'api', 'www', 'mail', 'platform', 'default', 'app',
  'static', 'cdn', 'assets', 'login', 'signup', 'support'
]);

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'hotel';
}

async function uniqueSlug(Hotel, base) {
  let slug = base;
  if (SLUG_FORBIDDEN.has(slug)) slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  for (let i = 0; i < 10; i += 1) {
    const exists = await Hotel.exists({ slug });
    if (!exists) return slug;
    slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  throw new Error('could not find a unique slug');
}

function placeholderPassword() {
  // The user will overwrite this on first login via the magic link.
  // We need *something* in the field because the schema requires it.
  return crypto.randomBytes(24).toString('hex');
}

const HOTEL_SETTINGS_COLLECTION = 'hotel_settings';

function defaultHotelSettings(name, contact) {
  return {
    name,
    branding: {
      logoUrl: null,
      primaryColor: '#1677ff',
      secondaryColor: '#ADADAD',
      font: 'Inter',
      heroImageUrl: null,
      tagline: ''
    },
    contact: {
      email: contact?.email || '',
      phone: '',
      addressLine1: '',
      city: '',
      country: '',
      timezone: 'UTC',
      currency: 'EUR'
    },
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationHours: 24,
      childrenAllowed: true,
      petsAllowed: false,
      smokingAllowed: false,
      paymentMethods: ['card']
    },
    amenities: [],
    taxRate: 0,
    serviceFeePct: 0,
    inventoryBuffer: { mode: 'fixed', value: 0 },
    onboardingStep: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function provisionHotel({ name, contact_email, admin_full_name }) {
  if (!name || !name.trim()) throw new Error('hotel name required');

  const { models } = getPlatformConnection();
  const { Hotel } = models;

  const baseSlug = slugify(name);
  const slug = await uniqueSlug(Hotel, baseSlug);
  const dbName = `hotel_${slug.replace(/-/g, '_')}`;

  // 1. platform record
  const hotel = await Hotel.create({
    slug,
    name: name.trim(),
    dbName,
    status: 'draft', // becomes 'active' when manager clicks Publish
    contact: { email: contact_email || '', currency: 'EUR', timezone: 'UTC' }
  });

  let conn = null;
  let admin = null;
  let magicLinkUrl = null;
  let mailDelivery = null;
  try {
    // 2. open the new hotel's DB (auto-creates on first write)
    conn = await getHotelConnection(dbName);
    if (conn.readyState !== 1) await conn.asPromise();

    // 3. default hotel_settings
    await conn.collection(HOTEL_SETTINGS_COLLECTION).insertOne(
      defaultHotelSettings(name.trim(), { email: contact_email })
    );

    // 4. initial hotel_admin user with magic link (no usable password yet)
    if (!contact_email) throw new Error('contact_email required for initial hotel_admin');
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS);

    const Users = conn.model('Users');
    admin = await Users.create({
      userName: `${slug}-admin`,
      fullName: admin_full_name || `${name.trim()} Admin`,
      email: contact_email,
      password: placeholderPassword(), // overwritten via magic link
      address: 'TBD',
      dob: new Date('2000-01-01'),
      role: 'admin',
      verified: true,
      mustChangePassword: true,
      magicLinkTokenHash: tokenHash,
      magicLinkExpiresAt: expiresAt
    });

    magicLinkUrl = buildUrl({ slug, token: rawToken });

    // 5. send magic-link email (does not throw — mail failure shouldn't undo provisioning)
    try {
      mailDelivery = await sendMail({
        to: contact_email,
        subject: `Welcome to ${name.trim()} — set your admin password`,
        text: [
          `Hi ${admin_full_name || 'there'},`,
          '',
          `Your admin account for "${name.trim()}" has been created.`,
          '',
          'Click the link below to set your password and log in.',
          'This link expires in 24 hours.',
          '',
          magicLinkUrl,
          '',
          'If you did not expect this email, ignore it.'
        ].join('\n')
      });
    } catch (mailErr) {
      logger.error(`hotel provisioned but email failed for ${contact_email}: ${mailErr.message}`);
    }
  } catch (err) {
    logger.error(`provisionHotel rollback for ${slug}: ${err.message}`);
    try { if (conn) await conn.dropDatabase(); } catch (_) { /* noop */ }
    await Hotel.deleteOne({ _id: hotel._id });
    throw err;
  }

  return {
    hotel: {
      id: hotel._id.toString(),
      slug: hotel.slug,
      name: hotel.name,
      dbName: hotel.dbName,
      status: hotel.status
    },
    admin: {
      id: admin._id.toString(),
      email: admin.email,
      mustChangePassword: true
    },
    magicLink: {
      url: magicLinkUrl,
      expiresAt: new Date(Date.now() + DEFAULT_TTL_MS)
    },
    mail: {
      sent: !!mailDelivery,
      transport: mailDelivery?.transport || null
    },
    bookingUrl: `https://${slug}.book.platform.com`,
    adminUrl: `https://${slug}.admin.platform.com`
  };
}

async function listHotels() {
  const { models } = getPlatformConnection();
  return models.Hotel.find({}).sort({ createdAt: -1 }).lean();
}

async function getHotelBySlug(slug) {
  const { models } = getPlatformConnection();
  return models.Hotel.findOne({ slug }).lean();
}

async function setHotelStatus(slug, status) {
  if (!['active', 'suspended', 'draft'].includes(status)) throw new Error('invalid status');
  const { models } = getPlatformConnection();
  const update = { status };
  if (status === 'suspended') update.suspendedAt = new Date();
  if (status === 'active') update.suspendedAt = null;
  return models.Hotel.findOneAndUpdate({ slug }, update, { new: true }).lean();
}

async function deleteHotel(slug) {
  const { models, conn: platformConn } = getPlatformConnection();
  const hotel = await models.Hotel.findOne({ slug });
  if (!hotel) throw new Error('hotel not found');
  if (hotel.slug === 'default') throw new Error('cannot delete default hotel');

  // remove platform record FIRST so no concurrent request re-opens the DB
  await models.Hotel.deleteOne({ _id: hotel._id });

  // evict cached Mongoose connection (closes it, prevents autoIndex re-creating collections)
  await evict(hotel.dbName);

  // drop the DB via the underlying MongoClient so we don't re-register models
  if (platformConn.readyState !== 1) await platformConn.asPromise();
  const targetDb = platformConn.client.db(hotel.dbName);
  await targetDb.dropDatabase();

  return { dropped: hotel.dbName };
}

async function updateHotel(slug, fields) {
  const allowed = {};
  if (fields.name) allowed.name = fields.name.trim();
  if (fields.billingPlan) allowed.billingPlan = fields.billingPlan;
  if (fields.contact) allowed.contact = fields.contact;
  if (fields.customDomain !== undefined) allowed.customDomain = fields.customDomain;
  const { models } = getPlatformConnection();
  return models.Hotel.findOneAndUpdate({ slug }, allowed, { new: true }).lean();
}

async function inviteHotelAdmin({ slug, email, fullName }) {
  if (!email) throw new Error('email required');
  const hotel = await getHotelBySlug(slug);
  if (!hotel) throw new Error('hotel not found');
  const conn = await getHotelConnection(hotel.dbName);
  if (conn.readyState !== 1) await conn.asPromise();
  const Users = conn.model('Users');

  if (await Users.exists({ email: email.toLowerCase() })) {
    throw new Error(`a user with email ${email} already exists in this hotel`);
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS);

  const user = await Users.create({
    userName: `${slug}-${email.split('@')[0]}-${crypto.randomBytes(2).toString('hex')}`,
    fullName: fullName || email,
    email: email.toLowerCase(),
    password: placeholderPassword(),
    address: 'TBD',
    dob: new Date('2000-01-01'),
    role: 'admin',
    verified: true,
    mustChangePassword: true,
    magicLinkTokenHash: tokenHash,
    magicLinkExpiresAt: expiresAt
  });

  const url = buildUrl({ slug, token: rawToken });
  let mail = { sent: false };
  try {
    await sendMail({
      to: email,
      subject: `You've been added as admin for ${hotel.name}`,
      text: `Hi ${fullName || ''},\n\nYou've been invited as an admin for "${hotel.name}".\n\nClick the link below to set your password and log in. Expires in 24 hours.\n\n${url}`
    });
    mail = { sent: true };
  } catch (err) {
    logger.error(`invite mail failed for ${email}: ${err.message}`);
  }
  return {
    user: { id: user._id.toString(), email: user.email, fullName: user.fullName },
    magicLink: { url, expiresAt },
    mail
  };
}

async function resendMagicLink({ slug, email }) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) throw new Error('hotel not found');
  const conn = await getHotelConnection(hotel.dbName);
  if (conn.readyState !== 1) await conn.asPromise();
  const Users = conn.model('Users');
  const user = await Users.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('user not found in this hotel');

  const rawToken = generateToken();
  user.magicLinkTokenHash = hashToken(rawToken);
  user.magicLinkExpiresAt = new Date(Date.now() + DEFAULT_TTL_MS);
  user.mustChangePassword = true;
  await user.save();

  const url = buildUrl({ slug, token: rawToken });
  let mail = { sent: false };
  try {
    await sendMail({
      to: user.email,
      subject: `New password setup link for ${hotel.name}`,
      text: `Hi ${user.fullName || ''},\n\nA new password setup link has been issued for your account at "${hotel.name}". Expires in 24 hours.\n\n${url}`
    });
    mail = { sent: true };
  } catch (err) {
    logger.error(`resend mail failed for ${user.email}: ${err.message}`);
  }
  return { magicLink: { url, expiresAt: user.magicLinkExpiresAt }, mail };
}

async function listHotelAdmins(slug) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) throw new Error('hotel not found');
  const conn = await getHotelConnection(hotel.dbName);
  if (conn.readyState !== 1) await conn.asPromise();
  const Users = conn.model('Users');
  return Users.find({ role: 'admin' })
    .select('email fullName mustChangePassword status lastLoginAt createdAt magicLinkExpiresAt')
    .lean();
}

async function removeHotelAdmin({ slug, userId }) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) throw new Error('hotel not found');
  const conn = await getHotelConnection(hotel.dbName);
  if (conn.readyState !== 1) await conn.asPromise();
  const Users = conn.model('Users');
  const remaining = await Users.countDocuments({ role: 'admin' });
  if (remaining <= 1) throw new Error('cannot remove the last admin');
  await Users.deleteOne({ _id: userId, role: 'admin' });
}

async function getHotelDetail(slug) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return null;
  const conn = await getHotelConnection(hotel.dbName);
  if (conn.readyState !== 1) await conn.asPromise();

  const Rooms = conn.model('Rooms');
  const Users = conn.model('Users');
  const Bookings = conn.model('Bookings');

  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setUTCDate(horizon.getUTCDate() + 30);

  const [rooms, users, bookings, recentBookings, syncRuns, channels] = await Promise.all([
    Rooms.countDocuments(),
    Users.countDocuments(),
    Bookings.countDocuments(),
    Bookings.find().sort({ createdAt: -1 }).limit(10).lean(),
    conn.collection('syncruns').find({}).sort({ startedAt: -1 }).limit(20).toArray().catch(() => []),
    conn.collection('channels').find({}).toArray().catch(() => [])
  ]);

  // Occupancy: count distinct (roomId, date) tuples in BookingClaims for the next 30 days
  const BookingClaims = conn.model('BookingClaims');
  const claimsInWindow = await BookingClaims.countDocuments({
    date: { $gte: today.toISOString().slice(0, 10), $lt: horizon.toISOString().slice(0, 10) }
  }).catch(() => 0);
  const roomDays = rooms * 30;
  const occupancyPct = roomDays > 0 ? Math.round((claimsInWindow / roomDays) * 100) : 0;

  const recentSyncErrors = syncRuns
    .filter((r) => r.status === 'error' || (r.errorMessages && r.errorMessages.length))
    .slice(0, 5)
    .map((r) => ({
      channelId: r.channelId,
      startedAt: r.startedAt,
      errorMessages: r.errorMessages || []
    }));

  return {
    hotel,
    counts: {
      rooms, users, bookings, channels: channels.length
    },
    occupancy: {
      next30Days: {
        roomDays, claimedRoomDays: claimsInWindow, percent: occupancyPct
      }
    },
    recentBookings: recentBookings.map((b) => ({
      id: b._id, dates: b.booking_dates, status: b.booking_status, createdAt: b.createdAt
    })),
    syncHealth: {
      totalRuns: syncRuns.length,
      errorCount: recentSyncErrors.length,
      recentErrors: recentSyncErrors
    },
    channels: channels.map((c) => ({
      id: c._id,
      name: c.name,
      type: c.type,
      enabled: c.enabled,
      lastSyncAt: c.lastSyncAt,
      lastSyncStatus: c.lastSyncStatus,
      lastError: c.lastError
    }))
  };
}

module.exports = {
  provisionHotel,
  listHotels,
  slugify,
  getHotelBySlug,
  setHotelStatus,
  deleteHotel,
  updateHotel,
  inviteHotelAdmin,
  resendMagicLink,
  listHotelAdmins,
  removeHotelAdmin,
  getHotelDetail
};

