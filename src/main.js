/**
 * Main Entry Point
 * Application initialization and orchestration
 */

import '../styles/reset.css';
import '../styles/variables.css';
import '../styles/desktop.css';
import '../styles/window.css';
import '../styles/treasure-chest.css';
import '../styles/mana-calculator.css';
import '../styles/quest-log.css';
import '../styles/popup-notifications.css';
import '../styles/taskbar.css';

import { initDatabase, saveToIndexedDB } from './storage/database.js';
import { getAllWindows, getAllFiles, getAllNotifications, getAllSettings, deleteAllWindows } from './storage/queries.js';
import { restoreWindowSession, setupAutoSnapshot } from './storage/restore-session.js';
import { initializeState, subscribe } from './core/state.js';
import { eventBus, Events } from './core/event-bus.js';
import { initDesktop, showDesktop } from './desktop/desktop.js';
import { initParticles, startParticles, setParticleDensity } from './desktop/particles.js';
import { initPerformanceMonitoring, mark, measure, logAllMetrics, showFPSCounter } from './utils/performance.js';
import { initWindowManager } from './window/window-manager.js';
import { initDragHandler } from './window/drag-handler.js';
import { initResizeHandler } from './window/resize-handler.js';
import { initKeyboardShortcuts } from './window/keyboard-shortcuts.js';
import { initializeNotificationTriggers } from './core/notification-triggers.js';
import { initializeCleanup } from './storage/cleanup.js';
import { initializePopupNotifications } from './notifications/popup-notifications.js';
import { initTaskbar } from './taskbar/taskbar.js';

// Global error handling
let errorBoundary = null;
let loadingOverlay = null;

/**
 * Main initialization function
 */
async function init() {
  try {
    console.log('[Main] Starting Enchanted Realm Shell...');

    // Initialize performance monitoring
    initPerformanceMonitoring();
    mark('init-start');

    // Get UI elements
    errorBoundary = document.getElementById('error-boundary');
    loadingOverlay = document.getElementById('loading-overlay');

    // Show loading
    showLoading();

    // Step 1: Initialize database
    console.log('[Main] Step 1: Initializing database...');
    mark('db-init-start');
    await initDatabase();
    measure('db-init', 'db-init-start');

    // Step 2: Load data from database
    console.log('[Main] Step 2: Loading data from database...');
    
    // Clear old windows (windows should not persist between sessions)
    // Window state restoration happens separately in Step 8
    deleteAllWindows();
    
    const windows = []; // Start with no windows
    const files = getAllFiles();
    const notifications = getAllNotifications();
    const settings = getAllSettings();

    console.log('[Main] Loaded:', {
      windows: windows.length,
      files: files.length,
      notifications: notifications.length,
      settings: Object.keys(settings).length
    });

    // Step 3: Initialize global state
    console.log('[Main] Step 3: Initializing global state...');
    initializeState({
      windows,
      files,
      notifications,
      settings
    });

    // Step 4: Initialize desktop environment
    console.log('[Main] Step 4: Initializing desktop...');
    initDesktop();

    // Step 5: Initialize window management
    console.log('[Main] Step 5: Initializing window system...');
    initWindowManager();
    initDragHandler();
    initResizeHandler();
    initKeyboardShortcuts();
    initTaskbar();

    // Step 5.5: Initialize notification system
    console.log('[Main] Step 5.5: Initializing notifications...');
    initializePopupNotifications();
    initializeNotificationTriggers();
    initializeCleanup();

    // Step 6: Initialize particle system
    console.log('[Main] Step 6: Initializing particles...');
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
      initParticles(canvas);

      // Apply particle settings
      const particleDensity = settings.particle_density || 100;
      const particlesEnabled = settings.particle_enabled !== false;

      setParticleDensity(particleDensity);

      if (particlesEnabled) {
        startParticles();
      }
    }

    // Step 7: Setup auto-save on state changes
    setupAutoSave();

    // Step 8: Restore window session (recreate windows from previous session)
    console.log('[Main] Step 8: Restoring window session...');
    await restoreWindowSession();

    // Setup auto-snapshot for window state backup
    setupAutoSnapshot();

    // Step 9: Show desktop
    console.log('[Main] Step 9: Showing desktop...');
    hideLoading();
    showDesktop();
    
    // Mark initialization complete
    mark('init-complete');
    measure('total-init', 'init-start', 'init-complete');

    console.log('[Main] ✨ Enchanted Realm Shell initialized successfully!');

    // Log all performance metrics
    logAllMetrics();

    // Emit initialization complete event
    eventBus.emit('app:ready', { timestamp: Date.now() });
  } catch (error) {
    console.error('[Main] Initialization failed:', error);
    showError(error);
  }
}

/**
 * Setup auto-save on state changes
 */
function setupAutoSave() {
  // Debounced save function
  let saveTimeout = null;

  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      try {
        await saveToIndexedDB();
        console.log('[Main] State auto-saved');
      } catch (error) {
        console.error('[Main] Auto-save failed:', error);
      }
    }, 1000);
  };

  // Subscribe to critical state changes
  subscribe('windows', debouncedSave);
  subscribe('files', debouncedSave);
  subscribe('notifications', debouncedSave);
  subscribe('settings', debouncedSave);
}

/**
 * Show loading overlay
 */
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  if (loadingOverlay) {
    // Wait for animations to complete
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
    }, 1500);
  }
}

/**
 * Show error boundary
 * @param {Error} error - Error object
 */
function showError(error) {
  if (errorBoundary) {
    errorBoundary.classList.remove('hidden');

    const messageElement = errorBoundary.querySelector('.error-message');
    if (messageElement) {
      messageElement.textContent = error.message || 'An unknown error occurred';
    }

    // Setup reload button
    const reloadBtn = errorBoundary.querySelector('#reload-realm');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  // Hide loading overlay
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

/**
 * Global error handlers
 */
window.addEventListener('error', event => {
  console.error('[Main] Uncaught error:', event.error);
  showError(event.error || new Error('An unexpected error occurred'));
  event.preventDefault();
});

window.addEventListener('unhandledrejection', event => {
  console.error('[Main] Unhandled promise rejection:', event.reason);
  showError(event.reason || new Error('An unexpected error occurred'));
  event.preventDefault();
});

// Performance monitoring
const perfStart = performance.now();

eventBus.on('app:ready', () => {
  const perfEnd = performance.now();
  const initTime = (perfEnd - perfStart) / 1000;

  console.log(`[Performance] Initialization took ${initTime.toFixed(2)}s`);

  // Check FCP target (<1.5s)
  if (initTime > 1.5) {
    console.warn('[Performance] ⚠️ Initialization exceeded FCP target of 1.5s');
  } else {
    console.log('[Performance] ✓ Met FCP target');
  }
});

// Start initialization
init();

// Development debug helpers
if (import.meta.env.DEV) {
  window.__DEBUG__ = {
    initDatabase,
    saveToIndexedDB,
    eventBus,
    Events
  };

  console.log('[Dev] Debug helpers available at window.__DEBUG__');
}
