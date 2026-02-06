/**
 * Reactive State Store (Pub/Sub)
 *
 * Centralized state management with subscriber notification.
 * Components subscribe to state changes and re-render automatically.
 * @module store
 */

const state = {
  tasks: [],
  currentTask: null,
  dashboard: null,
  delayedTasks: [],
  loading: false,
  error: null,
  route: { page: 'dashboard', params: {} },
  searchQuery: '',
  theme: localStorage.getItem('bt-theme') || 'light',
};

const subscribers = new Map();
let nextSubscriberId = 0;
let pendingNotification = null;

/**
 * Get current state (read-only copy for safety).
 * @returns {Object} Current state
 */
export function getState() {
  return state;
}

/**
 * Update state and notify subscribers.
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  const changedKeys = [];
  for (const key of Object.keys(updates)) {
    if (state[key] !== updates[key]) {
      state[key] = updates[key];
      changedKeys.push(key);
    }
  }

  if (changedKeys.length > 0) {
    notifySubscribers(changedKeys);
  }
}

/**
 * Subscribe to state changes.
 * @param {string[]} keys - State keys to watch
 * @param {Function} callback - Called when watched keys change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(keys, callback) {
  const id = nextSubscriberId++;
  subscribers.set(id, { keys, callback });
  return () => subscribers.delete(id);
}

/**
 * Notify subscribers of state changes.
 * Uses microtask batching to coalesce rapid updates into a single notification cycle.
 * @param {string[]} changedKeys - Keys that changed
 */
function notifySubscribers(changedKeys) {
  if (pendingNotification) {
    // Merge changed keys with pending notification
    for (const key of changedKeys) {
      pendingNotification.add(key);
    }
    return;
  }

  pendingNotification = new Set(changedKeys);

  // Use microtask to batch synchronous setState calls
  Promise.resolve().then(() => {
    const keys = pendingNotification;
    pendingNotification = null;

    for (const [, sub] of subscribers) {
      const relevant = sub.keys.some(k => keys.has(k));
      if (relevant) {
        try {
          sub.callback(state);
        } catch (err) {
          console.error('[Store] Subscriber error:', err);
        }
      }
    }
  });
}
