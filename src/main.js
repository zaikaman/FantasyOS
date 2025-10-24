/**
 * Main Entry Point
 * Application initialization and orchestration
 */

import './styles/reset.css';
import './styles/variables.css';
import './styles/desktop.css';

import { initDatabase, saveToIndexedDB } from './storage/database.js';
import { getAllWindows, getAllFiles, getAllNotifications, getAllSettings } from './storage/queries.js';
import { initializeState, subscribe } from './core/state.js';
import { eventBus, Events } from './core/event-bus.js';
import { initDesktop, showDesktop } from './desktop/desktop.js';
import { initParticles, startParticles, setParticleDensity } from './desktop/particles.js';
import { initPerformanceMonitoring, mark, measure, logAllMetrics, showFPSCounter } from './utils/performance.js';

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
    const windows = getAllWindows();
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

    // Step 5: Initialize particle system
    console.log('[Main] Step 5: Initializing particles...');
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

    // Step 6: Setup auto-save on state changes
    setupAutoSave();

    // Step 7: Show desktop
    console.log('[Main] Step 7: Showing desktop...');
    hideLoading();
    showDesktop();
    
    // Mark initialization complete
    mark('init-complete');
    measure('total-init', 'init-start', 'init-complete');

    console.log('[Main] ✨ Enchanted Realm Shell initialized successfully!');

    // Log all performance metrics
    logAllMetrics();

    // Show FPS counter in development mode
    if (import.meta.env.DEV) {
      showFPSCounter(true);
    }

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
