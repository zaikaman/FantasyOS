/**
 * Quest Manager
 * Handles CRUD operations for quests
 */

import { getDatabase } from '../../storage/database.js';
import { generateUUID } from '../../utils/uuid.js';
import { eventBus } from '../../core/event-bus.js';

/**
 * Get all quests from database
 * @param {Object} filters - Optional filters (status, priority)
 * @returns {Promise<Array>} Array of quest objects
 */
export async function getAllQuests(filters = {}) {
  const db = await getDatabase();
  let query = 'SELECT * FROM quests';
  const conditions = [];
  const params = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.priority) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const result = db.exec(query, params);
  
  if (!result || result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  const values = result[0].values;

  return values.map(row => {
    const quest = {};
    columns.forEach((col, i) => {
      quest[col] = row[i];
    });
    
    // Parse JSON tags
    if (quest.tags) {
      try {
        quest.tags = JSON.parse(quest.tags);
      } catch (e) {
        quest.tags = [];
      }
    } else {
      quest.tags = [];
    }

    return quest;
  });
}

/**
 * Get quest by ID
 * @param {string} questId - Quest ID
 * @returns {Promise<Object|null>} Quest object or null if not found
 */
export async function getQuestById(questId) {
  const db = await getDatabase();
  const result = db.exec('SELECT * FROM quests WHERE id = ?', [questId]);
  
  if (!result || result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const row = result[0].values[0];
  const quest = {};

  columns.forEach((col, i) => {
    quest[col] = row[i];
  });

  // Parse JSON tags
  if (quest.tags) {
    try {
      quest.tags = JSON.parse(quest.tags);
    } catch (e) {
      quest.tags = [];
    }
  } else {
    quest.tags = [];
  }

  return quest;
}

/**
 * Create a new quest
 * @param {Object} questData - Quest data (title, description, priority, due_date, tags)
 * @returns {Promise<Object>} Created quest object
 */
export async function createQuest(questData) {
  const db = await getDatabase();
  const now = Date.now();
  const questId = generateUUID('quest');

  const quest = {
    id: questId,
    title: questData.title || 'Untitled Quest',
    description: questData.description || '',
    status: 'active',
    priority: questData.priority || 'normal',
    due_date: questData.due_date || null,
    tags: JSON.stringify(questData.tags || []),
    created_at: now,
    completed_at: null,
    modified_at: now
  };

  db.run(
    `INSERT INTO quests (id, title, description, status, priority, due_date, tags, created_at, completed_at, modified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quest.id,
      quest.title,
      quest.description,
      quest.status,
      quest.priority,
      quest.due_date,
      quest.tags,
      quest.created_at,
      quest.completed_at,
      quest.modified_at
    ]
  );

  console.log('[Quest Manager] Created quest:', questId);
  eventBus.emit('quest:created', { questId, quest });

  // Return quest with parsed tags
  return {
    ...quest,
    tags: JSON.parse(quest.tags)
  };
}

/**
 * Update a quest
 * @param {string} questId - Quest ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated quest object
 */
export async function updateQuest(questId, updates) {
  const db = await getDatabase();
  const now = Date.now();

  const allowedFields = ['title', 'description', 'status', 'priority', 'due_date', 'tags'];
  const setClauses = [];
  const params = [];

  Object.keys(updates).forEach(field => {
    if (allowedFields.includes(field)) {
      setClauses.push(`${field} = ?`);
      
      // Handle tags JSON serialization
      if (field === 'tags') {
        params.push(JSON.stringify(updates[field]));
      } else {
        params.push(updates[field]);
      }
    }
  });

  // Update completed_at if status changed to completed or failed
  if (updates.status === 'completed' || updates.status === 'failed') {
    setClauses.push('completed_at = ?');
    params.push(now);
  } else if (updates.status === 'active') {
    setClauses.push('completed_at = ?');
    params.push(null);
  }

  setClauses.push('modified_at = ?');
  params.push(now);
  params.push(questId);

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  db.run(
    `UPDATE quests SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  console.log('[Quest Manager] Updated quest:', questId);
  eventBus.emit('quest:updated', { questId, updates });

  return await getQuestById(questId);
}

/**
 * Complete a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Updated quest object
 */
export async function completeQuest(questId) {
  return await updateQuest(questId, { status: 'completed' });
}

/**
 * Fail a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Updated quest object
 */
export async function failQuest(questId) {
  return await updateQuest(questId, { status: 'failed' });
}

/**
 * Abandon a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Updated quest object
 */
export async function abandonQuest(questId) {
  return await updateQuest(questId, { status: 'abandoned' });
}

/**
 * Reactivate a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Updated quest object
 */
export async function reactivateQuest(questId) {
  return await updateQuest(questId, { status: 'active' });
}

/**
 * Delete a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<void>}
 */
export async function deleteQuest(questId) {
  const db = await getDatabase();
  db.run('DELETE FROM quests WHERE id = ?', [questId]);

  console.log('[Quest Manager] Deleted quest:', questId);
  eventBus.emit('quest:deleted', { questId });
}

/**
 * Get quest statistics
 * @returns {Promise<Object>} Quest stats (total, active, completed, failed, abandoned)
 */
export async function getQuestStats() {
  const db = await getDatabase();
  
  const result = db.exec(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned
    FROM quests
  `);

  if (!result || result.length === 0 || result[0].values.length === 0) {
    return { total: 0, active: 0, completed: 0, failed: 0, abandoned: 0 };
  }

  const row = result[0].values[0];
  return {
    total: row[0] || 0,
    active: row[1] || 0,
    completed: row[2] || 0,
    failed: row[3] || 0,
    abandoned: row[4] || 0
  };
}
