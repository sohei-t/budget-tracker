/**
 * Modal Component
 *
 * Generic modal dialog for confirmations and forms.
 * @module components/modal
 */

/**
 * Show a confirmation modal.
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {Object} options - { confirmText, cancelText, danger }
 * @returns {Promise<boolean>} Resolves true if confirmed
 */
export function showConfirm(title, message, options = {}) {
  const { confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = options;

  return new Promise((resolve) => {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');
    const closeBtn = document.getElementById('modalClose');

    if (!overlay) { resolve(false); return; }

    titleEl.textContent = title;
    bodyEl.innerHTML = `<p>${escapeForModal(message)}</p>`;
    footerEl.innerHTML = `
      <button class="btn btn--secondary" id="modalCancelBtn">${escapeForModal(cancelText)}</button>
      <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" id="modalConfirmBtn">${escapeForModal(confirmText)}</button>
    `;

    overlay.hidden = false;

    function cleanup(result) {
      overlay.hidden = true;
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
      closeBtn.removeEventListener('click', onCancel);
      resolve(result);
    }

    const cancelBtn = document.getElementById('modalCancelBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    function onCancel() { cleanup(false); }
    function onConfirm() { cleanup(true); }

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    closeBtn.addEventListener('click', onCancel);

    confirmBtn.focus();
  });
}

function escapeForModal(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
