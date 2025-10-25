/**
 * Realm Customizer Altar
 * A mystical control panel for customizing the enchanted realm's appearance
 * 
 * Features:
 * - Background selection: Choose from 4 different realm backgrounds
 * - Theme customization: Switch between color themes (Mossy, Volcanic, Arctic, Twilight)
 * - Particle density control: Adjust the mystical particle count (0-100%)
 * - Settings persist to SQLite database and auto-load on boot
 * 
 * Settings stored:
 * - realm_background: Selected background image ID
 * - realm_theme: Selected theme ID
 * - particle_density: Particle count (0-100)
 */

import { getSetting, setSetting } from '../../storage/queries.js';
import { eventBus, Events } from '../../core/event-bus.js';

// Available backgrounds
const BACKGROUNDS = [
  { id: 'background', name: 'Enchanted Forest', path: '/src/assets/background.png' },
  { id: 'background2', name: 'Mystical Mountains', path: '/src/assets/background2.png' },
  { id: 'background3', name: 'Arcane Depths', path: '/src/assets/background3.png' },
  { id: 'background4', name: 'Celestial Heights', path: '/src/assets/background4.png' }
];

// Theme configurations
const RUNE_THEMES = [
  {
    id: 'mossy',
    name: 'Mossy Enchantment',
    primary: '#2d5016',
    secondary: '#6b4e8c',
    accent: '#5dd8ed',
    gold: '#d4af37'
  },
  {
    id: 'volcanic',
    name: 'Volcanic Fire',
    primary: '#8b1a1a',
    secondary: '#d97706',
    accent: '#f59e0b',
    gold: '#ea580c'
  },
  {
    id: 'arctic',
    name: 'Arctic Frost',
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    gold: '#93c5fd'
  },
  {
    id: 'twilight',
    name: 'Twilight Shadow',
    primary: '#4c1d95',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    gold: '#c4b5fd'
  }
];

/**
 * Create Realm Customizer Altar app
 * @param {HTMLElement} windowEl - Window DOM element
 * @returns {HTMLElement} App container
 */
export function createRealmCustomizerApp(windowEl) {
  const container = document.createElement('div');
  container.className = 'realm-customizer-container';

  // Load current settings
  const currentBackground = getSetting('realm_background') || 'background';
  const currentTheme = getSetting('realm_theme') || 'mossy';
  const particleDensitySetting = getSetting('particle_density');
  const currentParticleDensity = particleDensitySetting !== null && particleDensitySetting !== undefined 
    ? parseInt(particleDensitySetting, 10) 
    : 2;

  // Create altar frame
  const altarFrame = document.createElement('div');
  altarFrame.className = 'altar-frame';

  // Create header
  const header = document.createElement('div');
  header.className = 'altar-header';
  header.innerHTML = `
    <div class="altar-title">⚗️ Realm Customizer Altar</div>
    <div class="altar-subtitle">Shape thy enchanted domain</div>
  `;

  // Create content sections
  const content = document.createElement('div');
  content.className = 'altar-content';

  // Background section
  const backgroundSection = createBackgroundSection(currentBackground);
  
  // Theme section
  const themeSection = createThemeSection(currentTheme);
  
  // Particle density section
  const particleSection = createParticleSection(currentParticleDensity);

  // Action buttons
  const actions = createActionButtons();

  content.appendChild(backgroundSection);
  content.appendChild(themeSection);
  content.appendChild(particleSection);
  content.appendChild(actions);

  altarFrame.appendChild(header);
  altarFrame.appendChild(content);
  container.appendChild(altarFrame);

  // Setup event handlers
  setupEventHandlers(container);

  console.log('[RealmCustomizer] Altar initialized');

  return container;
}

/**
 * Create background selection section
 */
