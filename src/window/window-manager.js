/**
 * Window Manager
 * Core window lifecycle, focus, and z-index management
 */

import { getState, setState, subscribe } from '../core/state.js';
import { eventBus, Events } from '../core/event-bus.js';
import { 
  insertWindow, 
  updateWindow, 
  deleteWindow, 
  getAllWindows as dbGetAllWindows 
} from '../storage/queries.js';
import { generateWindowId } from '../utils/uuid.js';
import { now } from '../utils/date.js';
import { getAppById } from '../apps/app-registry.js';
import {
  createWindowElement,
  updateWindowPosition,
  updateWindowSize,
  updateWindowZIndex,
  setWindowActive,
  setWindowInactive,
  showWindow,
  hideWindow,
  removeWindow,
  mountAppContent,
  getWindowElement,
  calculateCascadePosition,
  constrainWindowPosition,
  constrainWindowSize,
  maximizeWindow as rendererMaximizeWindow,
  restoreWindowFromMaximized,
  isWindowMaximized,
} from './window-renderer.js';
import { attachDragHandlers } from './drag-handler.js';
import { attachResizeHandlers } from './resize-handler.js';

const MAX_WINDOWS = 20;
const BASE_Z_INDEX = 1000;
const MAX_Z_INDEX = 9999;
const Z_INDEX_RESET_THRESHOLD = 9000;

let windowEventHooks = {};
let debounceTimers = new Map();

/**
 * Initialize window manager
 */
export function initWindowManager() {
  // Get desktop container
  const desktop = document.getElementById('desktop');
  if (!desktop) {
    console.error('[WindowManager] Desktop element not found');
    return;
  }

  console.log('[WindowManager] Initialized');
}

/**
 * Create a new window
 * @param {string} appId - Application ID from registry
 * @param {Object} options - Window options
 * @returns {Object} Window data object
 */
export function createWindow(appId, options = {}) {
  const state = getState();

  // Check max windows limit
  if (state.windows.length >= MAX_WINDOWS) {
    throw new Error('Maximum windows reached');
  }

  // Get app from registry
  const app = getAppById(appId);
  if (!app) {
    throw new Error('App not found');
  }

  // Check if app is singleton and already open
  if (app.singleton) {
    const existing = state.windows.find(w => w.app_id === appId && !w.minimized);
    if (existing) {
      focusWindow(existing.id);
      return existing;
    }
  }

  // Calculate position
  const windowCount = state.windows.length;
  const defaultPos = calculateCascadePosition(windowCount);
  
  let x = options.x !== undefined ? options.x : defaultPos.x;
  let y = options.y !== undefined ? options.y : defaultPos.y;
  
  // Support both old format (defaultWidth/defaultHeight) and new format (defaultWindow.width/height)
  const defaultWidth = app.defaultWindow?.width || app.defaultWidth || 600;
  const defaultHeight = app.defaultWindow?.height || app.defaultHeight || 400;
  
  let width = options.width || defaultWidth;
  let height = options.height || defaultHeight;

  // Only constrain if we have specific numeric dimensions
  if (typeof width === 'number' && typeof height === 'number') {
    // Constrain to screen bounds
    const constrainedPos = constrainWindowPosition(x, y, width, height);
    const constrainedSize = constrainWindowSize(width, height);
    
    x = constrainedPos.x;
    y = constrainedPos.y;
    width = constrainedSize.width;
    height = constrainedSize.height;
  } else {
    // For auto-sized windows, just constrain position with estimated size
    const estimatedWidth = 600;
    const estimatedHeight = 400;
    const constrainedPos = constrainWindowPosition(x, y, estimatedWidth, estimatedHeight);
    x = constrainedPos.x;
    y = constrainedPos.y;
    // width and height stay as 'auto'
  }

  // Calculate z-index
  const maxZ = state.windows.reduce((max, w) => Math.max(max, w.z_index), BASE_Z_INDEX - 1);
  const zIndex = maxZ + 1;

  // Create window data
  const windowData = {
    id: generateWindowId(),
    app_id: appId,
    title: options.title || app.name,
    icon: app.icon,
    x,
    y,
    width,
    height,
    z_index: zIndex,
    minimized: options.minimized ? 1 : 0,
    created_at: now(),
    updated_at: now(),
  };

  // Call onBeforeCreate hook
  if (windowEventHooks.onBeforeCreate) {
    const hookResult = windowEventHooks.onBeforeCreate(appId, options);
    if (hookResult) {
      Object.assign(windowData, hookResult);
    }
  }

  // Insert to database
  insertWindow(windowData);

  // Add to state
  setState({
    windows: [...state.windows, windowData],
    activeWindowId: windowData.id,
  });

  // Create DOM element
  const windowEl = createWindowElement(windowData);
  const desktop = document.getElementById('desktop');
  desktop.appendChild(windowEl);

  // Mark as active
  setWindowActive(windowEl);

  // Mount app component
  if (app.component) {
    mountAppContent(windowEl, app.component);
  }

  // Attach event listeners
  attachWindowEventListeners(windowEl, windowData.id);

  // Attach drag and resize handlers
  attachDragHandlers(windowEl, windowData.id);
  attachResizeHandlers(windowEl, windowData.id);

  // Emit event
  eventBus.emit(Events.WINDOW_CREATED, { windowId: windowData.id, appId });

  // Call onAfterCreate hook
  if (windowEventHooks.onAfterCreate) {
    windowEventHooks.onAfterCreate(windowData);
  }

  console.log('[WindowManager] Window created:', windowData.id, appId);

  return windowData;
}

