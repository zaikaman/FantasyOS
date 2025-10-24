/**
 * Sidebar
 * Tavern-style sidebar for minimized windows
 */

import { getState, subscribe } from '../core/state.js';
import { restoreWindow } from '../window/window-manager.js';
import { getAppById } from '../apps/app-registry.js';
import { initializeNotifications } from './notifications.js';

let sidebarElement = null;
let minimizedContainer = null;

/**
 * Initialize sidebar
 */
export function initSidebar() {
  sidebarElement = document.getElementById('sidebar');
  
  if (!sidebarElement) {
    console.warn('[Sidebar] Sidebar element not found');
    return;
  }

  // Create minimized windows container
  minimizedContainer = document.createElement('div');
  minimizedContainer.className = 'sidebar-minimized';
  minimizedContainer.innerHTML = `
    <div class="sidebar-section-title">Minimized Windows</div>
    <div class="sidebar-minimized-list" id="minimized-list"></div>
  `;
  
  sidebarElement.appendChild(minimizedContainer);

  // Initialize notifications section
  initializeNotifications(sidebarElement);

  // Subscribe to window state changes
  subscribe('windows', renderMinimizedWindows);

  // Initial render
  renderMinimizedWindows();

  console.log('[Sidebar] Initialized');
}

/**
 * Render minimized windows in sidebar
 */
function renderMinimizedWindows() {
  const state = getState();
  const minimizedWindows = state.windows.filter(w => w.minimized);

  const listEl = document.getElementById('minimized-list');
  if (!listEl) {
    return;
  }

  // Clear existing
  listEl.innerHTML = '';

  if (minimizedWindows.length === 0) {
    listEl.innerHTML = '<div class="sidebar-empty">No minimized windows</div>';
    return;
  }

  // Render each minimized window
  minimizedWindows.forEach(window => {
    const app = getAppById(window.app_id);
    const icon = createMinimizedIcon(window, app);
    listEl.appendChild(icon);
  });

  console.log(`[Sidebar] Rendered ${minimizedWindows.length} minimized windows`);
}

/**
 * Create minimized window icon
 * @param {Object} window - Window data
 * @param {Object} app - App data
 * @returns {HTMLElement} Icon element
 */
function createMinimizedIcon(window, app) {
  const icon = document.createElement('div');
  icon.className = 'sidebar-minimized-icon';
  icon.dataset.windowId = window.id;
  icon.title = window.title;
  
  icon.innerHTML = `
    <div class="sidebar-icon-graphic">
      ${app?.icon || '📄'}
    </div>
    <div class="sidebar-icon-title">${escapeHtml(window.title)}</div>
  `;

  // Click to restore
  icon.addEventListener('click', () => {
    restoreWindow(window.id);
  });

  // Hover effect
  icon.addEventListener('mouseenter', () => {
    icon.style.transform = 'translateX(4px)';
  });

  icon.addEventListener('mouseleave', () => {
    icon.style.transform = '';
  });

  return icon;
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
 * Show sidebar
 */
export function showSidebar() {
  if (sidebarElement) {
    sidebarElement.classList.remove('hidden');
  }
}

/**
 * Hide sidebar
 */
export function hideSidebar() {
  if (sidebarElement) {
    sidebarElement.classList.add('hidden');
  }
}

/**
 * Toggle sidebar visibility
 */
export function toggleSidebar() {
  if (sidebarElement) {
    sidebarElement.classList.toggle('hidden');
  }
}
