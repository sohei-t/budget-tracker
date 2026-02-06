/**
 * Task List Component
 *
 * Displays a hierarchical list of all tasks with expand/collapse.
 * @module components/taskList
 */

import { escapeHtml, setHTML, showLoading, hideLoading } from '../utils/dom.js';
import { getState, setState } from '../store.js';
import { navigate } from '../router.js';
import * as api from '../api.js';
import { renderTaskRow } from './taskRow.js';
import { showToast } from './toast.js';

const expandedIds = new Set();

/**
 * Initialize the task list page.
 */
export async function initTaskList() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  showLoading();
  try {
    const res = await api.getTasks();
    setState({ tasks: res.data || [] });
  } catch (err) {
    showToast('Failed to load tasks: ' + err.message, 'error');
    setState({ tasks: [] });
  }
  hideLoading();

  renderTaskList();
}

/**
 * Render the task list view.
 */
function renderTaskList() {
  const main = document.getElementById('mainContent');
  const { tasks } = getState();

  if (!tasks || tasks.length === 0) {
    setHTML(main, `
      <div class="task-list-page">
        <div class="task-list-page__header">
          <h2 class="task-list-page__title">Tasks</h2>
          <div class="task-list-page__actions">
            <a href="#/tasks/new" class="btn btn--primary">+ New Task</a>
          </div>
        </div>
        <div class="empty-state">
          <div class="empty-state__icon">&#128203;</div>
          <div class="empty-state__text">No tasks yet</div>
          <p class="text-muted mb-4">Create your first task to get started with budget tracking.</p>
          <a href="#/tasks/new" class="btn btn--primary btn--lg">Create Task</a>
        </div>
      </div>
    `);
    return;
  }

  // Build tree structure
  const topLevel = tasks.filter(t => !t.parent_id);
  const rows = [];
  buildRows(topLevel, tasks, rows);

  setHTML(main, `
    <div class="task-list-page">
      <div class="task-list-page__header">
        <h2 class="task-list-page__title">Tasks</h2>
        <div class="task-list-page__actions">
          <button class="btn btn--secondary" id="expandAllBtn">Expand All</button>
          <button class="btn btn--secondary" id="collapseAllBtn">Collapse All</button>
          <a href="#/tasks/new" class="btn btn--primary">+ New Task</a>
        </div>
      </div>
      <div class="task-table" role="table" aria-label="Task list">
        <div class="task-table__header" role="row">
          <div role="columnheader">Name</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Progress</div>
          <div role="columnheader">Schedule</div>
          <div role="columnheader">Alert</div>
        </div>
        <div id="taskRows">
          ${rows.join('')}
        </div>
      </div>
    </div>
  `);

  attachListHandlers();
}

/**
 * Build flat rows from hierarchical tasks.
 */
function buildRows(topTasks, allTasks, rows) {
  for (const task of topTasks) {
    rows.push(renderTaskRow(task));
    if (expandedIds.has(String(task.id))) {
      const children = allTasks.filter(t => t.parent_id === task.id);
      if (children.length > 0) {
        for (const child of children) {
          rows.push(renderTaskRow(child));
          if (expandedIds.has(String(child.id))) {
            const grandchildren = allTasks.filter(t => t.parent_id === child.id);
            for (const gc of grandchildren) {
              rows.push(renderTaskRow(gc));
            }
          }
        }
      }
    }
  }
}

/**
 * Attach click handlers using event delegation (single listener on container).
 */
function attachListHandlers() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const taskRows = document.getElementById('taskRows');
  if (taskRows) {
    // Single delegated event handler for all task row interactions
    taskRows.addEventListener('click', async (e) => {
      // Handle toggle button clicks
      const toggleBtn = e.target.closest('.task-row__toggle');
      if (toggleBtn) {
        e.stopPropagation();
        const id = toggleBtn.dataset.toggleId;
        if (expandedIds.has(id)) {
          expandedIds.delete(id);
          toggleBtn.classList.remove('expanded');
        } else {
          expandedIds.add(id);
          toggleBtn.classList.add('expanded');
          // Load children if needed
          const { tasks } = getState();
          const hasChildren = tasks.some(t => String(t.parent_id) === id);
          if (!hasChildren) {
            try {
              const res = await api.getChildren(id);
              if (res.data && res.data.length > 0) {
                const existing = new Set(tasks.map(t => t.id));
                const newTasks = res.data.filter(t => !existing.has(t.id));
                setState({ tasks: [...tasks, ...newTasks] });
              }
            } catch (err) {
              showToast('Failed to load children', 'error');
            }
          }
        }
        renderTaskList();
        return;
      }

      // Handle row click -> navigate to detail
      const row = e.target.closest('.task-row');
      if (row && row.dataset.taskId) {
        navigate(`#/tasks/${row.dataset.taskId}`);
      }
    });
  }

  // Update toggle states
  main.querySelectorAll('.task-row__toggle').forEach(btn => {
    if (expandedIds.has(btn.dataset.toggleId)) {
      btn.classList.add('expanded');
    }
  });

  // Expand/Collapse all
  const expandAll = document.getElementById('expandAllBtn');
  const collapseAll = document.getElementById('collapseAllBtn');

  if (expandAll) {
    expandAll.addEventListener('click', async () => {
      const { tasks } = getState();
      // Load all children first
      const parentIds = tasks.filter(t => t.children_count > 0).map(t => String(t.id));
      for (const pid of parentIds) {
        expandedIds.add(pid);
        const hasChildren = tasks.some(t => String(t.parent_id) === pid);
        if (!hasChildren) {
          try {
            const res = await api.getChildren(pid);
            if (res.data && res.data.length > 0) {
              const existing = new Set(tasks.map(t => t.id));
              const newTasks = res.data.filter(t => !existing.has(t.id));
              if (newTasks.length > 0) {
                const current = getState().tasks;
                setState({ tasks: [...current, ...newTasks] });
              }
            }
          } catch (err) { /* ignore */ }
        }
      }
      // Re-check after loading
      const updatedTasks = getState().tasks;
      updatedTasks.filter(t => t.children_count > 0).forEach(t => expandedIds.add(String(t.id)));
      renderTaskList();
    });
  }

  if (collapseAll) {
    collapseAll.addEventListener('click', () => {
      expandedIds.clear();
      renderTaskList();
    });
  }
}
