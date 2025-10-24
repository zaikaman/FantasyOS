# Data Model: Enchanted Realm Shell

**Purpose**: Define SQLite schema and entity relationships for persistent storage  
**Date**: 2025-10-25  
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md) | [research.md](./research.md)

## Entity-Relationship Overview

```
┌─────────────┐         ┌──────────────┐         ┌────────────────┐
│   Windows   │         │     Files    │         │ Notifications  │
├─────────────┤         ├──────────────┤         ├────────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)        │
│ app_id      │         │ name         │         │ text           │
│ x           │         │ type         │         │ context        │
│ y           │         │ content      │         │ timestamp      │
│ width       │         │ thumbnail    │         │ read           │
│ height      │         │ created_at   │         │ dismissed      │
│ z_index     │         │ modified_at  │         └────────────────┘
│ minimized   │         │ size_bytes   │
│ created_at  │         └──────────────┘
│ modified_at │
└─────────────┘

┌──────────────┐
│   Settings   │
├──────────────┤
│ key (PK)     │
│ value        │
│ modified_at  │
└──────────────┘
```

**Relationships**:
- Windows → Apps: 1:N (one app can have multiple windows, though currently limited to 1 instance per app)
- Files: Independent entity (no foreign keys, files are user-created content)
- Notifications: Independent entity (AI-generated or system-generated messages)
- Settings: Key-value store for user preferences (theme, particle density, etc.)

---

## Entity Definitions

### 1. Windows Table

**Purpose**: Persist window state across browser sessions

```sql
CREATE TABLE windows (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'win-calc-abc123')
    app_id TEXT NOT NULL,             -- Application identifier (e.g., 'mana-calculator')
    x INTEGER NOT NULL,               -- X position in pixels
    y INTEGER NOT NULL,               -- Y position in pixels
    width INTEGER NOT NULL,           -- Window width in pixels
    height INTEGER NOT NULL,          -- Window height in pixels
    z_index INTEGER NOT NULL,         -- Stacking order (higher = front)
    minimized INTEGER DEFAULT 0,      -- 0 = normal, 1 = minimized to sidebar
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    modified_at INTEGER NOT NULL      -- Unix timestamp (milliseconds)
);

-- Indexes for performance
CREATE INDEX idx_windows_app_id ON windows(app_id);
CREATE INDEX idx_windows_z_index ON windows(z_index);
CREATE INDEX idx_windows_minimized ON windows(minimized);
```

