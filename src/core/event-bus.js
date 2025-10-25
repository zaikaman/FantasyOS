/**
 * Event Bus
 * Publish-subscribe pattern for cross-module communication
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName).add(callback);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  off(eventName, callback) {
    if (this.events.has(eventName)) {
      this.events.get(eventName).delete(callback);
    }
  }

  /**
   * Publish an event
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    if (this.events.has(eventName)) {
      this.events.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to event once (auto-unsubscribe after first emit)
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    const wrappedCallback = data => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    return this.on(eventName, wrappedCallback);
  }

  /**
   * Remove all subscribers for an event
   * @param {string} eventName - Event name
   */
  clear(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get number of subscribers for an event
   * @param {string} eventName - Event name
   * @returns {number} Subscriber count
   */
  listenerCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).size : 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Event name constants
export const Events = {
  // Window events
  WINDOW_CREATED: 'window:created',
  WINDOW_CLOSED: 'window:closed',
  WINDOW_FOCUSED: 'window:focused',
  WINDOW_MINIMIZED: 'window:minimized',
  WINDOW_RESTORED: 'window:restored',
  WINDOW_MOVED: 'window:moved',
  WINDOW_RESIZED: 'window:resized',

  // File events
  FILE_CREATED: 'file:created',
  FILE_UPDATED: 'file:updated',
  FILE_DELETED: 'file:deleted',
  FILE_MOVED: 'file:moved',
  FILE_OPEN: 'file:open',

  // Folder events
  FOLDER_CREATED: 'folder:created',
  FOLDER_UPDATED: 'folder:updated',
  FOLDER_DELETED: 'folder:deleted',
  FOLDER_MOVED: 'folder:moved',

  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DISMISSED: 'notification:dismissed',

  // Database events
  DATABASE_READY: 'database:ready',
  DATABASE_SAVED: 'database:saved',
  DATABASE_ERROR: 'database:error',

  // App events
  APP_LAUNCHED: 'app:launched',
  APP_CLOSED: 'app:closed',

  // System events
  STORAGE_QUOTA_WARNING: 'storage:quota:warning',
  STORAGE_QUOTA_ERROR: 'storage:quota:error',
  STATE_INITIALIZED: 'state:initialized'
};
