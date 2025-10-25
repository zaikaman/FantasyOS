/**
 * Treasure Chest - File Explorer
 * Browse, create, edit, and delete files (scrolls and artifacts)
 */

import { subscribe } from '../../core/state.js';
import { eventBus, Events } from '../../core/event-bus.js';
import { getAllFiles, insertFile, updateFile, deleteFile } from '../../storage/queries.js';
import { getStorageQuota } from '../../storage/database.js';
import { renderFileList } from './file-list.js';
import { openScrollEditor } from './scroll-editor.js';
import { openArtifactEditor } from './artifact-editor.js';

let containerEl = null;
let files = [];

/**
 * Create Treasure Chest app component
 * @returns {HTMLElement} App container
 */
export function createTreasureChestApp() {
  console.log('[TreasureChest] Initializing...');

  // Create main container
  containerEl = document.createElement('div');
  containerEl.className = 'treasure-chest-container';

  // Load files from database
  loadFiles();

  // Render UI
  render();

  // Check storage quota
  checkAndDisplayQuota();

  // Subscribe to file changes
  eventBus.on(Events.FILE_CREATED, handleFileChange);
  eventBus.on(Events.FILE_UPDATED, handleFileChange);
  eventBus.on(Events.FILE_DELETED, handleFileChange);

  console.log('[TreasureChest] Initialized');

  return containerEl;
}

/**
 * Load files from database
 */
function loadFiles() {
  files = getAllFiles();
  console.log(`[TreasureChest] Loaded ${files.length} files`);
}

/**
 * Render the Treasure Chest UI
 */
function render() {
  containerEl.innerHTML = `
    <div class="treasure-chest-header">
      <h2 class="chest-title">Treasure Chest</h2>
      <div class="chest-actions">
        <button class="btn-create-scroll" id="btn-create-scroll">
          Create Scroll
        </button>
        <button class="btn-create-artifact" id="btn-create-artifact">
          Create Artifact
        </button>
      </div>
    </div>

    <div class="chest-storage-info" id="storage-info">
      <div class="storage-bar">
        <div class="storage-bar-fill" id="storage-bar-fill"></div>
      </div>
      <div class="storage-text" id="storage-text">Loading vault capacity...</div>
    </div>

    <div class="chest-filters">
      <input 
        type="text" 
        class="search-input" 
        id="file-search" 
        placeholder="⚔ Search your treasures..."
      />
      <select class="filter-type" id="filter-type">
        <option value="all">✦ All Treasures</option>
        <option value="scroll">📜 Scrolls</option>
        <option value="artifact">🎨 Artifacts</option>
      </select>
      <select class="sort-by" id="sort-by">
        <option value="modified_desc">⏱ Recently Modified</option>
        <option value="modified_asc">⌛ Oldest Modified</option>
        <option value="created_desc">✨ Recently Created</option>
        <option value="created_asc">🕰 Oldest Created</option>
        <option value="name_asc">📝 Name (A-Z)</option>
        <option value="name_desc">📝 Name (Z-A)</option>
        <option value="size_desc">📊 Largest First</option>
        <option value="size_asc">📊 Smallest First</option>
      </select>
    </div>

    <div class="chest-content" id="chest-content">
      <!-- File list will be rendered here -->
    </div>
  `;

  // Attach event listeners
  attachEventListeners();

  // Render file list
  renderFiles();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Create scroll button
  const createScrollBtn = containerEl.querySelector('#btn-create-scroll');
  if (createScrollBtn) {
    createScrollBtn.addEventListener('click', handleCreateScroll);
  }

  // Create artifact button
  const createArtifactBtn = containerEl.querySelector('#btn-create-artifact');
  if (createArtifactBtn) {
    createArtifactBtn.addEventListener('click', handleCreateArtifact);
  }

  // Search input
  const searchInput = containerEl.querySelector('#file-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  // Filter type
  const filterType = containerEl.querySelector('#filter-type');
  if (filterType) {
    filterType.addEventListener('change', handleFilterChange);
  }

  // Sort by
  const sortBy = containerEl.querySelector('#sort-by');
  if (sortBy) {
    sortBy.addEventListener('change', handleSortChange);
  }
}

/**
 * Render file list
 */
function renderFiles() {
  const contentEl = containerEl.querySelector('#chest-content');
  if (!contentEl) return;

  // Get current filters
  const searchQuery = containerEl.querySelector('#file-search')?.value.toLowerCase() || '';
  const filterType = containerEl.querySelector('#filter-type')?.value || 'all';
  const sortBy = containerEl.querySelector('#sort-by')?.value || 'modified_desc';

  // Filter files
  let filteredFiles = files.filter(file => {
    // Type filter
    if (filterType !== 'all' && file.type !== filterType) {
      return false;
    }

    // Search filter
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery)) {
      return false;
    }

    return true;
  });

  // Sort files
  filteredFiles = sortFiles(filteredFiles, sortBy);

  // Render
  renderFileList(contentEl, filteredFiles, {
    onEdit: handleEditFile,
    onDelete: handleDeleteFile,
    onRename: handleRenameFile,
  });
}

