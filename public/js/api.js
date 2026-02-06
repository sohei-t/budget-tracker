/**
 * API Client Module
 *
 * Handles all HTTP communication with the backend REST API.
 * Provides typed methods for CRUD operations on tasks, actuals, and dashboard.
 * @module api
 */

const BASE_URL = '/api';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || `HTTP ${response.status}`);
    error.code = data.error?.code || 'UNKNOWN';
    error.status = response.status;
    error.details = data.error?.details || [];
    throw error;
  }

  return data;
}

// --- Tasks API ---

export async function getTasks() {
  return request('/tasks');
}

export async function getTask(id) {
  return request(`/tasks/${id}`);
}

export async function getChildren(parentId) {
  return request(`/tasks/${parentId}/children`);
}

export async function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id, data) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function reorderTask(id, newOrder) {
  return request(`/tasks/${id}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ sort_order: newOrder }),
  });
}

// --- Actuals API ---

export async function getActuals(taskId) {
  return request(`/tasks/${taskId}/actuals`);
}

export async function recordActual(taskId, data) {
  return request(`/tasks/${taskId}/actuals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateActual(actualId, data) {
  return request(`/actuals/${actualId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteActual(actualId) {
  return request(`/actuals/${actualId}`, { method: 'DELETE' });
}

// --- Dashboard API ---

export async function getDashboardSummary() {
  return request('/dashboard');
}

export async function getDelayedTasks() {
  return request('/dashboard/delays');
}
