/**
 * Application Registry
 * Central registry for all applications in the Enchanted Realm
 */

import { createTreasureChestApp } from './treasure-chest/treasure-chest.js';
import { createManaCalculatorApp } from './mana-calculator/mana-calculator.js';
import { createQuestLogApp } from './quest-log/quest-log.js';
import { createWeatherOracleApp } from './weather-oracle/weather-oracle.js';
import { createPotionMixerApp } from './potion-mixer/potion-mixer.js';
import { createRealmCustomizerApp } from './realm-customizer/realm-customizer.js';
import { createEchoChamberApp } from './echo-chamber/echo-chamber.js';
import { createGamesArcadeApp } from './games-arcade/games-arcade.js';
import { createSpellTomeLibraryApp } from './spell-tome-library/spell-tome-library.js';
import { createBardicLutePlayerApp } from './bardic-lute-player/bardic-lute-player.js';
import { createHexCanvasApp } from './hex-canvas/hex-canvas.js';
import { createMeditationChamberApp } from './meditation-chamber/meditation-chamber.js';
import { createRuneWizzApp } from './rune-wizz/rune-wizz.js';

/**
 * Application registry
 * Each app definition includes metadata and factory function
 */
export const appRegistry = [
  {
    id: 'rune-wizz',
    name: 'RuneWizz Voice Agent',
    icon: '🧙',
    runeColor: '#FFD700',
    description: 'Voice-powered AI assistant for complete OS control',
    component: createRuneWizzApp,
    defaultWidth: 500,
    defaultHeight: 650,
    singleton: true // Only one voice agent at a time
  }
];

/**
 * Hidden apps registry
 * Apps that can be launched but don't appear in the launcher
 */
const hiddenApps = [
  {
    id: 'quest-log',
    name: 'Quest Log',
    icon: '📜',
    runeColor: '#FFD700',
    description: 'Track your adventures and tasks',
    component: createQuestLogApp,
    defaultWindow: {
      width: 'auto',
      height: 'auto'
    },
    singleton: true
  },
  {
    id: 'treasure-chest',
    name: 'Treasure Chest Explorer',
    icon: '💰',
    runeColor: '#FFD700',
    description: 'Browse and manage your scrolls and artifacts',
    component: createTreasureChestApp,
    defaultWidth: 800,
    defaultHeight: 600,
    singleton: false // Multiple instances allowed
  },
  {
    id: 'mana-calculator',
    name: 'Mana Calculator',
    icon: '🔢',
    runeColor: '#FFD700',
    description: 'Perform arcane calculations with mystical precision',
    component: createManaCalculatorApp,
    defaultWidth: 480,
    defaultHeight: 720,
    singleton: true // Only one instance allowed
  },
  {
    id: 'weather-oracle',
    name: 'Wand Weather Oracle',
    icon: '🌤️',
    runeColor: '#9D7FF0',
    description: 'Scry the meteorological fates with mystical prophecies',
    component: createWeatherOracleApp,
    defaultWidth: 700,
    defaultHeight: 800,
    singleton: true // Only one instance allowed
  },
  {
    id: 'potion-mixer',
    name: 'Potion Mixer Notepad',
    icon: '🧪',
    runeColor: '#90EE90',
    description: 'A mystical notepad for brewing notes with alchemical animations',
    component: createPotionMixerApp,
    defaultWidth: 1200,
    defaultHeight: 700,
    singleton: false // Multiple instances allowed
  },
  {
    id: 'realm-customizer',
    name: 'Realm Customizer Altar',
    icon: '⚗️',
    runeColor: '#9D7FF0',
    description: 'Customize your enchanted realm appearance and settings',
    component: createRealmCustomizerApp,
    defaultWidth: 750,
    defaultHeight: 800,
    singleton: true // Only one instance allowed
  },
  {
    id: 'echo-chamber',
    name: 'Echo Chamber Terminal',
    icon: '⚡',
    runeColor: '#00ff88',
    description: 'RuneShell - AI-powered command terminal with mystical outputs',
    component: createEchoChamberApp,
    defaultWidth: 900,
    defaultHeight: 650,
    singleton: false // Multiple terminals allowed
  },
  {
    id: 'games-arcade',
    name: 'Mystical Games Arcade',
    icon: '🎮',
    runeColor: '#9D7FF0',
    description: 'Portal to the realm\'s finest collection of mystical games',
    component: createGamesArcadeApp,
    defaultWidth: 1000,
    defaultHeight: 700,
    singleton: true // Only one arcade at a time
  },
  {
    id: 'spell-tome-library',
    name: 'Spell Tome Library',
    icon: '📚',
    runeColor: '#FFD700',
    description: 'A mystical library for reading scrolls, grimoires, and ancient texts',
    component: createSpellTomeLibraryApp,
    defaultWidth: 1100,
    defaultHeight: 750,
    singleton: false // Multiple instances allowed
  },
  {
    id: 'bardic-lute-player',
    name: 'Bardic Lute Player',
    icon: '🎵',
    runeColor: '#9D7FF0',
    description: 'A mystical music player that searches and plays melodies from across the realms',
    component: createBardicLutePlayerApp,
    defaultWidth: 900,
    defaultHeight: 700,
    singleton: false // Multiple instances allowed
  },
  {
    id: 'hex-canvas',
    name: 'Hex Canvas Studio',
    icon: '🎨',
    runeColor: '#FF6B9D',
    description: 'A mystical pixel art and drawing studio with professional tools, layers, and palettes',
    component: createHexCanvasApp,
    defaultWidth: 1400,
    defaultHeight: 850,
    singleton: false // Multiple canvases allowed
  },
  {
    id: 'meditation-chamber',
    name: 'Meditation Chamber',
    icon: '⏱️',
    runeColor: '#9D7FF0',
    description: 'A mystical Pomodoro timer and focus app with ambient sounds for deep concentration',
    component: createMeditationChamberApp,
    defaultWidth: 900,
    defaultHeight: 850,
    singleton: true // Only one meditation session at a time
  }
];

