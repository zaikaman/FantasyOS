/**
 * Potion Mixer Notepad
 * A mystical text editor for brewing notes with alchemical animations
 * Features: Drag-to-mix ingredients, auto-summaries, save as bubbling vials
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { insertFile, updateFile, getFilesByType, getFileById } from '../../storage/queries.js';
import { generateIngredient } from './snippet-generator.js';
import { generateUUID } from '../../utils/uuid.js';
import { showAlert, showConfirm, showPrompt } from '../../utils/modal.js';

let containerEl = null;
let currentNoteId = null;
let currentContent = '';
let ingredients = [];
let isDirty = false;

/**
 * Create Potion Mixer Notepad app
 * @returns {HTMLElement} App container
 */
export function createPotionMixerApp() {
  console.log('[PotionMixer] Initializing cauldron...');
  
  containerEl = document.createElement('div');
  containerEl.className = 'potion-mixer-container';
  
  render();
  
  // Listen for FILE_OPEN events to open scrolls from Treasure Chest
  const fileOpenListener = eventBus.on(Events.FILE_OPEN, async (data) => {
    if (data && data.fileType === 'scroll' && data.fileId) {
      // Check if user has unsaved changes
      if (isDirty) {
        const confirmed = await showConfirm(
          `You have unsaved changes. Open "${data.fileName || 'this scroll'}"?`,
          '⚠️ Unsaved Changes'
        );
        if (!confirmed) return;
      }
      
      loadPotion(data.fileId);
    }
  });
  
  // Store the unsubscribe function for cleanup
  containerEl._fileOpenListener = fileOpenListener;
  
  console.log('[PotionMixer] Cauldron ready for brewing!');
  return containerEl;
}

/**
 * Render the main app interface
 */
