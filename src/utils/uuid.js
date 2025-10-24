/**
 * UUID v4 Generator
 * Generates unique identifiers for windows, files, and notifications
 */

/**
 * Generate a UUID v4 string
 * @returns {string} UUID in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate a prefixed UUID for specific entity types
 * @param {string} prefix - Entity type prefix (e.g., 'win', 'file', 'notif')
 * @returns {string} Prefixed UUID (e.g., 'win-abc123...')
 */
export function generatePrefixedUUID(prefix) {
  const uuid = crypto.randomUUID();
  const shortId = uuid.split('-')[0]; // Use first segment for readability
  return `${prefix}-${shortId}`;
}

/**
 * Generate window ID
 * @param {string} appId - Application identifier
 * @returns {string} Window ID in format: win-{appId}-{shortId}
 */
export function generateWindowId(appId) {
  const uuid = crypto.randomUUID();
  const shortId = uuid.split('-')[0];
  return `win-${appId}-${shortId}`;
}

/**
 * Generate file ID
 * @param {string} type - File type ('scroll' or 'artifact')
 * @returns {string} File ID in format: file-{type}-{shortId}
 */
export function generateFileId(type) {
  const uuid = crypto.randomUUID();
  const shortId = uuid.split('-')[0];
  return `file-${type}-${shortId}`;
}

/**
 * Generate notification ID
 * @returns {string} Notification ID in format: notif-{shortId}
 */
export function generateNotificationId() {
  const uuid = crypto.randomUUID();
  const shortId = uuid.split('-')[0];
  return `notif-${shortId}`;
}