/**
 * Get app definition by ID
 * @param {string} appId - Application identifier
 * @returns {Object|null} App definition or null if not found
 */
export function getAppById(appId) {
  // Check visible apps first
  let app = appRegistry.find(app => app.id === appId);
  
  // If not found, check hidden apps
  if (!app) {
    app = hiddenApps.find(app => app.id === appId);
  }
  
  return app || null;
}

/**
 * Get all registered apps
 * @returns {Array} Array of app definitions
 */
export function getAllApps() {
  return [...appRegistry];
}

/**
 * Register a new application
 * @param {Object} appDef - Application definition
 */
export function registerApp(appDef) {
  // Validate required fields
  if (!appDef.id || !appDef.name || !appDef.component) {
    throw new Error('App definition must include id, name, and component');
  }

  // Check for duplicate ID
  if (appRegistry.some(app => app.id === appDef.id)) {
    throw new Error(`App with id '${appDef.id}' already registered`);
  }

  appRegistry.push({
    icon: appDef.icon || '',
    runeColor: appDef.runeColor || '#FFD700',
    description: appDef.description || '',
    defaultWindow: appDef.defaultWindow || { width: 600, height: 500 },
    singleton: appDef.singleton !== undefined ? appDef.singleton : false,
    ...appDef
  });

  console.log(`[App Registry] Registered app: ${appDef.name}`);
}

/**
 * Create placeholder app component (temporary until apps are implemented)
 * @param {string} title - App title
 * @param {string} icon - Emoji icon
 * @returns {HTMLElement} App container element
 */
function createPlaceholderApp(title, icon) {
  const container = document.createElement('div');
  container.className = 'app-placeholder';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    color: var(--color-text-light);
    text-align: center;
  `;

  container.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 1rem;">${icon}</div>
    <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${title}</h2>
    <p style="color: var(--color-text-muted); font-size: 0.875rem;">
      This application is under construction.<br>
      Check back soon for magical updates! ✨
    </p>
  `;

  return container;
}
