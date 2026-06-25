const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superadminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['superadmin'], default: 'superadmin' },
  mustChangePassword: { type: Boolean, default: false },
  lastLoginAt: Date,
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  magicLinkTokenHash: { type: String, select: false },
  magicLinkExpiresAt: Date
}, { timestamps: true });

superadminSchema.pre('save', async function hashPasswordIfModified(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8);
  return next();
});

superadminSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = superadminSchema;
