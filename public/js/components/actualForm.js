/**
 * Actual Entry Form Component
 *
 * Inline form for recording daily work hours on leaf tasks.
 * @module components/actualForm
 */

import { escapeHtml, setHTML } from '../utils/dom.js';
import { today } from '../utils/dates.js';
import * as api from '../api.js';
import { showToast } from './toast.js';
import { initTaskDetail } from './taskDetail.js';

/**
 * Initialize the actual recording form.
 * @param {string|number} taskId - Task ID
 */
export function initActualForm(taskId) {
  const container = document.getElementById('actualFormContainer');
  if (!container) return;

  setHTML(container, `
    <form id="actualForm" class="flex gap-4 items-center" style="flex-wrap: wrap;">
      <div class="form-group" style="margin-bottom: 0; flex: 0 0 auto;">
        <label class="form-label" for="actualDate">Date</label>
        <input type="date" id="actualDate" class="form-input" value="${today()}" style="width: 160px;">
      </div>
      <div class="form-group" style="margin-bottom: 0; flex: 0 0 auto;">
        <label class="form-label" for="actualHours">Hours</label>
        <input type="number" id="actualHours" class="form-input" min="0.5" max="24" step="0.5" placeholder="0.0" style="width: 100px;" required>
      </div>
      <div class="form-group" style="margin-bottom: 0; flex: 1 1 auto; min-width: 150px;">
        <label class="form-label" for="actualNote">Note</label>
        <input type="text" id="actualNote" class="form-input" maxlength="500" placeholder="What did you work on?">
      </div>
      <div style="padding-top: 20px;">
        <button type="submit" class="btn btn--primary">Record</button>
      </div>
    </form>
  `);

  const form = document.getElementById('actualForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const hoursInput = document.getElementById('actualHours');
      const hours = parseFloat(hoursInput.value);
      if (!hours || hours <= 0) {
        showToast('Please enter valid hours', 'warning');
        hoursInput.focus();
        return;
      }

      const data = {
        work_date: document.getElementById('actualDate').value,
        actual_hours: hours,
        notes: document.getElementById('actualNote').value.trim() || '',
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording...';

      try {
        await api.recordActual(taskId, data);
        showToast('Work recorded', 'success');
        // Refresh the detail view
        initTaskDetail(taskId);
      } catch (err) {
        showToast('Failed to record: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record';
      }
    });
  }
}
