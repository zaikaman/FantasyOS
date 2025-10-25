/**
 * Database Manager
 * sql.js initialization and IndexedDB persistence
 */

import initSqlJs from 'sql.js';
import { runMigrations } from './migrations.js';
import { eventBus, Events } from '../core/event-bus.js';

const DB_NAME = 'enchanted-realm-db';
const DB_STORE_NAME = 'sqliteDb';
const DB_KEY = 'database';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const QUOTA_WARNING_MB = 40;
const QUOTA_ERROR_MB = 50;

let db = null;
let SQL = null;
let autoSaveTimer = null;

/**
 * Initialize sql.js and load database from IndexedDB
 * @returns {Promise<*>} Database instance
 */
export async function initDatabase() {
  try {
    console.log('[Database] Initializing sql.js...');

    // Load sql.js WASM
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    console.log('[Database] sql.js loaded successfully');

    // Try to load existing database from IndexedDB
    const savedDb = await loadFromIndexedDB();

    if (savedDb) {
      console.log('[Database] Loading existing database from IndexedDB');
      db = new SQL.Database(savedDb);
    } else {
      console.log('[Database] Creating new database');
      db = new SQL.Database();
    }

    // Run migrations
    await runMigrations(db);

    // Start auto-save
    startAutoSave();

    // Emit ready event
    eventBus.emit(Events.DATABASE_READY, { db });

    console.log('[Database] Initialization complete');
    return db;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    eventBus.emit(Events.DATABASE_ERROR, { error });
    throw error;
  }
}

/**
 * Get database instance
 * @returns {*} Database instance
 * @throws {Error} If database not initialized
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save database to IndexedDB
 * @returns {Promise<void>}
 */
export async function saveToIndexedDB() {
  if (!db) {
    return;
  }

  try {
    const data = db.export();
    const buffer = data.buffer;

    // Check quota before saving
    const sizeMB = buffer.byteLength / 1024 / 1024;
    await checkStorageQuota(sizeMB);

    await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const idb = request.result;
        const transaction = idb.transaction([DB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(DB_STORE_NAME);

        const putRequest = store.put(buffer, DB_KEY);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = event => {
        const idb = event.target.result;
        if (!idb.objectStoreNames.contains(DB_STORE_NAME)) {
          idb.createObjectStore(DB_STORE_NAME);
        }
      };
    });

    eventBus.emit(Events.DATABASE_SAVED, { timestamp: Date.now() });
    console.log('[Database] Saved to IndexedDB');
  } catch (error) {
    console.error('[Database] Failed to save to IndexedDB:', error);
    eventBus.emit(Events.DATABASE_ERROR, { error });
    throw error;
  }
}

/**
 * Load database from IndexedDB
 * @returns {Promise<Uint8Array|null>} Database buffer or null
 */
async function loadFromIndexedDB() {
  try {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const idb = request.result;

        if (!idb.objectStoreNames.contains(DB_STORE_NAME)) {
          resolve(null);
          return;
        }

        const transaction = idb.transaction([DB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(DB_STORE_NAME);
        const getRequest = store.get(DB_KEY);

        getRequest.onsuccess = () => {
          const buffer = getRequest.result;
          resolve(buffer ? new Uint8Array(buffer) : null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = event => {
        const idb = event.target.result;
        if (!idb.objectStoreNames.contains(DB_STORE_NAME)) {
          idb.createObjectStore(DB_STORE_NAME);
        }
        resolve(null); // New database
      };
    });
  } catch (error) {
    console.error('[Database] Failed to load from IndexedDB:', error);
    return null;
  }
}

/**
 * Check storage quota and emit warnings
 * @param {number} sizeMB - Current database size in MB
 * @returns {Promise<void>}
 */
export async function checkStorageQuota(sizeMB) {
  if (sizeMB >= QUOTA_ERROR_MB) {
    const error = new Error(
      'Storage quota exceeded! Delete files to free space.'
    );
    eventBus.emit(Events.STORAGE_QUOTA_ERROR, { sizeMB, limit: QUOTA_ERROR_MB });
    throw error;
  }

  if (sizeMB >= QUOTA_WARNING_MB) {
    eventBus.emit(Events.STORAGE_QUOTA_WARNING, {
      sizeMB,
      limit: QUOTA_WARNING_MB
    });
    console.warn(`[Database] Storage quota warning: ${sizeMB.toFixed(2)}MB used`);
  }
}

/**
 * Get current database size in MB
 * @returns {number} Size in megabytes
 */
export function getDatabaseSize() {
  if (!db) {
    return 0;
  }

  try {
    const data = db.export();
    return data.buffer.byteLength / 1024 / 1024;
  } catch (error) {
    console.error('[Database] Failed to get size:', error);
    return 0;
  }
}

/**
 * Get storage quota information from browser
 * @returns {Promise<{used: number, quota: number}>} Storage info in bytes
 */
export async function getStorageQuota() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 50 * 1024 * 1024 // Default 50MB if not available
      };
    } else {
      // Fallback for browsers that don't support the API
      const dbSize = getDatabaseSize();
      return {
        used: dbSize * 1024 * 1024, // Convert MB to bytes
        quota: 50 * 1024 * 1024 // 50MB default
      };
    }
  } catch (error) {
    console.error('[Database] Failed to get storage quota:', error);
    const dbSize = getDatabaseSize();
    return {
      used: dbSize * 1024 * 1024,
      quota: 50 * 1024 * 1024
    };
  }
}

/**
 * Start auto-save timer
 */
function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = setInterval(async () => {
    try {
      await saveToIndexedDB();
    } catch (error) {
      console.error('[Database] Auto-save failed:', error);
    }
  }, AUTO_SAVE_INTERVAL);

  console.log(`[Database] Auto-save enabled (every ${AUTO_SAVE_INTERVAL / 1000}s)`);
}

/**
 * Stop auto-save timer
 */
export function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('[Database] Auto-save disabled');
  }
}

/**
 * Close database and save
 * @returns {Promise<void>}
 */
export async function closeDatabase() {
  stopAutoSave();

  if (db) {
    await saveToIndexedDB();
    db.close();
    db = null;
    console.log('[Database] Closed');
  }
}

// Save on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (db) {
      const data = db.export();
      const buffer = data.buffer;

      // Synchronous IndexedDB write (limited browser support)
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const idb = request.result;
          const transaction = idb.transaction([DB_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(DB_STORE_NAME);
          store.put(buffer, DB_KEY);
        };
      } catch (error) {
        console.error('[Database] Failed to save on unload:', error);
      }
    }
  });
}
