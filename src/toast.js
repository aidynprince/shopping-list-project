export class Toast {
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  show(message, { type = 'info', duration = 4000, action, actionLabel } = {}) {
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      info: 'fa-circle-info',
    };

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      ${action && actionLabel ? `<button class="toast-action">${this.escapeHtml(actionLabel)}</button>` : ''}
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    if (action && actionLabel) {
      el.querySelector('.toast-action').addEventListener('click', () => {
        action();
        this.dismiss(el);
      });
    }

    el.querySelector('.toast-close').addEventListener('click', () => this.dismiss(el));

    this.container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));

    if (duration > 0) {
      setTimeout(() => this.dismiss(el), duration);
    }

    return el;
  }

  success(message, opts = {}) {
    return this.show(message, { ...opts, type: 'success' });
  }

  error(message, opts = {}) {
    return this.show(message, { ...opts, type: 'error' });
  }

  info(message, opts = {}) {
    return this.show(message, { ...opts, type: 'info' });
  }

  dismiss(el) {
    if (el.classList.contains('removing')) return;
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
