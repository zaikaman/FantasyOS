/**
 * Palette Manager for Hex Canvas
 * Manages color palettes and color history
 */

// Predefined color palettes
const predefinedPalettes = {
  'Mystic': [
    '#2D1B69', '#5B3A99', '#8B5FBF', '#B983FF', '#E5CCFF',
    '#1A1A2E', '#16213E', '#0F3460', '#533483', '#9D4EDD'
  ],
  'Forest': [
    '#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D',
    '#95D5B2', '#B7E4C7', '#D8F3DC', '#081C15', '#1C3820'
  ],
  'Fire': [
    '#7F1D1D', '#991B1B', '#DC2626', '#EF4444', '#F87171',
    '#FCA5A5', '#FEE2E2', '#FF6B35', '#F77F00', '#FCBF49'
  ],
  'Ocean': [
    '#023047', '#126782', '#219EBC', '#8ECAE6', '#B8E1F5',
    '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4'
  ],
  'Candy': [
    '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
    '#FF69B4', '#FFB6C1', '#FFD700', '#9370DB', '#87CEEB'
  ],
  'Retro': [
    '#000000', '#FFFFFF', '#E50000', '#E59500', '#A06A42',
    '#E5D900', '#94E044', '#02ABEA', '#0247FE', '#3F48CC'
  ],
  'Grayscale': [
    '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
    '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6'
  ],
  'Pastel': [
    '#FFD6E8', '#FFABAB', '#FFC3A0', '#FF677D', '#D4A5A5',
    '#B0E0E6', '#C8A2C8', '#FFDAB9', '#E6E6FA', '#F0E68C'
  ]
};

let colorHistory = [];
const MAX_HISTORY = 20;

/**
 * Create palette manager UI
 * @param {HTMLElement} container - Container element
 * @param {Function} onColorSelect - Callback when color is selected
 */
export function createPaletteManager(container, onColorSelect) {
  container.innerHTML = `
    <div class="palette-manager">
      <div class="palette-selector">
        <select id="palette-select" class="palette-dropdown">
          ${Object.keys(predefinedPalettes).map(name => 
            `<option value="${name}">${name}</option>`
          ).join('')}
        </select>
      </div>
      
      <div class="palette-colors" id="palette-colors">
        ${renderPalette('Mystic', onColorSelect)}
      </div>
      
      <div class="color-history-section">
        <h4>Recent Colors</h4>
        <div class="color-history" id="color-history">
          <div class="empty-state">No recent colors</div>
        </div>
      </div>
      
      <div class="quick-colors-section">
        <h4>Quick Colors</h4>
        <div class="quick-colors">
          <button class="quick-color" style="background: #000000" data-color="#000000" title="Black"></button>
          <button class="quick-color" style="background: #FFFFFF; border: 1px solid #ccc" data-color="#FFFFFF" title="White"></button>
          <button class="quick-color" style="background: #FF0000" data-color="#FF0000" title="Red"></button>
          <button class="quick-color" style="background: #00FF00" data-color="#00FF00" title="Green"></button>
          <button class="quick-color" style="background: #0000FF" data-color="#0000FF" title="Blue"></button>
          <button class="quick-color" style="background: #FFFF00" data-color="#FFFF00" title="Yellow"></button>
          <button class="quick-color" style="background: #FF00FF" data-color="#FF00FF" title="Magenta"></button>
          <button class="quick-color" style="background: #00FFFF" data-color="#00FFFF" title="Cyan"></button>
        </div>
      </div>
    </div>
  `;
  
  // Setup event listeners
  const paletteSelect = container.querySelector('#palette-select');
  paletteSelect.addEventListener('change', (e) => {
    const paletteColors = container.querySelector('#palette-colors');
    paletteColors.innerHTML = renderPalette(e.target.value, onColorSelect);
    setupPaletteListeners(container, onColorSelect);
  });
  
  setupPaletteListeners(container, onColorSelect);
  
  // Listen for color picked from eyedropper
  window.addEventListener('hex-canvas-color-picked', (e) => {
    addToColorHistory(e.detail.color);
    updateColorHistoryUI(container, onColorSelect);
  });
}

/**
 * Render palette colors
 */
function renderPalette(paletteName, onColorSelect) {
  const colors = predefinedPalettes[paletteName] || [];
  
  return colors.map(color => `
    <button 
      class="palette-color" 
      style="background: ${color}" 
      data-color="${color}"
      title="${color}"
    ></button>
  `).join('');
}

/**
 * Setup palette event listeners
 */
function setupPaletteListeners(container, onColorSelect) {
  // Palette colors
  container.querySelectorAll('.palette-color').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      onColorSelect(color);
      addToColorHistory(color);
      updateColorHistoryUI(container, onColorSelect);
    });
  });
  
  // Quick colors
  container.querySelectorAll('.quick-color').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      onColorSelect(color);
      addToColorHistory(color);
      updateColorHistoryUI(container, onColorSelect);
    });
  });
}

/**
 * Add color to history
 */
function addToColorHistory(color) {
  // Remove if already exists
  colorHistory = colorHistory.filter(c => c !== color);
  
  // Add to front
  colorHistory.unshift(color);
  
  // Limit size
  if (colorHistory.length > MAX_HISTORY) {
    colorHistory = colorHistory.slice(0, MAX_HISTORY);
  }
}

/**
 * Update color history UI
 */
function updateColorHistoryUI(container, onColorSelect) {
  const historyContainer = container.querySelector('#color-history');
  
  if (colorHistory.length === 0) {
    historyContainer.innerHTML = '<div class="empty-state">No recent colors</div>';
    return;
  }
  
  historyContainer.innerHTML = colorHistory.map(color => `
    <button 
      class="history-color" 
      style="background: ${color}" 
      data-color="${color}"
      title="${color}"
    ></button>
  `).join('');
  
  // Add event listeners
  historyContainer.querySelectorAll('.history-color').forEach(btn => {
    btn.addEventListener('click', () => {
      onColorSelect(btn.dataset.color);
    });
  });
}

/**
 * Get color history
 */
export function getColorHistory() {
  return [...colorHistory];
}

/**
 * Generate random palette
 */
export function generateRandomPalette(count = 10) {
  const palette = [];
  
  for (let i = 0; i < count; i++) {
    const hue = (360 / count) * i;
    const saturation = 60 + Math.random() * 30;
    const lightness = 40 + Math.random() * 30;
    
    palette.push(hslToHex(hue, saturation, lightness));
  }
  
  return palette;
}

/**
 * Convert HSL to Hex
 */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
