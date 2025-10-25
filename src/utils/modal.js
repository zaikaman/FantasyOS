/**
 * Modal System
 * Beautiful fantasy-themed modals to replace native alerts/confirms/prompts
 */

let modalContainer = null;
let activeModal = null;

/**
 * Initialize modal system
 */
export function initModal() {
  // Create modal container if it doesn't exist
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.className = 'modal-container';
    document.body.appendChild(modalContainer);
  }
  
  console.log('[Modal] Initialized');
}

/**
 * Show alert modal (replaces window.alert)
 * @param {string} message - Message to display
 * @param {string} title - Modal title (optional)
 * @returns {Promise<void>}
 */
export function showAlert(message, title = '⚠️ Notice') {
  return new Promise((resolve) => {
    closeActiveModal();
    
    const modal = createModalElement({
      title,
      message,
      buttons: [
        {
          text: 'Acknowledge',
          className: 'modal-btn-primary',
          onClick: () => {
            closeModal(modal);
            resolve();
          }
        }
      ]
    });
    
    showModal(modal);
  });
}

/**
 * Show confirm modal (replaces window.confirm)
 * @param {string} message - Message to display
 * @param {string} title - Modal title (optional)
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export function showConfirm(message, title = '🤔 Confirm Action') {
  return new Promise((resolve) => {
    closeActiveModal();
    
    const modal = createModalElement({
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          className: 'modal-btn-secondary',
          onClick: () => {
            closeModal(modal);
            resolve(false);
          }
        },
        {
          text: 'Confirm',
          className: 'modal-btn-primary',
          onClick: () => {
            closeModal(modal);
            resolve(true);
          }
        }
      ]
    });
    
    showModal(modal);
  });
}

/**
 * Show prompt modal (replaces window.prompt)
 * @param {string} message - Message to display
 * @param {string} defaultValue - Default input value
 * @param {string} title - Modal title (optional)
 * @returns {Promise<string|null>} Input value or null if cancelled
 */
export function showPrompt(message, defaultValue = '', title = '✍️ Input Required') {
  return new Promise((resolve) => {
    closeActiveModal();
    
    const inputId = 'modal-input-' + Date.now();
    const modal = createModalElement({
      title,
      message,
      hasInput: true,
      inputId,
      defaultValue,
      buttons: [
        {
          text: 'Cancel',
          className: 'modal-btn-secondary',
          onClick: () => {
            closeModal(modal);
            resolve(null);
          }
        },
        {
          text: 'Submit',
          className: 'modal-btn-primary',
          onClick: () => {
            const input = modal.querySelector(`#${inputId}`);
            const value = input ? input.value : defaultValue;
            closeModal(modal);
            resolve(value);
          }
        }
      ]
    });
    
    showModal(modal);
    
    // Focus input after modal is shown
    setTimeout(() => {
      const input = modal.querySelector(`#${inputId}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  });
}

/**
 * Show custom modal with custom buttons
 * @param {Object} options - Modal configuration
 * @returns {Promise<string>} Button ID that was clicked
 */
export function showCustomModal(options) {
  return new Promise((resolve) => {
    closeActiveModal();
    
    const buttons = options.buttons.map((btn, index) => ({
      text: btn.text || `Button ${index + 1}`,
      className: btn.className || 'modal-btn-secondary',
      onClick: () => {
        closeModal(modal);
        resolve(btn.id || btn.text);
      }
    }));
    
    const modal = createModalElement({
      title: options.title || '📜 Message',
      message: options.message || '',
      buttons
    });
    
    showModal(modal);
  });
}

/**
 * Create modal DOM element
 * @param {Object} config - Modal configuration
 * @returns {HTMLElement} Modal element
 */
function createModalElement(config) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal-box';
  
  // Title
  const titleEl = document.createElement('div');
  titleEl.className = 'modal-header';
  titleEl.innerHTML = `
    <h3 class="modal-title">${escapeHtml(config.title)}</h3>
  `;
  modal.appendChild(titleEl);
  
  // Body
  const bodyEl = document.createElement('div');
  bodyEl.className = 'modal-body';
  
  // Message
  const messageEl = document.createElement('p');
  messageEl.className = 'modal-message';
  messageEl.textContent = config.message;
  bodyEl.appendChild(messageEl);
  
  // Input (if needed)
  if (config.hasInput) {
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.id = config.inputId;
    inputEl.className = 'modal-input';
    inputEl.value = config.defaultValue || '';
    inputEl.placeholder = config.placeholder || '';
    
    // Submit on Enter
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const primaryBtn = modal.querySelector('.modal-btn-primary');
        if (primaryBtn) primaryBtn.click();
      } else if (e.key === 'Escape') {
        const secondaryBtn = modal.querySelector('.modal-btn-secondary');
        if (secondaryBtn) secondaryBtn.click();
      }
    });
    
    bodyEl.appendChild(inputEl);
  }
  
  modal.appendChild(bodyEl);
  
  // Footer with buttons
  const footerEl = document.createElement('div');
  footerEl.className = 'modal-footer';
  
  config.buttons.forEach(btn => {
    const buttonEl = document.createElement('button');
    buttonEl.className = `modal-btn ${btn.className}`;
    buttonEl.textContent = btn.text;
    buttonEl.addEventListener('click', btn.onClick);
    footerEl.appendChild(buttonEl);
  });
  
  modal.appendChild(footerEl);
  overlay.appendChild(modal);
  
  // Click overlay to close (only for alerts, not confirms)
  if (config.buttons.length === 1) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        config.buttons[0].onClick();
      }
    });
  }
  
  // ESC to close/cancel
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      const cancelBtn = modal.querySelector('.modal-btn-secondary');
      if (cancelBtn) {
        cancelBtn.click();
      } else {
        config.buttons[0].onClick();
      }
    }
  };
  
  overlay._escHandler = escHandler;
  document.addEventListener('keydown', escHandler);
  
  return overlay;
}

/**
 * Show modal
 * @param {HTMLElement} modal - Modal element
 */
function showModal(modal) {
  if (!modalContainer) {
    initModal();
  }
  
  modalContainer.appendChild(modal);
  activeModal = modal;
  
  // Trigger animation
  requestAnimationFrame(() => {
    modal.classList.add('modal-active');
  });
}

/**
 * Close modal
 * @param {HTMLElement} modal - Modal element
 */
function closeModal(modal) {
  if (!modal) return;
  
  modal.classList.remove('modal-active');
  
  // Remove escape key handler
  if (modal._escHandler) {
    document.removeEventListener('keydown', modal._escHandler);
  }
  
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    if (activeModal === modal) {
      activeModal = null;
    }
  }, 300);
}

/**
 * Close active modal
 */
function closeActiveModal() {
  if (activeModal) {
    closeModal(activeModal);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
}
