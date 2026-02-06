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

/**
 * Debounce a function call.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function call.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum interval in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
  let lastCall = 0;
  let timer = null;
  return function(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);
    clearTimeout(timer);
    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Batch DOM updates using DocumentFragment.
 * @param {HTMLElement} container - Container to append to
 * @param {string[]} htmlItems - Array of HTML strings to add
 */
export function batchAppend(container, htmlItems) {
  const fragment = document.createDocumentFragment();
  const template = document.createElement('template');
  for (const html of htmlItems) {
    template.innerHTML = html.trim();
    const node = template.content.firstChild;
    if (node) fragment.appendChild(node);
  }
  container.appendChild(fragment);
}
