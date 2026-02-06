/**
 * Date Utility Functions
 *
 * Format dates, calculate durations, and date math.
 * @module utils/dates
 */

/**
 * Format a date string to a display format (YYYY/MM/DD).
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {string} Formatted date or empty string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * Format a date for input[type=date] (YYYY-MM-DD).
 * @param {string} dateStr - Date string
 * @returns {string} YYYY-MM-DD formatted date
 */
export function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 * @returns {string}
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days between two dates.
 * @param {string} dateA - Start date
 * @param {string} dateB - End date
 * @returns {number} Number of days (can be negative)
 */
export function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format hours for display.
 * @param {number} hours - Hours value
 * @returns {string} Formatted string (e.g., "12.5h")
 */
export function formatHours(hours) {
  if (hours == null) return '0h';
  return `${Number(hours).toFixed(1)}h`;
}
