/**
 * Treasure Chest - Full File System Explorer
 * Browse, create, edit, organize files and folders
 */

import { eventBus, Events } from "../../core/event-bus.js";
import { getStorageQuota } from "../../storage/database.js";
import { openScrollEditor } from "./scroll-editor.js";
import { openArtifactEditor } from "./artifact-editor.js";
import {
  getFolderContents,
  getFolderPath,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFile,
  moveFolder,
  copyFile,
  search,
  getFolderStats
} from "./file-system.js";
import { deleteFile, updateFile } from "../../storage/queries.js";
import { formatTimestamp } from "../../utils/date.js";
import { showAlert, showConfirm, showPrompt } from "../../utils/modal.js";

let containerEl = null;
let currentFolderId = null;
let clipboard = null;
let viewMode = "list";

export function createTreasureChestApp() {
  console.log("[TreasureChest] Initializing file system...");
  containerEl = document.createElement("div");
  containerEl.className = "treasure-chest-container";
  render();
  checkAndDisplayQuota();
  eventBus.on(Events.FILE_CREATED, handleContentChange);
  eventBus.on(Events.FILE_UPDATED, handleContentChange);
  eventBus.on(Events.FILE_DELETED, handleContentChange);
  eventBus.on(Events.FILE_MOVED, handleContentChange);
  eventBus.on(Events.FOLDER_CREATED, handleContentChange);
  eventBus.on(Events.FOLDER_UPDATED, handleContentChange);
  eventBus.on(Events.FOLDER_DELETED, handleContentChange);
  eventBus.on(Events.FOLDER_MOVED, handleContentChange);
  console.log("[TreasureChest] File system initialized");
  return containerEl;
}

function render() {
  const path = getFolderPath(currentFolderId);
  const contents = getFolderContents(currentFolderId);
  const stats = getFolderStats(currentFolderId);

  containerEl.innerHTML = `
    <div class="treasure-chest-header">
      <h2 class="chest-title">⚱ Treasure Vault</h2>
      <div class="chest-actions">
        <button class="btn-new-folder" id="btn-new-folder" title="New Folder">
          📁 New Folder
        </button>
        <button class="btn-create-scroll" id="btn-create-scroll" title="New Scroll">
          📜 New Scroll
        </button>
        <button class="btn-create-artifact" id="btn-create-artifact" title="New Artifact">
          🎨 New Artifact
        </button>
      </div>
    </div>

    <div class="chest-breadcrumb" id="breadcrumb"></div>

    <div class="chest-toolbar">
      <div class="chest-filters">
        <input 
          type="text" 
          class="search-input" 
          id="file-search" 
          placeholder="⚔ Search..."
        />
      </div>
      <div class="chest-view-controls">
        <span class="folder-stats" id="folder-stats">
          ${stats.folderCount} folders, ${stats.fileCount} files
        </span>
        <button class="btn-view-mode ${viewMode === 'list' ? 'active' : ''}" data-mode="list" title="List View">☰</button>
        <button class="btn-view-mode ${viewMode === 'grid' ? 'active' : ''}" data-mode="grid" title="Grid View">▦</button>
      </div>
    </div>

    <div class="chest-storage-info" id="storage-info">
      <div class="storage-bar">
        <div class="storage-bar-fill" id="storage-bar-fill"></div>
      </div>
      <div class="storage-text" id="storage-text">Loading vault capacity...</div>
    </div>

    <div class="chest-content" id="chest-content"></div>
    <div class="context-menu hidden" id="context-menu"></div>
  `;

  renderBreadcrumb(path);
  renderContent(contents);
  attachEventListeners();
}

function renderBreadcrumb(path) {
  const breadcrumbEl = containerEl.querySelector('#breadcrumb');
  if (!breadcrumbEl) return;

  breadcrumbEl.innerHTML = path.map((folder, index) => {
    const isLast = index === path.length - 1;
    const icon = folder.id === null ? '🏠' : '📁';
    return `
      <span class="breadcrumb-item ${isLast ? 'active' : ''}" data-folder-id="${folder.id}">
        ${icon} ${escapeHtml(folder.name)}
      </span>
      ${!isLast ? '<span class="breadcrumb-separator">›</span>' : ''}
    `;
  }).join('');

  breadcrumbEl.querySelectorAll('.breadcrumb-item:not(.active)').forEach(item => {
    item.addEventListener('click', () => {
      const folderId = item.dataset.folderId === 'null' ? null : item.dataset.folderId;
      navigateToFolder(folderId);
    });
  });
}

