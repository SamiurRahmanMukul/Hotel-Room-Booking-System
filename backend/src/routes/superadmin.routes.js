/**
 * /platform-api/* routes — operate on the platform DB, NOT tenant-scoped.
 * Mounted before tenantResolver in app/index.js so the tenant middleware
 * never runs for these paths.
 */

const express = require('express');
const { getPlatformConnection } = require('../lib/platform.connection');
const { getHotelConnection } = require('../lib/tenant.connection');
const bcrypt = require('bcryptjs');
const {
  provisionHotel, listHotels, getHotelDetail, setHotelStatus, deleteHotel, updateHotel,
  inviteHotelAdmin, resendMagicLink, listHotelAdmins, removeHotelAdmin
} = require('../lib/hotel.provisioning');
const { backupHotel, restoreHotel, listBackups } = require('../lib/hotel.backup');
const { generateToken, hashToken, DEFAULT_TTL_MS } = require('../lib/magic.link');
const { sendMail } = require('../lib/mailer');
const { isSuperadmin, signSuperadminToken } = require('../middleware/superadmin.auth');

const router = express.Router();

router.get('/auth/magic-link/verify', async (req, res) => {
  try {
    const token = (req.query.token || '').toString();
    if (!token) return res.status(400).json({ error: 'token required' });
    const { models } = getPlatformConnection();
    const sa = await models.Superadmin.findOne({ magicLinkTokenHash: hashToken(token) }).select('+magicLinkTokenHash');
    if (!sa) return res.status(404).json({ error: 'unknown or used link' });
    if (!sa.magicLinkExpiresAt || sa.magicLinkExpiresAt < new Date()) return res.status(410).json({ error: 'link expired' });
    return res.json({
      user: { email: sa.email, fullName: sa.fullName },
      hotel: { slug: 'superadmin', name: 'Platform Super Admin' },
      expiresAt: sa.magicLinkExpiresAt
    });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/auth/magic-link/set-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
    const { models } = getPlatformConnection();
    const sa = await models.Superadmin.findOne({ magicLinkTokenHash: hashToken(token) }).select('+password +magicLinkTokenHash');
    if (!sa) return res.status(404).json({ error: 'unknown or used link' });
    if (!sa.magicLinkExpiresAt || sa.magicLinkExpiresAt < new Date()) return res.status(410).json({ error: 'link expired' });

    sa.password = password;
    sa.mustChangePassword = false;
    sa.magicLinkTokenHash = undefined;
    sa.magicLinkExpiresAt = undefined;
    await sa.save();

    return res.json({
      access_token: signSuperadminToken(sa),
      superadmin: { id: sa._id, email: sa.email, fullName: sa.fullName, mustChangePassword: false },
      hotel: { slug: 'superadmin', name: 'Platform Super Admin' }
    });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { models } = getPlatformConnection();
    const sa = await models.Superadmin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!sa) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await sa.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    sa.lastLoginAt = new Date();
    await sa.save();

    return res.json({
      access_token: signSuperadminToken(sa),
      superadmin: {
        id: sa._id,
        email: sa.email,
        fullName: sa.fullName,
        mustChangePassword: sa.mustChangePassword
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', isSuperadmin, (req, res) => {
  res.json({
    id: req.superadmin._id,
    email: req.superadmin.email,
    fullName: req.superadmin.fullName,
    mustChangePassword: req.superadmin.mustChangePassword
  });
});

router.get('/hotels', isSuperadmin, async (_req, res) => {
  const hotels = await listHotels();
  res.json({ hotels });
});

router.get('/dashboard', isSuperadmin, async (_req, res) => {
  try {
    const hotels = await listHotels();

    const byStatus = { active: 0, draft: 0, suspended: 0 };
    for (const h of hotels) byStatus[h.status] = (byStatus[h.status] || 0) + 1;

    // walk every active hotel; aggregate rooms, users, bookings, channels
    const totals = {
      rooms: 0, users: 0, bookings: 0, channels: 0
    };
    const perHotel = [];

    for (const h of hotels) {
      try {
        const conn = getHotelConnection(h.dbName);
        if (conn.readyState !== 1) await conn.asPromise();
        const [rooms, users, bookings, channels] = await Promise.all([
          conn.model('Rooms').countDocuments(),
          conn.model('Users').countDocuments(),
          conn.model('Bookings').countDocuments(),
          conn.collection('channels').countDocuments().catch(() => 0)
        ]);

        totals.rooms += rooms;
        totals.users += users;
        totals.bookings += bookings;
        totals.channels += channels;
        perHotel.push({
          slug: h.slug, name: h.name, status: h.status, rooms, users, bookings, channels
        });
      } catch (err) {
        perHotel.push({
          slug: h.slug, name: h.name, status: h.status, error: err.message
        });
      }
    }

    res.json({
      hotels: { total: hotels.length, ...byStatus },
      totals,
      perHotel
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hotels', isSuperadmin, async (req, res) => {
  try {
    const { name, contact_email, admin_full_name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await provisionHotel({
      name,
      contact_email: contact_email || `admin@${(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '')}.local`,
      admin_full_name
    });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ===== single hotel =====

router.get('/hotels/:slug', isSuperadmin, async (req, res) => {
  try {
    const detail = await getHotelDetail(req.params.slug);
    if (!detail) return res.status(404).json({ error: 'hotel not found' });
    return res.json(detail);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.patch('/hotels/:slug', isSuperadmin, async (req, res) => {
  try {
    const updated = await updateHotel(req.params.slug, req.body || {});
    if (!updated) return res.status(404).json({ error: 'hotel not found' });
    return res.json(updated);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.post('/hotels/:slug/status', isSuperadmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    const updated = await setHotelStatus(req.params.slug, status);
    if (!updated) return res.status(404).json({ error: 'hotel not found' });
    return res.json(updated);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.delete('/hotels/:slug', isSuperadmin, async (req, res) => {
  try {
    const result = await deleteHotel(req.params.slug);
    return res.json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

// ===== backup & restore =====

router.get('/hotels/:slug/backups', isSuperadmin, async (req, res) => {
  try {
    const backups = await listBackups(req.params.slug);
    return res.json({ backups });
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.post('/hotels/:slug/backups', isSuperadmin, async (req, res) => {
  try {
    const result = await backupHotel(req.params.slug);
    return res.status(201).json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.post('/hotels/:slug/backups/restore', isSuperadmin, async (req, res) => {
  try {
    const { backupFileName } = req.body || {};
    if (!backupFileName) return res.status(400).json({ error: 'backupFileName required' });
    const result = await restoreHotel(req.params.slug, backupFileName);
    return res.json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

// ===== hotel-admin management =====

router.get('/hotels/:slug/admins', isSuperadmin, async (req, res) => {
  try {
    const admins = await listHotelAdmins(req.params.slug);
    return res.json({ admins });
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.post('/hotels/:slug/admins', isSuperadmin, async (req, res) => {
  try {
    const { email, fullName } = req.body || {};
    const result = await inviteHotelAdmin({ slug: req.params.slug, email, fullName });
    return res.status(201).json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.post('/hotels/:slug/admins/resend', isSuperadmin, async (req, res) => {
  try {
    const { email } = req.body || {};
    const result = await resendMagicLink({ slug: req.params.slug, email });
    return res.json(result);
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

router.delete('/hotels/:slug/admins/:userId', isSuperadmin, async (req, res) => {
  try {
    await removeHotelAdmin({ slug: req.params.slug, userId: req.params.userId });
    return res.json({ removed: true });
  } catch (err) { return res.status(400).json({ error: err.message }); }
});

// ===== super-admin self & peers =====

router.post('/me/change-password', isSuperadmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!new_password || new_password.length < 8) return res.status(400).json({ error: 'new password too short (min 8)' });
    const { models } = getPlatformConnection();
    const sa = await models.Superadmin.findById(req.superadmin._id).select('+password');
    if (current_password) {
      const ok = await sa.comparePassword(current_password);
      if (!ok) return res.status(401).json({ error: 'current password incorrect' });
    } else if (!sa.mustChangePassword) {
      return res.status(400).json({ error: 'current_password required' });
    }
    sa.password = new_password; // pre-save hashes
    sa.mustChangePassword = false;
    await sa.save();
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.get('/superadmins', isSuperadmin, async (_req, res) => {
  try {
    const { models } = getPlatformConnection();
    const all = await models.Superadmin.find({}).select('email fullName status mustChangePassword lastLoginAt createdAt').lean();
    return res.json({ superadmins: all });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/superadmins/invite', isSuperadmin, async (req, res) => {
  try {
    const { email, fullName } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const { models } = getPlatformConnection();

    if (await models.Superadmin.exists({ email: email.toLowerCase() })) {
      return res.status(409).json({ error: 'a super-admin with this email already exists' });
    }

    // create with placeholder password and mustChangePassword set
    const placeholder = require('crypto').randomBytes(24).toString('hex');
    const sa = await models.Superadmin.create({
      email: email.toLowerCase(),
      password: placeholder,
      fullName: fullName || email,
      mustChangePassword: true
    });

    // send a magic-link-style invite via the same set-password page
    // Note: set-password expects ?slug=...&token=... — we use a special slug for super-admins
    const SUPERADMIN_SLUG = 'superadmin';
    const rawToken = generateToken();
    sa.set('magicLinkTokenHash', hashToken(rawToken));
    sa.set('magicLinkExpiresAt', new Date(Date.now() + DEFAULT_TTL_MS));
    await sa.save();

    const url = `${process.env.ADMIN_PANEL_BASE_URL || 'http://localhost:3001'}/auth/set-password?slug=${SUPERADMIN_SLUG}&token=${rawToken}`;
    let mail = { sent: false };
    try {
      await sendMail({
        to: email,
        subject: 'You\'ve been invited as platform super-admin',
        text: `Hi ${fullName || ''},\n\nYou've been invited to the platform as a super-admin.\n\nSet your password and sign in (link valid 24h):\n\n${url}`
      });
      mail = { sent: true };
    } catch (err) { /* logged inside mailer */ }

    return res.status(201).json({
      superadmin: { id: sa._id, email: sa.email, fullName: sa.fullName },
      magicLink: { url, expiresAt: sa.get('magicLinkExpiresAt') },
      mail
    });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.delete('/superadmins/:id', isSuperadmin, async (req, res) => {
  try {
    if (req.params.id === req.superadmin._id.toString()) {
      return res.status(400).json({ error: 'cannot remove yourself' });
    }
    const { models } = getPlatformConnection();
    const remaining = await models.Superadmin.countDocuments({ status: 'active' });
    if (remaining <= 1) return res.status(400).json({ error: 'cannot remove the last active super-admin' });
    await models.Superadmin.deleteOne({ _id: req.params.id });
    return res.json({ removed: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
