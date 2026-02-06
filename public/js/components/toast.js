/**
 * Toast Notification Component
 *
 * Displays temporary feedback messages to the user.
 * @module components/toast
 */

/**
 * Show a toast notification.
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast__message">${escapeForToast(message)}</span>
    <button class="toast__close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast) {
  toast.style.animation = 'slideOutRight 0.25s ease forwards';
  toast.addEventListener('animationend', () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  });
}

function escapeForToast(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
