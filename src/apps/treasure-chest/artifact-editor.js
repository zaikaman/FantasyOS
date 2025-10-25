/**
 * Artifact Editor
 * Canvas-based doodle editor
 */

import { insertFile, updateFile } from '../../storage/queries.js';
import { generateFileId } from '../../utils/uuid.js';
import { now } from '../../utils/date.js';
import { eventBus, Events } from '../../core/event-bus.js';

const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Open artifact editor modal
 * @param {Object|null} file - Existing file to edit, or null for new
 * @param {string|null} folderId - Current folder ID to save file in
 * @param {Function} onSave - Callback after save
 */
export function openArtifactEditor(file, folderId = null, onSave = null) {
  const isNewFile = !file;
  const fileName = file ? file.name : 'Untitled Artifact';

  // Create modal overlay
  const modalEl = document.createElement('div');
  modalEl.className = 'artifact-editor-modal';
  modalEl.innerHTML = `
    <div class="artifact-editor-container">
      <div class="scroll-editor-header">
        <h3 class="scroll-editor-title">${isNewFile ? 'Craft a New Artifact' : 'Modify Sacred Artifact'}</h3>
        <button class="btn-close-editor" title="Close">×</button>
      </div>

      <div class="scroll-editor-body">
        <div class="form-group">
          <label for="artifact-name">Artifact Title</label>
          <input
            type="text"
            id="artifact-name"
            class="scroll-name-input"
            value="${escapeHtml(fileName)}"
            placeholder="Name your artifact..."
            maxlength="255"
          />
        </div>

        <div class="canvas-tools">
          <button class="tool-btn active" data-tool="pen" title="Pen">🖊️</button>
          <button class="tool-btn" data-tool="eraser" title="Eraser">🧽</button>
          <input type="color" id="color-picker" value="#2d5016" title="Color">
          <input type="range" id="brush-size" min="1" max="20" value="3" title="Brush Size">
          <button class="btn-clear-canvas" title="Clear Canvas">Clear</button>
        </div>

        <div class="canvas-container">
          <canvas id="drawing-canvas" width="640" height="360"></canvas>
        </div>

        <div class="scroll-editor-info">
          <span class="content-size" id="content-size">0 / 10 MB</span>
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
  const nameInput = modalEl.querySelector('#artifact-name');
  const canvas = modalEl.querySelector('#drawing-canvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = modalEl.querySelector('#color-picker');
  const brushSizeInput = modalEl.querySelector('#brush-size');
  const toolBtns = modalEl.querySelectorAll('.tool-btn');
  const clearBtn = modalEl.querySelector('.btn-clear-canvas');
  const contentSizeEl = modalEl.querySelector('#content-size');
  const contentWarningEl = modalEl.querySelector('#content-warning');
  const closeBtn = modalEl.querySelector('.btn-close-editor');
  const cancelBtn = modalEl.querySelector('.btn-cancel');
  const saveBtn = modalEl.querySelector('.btn-save');

  // Drawing state
  let isDrawing = false;
  let currentTool = 'pen';
  let currentColor = '#2d5016';
  let brushSize = 3;

  // Initialize canvas
  ctx.fillStyle = '#f4e4c1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load existing image if editing
  if (file && file.content) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = file.content;
  }

  // Tool selection
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
    });
  });

  // Color picker
  colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
  });

  // Brush size
  brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
  });

  // Clear canvas
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire canvas?')) {
      ctx.fillStyle = '#f4e4c1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });

  // Drawing handlers
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    if (currentTool === 'pen') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
    } else if (currentTool === 'eraser') {
      ctx.strokeStyle = '#f4e4c1';
      ctx.lineWidth = brushSize * 2;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  canvas.addEventListener('pointerup', () => {
    isDrawing = false;
  });

  canvas.addEventListener('pointerleave', () => {
    isDrawing = false;
  });

  // Focus name input
  nameInput.focus();
  nameInput.select();

  // Close handlers
  const closeModal = () => {
    modalEl.remove();
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });

  // Save handler
  saveBtn.addEventListener('click', () => {
    handleSave(file, folderId, nameInput.value.trim(), canvas, onSave, closeModal);
  });

  // Keyboard shortcuts
  modalEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveBtn.click();
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

/**
 * Handle save
 */
function handleSave(file, folderId, name, canvas, onSave, closeModal) {
  if (!name || name.trim() === '') {
    alert('Please enter an artifact name.');
    return;
  }

  try {
    // Convert canvas to base64
    const dataURL = canvas.toDataURL('image/png');
    const sizeBytes = Math.ceil((dataURL.length * 3) / 4);

    if (sizeBytes > MAX_CONTENT_SIZE) {
      alert('Artifact exceeds maximum size of 10 MB.');
      return;
    }

    // Generate thumbnail (200x200)
    const thumbnail = generateThumbnail(canvas);

    const timestamp = now();

    if (file) {
      updateFile(file.id, {
        name,
        content: dataURL,
        thumbnail,
        modified_at: timestamp,
        size_bytes: sizeBytes,
      });

      eventBus.emit(Events.FILE_UPDATED, {
        fileId: file.id,
        fileName: name,
        fileType: 'artifact',
        timestamp,
      });

      console.log('[ArtifactEditor] Artifact updated:', name);
    } else {
      const fileId = generateFileId();
      insertFile({
        id: fileId,
        name,
        type: 'artifact',
        content: dataURL,
        thumbnail,
        folder_id: folderId,
        created_at: timestamp,
        modified_at: timestamp,
        size_bytes: sizeBytes,
      });

      eventBus.emit(Events.FILE_CREATED, {
        fileId,
        fileName: name,
        fileType: 'artifact',
        timestamp,
      });

      console.log('[ArtifactEditor] Artifact created:', name);
    }

    closeModal();

    if (onSave) {
      onSave();
    }
  } catch (error) {
    console.error('[ArtifactEditor] Failed to save artifact:', error);

    if (error.message && error.message.includes('quota')) {
      alert('Storage quota exceeded! Please delete some files to free up space.');
      eventBus.emit(Events.STORAGE_QUOTA_ERROR, { timestamp: now() });
    } else {
      alert('Failed to save artifact. Please try again.');
    }
  }
}

/**
 * Generate thumbnail from canvas
 * @param {HTMLCanvasElement} sourceCanvas - Source canvas
 * @returns {string} Base64 thumbnail
 */
function generateThumbnail(sourceCanvas) {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 200;
  thumbCanvas.height = 200;
  const thumbCtx = thumbCanvas.getContext('2d');

  // Calculate scaling
  const scale = Math.min(200 / sourceCanvas.width, 200 / sourceCanvas.height);
  const scaledWidth = sourceCanvas.width * scale;
  const scaledHeight = sourceCanvas.height * scale;
  const offsetX = (200 - scaledWidth) / 2;
  const offsetY = (200 - scaledHeight) / 2;

  // Fill background
  thumbCtx.fillStyle = '#f4e4c1';
  thumbCtx.fillRect(0, 0, 200, 200);

  // Draw scaled image
  thumbCtx.drawImage(sourceCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

  return thumbCanvas.toDataURL('image/png');
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
