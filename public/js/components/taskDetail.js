/**
 * Task Detail Component
 *
 * Displays full task information, children, and actuals recording.
 * @module components/taskDetail
 */

import { escapeHtml, setHTML, showLoading, hideLoading } from '../utils/dom.js';
import { formatDate, formatHours, toInputDate, today } from '../utils/dates.js';
import { getState, setState } from '../store.js';
import { navigate } from '../router.js';
import * as api from '../api.js';
import { renderProgressBar } from './progressBar.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { renderStatusBadge } from './taskRow.js';
import { showToast } from './toast.js';
import { showConfirm } from './modal.js';
import { initActualForm } from './actualForm.js';

/**
 * Initialize the task detail page.
 * @param {string} taskId - Task ID from route params
 */
export async function initTaskDetail(taskId) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  showLoading();
  try {
    const [taskRes, actualsRes] = await Promise.all([
      api.getTask(taskId),
      api.getActuals(taskId).catch(() => ({ data: [] })),
    ]);

    const task = taskRes.data;
    setState({ currentTask: task });

    // Load children if any
    let children = [];
    if (task.children_count > 0) {
      try {
        const childRes = await api.getChildren(taskId);
        children = childRes.data || [];
      } catch (e) { /* ignore */ }
    }

    renderTaskDetail(task, actualsRes.data || [], children);
  } catch (err) {
    hideLoading();
    showToast('Failed to load task: ' + err.message, 'error');
    setHTML(main, `
      <div class="empty-state">
        <div class="empty-state__icon">&#9888;</div>
        <div class="empty-state__text">Task not found</div>
        <a href="#/tasks" class="btn btn--secondary">Back to Tasks</a>
      </div>
    `);
    return;
  }
  hideLoading();
}

/**
 * Render the task detail view.
 */
