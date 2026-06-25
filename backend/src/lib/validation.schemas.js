/**
 * Zod validation schemas for API routes.
 *
 * These replace the manual `if (!field)` checks in controllers.
 * Import and use with the `validate` middleware.
 */

const { z } = require('zod');

/* ── Auth ────────────────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  userName: z.string().min(2, 'Username must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']).optional(),
  gender: z.enum(['male', 'female']).optional(),
  dob: z.string().optional(),
  address: z.string().optional()
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/* ── Room ────────────────────────────────────────────────────────── */

const createRoomSchema = z.object({
  room_name: z.string().min(1, 'Room name is required'),
  room_slug: z.string().min(1, 'Room slug is required'),
  room_type: z.enum(['single', 'couple', 'family', 'presidential']),
  room_price: z.coerce.number().positive('Room price must be positive'),
  room_size: z.coerce.number().positive('Room size must be positive'),
  room_capacity: z.coerce.number().int().positive('Room capacity must be positive'),
  allow_pets: z.coerce.boolean().optional(),
  provide_breakfast: z.coerce.boolean().optional(),
  featured_room: z.coerce.boolean().optional(),
  room_description: z.string().min(1, 'Room description is required'),
  extra_facilities: z.array(z.string()).min(1, 'At least 1 extra facility is required')
});

/* ── Booking ─────────────────────────────────────────────────────── */

const placeBookingSchema = z.object({
  booking_dates: z.array(z.string()).min(1, 'At least 1 booking date is required')
});

const updateBookingStatusSchema = z.object({
  booking_status: z.enum(['approved', 'rejected', 'in-reviews'])
});

/* ── User ────────────────────────────────────────────────────────── */

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  dob: z.string().optional(),
  address: z.string().optional()
});

/* ── Hotel Settings ──────────────────────────────────────────────── */

const hotelSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional()
  }).optional(),
  branding: z.object({
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    tagline: z.string().optional()
  }).optional(),
  policies: z.object({
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    cancellationHours: z.coerce.number().optional()
  }).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  serviceFeePct: z.coerce.number().min(0).max(100).optional()
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createRoomSchema,
  placeBookingSchema,
  updateBookingStatusSchema,
  updateUserSchema,
  hotelSettingsSchema
};
