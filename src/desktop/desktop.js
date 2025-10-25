/**
 * Desktop Manager
 * Handles desktop environment initialization and rune launcher
 */

import { getAllApps } from '../apps/app-registry.js';
import { eventBus, Events } from '../core/event-bus.js';
import { createWindow } from '../window/window-manager.js';
import { getBackgroundUrl } from '../assets/backgrounds.js';

let desktopElement = null;
let launcherElement = null;

/**
 * Initialize desktop environment
 */
export function initDesktop() {
  console.log('[Desktop] Initializing...');

  desktopElement = document.getElementById('desktop-root');
  launcherElement = document.getElementById('app-launcher');

  if (!desktopElement || !launcherElement) {
    throw new Error('Desktop elements not found');
  }

  // Set default background image (will be overridden by settings if needed)
  const desktopBg = document.querySelector('.desktop-background');
  if (desktopBg) {
    const defaultBgUrl = getBackgroundUrl('background');
    desktopBg.style.backgroundImage = `url('${defaultBgUrl}')`;
    console.log('[Desktop] Set default background:', defaultBgUrl);
  }

  // Render rune launcher
  renderRuneLauncher();

  // Initialize quest log button click handler
  initQuestLogButton();

  // Initialize treasure chest click handler
  initTreasureChest();

  // Initialize mana calculator orb click handler
  initManaCalculatorOrb();

  // Initialize weather oracle orb click handler
  initWeatherOracleOrb();

  // Initialize potion mixer notepad click handler
  initPotionMixerNotepad();

  // Initialize realm customizer altar click handler
  initRealmCustomizerAltar();

  console.log('[Desktop] Initialized');
}

/**
 * Render rune launcher with app icons
 */
function renderRuneLauncher() {
  const apps = getAllApps();

  launcherElement.innerHTML = '';

  apps.forEach(app => {
    const runeIcon = createRuneIcon(app);
    launcherElement.appendChild(runeIcon);
  });

  console.log(`[Desktop] Rendered ${apps.length} rune icons`);
}

/**
 * Create rune icon element
 * @param {Object} app - App definition
 * @returns {HTMLElement} Rune icon element
 */
function createRuneIcon(app) {
  const container = document.createElement('div');
  container.className = 'rune-icon';
  container.dataset.appId = app.id;

  // Create SVG container
  const iconContainer = document.createElement('div');
  iconContainer.innerHTML = app.icon;

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'rune-tooltip';
  tooltip.textContent = app.name;

  container.appendChild(iconContainer);
  container.appendChild(tooltip);

  // Add click handler
  container.addEventListener('click', () => {
    handleRuneClick(app);
  });

  // Add hover effects
  container.addEventListener('mouseenter', () => {
    eventBus.emit('rune:hover', { appId: app.id, name: app.name });
  });

  return container;
}

/**
 * Handle rune icon click
 * @param {Object} app - App definition
 */
function handleRuneClick(app) {
  console.log(`[Desktop] Launching app: ${app.name}`);

  // Create window for the app
  try {
    createWindow(app.id);
  } catch (error) {
    console.error('[Desktop] Failed to create window:', error);
  }

  // Emit app launch event
  eventBus.emit(Events.APP_LAUNCHED, {
    appId: app.id,
    appName: app.name,
    timestamp: Date.now()
  });

  // Visual feedback
  const runeElement = launcherElement.querySelector(`[data-app-id="${app.id}"]`);
  if (runeElement) {
    runeElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
      runeElement.style.transform = '';
    }, 150);
  }
}

/**
 * Show desktop (fade in)
 */
export function showDesktop() {
  if (desktopElement) {
    desktopElement.style.opacity = '0';
    desktopElement.style.transition = 'opacity 0.5s ease-in-out';
    setTimeout(() => {
      desktopElement.style.opacity = '1';
    }, 100);
  }
}

/**
 * Hide desktop (fade out)
 */
export function hideDesktop() {
  if (desktopElement) {
    desktopElement.style.opacity = '0';
  }
}

/**
 * Initialize quest log button click handler
 */
