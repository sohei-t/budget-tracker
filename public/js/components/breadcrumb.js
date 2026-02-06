/**
 * Breadcrumb Component
 *
 * Renders navigation breadcrumbs for task hierarchy.
 * @module components/breadcrumb
 */

import { escapeHtml } from '../utils/dom.js';

/**
 * Render breadcrumb trail.
 * @param {Array} items - Array of { label, href } objects (last item is current)
 * @returns {string} HTML string
 */
export function renderBreadcrumb(items) {
  if (!items || items.length === 0) return '';

  const crumbs = items.map((item, i) => {
    const isLast = i === items.length - 1;
    if (isLast) {
      return `<span class="breadcrumb__item breadcrumb__item--current" aria-current="page">${escapeHtml(item.label)}</span>`;
    }
    return `
      <a href="${escapeHtml(item.href)}" class="breadcrumb__item">${escapeHtml(item.label)}</a>
      <span class="breadcrumb__separator" aria-hidden="true">/</span>
    `;
  });

  return `<nav class="breadcrumb" aria-label="Breadcrumb">${crumbs.join('')}</nav>`;
}
