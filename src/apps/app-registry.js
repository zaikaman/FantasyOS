/**
 * Application Registry
 * Central registry for all applications in the Enchanted Realm
 */

import {
  calculatorRune,
  treasureChestRune,
  questLogRune,
  weatherOracleRune
} from '../assets/runes/app-icons.js';
import { createTreasureChestApp } from './treasure-chest/treasure-chest.js';
import { createManaCalculatorApp } from './mana-calculator/mana-calculator.js';
import { createQuestLogApp } from './quest-log/quest-log.js';
import { createWeatherOracleApp } from './weather-oracle/weather-oracle.js';
import { createPotionMixerApp } from './potion-mixer/potion-mixer.js';

/**
 * Application registry
 * Each app definition includes metadata and factory function
 */
export const appRegistry = [];

/**
 * Hidden apps registry
 * Apps that can be launched but don't appear in the launcher
 */
const hiddenApps = [
  {
    id: 'quest-log',
    name: 'Quest Log',
    icon: questLogRune('#FFD700', 64),
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
    icon: treasureChestRune('#FFD700', 64),
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
    icon: calculatorRune('#FFD700', 64),
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
    icon: weatherOracleRune('#9D7FF0', 64),
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
