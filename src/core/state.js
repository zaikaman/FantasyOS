/**
 * Global State Management
 * Proxy-based reactive state with subscription API
 */

import { eventBus, Events } from './event-bus.js';

// Internal state object
const state = {
  // Window Management
  windows: [],
  activeWindowId: null,
  nextZIndex: 1000,
  maxWindows: 20,

  // Application Registry
  apps: [],

  // File Storage
  files: [],
  selectedFileId: null,

  // Notifications
  notifications: [],
  unreadNotificationCount: 0,

  // Desktop Environment
  desktop: {
    particleCount: 100,
    particlesEnabled: true,
    backgroundTheme: 'mossy_green'
  },

  // Sidebar
  sidebar: {
    visible: true,
    minimizedWindows: [],
    activeTab: 'windows'
  },

  // Settings
  settings: {},

  // System State
  isInitialized: false,
  isDatabaseReady: false,
  lastSaveTimestamp: 0,
  storageQuotaUsedMB: 0
};

// Subscribers map: path -> Set of callbacks
const subscribers = new Map();

// Batch update queue
let batchTimeout = null;
const pendingNotifications = new Set();

/**
 * Notify subscribers for a specific path
 * @param {string} path - State path
 * @param {*} newValue - New value
 * @param {*} oldValue - Old value
 */
function notifySubscribers(path, newValue, oldValue) {
  if (subscribers.has(path)) {
    subscribers.get(path).forEach(callback => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`Error in state subscriber for ${path}:`, error);
      }
    });
  }
}

/**
 * Schedule batched notification
 * @param {string} path - State path
 * @param {*} newValue - New value
 * @param {*} oldValue - Old value
 */
function scheduleNotify(path, newValue, oldValue) {
  pendingNotifications.add({ path, newValue, oldValue });

  if (!batchTimeout) {
    batchTimeout = requestAnimationFrame(() => {
      pendingNotifications.forEach(({ path, newValue, oldValue }) => {
        notifySubscribers(path, newValue, oldValue);
      });
      pendingNotifications.clear();
      batchTimeout = null;
    });
  }
}

/**
 * Create reactive proxy for state object
 * @param {*} target - Target object
 * @param {string} path - Current path
 * @returns {Proxy} Reactive proxy
 */
function createReactiveProxy(target, path = '') {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];

      // Return value as-is for functions and symbols
      if (typeof value === 'function' || typeof prop === 'symbol') {
        return value;
      }

      // Wrap objects and arrays in proxies for deep reactivity
      if (value !== null && typeof value === 'object') {
        const newPath = path ? `${path}.${prop}` : String(prop);
        return createReactiveProxy(value, newPath);
      }

      return value;
    },

    set(obj, prop, value) {
      const oldValue = obj[prop];

      // Only update if value actually changed
      if (oldValue === value) {
        return true;
      }

      obj[prop] = value;

      // Notify subscribers
      const fullPath = path ? `${path}.${prop}` : String(prop);
      scheduleNotify(fullPath, value, oldValue);

      // Also notify parent path for nested updates
      if (path) {
        scheduleNotify(path, obj, obj);
      }

      return true;
    }
  });
}

// Create reactive state proxy
export const reactiveState = createReactiveProxy(state);

/**
 * Subscribe to state changes
 * @param {string} path - State path to watch (e.g., 'windows', 'windows.0.x')
 * @param {Function} callback - Callback function (newValue, oldValue) => void
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path, callback) {
  if (!subscribers.has(path)) {
    subscribers.set(path, new Set());
  }

  subscribers.get(path).add(callback);

  // Return unsubscribe function
  return () => {
    if (subscribers.has(path)) {
      subscribers.get(path).delete(callback);
    }
  };
}

/**
 * Get current state value
 * @param {string} path - State path (optional, returns entire state if omitted)
 * @returns {*} State value
 */
export function getState(path) {
  if (!path) {
    return state;
  }

  const parts = path.split('.');
  let value = state;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      return undefined;
    }
  }

  return value;
}

/**
 * Set state value (triggers reactivity)
 * @param {string} path - State path
 * @param {*} value - New value
 */
export function setState(path, value) {
  const parts = path.split('.');
  const lastPart = parts.pop();
  let target = reactiveState;

  for (const part of parts) {
    target = target[part];
    if (!target) {
      throw new Error(`Invalid state path: ${path}`);
    }
  }

  target[lastPart] = value;
}

/**
 * Batch multiple state updates (single notification)
 * @param {Function} updateFn - Function that performs multiple updates
 */
export function batchUpdate(updateFn) {
  // Clear any pending notifications
  if (batchTimeout) {
    cancelAnimationFrame(batchTimeout);
    batchTimeout = null;
  }

  // Perform updates
  updateFn();

  // Manually trigger batched notifications
  pendingNotifications.forEach(({ path, newValue, oldValue }) => {
    notifySubscribers(path, newValue, oldValue);
  });
  pendingNotifications.clear();
}

/**
 * Initialize state from database
 * @param {Object} data - Data to hydrate state with
 */
export function initializeState(data) {
  if (data.windows) {
    reactiveState.windows = data.windows;
  }
  if (data.files) {
    reactiveState.files = data.files;
  }
  if (data.notifications) {
    reactiveState.notifications = data.notifications;
    reactiveState.unreadNotificationCount = data.notifications.filter(n => !n.read).length;
  }
  if (data.settings) {
    reactiveState.settings = data.settings;
    // Apply settings to desktop/sidebar state
    if (data.settings.particle_density) {
      reactiveState.desktop.particleCount = data.settings.particle_density;
    }
    if (data.settings.particle_enabled !== undefined) {
      reactiveState.desktop.particlesEnabled = data.settings.particle_enabled;
    }
    if (data.settings.theme_color) {
      reactiveState.desktop.backgroundTheme = data.settings.theme_color;
    }
  }

  reactiveState.isInitialized = true;
  eventBus.emit(Events.STATE_INITIALIZED, { state: reactiveState });
}

// Export as default for convenience
export default reactiveState;
