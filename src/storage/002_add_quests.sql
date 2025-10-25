-- Migration 002: Add Quests Table
-- Date: 2025-10-25
-- Purpose: Add quest/task management system

-- ============================================================================
-- Table: quests
-- Purpose: Track user quests/tasks in the Quest Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'quest-abc123')
    title TEXT NOT NULL,              -- Quest title (max 200 characters)
    description TEXT,                 -- Quest description (optional, markdown supported)
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
    priority TEXT DEFAULT 'normal',   -- 'low', 'normal', 'high', 'urgent'
    due_date INTEGER,                 -- Unix timestamp (milliseconds), optional
    tags TEXT,                        -- JSON array of tags: ["combat", "exploration"]
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    completed_at INTEGER,             -- Unix timestamp when completed/failed
    modified_at INTEGER NOT NULL      -- Unix timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_priority ON quests(priority);
CREATE INDEX IF NOT EXISTS idx_quests_due_date ON quests(due_date);
CREATE INDEX IF NOT EXISTS idx_quests_created_at ON quests(created_at);

-- ============================================================================
-- Sample Quests (optional, for first-time users)
-- ============================================================================
INSERT OR IGNORE INTO quests (id, title, description, status, priority, tags, created_at, modified_at) VALUES
    (
        'quest-welcome-1',
        'Explore the Enchanted Realm',
        'Take a tour of the mystical desktop! Try opening different applications, creating files, and customizing your workspace.',
        'active',
        'normal',
        '["tutorial", "exploration"]',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
    ),
    (
        'quest-welcome-2',
        'Create Your First Scroll',
        'Open the Treasure Chest Explorer and craft your first magical scroll. Write down your thoughts or plans for the day.',
        'active',
        'normal',
        '["tutorial", "creativity"]',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
    ),
    (
        'quest-welcome-3',
        'Master the Mana Calculator',
        'Launch the Mana Calculator and perform some arcane computations. Try adding, subtracting, multiplying, and dividing!',
        'active',
        'low',
        '["tutorial", "magic"]',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
    );

-- Update schema version
INSERT INTO schema_version (version, applied_at) VALUES (2, strftime('%s', 'now') * 1000);
