/**
 * Window Renderer
 * Generates and updates DOM elements for windows
 */

/**
 * Create a window DOM element
 * @param {Object} window - Window data object
 * @returns {HTMLElement} Window element
 */
export function createWindowElement(window) {
  const windowEl = document.createElement('div');
  windowEl.className = 'window';
  windowEl.id = `window-${window.id}`;
  windowEl.setAttribute('role', 'dialog');
  windowEl.setAttribute('aria-labelledby', `window-title-${window.id}`);
  windowEl.setAttribute('aria-modal', 'false');
  windowEl.setAttribute('tabindex', '0');
  windowEl.dataset.windowId = window.id;
  windowEl.dataset.appId = window.app_id;

  // Set initial position and size
  windowEl.style.left = '0';
  windowEl.style.top = '0';
  windowEl.style.transform = `translate(${window.x}px, ${window.y}px)`;
  windowEl.style.width = `${window.width}px`;
  windowEl.style.height = `${window.height}px`;
  windowEl.style.zIndex = window.z_index;

  // Set minimized state
  if (window.minimized) {
    windowEl.classList.add('minimized');
  }

  // Create window structure
  windowEl.innerHTML = `
    <div class="window-titlebar" data-drag-handle>
      <div class="window-icon">${window.icon || ''}</div>
      <div class="window-title" id="window-title-${window.id}">${escapeHtml(window.title)}</div>
      <div class="window-controls">
        <button class="window-btn window-btn-minimize" aria-label="Minimize window" title="Minimize"></button>
        <button class="window-btn window-btn-close" aria-label="Close window" title="Close"></button>
      </div>
    </div>
    <div class="window-content" id="window-content-${window.id}">
      <!-- App content will be mounted here -->
    </div>
    <!-- Resize handles -->
    <div class="window-resize-handle window-resize-nw" data-resize-direction="nw"></div>
    <div class="window-resize-handle window-resize-ne" data-resize-direction="ne"></div>
    <div class="window-resize-handle window-resize-sw" data-resize-direction="sw"></div>
    <div class="window-resize-handle window-resize-se" data-resize-direction="se"></div>
    <div class="window-resize-handle window-resize-n" data-resize-direction="n"></div>
    <div class="window-resize-handle window-resize-s" data-resize-direction="s"></div>
    <div class="window-resize-handle window-resize-w" data-resize-direction="w"></div>
    <div class="window-resize-handle window-resize-e" data-resize-direction="e"></div>
  `;

  return windowEl;
}

/**
 * Update window DOM element position
 * @param {HTMLElement} windowEl - Window element
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export function updateWindowPosition(windowEl, x, y) {
  windowEl.style.transform = `translate(${x}px, ${y}px)`;
}

/**
 * Update window DOM element size
 * @param {HTMLElement} windowEl - Window element
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 */
export function updateWindowSize(windowEl, width, height) {
  windowEl.style.width = `${width}px`;
  windowEl.style.height = `${height}px`;
}

/**
 * Update window z-index
 * @param {HTMLElement} windowEl - Window element
 * @param {number} zIndex - Z-index value
 */
export function updateWindowZIndex(windowEl, zIndex) {
  windowEl.style.zIndex = zIndex;
}

/**
 * Mark window as active
 * @param {HTMLElement} windowEl - Window element
 */
export function setWindowActive(windowEl) {
  windowEl.classList.add('active');
}

/**
 * Mark window as inactive
 * @param {HTMLElement} windowEl - Window element
 */
export function setWindowInactive(windowEl) {
  windowEl.classList.remove('active');
}

/**
 * Show window (remove minimized class)
 * @param {HTMLElement} windowEl - Window element
 */
export function showWindow(windowEl) {
  windowEl.classList.remove('minimized');
  windowEl.classList.add('restoring');
  
  // Remove animation class after animation completes
  setTimeout(() => {
    windowEl.classList.remove('restoring');
  }, 300);
}

/**
 * Hide window (add minimized class)
 * @param {HTMLElement} windowEl - Window element
 */
export function hideWindow(windowEl) {
  windowEl.classList.add('minimizing');
  
  // Add minimized class after animation completes
  setTimeout(() => {
    windowEl.classList.remove('minimizing');
    windowEl.classList.add('minimized');
  }, 300);
}

