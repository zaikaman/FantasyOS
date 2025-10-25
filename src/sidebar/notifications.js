/**
 * Notifications Sidebar
 * Display quest notifications in the tavern sidebar
 */

import { getUnreadNotifications, dismissNotification } from '../storage/queries.js';
import { eventBus, Events } from '../core/event-bus.js';

let notificationsContainer = null;
let expandedNotificationId = null;

/**
 * Initialize notifications sidebar
 * @param {HTMLElement} sidebarEl - Sidebar container element
 */
export function initializeNotifications(sidebarEl) {
  // Create notifications container (full sidebar)
  const notificationsWrapper = document.createElement('div');
  notificationsWrapper.className = 'notifications-container';
  notificationsWrapper.innerHTML = `
    <div class="notifications-header">
      <h3 class="notifications-title">Quest Notifications</h3>
      <span class="notification-badge" id="notification-badge">0</span>
    </div>
    <div class="notifications-list" id="notifications-list"></div>
  `;

  sidebarEl.appendChild(notificationsWrapper);
  notificationsContainer = notificationsWrapper.querySelector('#notifications-list');

  // Load initial notifications
  renderNotifications();

  // Subscribe to new notifications
  eventBus.on(Events.NOTIFICATION_CREATED, () => {
    renderNotifications();
  });

  console.log('[Notifications] Sidebar initialized');
}

/**
 * Render all notifications
 */
export function renderNotifications() {
  if (!notificationsContainer) return;

  const notifications = getUnreadNotifications();
  
  // Update badge count
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = notifications.length;
    badge.style.display = notifications.length > 0 ? 'flex' : 'none';
  }

  // Clear container
  notificationsContainer.innerHTML = '';

  if (notifications.length === 0) {
    notificationsContainer.innerHTML = `
      <div class="notifications-empty">
        <div class="empty-icon">🌙</div>
        <p>All quiet in the realm...</p>
      </div>
    `;
    return;
  }

  // Render notification items
  notifications.forEach(notification => {
    const notificationEl = createNotificationElement(notification);
    notificationsContainer.appendChild(notificationEl);
  });
}

/**
 * Create notification element
 * @param {Object} notification - Notification data
 * @returns {HTMLElement} Notification element
 */
function createNotificationElement(notification) {
  const notificationEl = document.createElement('div');
  notificationEl.className = 'notification-item';
  notificationEl.dataset.id = notification.id;

  const isExpanded = expandedNotificationId === notification.id;

  // Parse context for title, icon, etc.
  let title = 'Notification';
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

  // Format timestamp
  const timestamp = formatTimestamp(notification.timestamp);

  notificationEl.innerHTML = `
    <div class="notification-header">
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${escapeHtml(title)}</div>
        <div class="notification-timestamp">${timestamp}</div>
      </div>
      <button class="notification-dismiss" title="Dismiss">×</button>
    </div>
    <div class="notification-body ${isExpanded ? 'expanded' : ''}">
      <p class="notification-message">${escapeHtml(message)}</p>
    </div>
  `;

  // Click to expand/collapse
  const header = notificationEl.querySelector('.notification-header');
  header.addEventListener('click', (e) => {
    if (!e.target.classList.contains('notification-dismiss')) {
      toggleNotification(notification.id);
    }
  });

  // Dismiss button
  const dismissBtn = notificationEl.querySelector('.notification-dismiss');
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleDismiss(notification.id, notificationEl);
  });

  return notificationEl;
}

/**
 * Toggle notification expanded state
 * @param {string} notificationId - Notification ID
 */
function toggleNotification(notificationId) {
  if (expandedNotificationId === notificationId) {
    expandedNotificationId = null;
  } else {
    expandedNotificationId = notificationId;
  }
  
  renderNotifications();
}

/**
 * Handle notification dismiss
 * @param {string} notificationId - Notification ID
 * @param {HTMLElement} notificationEl - Notification element
 */
function handleDismiss(notificationId, notificationEl) {
  // Add fade-out animation
  notificationEl.classList.add('dismissing');

  // Create particle effect
  createDismissParticles(notificationEl);

  // Wait for animation
  setTimeout(() => {
    // Update database
    dismissNotification(notificationId);

    // Emit event
    eventBus.emit(Events.NOTIFICATION_DISMISSED, {
      notificationId,
      timestamp: Date.now()
    });

    // Re-render
    renderNotifications();
  }, 500);
}

/**
 * Create particle effect on dismiss
 * @param {HTMLElement} element - Element to create particles from
 */
function createDismissParticles(element) {
  const rect = element.getBoundingClientRect();
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'notification-particle';
    particle.style.left = `${rect.left + rect.width / 2}px`;
    particle.style.top = `${rect.top + rect.height / 2}px`;

    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 100;
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
