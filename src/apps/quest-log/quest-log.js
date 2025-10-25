/**
 * Quest Log Application
 * Fantasy-themed task/quest management system
 */

import {
  getAllQuests,
  createQuest,
  updateQuest,
  completeQuest,
  failQuest,
  abandonQuest,
  reactivateQuest,
  deleteQuest,
  getQuestStats
} from './quest-manager.js';
import { eventBus } from '../../core/event-bus.js';
import { showConfirm } from '../../utils/modal.js';

/**
 * Create Quest Log application
 * @returns {HTMLElement} Quest Log container element
 */
export function createQuestLogApp() {
  const container = document.createElement('div');
  container.className = 'quest-log-app';

  let currentFilter = 'active';
  let quests = [];

  // Header
  const header = document.createElement('div');
  header.className = 'quest-log-header';
  header.innerHTML = `
    <h2 class="quest-log-title">📜 Quest Log</h2>
    <p class="quest-log-subtitle">Track your adventures and endeavors</p>
  `;

  // Stats bar
  const statsBar = document.createElement('div');
  statsBar.className = 'quest-stats-bar';

  // Filter tabs
  const filterTabs = document.createElement('div');
  filterTabs.className = 'quest-filter-tabs';
  filterTabs.innerHTML = `
    <button class="filter-tab active" data-filter="active">⚔️ Active</button>
    <button class="filter-tab" data-filter="completed">✅ Completed</button>
    <button class="filter-tab" data-filter="failed">❌ Failed</button>
    <button class="filter-tab" data-filter="abandoned">🚫 Abandoned</button>
    <button class="filter-tab" data-filter="all">📋 All</button>
  `;

  // Quest list
  const questList = document.createElement('div');
  questList.className = 'quest-list';

  // New quest button
  const newQuestBtn = document.createElement('button');
  newQuestBtn.className = 'quest-log-new-btn';
  newQuestBtn.innerHTML = '✨ Begin New Quest';
  newQuestBtn.onclick = () => showNewQuestForm();

  // Assemble app
  container.appendChild(header);
  container.appendChild(statsBar);
  container.appendChild(filterTabs);
  container.appendChild(questList);
  container.appendChild(newQuestBtn);

  // Event handlers
  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tab')) {
      document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      loadQuests();
    }
  });

  // Load quests on mount
  loadQuests();
  updateStats();

  // Subscribe to quest events
  eventBus.on('quest:created', loadQuests);
  eventBus.on('quest:updated', loadQuests);
  eventBus.on('quest:deleted', loadQuests);

  /**
   * Load and render quests based on current filter
   */
  async function loadQuests() {
    const filters = currentFilter === 'all' ? {} : { status: currentFilter };
    quests = await getAllQuests(filters);
    renderQuests();
    updateStats();
  }

  /**
   * Render quest list
   */
  function renderQuests() {
    if (quests.length === 0) {
      questList.innerHTML = `
        <div class="quest-empty-state">
          <div class="quest-empty-icon">🗺️</div>
          <p>No quests ${currentFilter !== 'all' ? currentFilter : 'found'}</p>
          <p class="quest-empty-hint">Begin your adventure by creating a new quest!</p>
        </div>
      `;
      return;
    }

    questList.innerHTML = '';
    quests.forEach(quest => {
      const questCard = createQuestCard(quest);
      questList.appendChild(questCard);
    });
  }

  /**
   * Create a quest card element
   * @param {Object} quest - Quest data
   * @returns {HTMLElement} Quest card element
   */
  function createQuestCard(quest) {
    const card = document.createElement('div');
    card.className = `quest-card quest-${quest.status} quest-priority-${quest.priority}`;
    card.dataset.questId = quest.id;

    const priorityEmoji = {
      low: '🟢',
      normal: '🟡',
      high: '🟠',
      urgent: '🔴'
    }[quest.priority] || '🟡';

    const statusText = {
      active: 'Active',
      completed: 'Completed',
      failed: 'Failed',
      abandoned: 'Abandoned'
    }[quest.status] || 'Unknown';

    const dueDateHTML = quest.due_date ? `
      <div class="quest-due-date ${isDueSoon(quest.due_date) ? 'due-soon' : ''}">
        ⏰ Due: ${formatDate(quest.due_date)}
      </div>
    ` : '';

    const tagsHTML = quest.tags && quest.tags.length > 0 ? `
      <div class="quest-tags">
        ${quest.tags.map(tag => `<span class="quest-tag">${tag}</span>`).join('')}
      </div>
    ` : '';

    card.innerHTML = `
      <div class="quest-card-header">
        <div class="quest-priority-indicator">${priorityEmoji}</div>
        <h3 class="quest-title">${escapeHtml(quest.title)}</h3>
        <div class="quest-status-badge">${statusText}</div>
      </div>
      ${quest.description ? `<p class="quest-description">${escapeHtml(quest.description)}</p>` : ''}
      ${dueDateHTML}
      ${tagsHTML}
      <div class="quest-actions">
        ${quest.status === 'active' ? `
          <button class="quest-btn quest-btn-complete" data-action="complete">✅ Complete</button>
          <button class="quest-btn quest-btn-fail" data-action="fail">❌ Fail</button>
          <button class="quest-btn quest-btn-abandon" data-action="abandon">🚫 Abandon</button>
        ` : `
          <button class="quest-btn quest-btn-reactivate" data-action="reactivate">🔄 Reactivate</button>
        `}
        <button class="quest-btn quest-btn-edit" data-action="edit">✏️ Edit</button>
        <button class="quest-btn quest-btn-delete" data-action="delete">🗑️ Delete</button>
      </div>
      <div class="quest-timestamp">Created: ${formatDate(quest.created_at)}</div>
    `;

    // Action handlers
    card.querySelector('.quest-actions').addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      switch (action) {
        case 'complete':
          await completeQuest(quest.id);
          break;
        case 'fail':
          await failQuest(quest.id);
          break;
        case 'abandon':
          await abandonQuest(quest.id);
          break;
        case 'reactivate':
          await reactivateQuest(quest.id);
          break;
        case 'edit':
          showEditQuestForm(quest);
          break;
        case 'delete':
          if (await showConfirm(`Are you sure you want to delete the quest "${quest.title}"?`, '🗑️ Delete Quest')) {
            await deleteQuest(quest.id);
          }
          break;
      }
    });

    return card;
  }

  /**
   * Show new quest form
   */
  function showNewQuestForm() {
    const modal = createQuestFormModal();
    container.appendChild(modal);

    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const tags = formData.get('tags')
        ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
        : [];

      const questData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        due_date: formData.get('due_date') ? new Date(formData.get('due_date')).getTime() : null,
        tags
      };

      await createQuest(questData);
      modal.remove();
    });

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Show edit quest form
   * @param {Object} quest - Quest to edit
   */
  function showEditQuestForm(quest) {
    const modal = createQuestFormModal(quest);
    container.appendChild(modal);

    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const tags = formData.get('tags')
        ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
        : [];

      const updates = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        due_date: formData.get('due_date') ? new Date(formData.get('due_date')).getTime() : null,
        tags
      };

      await updateQuest(quest.id, updates);
      modal.remove();
    });

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * Update statistics bar
   */
  async function updateStats() {
    const stats = await getQuestStats();
    statsBar.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total:</span>
        <span class="stat-value">${stats.total}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">⚔️ Active:</span>
        <span class="stat-value">${stats.active}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">✅ Completed:</span>
        <span class="stat-value">${stats.completed}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">❌ Failed:</span>
        <span class="stat-value">${stats.failed}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">🚫 Abandoned:</span>
        <span class="stat-value">${stats.abandoned}</span>
      </div>
    `;
  }

  return container;
}

/**
 * Create quest form modal
 * @param {Object} quest - Existing quest for editing (optional)
 * @returns {HTMLElement} Modal element
 */
function createQuestFormModal(quest = null) {
  const modal = document.createElement('div');
  modal.className = 'quest-modal';

  const isEdit = quest !== null;
  const title = isEdit ? 'Edit Quest' : 'New Quest';

  const dueDateValue = quest?.due_date 
    ? new Date(quest.due_date).toISOString().split('T')[0]
    : '';

  modal.innerHTML = `
    <div class="quest-modal-content">
      <div class="quest-modal-header">
        <h3>${title}</h3>
        <button class="modal-close">✕</button>
      </div>
      <form class="quest-form">
        <div class="form-group">
          <label for="quest-title">Quest Title *</label>
          <input 
            type="text" 
            id="quest-title" 
            name="title" 
            value="${escapeHtml(quest?.title || '')}"
            placeholder="Enter quest title..."
            required
            maxlength="200"
          />
        </div>

        <div class="form-group">
          <label for="quest-description">Description</label>
          <textarea 
            id="quest-description" 
            name="description" 
            placeholder="Describe your quest..."
            rows="4"
          >${escapeHtml(quest?.description || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quest-priority">Priority</label>
            <select id="quest-priority" name="priority">
              <option value="low" ${quest?.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
              <option value="normal" ${!quest || quest?.priority === 'normal' ? 'selected' : ''}>🟡 Normal</option>
              <option value="high" ${quest?.priority === 'high' ? 'selected' : ''}>🟠 High</option>
              <option value="urgent" ${quest?.priority === 'urgent' ? 'selected' : ''}>🔴 Urgent</option>
            </select>
          </div>

          <div class="form-group">
            <label for="quest-due-date">Due Date</label>
            <input 
              type="date" 
              id="quest-due-date" 
              name="due_date"
              value="${dueDateValue}"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="quest-tags">Tags (comma-separated)</label>
          <input 
            type="text" 
            id="quest-tags" 
            name="tags"
            value="${quest?.tags ? quest.tags.join(', ') : ''}"
            placeholder="e.g., combat, exploration, magic"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="modal-close quest-btn-secondary">Cancel</button>
          <button type="submit" class="quest-btn-primary">${isEdit ? '💾 Save' : '✨ Create Quest'}</button>
        </div>
      </form>
    </div>
  `;

  return modal;
}

/**
 * Check if a date is due soon (within 3 days)
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if due within 3 days
 */
function isDueSoon(timestamp) {
  const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000);
  return timestamp <= threeDaysFromNow && timestamp > Date.now();
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0 && diffDays < 7) {
    return `In ${diffDays} days`;
  } else if (diffDays < 0 && diffDays > -7) {
    return `${Math.abs(diffDays)} days ago`;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
