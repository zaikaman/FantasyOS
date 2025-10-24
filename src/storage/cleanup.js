/**
 * Storage Cleanup
 * Utilities for cleaning up old data
 */

import { deleteOldNotifications } from './queries.js';

/**
 * Initialize cleanup tasks
 */
export function initializeCleanup() {
  console.log('[Cleanup] Initializing storage cleanup tasks');

  // Run cleanup on startup
  cleanupOldNotifications();

  // Run cleanup daily
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  setInterval(() => {
    cleanupOldNotifications();
  }, CLEANUP_INTERVAL);
}

/**
 * Clean up dismissed notifications older than 7 days
 */
function cleanupOldNotifications() {
  try {
    const DAYS_OLD = 7;
    deleteOldNotifications(DAYS_OLD);
    console.log(`[Cleanup] Deleted dismissed notifications older than ${DAYS_OLD} days`);
  } catch (error) {
    console.error('[Cleanup] Failed to cleanup old notifications:', error);
  }
}