/**
 * Close a window
 * @param {string} windowId - Window ID
 */
export async function closeWindow(windowId) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  // Call onBeforeClose hook (can cancel)
  if (windowEventHooks.onBeforeClose) {
    const shouldClose = windowEventHooks.onBeforeClose(window);
    if (shouldClose === false) {
      console.log('[WindowManager] Window close cancelled by hook');
      return;
    }
  }

  // Remove from state
  const newWindows = state.windows.filter(w => w.id !== windowId);
  
  // Update active window if this was active
  let newActiveWindowId = state.activeWindowId;
  if (state.activeWindowId === windowId) {
    // Find next highest z-index window
    const nextWindow = newWindows
      .filter(w => !w.minimized)
      .sort((a, b) => b.z_index - a.z_index)[0];
    newActiveWindowId = nextWindow ? nextWindow.id : null;
  }

  setState({
    windows: newWindows,
    activeWindowId: newActiveWindowId,
  });

  // Delete from database
  deleteWindow(windowId);

  // Remove DOM element with animation
  const windowEl = getWindowElement(windowId);
  if (windowEl) {
    await removeWindow(windowEl);
  }

  // Update clock tower visibility after closing
  updateClockTowerVisibility();

  // Focus next window
  if (newActiveWindowId) {
    const nextWindowEl = getWindowElement(newActiveWindowId);
    if (nextWindowEl) {
      setWindowActive(nextWindowEl);
    }
  }

  // Emit event
  eventBus.emit(Events.WINDOW_CLOSED, { windowId });

  // Call onAfterClose hook
  if (windowEventHooks.onAfterClose) {
    windowEventHooks.onAfterClose(windowId);
  }

  console.log('[WindowManager] Window closed:', windowId);
}

/**
 * Focus a window (bring to front)
 * @param {string} windowId - Window ID
 */
