/**
 * Task Form Component
 *
 * Handles task creation and editing with validation.
 * @module components/taskForm
 */

import { escapeHtml, setHTML, showLoading, hideLoading } from '../utils/dom.js';
import { toInputDate, today } from '../utils/dates.js';
import { getState, setState } from '../store.js';
import { navigate } from '../router.js';
import * as api from '../api.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { showToast } from './toast.js';

/**
 * Initialize the task creation form.
 */
export async function initTaskNew() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  // Check for parent_id in URL query
  const hash = window.location.hash;
  const parentMatch = hash.match(/[?&]parent=(\d+)/);
  const parentId = parentMatch ? parentMatch[1] : null;

  let parentTask = null;
  if (parentId) {
    try {
      const res = await api.getTask(parentId);
      parentTask = res.data;
    } catch (e) { /* ignore */ }
  }

  renderTaskForm({ parentTask, isEdit: false });
}

/**
 * Initialize the task edit form.
 * @param {string} taskId - Task ID
 */
export async function initTaskEdit(taskId) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  showLoading();
  try {
    const res = await api.getTask(taskId);
    const task = res.data;

    let parentTask = null;
    if (task.parent_id) {
      try {
        const pRes = await api.getTask(task.parent_id);
        parentTask = pRes.data;
      } catch (e) { /* ignore */ }
    }

    renderTaskForm({ task, parentTask, isEdit: true });
  } catch (err) {
    showToast('Failed to load task: ' + err.message, 'error');
    navigate('#/tasks');
  }
  hideLoading();
}

/**
 * Render the task form.
 * @param {Object} options - { task, parentTask, isEdit }
 */
