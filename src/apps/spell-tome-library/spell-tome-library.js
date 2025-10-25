/**
 * Spell Tome Library
 * A mystical document reader for viewing scrolls, grimoires, and ancient texts
 * Features: Multi-format support, bookmarks, reading modes, search
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { getFilesByType, getFileById } from '../../storage/queries.js';
import { renderDocument } from './document-parser.js';
import { showAlert, showConfirm } from '../../utils/modal.js';
import { formatTimestamp } from '../../utils/date.js';

let containerEl = null;
let currentTomeId = null;
let currentTomeData = null;
let readingMode = 'parchment'; // parchment, crystal, starlight
let bookmarks = new Map(); // tomeId -> Set of section IDs
let recentTomes = []; // Array of tome IDs
let fontSize = 16;
let searchQuery = '';

/**
 * Create Spell Tome Library app
 * @returns {HTMLElement} App container
 */
export function createSpellTomeLibraryApp() {
  console.log('[SpellTome] Opening the ancient library...');
  
  containerEl = document.createElement('div');
  containerEl.className = 'spell-tome-container';
  
  // Load saved preferences
  loadPreferences();
  
  render();
  
  // Listen for FILE_OPEN events to open documents from Treasure Chest
  const fileOpenListener = eventBus.on(Events.FILE_OPEN, async (data) => {
    if (data && data.fileType === 'scroll' && data.fileId) {
      openTome(data.fileId);
    }
  });
  
  containerEl._fileOpenListener = fileOpenListener;
  
  console.log('[SpellTome] Library ready for reading!');
  return containerEl;
}

/**
 * Render the main app interface
 */