function renderContent(contents) {
  const contentEl = containerEl.querySelector('#chest-content');
  if (!contentEl) return;

  if (contents.folders.length === 0 && contents.files.length === 0) {
    contentEl.innerHTML = `
      <div class="file-list-empty">
        <div class="empty-icon">⚱</div>
        <p class="empty-text">This folder is empty</p>
        <p class="empty-subtext">Create files or folders to get started</p>
      </div>
    `;
    return;
  }

  const listEl = document.createElement('div');
  listEl.className = `file-list ${viewMode}-view`;

  contents.folders.forEach(folder => {
    listEl.appendChild(createFolderItem(folder));
  });

  contents.files.forEach(file => {
    listEl.appendChild(createFileItem(file));
  });

  contentEl.innerHTML = '';
  contentEl.appendChild(listEl);
}

function createFolderItem(folder) {
  const itemEl = document.createElement('div');
  itemEl.className = 'file-item folder-item';
  itemEl.dataset.itemType = 'folder';
  itemEl.dataset.itemId = folder.id;
  itemEl.draggable = true;

  const createdDate = formatTimestamp(folder.created_at);

  itemEl.innerHTML = `
    <div class="file-icon">📁</div>
    <div class="file-info">
      <div class="file-name" title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</div>
      <div class="file-meta">
        <span class="file-type">Folder</span>
        <span class="file-date" title="Created: ${createdDate}">📅 ${createdDate}</span>
      </div>
    </div>
    <div class="file-actions">
      <button class="btn-file-action" title="Open">📂</button>
    </div>
  `;

  itemEl.addEventListener('click', () => navigateToFolder(folder.id));
  itemEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, 'folder', folder);
  });

  setupDragAndDrop(itemEl, 'folder', folder);
  return itemEl;
}

function createFileItem(file) {
  const itemEl = document.createElement('div');
  itemEl.className = 'file-item';
  itemEl.dataset.itemType = 'file';
  itemEl.dataset.itemId = file.id;
  itemEl.draggable = true;

  const icon = file.type === 'scroll' ? '📜' : '🎨';
  const typeLabel = file.type === 'scroll' ? 'Scroll' : 'Artifact';
  const sizeKB = (file.size_bytes / 1024).toFixed(2);
  const modifiedDate = formatTimestamp(file.modified_at);

  itemEl.innerHTML = `
    <div class="file-icon">${icon}</div>
    <div class="file-info">
      <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
      <div class="file-meta">
        <span class="file-type">${typeLabel}</span>
        <span class="file-size">📊 ${sizeKB} KB</span>
        <span class="file-date" title="Modified: ${modifiedDate}">⏱ ${modifiedDate}</span>
      </div>
    </div>
    <div class="file-actions">
      <button class="btn-file-action" title="Edit">✏️</button>
    </div>
  `;

  itemEl.addEventListener('dblclick', () => handleEditFile(file));
  itemEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, 'file', file);
  });

  setupDragAndDrop(itemEl, 'file', file);
  return itemEl;
}

function setupDragAndDrop(element, type, data) {
  element.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id: data.id }));
    element.classList.add('dragging');
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
  });

  if (type === 'folder') {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');

      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        handleDrop(dragData, data.id);
      } catch (error) {
        console.error('[TreasureChest] Drop error:', error);
      }
    });
  }
}

function handleDrop(dragData, targetFolderId) {
  if (dragData.type === 'file') {
    moveFile(dragData.id, targetFolderId);
  } else if (dragData.type === 'folder') {
    try {
      moveFolder(dragData.id, targetFolderId);
    } catch (error) {
      showAlert(error.message, '❌ Move Error');
    }
  }
}

