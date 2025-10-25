/**
 * Resize Handler
 * Implements window resizing with 8-direction handles
 */

import { setWindowSize, setWindowPosition, getWindowById } from './window-manager.js';
import { getWindowElement, constrainWindowSize, constrainWindowPosition } from './window-renderer.js';
import { startFrameTimeMonitoring, updateFrameTime, stopFrameTimeMonitoring } from '../utils/performance.js';

let isResizing = false;
let resizeWindowId = null;
let resizeDirection = null;
let resizeStartX = 0;
let resizeStartY = 0;
let windowStartX = 0;
let windowStartY = 0;
let windowStartWidth = 0;
let windowStartHeight = 0;
let rafId = null;

/**
 * Initialize resize handler
 */
export function initResizeHandler() {
  // Global pointer events for resize
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);

  console.log('[ResizeHandler] Initialized');
}

/**
 * Attach resize handlers to a window
 * @param {HTMLElement} windowEl - Window element
 * @param {string} windowId - Window ID
 */
export function attachResizeHandlers(windowEl, windowId) {
  const handles = windowEl.querySelectorAll('[data-resize-direction]');
  
  handles.forEach(handle => {
    handle.addEventListener('pointerdown', (e) => {
      const direction = handle.dataset.resizeDirection;
      handleResizeStart(e, windowId, direction);
    });
  });
}

/**
 * Handle resize start
 * @param {PointerEvent} event - Pointer event
 * @param {string} windowId - Window ID
 * @param {string} direction - Resize direction (n, s, e, w, ne, nw, se, sw)
 */
function handleResizeStart(event, windowId, direction) {
  // Only resize with left mouse button
  if (event.button !== 0) {
    return;
  }

  const windowEl = getWindowElement(windowId);
  if (!windowEl) {
    return;
  }

  // Don't resize maximized windows
  if (windowEl.classList.contains('maximized')) {
    return;
  }

  event.preventDefault();
  event.stopPropagation(); // Prevent window drag

  const window = getWindowById(windowId);
  if (!window) {
    return;
  }

  // Record start state
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  windowStartX = window.x;
  windowStartY = window.y;
  windowStartWidth = window.width;
  windowStartHeight = window.height;
  resizeWindowId = windowId;
  resizeDirection = direction;
  isResizing = true;

  // Start frame time monitoring
  startFrameTimeMonitoring();

  // Add resizing class
  windowEl.classList.add('resizing');

  // Capture pointer
  event.currentTarget.setPointerCapture(event.pointerId);

  console.log('[ResizeHandler] Resize started:', windowId, direction);
}

/**
 * Handle pointer move (throttled with RAF)
 * @param {PointerEvent} event - Pointer event
 */
function handlePointerMove(event) {
  if (!isResizing || !resizeWindowId) {
    return;
  }

  // Throttle with requestAnimationFrame
  if (rafId) {
    return;
  }

  rafId = requestAnimationFrame(() => {
    updateResizePosition(event);
    rafId = null;
  });
}

/**
 * Update window size/position during resize
 * @param {PointerEvent} event - Pointer event
 */
function updateResizePosition(event) {
  if (!isResizing || !resizeWindowId || !resizeDirection) {
    return;
  }

  // Measure frame time
  updateFrameTime();

  // Calculate delta
  const deltaX = event.clientX - resizeStartX;
  const deltaY = event.clientY - resizeStartY;

  // Calculate new dimensions based on direction
  let newX = windowStartX;
  let newY = windowStartY;
  let newWidth = windowStartWidth;
  let newHeight = windowStartHeight;

  // Horizontal resize
  if (resizeDirection.includes('e')) {
    // Resize from right edge
    newWidth = windowStartWidth + deltaX;
  } else if (resizeDirection.includes('w')) {
    // Resize from left edge
    newWidth = windowStartWidth - deltaX;
    newX = windowStartX + deltaX;
  }

  // Vertical resize
  if (resizeDirection.includes('s')) {
    // Resize from bottom edge
    newHeight = windowStartHeight + deltaY;
  } else if (resizeDirection.includes('n')) {
    // Resize from top edge
    newHeight = windowStartHeight - deltaY;
    newY = windowStartY + deltaY;
  }

  // Constrain size
  const constrained = constrainWindowSize(newWidth, newHeight);
  newWidth = constrained.width;
  newHeight = constrained.height;

  // Adjust position if constrained size affected it
  if (resizeDirection.includes('w')) {
    newX = windowStartX + (windowStartWidth - newWidth);
  }
  if (resizeDirection.includes('n')) {
    newY = windowStartY + (windowStartHeight - newHeight);
  }

  // Constrain position
  const constrainedPos = constrainWindowPosition(newX, newY, newWidth, newHeight);
  newX = constrainedPos.x;
  newY = constrainedPos.y;

  // Update window (don't persist to database yet)
  setWindowSize(resizeWindowId, newWidth, newHeight, false);
  
  if (newX !== windowStartX || newY !== windowStartY) {
    setWindowPosition(resizeWindowId, newX, newY, false);
  }
}

/**
 * Handle pointer up (end resize)
 * @param {PointerEvent} event - Pointer event
 */
function handlePointerUp(event) {
  if (!isResizing || !resizeWindowId) {
    return;
  }

  // Cancel any pending RAF
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Stop frame time monitoring
  stopFrameTimeMonitoring();

  const windowEl = getWindowElement(resizeWindowId);
  if (windowEl) {
    // Remove resizing class
    windowEl.classList.remove('resizing');
  }

  const window = getWindowById(resizeWindowId);
  if (window) {
    // Persist final size/position to database
    setWindowSize(resizeWindowId, window.width, window.height, true);
    
    if (window.x !== windowStartX || window.y !== windowStartY) {
      setWindowPosition(resizeWindowId, window.x, window.y, true);
    }
  }

  console.log('[ResizeHandler] Resize ended:', resizeWindowId);

  // Reset state
  isResizing = false;
  resizeWindowId = null;
  resizeDirection = null;
  resizeStartX = 0;
  resizeStartY = 0;
  windowStartX = 0;
  windowStartY = 0;
  windowStartWidth = 0;
  windowStartHeight = 0;
}

/**
 * Check if currently resizing
 * @returns {boolean} True if resizing
 */
export function isResizingWindow() {
  return isResizing;
}

/**
 * Get currently resizing window ID
 * @returns {string|null} Window ID or null
 */
export function getResizingWindowId() {
  return resizeWindowId;
}

/**
 * Get current resize direction
 * @returns {string|null} Direction or null
 */
export function getResizeDirection() {
  return resizeDirection;
}

/**
 * Cancel ongoing resize
 */
export function cancelResize() {
  if (!isResizing) {
    return;
  }

  const windowEl = getWindowElement(resizeWindowId);
  if (windowEl) {
    // Restore original size/position
    setWindowSize(resizeWindowId, windowStartWidth, windowStartHeight, false);
    setWindowPosition(resizeWindowId, windowStartX, windowStartY, false);
    windowEl.classList.remove('resizing');
  }

  // Reset state
  isResizing = false;
  resizeWindowId = null;
  resizeDirection = null;
  
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
