/**
 * Hash-based SPA Router
 *
 * Maps URL hash fragments to page components.
 * Routes: #/dashboard, #/tasks, #/tasks/:id, #/tasks/new, #/tasks/:id/edit
 * @module router
 */

import { setState, getState } from './store.js';

const routes = [
  { pattern: /^#\/tasks\/new$/, page: 'taskNew', params: () => ({}) },
  { pattern: /^#\/tasks\/(\d+)\/edit$/, page: 'taskEdit', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/tasks\/(\d+)$/, page: 'taskDetail', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/tasks$/, page: 'tasks', params: () => ({}) },
  { pattern: /^#\/dashboard$/, page: 'dashboard', params: () => ({}) },
  { pattern: /^#\/$/, page: 'dashboard', params: () => ({}) },
];

/**
 * Resolve current hash to a route.
 * @param {string} hash - Current location hash
 * @returns {Object} { page, params }
 */
function resolveRoute(hash) {
  if (!hash || hash === '#' || hash === '') {
    return { page: 'dashboard', params: {} };
  }

  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      return { page: route.page, params: route.params(match) };
    }
  }

  return { page: 'dashboard', params: {} };
}

/**
 * Handle hash change events.
 */
function handleHashChange() {
  const route = resolveRoute(window.location.hash);
  setState({ route, error: null });
  updateNavLinks(route.page);
}

/**
 * Update active state on navigation links.
 * @param {string} currentPage - Current page name
 */
function updateNavLinks(currentPage) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkRoute = link.dataset.route;
    const isActive =
      (linkRoute === 'dashboard' && currentPage === 'dashboard') ||
      (linkRoute === 'tasks' && currentPage.startsWith('task'));
    link.classList.toggle('active', isActive);
  });
}

/**
 * Programmatically navigate to a route.
 * @param {string} hash - Target hash (e.g., '#/tasks/1')
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Initialize the router.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}