function createBackgroundSection(currentBackground) {
  const section = document.createElement('div');
  section.className = 'customizer-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.innerHTML = '🌄 Realm Background';

  const grid = document.createElement('div');
  grid.className = 'background-grid';

  BACKGROUNDS.forEach(bg => {
    const card = document.createElement('div');
    card.className = `background-card ${bg.id === currentBackground ? 'selected' : ''}`;
    card.dataset.backgroundId = bg.id;

    const preview = document.createElement('div');
    preview.className = 'background-preview';
    preview.style.backgroundImage = `url('${bg.path}')`;

    const label = document.createElement('div');
    label.className = 'background-label';
    label.textContent = bg.name;

    const checkmark = document.createElement('div');
    checkmark.className = 'background-checkmark';
    checkmark.innerHTML = '✓';

    card.appendChild(preview);
    card.appendChild(label);
    card.appendChild(checkmark);
    grid.appendChild(card);
  });

  section.appendChild(title);
  section.appendChild(grid);

  return section;
}

/**
 * Create theme selection section
 */
function createThemeSection(currentTheme) {
  const section = document.createElement('div');
  section.className = 'customizer-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.innerHTML = '🎨 Rune Theme';

  const grid = document.createElement('div');
  grid.className = 'theme-grid';

  RUNE_THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className = `theme-card ${theme.id === currentTheme ? 'selected' : ''}`;
    card.dataset.themeId = theme.id;

    const colorPreview = document.createElement('div');
    colorPreview.className = 'theme-color-preview';

    ['primary', 'secondary', 'accent', 'gold'].forEach(colorKey => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = theme[colorKey];
      colorPreview.appendChild(swatch);
    });

    const label = document.createElement('div');
    label.className = 'theme-label';
    label.textContent = theme.name;

    const checkmark = document.createElement('div');
    checkmark.className = 'theme-checkmark';
    checkmark.innerHTML = '✓';

    card.appendChild(colorPreview);
    card.appendChild(label);
    card.appendChild(checkmark);
    grid.appendChild(card);
  });

  section.appendChild(title);
  section.appendChild(grid);

  return section;
}

/**
 * Create particle density control section
 */
function createParticleSection(currentDensity) {
  const section = document.createElement('div');
  section.className = 'customizer-section';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.innerHTML = '✨ Mystical Particle Density';

  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = currentDensity;
  slider.className = 'particle-slider';
  slider.id = 'particle-density-slider';

  const valueDisplay = document.createElement('div');
  valueDisplay.className = 'slider-value';
  valueDisplay.textContent = `${currentDensity}%`;

  const labels = document.createElement('div');
  labels.className = 'slider-labels';
  labels.innerHTML = `
    <span>Silent Void</span>
    <span>Mystical Balance</span>
    <span>Arcane Storm</span>
  `;

  slider.addEventListener('input', (e) => {
    valueDisplay.textContent = `${e.target.value}%`;
  });

  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(valueDisplay);
  sliderContainer.appendChild(labels);

  section.appendChild(title);
  section.appendChild(sliderContainer);

  return section;
}

/**
 * Create action buttons
 */
function createActionButtons() {
  const actions = document.createElement('div');
  actions.className = 'altar-actions';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'altar-btn btn-apply';
  applyBtn.innerHTML = '⚡ Cast Changes';
  applyBtn.id = 'apply-changes-btn';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'altar-btn btn-reset';
  resetBtn.innerHTML = '🔄 Reset to Defaults';
  resetBtn.id = 'reset-defaults-btn';

  actions.appendChild(applyBtn);
  actions.appendChild(resetBtn);

  return actions;
}

/**
 * Setup event handlers
 */