function showContextMenu(e, itemType, item) {
  const menuEl = containerEl.querySelector('#context-menu');
  if (!menuEl) return;

  const menuItems = itemType === 'folder' ? [
    { icon: '📂', label: 'Open', action: () => navigateToFolder(item.id) },
    { icon: '🏷️', label: 'Rename', action: () => handleRenameFolder(item) },
    { divider: true },
    { icon: '✂️', label: 'Cut', action: () => handleCut(itemType, item) },
    { divider: true },
    { icon: '🗑️', label: 'Delete', action: () => handleDeleteFolder(item), class: 'danger' }
  ] : item.type === 'scroll' ? [
    { icon: '✏️', label: 'Edit', action: () => handleEditFile(item) },
    { icon: '🧪', label: 'Open in Potion Mixer', action: () => handleOpenInPotionMixer(item) },
    { icon: '🏷️', label: 'Rename', action: () => handleRenameFile(item) },
    { divider: true },
    { icon: '📋', label: 'Copy', action: () => handleCopy(itemType, item) },
    { icon: '✂️', label: 'Cut', action: () => handleCut(itemType, item) },
    { divider: true },
    { icon: '🗑️', label: 'Delete', action: () => handleDeleteFile(item), class: 'danger' }
  ] : [
    { icon: '✏️', label: 'Edit', action: () => handleEditFile(item) },
    { icon: '🏷️', label: 'Rename', action: () => handleRenameFile(item) },
    { divider: true },
    { icon: '📋', label: 'Copy', action: () => handleCopy(itemType, item) },
    { icon: '✂️', label: 'Cut', action: () => handleCut(itemType, item) },
    { divider: true },
    { icon: '🗑️', label: 'Delete', action: () => handleDeleteFile(item), class: 'danger' }
  ];

  menuEl.innerHTML = menuItems.map(item => {
    if (item.divider) return '<div class="context-menu-divider"></div>';
    return `
      <div class="context-menu-item ${item.class || ''}" data-action="${item.label}">
        <span class="menu-icon">${item.icon}</span>
        <span class="menu-label">${item.label}</span>
      </div>
    `;
  }).join('');

  menuEl.style.left = `${e.clientX}px`;
  menuEl.style.top = `${e.clientY}px`;
  menuEl.classList.remove('hidden');

  menuEl.querySelectorAll('.context-menu-item').forEach((el, index) => {
    const menuItem = menuItems.filter(item => !item.divider)[index];
    if (menuItem) {
      el.addEventListener('click', () => {
        menuItem.action();
        hideContextMenu();
      });
    }
  });

  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 0);
}

function hideContextMenu() {
  const menuEl = containerEl.querySelector('#context-menu');
  if (menuEl) menuEl.classList.add('hidden');
}

function navigateToFolder(folderId) {
  currentFolderId = folderId;
  render();
  checkAndDisplayQuota();
}

function attachEventListeners() {
  containerEl.querySelector('#btn-new-folder')?.addEventListener('click', handleCreateFolder);
  containerEl.querySelector('#btn-create-scroll')?.addEventListener('click', handleCreateScroll);
  containerEl.querySelector('#btn-create-artifact')?.addEventListener('click', handleCreateArtifact);
  containerEl.querySelector('#file-search')?.addEventListener('input', handleSearch);

  containerEl.querySelectorAll('.btn-view-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.mode;
      render();
      checkAndDisplayQuota();
    });
  });

  containerEl.addEventListener('keydown', handleKeyboardShortcuts);

  const contentEl = containerEl.querySelector('#chest-content');
  if (contentEl) {
    contentEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    contentEl.addEventListener('drop', (e) => {
      e.preventDefault();
      try {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        handleDrop(dragData, currentFolderId);
      } catch (error) {
        console.error('[TreasureChest] Drop error:', error);
      }
    });
  }
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    handlePaste();
  }

  if (e.key === 'Backspace' && currentFolderId !== null) {
    e.preventDefault();
    const path = getFolderPath(currentFolderId);
    if (path.length > 1) {
      navigateToFolder(path[path.length - 2].id);
    }
  }
}

function handleSearch(e) {
  const query = e.target.value.trim();
  
  if (query === '') {
    render();
    checkAndDisplayQuota();
    return;
  }

  const results = search(query, currentFolderId);
  renderContent(results);
}

async function handleCreateFolder() {
  const name = await showPrompt('Enter folder name:', '', '📁 Create Folder');
  if (!name || name.trim() === '') return;

  try {
    createFolder(name.trim(), currentFolderId);
  } catch (error) {
    console.error('[TreasureChest] Failed to create folder:', error);
    showAlert('Failed to create folder. Please try again.', '❌ Error');
  }
}

async function handleRenameFolder(folder) {
  const newName = await showPrompt('Enter new folder name:', folder.name, '🏷️ Rename Folder');
  if (!newName || newName.trim() === '' || newName === folder.name) return;

  try {
    renameFolder(folder.id, newName.trim());
  } catch (error) {
    console.error('[TreasureChest] Failed to rename folder:', error);
    showAlert('Failed to rename folder. Please try again.', '❌ Error');
  }
}

async function handleDeleteFolder(folder) {
  const confirmed = await showConfirm(
    `Are you sure you want to delete the folder "${folder.name}" and all its contents?\n\nThis action cannot be undone.`,
    '🗑️ Delete Folder'
  );

  if (!confirmed) return;

  try {
    deleteFolder(folder.id);
  } catch (error) {
    console.error('[TreasureChest] Failed to delete folder:', error);
    showAlert('Failed to delete folder. Please try again.', '❌ Error');
  }
}

function handleCreateScroll() {
  openScrollEditor(null, currentFolderId);
}

function handleCreateArtifact() {
  openArtifactEditor(null, currentFolderId);
}

