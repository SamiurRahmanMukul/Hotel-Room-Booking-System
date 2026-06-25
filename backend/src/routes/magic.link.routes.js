/**
 * Magic-link verify + set-password routes.
 * Mounted under /api/v1 so tenantResolver runs first → req.M.Users is the
 * correct tenant's users collection.
 *
 * GET  /auth/magic-link/verify?token=<raw>
 *   → 200 { user: { email, fullName }, hotel: { slug, name }, expiresAt }
 *   → 410 if expired/used · 404 if no match
 *
 * POST /auth/magic-link/set-password
 *   body: { token, password, fullName?, addressLine1?, addressLine2?,
 *           postalCode?, city?, country?, currency?, timezone? }
 *   → 200 { access_token, refresh_token, user, hotel }
 *
 * The "set-password" endpoint also captures the rest of the onboarding basics
 * in one shot so the manager lands on the dashboard fully set up.
 */

const express = require('express');
const { sendMail } = require('../lib/mailer');
const { hashToken } = require('../lib/magic.link');

const router = express.Router();

router.get('/auth/magic-link/verify', async (req, res) => {
  try {
    const token = (req.query.token || '').toString();
    if (!token) return res.status(400).json({ error: 'token required' });

    const Users = req.M.Users;
    const user = await Users.findOne({ magicLinkTokenHash: hashToken(token) }).select('+magicLinkTokenHash');
    if (!user) return res.status(404).json({ error: 'unknown or used link' });
    if (!user.magicLinkExpiresAt || user.magicLinkExpiresAt < new Date()) {
      return res.status(410).json({ error: 'link expired' });
    }
    return res.json({
      user: { email: user.email, fullName: user.fullName, role: user.role },
      hotel: { slug: req.hotel.slug, name: req.hotel.name },
      expiresAt: user.magicLinkExpiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/auth/magic-link/set-password', async (req, res) => {
  try {
    const {
      token, password, fullName,
      addressLine1, addressLine2, postalCode, city, country, currency, timezone
    } = req.body || {};

    if (!token || !password) return res.status(400).json({ error: 'token and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

    const Users = req.M.Users;
    const user = await Users.findOne({ magicLinkTokenHash: hashToken(token) }).select('+password +magicLinkTokenHash');
    if (!user) return res.status(404).json({ error: 'unknown or used link' });
    if (!user.magicLinkExpiresAt || user.magicLinkExpiresAt < new Date()) {
      return res.status(410).json({ error: 'link expired' });
    }

    user.password = password; // pre-save hook hashes
    user.mustChangePassword = false;
    user.magicLinkTokenHash = undefined;
    user.magicLinkExpiresAt = undefined;
    user.status = 'login';
    if (fullName && fullName.trim()) user.fullName = fullName.trim();
    await user.save();

    // Persist onboarding basics into hotel_settings.contact in one shot
    const settingsPatch = {};
    if (addressLine1) settingsPatch['contact.addressLine1'] = addressLine1;
    if (addressLine2 !== undefined) settingsPatch['contact.addressLine2'] = addressLine2;
    if (postalCode) settingsPatch['contact.postalCode'] = postalCode;
    if (city) settingsPatch['contact.city'] = city;
    if (country) settingsPatch['contact.country'] = country;
    if (currency) settingsPatch['contact.currency'] = currency;
    if (timezone) settingsPatch['contact.timezone'] = timezone;
    if (Object.keys(settingsPatch).length > 0) {
      settingsPatch.updatedAt = new Date();
      await req.db.collection('hotel_settings').updateOne(
        {},
        { $set: settingsPatch },
        { upsert: true }
      );
    }

    // Send "you're in" welcome email (fire-and-forget)
    const adminUrl = `${process.env.ADMIN_PANEL_BASE_URL || 'http://localhost:3001'}/main/dashboard`;
    sendMail({
      to: user.email,
      subject: `Welcome to ${req.hotel.name} — your dashboard is ready`,
      text: [
        `Hi ${user.fullName || ''},`,
        '',
        `Your account for "${req.hotel.name}" is now set up.`,
        '',
        `Sign in any time at:  ${adminUrl}`,
        '',
        'Your dashboard has a checklist to walk you through adding rooms, photos,',
        'pricing, and connecting OTA channels. You can publish your booking site',
        'whenever you are ready.',
        '',
        'See you inside!'
      ].join('\n')
    }).catch(() => { /* non-blocking */ });

    const accessToken = user.getJWTToken({ hotelSlug: req.hotel.slug });
    const refreshToken = user.getJWTRefreshToken({ hotelSlug: req.hotel.slug });
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user._id, email: user.email, fullName: user.fullName, role: user.role,
        mustChangePassword: false
      },
      hotel: { slug: req.hotel.slug, name: req.hotel.name }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
