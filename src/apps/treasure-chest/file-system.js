/**
 * File System Manager
 * Provides hierarchical file system operations for folders and files
 */

import { getDatabase } from '../../storage/database.js';
import { generateFileId } from '../../utils/uuid.js';
import { now } from '../../utils/date.js';
import { eventBus, Events } from '../../core/event-bus.js';

/**
 * Get all folders
 * @param {string|null} parentId - Parent folder ID (null for root)
 * @returns {Array} Array of folders
 */
export function getFolders(parentId = null) {
  const db = getDatabase();
  
  if (parentId === null) {
    const result = db.exec('SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC');
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const rows = result[0].values;
    return rows.map(row => {
      const folder = {};
      columns.forEach((col, i) => {
        folder[col] = row[i];
      });
      return folder;
    });
  } else {
    const stmt = db.prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC');
    stmt.bind([parentId]);
    
    const folders = [];
    while (stmt.step()) {
      folders.push(stmt.getAsObject());
    }
    stmt.free();
    return folders;
  }
}

/**
 * Get folder by ID
 * @param {string} folderId - Folder ID
 * @returns {Object|null} Folder object
 */
export function getFolder(folderId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
  stmt.bind([folderId]);
  
  if (stmt.step()) {
    const folder = stmt.getAsObject();
    stmt.free();
    return folder;
  }
  
  stmt.free();
  return null;
}

/**
 * Get files in a folder
 * @param {string|null} folderId - Folder ID (null for root/unorganized)
 * @returns {Array} Array of files
 */
export function getFilesInFolder(folderId = null) {
  const db = getDatabase();
  
  if (folderId === null) {
    const result = db.exec('SELECT * FROM files WHERE folder_id IS NULL ORDER BY name ASC');
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const rows = result[0].values;
    return rows.map(row => {
      const file = {};
      columns.forEach((col, i) => {
        file[col] = row[i];
      });
      return file;
    });
  } else {
    const stmt = db.prepare('SELECT * FROM files WHERE folder_id = ? ORDER BY name ASC');
    stmt.bind([folderId]);
    
    const files = [];
    while (stmt.step()) {
      files.push(stmt.getAsObject());
    }
    stmt.free();
    return files;
  }
}

/**
 * Get all items (folders and files) in a folder
 * @param {string|null} folderId - Folder ID
 * @returns {Object} {folders: [], files: []}
 */
export function getFolderContents(folderId = null) {
  return {
    folders: getFolders(folderId),
    files: getFilesInFolder(folderId)
  };
}

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @param {string|null} parentId - Parent folder ID
 * @returns {string} Created folder ID
 */
export function createFolder(name, parentId = null) {
  const db = getDatabase();
  const folderId = generateFileId('folder');
  const timestamp = now();
  
  const stmt = db.prepare(`
    INSERT INTO folders (id, name, parent_id, created_at, modified_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run([folderId, name, parentId, timestamp, timestamp]);
  stmt.free();
  
  eventBus.emit(Events.FOLDER_CREATED, {
    folderId,
    folderName: name,
    parentId,
    timestamp
  });
  
  console.log('[FileSystem] Folder created:', name);
  return folderId;
}

/**
 * Rename a folder
 * @param {string} folderId - Folder ID
 * @param {string} newName - New folder name
 */
export function renameFolder(folderId, newName) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE folders 
    SET name = ?, modified_at = ?
    WHERE id = ?
  `);
  
  stmt.run([newName, now(), folderId]);
  stmt.free();
  
  eventBus.emit(Events.FOLDER_UPDATED, {
    folderId,
    folderName: newName,
    timestamp: now()
  });
  
  console.log('[FileSystem] Folder renamed to:', newName);
}

/**
 * Delete a folder and all its contents
 * @param {string} folderId - Folder ID
 */
