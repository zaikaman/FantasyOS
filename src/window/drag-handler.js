/**
 * Drag Handler
 * Implements window dragging with pointer events
 */

import { setWindowPosition } from './window-manager.js';
import { getWindowElement } from './window-renderer.js';
import { startFrameTimeMonitoring, updateFrameTime, stopFrameTimeMonitoring } from '../utils/performance.js';

let isDragging = false;
let dragWindowId = null;
let dragStartX = 0;
let dragStartY = 0;
let windowStartX = 0;
let windowStartY = 0;
let rafId = null;

/**
 * Initialize drag handler
 */
export function initDragHandler() {
  // Global pointer events for drag
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);

  console.log('[DragHandler] Initialized');
}

/**
 * Attach drag handler to a window
 * @param {HTMLElement} windowEl - Window element
 * @param {string} windowId - Window ID
 */
export function attachDragHandlers(windowEl, windowId) {
  const titleBar = windowEl.querySelector('[data-drag-handle]');
  
  if (!titleBar) {
    console.warn('[DragHandler] Title bar not found for window', windowId);
    return;
  }

  titleBar.addEventListener('pointerdown', (e) => handleDragStart(e, windowId));
}

/**
 * Handle drag start
 * @param {PointerEvent} event - Pointer event
 * @param {string} windowId - Window ID
 */
function handleDragStart(event, windowId) {
  // Only drag with left mouse button or touch
  if (event.button !== 0) {
    return;
  }

  // Don't drag if clicking on a button
  if (event.target.closest('button')) {
    return;
  }

  const windowEl = getWindowElement(windowId);
  if (!windowEl) {
    return;
  }

  // Don't drag maximized windows
  if (windowEl.classList.contains('maximized')) {
    return;
  }

  event.preventDefault();

  // Get current window position
  const transform = windowEl.style.transform;
  const matches = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  
  if (matches) {
    windowStartX = parseFloat(matches[1]);
    windowStartY = parseFloat(matches[2]);
  } else {
    windowStartX = 0;
    windowStartY = 0;
  }

  // Record start position
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragWindowId = windowId;
  isDragging = true;

  // Start frame time monitoring
  startFrameTimeMonitoring();

  // Add dragging class
  windowEl.classList.add('dragging');

  // Capture pointer
  const titleBar = event.currentTarget;
  titleBar.setPointerCapture(event.pointerId);

  console.log('[DragHandler] Drag started:', windowId);
}

/**
 * Handle pointer move (throttled with RAF)
 * @param {PointerEvent} event - Pointer event
 */
function handlePointerMove(event) {
  if (!isDragging || !dragWindowId) {
    return;
  }

  // Throttle with requestAnimationFrame
  if (rafId) {
    return;
  }

  rafId = requestAnimationFrame(() => {
    updateDragPosition(event);
    rafId = null;
  });
}

/**
 * Update window position during drag
 * @param {PointerEvent} event - Pointer event
 */
function updateDragPosition(event) {
  if (!isDragging || !dragWindowId) {
    return;
  }

  // Measure frame time
  updateFrameTime();

  // Calculate delta
  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;

  // Calculate new position
  const newX = windowStartX + deltaX;
  const newY = windowStartY + deltaY;

  // Update window position (with boundary validation)
  // Don't persist to database yet (will persist on drag end)
  setWindowPosition(dragWindowId, newX, newY, false);
}

/**
 * Handle pointer up (end drag)
 * @param {PointerEvent} event - Pointer event
 */
function handlePointerUp(event) {
  if (!isDragging || !dragWindowId) {
    return;
  }

  // Cancel any pending RAF
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Stop frame time monitoring
  stopFrameTimeMonitoring();

  const windowEl = getWindowElement(dragWindowId);
  if (windowEl) {
    // Remove dragging class
    windowEl.classList.remove('dragging');

    // Get final position
    const transform = windowEl.style.transform;
    const matches = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    
    if (matches) {
      const finalX = parseFloat(matches[1]);
      const finalY = parseFloat(matches[2]);

      // Persist final position to database
      setWindowPosition(dragWindowId, finalX, finalY, true);
    }
  }

  console.log('[DragHandler] Drag ended:', dragWindowId);

  // Reset state
  isDragging = false;
  dragWindowId = null;
  dragStartX = 0;
  dragStartY = 0;
  windowStartX = 0;
  windowStartY = 0;
}

/**
 * Check if currently dragging
 * @returns {boolean} True if dragging
 */
export function isDraggingWindow() {
  return isDragging;
}

/**
 * Get currently dragging window ID
 * @returns {string|null} Window ID or null
 */
export function getDraggingWindowId() {
  return dragWindowId;
}

/**
 * Cancel ongoing drag
 */
export function cancelDrag() {
  if (!isDragging) {
    return;
  }

  const windowEl = getWindowElement(dragWindowId);
  if (windowEl) {
    // Restore original position
    setWindowPosition(dragWindowId, windowStartX, windowStartY, false);
    windowEl.classList.remove('dragging');
  }

  // Reset state
  isDragging = false;
  dragWindowId = null;
  
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
