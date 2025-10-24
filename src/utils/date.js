/**
 * Date and Timestamp Utilities
 * Unix timestamp helpers for consistent time handling
 */

/**
 * Get current Unix timestamp in milliseconds
 * @returns {number} Current timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Convert Date object to Unix timestamp (milliseconds)
 * @param {Date} date - Date object
 * @returns {number} Unix timestamp
 */
export function toTimestamp(date) {
  return date.getTime();
}

/**
 * Convert Unix timestamp to Date object
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {Date} Date object
 */
export function fromTimestamp(timestamp) {
  return new Date(timestamp);
}

/**
 * Format timestamp as human-readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} format - Format option: 'short', 'long', 'time'
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp, format = 'short') {
  const date = new Date(timestamp);

  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleString();
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toISOString();
  }
}

/**
 * Check if timestamp is within last N days
 * @param {number} timestamp - Unix timestamp to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within range
 */
export function isWithinDays(timestamp, days) {
  const cutoff = now() - days * 24 * 60 * 60 * 1000;
  return timestamp > cutoff;
}

/**
 * Get timestamp N days ago
 * @param {number} days - Number of days in the past
 * @returns {number} Unix timestamp
 */
export function daysAgo(days) {
  return now() - days * 24 * 60 * 60 * 1000;
}
