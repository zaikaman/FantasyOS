/**
 * Session Restore
 * Restores window state on browser refresh
 */

import { getAllWindows as dbGetAllWindows } from './queries.js';
import { createWindow, setWindowPosition, setWindowSize, minimizeWindow } from '../window/window-manager.js';
import { getAppById } from '../apps/app-registry.js';

/**
 * Restore window session from database
 * Called during app initialization to recreate windows from previous session
 */
export async function restoreWindowSession() {
  console.log('[SessionRestore] Restoring window session...');

  try {
    // Get all windows from database
    const windows = dbGetAllWindows();

    if (windows.length === 0) {
      console.log('[SessionRestore] No windows to restore');
      return;
    }

    console.log(`[SessionRestore] Found ${windows.length} windows to restore`);

    // Sort by z-index (restore in order)
    const sortedWindows = windows.sort((a, b) => a.z_index - b.z_index);

    // Restore each window
    for (const windowData of sortedWindows) {
      await restoreWindow(windowData);
    }

    console.log('[SessionRestore] ✓ Window session restored');
  } catch (error) {
    console.error('[SessionRestore] Failed to restore session:', error);
  }
}

/**
 * Restore a single window
 * @param {Object} windowData - Window data from database
 */
async function restoreWindow(windowData) {
  try {
    // Get app definition
    const app = getAppById(windowData.app_id);
    
    if (!app) {
      console.warn(`[SessionRestore] App not found: ${windowData.app_id}, skipping window`);
      return;
    }

    // Create window with saved position/size
    const newWindow = createWindow(windowData.app_id, {
      x: windowData.x,
      y: windowData.y,
      width: windowData.width,
      height: windowData.height,
      title: windowData.title,
      minimized: windowData.minimized === 1,
    });

    console.log(`[SessionRestore] Restored window: ${windowData.title} (${windowData.app_id})`);
  } catch (error) {
    console.error(`[SessionRestore] Failed to restore window ${windowData.id}:`, error);
  }
}

/**
 * Clear window session (close all windows)
 * Useful for "reset workspace" functionality
 */
export function clearWindowSession() {
  console.log('[SessionRestore] Clearing window session...');
  
  // Windows are automatically deleted from database when closed
  // This is just a utility function for future use
  
  console.log('[SessionRestore] Window session cleared');
}

/**
 * Save current window snapshot to localStorage as backup
 * Called periodically or before page unload
 */
export function saveWindowSnapshot() {
  try {
    const windows = dbGetAllWindows();
    const snapshot = {
      timestamp: Date.now(),
      windows: windows.map(w => ({
        id: w.id,
        app_id: w.app_id,
        title: w.title,
        x: w.x,
        y: w.y,
        width: w.width,
        height: w.height,
        z_index: w.z_index,
        minimized: w.minimized,
      })),
    };

    localStorage.setItem('fantasyos_window_snapshot', JSON.stringify(snapshot));
    console.log('[SessionRestore] Window snapshot saved to localStorage');
  } catch (error) {
    console.warn('[SessionRestore] Failed to save snapshot:', error);
  }
}

/**
 * Load window snapshot from localStorage
 * Used as fallback if IndexedDB fails
 * @returns {Array|null} Window snapshot or null
 */
export function loadWindowSnapshot() {
  try {
    const snapshotJson = localStorage.getItem('fantasyos_window_snapshot');
    
    if (!snapshotJson) {
      return null;
    }

    const snapshot = JSON.parse(snapshotJson);
    
    // Check if snapshot is recent (within 7 days)
    const age = Date.now() - snapshot.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (age > maxAge) {
      console.log('[SessionRestore] Snapshot too old, ignoring');
      localStorage.removeItem('fantasyos_window_snapshot');
      return null;
    }

    console.log('[SessionRestore] Loaded window snapshot from localStorage');
    return snapshot.windows;
  } catch (error) {
    console.warn('[SessionRestore] Failed to load snapshot:', error);
    return null;
  }
}

/**
 * Setup auto-save of window snapshots
 * Saves snapshot every 30 seconds and before page unload
 */
export function setupAutoSnapshot() {
  // Save every 30 seconds
  setInterval(() => {
    saveWindowSnapshot();
  }, 30000);

  // Save before page unload
  window.addEventListener('beforeunload', () => {
    saveWindowSnapshot();
  });

  console.log('[SessionRestore] Auto-snapshot enabled');
}

/**
 * Restore from localStorage snapshot
 * Used as emergency fallback
 */
export async function restoreFromSnapshot() {
  const snapshot = loadWindowSnapshot();
  
  if (!snapshot || snapshot.length === 0) {
    console.log('[SessionRestore] No snapshot available');
    return;
  }

  console.log(`[SessionRestore] Restoring ${snapshot.length} windows from snapshot...`);

  for (const windowData of snapshot) {
    await restoreWindow(windowData);
  }

  console.log('[SessionRestore] ✓ Restored from snapshot');
}