function render() {
  containerEl.innerHTML = `
    <div class="tome-sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">📚 Library</h3>
        <button class="btn-sidebar-toggle" id="btn-sidebar-toggle" title="Toggle Sidebar">
          ◀
        </button>
      </div>
      
      <div class="sidebar-section">
        <h4 class="section-title">Recent Tomes</h4>
        <div class="recent-tomes-list" id="recent-tomes-list">
          <div class="empty-state">No recent tomes</div>
        </div>
      </div>
      
      <div class="sidebar-section">
        <h4 class="section-title">All Scrolls</h4>
        <div class="all-tomes-list" id="all-tomes-list">
          <div class="loading-state">Loading library...</div>
        </div>
      </div>
      
      <div class="sidebar-section">
        <h4 class="section-title">Bookmarks</h4>
        <div class="bookmarks-list" id="bookmarks-list">
          <div class="empty-state">No bookmarks</div>
        </div>
      </div>
    </div>
    
    <div class="tome-main">
      <div class="tome-header">
        <div class="tome-title-section">
          <h2 class="tome-title" id="tome-title">Spell Tome Library</h2>
          <div class="tome-meta" id="tome-meta"></div>
        </div>
        
        <div class="tome-actions">
          <div class="search-container">
            <input 
              type="text" 
              class="tome-search" 
              id="tome-search" 
              placeholder="🔍 Search in tome..."
              value="${searchQuery}"
            />
          </div>
          
          <div class="font-controls">
            <button class="btn-font-size" id="btn-font-decrease" title="Decrease Font Size">A-</button>
            <span class="font-size-display">${fontSize}px</span>
            <button class="btn-font-size" id="btn-font-increase" title="Increase Font Size">A+</button>
          </div>
          
          <div class="reading-mode-selector">
            <button class="btn-mode ${readingMode === 'parchment' ? 'active' : ''}" data-mode="parchment" title="Parchment Mode">📜</button>
            <button class="btn-mode ${readingMode === 'crystal' ? 'active' : ''}" data-mode="crystal" title="Crystal Mode">💎</button>
            <button class="btn-mode ${readingMode === 'starlight' ? 'active' : ''}" data-mode="starlight" title="Starlight Mode">⭐</button>
          </div>
          
          <button class="btn-bookmark" id="btn-bookmark" title="Bookmark Current Position">
            🔖
          </button>
        </div>
      </div>
      
      <div class="tome-content-wrapper ${readingMode}-mode" id="tome-content-wrapper">
        <div class="tome-content" id="tome-content">
          <div class="welcome-screen">
            <div class="welcome-icon">📖</div>
            <h2 class="welcome-title">Welcome to the Spell Tome Library</h2>
            <p class="welcome-text">
              Select a scroll from the sidebar to begin your journey through ancient knowledge.
            </p>
            <div class="welcome-features">
              <div class="feature-item">
                <span class="feature-icon">📜</span>
                <span class="feature-text">Parchment Mode - Classic scrollwork</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">💎</span>
                <span class="feature-text">Crystal Mode - Clear modern reading</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">⭐</span>
                <span class="feature-text">Starlight Mode - Gentle night reading</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔖</span>
                <span class="feature-text">Bookmarks - Mark important passages</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tome-navigation" id="tome-navigation" style="display: none;">
          <div class="nav-sections" id="nav-sections"></div>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
  loadAllTomes();
  loadRecentTomes();
  updateBookmarksList();
  
  // Apply font size
  applyFontSize();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const searchInput = containerEl.querySelector('#tome-search');
  const fontIncrease = containerEl.querySelector('#btn-font-increase');
  const fontDecrease = containerEl.querySelector('#btn-font-decrease');
  const bookmarkBtn = containerEl.querySelector('#btn-bookmark');
  const sidebarToggle = containerEl.querySelector('#btn-sidebar-toggle');
  
  // Search
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // Font size controls
  if (fontIncrease) {
    fontIncrease.addEventListener('click', () => {
      fontSize = Math.min(fontSize + 2, 32);
      applyFontSize();
      savePreferences();
    });
  }
  
  if (fontDecrease) {
    fontDecrease.addEventListener('click', () => {
      fontSize = Math.max(fontSize - 2, 12);
      applyFontSize();
      savePreferences();
    });
  }
  
  // Reading mode buttons
  containerEl.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      setReadingMode(mode);
    });
  });
  
  // Bookmark button
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', handleBookmark);
  }
  
  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // Keyboard shortcuts
  containerEl.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Load all scrolls from the database
 */
function loadAllTomes() {
  const listEl = containerEl.querySelector('#all-tomes-list');
  if (!listEl) return;
  
  try {
    const scrolls = getFilesByType('scroll');
    
    if (scrolls.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No scrolls in library</p>
          <p class="empty-hint">Create a scroll in Potion Mixer first!</p>
        </div>
      `;
      return;
    }
    
    // Sort by modified date (newest first)
    scrolls.sort((a, b) => b.modified_at - a.modified_at);
    
    listEl.innerHTML = scrolls.map(scroll => `
      <div class="tome-item ${currentTomeId === scroll.id ? 'active' : ''}" data-id="${scroll.id}">
        <div class="tome-item-icon">📜</div>
        <div class="tome-item-info">
          <div class="tome-item-name" title="${escapeHtml(scroll.name)}">${escapeHtml(scroll.name)}</div>
          <div class="tome-item-meta">
            ${formatTimestamp(scroll.modified_at)}
          </div>
        </div>
      </div>
    `).join('');
    
    // Attach click handlers
    listEl.querySelectorAll('.tome-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        openTome(id);
      });
    });
    
  } catch (error) {
    console.error('[SpellTome] Failed to load tomes:', error);
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Failed to load library</p>
      </div>
    `;
  }
}

/**
 * Load recent tomes
 */
function loadRecentTomes() {
  const listEl = containerEl.querySelector('#recent-tomes-list');
  if (!listEl) return;
  
  if (recentTomes.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No recent tomes</div>';
    return;
  }
  
  // Get tome data for recent IDs
  const tomes = recentTomes
    .map(id => {
      try {
        return getFileById(id);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 5); // Show max 5 recent
  
  if (tomes.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No recent tomes</div>';
    return;
  }
  
  listEl.innerHTML = tomes.map(tome => `
    <div class="tome-item ${currentTomeId === tome.id ? 'active' : ''}" data-id="${tome.id}">
      <div class="tome-item-icon">📖</div>
      <div class="tome-item-info">
        <div class="tome-item-name" title="${escapeHtml(tome.name)}">${escapeHtml(tome.name)}</div>
      </div>
    </div>
  `).join('');
  
  // Attach click handlers
  listEl.querySelectorAll('.tome-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      openTome(id);
    });
  });
}

/**
 * Open a tome by ID
 */
function openTome(tomeId) {
  try {
    const tome = getFileById(tomeId);
    
    if (!tome) {
      showAlert('Tome not found! It may have been deleted.', '📖 Tome Missing');
      return;
    }
    
    currentTomeId = tomeId;
    currentTomeData = tome;
    
    // Add to recent tomes
    recentTomes = [tomeId, ...recentTomes.filter(id => id !== tomeId)].slice(0, 10);
    savePreferences();
    
    // Update UI
    renderTomeContent();
    loadRecentTomes();
    updateActiveItem();
    
    // Scroll to top
    const contentEl = containerEl.querySelector('#tome-content');
    if (contentEl) {
      contentEl.scrollTop = 0;
    }
    
    console.log('[SpellTome] Opened tome:', tome.name);
    
  } catch (error) {
    console.error('[SpellTome] Failed to open tome:', error);
    showAlert('Failed to open tome. The ancient magic fizzled out!', '❌ Error');
  }
}

/**
 * Render tome content
 */
function renderTomeContent() {
  if (!currentTomeData) return;
  
  const titleEl = containerEl.querySelector('#tome-title');
  const metaEl = containerEl.querySelector('#tome-meta');
  const contentEl = containerEl.querySelector('#tome-content');
  const navEl = containerEl.querySelector('#tome-navigation');
  
  if (titleEl) {
    titleEl.textContent = currentTomeData.name;
  }
  
  if (metaEl) {
    const wordCount = currentTomeData.content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute
    
    metaEl.innerHTML = `
      <span class="meta-item">📝 ${wordCount} words</span>
      <span class="meta-item">⏱️ ${readTime} min read</span>
      <span class="meta-item">📅 ${formatTimestamp(currentTomeData.modified_at)}</span>
    `;
  }
  
  if (contentEl) {
    // Render document with parser
    const renderedContent = renderDocument(currentTomeData.content, currentTomeData.name);
    contentEl.innerHTML = renderedContent.html;
    
    // Show navigation if there are sections
    if (renderedContent.sections.length > 0 && navEl) {
      navEl.style.display = 'block';
      renderNavigation(renderedContent.sections);
    } else if (navEl) {
      navEl.style.display = 'none';
    }
    
    // Add click handlers to section links
    contentEl.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = contentEl.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
  
  // Update bookmark button state
  updateBookmarkButton();
}

/**
 * Render navigation sections
 */
function renderNavigation(sections) {
  const navEl = containerEl.querySelector('#nav-sections');
  if (!navEl) return;
  
  navEl.innerHTML = `
    <div class="nav-title">📑 Contents</div>
    ${sections.map(section => `
      <a href="#${section.id}" class="nav-link" data-level="${section.level}">
        ${'  '.repeat(section.level - 1)}${section.text}
      </a>
    `).join('')}
  `;
  
  // Attach click handlers
  navEl.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = containerEl.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Handle search input
 */
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  
  if (!currentTomeData || !searchQuery) {
    // Clear highlights
    renderTomeContent();
    return;
  }
  
  const contentEl = containerEl.querySelector('#tome-content');
  if (!contentEl) return;
  
  // Re-render with highlights
  const renderedContent = renderDocument(currentTomeData.content, currentTomeData.name);
  let html = renderedContent.html;
  
  // Simple highlight (not perfect but works for basic search)
  if (searchQuery) {
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
    html = html.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  contentEl.innerHTML = html;
}

/**
 * Set reading mode
 */
function setReadingMode(mode) {
  readingMode = mode;
  
  const wrapper = containerEl.querySelector('#tome-content-wrapper');
  if (wrapper) {
    wrapper.className = `tome-content-wrapper ${mode}-mode`;
  }
  
  // Update active button
  containerEl.querySelectorAll('.btn-mode').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  savePreferences();
  
  // Show notification
  const modeNames = {
    parchment: '📜 Parchment Mode',
    crystal: '💎 Crystal Mode',
    starlight: '⭐ Starlight Mode'
  };
  
  showNotification(`Reading mode: ${modeNames[mode]}`);
}

/**
 * Apply font size to content
 */
function applyFontSize() {
  const contentEl = containerEl.querySelector('#tome-content');
  if (contentEl) {
    contentEl.style.fontSize = `${fontSize}px`;
  }
  
  const displayEl = containerEl.querySelector('.font-size-display');
  if (displayEl) {
    displayEl.textContent = `${fontSize}px`;
  }
}

/**
 * Handle bookmark toggle
 */
function handleBookmark() {
  if (!currentTomeId) {
    showAlert('No tome is currently open!', '🔖 Bookmark');
    return;
  }
  
  if (!bookmarks.has(currentTomeId)) {
    bookmarks.set(currentTomeId, new Set());
  }
  
  const tomeBookmarks = bookmarks.get(currentTomeId);
  const scrollPos = containerEl.querySelector('#tome-content')?.scrollTop || 0;
  const bookmarkId = `pos-${scrollPos}`;
  
  if (tomeBookmarks.has(bookmarkId)) {
    tomeBookmarks.delete(bookmarkId);
    showNotification('🔖 Bookmark removed');
  } else {
    tomeBookmarks.add(bookmarkId);
    showNotification('🔖 Bookmark added');
  }
  
  savePreferences();
  updateBookmarksList();
  updateBookmarkButton();
}

/**
 * Update bookmark button state
 */
function updateBookmarkButton() {
  const btn = containerEl.querySelector('#btn-bookmark');
  if (!btn) return;
  
  if (currentTomeId && bookmarks.has(currentTomeId)) {
    const scrollPos = containerEl.querySelector('#tome-content')?.scrollTop || 0;
    const bookmarkId = `pos-${scrollPos}`;
    const isBookmarked = bookmarks.get(currentTomeId).has(bookmarkId);
    btn.classList.toggle('active', isBookmarked);
  } else {
    btn.classList.remove('active');
  }
}

/**
 * Update bookmarks list
 */
function updateBookmarksList() {
  const listEl = containerEl.querySelector('#bookmarks-list');
  if (!listEl) return;
  
  const bookmarkedTomes = Array.from(bookmarks.entries())
    .filter(([_, marks]) => marks.size > 0);
  
  if (bookmarkedTomes.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No bookmarks</div>';
    return;
  }
  
  listEl.innerHTML = bookmarkedTomes.map(([tomeId, marks]) => {
    try {
      const tome = getFileById(tomeId);
      if (!tome) return '';
      
      return `
        <div class="bookmark-group">
          <div class="bookmark-tome-name">${escapeHtml(tome.name)}</div>
          <div class="bookmark-count">${marks.size} bookmark${marks.size > 1 ? 's' : ''}</div>
        </div>
      `;
    } catch (error) {
      return '';
    }
  }).filter(Boolean).join('');
}

/**
 * Update active item in sidebar
 */
function updateActiveItem() {
  containerEl.querySelectorAll('.tome-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === currentTomeId);
  });
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  const sidebar = containerEl.querySelector('.tome-sidebar');
  const toggleBtn = containerEl.querySelector('#btn-sidebar-toggle');
  
  if (sidebar && toggleBtn) {
    sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + F - Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = containerEl.querySelector('#tome-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Ctrl/Cmd + B - Toggle bookmark
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    handleBookmark();
  }
  
  // Ctrl/Cmd + + - Increase font
  if ((e.ctrlKey || e.metaKey) && e.key === '=') {
    e.preventDefault();
    fontSize = Math.min(fontSize + 2, 32);
    applyFontSize();
    savePreferences();
  }
  
  // Ctrl/Cmd + - - Decrease font
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    fontSize = Math.max(fontSize - 2, 12);
    applyFontSize();
    savePreferences();
  }
}

/**
 * Show notification
 */
function showNotification(message) {
  eventBus.emit(Events.NOTIFICATION, {
    title: 'Spell Tome Library',
    message: message,
    type: 'info',
    timestamp: Date.now()
  });
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
  try {
    localStorage.setItem('spellTome_readingMode', readingMode);
    localStorage.setItem('spellTome_fontSize', fontSize.toString());
    localStorage.setItem('spellTome_recentTomes', JSON.stringify(recentTomes));
    
    // Save bookmarks
    const bookmarksArray = Array.from(bookmarks.entries()).map(([tomeId, marks]) => [
      tomeId,
      Array.from(marks)
    ]);
    localStorage.setItem('spellTome_bookmarks', JSON.stringify(bookmarksArray));
  } catch (error) {
    console.error('[SpellTome] Failed to save preferences:', error);
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences() {
  try {
    const savedMode = localStorage.getItem('spellTome_readingMode');
    if (savedMode) {
      readingMode = savedMode;
    }
    
    const savedSize = localStorage.getItem('spellTome_fontSize');
    if (savedSize) {
      fontSize = parseInt(savedSize, 10);
    }
    
    const savedRecent = localStorage.getItem('spellTome_recentTomes');
    if (savedRecent) {
      recentTomes = JSON.parse(savedRecent);
    }
    
    const savedBookmarks = localStorage.getItem('spellTome_bookmarks');
    if (savedBookmarks) {
      const bookmarksArray = JSON.parse(savedBookmarks);
      bookmarks = new Map(bookmarksArray.map(([tomeId, marks]) => [
        tomeId,
        new Set(marks)
      ]));
    }
  } catch (error) {
    console.error('[SpellTome] Failed to load preferences:', error);
  }
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Cleanup function
 */
export function destroySpellTomeLibraryApp() {
  // Save preferences
  savePreferences();
  
  // Unsubscribe from FILE_OPEN event
  if (containerEl && containerEl._fileOpenListener) {
    containerEl._fileOpenListener();
  }
  
  console.log('[SpellTome] Library closed');
}
