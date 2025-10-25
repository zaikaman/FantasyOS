/**
 * Popup Notifications
 * Display quest notifications as floating popups instead of sidebar
 */

import { getUnreadNotifications, dismissNotification } from '../storage/queries.js';
import { eventBus, Events } from '../core/event-bus.js';

const MAX_VISIBLE_NOTIFICATIONS = 3;
const NOTIFICATION_DURATION = 8000; // 8 seconds
const ANIMATION_DURATION = 500; // 0.5 seconds

let popupContainer = null;
let activePopups = new Map(); // Map<notificationId, { element, timeoutId }>

/**
 * Initialize popup notifications system
 */
export function initializePopupNotifications() {
  // Create popup container
  popupContainer = document.createElement('div');
  popupContainer.className = 'notification-popup-container';
  popupContainer.id = 'notification-popup-container';
  document.body.appendChild(popupContainer);

  // Subscribe to new notifications
  eventBus.on(Events.NOTIFICATION_CREATED, (data) => {
    showNotificationPopup(data);
  });

  // Load any unread notifications on startup (show most recent)
  const unreadNotifications = getUnreadNotifications();
  if (unreadNotifications.length > 0) {
    // Show only the most recent one on startup
    const mostRecent = unreadNotifications[0];
    showNotificationPopup(mostRecent);
  }

  console.log('[PopupNotifications] Initialized');
}

/**
 * Show notification as popup
 * @param {Object} notification - Notification data
 */
export function showNotificationPopup(notification) {
  if (!popupContainer) return;

  // Don't show if already displayed or dismissed
  if (activePopups.has(notification.id) || notification.dismissed) {
    return;
  }

  // Limit concurrent notifications
  if (activePopups.size >= MAX_VISIBLE_NOTIFICATIONS) {
    // Dismiss oldest notification
    const oldestId = Array.from(activePopups.keys())[0];
    dismissPopup(oldestId, true);
  }

  // Parse context for title, icon, etc.
  let title = 'Quest Notification';
  let icon = '⚔️';
  let message = notification.text;
  
  if (notification.context) {
    try {
      const context = typeof notification.context === 'string' 
        ? JSON.parse(notification.context) 
        : notification.context;
      title = context.title || title;
      icon = context.icon || icon;
    } catch (e) {
      // If context parsing fails, use defaults
    }
  }

  // Create popup element
  const popupEl = createPopupElement(notification, title, icon, message);
  
  // Add to container
  popupContainer.appendChild(popupEl);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    popupEl.classList.add('visible');
  });

  // Auto-dismiss after duration
  const timeoutId = setTimeout(() => {
    dismissPopup(notification.id, false);
  }, NOTIFICATION_DURATION);

  // Store active popup
  activePopups.set(notification.id, {
    element: popupEl,
    timeoutId
  });
}

/**
 * Create popup element
 * @param {Object} notification - Notification data
 * @param {string} title - Notification title
 * @param {string} icon - Notification icon
 * @param {string} message - Notification message
 * @returns {HTMLElement} Popup element
 */
function createPopupElement(notification, title, icon, message) {
  const popupEl = document.createElement('div');
  popupEl.className = 'notification-popup';
  popupEl.dataset.id = notification.id;

  // Format timestamp
  const timestamp = formatTimestamp(notification.timestamp);

  popupEl.innerHTML = `
    <div class="popup-decoration"></div>
    <div class="popup-icon">${icon}</div>
    <div class="popup-content">
      <div class="popup-header">
        <div class="popup-title">${escapeHtml(title)}</div>
        <div class="popup-timestamp">${timestamp}</div>
      </div>
      <div class="popup-message">${escapeHtml(message)}</div>
    </div>
    <button class="popup-dismiss" title="Dismiss" aria-label="Dismiss notification">×</button>
  `;

  // Dismiss button handler
  const dismissBtn = popupEl.querySelector('.popup-dismiss');
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissPopup(notification.id, true);
  });

  // Click to dismiss
  popupEl.addEventListener('click', () => {
    dismissPopup(notification.id, true);
  });

  // Hover to pause auto-dismiss
  popupEl.addEventListener('mouseenter', () => {
    pauseAutoDismiss(notification.id);
  });

  popupEl.addEventListener('mouseleave', () => {
    resumeAutoDismiss(notification.id);
  });

  return popupEl;
}

/**
 * Dismiss popup notification
 * @param {string} notificationId - Notification ID
 * @param {boolean} updateDatabase - Whether to mark as dismissed in database
 */
function dismissPopup(notificationId, updateDatabase = false) {
  const popup = activePopups.get(notificationId);
  if (!popup) return;

  // Clear auto-dismiss timeout
  if (popup.timeoutId) {
    clearTimeout(popup.timeoutId);
  }

  // Add exit animation
  popup.element.classList.remove('visible');
  popup.element.classList.add('exiting');

  // Create particle effect
  createDismissParticles(popup.element);

  // Remove after animation
  setTimeout(() => {
    if (popup.element && popup.element.parentNode) {
      popup.element.remove();
    }
    activePopups.delete(notificationId);

    // Update database if requested
    if (updateDatabase) {
      dismissNotification(notificationId);
      
      eventBus.emit(Events.NOTIFICATION_DISMISSED, {
        notificationId,
        timestamp: Date.now()
      });
    }
  }, ANIMATION_DURATION);
}

/**
 * Pause auto-dismiss for a notification
 * @param {string} notificationId - Notification ID
 */
function pauseAutoDismiss(notificationId) {
  const popup = activePopups.get(notificationId);
  if (!popup) return;

  if (popup.timeoutId) {
    clearTimeout(popup.timeoutId);
    popup.timeoutId = null;
  }
}

/**
 * Resume auto-dismiss for a notification
 * @param {string} notificationId - Notification ID
 */
function resumeAutoDismiss(notificationId) {
  const popup = activePopups.get(notificationId);
  if (!popup) return;

  // Restart the auto-dismiss timer (give more time since user was reading)
  popup.timeoutId = setTimeout(() => {
    dismissPopup(notificationId, false);
  }, NOTIFICATION_DURATION / 2);
}

/**
 * Create particle effect on dismiss
 * @param {HTMLElement} element - Element to create particles from
 */
function createDismissParticles(element) {
  const rect = element.getBoundingClientRect();
  const particleCount = 12;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'popup-particle';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;

    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 80 + Math.random() * 40;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;

    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);

    document.body.appendChild(particle);

    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
}

/**
 * Format timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted time
 */
function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // More than 24 hours
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Clear all active popups
 */
export function clearAllPopups() {
  for (const [id] of activePopups) {
    dismissPopup(id, false);
  }
}
