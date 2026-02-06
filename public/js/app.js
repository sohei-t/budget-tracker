/**
 * Application Entry Point
 *
 * Initializes the SPA: router, store subscriptions, theme, shortcuts.
 * @module app
 */

import { initRouter } from './router.js';
import { getState, subscribe } from './store.js';
import { initShortcuts, toggleTheme, toggleShortcutsDialog } from './utils/shortcuts.js';
import { initSearchBar } from './components/searchBar.js';
import { initDashboard } from './components/dashboard.js';
import { initTaskList } from './components/taskList.js';
import { initTaskDetail } from './components/taskDetail.js';
import { initTaskNew, initTaskEdit } from './components/taskForm.js';

/**
 * Initialize the application.
 */
function init() {
  // Apply saved theme
  const savedTheme = localStorage.getItem('bt-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Initialize modules
  initRouter();
  initShortcuts();
  initSearchBar();

  // Subscribe to route changes
  subscribe(['route'], handleRouteChange);

  // Theme toggle button
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Shortcuts dialog button
  const shortcutsBtn = document.getElementById('shortcutsToggle');
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', toggleShortcutsDialog);
  }

  // Shortcuts dialog close button
  const shortcutsClose = document.getElementById('shortcutsClose');
  if (shortcutsClose) {
    shortcutsClose.addEventListener('click', () => {
      const dialog = document.getElementById('shortcutsDialog');
      if (dialog) dialog.hidden = true;
    });
  }
}

/**
 * Handle route changes and render the appropriate page.
 */
async function handleRouteChange() {
  const { route } = getState();
  const { page, params } = route;
  const main = document.getElementById('mainContent');

  // Reset content (keep spinner)
  const spinner = main.querySelector('.loading-spinner');
  main.innerHTML = '';
  if (spinner) main.appendChild(spinner);

  switch (page) {
    case 'dashboard':
      await initDashboard();
      break;
    case 'tasks':
      await initTaskList();
      break;
    case 'taskDetail':
      await initTaskDetail(params.id);
      break;
    case 'taskNew':
      await initTaskNew();
      break;
    case 'taskEdit':
      await initTaskEdit(params.id);
      break;
    default:
      await initDashboard();
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
