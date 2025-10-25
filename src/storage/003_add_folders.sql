-- Migration: Add folder support for hierarchical file system
-- Version: 3
-- Date: 2025-10-25

-- ============================================================================
-- Table: folders
-- Purpose: Hierarchical folder structure for organizing files
-- ============================================================================
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,              -- UUID v4 (e.g., 'folder-abc123')
    name TEXT NOT NULL,               -- Folder name
    parent_id TEXT,                   -- Parent folder ID (NULL for root)
    created_at INTEGER NOT NULL,      -- Unix timestamp (milliseconds)
    modified_at INTEGER NOT NULL,     -- Unix timestamp (milliseconds)
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);

-- ============================================================================
-- Update files table to support folders
-- ============================================================================
-- Add folder_id column to files table
ALTER TABLE files ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);

-- ============================================================================
-- Create default root folders
-- ============================================================================
INSERT OR IGNORE INTO folders (id, name, parent_id, created_at, modified_at) VALUES
    ('folder-root-scrolls', 'Scrolls', NULL, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('folder-root-artifacts', 'Artifacts', NULL, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
    ('folder-root-archives', 'Archives', NULL, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- ============================================================================
-- Update schema version
-- ============================================================================
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (3, strftime('%s', 'now') * 1000);
