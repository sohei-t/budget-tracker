/**
 * DOM Utility Functions
 *
 * Helpers for creating elements, escaping HTML, and DOM manipulation.
 * @module utils/dom
 */

/**
 * Escape HTML entities to prevent XSS.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  const s = String(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return s.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Create an HTML element from a template string.
 * @param {string} html - HTML string
 * @returns {HTMLElement} Created element
 */
export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * Set inner HTML of an element safely.
 * @param {HTMLElement} el - Target element
 * @param {string} html - HTML to set
 */
export function setHTML(el, html) {
  el.innerHTML = html;
}

/**
 * Show the loading spinner.
 */
export function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.classList.add('active');
}

/**
 * Hide the loading spinner.
 */
export function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.classList.remove('active');
}
