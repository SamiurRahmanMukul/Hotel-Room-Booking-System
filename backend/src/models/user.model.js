const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const usersSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: [true, 'User name filed is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name filed is required']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email filed is required'],
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    unique: true,
    validate: [validator.isMobilePhone, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password filed is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  dob: {
    type: Date,
    required: [validator.isDate, 'Date of birth filed is required']
  },
  address: {
    type: String,
    required: [true, 'Address field is required']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['register', 'login', 'logout', 'blocked'],
    default: 'register'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// after save, hash password
usersSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 8);
});

// JWT Access Token
usersSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES
  });
};

// JWT Refresh Token
usersSchema.methods.getJWTRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_TOKEN_SECRET_KEY, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES
  });
};

// compare password
usersSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// generating password reset token
usersSchema.methods.getResetPasswordToken = function () {
  // generating token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // hashing and adding resetPasswordToken to usersSchema
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

// generating email verification token
usersSchema.methods.getEmailVerificationToken = function () {
  // generating token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // hashing and adding emailVerificationToken to usersSchema
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpire = Date.now() + 15 * 60 * 1000;

  return verificationToken;
};

module.exports = mongoose.model('Users', usersSchema);
