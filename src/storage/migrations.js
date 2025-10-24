/**
 * Database Migration Runner
 * Handles versioned schema migrations
 */

import initialSchema from './001_initial_schema.sql?raw';

/**
 * Available migrations in order
 */
const migrations = [{ version: 1, name: 'Initial Schema', sql: initialSchema }];

/**
 * Get current schema version from database
 * @param {*} db - sql.js database instance
 * @returns {Promise<number>} Current version (0 if no version table)
 */
export async function getCurrentSchemaVersion(db) {
  try {
    const result = db.exec('SELECT MAX(version) as version FROM schema_version');
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] || 0;
    }
    return 0;
  } catch (error) {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Run all pending migrations
 * @param {*} db - sql.js database instance
 * @returns {Promise<number>} Number of migrations applied
 */
export async function runMigrations(db) {
  const currentVersion = await getCurrentSchemaVersion(db);
  let appliedCount = 0;

  console.log(`[Migrations] Current schema version: ${currentVersion}`);

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`[Migrations] Applying migration ${migration.version}: ${migration.name}`);

      try {
        // Execute migration SQL
        db.run(migration.sql);
        appliedCount++;

        console.log(`[Migrations] ✓ Migration ${migration.version} applied successfully`);
      } catch (error) {
        console.error(`[Migrations] ✗ Failed to apply migration ${migration.version}:`, error);
        throw new Error(
          `Migration ${migration.version} failed: ${error.message}`
        );
      }
    }
  }

  if (appliedCount === 0) {
    console.log('[Migrations] Database is up to date');
  } else {
    console.log(`[Migrations] Applied ${appliedCount} migration(s)`);
  }

  return appliedCount;
}

/**
 * Check if migrations are needed
 * @param {*} db - sql.js database instance
 * @returns {Promise<boolean>} True if migrations pending
 */
export async function hasPendingMigrations(db) {
  const currentVersion = await getCurrentSchemaVersion(db);
  const latestVersion = migrations[migrations.length - 1].version;
  return currentVersion < latestVersion;
}