export function focusWindow(windowId) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  // If already active, do nothing
  if (state.activeWindowId === windowId && !window.minimized) {
    return;
  }

  // Calculate new z-index
  const maxZ = state.windows.reduce((max, w) => Math.max(max, w.z_index), BASE_Z_INDEX - 1);
  let newZIndex = maxZ + 1;

  // Check if we need to reindex
  if (newZIndex > Z_INDEX_RESET_THRESHOLD) {
    reindexWindows();
    // Recalculate after reindex
    const maxZ = state.windows.reduce((max, w) => Math.max(max, w.z_index), BASE_Z_INDEX - 1);
    newZIndex = maxZ + 1;
  }

  // Update window data
  const updatedWindow = {
    ...window,
    z_index: newZIndex,
    minimized: 0, // Restore if minimized
    updated_at: now(),
  };

  // Update state
  const newWindows = state.windows.map(w => 
    w.id === windowId ? updatedWindow : w
  );

  setState({
    windows: newWindows,
    activeWindowId: windowId,
  });

  // Update database
  updateWindow(windowId, { z_index: newZIndex, minimized: 0 });

  // Update DOM
  const windowEl = getWindowElement(windowId);
  if (windowEl) {
    updateWindowZIndex(windowEl, newZIndex);
    setWindowActive(windowEl);
    
    // Restore if minimized
    if (window.minimized) {
      showWindow(windowEl);
    }
    
    windowEl.focus();
  }

  // Deactivate other windows
  state.windows.forEach(w => {
    if (w.id !== windowId) {
      const el = getWindowElement(w.id);
      if (el) {
        setWindowInactive(el);
      }
    }
  });

  // Emit event
  eventBus.emit(Events.WINDOW_FOCUSED, { windowId });

  // Call onFocus hook
  if (windowEventHooks.onFocus) {
    windowEventHooks.onFocus(updatedWindow);
  }

  console.log('[WindowManager] Window focused:', windowId, 'z-index:', newZIndex);
}

/**
 * Minimize a window
 * @param {string} windowId - Window ID
 */
export function minimizeWindow(windowId) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  if (window.minimized) {
    return; // Already minimized
  }

  // Update window data
  const updatedWindow = {
    ...window,
    minimized: 1,
    updated_at: now(),
  };

  // Update state
  const newWindows = state.windows.map(w => 
    w.id === windowId ? updatedWindow : w
  );

  // Update active window if this was active
  let newActiveWindowId = state.activeWindowId;
  if (state.activeWindowId === windowId) {
    const nextWindow = newWindows
      .filter(w => w.id !== windowId && !w.minimized)
      .sort((a, b) => b.z_index - a.z_index)[0];
    newActiveWindowId = nextWindow ? nextWindow.id : null;
  }

  setState({
    windows: newWindows,
    activeWindowId: newActiveWindowId,
  });

  // Update database
  updateWindow(windowId, { minimized: 1 });

  // Update DOM
  const windowEl = getWindowElement(windowId);
  if (windowEl) {
    hideWindow(windowEl);
  }

  // Focus next window
  if (newActiveWindowId) {
    focusWindow(newActiveWindowId);
  }

  // Emit event
  eventBus.emit(Events.WINDOW_MINIMIZED, { windowId });

  // Call onMinimize hook
  if (windowEventHooks.onMinimize) {
    windowEventHooks.onMinimize(updatedWindow);
  }

  console.log('[WindowManager] Window minimized:', windowId);
}

/**
 * Restore a minimized window
 * @param {string} windowId - Window ID
 */
export function restoreWindow(windowId) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  if (!window.minimized) {
    // Just focus if not minimized
    focusWindow(windowId);
    return;
  }

  // Focus will automatically restore
  focusWindow(windowId);

  // Emit event
  eventBus.emit(Events.WINDOW_RESTORED, { windowId });

  // Call onRestore hook
  if (windowEventHooks.onRestore) {
    windowEventHooks.onRestore(window);
  }

  console.log('[WindowManager] Window restored:', windowId);
}

/**
 * Toggle maximize/restore window
 * @param {string} windowId - Window ID
 */
