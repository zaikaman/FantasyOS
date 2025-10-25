-- Migration 004: Add Calendar Events Table
-- Date: 2025-10-25
-- Purpose: Add calendar events for Arcane Clock Tower

CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'event-moon-abc123')
    title TEXT NOT NULL,              -- Event title
    event_date TEXT NOT NULL,         -- ISO 8601 date string (YYYY-MM-DD)
    event_time TEXT,                  -- Optional time (HH:MM)
    description TEXT,                 -- Event description
    event_type TEXT DEFAULT 'custom', -- 'custom', 'moon_phase', 'quest', 'reminder'
    linked_quest_id TEXT,             -- Optional link to quest_log table
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    modified_at INTEGER NOT NULL      -- Unix timestamp (milliseconds)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_linked_quest ON calendar_events(linked_quest_id);

-- Sample calendar events
INSERT OR IGNORE INTO calendar_events (id, title, event_date, event_time, description, event_type, created_at, modified_at) VALUES
    (
        'event-welcome-full-moon',
        'Full Moon Ceremony',
        date('now', '+3 days'),
        '20:00',
        'The full moon rises tonight. A perfect time for magical rituals and celebrations.',
        'moon_phase',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
    ),
    (
        'event-welcome-quest',
        'Explore the Enchanted Realm',
        date('now', '+1 days'),
        '10:00',
        'Begin your journey through the mystical desktop environment.',
        'quest',
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
    );

-- Update schema version
INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (4, strftime('%s', 'now') * 1000);
