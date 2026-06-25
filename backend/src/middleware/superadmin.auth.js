/**
 * Authenticate a superadmin from a JWT.
 * Token payload: { sid: <Superadmin._id>, type: 'superadmin' }
 * Signed with process.env.SUPERADMIN_JWT_SECRET (falls back to JWT_SECRET_KEY).
 */

const jwt = require('jsonwebtoken');
const { getPlatformConnection } = require('../lib/platform.connection');

function secret() {
  return process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET_KEY;
}

function signSuperadminToken(superadmin) {
  return jwt.sign(
    { sid: superadmin._id.toString(), type: 'superadmin' },
    secret(),
    { expiresIn: '7d' }
  );
}

async function isSuperadmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing bearer token' });

    const payload = jwt.verify(token, secret());
    if (payload.type !== 'superadmin') return res.status(403).json({ error: 'not a superadmin token' });

    const { models } = getPlatformConnection();
    const sa = await models.Superadmin.findById(payload.sid).lean();
    if (!sa || sa.status !== 'active') return res.status(401).json({ error: 'superadmin not active' });

    req.superadmin = sa;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token', detail: err.message });
  }
}

module.exports = { isSuperadmin, signSuperadminToken };