export function deleteFolder(folderId) {
  const db = getDatabase();
  // Get all subfolders recursively
  const subfolders = getAllSubfolders(folderId);
  
  // Delete all files in this folder and subfolders
  const folderIds = [folderId, ...subfolders.map(f => f.id)];
  
  if (folderIds.length > 0) {
    const placeholders = folderIds.map(() => '?').join(',');
    
    const deleteFilesStmt = db.prepare(`DELETE FROM files WHERE folder_id IN (${placeholders})`);
    deleteFilesStmt.run(folderIds);
    deleteFilesStmt.free();
    
    // Delete all subfolders
    if (subfolders.length > 0) {
      const deleteSubfoldersStmt = db.prepare(`DELETE FROM folders WHERE id IN (${placeholders})`);
      deleteSubfoldersStmt.run(folderIds);
      deleteSubfoldersStmt.free();
    }
  }
  
  // Delete the folder itself
  const deleteFolderStmt = db.prepare('DELETE FROM folders WHERE id = ?');
  deleteFolderStmt.run([folderId]);
  deleteFolderStmt.free();
  
  eventBus.emit(Events.FOLDER_DELETED, {
    folderId,
    timestamp: now()
  });
  
  console.log('[FileSystem] Folder deleted:', folderId);
}

/**
 * Move a file to a different folder
 * @param {string} fileId - File ID
 * @param {string|null} targetFolderId - Target folder ID (null for root)
 */