function render() {
  containerEl.innerHTML = `
    <div class="potion-header">
      <h2 class="potion-title">🧪 Potion Mixer Notepad</h2>
      <div class="potion-actions">
        <button class="btn-new-potion" id="btn-new-potion" title="New Potion">
          ✨ New Brew
        </button>
        <button class="btn-open-potion" id="btn-open-potion" title="Open Saved Potion">
          📖 Open Vial
        </button>
        <button class="btn-save-potion" id="btn-save-potion" title="Save to Treasure Chest">
          🧴 Save Vial
        </button>
        <button class="btn-generate-summary" id="btn-generate-summary" title="Auto-generate Summary">
          📜 Brew Summary
        </button>
      </div>
    </div>

    <div class="cauldron-workspace">
      <!-- Ingredient Panel -->
      <div class="ingredient-panel">
        <h3 class="panel-title">🌿 Mystical Ingredients</h3>
        <div class="ingredient-list" id="ingredient-list">
          <div class="ingredient-hint">
            Click "Add Ingredient" to create text snippets you can drag into your cauldron!
          </div>
        </div>
        <button class="btn-add-ingredient" id="btn-add-ingredient">
          ➕ Add Ingredient
        </button>
      </div>

      <!-- Cauldron Editor -->
      <div class="cauldron-container">
        <div class="cauldron-bubbles" id="cauldron-bubbles">
          <!-- Animated bubbles will be added here -->
        </div>
        <div 
          class="cauldron-editor" 
          id="cauldron-editor" 
          contenteditable="true" 
          spellcheck="true"
          data-placeholder="Begin brewing your mystical notes... Drop ingredients here or type freely!"
        ></div>
        <div class="cauldron-rim"></div>
        <div class="cauldron-base"></div>
      </div>

      <!-- Properties Panel -->
      <div class="properties-panel">
        <h3 class="panel-title">📊 Potion Properties</h3>
        <div class="property-item">
          <span class="property-label">Characters:</span>
          <span class="property-value" id="char-count">0</span>
        </div>
        <div class="property-item">
          <span class="property-label">Words:</span>
          <span class="property-value" id="word-count">0</span>
        </div>
        <div class="property-item">
          <span class="property-label">Ingredients:</span>
          <span class="property-value" id="ingredient-count">0</span>
        </div>
        <div class="property-item">
          <span class="property-label">Last Stirred:</span>
          <span class="property-value" id="last-edited">Never</span>
        </div>
        <div class="summary-section" id="summary-section" style="display: none;">
          <h4 class="summary-title">🔮 Auto-Summary</h4>
          <div class="summary-content" id="summary-content"></div>
        </div>
      </div>
    </div>

    <!-- Open Vial Modal -->
    <div class="potion-modal" id="open-vial-modal" style="display: none;">
      <div class="potion-modal-content">
        <div class="potion-modal-header">
          <h3>📖 Saved Potions</h3>
          <button class="modal-close" id="close-open-modal">×</button>
        </div>
        <div class="potion-modal-body">
          <div class="saved-potions-list" id="saved-potions-list">
            <div class="loading-potions">✨ Loading potions...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
  renderIngredients();
  updateStats();
  createBubbles();
  
  // Auto-save interval
  setInterval(() => {
    if (isDirty && currentNoteId) {
      autoSave();
    }
  }, 5000);
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const editor = containerEl.querySelector('#cauldron-editor');
  const btnNew = containerEl.querySelector('#btn-new-potion');
  const btnOpen = containerEl.querySelector('#btn-open-potion');
  const btnSave = containerEl.querySelector('#btn-save-potion');
  const btnSummary = containerEl.querySelector('#btn-generate-summary');
  const btnAddIngredient = containerEl.querySelector('#btn-add-ingredient');
  
  // Editor events
  editor.addEventListener('input', handleEditorInput);
  editor.addEventListener('paste', handlePaste);
  editor.addEventListener('dragover', handleDragOver);
  editor.addEventListener('drop', handleDrop);
  
  // Button events
  btnNew.addEventListener('click', handleNewPotion);
  btnOpen.addEventListener('click', handleOpenPotion);
  btnSave.addEventListener('click', handleSavePotion);
  btnSummary.addEventListener('click', handleGenerateSummary);
  btnAddIngredient.addEventListener('click', handleAddIngredient);
  
  // Keyboard shortcuts
  containerEl.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Handle editor input
 */
function handleEditorInput(e) {
  currentContent = e.target.innerText;
  isDirty = true;
  updateStats();
  createFizzEffect(e);
}

/**
 * Handle paste event
 */
function handlePaste(e) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
  createFizzEffect(e);
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  containerEl.querySelector('#cauldron-editor').classList.add('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const editor = containerEl.querySelector('#cauldron-editor');
  editor.classList.remove('drag-over');
  
  const ingredientId = e.dataTransfer.getData('text/ingredient-id');
  if (ingredientId) {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (ingredient) {
      // Focus the editor first
      editor.focus();
      
      // Insert ingredient text at cursor or end
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      if (range && editor.contains(range.commonAncestorContainer)) {
        // Insert at cursor position
        range.deleteContents();
        const textNode = document.createTextNode(ingredient.text + ' ');
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Insert at end if no valid cursor position
        editor.innerText += (editor.innerText ? ' ' : '') + ingredient.text + ' ';
        // Move cursor to end
        const newRange = document.createRange();
        const sel = window.getSelection();
        newRange.selectNodeContents(editor);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      
      currentContent = editor.innerText;
      isDirty = true;
      updateStats();
      createMixEffect(e.clientX, e.clientY);
    }
  }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    handleSavePotion();
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    handleNewPotion();
  }
}

/**
 * Handle new potion
 */
async function handleNewPotion() {
  if (isDirty) {
    const confirmed = await showConfirm(
      'You have unsaved changes. Create a new potion?',
      '⚠️ Unsaved Changes'
    );
    if (!confirmed) return;
  }
  
  currentNoteId = null;
  currentContent = '';
  isDirty = false;
  
  const editor = containerEl.querySelector('#cauldron-editor');
  if (editor) {
    editor.innerText = '';
  }
  
  updateStats();
  createSparkleEffect();
}

/**
 * Handle open potion
 */
async function handleOpenPotion() {
  if (isDirty) {
    const confirmed = await showConfirm(
      'You have unsaved changes. Open a different potion?',
      '⚠️ Unsaved Changes'
    );
    if (!confirmed) return;
  }
  
  // Show modal
  const modal = containerEl.querySelector('#open-vial-modal');
  modal.style.display = 'flex';
  
  // Load saved potions
  loadSavedPotionsList();
  
  // Close button
  const closeBtn = containerEl.querySelector('#close-open-modal');
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  closeBtn.onclick = closeModal;
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

/**
 * Load saved potions list
 */
function loadSavedPotionsList() {
  const listEl = containerEl.querySelector('#saved-potions-list');
  
  try {
    const scrolls = getFilesByType('scroll');
    
    if (scrolls.length === 0) {
      listEl.innerHTML = `
        <div class="no-potions">
          <div class="no-potions-icon">🧪</div>
          <p>No saved potions found</p>
          <p class="no-potions-hint">Save your first potion to see it here!</p>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = scrolls.map(scroll => {
      const date = new Date(scroll.modified_at);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      return `
        <div class="saved-potion-item" data-id="${scroll.id}">
          <div class="saved-potion-icon">📜</div>
          <div class="saved-potion-info">
            <div class="saved-potion-name">${escapeHtml(scroll.name)}</div>
            <div class="saved-potion-meta">
              <span>📅 ${dateStr}</span>
              <span>🕐 ${timeStr}</span>
              <span>📝 ${scroll.size_bytes} bytes</span>
            </div>
          </div>
          <button class="btn-load-potion" data-id="${scroll.id}" title="Load this potion">
            Open
          </button>
        </div>
      `;
    }).join('');
    
    // Attach click handlers
    listEl.querySelectorAll('.btn-load-potion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        loadPotion(id);
      });
    });
    
    // Also allow clicking the whole item
    listEl.querySelectorAll('.saved-potion-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        loadPotion(id);
      });
    });
    
  } catch (error) {
    console.error('[PotionMixer] Failed to load potions:', error);
    listEl.innerHTML = `
      <div class="no-potions">
        <div class="no-potions-icon">⚠️</div>
        <p>Failed to load potions</p>
      </div>
    `;
  }
}