function renderTaskForm({ task = null, parentTask = null, isEdit = false }) {
  const main = document.getElementById('mainContent');
  const title = isEdit ? 'Edit Task' : 'New Task';

  const crumbs = [
    { label: 'Dashboard', href: '#/dashboard' },
    { label: 'Tasks', href: '#/tasks' },
  ];
  if (isEdit && task) {
    crumbs.push({ label: task.name, href: `#/tasks/${task.id}` });
    crumbs.push({ label: 'Edit' });
  } else {
    if (parentTask) {
      crumbs.push({ label: parentTask.name, href: `#/tasks/${parentTask.id}` });
    }
    crumbs.push({ label: 'New Task' });
  }

  const name = task ? task.name : '';
  const description = task ? (task.description || '') : '';
  const status = task ? task.status : 'not_started';
  const progressMode = task ? task.progress_mode : 'auto';
  const progressPercent = task ? (task.progress_percent || 0) : 0;
  const plannedHours = task ? (task.planned_effort_hours || '') : '';
  const startDate = task ? toInputDate(task.planned_start_date) : '';
  const endDate = task ? toInputDate(task.planned_end_date) : '';
  const effort = task ? (task.planned_effort_hours || 0) : 0;

  const level = parentTask ? parentTask.level + 1 : 1;
  const showProgressManual = progressMode === 'manual';

  setHTML(main, `
    <div class="task-form">
      ${renderBreadcrumb(crumbs)}
      <h2 class="task-form__title">${title}</h2>

      ${parentTask ? `
        <div class="card mb-4">
          <p class="text-sm text-muted">Parent: <strong>${escapeHtml(parentTask.name)}</strong> (Level ${parentTask.level})</p>
          <p class="text-xs text-muted">This will be a Level ${level} task.</p>
        </div>
      ` : ''}

      <form id="taskForm" novalidate>
        <div class="form-group">
          <label class="form-label" for="taskName">Name <span class="text-danger">*</span></label>
          <input type="text" id="taskName" class="form-input" value="${escapeHtml(name)}" maxlength="200" required aria-required="true">
          <div class="form-error" id="taskNameError"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="taskDescription">Description</label>
          <textarea id="taskDescription" class="form-textarea" maxlength="1000">${escapeHtml(description)}</textarea>
        </div>

        ${isEdit ? `
          <div class="form-group">
            <label class="form-label" for="taskStatus">Status</label>
            <select id="taskStatus" class="form-select">
              <option value="not_started" ${status === 'not_started' ? 'selected' : ''}>Not Started</option>
              <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="on_hold" ${status === 'on_hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>
        ` : ''}

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="taskStartDate">Planned Start Date</label>
            <input type="date" id="taskStartDate" class="form-input" value="${startDate}">
          </div>
          <div class="form-group">
            <label class="form-label" for="taskEndDate">Planned End Date</label>
            <input type="date" id="taskEndDate" class="form-input" value="${endDate}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="taskPlannedHours">Planned Hours</label>
          <input type="number" id="taskPlannedHours" class="form-input" value="${plannedHours}" min="0" step="0.5">
        </div>

        <div class="form-group">
          <label class="form-label" for="taskProgressMode">Progress Mode</label>
          <select id="taskProgressMode" class="form-select">
            <option value="auto" ${progressMode === 'auto' ? 'selected' : ''}>Auto (calculated from actuals)</option>
            <option value="manual" ${progressMode === 'manual' ? 'selected' : ''}>Manual (set percentage manually)</option>
          </select>
        </div>

        <div class="form-group" id="manualProgressGroup" ${showProgressManual ? '' : 'style="display:none"'}>
          <label class="form-label" for="taskProgressPercent">Progress (%)</label>
          <input type="number" id="taskProgressPercent" class="form-input" value="${progressPercent}" min="0" max="100">
        </div>

        <div class="flex gap-4 mt-4">
          <button type="submit" class="btn btn--primary btn--lg">${isEdit ? 'Update Task' : 'Create Task'}</button>
          <button type="button" class="btn btn--secondary btn--lg" id="cancelBtn">Cancel</button>
        </div>
      </form>
    </div>
  `);

  attachFormHandlers(task, parentTask, isEdit);
}

/**
 * Attach form event handlers.
 */
function attachFormHandlers(task, parentTask, isEdit) {
  const form = document.getElementById('taskForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const progressModeSelect = document.getElementById('taskProgressMode');
  const manualGroup = document.getElementById('manualProgressGroup');

  // Toggle manual progress visibility
  if (progressModeSelect) {
    progressModeSelect.addEventListener('change', () => {
      manualGroup.style.display = progressModeSelect.value === 'manual' ? '' : 'none';
    });
  }

  // Cancel
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (isEdit && task) {
        navigate(`#/tasks/${task.id}`);
      } else if (parentTask) {
        navigate(`#/tasks/${parentTask.id}`);
      } else {
        navigate('#/tasks');
      }
    });
  }

  // Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('taskName');
      const nameError = document.getElementById('taskNameError');
      const name = nameInput.value.trim();

      if (!name) {
        nameInput.classList.add('error');
        nameError.textContent = 'Name is required';
        nameInput.focus();
        return;
      }
      nameInput.classList.remove('error');
      nameError.textContent = '';

      const data = {
        name,
        description: document.getElementById('taskDescription').value.trim() || '',
        planned_start_date: document.getElementById('taskStartDate').value || null,
        planned_end_date: document.getElementById('taskEndDate').value || null,
        planned_effort_hours: parseFloat(document.getElementById('taskPlannedHours').value) || 0,
        progress_mode: document.getElementById('taskProgressMode').value,
      };

      if (data.progress_mode === 'manual') {
        data.progress_percent = parseFloat(document.getElementById('taskProgressPercent').value) || 0;
      }

      if (isEdit) {
        const status = document.getElementById('taskStatus');
        if (status) data.status = status.value;
      } else if (parentTask) {
        data.parent_id = parentTask.id;
      }

      // Validate dates
      if (data.planned_start_date && data.planned_end_date) {
        if (data.planned_start_date > data.planned_end_date) {
          showToast('End date must be after start date', 'warning');
          return;
        }
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? 'Updating...' : 'Creating...';

      try {
        if (isEdit) {
          await api.updateTask(task.id, data);
          showToast('Task updated', 'success');
          navigate(`#/tasks/${task.id}`);
        } else {
          const res = await api.createTask(data);
          showToast('Task created', 'success');
          navigate(`#/tasks/${res.data.id}`);
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Update Task' : 'Create Task';
      }
    });
  }
}