export function moveFile(fileId, targetFolderId = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE files 
    SET folder_id = ?, modified_at = ?
    WHERE id = ?
  `);
  
  stmt.run([targetFolderId, now(), fileId]);
  stmt.free();
  
  eventBus.emit(Events.FILE_MOVED, {
    fileId,
    targetFolderId,
    timestamp: now()
  });
  
  console.log('[FileSystem] File moved to folder:', targetFolderId);
}

/**
 * Move a folder to a different parent folder
 * @param {string} folderId - Folder ID
 * @param {string|null} targetParentId - Target parent folder ID
 */
export function moveFolder(folderId, targetParentId = null) {
  const db = getDatabase();
  // Prevent moving a folder into itself or its descendants
  if (targetParentId && isDescendantOf(targetParentId, folderId)) {
    throw new Error('Cannot move a folder into itself or its descendants');
  }
  
  const stmt = db.prepare(`
    UPDATE folders 
    SET parent_id = ?, modified_at = ?
    WHERE id = ?
  `);
  
  stmt.run([targetParentId, now(), folderId]);
  stmt.free();
  
  eventBus.emit(Events.FOLDER_MOVED, {
    folderId,
    targetParentId,
    timestamp: now()
  });
  
  console.log('[FileSystem] Folder moved to:', targetParentId);
}

/**
 * Copy a file
 * @param {string} fileId - File ID to copy
 * @param {string|null} targetFolderId - Target folder ID
 * @returns {string} New file ID
 */
export function copyFile(fileId, targetFolderId = null) {
  const db = getDatabase();
  // Get original file
  const getStmt = db.prepare('SELECT * FROM files WHERE id = ?');
  getStmt.bind([fileId]);
  
  if (!getStmt.step()) {
    getStmt.free();
    throw new Error('File not found');
  }
  
  const originalFile = getStmt.getAsObject();
  getStmt.free();
  
  // Create copy
  const newFileId = generateFileId();
  const timestamp = now();
  const newName = generateCopyName(originalFile.name);
  
  const insertStmt = db.prepare(`
    INSERT INTO files (id, name, type, content, thumbnail, folder_id, created_at, modified_at, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertStmt.run([
    newFileId,
    newName,
    originalFile.type,
    originalFile.content,
    originalFile.thumbnail,
    targetFolderId,
    timestamp,
    timestamp,
    originalFile.size_bytes
  ]);
  insertStmt.free();
  
  eventBus.emit(Events.FILE_CREATED, {
    fileId: newFileId,
    fileName: newName,
    fileType: originalFile.type,
    timestamp
  });
  
  console.log('[FileSystem] File copied:', newName);
  return newFileId;
}

/**
 * Get folder path (breadcrumb trail)
 * @param {string|null} folderId - Folder ID
 * @returns {Array} Array of folder objects from root to current
 */
export function getFolderPath(folderId) {
  if (!folderId) {
    return [{ id: null, name: 'Root', parent_id: null }];
  }
  
  const path = [];
  let currentId = folderId;
  
  while (currentId) {
    const folder = getFolder(currentId);
    if (!folder) break;
    
    path.unshift(folder);
    currentId = folder.parent_id;
  }
  
  // Add root
  path.unshift({ id: null, name: 'Root', parent_id: null });
  
  return path;
}

/**
 * Get all subfolders recursively
 * @param {string} folderId - Parent folder ID
 * @returns {Array} Array of all subfolders
 */
function getAllSubfolders(folderId) {
  const result = [];
  const folders = getFolders(folderId);
  
  folders.forEach(folder => {
    result.push(folder);
    result.push(...getAllSubfolders(folder.id));
  });
  
  return result;
}

/**
 * Check if a folder is a descendant of another folder
 * @param {string} folderId - Folder to check
 * @param {string} ancestorId - Potential ancestor
 * @returns {boolean} True if folderId is a descendant of ancestorId
 */
function isDescendantOf(folderId, ancestorId) {
  if (folderId === ancestorId) return true;
  
  const folder = getFolder(folderId);
  if (!folder || !folder.parent_id) return false;
  
  return isDescendantOf(folder.parent_id, ancestorId);
}

/**
 * Generate a name for a copied file
 * @param {string} originalName - Original file name
 * @returns {string} New name with "Copy" suffix
 */
function generateCopyName(originalName) {
  const copyMatch = originalName.match(/^(.*?)(?: \(Copy(?: (\d+))?\))?$/);
  
  if (!copyMatch) {
    return `${originalName} (Copy)`;
  }
  
  const baseName = copyMatch[1];
  const copyNum = copyMatch[2] ? parseInt(copyMatch[2]) + 1 : 2;
  
  return `${baseName} (Copy ${copyNum})`;
}

/**
 * Search files and folders
 * @param {string} query - Search query
 * @param {string|null} folderId - Folder to search in (null for all)
 * @returns {Object} {folders: [], files: []}
 */
export function search(query, folderId = null) {
  const db = getDatabase();
  const lowerQuery = query.toLowerCase();
  const searchPattern = `%${lowerQuery}%`;
  
  const folders = [];
  const files = [];
  
  // Search folders
  if (folderId === null) {
    const stmt = db.prepare('SELECT * FROM folders WHERE LOWER(name) LIKE ? ORDER BY name ASC');
    stmt.bind([searchPattern]);
    while (stmt.step()) {
      folders.push(stmt.getAsObject());
    }
    stmt.free();
  } else {
    // Get all subfolders of the specified folder
    const subfolders = getAllSubfolders(folderId);
    const folderIds = [folderId, ...subfolders.map(f => f.id)];
    
    if (folderIds.length > 0) {
      const placeholders = folderIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM folders WHERE LOWER(name) LIKE ? AND id IN (${placeholders}) ORDER BY name ASC`);
      stmt.bind([searchPattern, ...folderIds]);
      while (stmt.step()) {
        folders.push(stmt.getAsObject());
      }
      stmt.free();
    }
  }
  
  // Search files
  if (folderId === null) {
    const stmt = db.prepare('SELECT * FROM files WHERE LOWER(name) LIKE ? ORDER BY name ASC');
    stmt.bind([searchPattern]);
    while (stmt.step()) {
      files.push(stmt.getAsObject());
    }
    stmt.free();
  } else {
    const subfolders = getAllSubfolders(folderId);
    const folderIds = [folderId, ...subfolders.map(f => f.id)];
    
    if (folderIds.length > 0) {
      const placeholders = folderIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM files WHERE LOWER(name) LIKE ? AND folder_id IN (${placeholders}) ORDER BY name ASC`);
      stmt.bind([searchPattern, ...folderIds]);
      while (stmt.step()) {
        files.push(stmt.getAsObject());
      }
      stmt.free();
    }
  }
  
  return { folders, files };
}

/**
 * Get folder statistics
 * @param {string|null} folderId - Folder ID
 * @returns {Object} {fileCount, folderCount, totalSize}
 */
export function getFolderStats(folderId = null) {
  const contents = getFolderContents(folderId);
  
  let totalSize = 0;
  let fileCount = 0;
  
  // Count files in current folder
  contents.files.forEach(file => {
    totalSize += file.size_bytes;
    fileCount++;
  });
  
  // Count files in subfolders recursively
  contents.folders.forEach(folder => {
    const subStats = getFolderStats(folder.id);
    totalSize += subStats.totalSize;
    fileCount += subStats.fileCount;
  });
  
  return {
    fileCount,
    folderCount: contents.folders.length,
    totalSize
  };
}