/**
 * Load a specific potion into the editor
 */
function loadPotion(fileId) {
  try {
    const file = getFileById(fileId);
    
    if (!file) {
      showAlert('Potion not found! It may have been deleted.', '⚗️ Potion Missing');
      return;
    }
    
    // Load content into editor
    const editor = containerEl.querySelector('#cauldron-editor');
    if (editor) {
      editor.innerText = file.content || '';
    }
    
    currentContent = file.content || '';
    currentNoteId = fileId;
    isDirty = false;
    
    updateStats();
    createSparkleEffect();
    
    // Close modal
    const modal = containerEl.querySelector('#open-vial-modal');
    modal.style.display = 'none';
    
    showNotification(`📖 Opened "${file.name}"`);
    
  } catch (error) {
    console.error('[PotionMixer] Failed to load potion:', error);
    showAlert('Failed to load potion. The magic fizzled out!', '❌ Error');
  }
}

/**
 * Handle save potion
 */
async function handleSavePotion() {
  const editor = containerEl.querySelector('#cauldron-editor');
  if (!editor || !currentContent.trim()) {
    showAlert('The cauldron is empty! Add some notes first.', '⚗️ Empty Cauldron');
    return;
  }
  
  const name = await showPrompt('Name your potion (vial):', currentNoteId ? 'Unnamed Potion' : '', '🧪 Save Potion');
  if (!name || !name.trim()) return;
  
  try {
    const timestamp = Date.now();
    const sizeBytes = new Blob([currentContent]).size;
    
    if (currentNoteId) {
      // Update existing
      updateFile(currentNoteId, {
        name: name.trim(),
        content: currentContent,
        modified_at: timestamp,
        size_bytes: sizeBytes
      });
      
      eventBus.emit(Events.FILE_UPDATED, {
        fileId: currentNoteId,
        fileName: name.trim(),
        timestamp: timestamp
      });
    } else {
      // Create new
      const fileId = generateUUID();
      insertFile({
        id: fileId,
        name: name.trim(),
        type: 'scroll',
        content: currentContent,
        thumbnail: null,
        folder_id: null,
        created_at: timestamp,
        modified_at: timestamp,
        size_bytes: sizeBytes
      });
      
      currentNoteId = fileId;
      
      eventBus.emit(Events.FILE_CREATED, {
        fileId: fileId,
        fileName: name.trim(),
        fileType: 'scroll',
        timestamp: timestamp
      });
    }
    
    isDirty = false;
    createVialEffect();
    
    // Show success notification
    showNotification('🧴 Potion saved to Treasure Chest!');
  } catch (error) {
    console.error('[PotionMixer] Failed to save:', error);
    showAlert('Failed to save potion. The magic fizzled out!', '❌ Save Error');
  }
}

