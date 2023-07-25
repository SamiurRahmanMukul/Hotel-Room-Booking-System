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
 * @param {Array} array - The array of dates to be validated.
 * @returns {boolean} - Returns true if the array contains valid future dates without duplicates, otherwise false.
 */
const validateBookingDates = (array) => {
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

module.exports = validateBookingDates;