export function toggleMaximizeWindow(windowId) {
  const windowEl = getWindowElement(windowId);
  if (!windowEl) {
    throw new Error('Window element not found');
  }

  const state = getState();
  const window = state.windows.find(w => w.id === windowId);
  
  if (!window) {
    throw new Error('Window not found');
  }

  if (isWindowMaximized(windowEl)) {
    // Restore to previous size/position
    const restoreData = window.preMaximizeState || {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height
    };

    restoreWindowFromMaximized(
      windowEl,
      restoreData.x,
      restoreData.y,
      restoreData.width,
      restoreData.height
    );

    // Update state - remove preMaximizeState
    const newWindows = state.windows.map(w =>
      w.id === windowId 
        ? { 
            ...w, 
            x: restoreData.x,
            y: restoreData.y,
            width: restoreData.width,
            height: restoreData.height,
            preMaximizeState: undefined,
            updated_at: now()
          } 
        : w
    );

    setState({ windows: newWindows });

    // Update database
    updateWindow(windowId, {
      x: restoreData.x,
      y: restoreData.y,
      width: restoreData.width,
      height: restoreData.height
    });

    // Show clock tower if no other windows are maximized
    updateClockTowerVisibility();

    // Emit event
    eventBus.emit(Events.WINDOW_RESTORED, { windowId });

    console.log('[WindowManager] Window restored from maximized:', windowId);
  } else {
    // Save current state before maximizing
    const preMaximizeState = {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height
    };

    // Maximize
    rendererMaximizeWindow(windowEl);

    // Update state - store pre-maximize state
    const newWindows = state.windows.map(w =>
      w.id === windowId 
        ? { 
            ...w, 
            preMaximizeState,
            updated_at: now()
          } 
        : w
    );

    setState({ windows: newWindows });

    // Hide clock tower when maximized
    hideClockTower();

    // Emit event
    eventBus.emit(Events.WINDOW_MAXIMIZED, { windowId });

    console.log('[WindowManager] Window maximized:', windowId);
  }
}

/**
 * Hide clock tower HUD
 */
function hideClockTower() {
  const clockTower = document.getElementById('clock-tower');
  if (clockTower) {
    clockTower.classList.add('hidden-for-maximized');
  }
}

/**
 * Show clock tower HUD
 */
function showClockTower() {
  const clockTower = document.getElementById('clock-tower');
  if (clockTower) {
    clockTower.classList.remove('hidden-for-maximized');
  }
}

/**
 * Update clock tower visibility based on maximized windows
 */
function updateClockTowerVisibility() {
  const state = getState();
  const hasMaximizedWindow = state.windows.some(w => {
    const el = getWindowElement(w.id);
    return el && isWindowMaximized(el);
  });

  if (hasMaximizedWindow) {
    hideClockTower();
  } else {
    showClockTower();
  }
}

/**
 * Set window position
 * @param {string} windowId - Window ID
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} persist - Whether to save to database
 */
export function setWindowPosition(windowId, x, y, persist = true) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  // Constrain position - use numeric values or defaults for 'auto'
  const constrainWidth = typeof window.width === 'number' ? window.width : 600;
  const constrainHeight = typeof window.height === 'number' ? window.height : 400;
  const constrained = constrainWindowPosition(x, y, constrainWidth, constrainHeight);
  x = constrained.x;
  y = constrained.y;

  // Update state
  const newWindows = state.windows.map(w =>
    w.id === windowId ? { ...w, x, y, updated_at: now() } : w
  );

  setState({ windows: newWindows });

  // Update DOM
  const windowEl = getWindowElement(windowId);
  if (windowEl) {
    updateWindowPosition(windowEl, x, y);
  }

  // Debounce database update
  if (persist) {
    debouncedDatabaseUpdate(windowId, { x, y });
  }

  // Emit event
  eventBus.emit(Events.WINDOW_MOVED, { windowId, x, y });
}

/**
 * Set window size
 * @param {string} windowId - Window ID
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {boolean} persist - Whether to save to database
 */
export function setWindowSize(windowId, width, height, persist = true) {
  const state = getState();
  const window = state.windows.find(w => w.id === windowId);

  if (!window) {
    throw new Error('Window not found');
  }

  // Constrain size
  const constrained = constrainWindowSize(width, height);
  width = constrained.width;
  height = constrained.height;

  // Update state
  const newWindows = state.windows.map(w =>
    w.id === windowId ? { ...w, width, height, updated_at: now() } : w
  );

  setState({ windows: newWindows });

  // Update DOM
  const windowEl = getWindowElement(windowId);
  if (windowEl) {
    updateWindowSize(windowEl, width, height);
  }

  // Debounce database update
  if (persist) {
    debouncedDatabaseUpdate(windowId, { width, height });
  }

  // Emit event
  eventBus.emit(Events.WINDOW_RESIZED, { windowId, width, height });

  // Call onResize hook
  if (windowEventHooks.onResize) {
    windowEventHooks.onResize(window, { width: window.width, height: window.height });
  }
}