/**
 * Handle generate summary
 */
async function handleGenerateSummary() {
  const summarySection = containerEl.querySelector('#summary-section');
  const summaryContent = containerEl.querySelector('#summary-content');
  
  if (!currentContent.trim()) {
    showAlert('The cauldron is empty! Add some notes first.', '⚗️ Empty Cauldron');
    return;
  }
  
  summarySection.style.display = 'block';
  summaryContent.innerHTML = '<div class="summary-loading">✨ Brewing summary...</div>';
  
  // Simulate AI summary generation (lightweight stub)
  setTimeout(() => {
    const summary = generateSimpleSummary(currentContent);
    summaryContent.innerHTML = `<div class="summary-text">${summary}</div>`;
    createSparkleEffect();
  }, 1500);
}

/**
 * Generate a simple summary using basic text analysis
 */
function generateSimpleSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    return '🌟 This potion contains mystical whispers yet to be understood...';
  }
  
  // Take first and last sentences, or just first if only one
  const summary = sentences.length === 1 
    ? sentences[0].trim()
    : `${sentences[0].trim()}... ${sentences[sentences.length - 1].trim()}`;
  
  // Add rhyming ending for fun
  const rhymes = [
    'A potion of knowledge, brewed with care!',
    'These words shall echo through the air!',
    'In this cauldron, wisdom takes its form!',
    'A magical brew, both bright and warm!',
    'These notes shall guide you on your quest!',
    'Among all potions, this one is the best!'
  ];
  
  const randomRhyme = rhymes[Math.floor(Math.random() * rhymes.length)];
  
  return `<p><em>"${summary}"</em></p><p class="summary-rhyme">✨ ${randomRhyme}</p>`;
}

/**
 * Handle add ingredient
 */
async function handleAddIngredient() {
  const text = await showPrompt('Enter ingredient text (snippet):', '', '✨ Add Ingredient');
  if (!text || !text.trim()) return;
  
  const ingredient = generateIngredient(text.trim());
  ingredients.push(ingredient);
  renderIngredients();
  updateStats();
  createSparkleEffect();
}

/**
 * Render ingredients list
 */
