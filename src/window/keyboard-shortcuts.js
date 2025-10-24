/**
 * Keyboard Shortcuts
 * Window management keyboard shortcuts
 */

import { getActiveWindow, closeWindow, minimizeWindow } from '../window/window-manager.js';

/**
 * Initialize keyboard shortcuts
 */
export function initKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyDown);
  console.log('[KeyboardShortcuts] Initialized');
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyDown(event) {
  // Don't trigger shortcuts if typing in input/textarea
  if (isTypingContext(event.target)) {
    return;
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? event.metaKey : event.ctrlKey;

  // Escape - Close active window
  if (event.key === 'Escape') {
    handleEscapeKey(event);
    return;
  }

  // Ctrl/Cmd + M - Minimize active window
  if (modKey && event.key === 'm') {
    handleMinimizeShortcut(event);
    return;
  }

  // Ctrl/Cmd + W - Close active window
  if (modKey && event.key === 'w') {
    handleCloseShortcut(event);
    return;
  }

  // Ctrl/Cmd + Tab - Cycle through windows (future feature)
  if (modKey && event.key === 'Tab') {
    event.preventDefault();
    // TODO: Implement window cycling
    console.log('[KeyboardShortcuts] Window cycling not yet implemented');
    return;
  }
}

/**
 * Handle Escape key (close active window)
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleEscapeKey(event) {
  const activeWindow = getActiveWindow();
  
  if (!activeWindow) {
    return;
  }

  event.preventDefault();
  
  try {
    closeWindow(activeWindow.id);
    console.log('[KeyboardShortcuts] Closed window via Escape:', activeWindow.id);
  } catch (error) {
    console.error('[KeyboardShortcuts] Failed to close window:', error);
  }
}

/**
 * Handle minimize shortcut (Ctrl/Cmd + M)
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleMinimizeShortcut(event) {
  const activeWindow = getActiveWindow();
  
  if (!activeWindow) {
    return;
  }

  event.preventDefault();
  
  try {
    minimizeWindow(activeWindow.id);
    console.log('[KeyboardShortcuts] Minimized window via Ctrl/Cmd+M:', activeWindow.id);
  } catch (error) {
    console.error('[KeyboardShortcuts] Failed to minimize window:', error);
  }
}

/**
 * Handle close shortcut (Ctrl/Cmd + W)
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleCloseShortcut(event) {
  const activeWindow = getActiveWindow();
  
  if (!activeWindow) {
    return;
  }

  event.preventDefault();
  
  try {
    closeWindow(activeWindow.id);
    console.log('[KeyboardShortcuts] Closed window via Ctrl/Cmd+W:', activeWindow.id);
  } catch (error) {
    console.error('[KeyboardShortcuts] Failed to close window:', error);
  }
}

/**
 * Check if user is typing in an input context
 * @param {Element} element - Target element
 * @returns {boolean} True if typing context
 */
function isTypingContext(element) {
  if (!element) {
    return false;
  }

  const tagName = element.tagName.toUpperCase();
  
  // Check if in input/textarea
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    return true;
  }

  // Check if contenteditable
  if (element.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Disable keyboard shortcuts
 */
export function disableKeyboardShortcuts() {
  document.removeEventListener('keydown', handleKeyDown);
  console.log('[KeyboardShortcuts] Disabled');
}

/**
 * Register custom keyboard shortcut
 * @param {string} key - Key to bind
 * @param {Function} handler - Handler function
 * @param {Object} options - Options (ctrl, alt, shift, meta)
 */
export function registerShortcut(key, handler, options = {}) {
  // TODO: Implement custom shortcut registration
  console.warn('[KeyboardShortcuts] Custom shortcuts not yet implemented');
}
