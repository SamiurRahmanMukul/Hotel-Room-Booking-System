/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

/**
 * Custom validator function to check if the array is non-empty, contains valid future dates, and has no duplicates.
 *
 * @param {Array} array - The array of dates to be validated.
 * @returns {boolean} - Returns true if the array contains valid future dates without duplicates, otherwise false.
 */
exports.validateBookingDates = (array) => {
  if (!Array.isArray(array) || array.length === 0) return false; // must be a non-empty array

  // Compare on the DATE (not the timestamp) in UTC, so a same-day booking is allowed —
  // hotels accept same-day check-in. The old `<= now` check rejected today because
  // midnight-of-today is before the current time.
  const todayStr = new Date().toISOString().slice(0, 10);
  const uniqueDates = new Set();

  for (const date of array) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return false; // invalid date
    const dayStr = parsedDate.toISOString().slice(0, 10);
    if (dayStr < todayStr) return false; // no past dates (today is allowed)
    if (uniqueDates.has(dayStr)) return false; // no duplicates
    uniqueDates.add(dayStr);
  }

  return true;
};

/**
 * Checks various date-related conditions for a given array of date strings.
 *
 * @param {string[]} dateArray - An array of date strings in the format 'YYYY-MM-DD'.
 * @returns {Object} An object containing various date-related conditions:
 *   - isAnyDateInPast: A boolean indicating if any date is in the past.
 *   - earliestDate: The earliest date in the array.
 *   - latestDate: The latest date in the array.
 *   - isEarliestDateOverCurrentDate: A boolean indicating if the earliest date is after the current date.
 *   - isLatestDateOverCurrentDate: A boolean indicating if the latest date is after the current date.
 */
exports.bookingDatesBeforeCurrentDate = (dateArray) => {
  // Convert dates to Date objects
  const currentDate = new Date();

  // Check if any date is in the past
  const isAnyDateInPast = dateArray.some((dateString) => new Date(dateString) < currentDate);

  // Convert dates to Date objects and find the earliest and latest dates
  const dateObjects = dateArray.map((dateString) => new Date(dateString));
  const earliestDate = new Date(Math.min(...dateObjects));
  const latestDate = new Date(Math.max(...dateObjects));

  // Check if the earliest date is over the current date
  const isEarliestDateOverCurrentDate = earliestDate < currentDate;

  // Check if the latest date is over the current date
  const isLatestDateOverCurrentDate = latestDate < currentDate;

  return {
    isAnyDateInPast,
    earliestDate,
    latestDate,
    isEarliestDateOverCurrentDate,
    isLatestDateOverCurrentDate
  };
};
