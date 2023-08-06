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
  if (array.length === 0) return false; // Array should not be empty

  const currentDate = new Date();
  const uniqueDates = new Set(); // Using a Set to track unique dates

  // Check if each element is a valid date and in the future, and there are no duplicates
  for (const date of array) {
    const parsedDate = new Date(date);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(parsedDate) || parsedDate <= currentDate) return false;

    // Check for duplicates
    if (uniqueDates.has(parsedDate.toISOString())) return false;
    uniqueDates.add(parsedDate.toISOString());
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