function renderIngredients() {
  const listEl = containerEl.querySelector('#ingredient-list');
  if (!listEl) return;
  
  if (ingredients.length === 0) {
    listEl.innerHTML = `
      <div class="ingredient-hint">
        Click "Add Ingredient" to create text snippets you can drag into your cauldron!
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = ingredients.map(ingredient => `
    <div 
      class="ingredient-item" 
      draggable="true" 
      data-id="${ingredient.id}"
      title="${ingredient.text}"
    >
      <span class="ingredient-icon">${ingredient.icon}</span>
      <span class="ingredient-text">${escapeHtml(ingredient.text.substring(0, 30))}${ingredient.text.length > 30 ? '...' : ''}</span>
      <button class="btn-remove-ingredient" data-id="${ingredient.id}">×</button>
    </div>
  `).join('');
  
  // Attach drag events
  listEl.querySelectorAll('.ingredient-item').forEach(item => {
    item.addEventListener('dragstart', handleIngredientDragStart);
  });
  
  // Attach remove events
  listEl.querySelectorAll('.btn-remove-ingredient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      ingredients = ingredients.filter(ing => ing.id !== id);
      renderIngredients();
      updateStats();
    });
  });
}

/**
 * Handle ingredient drag start
 */
function handleIngredientDragStart(e) {
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/ingredient-id', e.currentTarget.dataset.id);
  e.currentTarget.classList.add('dragging');
  
  const target = e.currentTarget;
  setTimeout(() => {
    if (target && target.classList) {
      target.classList.remove('dragging');
    }
  }, 100);
}

/**
 * Update stats panel
 */
function updateStats() {
  if (!containerEl) return;
  
  const charCount = containerEl.querySelector('#char-count');
  const wordCount = containerEl.querySelector('#word-count');
  const ingredientCount = containerEl.querySelector('#ingredient-count');
  const lastEdited = containerEl.querySelector('#last-edited');
  
  if (charCount) charCount.textContent = currentContent.length;
  
  if (wordCount) {
    const words = currentContent.trim().split(/\s+/).filter(w => w.length > 0);
    wordCount.textContent = words.length;
  }
  
  if (ingredientCount) ingredientCount.textContent = ingredients.length;
  
  if (lastEdited) {
    const now = new Date();
    lastEdited.textContent = now.toLocaleTimeString();
  }
}

/**
 * Create bubbles animation
 */
function createBubbles() {
  const bubblesContainer = containerEl.querySelector('#cauldron-bubbles');
  if (!bubblesContainer) return;
  
  // Create 10 random bubbles
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      createBubble(bubblesContainer);
    }, i * 500);
  }
  
  // Keep creating new bubbles
  setInterval(() => {
    createBubble(bubblesContainer);
  }, 2000);
}

/**
 * Create a single bubble
 */
function createBubble(container) {
  const bubble = document.createElement('div');
  bubble.className = 'cauldron-bubble';
  
  const size = Math.random() * 20 + 10;
  const left = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  const delay = Math.random() * 2;
  
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${left}%`;
  bubble.style.animationDuration = `${duration}s`;
  bubble.style.animationDelay = `${delay}s`;
  
  container.appendChild(bubble);
  
  // Remove after animation
  setTimeout(() => {
    bubble.remove();
  }, (duration + delay) * 1000);
}

/**
 * Create fizz effect when typing
 */
function createFizzEffect(e) {
  const editor = containerEl.querySelector('#cauldron-editor');
  if (!editor) return;
  
  const fizz = document.createElement('div');
  fizz.className = 'fizz-particle';
  fizz.style.left = `${Math.random() * editor.offsetWidth}px`;
  fizz.style.top = `${Math.random() * 50}px`;
  
  editor.appendChild(fizz);
  
  setTimeout(() => fizz.remove(), 1000);
}

/**
 * Create mix effect when dropping ingredient
 */
function createMixEffect(x, y) {
  const editor = containerEl.querySelector('#cauldron-editor');
  if (!editor) return;
  
  for (let i = 0; i < 5; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'mix-sparkle';
    
    const rect = editor.getBoundingClientRect();
    sparkle.style.left = `${x - rect.left}px`;
    sparkle.style.top = `${y - rect.top}px`;
    sparkle.style.animationDelay = `${i * 0.1}s`;
    
    editor.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 1000);
  }
}

/**
 * Create sparkle effect for actions
 */
function createSparkleEffect() {
  const editor = containerEl.querySelector('#cauldron-editor');
  if (!editor) return;
  
  for (let i = 0; i < 8; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'action-sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${i * 0.1}s`;
    
    editor.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 1500);
  }
}

/**
 * Create vial effect when saving
 */
function createVialEffect() {
  const header = containerEl.querySelector('.potion-header');
  if (!header) return;
  
  const vial = document.createElement('div');
  vial.className = 'vial-animation';
  vial.innerHTML = '🧴';
  
  header.appendChild(vial);
  
  setTimeout(() => vial.remove(), 2000);
}

/**
 * Show notification
 */
function showNotification(message) {
  eventBus.emit(Events.NOTIFICATION, {
    title: 'Potion Mixer',
    message: message,
    type: 'success',
    timestamp: Date.now()
  });
}

/**
 * Auto-save functionality
 */
async function autoSave() {
  if (!currentNoteId || !currentContent.trim()) return;
  
  try {
    const timestamp = Date.now();
    const sizeBytes = new Blob([currentContent]).size;
    
    updateFile(currentNoteId, { 
      content: currentContent,
      modified_at: timestamp,
      size_bytes: sizeBytes
    });
    isDirty = false;
    console.log('[PotionMixer] Auto-saved');
  } catch (error) {
    console.error('[PotionMixer] Auto-save failed:', error);
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
 * Cleanup function
 */
export function destroyPotionMixerApp() {
  if (isDirty && currentNoteId) {
    autoSave();
  }
  
  // Unsubscribe from FILE_OPEN event
  if (containerEl && containerEl._fileOpenListener) {
    containerEl._fileOpenListener();
  }
  
  console.log('[PotionMixer] Cauldron cleaned up');
}
