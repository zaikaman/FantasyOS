/**
 * Scroll Editor
 * Text note editor with parchment-style textarea
 */

import { insertFile, updateFile } from '../../storage/queries.js';
import { generateFileId } from '../../utils/uuid.js';
import { now } from '../../utils/date.js';
import { eventBus, Events } from '../../core/event-bus.js';
import { showAlert } from '../../utils/modal.js';

const MAX_CONTENT_SIZE = 100 * 1024; // 100 KB

/**
 * Open scroll editor modal
 * @param {Object|null} file - Existing file to edit, or null for new
 * @param {string|null} folderId - Current folder ID to save file in
 * @param {Function} onSave - Callback after save
 */
export function openScrollEditor(file, folderId = null, onSave = null) {
  const isNewFile = !file;
  const fileName = file ? file.name : 'Untitled Scroll';
  const fileContent = file ? file.content : '';

  // Create modal overlay
  const modalEl = document.createElement('div');
  modalEl.className = 'scroll-editor-modal';
  modalEl.innerHTML = `
    <div class="scroll-editor-container">
      <div class="scroll-editor-header">
        <h3 class="scroll-editor-title">${isNewFile ? 'Craft a New Scroll' : 'Modify Sacred Scroll'}</h3>
        <button class="btn-close-editor" title="Close">×</button>
      </div>

      <div class="scroll-editor-body">
        <div class="form-group">
          <label for="scroll-name">Scroll Title</label>
          <input
            type="text"
            id="scroll-name"
            class="scroll-name-input"
            value="${escapeHtml(fileName)}"
            placeholder="Name your scroll..."
            maxlength="255"
          />
        </div>

        <div class="form-group">
          <label for="scroll-content">Scroll Contents</label>
          <textarea
            id="scroll-content"
            class="scroll-content-textarea"
            placeholder="Inscribe your wisdom upon this parchment..."
            rows="15"
          >${escapeHtml(fileContent)}</textarea>
        </div>

        <div class="scroll-editor-info">
          <span class="content-size" id="content-size">0 / 100 KB</span>
          <span class="content-warning" id="content-warning"></span>
        </div>
      </div>

      <div class="scroll-editor-footer">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-save">${isNewFile ? 'Create' : 'Save'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  // Get elements
  const nameInput = modalEl.querySelector('#scroll-name');
  const contentTextarea = modalEl.querySelector('#scroll-content');
  const contentSizeEl = modalEl.querySelector('#content-size');
  const contentWarningEl = modalEl.querySelector('#content-warning');
  const closeBtn = modalEl.querySelector('.btn-close-editor');
  const cancelBtn = modalEl.querySelector('.btn-cancel');
  const saveBtn = modalEl.querySelector('.btn-save');

  // Update content size display
  const updateContentSize = () => {
    const content = contentTextarea.value;
    const sizeBytes = new Blob([content]).size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);

    contentSizeEl.textContent = `${sizeKB} / 100 KB`;

    if (sizeBytes > MAX_CONTENT_SIZE) {
      contentSizeEl.classList.add('size-error');
      contentWarningEl.textContent = '⚠️ Content exceeds maximum size!';
      saveBtn.disabled = true;
    } else if (sizeBytes > MAX_CONTENT_SIZE * 0.9) {
      contentSizeEl.classList.add('size-warning');
      contentSizeEl.classList.remove('size-error');
      contentWarningEl.textContent = '⚠️ Approaching maximum size';
      saveBtn.disabled = false;
    } else {
      contentSizeEl.classList.remove('size-warning', 'size-error');
      contentWarningEl.textContent = '';
      saveBtn.disabled = false;
    }
  };

  // Initial size update
  updateContentSize();

  // Listen for content changes
  contentTextarea.addEventListener('input', updateContentSize);

  // Focus name input
  nameInput.focus();
  nameInput.select();

  // Close handlers
  const closeModal = () => {
    modalEl.remove();
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Click outside to close
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });

  // Save handler
  saveBtn.addEventListener('click', () => {
    handleSave(file, folderId, nameInput.value.trim(), contentTextarea.value, onSave, closeModal);
  });

  // Keyboard shortcuts
  modalEl.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveBtn.click();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

/**
 * Handle save
 * @param {Object|null} file - Existing file or null
 * @param {string|null} folderId - Folder ID to save file in
 * @param {string} name - File name
 * @param {string} content - File content
 * @param {Function} onSave - Callback after save
 * @param {Function} closeModal - Close modal function
 */
function handleSave(file, folderId, name, content, onSave, closeModal) {
  // Validate name
  if (!name || name.trim() === '') {
    showAlert('Please enter a scroll name.', '⚠️ Name Required');
    return;
  }

  // Validate content size
  const sizeBytes = new Blob([content]).size;
  if (sizeBytes > MAX_CONTENT_SIZE) {
    showAlert('Content exceeds maximum size of 100 KB. Please reduce the content.', '⚠️ Size Limit');
    return;
  }

  try {
    const timestamp = now();

    if (file) {
      // Update existing file
      updateFile(file.id, {
        name: name,
        content: content,
        modified_at: timestamp,
        size_bytes: sizeBytes,
      });

      eventBus.emit(Events.FILE_UPDATED, {
        fileId: file.id,
        fileName: name,
        fileType: 'scroll',
        timestamp,
      });

      console.log('[ScrollEditor] Scroll updated:', name);
    } else {
      // Create new file
      const fileId = generateFileId();
      insertFile({
        id: fileId,
        name: name,
        type: 'scroll',
        content: content,
        thumbnail: null,
        folder_id: folderId,
        created_at: timestamp,
        modified_at: timestamp,
        size_bytes: sizeBytes,
      });

      eventBus.emit(Events.FILE_CREATED, {
        fileId,
        fileName: name,
        fileType: 'scroll',
        timestamp,
      });

      console.log('[ScrollEditor] Scroll created:', name);
    }

    closeModal();

    if (onSave) {
      onSave();
    }
  } catch (error) {
    console.error('[ScrollEditor] Failed to save scroll:', error);

    // Check if it's a quota error
    if (error.message && error.message.includes('quota')) {
      showAlert('Storage quota exceeded! Please delete some files to free up space.', '💾 Storage Full');
      eventBus.emit(Events.STORAGE_QUOTA_ERROR, { timestamp: now() });
    } else {
      showAlert('Failed to save scroll. Please try again.', '❌ Save Error');
    }
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
