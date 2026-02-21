/**
 * Dashboard Component
 *
 * Displays overall project summary, progress, and delay information.
 * @module components/dashboard
 */

import { escapeHtml, setHTML, showLoading, hideLoading } from '../utils/dom.js';
import { getState, setState, subscribe } from '../store.js';
import { navigate } from '../router.js';
import * as api from '../api.js';
import { renderProgressBar } from './progressBar.js';
import { showToast } from './toast.js';

/**
 * Initialize the dashboard component.
 */
export async function initDashboard() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  showLoading();
  try {
    const [summaryRes, delaysRes] = await Promise.all([
      api.getDashboardSummary(),
      api.getDelayedTasks(),
    ]);
    setState({
      dashboard: summaryRes.data,
      delayedTasks: delaysRes.data || [],
    });
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
    setState({ dashboard: null, delayedTasks: [] });
  }
  hideLoading();

  renderDashboard();
}

/**
 * Render the dashboard view.
 */
function renderDashboard() {
  const main = document.getElementById('mainContent');
  const { dashboard, delayedTasks } = getState();

  if (!dashboard) {
    setHTML(main, `
      <div class="dashboard">
        <div class="empty-state">
          <div class="empty-state__icon">&#128202;</div>
          <div class="empty-state__text">No data available</div>
          <a href="#/tasks/new" class="btn btn--primary btn--lg">Create First Task</a>
        </div>
      </div>
    `);
    return;
  }

  const { total_tasks, completed_tasks, in_progress_tasks, not_started_tasks,
    overall_progress_percent, overdue_count, at_risk_count, major_items } = dashboard;

  const delayItems = (delayedTasks || []).map(task => {
    const isRisk = task.delay_status === 'at_risk';
    return `
      <div class="delay-item ${isRisk ? 'delay-item--at-risk' : ''}" data-task-id="${task.id}">
        <div class="delay-item__info">
          <div class="delay-item__name">${escapeHtml(task.name)}</div>
          <div class="delay-item__meta">
            Level ${task.level} &middot; ${task.delay_days ? task.delay_days + ' days overdue' : 'At risk'}
          </div>
        </div>
        <div class="delay-item__status">
          ${renderProgressBar(task.progress_percent || 0, { showLabel: true, warning: isRisk ? 'yellow' : 'red', size: 'sm' })}
        </div>
      </div>
    `;
  }).join('');

  const majorItemsHtml = (major_items || []).map(item => `
    <div class="major-item" data-task-id="${item.id}">
      <span class="major-item__name">${escapeHtml(item.name)}</span>
      <div class="major-item__progress">
        ${renderProgressBar(item.progress_percent || 0, { showLabel: true, size: 'sm' })}
      </div>
      <span class="badge ${item.status === 'completed' ? 'badge--success' : item.status === 'in_progress' ? 'badge--primary' : 'badge--secondary'}">${escapeHtml(item.status)}</span>
    </div>
  `).join('');

  setHTML(main, `
    <div class="dashboard">
      <div class="dashboard__header">
        <h2 class="dashboard__title">Dashboard</h2>
        <a href="#/tasks/new" class="btn btn--primary">+ New Task</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__value">${total_tasks || 0}</div>
          <div class="stat-card__label">Total Tasks</div>
        </div>
        <div class="stat-card stat-card--success">
          <div class="stat-card__value">${completed_tasks || 0}</div>
          <div class="stat-card__label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${in_progress_tasks || 0}</div>
          <div class="stat-card__label">In Progress</div>
        </div>
        <div class="stat-card ${overdue_count > 0 ? 'stat-card--danger' : ''}">
          <div class="stat-card__value">${overdue_count || 0}</div>
          <div class="stat-card__label">Overdue</div>
        </div>
      </div>

      <div class="dashboard-section">
        <h3 class="dashboard-section__title">Overall Progress</h3>
        <div class="card">
          ${renderProgressBar(overall_progress_percent || 0, { size: 'lg', showLabel: true })}
        </div>
      </div>

      ${delayItems.length > 0 ? `
        <div class="dashboard-section">
          <h3 class="dashboard-section__title">Delayed &amp; At-Risk Tasks</h3>
          <div class="delay-list">${delayItems}</div>
        </div>
      ` : ''}

      ${majorItemsHtml.length > 0 ? `
        <div class="dashboard-section">
          <h3 class="dashboard-section__title">Major Items</h3>
          <div class="major-items">${majorItemsHtml}</div>
        </div>
      ` : ''}
    </div>
  `);

  // Use event delegation for navigation (single listener instead of N listeners)
  main.addEventListener('click', (e) => {
    const target = e.target.closest('[data-task-id]');
    if (target) {
      navigate(`#/tasks/${target.dataset.taskId}`);
    }
  });
}