function initQuestLogButton() {
  const questLogElement = document.getElementById('quest-log-button');
  
  if (!questLogElement) {
    console.warn('[Desktop] Quest log button element not found');
    return;
  }

  questLogElement.addEventListener('click', () => {
    console.log('[Desktop] Opening quest log...');
    
    // Create window for quest log app
    try {
      createWindow('quest-log');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'quest-log',
        appName: 'Quest Log',
        timestamp: Date.now()
      });
      
      // Visual feedback
      questLogElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        questLogElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open quest log:', error);
    }
  });

  console.log('[Desktop] Quest log button initialized');
}

/**
 * Initialize treasure chest click handler
 */
function initTreasureChest() {
  const chestElement = document.getElementById('treasure-chest');
  
  if (!chestElement) {
    console.warn('[Desktop] Treasure chest element not found');
    return;
  }

  chestElement.addEventListener('click', () => {
    console.log('[Desktop] Opening treasure chest...');
    
    // Create window for treasure chest app
    try {
      createWindow('treasure-chest');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'treasure-chest',
        appName: 'Treasure Chest',
        timestamp: Date.now()
      });
      
      // Visual feedback
      chestElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        chestElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open treasure chest:', error);
    }
  });

  console.log('[Desktop] Treasure chest initialized');
}

/**
 * Initialize mana calculator orb click handler
 */
function initManaCalculatorOrb() {
  const orbElement = document.getElementById('mana-calculator-orb');
  
  if (!orbElement) {
    console.warn('[Desktop] Mana calculator orb element not found');
    return;
  }

  orbElement.addEventListener('click', () => {
    console.log('[Desktop] Opening mana calculator...');
    
    // Create window for mana calculator app
    try {
      createWindow('mana-calculator');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'mana-calculator',
        appName: 'Mana Calculator',
        timestamp: Date.now()
      });
      
      // Visual feedback
      orbElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        orbElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open mana calculator:', error);
    }
  });

  console.log('[Desktop] Mana calculator orb initialized');
}

/**
 * Initialize weather oracle orb click handler
 */
function initWeatherOracleOrb() {
  const orbElement = document.getElementById('weather-oracle-orb');
  
  if (!orbElement) {
    console.warn('[Desktop] Weather oracle orb element not found');
    return;
  }

  orbElement.addEventListener('click', () => {
    console.log('[Desktop] Opening weather oracle...');
    
    // Create window for weather oracle app
    try {
      createWindow('weather-oracle');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'weather-oracle',
        appName: 'Wand Weather Oracle',
        timestamp: Date.now()
      });
      
      // Visual feedback
      orbElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        orbElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open weather oracle:', error);
    }
  });

  console.log('[Desktop] Weather oracle orb initialized');
}

/**
 * Initialize potion mixer notepad click handler
 */
function initPotionMixerNotepad() {
  const notepadElement = document.getElementById('potion-mixer-notepad');
  
  if (!notepadElement) {
    console.warn('[Desktop] Potion mixer notepad element not found');
    return;
  }

  notepadElement.addEventListener('click', () => {
    console.log('[Desktop] Opening potion mixer notepad...');
    
    // Create window for potion mixer app
    try {
      createWindow('potion-mixer');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'potion-mixer',
        appName: 'Potion Mixer Notepad',
        timestamp: Date.now()
      });
      
      // Visual feedback
      notepadElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        notepadElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open potion mixer notepad:', error);
    }
  });

  console.log('[Desktop] Potion mixer notepad initialized');
}

/**
 * Initialize realm customizer altar click handler
 */
function initRealmCustomizerAltar() {
  const altarElement = document.getElementById('realm-customizer-altar');
  
  if (!altarElement) {
    console.warn('[Desktop] Realm customizer altar element not found');
    return;
  }

  altarElement.addEventListener('click', () => {
    console.log('[Desktop] Opening realm customizer altar...');
    
    // Create window for realm customizer app
    try {
      createWindow('realm-customizer');
      
      // Emit app launch event
      eventBus.emit(Events.APP_LAUNCHED, {
        appId: 'realm-customizer',
        appName: 'Realm Customizer Altar',
        timestamp: Date.now()
      });
      
      // Visual feedback
      altarElement.style.transform = 'scale(0.95) translateY(-2px)';
      setTimeout(() => {
        altarElement.style.transform = '';
      }, 150);
    } catch (error) {
      console.error('[Desktop] Failed to open realm customizer altar:', error);
    }
  });

  console.log('[Desktop] Realm customizer altar initialized');
}
