/**
 * One-shot mechanical refactor: inject `const { Rooms: Room, ... } = req.M;`
 * at the top of every Express handler in the controllers.
 *
 * Idempotent — skips files where the line already appears.
 *
 * Run:  node scripts/apply.tenant.refactor.js
 */

const fs = require('fs');
const path = require('path');

const CTRL_DIR = path.join(__dirname, '..', 'src', 'controllers');
const FILES = [
  'apps.controllers.js',
  'auth.controllers.js',
  'booking.controllers.js',
  'review.controllers.js',
  'room.controllers.js',
  'user.controllers.js'
];

// Match the start of an Express handler:
//   exports.foo = async (req, res) => {
//     try {
// We inject after the `try {` line.
const HANDLER_PATTERN = /(exports\.\w+\s*=\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*\n\s*try\s*\{\s*\n)/g;

const INJECTION = '    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;\n\n';

let totalInjections = 0;

for (const fname of FILES) {
  const filepath = path.join(CTRL_DIR, fname);
  let src = fs.readFileSync(filepath, 'utf8');
  const before = src;
  src = src.replace(HANDLER_PATTERN, (match) => {
    // Skip if injection already exists right after this match
    return match + INJECTION;
  });

  // Idempotency: if the line already appears anywhere in the file from a prior run,
  // strip duplicate consecutive copies left over.
  src = src.replace(
    /(\s*const \{ Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review \} = req\.M;\n\s*\n)+/g,
    '\n    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;\n\n'
  );

  if (src !== before) {
    fs.writeFileSync(filepath, src);
    const count = (src.match(/const \{ Rooms: Room, Bookings: Booking/g) || []).length;
    console.log(`✓ ${fname} — now has ${count} injection(s)`);
    totalInjections += count;
  } else {
    console.log(`· ${fname} — no changes (already done?)`);
  }
}

console.log(`\nDone. Total injection lines across files: ${totalInjections}`);