/**
 * Reindex all windows to sequential z-index values
 */
export function reindexWindows() {
  const state = getState();
  
  // Sort by current z-index
  const sorted = [...state.windows].sort((a, b) => a.z_index - b.z_index);
  
  // Assign new sequential z-indexes
  const reindexed = sorted.map((window, index) => ({
    ...window,
    z_index: BASE_Z_INDEX + index,
  }));

  setState({ windows: reindexed });

  // Update database (batch)
  reindexed.forEach(window => {
    updateWindow(window.id, { z_index: window.z_index });
    
    // Update DOM
    const windowEl = getWindowElement(window.id);
    if (windowEl) {
      updateWindowZIndex(windowEl, window.z_index);
    }
  });

  console.log('[WindowManager] Windows reindexed');
}

/**
 * Get all windows
 * @returns {Array} Array of window objects
 */
export function getAllWindows() {
  return getState().windows;
}

/**
 * Get window by ID
 * @param {string} windowId - Window ID
 * @returns {Object|null} Window object or null
 */
export function getWindowById(windowId) {
  return getState().windows.find(w => w.id === windowId) || null;
}

/**
 * Get windows by app ID
 * @param {string} appId - App ID
 * @returns {Array} Array of window objects
 */
export function getWindowsByAppId(appId) {
  return getState().windows.filter(w => w.app_id === appId);
}

/**
 * Get minimized windows
 * @returns {Array} Array of minimized window objects
 */
export function getMinimizedWindows() {
  return getState().windows.filter(w => w.minimized);
}

/**
 * Get active window
 * @returns {Object|null} Active window object or null
 */
export function getActiveWindow() {
  const state = getState();
  return state.windows.find(w => w.id === state.activeWindowId) || null;
}

/**
 * Register event hooks
 * @param {Object} hooks - Event hook functions
 */
export function registerWindowHooks(hooks) {
  windowEventHooks = { ...windowEventHooks, ...hooks };
}

/**
 * Attach event listeners to window element
 * @param {HTMLElement} windowEl - Window element
 * @param {string} windowId - Window ID
 */
function attachWindowEventListeners(windowEl, windowId) {
  // Focus on pointerdown
  windowEl.addEventListener('pointerdown', () => {
    focusWindow(windowId);
  });

  // Close button
  const closeBtn = windowEl.querySelector('.window-btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(windowId);
    });
  }

  // Minimize button
  const minimizeBtn = windowEl.querySelector('.window-btn-minimize');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(windowId);
    });
  }

  // Maximize button
  const maximizeBtn = windowEl.querySelector('.window-btn-maximize');
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximizeWindow(windowId);
    });
  }

  // Double-click titlebar to maximize/restore
  const titlebar = windowEl.querySelector('.window-titlebar');
  if (titlebar) {
    titlebar.addEventListener('dblclick', (e) => {
      // Don't trigger if clicking on buttons
      if (!e.target.closest('.window-btn')) {
        toggleMaximizeWindow(windowId);
      }
    });
  }
}

/**
 * Debounced database update
 * @param {string} windowId - Window ID
 * @param {Object} updates - Fields to update
 */
function debouncedDatabaseUpdate(windowId, updates) {
  // Clear existing timer
  if (debounceTimers.has(windowId)) {
    clearTimeout(debounceTimers.get(windowId));
  }

  // Set new timer (1 second debounce)
  const timer = setTimeout(() => {
    updateWindow(windowId, updates);
    debounceTimers.delete(windowId);
  }, 1000);

  debounceTimers.set(windowId, timer);
}
