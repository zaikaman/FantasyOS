/**
 * Taskbar
 * Mystical parchment bar at the bottom showing all open windows
 */

import { getState, subscribe } from '../core/state.js';
import { focusWindow, restoreWindow, minimizeWindow } from '../window/window-manager.js';
import { getAppById } from '../apps/app-registry.js';

let taskbarElement = null;
let windowsContainer = null;

/**
 * Initialize taskbar
 */
export function initTaskbar() {
  console.log('[Taskbar] Initializing...');
  
  taskbarElement = document.getElementById('taskbar');
  
  if (!taskbarElement) {
    console.error('[Taskbar] Taskbar element not found');
    return;
  }

  // Create windows container
  windowsContainer = document.createElement('div');
  windowsContainer.className = 'taskbar-windows';
  windowsContainer.id = 'taskbar-windows';
  
  taskbarElement.appendChild(windowsContainer);

  // Subscribe to window state changes - specifically the 'windows' path
  const unsubscribe = subscribe('windows', () => {
    console.log('[Taskbar] Windows state changed, re-rendering...');
    renderTaskbarWindows();
  });
  
  // Also subscribe to activeWindowId changes
  subscribe('activeWindowId', () => {
    console.log('[Taskbar] Active window changed, re-rendering...');
    renderTaskbarWindows();
  });

  // Initial render
  renderTaskbarWindows();

  // Setup auto-hide behavior
  setupAutoHide();

  console.log('[Taskbar] Initialized successfully');
}

/**
 * Setup auto-hide behavior for taskbar
 */
function setupAutoHide() {
  const TRIGGER_ZONE_HEIGHT = 50; // pixels from bottom to trigger show
  
  let isTaskbarShown = false;
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    const distanceFromBottom = window.innerHeight - e.clientY;
    
    if (distanceFromBottom <= TRIGGER_ZONE_HEIGHT) {
      // Mouse is near bottom, show taskbar
      if (!isTaskbarShown) {
        taskbarElement.classList.add('show');
        isTaskbarShown = true;
      }
    } else {
      // Mouse is away from bottom, hide taskbar
      if (isTaskbarShown) {
        taskbarElement.classList.remove('show');
        isTaskbarShown = false;
      }
    }
  });
  
  console.log('[Taskbar] Auto-hide enabled');
}

/**
 * Render all windows in taskbar
 */
function renderTaskbarWindows() {
  const state = getState();
  const windows = state.windows;

  if (!windowsContainer) {
    console.warn('[Taskbar] Windows container not found');
    return;
  }

  // Clear existing
  windowsContainer.innerHTML = '';

  console.log('[Taskbar] Rendering windows:', windows.length, windows);

  if (windows.length === 0) {
    windowsContainer.innerHTML = '<div class="taskbar-empty">No open windows</div>';
    return;
  }

  // Sort by z-index to match visual stacking order
  const sortedWindows = [...windows].sort((a, b) => a.z_index - b.z_index);

  // Render each window
  sortedWindows.forEach(window => {
    const app = getAppById(window.app_id);
    const taskbarItem = createTaskbarItem(window, app, state.activeWindowId === window.id);
    windowsContainer.appendChild(taskbarItem);
  });

  console.log(`[Taskbar] Rendered ${windows.length} windows`);
}

/**
 * Create taskbar item for a window
 * @param {Object} window - Window data
 * @param {Object} app - App data
 * @param {boolean} isActive - Whether this window is active
 * @returns {HTMLElement} Taskbar item element
 */
function createTaskbarItem(window, app, isActive) {
  const item = document.createElement('div');
  item.className = `taskbar-item ${isActive ? 'active' : ''} ${window.minimized ? 'minimized' : ''}`;
  item.dataset.windowId = window.id;
  item.title = window.title;
  
  // Icon
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'taskbar-item-icon';
  iconWrapper.innerHTML = app?.icon || '📄';
  
  // Title
  const title = document.createElement('div');
  title.className = 'taskbar-item-title';
  title.textContent = window.title;
  
  // Indicator for active/minimized state
  const indicator = document.createElement('div');
  indicator.className = 'taskbar-item-indicator';
  
  item.appendChild(iconWrapper);
  item.appendChild(title);
  item.appendChild(indicator);

  // Click handler
  item.addEventListener('click', () => {
    handleTaskbarItemClick(window, isActive);
  });

  // Right-click handler for context menu
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Future: show context menu with minimize/close options
  });

  // Hover effects
  item.addEventListener('mouseenter', () => {
    if (!isActive) {
      item.style.transform = 'translateY(-4px)';
    }
  });

  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });

  return item;
}

/**
 * Handle click on taskbar item
 * @param {Object} window - Window data
 * @param {boolean} isActive - Whether this window is currently active
 */
function handleTaskbarItemClick(window, isActive) {
  if (window.minimized) {
    // If minimized, restore it
    restoreWindow(window.id);
  } else if (isActive) {
    // If already active, minimize it
    minimizeWindow(window.id);
  } else {
    // If not active, focus it
    focusWindow(window.id);
  }
}

/**
 * Show taskbar
 */
export function showTaskbar() {
  if (taskbarElement) {
    taskbarElement.classList.remove('hidden');
  }
}

/**
 * Hide taskbar
 */
export function hideTaskbar() {
  if (taskbarElement) {
    taskbarElement.classList.add('hidden');
  }
}

/**
 * Toggle taskbar visibility
 */
export function toggleTaskbar() {
  if (taskbarElement) {
    taskbarElement.classList.toggle('hidden');
  }
}