function renderTaskDetail(task, actuals, children) {
  const main = document.getElementById('mainContent');
  const progress = task.progress_percent != null ? task.progress_percent : 0;
  const warning = task.warning_level || 'none';
  const isLeaf = task.children_count === 0;

  // Build breadcrumbs
  const crumbs = [
    { label: 'Dashboard', href: '#/dashboard' },
    { label: 'Tasks', href: '#/tasks' },
  ];
  if (task.parent_id) {
    crumbs.push({ label: 'Parent', href: `#/tasks/${task.parent_id}` });
  }
  crumbs.push({ label: task.name });

  // Meta info
  const metaItems = [
    { label: 'Status', value: renderStatusBadge(task.status) },
    { label: 'Level', value: `Level ${task.level}` },
    { label: 'Progress Mode', value: task.progress_mode === 'auto' ? 'Automatic' : 'Manual' },
    { label: 'Planned Hours', value: task.planned_effort_hours ? formatHours(task.planned_effort_hours) : '-' },
    { label: 'Start Date', value: formatDate(task.planned_start_date) || '-' },
    { label: 'End Date', value: formatDate(task.planned_end_date) || '-' },
  ];

  if (task.cumulative_actual_hours != null) {
    metaItems.push({ label: 'Actual Hours', value: formatHours(task.cumulative_actual_hours) });
  }

  if (task.delay_days != null && task.delay_days > 0) {
    metaItems.push({ label: 'Delay', value: `${task.delay_days} days overdue` });
  }

  const metaHtml = metaItems.map(m => `
    <div class="meta-item">
      <div class="meta-item__label">${m.label}</div>
      <div class="meta-item__value">${m.value}</div>
    </div>
  `).join('');

  // Children section
  let childrenHtml = '';
  if (children.length > 0) {
    const childRows = children.map(c => `
      <div class="child-item" data-task-id="${c.id}">
        <span>${escapeHtml(c.name)}</span>
        <span>${renderStatusBadge(c.status)}</span>
        <span>${renderProgressBar(c.progress_percent || 0, { showLabel: true, size: 'sm' })}</span>
        <span class="text-xs text-muted">${formatDate(c.planned_end_date) || '-'}</span>
      </div>
    `).join('');
    childrenHtml = `
      <div class="task-detail__section">
        <div class="flex justify-between items-center mb-4">
          <h3 class="task-detail__section-title" style="margin-bottom: 0; border-bottom: none;">Child Tasks (${children.length})</h3>
          ${task.level < 3 ? `<a href="#/tasks/new?parent=${task.id}" class="btn btn--sm btn--secondary">+ Add Child</a>` : ''}
        </div>
        <div class="children-list">${childRows}</div>
      </div>
    `;
  } else if (task.level < 3) {
    childrenHtml = `
      <div class="task-detail__section">
        <h3 class="task-detail__section-title">Child Tasks</h3>
        <div class="empty-state" style="padding: var(--space-6);">
          <p class="text-muted mb-4">No child tasks yet.</p>
          <a href="#/tasks/new?parent=${task.id}" class="btn btn--sm btn--secondary">+ Add Child Task</a>
        </div>
      </div>
    `;
  }

  // Actuals section (leaf tasks only)
  let actualsHtml = '';
  if (isLeaf) {
    const actualsRows = (actuals || []).map(a => `
      <tr data-actual-id="${a.id}">
        <td>${formatDate(a.work_date)}</td>
        <td>${formatHours(a.actual_hours)}</td>
        <td class="text-sm text-muted">${escapeHtml(a.notes || '-')}</td>
        <td class="actuals-table__actions">
          <button class="btn btn--sm btn--ghost actual-delete-btn" data-actual-id="${a.id}" title="Delete">&#10005;</button>
        </td>
      </tr>
    `).join('');

    actualsHtml = `
      <div class="task-detail__section">
        <h3 class="task-detail__section-title">Work Actuals</h3>
        <div id="actualFormContainer" class="card mb-4"></div>
        ${actuals.length > 0 ? `
          <table class="actuals-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hours</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${actualsRows}</tbody>
          </table>
        ` : '<p class="text-muted text-sm">No work recorded yet.</p>'}
      </div>
    `;
  }

  setHTML(main, `
    <div class="task-detail">
      ${renderBreadcrumb(crumbs)}

      <div class="task-detail__header">
        <div class="task-detail__title-section">
          <h2 class="task-detail__title">${escapeHtml(task.name)}</h2>
          ${task.description ? `<p class="text-muted">${escapeHtml(task.description)}</p>` : ''}
        </div>
        <div class="task-detail__actions">
          <a href="#/tasks/${task.id}/edit" class="btn btn--secondary">Edit</a>
          <button class="btn btn--danger" id="deleteTaskBtn">Delete</button>
        </div>
      </div>

      <div class="card mb-4">
        <div class="mb-4">
          ${renderProgressBar(progress, { size: 'lg', showLabel: true, warning })}
        </div>
        <div class="task-detail__meta">${metaHtml}</div>
      </div>

      ${childrenHtml}
      ${actualsHtml}
    </div>
  `);

  attachDetailHandlers(task, actuals);
}

/**
 * Attach event handlers for the detail view.
 */
function attachDetailHandlers(task, actuals) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  // Delete task
  const deleteBtn = document.getElementById('deleteTaskBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm(
        'Delete Task',
        `Are you sure you want to delete "${task.name}"? This will also delete all child tasks.`,
        { confirmText: 'Delete', danger: true }
      );
      if (confirmed) {
        try {
          await api.deleteTask(task.id);
          showToast('Task deleted', 'success');
          navigate('#/tasks');
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
        }
      }
    });
  }

  // Navigate to children
  main.querySelectorAll('.child-item[data-task-id]').forEach(el => {
    el.addEventListener('click', () => navigate(`#/tasks/${el.dataset.taskId}`));
  });

  // Delete actual entries
  main.querySelectorAll('.actual-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actualId = btn.dataset.actualId;
      const confirmed = await showConfirm(
        'Delete Entry',
        'Delete this work entry?',
        { confirmText: 'Delete', danger: true }
      );
      if (confirmed) {
        try {
          await api.deleteActual(actualId);
          showToast('Entry deleted', 'success');
          initTaskDetail(task.id);
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
        }
      }
    });
  });

  // Initialize actual form (leaf tasks only)
  if (task.children_count === 0) {
    initActualForm(task.id);
  }
}