**Validation Rules**:
- `id`: Must be unique, format: `win-{app_id}-{random}`
- `app_id`: Must match registered application ID in app registry
- `x`, `y`: Must be within screen bounds (0 ≤ x ≤ screen.width - 100, 0 ≤ y ≤ screen.height - 100)
- `width`, `height`: Min 300x200, Max screen.width x screen.height
- `z_index`: Auto-increment starting at 1000, max 9999 (prevents overflow in CSS)
- `minimized`: Boolean stored as INTEGER (SQLite doesn't have native boolean)

**State Transitions**:
```
[Created] → [Active] → [Minimized] → [Restored] → [Active]
                 ↓
              [Closed] (row deleted from database)
```

**Business Logic**:
- On window creation: Insert row with current position/size, z_index = MAX(z_index) + 1
- On window drag: UPDATE x, y, modified_at WHERE id = ?
- On window resize: UPDATE width, height, modified_at WHERE id = ?
- On window minimize: UPDATE minimized = 1, modified_at WHERE id = ?
- On window restore: UPDATE minimized = 0, modified_at WHERE id = ?
- On window close: DELETE FROM windows WHERE id = ?
- On window focus: UPDATE z_index = (MAX(z_index) + 1), modified_at WHERE id = ?

---

### 2. Files Table

**Purpose**: Store user-created content (notes and doodles)

```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'file-scroll-xyz789')
    name TEXT NOT NULL,               -- User-defined filename
    type TEXT NOT NULL,               -- 'scroll' (text note) or 'artifact' (doodle)
    content TEXT NOT NULL,            -- Text content or base64-encoded image data
    thumbnail TEXT,                   -- Base64-encoded thumbnail (for artifacts only)
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    modified_at INTEGER NOT NULL,     -- Unix timestamp (milliseconds)
    size_bytes INTEGER NOT NULL       -- Content size in bytes (for quota tracking)
);

-- Indexes for performance
CREATE INDEX idx_files_type ON files(type);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_modified_at ON files(modified_at);
```

**Validation Rules**:
- `id`: Must be unique, format: `file-{type}-{random}`
- `name`: 1-255 characters, must not be empty
- `type`: Must be 'scroll' or 'artifact'
- `content`: 
  - For 'scroll': Plain text, max 100KB
  - For 'artifact': Base64-encoded PNG/JPEG data URL, max 10MB
- `thumbnail`: Base64-encoded image (max 10KB), generated on save for artifacts
- `size_bytes`: Auto-calculated from content.length

**State Transitions**:
```
[Created] → [Saved] → [Modified] → [Saved]
                 ↓
              [Deleted] (row deleted from database)
```

**Business Logic**:
- On file create: INSERT with name, type, content, timestamps
- On file edit: UPDATE content, modified_at, size_bytes WHERE id = ?
- On file rename: UPDATE name, modified_at WHERE id = ?
- On file delete: DELETE FROM files WHERE id = ?
- On quota check: SELECT SUM(size_bytes) FROM files (ensure < 50MB total)

**Content Encoding**:
- **Scrolls (text notes)**: Store as plain UTF-8 text
- **Artifacts (doodles)**: Store as data URL: `data:image/png;base64,iVBORw0KGgo...`
- **Thumbnails**: Generate 200x200 px preview using Canvas API, store as base64

---

### 3. Notifications Table

**Purpose**: Store quest notifications (AI-generated and system)

```sql
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'notif-quest-123')
    text TEXT NOT NULL,               -- Notification message (max 280 characters)
    context TEXT,                     -- Trigger context JSON: {"action": "file_saved", "timestamp": 123456}
    timestamp INTEGER NOT NULL,       -- Unix timestamp (milliseconds)
    read INTEGER DEFAULT 0,           -- 0 = unread, 1 = read
    dismissed INTEGER DEFAULT 0       -- 0 = visible, 1 = dismissed
);

-- Indexes for performance
CREATE INDEX idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_dismissed ON notifications(dismissed);
```

**Validation Rules**:
- `id`: Must be unique, format: `notif-{type}-{random}`
- `text`: 1-280 characters (Twitter-style limit for brevity)
- `context`: JSON string with action metadata (optional)
- `read`, `dismissed`: Boolean stored as INTEGER

**State Transitions**:
```
[Created] → [Unread] → [Read] → [Dismissed]
                          ↓
                    [Auto-archived after 7 days]
```

**Business Logic**:
- On notification create: INSERT with text, context, timestamp
- On notification view: UPDATE read = 1 WHERE id = ?
- On notification dismiss: UPDATE dismissed = 1 WHERE id = ?
- On cleanup: DELETE FROM notifications WHERE timestamp < (NOW - 7 days) AND dismissed = 1

**Notification Types** (stored in context.action):
- `idle`: User idle for 2+ minutes
- `file_saved`: User saved a file
- `file_deleted`: User deleted a file
- `window_opened`: User launched an application
- `window_closed`: User closed an application
- `calculator_used`: User performed calculation
- `system`: System message (e.g., low storage warning)

---

### 4. Settings Table

**Purpose**: Store user preferences and application configuration

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,             -- Setting name (e.g., 'theme_color')
    value TEXT NOT NULL,              -- Setting value (JSON string for complex values)
    modified_at INTEGER NOT NULL      -- Unix timestamp (milliseconds)
);
```

**Validation Rules**:
- `key`: Unique setting name (snake_case)
- `value`: JSON-encoded value (allows strings, numbers, booleans, objects, arrays)

**Default Settings**:
```javascript
{
  "theme_color": "mossy_green",           // Fantasy theme variant
  "particle_density": 100,                // Number of firefly particles
  "particle_enabled": true,               // Enable/disable particle system
  "ai_notifications": true,               // Enable AI-generated notifications
  "notification_frequency": "normal",     // low, normal, high
  "sound_effects": true,                  // Enable fantasy sound effects
  "auto_save_interval": 30,               // Auto-save database every N seconds
  "window_snap_to_grid": false,           // Snap windows to grid when dragging
  "max_windows": 20,                      // Maximum simultaneous windows
  "storage_quota_warning_mb": 40          // Warn when approaching 50MB limit
}
```

**Business Logic**:
- On setting update: INSERT OR REPLACE INTO settings (key, value, modified_at) VALUES (?, ?, ?)
- On setting read: SELECT value FROM settings WHERE key = ? (with default fallback if not found)

---

## Database Schema Migrations

**Migration Strategy**: Versioned migrations with rollback support

### Migration 001: Initial Schema

```sql
-- migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS windows (
    id TEXT PRIMARY KEY,
    app_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    z_index INTEGER NOT NULL,
    minimized INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_windows_app_id ON windows(app_id);
CREATE INDEX IF NOT EXISTS idx_windows_z_index ON windows(z_index);
CREATE INDEX IF NOT EXISTS idx_windows_minimized ON windows(minimized);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    thumbnail TEXT,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_modified_at ON files(modified_at);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    context TEXT,
    timestamp INTEGER NOT NULL,
    read INTEGER DEFAULT 0,
    dismissed INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed ON notifications(dismissed);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    modified_at INTEGER NOT NULL
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

INSERT INTO schema_version (version, applied_at) VALUES (1, strftime('%s', 'now') * 1000);

-- Insert default settings
INSERT INTO settings (key, value, modified_at) VALUES
    ('theme_color', '"mossy_green"', strftime('%s', 'now') * 1000),
    ('particle_density', '100', strftime('%s', 'now') * 1000),
    ('particle_enabled', 'true', strftime('%s', 'now') * 1000),
    ('ai_notifications', 'true', strftime('%s', 'now') * 1000),
    ('notification_frequency', '"normal"', strftime('%s', 'now') * 1000),
    ('sound_effects', 'true', strftime('%s', 'now') * 1000),
    ('auto_save_interval', '30', strftime('%s', 'now') * 1000),
    ('window_snap_to_grid', 'false', strftime('%s', 'now') * 1000),
    ('max_windows', '20', strftime('%s', 'now') * 1000),
    ('storage_quota_warning_mb', '40', strftime('%s', 'now') * 1000);
```

### Future Migration Example: Add Tags to Files

```sql
-- migrations/002_add_file_tags.sql
ALTER TABLE files ADD COLUMN tags TEXT; -- JSON array of tags

UPDATE schema_version SET version = 2, applied_at = strftime('%s', 'now') * 1000;
```

**Migration Runner** (src/storage/migrations.js):
```javascript
async function runMigrations(db) {
  const currentVersion = await getCurrentSchemaVersion(db);
  const migrations = [
    { version: 1, sql: migration001 },
    { version: 2, sql: migration002 }
  ];
  
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.exec(migration.sql);
      console.log(`Applied migration ${migration.version}`);
    }
  }
}
```

---

## Data Access Patterns

### Query Performance Considerations

**Fast queries** (indexed):
- Get all windows: `SELECT * FROM windows ORDER BY z_index` → Uses idx_windows_z_index
- Get minimized windows: `SELECT * FROM windows WHERE minimized = 1` → Uses idx_windows_minimized
- Get files by type: `SELECT * FROM files WHERE type = 'scroll'` → Uses idx_files_type
- Get recent files: `SELECT * FROM files ORDER BY modified_at DESC LIMIT 10` → Uses idx_files_modified_at
- Get unread notifications: `SELECT * FROM notifications WHERE read = 0` → Uses idx_notifications_read

**Slow queries** (avoid or optimize):
- Full-text search in file content: `SELECT * FROM files WHERE content LIKE '%keyword%'` → Requires FTS virtual table
- Large content retrieval: `SELECT content FROM files WHERE size_bytes > 1000000` → Use pagination

**Prepared Statements** (prevent SQL injection):
```javascript
const stmt = db.prepare('INSERT INTO windows (id, app_id, x, y, width, height, z_index, created_at, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
stmt.run([windowId, appId, x, y, width, height, zIndex, now, now]);
```

---

## Storage Quota Management

**Browser Limits**:
- Chrome: 50% of available disk space (min 50MB)
- Firefox: 50% of available disk space (min 50MB)
- Safari: 1GB max per origin

**Quota Tracking**:
```javascript
async function checkStorageQuota() {
  const totalSize = await db.exec('SELECT SUM(size_bytes) as total FROM files');
  const usedMB = (totalSize[0].values[0][0] || 0) / 1024 / 1024;
  
  if (usedMB > 40) {
    // Show warning notification
    showNotification('Your treasure chest is nearly full! Consider removing old scrolls.');
  }
  
  if (usedMB > 50) {
    // Prevent new saves
    throw new Error('Storage quota exceeded. Delete files to free space.');
  }
}
```

**Cleanup Strategies**:
- Auto-delete dismissed notifications older than 7 days
- Compress large artifact thumbnails (reduce quality if > 10KB)
- Offer user option to export files and clear local storage

---

## Summary

**Total Tables**: 4 (windows, files, notifications, settings)  
**Total Indexes**: 10 (optimized for common queries)  
**Schema Version**: 1 (initial)  
**Estimated Size**: 
- Empty database: ~10KB
- With 1000 files (avg 5KB each): ~5MB
- With 100 windows + 500 notifications: ~50KB

All entities designed for efficient querying and minimal storage overhead.
