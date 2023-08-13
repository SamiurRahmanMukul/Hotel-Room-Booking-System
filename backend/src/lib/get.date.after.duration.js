/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const getDateAfterDuration = (duration) => {
  const currentDate = new Date();
  const parts = duration.match(/(\d+)([dhms])/);
  if (!parts) return null;

  const amount = parseInt(parts[1], 10);
  const unit = parts[2];
  let multiplier;

  switch (unit) {
    case 'd':
      multiplier = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      break;
    case 'h':
      multiplier = 60 * 60 * 1000; // 1 hour in milliseconds
      break;
    case 'm':
      multiplier = 60 * 1000; // 1 minute in milliseconds
      break;
    case 's':
      multiplier = 1000; // 1 second in milliseconds
      break;
    default:
      return null;
  }

  const futureDate = new Date(currentDate.getTime() + amount * multiplier);
  return futureDate;
};

module.exports = getDateAfterDuration;
