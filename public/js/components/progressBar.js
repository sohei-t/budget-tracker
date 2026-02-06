/**
 * Progress Bar Component
 *
 * Renders an accessible progress bar with optional label.
 * @module components/progressBar
 */

import { escapeHtml } from '../utils/dom.js';

/**
 * Render a progress bar HTML string.
 * @param {number} percent - Progress percentage (0-100)
 * @param {Object} options - { size: 'sm'|'md'|'lg', showLabel: boolean, warning: string }
 * @returns {string} HTML string
 */
export function renderProgressBar(percent, options = {}) {
  const { size = 'md', showLabel = true, warning = 'none' } = options;
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const rounded = Math.round(clamped);

  let fillClass = '';
  if (warning === 'red') fillClass = 'progress-bar__fill--danger';
  else if (warning === 'yellow') fillClass = 'progress-bar__fill--warning';
  else if (clamped >= 100) fillClass = 'progress-bar__fill--success';

  const sizeClass = size === 'lg' ? 'progress-bar--lg' : '';

  return `
    <div class="flex items-center gap-2">
      <div class="progress-bar ${sizeClass}" role="progressbar"
           aria-valuenow="${rounded}" aria-valuemin="0" aria-valuemax="100"
           aria-label="Progress: ${rounded}%">
        <div class="progress-bar__fill ${fillClass}" style="width: ${rounded}%"></div>
      </div>
      ${showLabel ? `<span class="progress-text">${rounded}%</span>` : ''}
    </div>
  `;
}
