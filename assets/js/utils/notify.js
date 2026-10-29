// Notificaciones flotantes tipo Toast
let toastContainer = null;

function ensureContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  return toastContainer;
}

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Cerrar">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  toast.classList.remove('toast--visible');
  toast.classList.add('toast--exit');
  toast.addEventListener('transitionend', () => {
    toast.remove();
  }, { once: true });
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 500);
}
