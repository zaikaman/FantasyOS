/**
 * Database Queries
 * Prepared statement functions for CRUD operations
 */

import { getDatabase } from './database.js';

// ============================================================================
// Window Queries
// ============================================================================

export function getAllWindows() {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM windows ORDER BY z_index ASC');

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const rows = result[0].values;

  return rows.map(row => {
    const window = {};
    columns.forEach((col, i) => {
      window[col] = row[i];
    });
    // Convert INTEGER booleans to actual booleans
    window.minimized = Boolean(window.minimized);
    return window;
  });
}

export function getWindowById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM windows WHERE id = ?');
  stmt.bind([id]);

  if (stmt.step()) {
    const window = stmt.getAsObject();
    window.minimized = Boolean(window.minimized);
    stmt.free();
    return window;
  }

  stmt.free();
  return null;
}

export function insertWindow(window) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO windows (id, app_id, x, y, width, height, z_index, minimized, created_at, modified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    window.id,
    window.app_id,
    window.x,
    window.y,
    window.width,
    window.height,
    window.z_index,
    window.minimized ? 1 : 0,
    window.created_at,
    window.modified_at
  ]);

  stmt.free();
}

export function updateWindow(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');

  const values = Object.values(updates).map(val => (typeof val === 'boolean' ? (val ? 1 : 0) : val));

  const stmt = db.prepare(`UPDATE windows SET ${fields} WHERE id = ?`);
  stmt.run([...values, id]);
  stmt.free();
}

export function deleteWindow(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM windows WHERE id = ?');
  stmt.run([id]);
  stmt.free();
}

export function getMaxZIndex() {
  const db = getDatabase();
  const result = db.exec('SELECT MAX(z_index) as max_z FROM windows');

  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] || 1000;
  }

  return 1000;
}

// ============================================================================
// File Queries
// ============================================================================

export function getAllFiles() {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM files ORDER BY modified_at DESC');

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const rows = result[0].values;

  return rows.map(row => {
    const file = {};
    columns.forEach((col, i) => {
      file[col] = row[i];
    });
    return file;
  });
}

export function getFilesByType(type) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM files WHERE type = ? ORDER BY modified_at DESC');
  stmt.bind([type]);

  const files = [];
  while (stmt.step()) {
    files.push(stmt.getAsObject());
  }

  stmt.free();
  return files;
}

export function getFileById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  stmt.bind([id]);

  if (stmt.step()) {
    const file = stmt.getAsObject();
    stmt.free();
    return file;
  }

  stmt.free();
  return null;
}

export function insertFile(file) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO files (id, name, type, content, thumbnail, created_at, modified_at, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    file.id,
    file.name,
    file.type,
    file.content,
    file.thumbnail || null,
    file.created_at,
    file.modified_at,
    file.size_bytes
  ]);

  stmt.free();
}

export function updateFile(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');

  const stmt = db.prepare(`UPDATE files SET ${fields} WHERE id = ?`);
  stmt.run([...Object.values(updates), id]);
  stmt.free();
}

export function deleteFile(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM files WHERE id = ?');
  stmt.run([id]);
  stmt.free();
}

export function getTotalFileSize() {
  const db = getDatabase();
  const result = db.exec('SELECT SUM(size_bytes) as total FROM files');

  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] || 0;
  }

  return 0;
}

// ============================================================================
// Notification Queries
// ============================================================================

export function getAllNotifications() {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM notifications ORDER BY timestamp DESC');

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const rows = result[0].values;

  return rows.map(row => {
    const notification = {};
    columns.forEach((col, i) => {
      notification[col] = row[i];
    });
    notification.read = Boolean(notification.read);
    notification.dismissed = Boolean(notification.dismissed);
    return notification;
  });
}

export function getUnreadNotifications() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM notifications WHERE read = 0 ORDER BY timestamp DESC');
  stmt.bind();

  const notifications = [];
  while (stmt.step()) {
    const notification = stmt.getAsObject();
    notification.read = Boolean(notification.read);
    notification.dismissed = Boolean(notification.dismissed);
    notifications.push(notification);
  }

  stmt.free();
  return notifications;
}

export function insertNotification(notification) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO notifications (id, text, context, timestamp, read, dismissed)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    notification.id,
    notification.text,
    notification.context || null,
    notification.timestamp,
    notification.read ? 1 : 0,
    notification.dismissed ? 1 : 0
  ]);

  stmt.free();
}

export function updateNotification(id, updates) {
  const db = getDatabase();
  const fields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');

  const values = Object.values(updates).map(val => (typeof val === 'boolean' ? (val ? 1 : 0) : val));

  const stmt = db.prepare(`UPDATE notifications SET ${fields} WHERE id = ?`);
  stmt.run([...values, id]);
  stmt.free();
}

export function deleteNotification(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
  stmt.run([id]);
  stmt.free();
}

export function deleteOldDismissedNotifications(daysAgo) {
  const db = getDatabase();
  const cutoffTimestamp = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  const stmt = db.prepare('DELETE FROM notifications WHERE dismissed = 1 AND timestamp < ?');
  stmt.run([cutoffTimestamp]);
  stmt.free();
}

// ============================================================================
// Settings Queries
// ============================================================================

export function getSetting(key) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);

  if (stmt.step()) {
    const value = stmt.get()[0];
    stmt.free();

    // Parse JSON value
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  stmt.free();
  return null;
}

export function getAllSettings() {
  const db = getDatabase();
  const result = db.exec('SELECT key, value FROM settings');

  if (result.length === 0) {
    return {};
  }

  const settings = {};
  result[0].values.forEach(row => {
    const [key, value] = row;
    try {
      settings[key] = JSON.parse(value);
    } catch {
      settings[key] = value;
    }
  });

  return settings;
}

export function setSetting(key, value) {
  const db = getDatabase();
  const jsonValue = JSON.stringify(value);
  const timestamp = Date.now();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, modified_at)
    VALUES (?, ?, ?)
  `);

  stmt.run([key, jsonValue, timestamp]);
  stmt.free();
}
