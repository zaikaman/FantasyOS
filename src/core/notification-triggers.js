/**
 * Notification Triggers
 * Event listeners that trigger notifications based on user activity
 */

import { eventBus, Events } from '../core/event-bus.js';
import { generateAINotification } from '../ai/notification-generator.js';
import { insertNotification } from '../storage/queries.js';
import { generateNotificationId } from '../utils/uuid.js';
import { now } from '../utils/date.js';
import { getSetting, setSetting } from '../storage/queries.js';

// Track last activity time
let lastActivityTime = Date.now();
let idleTimer = null;
let isIdleNotificationSent = false;

// Track notification frequency
const NOTIFICATION_COOLDOWN = {
  low: 10 * 60 * 1000,      // 10 minutes
  normal: 5 * 60 * 1000,     // 5 minutes
  high: 2 * 60 * 1000        // 2 minutes
};

let lastNotificationTime = 0;

/**
 * Initialize notification triggers
 */
export function initializeNotificationTriggers() {
  console.log('[NotificationTriggers] Initializing notification system');

  // Set default settings if not exists
  if (getSetting('notificationFrequency') === null) {
    setSetting('notificationFrequency', 'normal');
  }
  
  if (getSetting('aiNotificationsEnabled') === null) {
    setSetting('aiNotificationsEnabled', true);
  }

  // Setup event listeners
  setupFileEventListeners();
  setupWindowEventListeners();
  setupCalculatorEventListeners();
  setupIdleTimer();
  setupActivityTracking();

  console.log('[NotificationTriggers] All triggers initialized');
}

/**
 * Setup file event listeners
 */
function setupFileEventListeners() {
  // File save trigger
  eventBus.on(Events.FILE_CREATED, async (data) => {
    if (!shouldTriggerNotification()) return;

    const context = {
      category: 'fileSave',
      action: 'file created',
      fileName: data.fileName,
      fileType: data.fileType
    };

    await createNotification(context);
  });

  eventBus.on(Events.FILE_UPDATED, async (data) => {
    if (!shouldTriggerNotification()) return;

    const context = {
      category: 'fileSave',
      action: 'file updated',
      fileName: data.fileName,
      fileType: data.fileType
    };

    await createNotification(context);
  });

  // File delete trigger
  eventBus.on(Events.FILE_DELETED, async (data) => {
    if (!shouldTriggerNotification()) return;

    const context = {
      category: 'fileDelete',
      action: 'file deleted',
      fileName: data.fileName,
      fileType: data.fileType
    };

    await createNotification(context);
  });
}

/**
 * Setup window event listeners
 */
function setupWindowEventListeners() {
  // Window open trigger
  eventBus.on(Events.WINDOW_CREATED, async (data) => {
    if (!shouldTriggerNotification()) return;

    const context = {
      category: 'windowOpen',
      action: 'window opened',
      windowCount: data.totalWindows || 1
    };

    await createNotification(context);
  });

  // Window close trigger
  eventBus.on(Events.WINDOW_CLOSED, async (data) => {
    if (!shouldTriggerNotification()) return;

    const context = {
      category: 'windowClose',
      action: 'window closed',
      windowCount: data.remainingWindows || 0
    };

    await createNotification(context);
  });
}

/**
 * Setup calculator event listeners
 */
function setupCalculatorEventListeners() {
  // Calculator use trigger (listen for window created with calculator app)
  eventBus.on(Events.WINDOW_CREATED, async (data) => {
    if (data.appId === 'mana-calculator' && shouldTriggerNotification()) {
      const context = {
        category: 'calculatorUse',
        action: 'calculator opened'
      };

      await createNotification(context);
    }
  });
}

/**
 * Setup idle timer (triggers after 2 minutes of inactivity)
 */
function setupIdleTimer() {
  const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

  const resetIdleTimer = () => {
    lastActivityTime = Date.now();
    isIdleNotificationSent = false;

    if (idleTimer) {
      clearTimeout(idleTimer);
    }

    idleTimer = setTimeout(async () => {
      if (!isIdleNotificationSent && shouldTriggerNotification()) {
        const timeSinceLastActivity = Math.floor((Date.now() - lastActivityTime) / 60000);
        
        const context = {
          category: 'idle',
          action: 'user idle',
          timeSinceLastActivity: `${timeSinceLastActivity} minutes`
        };

        await createNotification(context);
        isIdleNotificationSent = true;
      }
    }, IDLE_TIMEOUT);
  };

  // Reset timer on any user activity
  document.addEventListener('mousemove', resetIdleTimer, { passive: true });
  document.addEventListener('keydown', resetIdleTimer, { passive: true });
  document.addEventListener('click', resetIdleTimer, { passive: true });

  // Start initial timer
  resetIdleTimer();
}

/**
 * Setup activity tracking
 */
function setupActivityTracking() {
  const updateActivity = () => {
    lastActivityTime = Date.now();
  };

  document.addEventListener('mousemove', updateActivity, { passive: true });
  document.addEventListener('keydown', updateActivity, { passive: true });
  document.addEventListener('click', updateActivity, { passive: true });
}

/**
 * Check if notification should be triggered based on frequency settings
 * @returns {boolean} True if notification should trigger
 */
function shouldTriggerNotification() {
  const aiEnabled = getSetting('aiNotificationsEnabled');
  
  if (aiEnabled === false) {
    return false;
  }

  const frequency = getSetting('notificationFrequency') || 'normal';
  const cooldown = NOTIFICATION_COOLDOWN[frequency] || NOTIFICATION_COOLDOWN.normal;

  const timeSinceLastNotification = Date.now() - lastNotificationTime;

  if (timeSinceLastNotification < cooldown) {
    return false;
  }

  return true;
}

/**
 * Create and insert notification
 * @param {Object} context - Notification context
 */
async function createNotification(context) {
  try {
    // Generate notification (AI or template)
    const notification = await generateAINotification(context);

    // Map to database schema
    const dbNotification = {
      id: generateNotificationId(),
      text: notification.message || notification.text || 'A notification has arrived!',
      context: JSON.stringify({
        category: context.category,
        icon: notification.icon || '✨',
        title: notification.title || 'Notification',
        ...context
      }),
      timestamp: now(),
      read: 0,
      dismissed: 0
    };

    // Insert to database
    insertNotification(dbNotification);

    // Emit event for UI update with full notification data
    eventBus.emit(Events.NOTIFICATION_CREATED, {
      ...dbNotification,
      icon: notification.icon || '✨',
      title: notification.title || 'Notification'
    });

    // Update last notification time
    lastNotificationTime = Date.now();

    console.log('[NotificationTriggers] Notification created:', dbNotification);
  } catch (error) {
    console.error('[NotificationTriggers] Failed to create notification:', error);
  }
}

/**
 * Manually trigger a notification (for testing)
 * @param {string} category - Notification category
 */
export async function triggerManualNotification(category = 'welcome') {
  const context = {
    category,
    action: 'manual trigger'
  };

  await createNotification(context);
}