/**
 * Remove window with animation
 * @param {HTMLElement} windowEl - Window element
 * @returns {Promise} Resolves when animation completes
 */
export function removeWindow(windowEl) {
  return new Promise((resolve) => {
    windowEl.classList.add('closing');
    
    setTimeout(() => {
      windowEl.remove();
      resolve();
    }, 300);
  });
}

/**
 * Mount app component in window content area
 * @param {HTMLElement} windowEl - Window element
 * @param {Function|HTMLElement} component - App component (function or DOM element)
 */
export function mountAppContent(windowEl, component) {
  const contentEl = windowEl.querySelector('.window-content');
  if (!contentEl) {
    console.warn('[WindowRenderer] Content area not found');
    return;
  }

  // Clear existing content
  contentEl.innerHTML = '';

  // Mount component
  if (typeof component === 'function') {
    // Component is a function that returns DOM element
    // Pass the window element to the component function
    const appElement = component(windowEl);
    contentEl.appendChild(appElement);
  } else if (component instanceof HTMLElement) {
    // Component is already a DOM element
    contentEl.appendChild(component);
  } else if (typeof component === 'string') {
    // Component is HTML string
    contentEl.innerHTML = component;
  } else {
    console.warn('[WindowRenderer] Invalid component type:', typeof component);
  }
}

/**
 * Show loading state in window
 * @param {HTMLElement} windowEl - Window element
 * @param {string} message - Loading message
 */
export function showWindowLoading(windowEl, message = 'Loading...') {
  const loadingEl = document.createElement('div');
  loadingEl.className = 'window-loading';
  loadingEl.textContent = message;
  windowEl.appendChild(loadingEl);
}

/**
 * Hide loading state in window
 * @param {HTMLElement} windowEl - Window element
 */
export function hideWindowLoading(windowEl) {
  const loadingEl = windowEl.querySelector('.window-loading');
  if (loadingEl) {
    loadingEl.remove();
  }
}

/**
 * Update window title
 * @param {HTMLElement} windowEl - Window element
 * @param {string} title - New title
 */
export function updateWindowTitle(windowEl, title) {
  const titleEl = windowEl.querySelector('.window-title');
  if (titleEl) {
    titleEl.textContent = escapeHtml(title);
  }
}

/**
 * Update window icon
 * @param {HTMLElement} windowEl - Window element
 * @param {string} iconHtml - Icon HTML/SVG
 */
export function updateWindowIcon(windowEl, iconHtml) {
  const iconEl = windowEl.querySelector('.window-icon');
  if (iconEl) {
    iconEl.innerHTML = iconHtml;
  }
}

/**
 * Get window element by ID
 * @param {string} windowId - Window ID
 * @returns {HTMLElement|null} Window element or null
 */
export function getWindowElement(windowId) {
  return document.getElementById(`window-${windowId}`);
}

/**
 * Get all window elements
 * @returns {HTMLElement[]} Array of window elements
 */
export function getAllWindowElements() {
  return Array.from(document.querySelectorAll('.window'));
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

/**
 * Calculate cascade position for new window
 * @param {number} windowCount - Current number of windows
 * @returns {{x: number, y: number}} Position coordinates
 */
export function calculateCascadePosition(windowCount) {
  const offset = 20; // Pixels to offset each new window
  const baseX = Math.floor((window.innerWidth - 600) / 2); // Center horizontally (assuming 600px width)
  const baseY = Math.floor((window.innerHeight - 400) / 2); // Center vertically (assuming 400px height)

  return {
    x: baseX + (windowCount * offset),
    y: baseY + (windowCount * offset),
  };
}

/**
 * Constrain window position to screen bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {{x: number, y: number}} Constrained coordinates
 */
export function constrainWindowPosition(x, y, width, height) {
  const minX = 0;
  const minY = 0;
  const maxX = window.innerWidth - 100; // Ensure title bar is visible
  const maxY = window.innerHeight - 100;

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

/**
 * Constrain window size to valid range
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {{width: number, height: number}} Constrained dimensions
 */
export function constrainWindowSize(width, height) {
  const minWidth = 300;
  const minHeight = 200;
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  return {
    width: Math.max(minWidth, Math.min(maxWidth, width)),
    height: Math.max(minHeight, Math.min(maxHeight, height)),
  };
}