function setupEventHandlers(container) {
  // Background card selection
  container.querySelectorAll('.background-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.background-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // Theme card selection
  container.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // Apply button
  const applyBtn = container.querySelector('#apply-changes-btn');
  applyBtn.addEventListener('click', () => {
    applyChanges(container);
  });

  // Reset button
  const resetBtn = container.querySelector('#reset-defaults-btn');
  resetBtn.addEventListener('click', () => {
    resetToDefaults(container);
  });
}

/**
 * Apply selected changes
 */
function applyChanges(container) {
  // Get selected background
  const selectedBgCard = container.querySelector('.background-card.selected');
  const backgroundId = selectedBgCard?.dataset.backgroundId || 'background';

  // Get selected theme
  const selectedThemeCard = container.querySelector('.theme-card.selected');
  const themeId = selectedThemeCard?.dataset.themeId || 'mossy';

  // Get particle density
  const slider = container.querySelector('#particle-density-slider');
  const particleDensity = parseInt(slider?.value || '50');

  // Save to database
  setSetting('realm_background', backgroundId);
  setSetting('realm_theme', themeId);
  setSetting('particle_density', particleDensity);

  // Apply changes to DOM
  applyBackground(backgroundId);
  applyTheme(themeId);
  applyParticleDensity(particleDensity);

  // Show success feedback
  showSuccessMessage(container);

  // Emit event
  eventBus.emit(Events.SETTINGS_CHANGED, {
    background: backgroundId,
    theme: themeId,
    particleDensity: particleDensity
  });

  console.log('[RealmCustomizer] Changes applied:', { backgroundId, themeId, particleDensity });
}

/**
 * Reset to default settings
 */
function resetToDefaults(container) {
  // Reset to defaults
  setSetting('realm_background', 'background');
  setSetting('realm_theme', 'mossy');
  setSetting('particle_density', 2);

  // Apply defaults
  applyBackground('background');
  applyTheme('mossy');
  applyParticleDensity(2);

  // Update UI
  container.querySelectorAll('.background-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.backgroundId === 'background');
  });
  container.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.themeId === 'mossy');
  });
  const slider = container.querySelector('#particle-density-slider');
  if (slider) {
    slider.value = 2;
    container.querySelector('.slider-value').textContent = '2%';
  }

  showResetMessage(container);

  console.log('[RealmCustomizer] Reset to defaults');
}

/**
 * Apply background to desktop
 */
function applyBackground(backgroundId) {
  const background = BACKGROUNDS.find(bg => bg.id === backgroundId);
  if (background) {
    const desktopBg = document.querySelector('.desktop-background');
    if (desktopBg) {
      desktopBg.style.backgroundImage = `url('${background.path}')`;
    }
  }
}

/**
 * Apply theme to CSS variables
 */
function applyTheme(themeId) {
  const theme = RUNE_THEMES.find(t => t.id === themeId);
  if (theme) {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-gold', theme.gold);
    
    // Update light/dark variants (simple brightness adjustment)
    root.style.setProperty('--color-primary-light', adjustBrightness(theme.primary, 20));
    root.style.setProperty('--color-primary-dark', adjustBrightness(theme.primary, -20));
    root.style.setProperty('--color-gold-light', adjustBrightness(theme.gold, 30));
    root.style.setProperty('--color-gold-dark', adjustBrightness(theme.gold, -30));
  }
}

/**
 * Apply particle density
 */
function applyParticleDensity(density) {
  // Emit event for particle system to update
  eventBus.emit('particles:density-changed', { density });
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent / 100)));
  g = Math.max(0, Math.min(255, g + (g * percent / 100)));
  b = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Convert back to hex
  return '#' + 
    Math.round(r).toString(16).padStart(2, '0') + 
    Math.round(g).toString(16).padStart(2, '0') + 
    Math.round(b).toString(16).padStart(2, '0');
}

/**
 * Show success message
 */
function showSuccessMessage(container) {
  const applyBtn = container.querySelector('#apply-changes-btn');
  const originalText = applyBtn.innerHTML;
  
  applyBtn.innerHTML = '✓ Realm Transformed!';
  applyBtn.classList.add('success');
  
  setTimeout(() => {
    applyBtn.innerHTML = originalText;
    applyBtn.classList.remove('success');
  }, 2000);
}

/**
 * Show reset message
 */
function showResetMessage(container) {
  const resetBtn = container.querySelector('#reset-defaults-btn');
  const originalText = resetBtn.innerHTML;
  
  resetBtn.innerHTML = '✓ Realm Restored!';
  resetBtn.classList.add('success');
  
  setTimeout(() => {
    resetBtn.innerHTML = originalText;
    resetBtn.classList.remove('success');
  }, 2000);
}
