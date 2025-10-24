/**
 * Validation Functions
 * Position, size, and data validation for windows and files
 */

/**
 * Validate window position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if valid
 * @throws {Error} If position is invalid
 */
export function validateWindowPosition(x, y) {
  const maxX = window.innerWidth - 100; // Ensure title bar visible
  const maxY = window.innerHeight - 100;

  if (x < 0 || x > maxX) {
    throw new Error(`Window X position (${x}) out of bounds (0-${maxX})`);
  }

  if (y < 0 || y > maxY) {
    throw new Error(`Window Y position (${y}) out of bounds (0-${maxY})`);
  }

  return true;
}

/**
 * Validate window size
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {boolean} True if valid
 * @throws {Error} If size is invalid
 */
export function validateWindowSize(width, height) {
  const minWidth = 300;
  const minHeight = 200;
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  if (width < minWidth || width > maxWidth) {
    throw new Error(`Window width (${width}) out of range (${minWidth}-${maxWidth})`);
  }

  if (height < minHeight || height > maxHeight) {
    throw new Error(`Window height (${height}) out of range (${minHeight}-${maxHeight})`);
  }

  return true;
}

/**
 * Validate window z-index
 * @param {number} zIndex - Z-index value
 * @returns {boolean} True if valid
 * @throws {Error} If z-index is invalid
 */
export function validateZIndex(zIndex) {
  const minZIndex = 1000;
  const maxZIndex = 9999;

  if (zIndex < minZIndex || zIndex > maxZIndex) {
    throw new Error(`Window z-index (${zIndex}) out of range (${minZIndex}-${maxZIndex})`);
  }

  return true;
}

/**
 * Validate file name
 * @param {string} name - File name
 * @returns {boolean} True if valid
 * @throws {Error} If name is invalid
 */
export function validateFileName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('File name must be a non-empty string');
  }

  if (name.length > 255) {
    throw new Error(`File name too long (${name.length} > 255 characters)`);
  }

  return true;
}

/**
 * Validate file type
 * @param {string} type - File type
 * @returns {boolean} True if valid
 * @throws {Error} If type is invalid
 */
export function validateFileType(type) {
  const validTypes = ['scroll', 'artifact'];

  if (!validTypes.includes(type)) {
    throw new Error(`Invalid file type: ${type} (must be 'scroll' or 'artifact')`);
  }

  return true;
}

/**
 * Validate file content size
 * @param {string} content - File content
 * @param {string} type - File type
 * @returns {boolean} True if valid
 * @throws {Error} If content too large
 */
export function validateFileContent(content, type) {
  const maxScrollSize = 100 * 1024; // 100KB
  const maxArtifactSize = 10 * 1024 * 1024; // 10MB

  const size = new Blob([content]).size;

  if (type === 'scroll' && size > maxScrollSize) {
    throw new Error(`Scroll content too large (${size} > ${maxScrollSize} bytes)`);
  }

  if (type === 'artifact' && size > maxArtifactSize) {
    throw new Error(`Artifact content too large (${size} > ${maxArtifactSize} bytes)`);
  }

  return true;
}

/**
 * Validate notification text
 * @param {string} text - Notification message
 * @returns {boolean} True if valid
 * @throws {Error} If text is invalid
 */
export function validateNotificationText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Notification text must be a non-empty string');
  }

  if (text.length > 280) {
    throw new Error(`Notification text too long (${text.length} > 280 characters)`);
  }

  return true;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Constrain window position to screen bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {{x: number, y: number}} Constrained position
 */
export function constrainPosition(x, y) {
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 100;

  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY)
  };
}

/**
 * Constrain window size to valid range
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {{width: number, height: number}} Constrained size
 */
export function constrainSize(width, height) {
  const minWidth = 300;
  const minHeight = 200;
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  return {
    width: clamp(width, minWidth, maxWidth),
    height: clamp(height, minHeight, maxHeight)
  };
}
