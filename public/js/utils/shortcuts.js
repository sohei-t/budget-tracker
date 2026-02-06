/**
 * Keyboard Shortcuts Manager
 *
 * Registers global keyboard shortcuts for navigation and actions.
 * @module utils/shortcuts
 */

import { navigate } from '../router.js';

let lastKey = null;
let lastKeyTime = 0;

/**
 * Initialize keyboard shortcuts.
 */
export function initShortcuts() {
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Handle keydown events.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  // Ignore when typing in inputs/textareas
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    if (e.key === 'Escape') {
      e.target.blur();
    }
    return;
  }

  const now = Date.now();
  const isCombo = now - lastKeyTime < 800;

  // Ctrl/Cmd combos
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      toggleSearch();
      return;
    }
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      toggleTheme();
      return;
    }
    return;
  }

  // Two-key combos (g+d, g+t)
  if (isCombo && lastKey === 'g') {
    if (e.key === 'd') { navigate('#/dashboard'); }
    else if (e.key === 't') { navigate('#/tasks'); }
    lastKey = null;
    return;
  }

  // Single key shortcuts
  switch (e.key) {
    case '?':
      e.preventDefault();
      toggleShortcutsDialog();
      break;
    case 'n':
    case 'N':
      navigate('#/tasks/new');
      break;
    case 'Escape':
      closeAllOverlays();
      break;
    case 'g':
      // Start of two-key combo
      break;
  }

  lastKey = e.key;
  lastKeyTime = now;
}

function toggleSearch() {
  const dropdown = document.getElementById('searchDropdown');
  const input = document.getElementById('searchInput');
  if (!dropdown) return;

  const isHidden = dropdown.hidden;
  dropdown.hidden = !isHidden;
  if (!isHidden) {
    input.value = '';
    const results = document.getElementById('searchResults');
    if (results) results.innerHTML = '';
  } else {
    input.focus();
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('bt-theme', next);
}

function toggleShortcutsDialog() {
  const dialog = document.getElementById('shortcutsDialog');
  if (dialog) {
    dialog.hidden = !dialog.hidden;
  }
}

function closeAllOverlays() {
  const modal = document.getElementById('modalOverlay');
  if (modal && !modal.hidden) { modal.hidden = true; return; }

  const shortcuts = document.getElementById('shortcutsDialog');
  if (shortcuts && !shortcuts.hidden) { shortcuts.hidden = true; return; }

  const search = document.getElementById('searchDropdown');
  if (search && !search.hidden) {
    search.hidden = true;
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    return;
  }
}

export { toggleSearch, toggleTheme, toggleShortcutsDialog, closeAllOverlays };
