/**
 * File List Component
 * Renders and manages the list of files (scrolls and artifacts)
 */

import { deleteFile, updateFile } from '../../storage/queries.js';
import { eventBus, Events } from '../../core/event-bus.js';
import { formatTimestamp } from '../../utils/date.js';

/**
 * Render file list
 * @param {HTMLElement} containerEl - Container element
 * @param {Array} files - Files to render
 * @param {Object} handlers - Event handlers {onEdit, onDelete, onRename}
 */
export function renderFileList(containerEl, files, handlers) {
  if (files.length === 0) {
    containerEl.innerHTML = `
      <div class="file-list-empty">
        <div class="empty-icon">📦</div>
        <p class="empty-text">Your treasure chest is empty!</p>
        <p class="empty-subtext">Create a scroll or artifact to get started.</p>
      </div>
    `;
    return;
  }

  const fileListEl = document.createElement('div');
  fileListEl.className = 'file-list';

  files.forEach(file => {
    const fileItemEl = createFileItem(file, handlers);
    fileListEl.appendChild(fileItemEl);
  });

  containerEl.innerHTML = '';
  containerEl.appendChild(fileListEl);
}

/**
 * Create file item element
 * @param {Object} file - File data
 * @param {Object} handlers - Event handlers
 * @returns {HTMLElement} File item element
 */
function createFileItem(file, handlers) {
  const itemEl = document.createElement('div');
  itemEl.className = 'file-item';
  itemEl.dataset.fileId = file.id;
  itemEl.dataset.fileType = file.type;

  const icon = file.type === 'scroll' ? '📜' : '🎨';
  const typeLabel = file.type === 'scroll' ? 'Scroll' : 'Artifact';
  const sizeKB = (file.size_bytes / 1024).toFixed(2);
  const createdDate = formatTimestamp(file.created_at);
  const modifiedDate = formatTimestamp(file.modified_at);

  itemEl.innerHTML = `
    <div class="file-icon">${icon}</div>
    <div class="file-info">
      <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
      <div class="file-meta">
        <span class="file-type">${typeLabel}</span>
        <span class="file-size">${sizeKB} KB</span>
        <span class="file-date" title="Created: ${createdDate}">Modified: ${modifiedDate}</span>
      </div>
    </div>
    <div class="file-actions">
      <button class="btn-file-edit" title="Edit" data-file-id="${file.id}">
        ✏️
      </button>
      <button class="btn-file-rename" title="Rename" data-file-id="${file.id}">
        🏷️
      </button>
      <button class="btn-file-delete" title="Delete" data-file-id="${file.id}">
        🗑️
      </button>
    </div>
  `;

  // Attach event listeners
  const editBtn = itemEl.querySelector('.btn-file-edit');
  const renameBtn = itemEl.querySelector('.btn-file-rename');
  const deleteBtn = itemEl.querySelector('.btn-file-delete');

  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (handlers.onEdit) {
        handlers.onEdit(file);
      }
    });
  }

  if (renameBtn) {
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRenameFile(file, handlers.onRename);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteFile(file, handlers.onDelete);
    });
  }

  // Double-click to edit
  itemEl.addEventListener('dblclick', () => {
    if (handlers.onEdit) {
      handlers.onEdit(file);
    }
  });

  return itemEl;
}

/**
 * Handle file rename
 * @param {Object} file - File to rename
 * @param {Function} callback - Callback after rename
 */
function handleRenameFile(file, callback) {
  const newName = prompt('Enter new name:', file.name);

  if (!newName || newName.trim() === '') {
    return;
  }

  if (newName === file.name) {
    return;
  }

  try {
    // Update file name in database
    updateFile(file.id, { name: newName.trim() });

    // Emit event
    eventBus.emit(Events.FILE_UPDATED, {
      fileId: file.id,
      changes: { name: newName.trim() },
      timestamp: Date.now(),
    });

    console.log('[FileList] File renamed:', file.name, '->', newName);

    if (callback) {
      callback(file);
    }
  } catch (error) {
    console.error('[FileList] Failed to rename file:', error);
    alert('Failed to rename file. Please try again.');
  }
}

/**
 * Handle file delete
 * @param {Object} file - File to delete
 * @param {Function} callback - Callback after delete
 */
function handleDeleteFile(file, callback) {
  const confirmed = confirm(
    `Are you sure you want to delete "${file.name}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    // Delete file from database
    deleteFile(file.id);

    // Emit event
    eventBus.emit(Events.FILE_DELETED, {
      fileId: file.id,
      fileName: file.name,
      fileType: file.type,
      timestamp: Date.now(),
    });

    console.log('[FileList] File deleted:', file.name);

    if (callback) {
      callback(file);
    }
  } catch (error) {
    console.error('[FileList] Failed to delete file:', error);
    alert('Failed to delete file. Please try again.');
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