/**
 * Sort files by criteria
 * @param {Array} files - Files to sort
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted files
 */
function sortFiles(files, sortBy) {
  const sorted = [...files];

  switch (sortBy) {
    case 'modified_desc':
      sorted.sort((a, b) => b.modified_at - a.modified_at);
      break;
    case 'modified_asc':
      sorted.sort((a, b) => a.modified_at - b.modified_at);
      break;
    case 'created_desc':
      sorted.sort((a, b) => b.created_at - a.created_at);
      break;
    case 'created_asc':
      sorted.sort((a, b) => a.created_at - b.created_at);
      break;
    case 'name_asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'size_desc':
      sorted.sort((a, b) => b.size_bytes - a.size_bytes);
      break;
    case 'size_asc':
      sorted.sort((a, b) => a.size_bytes - b.size_bytes);
      break;
  }

  return sorted;
}

/**
 * Handle create scroll button click
 */
function handleCreateScroll() {
  console.log('[TreasureChest] Creating new scroll...');
  openScrollEditor(null, () => {
    loadFiles();
    renderFiles();
    checkAndDisplayQuota();
  });
}

/**
 * Handle create artifact button click
 */
function handleCreateArtifact() {
  console.log('[TreasureChest] Creating new artifact...');
  openArtifactEditor(null, () => {
    loadFiles();
    renderFiles();
    checkAndDisplayQuota();
  });
}

/**
 * Handle search input
 */
function handleSearchInput() {
  renderFiles();
}

/**
 * Handle filter type change
 */
function handleFilterChange() {
  renderFiles();
}

/**
 * Handle sort change
 */
function handleSortChange() {
  renderFiles();
}

/**
 * Handle edit file
 * @param {Object} file - File to edit
 */
function handleEditFile(file) {
  console.log('[TreasureChest] Editing file:', file.name);

  if (file.type === 'scroll') {
    openScrollEditor(file, () => {
      loadFiles();
      renderFiles();
      checkAndDisplayQuota();
    });
  } else if (file.type === 'artifact') {
    openArtifactEditor(file, () => {
      loadFiles();
      renderFiles();
      checkAndDisplayQuota();
    });
  }
}

/**
 * Handle delete file
 * @param {Object} file - File to delete
 */
function handleDeleteFile(file) {
  // Implemented in file-list.js
  loadFiles();
  renderFiles();
  checkAndDisplayQuota();
}

/**
 * Handle rename file
 * @param {Object} file - File to rename
 */
function handleRenameFile(file) {
  // Implemented in file-list.js
  loadFiles();
  renderFiles();
}

/**
 * Handle file change event
 */
function handleFileChange() {
  loadFiles();
  renderFiles();
  checkAndDisplayQuota();
}

/**
 * Check and display storage quota
 */
async function checkAndDisplayQuota() {
  try {
    const quota = await getStorageQuota();
    const storageInfoEl = containerEl.querySelector('#storage-info');
    const storageBarFillEl = containerEl.querySelector('#storage-bar-fill');
    const storageTextEl = containerEl.querySelector('#storage-text');

    if (!storageInfoEl || !storageBarFillEl || !storageTextEl) {
      return;
    }

    const usedMB = (quota.used / (1024 * 1024)).toFixed(2);
    const totalMB = (quota.quota / (1024 * 1024)).toFixed(2);
    const percentUsed = (quota.used / quota.quota) * 100;

    // Update bar
    storageBarFillEl.style.width = `${percentUsed}%`;

    // Update text
    storageTextEl.textContent = `Vault Capacity: ${usedMB} MB / ${totalMB} MB (${percentUsed.toFixed(1)}%)`;

    // Warning at 40MB (80% of 50MB)
    if (quota.used > 40 * 1024 * 1024) {
      storageInfoEl.classList.add('storage-warning');
      storageBarFillEl.classList.add('storage-warning');
    } else {
      storageInfoEl.classList.remove('storage-warning');
      storageBarFillEl.classList.remove('storage-warning');
    }

    // Error near quota
    if (percentUsed > 90) {
      storageInfoEl.classList.add('storage-error');
      storageBarFillEl.classList.add('storage-error');
    } else {
      storageInfoEl.classList.remove('storage-error');
      storageBarFillEl.classList.remove('storage-error');
    }
  } catch (error) {
    console.error('[TreasureChest] Failed to check storage quota:', error);
  }
}

/**
 * Cleanup function
 */
export function destroyTreasureChestApp() {
  eventBus.off(Events.FILE_CREATED, handleFileChange);
  eventBus.off(Events.FILE_UPDATED, handleFileChange);
  eventBus.off(Events.FILE_DELETED, handleFileChange);
}
