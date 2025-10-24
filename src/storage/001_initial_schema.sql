-- SQLite Schema for Enchanted Realm Shell
-- Version: 1.0.0
-- Date: 2025-10-25
-- Purpose: Complete database schema with all tables, indexes, and default data

-- ============================================================================
-- Table: windows
-- Purpose: Persist window state across browser sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS windows (
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

CREATE INDEX IF NOT EXISTS idx_windows_app_id ON windows(app_id);
CREATE INDEX IF NOT EXISTS idx_windows_z_index ON windows(z_index);
CREATE INDEX IF NOT EXISTS idx_windows_minimized ON windows(minimized);

-- ============================================================================
-- Table: files
-- Purpose: Store user-created content (notes and doodles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'file-scroll-xyz789')
    name TEXT NOT NULL,               -- User-defined filename
    type TEXT NOT NULL,               -- 'scroll' (text note) or 'artifact' (doodle)
    content TEXT NOT NULL,            -- Text content or base64-encoded image data
    thumbnail TEXT,                   -- Base64-encoded thumbnail (for artifacts only)
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    modified_at INTEGER NOT NULL,     -- Unix timestamp (milliseconds)
    size_bytes INTEGER NOT NULL       -- Content size in bytes (for quota tracking)
);

CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_modified_at ON files(modified_at);

-- ============================================================================
-- Table: notifications
-- Purpose: Store quest notifications (AI-generated and system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'notif-quest-123')
    text TEXT NOT NULL,               -- Notification message (max 280 characters)
    context TEXT,                     -- Trigger context JSON: {"action": "file_saved", "timestamp": 123456}
    timestamp INTEGER NOT NULL,       -- Unix timestamp (milliseconds)
    read INTEGER DEFAULT 0,           -- 0 = unread, 1 = read
    dismissed INTEGER DEFAULT 0       -- 0 = visible, 1 = dismissed
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed ON notifications(dismissed);

-- ============================================================================
-- Table: settings
-- Purpose: Store user preferences and application configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,             -- Setting name (e.g., 'theme_color')
    value TEXT NOT NULL,              -- Setting value (JSON string for complex values)
    modified_at INTEGER NOT NULL      -- Unix timestamp (milliseconds)
);

-- ============================================================================
-- Table: schema_version
-- Purpose: Track database schema version for migrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
);

-- Initialize schema version
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, strftime('%s', 'now') * 1000);

-- ============================================================================
-- Default Settings
-- ============================================================================
INSERT OR IGNORE INTO settings (key, value, modified_at) VALUES
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

-- ============================================================================
-- Sample Welcome Data (optional, for first-time users)
-- ============================================================================
INSERT OR IGNORE INTO files (id, name, type, content, created_at, modified_at, size_bytes) VALUES
    (
        'file-scroll-welcome',
        'Welcome to the Enchanted Realm',
        'scroll',
        'Greetings, traveler! 🧙‍♂️

You have entered the Enchanted Realm Shell—a mystical desktop environment where magic meets technology.

🪶 **Scrolls**: Create and store your written thoughts as ancient parchments
🎨 **Artifacts**: Draw magical symbols and save them to your treasure vault
🔮 **Mana Calculator**: Perform arcane calculations with the power of runes
📜 **Quest Log**: Track your adventures and tasks

Your data persists across sessions, safely stored in your browser''s treasure chest (IndexedDB).

May your journey be filled with wonder and productivity!

- The Realm Keeper',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000,
        512
    );

INSERT OR IGNORE INTO notifications (id, text, context, timestamp, read, dismissed) VALUES
    (
        'notif-welcome-1',
        'Welcome to the Enchanted Realm! Your mystical workspace awaits. ✨',
        '{"action": "first_launch", "type": "system"}',
        strftime('%s', 'now') * 1000,
        0,
        0
    );
