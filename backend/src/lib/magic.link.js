/**
 * Magic-link utilities.
 *
 * Token format: 32 random bytes hex-encoded (64 chars).
 * Stored in user.magicLinkTokenHash as sha256(token) so a DB compromise
 * can't be replayed to log in.
 *
 * Default lifetime: 24 hours.
 */

const crypto = require('crypto');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildUrl({ slug, token, baseUrl, kind = 'set-password' }) {
  // dev: localhost admin panel + slug query
  // prod: https://<slug>.admin.platform.com/auth/<kind>?token=...
  const base = baseUrl || process.env.ADMIN_PANEL_BASE_URL || 'http://localhost:3001';
  if (process.env.MAGIC_LINK_USE_SUBDOMAIN === 'true') {
    return `https://${slug}.admin.platform.com/auth/${kind}?token=${token}`;
  }
  return `${base}/auth/${kind}?slug=${encodeURIComponent(slug)}&token=${token}`;
}

module.exports = {
  generateToken,
  hashToken,
  buildUrl,
  DEFAULT_TTL_MS
};
