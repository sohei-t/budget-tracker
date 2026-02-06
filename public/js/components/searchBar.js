/**
 * Search Bar Component
 *
 * Provides real-time task search with keyboard navigation.
 * @module components/searchBar
 */

import { escapeHtml, debounce } from '../utils/dom.js';
import { getState } from '../store.js';
import { navigate } from '../router.js';

let focusIndex = -1;

/**
 * Initialize search bar event listeners.
 */
export function initSearchBar() {
  const toggle = document.getElementById('searchToggle');
  const dropdown = document.getElementById('searchDropdown');
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  if (!toggle || !dropdown || !input || !results) return;

  toggle.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
    if (!dropdown.hidden) {
      input.focus();
    } else {
      input.value = '';
      results.innerHTML = '';
    }
  });

  const debouncedSearch = debounce((value) => performSearch(value), 150);
  input.addEventListener('input', () => debouncedSearch(input.value));

  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex = Math.min(focusIndex + 1, items.length - 1);
      updateFocus(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex = Math.max(focusIndex - 1, 0);
      updateFocus(items);
    } else if (e.key === 'Enter' && focusIndex >= 0 && items[focusIndex]) {
      e.preventDefault();
      items[focusIndex].click();
    } else if (e.key === 'Escape') {
      dropdown.hidden = true;
      input.value = '';
      results.innerHTML = '';
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== toggle) {
      dropdown.hidden = true;
      input.value = '';
      results.innerHTML = '';
    }
  });
}

/**
 * Perform search against current tasks state.
 * @param {string} query - Search query
 */
function performSearch(query) {
  const results = document.getElementById('searchResults');
  if (!results) return;

  focusIndex = -1;

  if (!query || query.length < 1) {
    results.innerHTML = '';
    return;
  }

  const { tasks } = getState();
  const q = query.toLowerCase();
  const matches = (tasks || []).filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.description && t.description.toLowerCase().includes(q))
  ).slice(0, 10);

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-result-item text-muted">No results found</div>';
    return;
  }

  results.innerHTML = matches.map(task => `
    <div class="search-result-item" data-task-id="${task.id}" role="option">
      <div class="search-result-item__name">${escapeHtml(task.name)}</div>
      <div class="search-result-item__path">Level ${task.level} &middot; ${escapeHtml(task.status)}</div>
    </div>
  `).join('');

  // Use event delegation on the results container (single listener)
  results.onclick = (e) => {
    const item = e.target.closest('.search-result-item[data-task-id]');
    if (!item) return;
    const id = item.dataset.taskId;
    navigate(`#/tasks/${id}`);
    const dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.hidden = true;
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    results.innerHTML = '';
  };
}

function updateFocus(items) {
  items.forEach((item, i) => {
    item.classList.toggle('focused', i === focusIndex);
  });
}
