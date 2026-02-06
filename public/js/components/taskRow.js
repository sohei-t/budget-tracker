/**
 * Task Row Component
 *
 * Renders a single row in the task list with expandable children.
 * @module components/taskRow
 */

import { escapeHtml } from '../utils/dom.js';
import { formatDate } from '../utils/dates.js';
import { renderProgressBar } from './progressBar.js';

/**
 * Render a task row HTML string.
 * @param {Object} task - Task object with computed fields
 * @returns {string} HTML string
 */
export function renderTaskRow(task) {
  const level = task.level || 1;
  const levelClass = `task-row--level-${level}`;
  const hasChildren = task.children_count > 0;
  const progress = task.progress_percent != null ? task.progress_percent : 0;
  const warning = task.warning_level || 'none';
  const status = task.status || 'not_started';

  const toggleBtn = hasChildren
    ? `<button class="task-row__toggle" data-toggle-id="${task.id}" aria-label="Toggle children" aria-expanded="false">&#9654;</button>`
    : `<span style="width: 24px; display: inline-block;"></span>`;

  const warningDot = warning === 'red'
    ? '<span class="warning-indicator warning-indicator--red" title="Overdue"></span>'
    : warning === 'yellow'
      ? '<span class="warning-indicator warning-indicator--yellow" title="At Risk"></span>'
      : '<span class="warning-indicator warning-indicator--none" title="On Track"></span>';

  const statusBadge = renderStatusBadge(status);
  const dateDisplay = task.planned_start_date
    ? `${formatDate(task.planned_start_date)} - ${formatDate(task.planned_end_date)}`
    : '-';

  return `
    <div class="task-row ${levelClass}" data-task-id="${task.id}" data-level="${level}" role="row">
      <div class="task-row__name">
        ${toggleBtn}
        <span class="task-row__name-text" title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</span>
      </div>
      <div class="task-row__status">${statusBadge}</div>
      <div class="task-row__progress">${renderProgressBar(progress, { showLabel: true, warning, size: 'sm' })}</div>
      <div class="task-row__dates">${escapeHtml(dateDisplay)}</div>
      <div class="task-row__warning">${warningDot}</div>
    </div>
  `;
}

/**
 * Render a status badge.
 * @param {string} status
 * @returns {string} HTML string
 */
function renderStatusBadge(status) {
  const map = {
    not_started: { label: 'Not Started', cls: 'badge--secondary' },
    in_progress: { label: 'In Progress', cls: 'badge--primary' },
    completed: { label: 'Completed', cls: 'badge--success' },
    on_hold: { label: 'On Hold', cls: 'badge--warning' },
  };
  const info = map[status] || map.not_started;
  return `<span class="badge ${info.cls}">${info.label}</span>`;
}

export { renderStatusBadge };
