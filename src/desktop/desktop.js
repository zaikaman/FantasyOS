/**
 * Desktop Manager
 * Handles desktop environment initialization and rune launcher
 */

import { getAllApps } from '../apps/app-registry.js';
import { eventBus, Events } from '../core/event-bus.js';
import { createWindow } from '../window/window-manager.js';

let desktopElement = null;
let launcherElement = null;

/**
 * Initialize desktop environment
 */
export function initDesktop() {
  console.log('[Desktop] Initializing...');

  desktopElement = document.getElementById('desktop-root');
  launcherElement = document.getElementById('app-launcher');

  if (!desktopElement || !launcherElement) {
    throw new Error('Desktop elements not found');
  }

  // Render rune launcher
  renderRuneLauncher();

  // Initialize treasure chest click handler
  initTreasureChest();

  console.log('[Desktop] Initialized');
}

/**
 * Render rune launcher with app icons
 */
function renderRuneLauncher() {
  const apps = getAllApps();

  launcherElement.innerHTML = '';

  apps.forEach(app => {
    const runeIcon = createRuneIcon(app);
    launcherElement.appendChild(runeIcon);
  });

  console.log(`[Desktop] Rendered ${apps.length} rune icons`);
}

/**
 * Create rune icon element
 * @param {Object} app - App definition
 * @returns {HTMLElement} Rune icon element
 */
function createRuneIcon(app) {
  const container = document.createElement('div');
  container.className = 'rune-icon';
  container.dataset.appId = app.id;

  // Create SVG container
  const iconContainer = document.createElement('div');
  iconContainer.innerHTML = app.icon;

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'rune-tooltip';
  tooltip.textContent = app.name;

  container.appendChild(iconContainer);
  container.appendChild(tooltip);

  // Add click handler
  container.addEventListener('click', () => {
    handleRuneClick(app);
  });

  // Add hover effects
  container.addEventListener('mouseenter', () => {
    eventBus.emit('rune:hover', { appId: app.id, name: app.name });
  });

  return container;
}

/**
 * Handle rune icon click
 * @param {Object} app - App definition
 */
function handleRuneClick(app) {
  console.log(`[Desktop] Launching app: ${app.name}`);

  // Create window for the app
  try {
    createWindow(app.id);
  } catch (error) {
    console.error('[Desktop] Failed to create window:', error);
  }

  // Emit app launch event
  eventBus.emit(Events.APP_LAUNCHED, {
    appId: app.id,
    appName: app.name,
    timestamp: Date.now()
  });

  // Visual feedback
  const runeElement = launcherElement.querySelector(`[data-app-id="${app.id}"]`);
  if (runeElement) {
    runeElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
      runeElement.style.transform = '';
    }, 150);
  }
}

/**
 * Show desktop (fade in)
 */
export function showDesktop() {
  if (desktopElement) {
    desktopElement.style.opacity = '0';
    desktopElement.style.transition = 'opacity 0.5s ease-in-out';
    setTimeout(() => {
      desktopElement.style.opacity = '1';
    }, 100);
  }
}

/**
 * Hide desktop (fade out)
 */
export function hideDesktop() {
  if (desktopElement) {
    desktopElement.style.opacity = '0';
  }
}

/**
 * Initialize treasure chest click handler
 */
function initTreasureChest() {
  const chestElement = document.getElementById('treasure-chest');
  
  if (!chestElement) {
    console.warn('[Desktop] Treasure chest element not found');
    return;
  }

  chestElement.addEventListener('click', () => {
    console.log('[Desktop] Opening treasure chest...');
    
    // Create window for treasure chest app
    try {
      createWindow('treasure-chest');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'treasure-chest',
        appName: 'Treasure Chest',
        timestamp: Date.now()
      });
      
      // Visual feedback
      chestElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        chestElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open treasure chest:', error);
    }
  });

  console.log('[Desktop] Treasure chest initialized');
}