function handleEditFile(file) {
  if (file.type === 'scroll') {
    openScrollEditor(file, currentFolderId);
  } else if (file.type === 'artifact') {
    openArtifactEditor(file, currentFolderId);
  }
}

function handleOpenInPotionMixer(file) {
  // Emit FILE_OPEN event that Potion Mixer listens to
  eventBus.emit(Events.FILE_OPEN, {
    fileId: file.id,
    fileName: file.name,
    fileType: file.type,
    timestamp: Date.now()
  });
  
  console.log('[TreasureChest] Opening scroll in Potion Mixer:', file.name);
}

async function handleRenameFile(file) {
  const newName = await showPrompt('Enter new file name:', file.name, '🏷️ Rename File');
  if (!newName || newName.trim() === '' || newName === file.name) return;

  try {
    updateFile(file.id, { name: newName.trim() });
    eventBus.emit(Events.FILE_UPDATED, {
      fileId: file.id,
      fileName: newName.trim(),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[TreasureChest] Failed to rename file:', error);
    showAlert('Failed to rename file. Please try again.', '❌ Error');
  }
}

async function handleDeleteFile(file) {
  const confirmed = await showConfirm(
    `Are you sure you want to delete "${file.name}"?\n\nThis action cannot be undone.`,
    '🗑️ Delete File'
  );

  if (!confirmed) return;

  try {
    deleteFile(file.id);
    eventBus.emit(Events.FILE_DELETED, {
      fileId: file.id,
      fileName: file.name,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[TreasureChest] Failed to delete file:', error);
    showAlert('Failed to delete file. Please try again.', '❌ Error');
  }
}

function handleCopy(type, item) {
  clipboard = { type, id: item.id, operation: 'copy' };
  console.log('[TreasureChest] Copied to clipboard:', item.name);
}

function handleCut(type, item) {
  clipboard = { type, id: item.id, operation: 'cut' };
  console.log('[TreasureChest] Cut to clipboard:', item.name);
}

function handlePaste() {
  if (!clipboard) return;

  try {
    if (clipboard.type === 'file') {
      if (clipboard.operation === 'copy') {
        copyFile(clipboard.id, currentFolderId);
      } else if (clipboard.operation === 'cut') {
        moveFile(clipboard.id, currentFolderId);
        clipboard = null;
      }
    } else if (clipboard.type === 'folder') {
      if (clipboard.operation === 'cut') {
        moveFolder(clipboard.id, currentFolderId);
        clipboard = null;
      } else {
        showAlert('Copying folders is not yet supported', 'ℹ️ Not Supported');
      }
    }
  } catch (error) {
    console.error('[TreasureChest] Paste failed:', error);
    showAlert(error.message || 'Failed to paste. Please try again.', '❌ Paste Error');
  }
}

function handleContentChange() {
  render();
  checkAndDisplayQuota();
}

async function checkAndDisplayQuota() {
  try {
    const quota = await getStorageQuota();
    const storageInfoEl = containerEl.querySelector('#storage-info');
    const storageBarFillEl = containerEl.querySelector('#storage-bar-fill');
    const storageTextEl = containerEl.querySelector('#storage-text');

    if (!storageInfoEl || !storageBarFillEl || !storageTextEl) return;

    const usedMB = (quota.used / (1024 * 1024)).toFixed(2);
    const totalMB = (quota.quota / (1024 * 1024)).toFixed(2);
    const percentUsed = (quota.used / quota.quota) * 100;

    storageBarFillEl.style.width = `${percentUsed}%`;
    storageTextEl.textContent = `Vault Capacity: ${usedMB} MB / ${totalMB} MB (${percentUsed.toFixed(1)}%)`;

    if (quota.used > 40 * 1024 * 1024) {
      storageInfoEl.classList.add('storage-warning');
      storageBarFillEl.classList.add('storage-warning');
    } else {
      storageInfoEl.classList.remove('storage-warning');
      storageBarFillEl.classList.remove('storage-warning');
    }

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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function destroyTreasureChestApp() {
  eventBus.off(Events.FILE_CREATED, handleContentChange);
  eventBus.off(Events.FILE_UPDATED, handleContentChange);
  eventBus.off(Events.FILE_DELETED, handleContentChange);
  eventBus.off(Events.FILE_MOVED, handleContentChange);
  eventBus.off(Events.FOLDER_CREATED, handleContentChange);
  eventBus.off(Events.FOLDER_UPDATED, handleContentChange);
  eventBus.off(Events.FOLDER_DELETED, handleContentChange);
  eventBus.off(Events.FOLDER_MOVED, handleContentChange);
}
