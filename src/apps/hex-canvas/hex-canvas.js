/**
 * Hex Canvas - Pixel Art & Drawing Editor
 * A mystical drawing canvas with professional tools for creating pixel art and illustrations
 * Features: Multiple tools, layers, color palettes, undo/redo, export, brushes
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { showAlert, showConfirm } from '../../utils/modal.js';
import { generateUUID } from '../../utils/uuid.js';
import { drawingTools } from './tools.js';
import { createPaletteManager, getColorHistory } from './palette-manager.js';
import { createLayerManager } from './layer-manager.js';
import { exportCanvas, importImage } from './export-manager.js';

// App state
let containerEl = null;
let canvas = null;
let ctx = null;
let offscreenCanvas = null; // For smooth rendering
let offscreenCtx = null;

// Drawing state
let currentTool = 'pencil';
let currentColor = '#000000';
let secondaryColor = '#ffffff';
let brushSize = 1;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Canvas settings
let canvasWidth = 64;
let canvasHeight = 64;
let pixelSize = 8; // Zoom level
let showGrid = true;
let showPixelGrid = true;

/**
 * Deep clone layers array with all properties
 */
function deepCloneLayers(layers) {
  return layers.map(layer => {
    const cloned = {
      name: layer.name,
      visible: layer.visible,
      opacity: layer.opacity,
      pixels: layer.pixels.map(row => row.slice()), // Clone each row
    };
    
    // Clone _hiddenPixels if it exists
    if (layer._hiddenPixels) {
      cloned._hiddenPixels = { ...layer._hiddenPixels };
    }
    
    return cloned;
  });
}

// History for undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Layers
let layers = [];
let currentLayerIndex = 0;

// Selection state
let selectionStart = null;
let selectionEnd = null;
let selectedArea = null;

// Animation state
let animationFrames = [];
let currentFrame = 0;
let isPlayingAnimation = false;

/**
 * Create Hex Canvas app
 * @returns {HTMLElement} App container
 */
export function createHexCanvasApp() {
  console.log('[HexCanvas] Summoning the mystical canvas...');
  
  containerEl = document.createElement('div');
  containerEl.className = 'hex-canvas-container';
  
  // Initialize default layer
  initializeLayers();
  
  render();
  setupEventListeners();
  
  // Save initial state to history
  saveToHistory();
  
  console.log('[HexCanvas] Canvas ready for creation!');
  return containerEl;
}

/**
 * Initialize layers
 */
function initializeLayers() {
  layers = [{
    id: generateUUID(),
    name: 'Background',
    visible: true,
    opacity: 1.0,
    pixels: createEmptyPixelData()
  }];
  currentLayerIndex = 0;
}

/**
 * Create empty pixel data
 */
function createEmptyPixelData() {
  const data = [];
  for (let y = 0; y < canvasHeight; y++) {
    data[y] = [];
    for (let x = 0; x < canvasWidth; x++) {
      data[y][x] = null; // null = transparent
    }
  }
  return data;
}

/**
 * Render the main app interface
 */
function render() {
  containerEl.innerHTML = `
    <div class="hex-canvas-layout">
      <!-- Top Toolbar -->
      <div class="hex-toolbar">
        <div class="toolbar-section">
          <button class="btn-tool" id="btn-new" title="New Canvas (Ctrl+N)">
            ✨ New
          </button>
          <button class="btn-tool" id="btn-import" title="Import Image">
            📂 Import
          </button>
          <button class="btn-tool" id="btn-export" title="Export (Ctrl+S)">
            💾 Export
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-section">
          <button class="btn-tool" id="btn-undo" title="Undo (Ctrl+Z)" disabled>
            ↶ Undo
          </button>
          <button class="btn-tool" id="btn-redo" title="Redo (Ctrl+Y)" disabled>
            ↷ Redo
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-section">
          <div class="canvas-size-display" title="Canvas Size">
            <span id="canvas-size-text">${canvasWidth}×${canvasHeight}px</span>
          </div>
          <button class="btn-tool" id="btn-resize" title="Resize Canvas">
            ⛶ Resize
          </button>
        </div>
        
        <div class="toolbar-divider"></div>
        
        <div class="toolbar-section">
          <button class="btn-tool toggle ${showGrid ? 'active' : ''}" id="btn-grid" title="Toggle Grid (G)">
            ⊞ Grid
          </button>
          <button class="btn-tool toggle ${showPixelGrid ? 'active' : ''}" id="btn-pixel-grid" title="Toggle Pixel Grid">
            ▦ Pixels
          </button>
        </div>
        
        <div class="toolbar-spacer"></div>
        
        <div class="zoom-controls">
          <button class="btn-zoom" id="btn-zoom-out" title="Zoom Out (-)">−</button>
          <span class="zoom-level" id="zoom-level">${pixelSize}x</span>
          <button class="btn-zoom" id="btn-zoom-in" title="Zoom In (+)">+</button>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div class="hex-content">
        <!-- Left Sidebar - Tools -->
        <div class="hex-sidebar left">
          <div class="sidebar-header">
            <h3>🎨 Tools</h3>
          </div>
          
          <div class="tools-grid" id="tools-grid">
            <button class="tool-btn active" data-tool="pencil" title="Pencil (P)">
              ✏️
              <span class="tool-name">Pencil</span>
            </button>
            <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
              🧹
              <span class="tool-name">Eraser</span>
            </button>
            <button class="tool-btn" data-tool="fill" title="Fill Bucket (F)">
              🪣
              <span class="tool-name">Fill</span>
            </button>
            <button class="tool-btn" data-tool="eyedropper" title="Color Picker (I)">
              💧
              <span class="tool-name">Picker</span>
            </button>
            <button class="tool-btn" data-tool="line" title="Line (L)">
              📏
              <span class="tool-name">Line</span>
            </button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">
              ▭
              <span class="tool-name">Rectangle</span>
            </button>
            <button class="tool-btn" data-tool="circle" title="Circle (C)">
              ◯
              <span class="tool-name">Circle</span>
            </button>
            <button class="tool-btn" data-tool="select" title="Select (S)">
              ⬚
              <span class="tool-name">Select</span>
            </button>
            <button class="tool-btn" data-tool="move" title="Move (M)">
              ✥
              <span class="tool-name">Move</span>
            </button>
            <button class="tool-btn" data-tool="spray" title="Spray Paint">
              💨
              <span class="tool-name">Spray</span>
            </button>
          </div>
          
          <div class="tool-options" id="tool-options">
            <h4>Brush Size</h4>
            <div class="brush-size-control">
              <input 
                type="range" 
                id="brush-size" 
                min="1" 
                max="20" 
                value="${brushSize}"
                class="slider"
              />
              <span class="brush-size-value" id="brush-size-value">${brushSize}px</span>
            </div>
            
            <div class="brush-preview" id="brush-preview">
              <div class="brush-preview-dot" style="width: ${brushSize * 4}px; height: ${brushSize * 4}px;"></div>
            </div>
          </div>
          
          <div class="color-section">
            <h4>Colors</h4>
            <div class="color-swatches">
              <div class="color-swatch-container primary">
                <label>Primary</label>
                <div class="color-swatch-wrapper">
                  <input 
                    type="color" 
                    id="primary-color" 
                    value="${currentColor}"
                    class="color-picker"
                  />
                  <div class="color-display" style="background: ${currentColor}"></div>
                  <input 
                    type="text" 
                    id="primary-color-hex" 
                    value="${currentColor}"
                    class="color-hex-input"
                    maxlength="7"
                  />
                </div>
              </div>
              <button class="btn-swap-colors" id="btn-swap-colors" title="Swap Colors (X)">
                ⇄
              </button>
              <div class="color-swatch-container secondary">
                <label>Secondary</label>
                <div class="color-swatch-wrapper">
                  <input 
                    type="color" 
                    id="secondary-color" 
                    value="${secondaryColor}"
                    class="color-picker"
                  />
                  <div class="color-display" style="background: ${secondaryColor}"></div>
                  <input 
                    type="text" 
                    id="secondary-color-hex" 
                    value="${secondaryColor}"
                    class="color-hex-input"
                    maxlength="7"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Center Canvas Area -->
        <div class="hex-canvas-area">
          <div class="canvas-wrapper" id="canvas-wrapper">
            <canvas 
              id="main-canvas" 
              width="${canvasWidth * pixelSize}" 
              height="${canvasHeight * pixelSize}"
              class="main-canvas"
            ></canvas>
            <canvas 
              id="overlay-canvas" 
              width="${canvasWidth * pixelSize}" 
              height="${canvasHeight * pixelSize}"
              class="overlay-canvas"
            ></canvas>
          </div>
          
          <div class="canvas-info">
            <span class="pixel-coords" id="pixel-coords">X: 0, Y: 0</span>
            <span class="pixel-color" id="pixel-color"></span>
          </div>
        </div>
        
        <!-- Right Sidebar - Palettes & Layers -->
        <div class="hex-sidebar right">
          <div class="sidebar-header">
            <h3>🎨 Palettes</h3>
          </div>
          
          <div id="palette-manager"></div>
          
          <div class="sidebar-header" style="margin-top: 1rem;">
            <h3>📚 Layers</h3>
            <button class="btn-icon" id="btn-add-layer" title="Add Layer">+</button>
          </div>
          
          <div id="layer-manager"></div>
        </div>
      </div>
    </div>
  `;
  
  // Get canvas elements
  canvas = containerEl.querySelector('#main-canvas');
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Disable image smoothing for pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;
  
  // Create offscreen canvas for better performance
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;
  offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  offscreenCtx.imageSmoothingEnabled = false;
  
  // Initialize palette and layer managers
  const paletteContainer = containerEl.querySelector('#palette-manager');
  createPaletteManager(paletteContainer, handlePaletteColorSelect);
  
  const layerContainer = containerEl.querySelector('#layer-manager');
  createLayerManager(layerContainer, layers, currentLayerIndex, handleLayerChange);
  
  // Draw initial state
  redrawCanvas();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tool buttons
  const toolButtons = containerEl.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      selectTool(tool);
    });
  });
  
  // Toolbar actions
  containerEl.querySelector('#btn-new').addEventListener('click', handleNew);
  containerEl.querySelector('#btn-import').addEventListener('click', handleImport);
  containerEl.querySelector('#btn-export').addEventListener('click', handleExport);
  containerEl.querySelector('#btn-undo').addEventListener('click', undo);
  containerEl.querySelector('#btn-redo').addEventListener('click', redo);
  containerEl.querySelector('#btn-resize').addEventListener('click', handleResize);
  containerEl.querySelector('#btn-grid').addEventListener('click', toggleGrid);
  containerEl.querySelector('#btn-pixel-grid').addEventListener('click', togglePixelGrid);
  
  // Zoom controls
  containerEl.querySelector('#btn-zoom-in').addEventListener('click', zoomIn);
  containerEl.querySelector('#btn-zoom-out').addEventListener('click', zoomOut);
  
  // Brush size
  const brushSizeSlider = containerEl.querySelector('#brush-size');
  brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    containerEl.querySelector('#brush-size-value').textContent = `${brushSize}px`;
    updateBrushPreview();
  });
  
  // Color pickers
  const primaryColorPicker = containerEl.querySelector('#primary-color');
  const primaryColorHex = containerEl.querySelector('#primary-color-hex');
  primaryColorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    primaryColorHex.value = currentColor;
    containerEl.querySelector('.color-swatch-container.primary .color-display').style.background = currentColor;
  });
  primaryColorHex.addEventListener('change', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      currentColor = color;
      primaryColorPicker.value = color;
      containerEl.querySelector('.color-swatch-container.primary .color-display').style.background = color;
    }
  });
  
  const secondaryColorPicker = containerEl.querySelector('#secondary-color');
  const secondaryColorHex = containerEl.querySelector('#secondary-color-hex');
  secondaryColorPicker.addEventListener('input', (e) => {
    secondaryColor = e.target.value;
    secondaryColorHex.value = secondaryColor;
    containerEl.querySelector('.color-swatch-container.secondary .color-display').style.background = secondaryColor;
  });
  secondaryColorHex.addEventListener('change', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      secondaryColor = color;
      secondaryColorPicker.value = color;
      containerEl.querySelector('.color-swatch-container.secondary .color-display').style.background = color;
    }
  });
  
  // Swap colors
  containerEl.querySelector('#btn-swap-colors').addEventListener('click', () => {
    [currentColor, secondaryColor] = [secondaryColor, currentColor];
    primaryColorPicker.value = currentColor;
    primaryColorHex.value = currentColor;
    secondaryColorPicker.value = secondaryColor;
    secondaryColorHex.value = secondaryColor;
    containerEl.querySelector('.color-swatch-container.primary .color-display').style.background = currentColor;
    containerEl.querySelector('.color-swatch-container.secondary .color-display').style.background = secondaryColor;
  });
  
  // Canvas mouse events
  const overlayCanvas = containerEl.querySelector('#overlay-canvas');
  overlayCanvas.addEventListener('mousedown', handleMouseDown);
  overlayCanvas.addEventListener('mousemove', handleMouseMove);
  overlayCanvas.addEventListener('mouseup', handleMouseUp);
  overlayCanvas.addEventListener('mouseleave', handleMouseLeave);
  overlayCanvas.addEventListener('contextmenu', handleRightClick);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
  
  // Layer management
  containerEl.querySelector('#btn-add-layer').addEventListener('click', addLayer);
}

/**
 * Handle mouse down on canvas
 */
function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  
  if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;
  
  isDrawing = true;
  lastX = x;
  lastY = y;
  
  const color = e.button === 2 ? secondaryColor : currentColor;
  
  drawingTools[currentTool].onStart(x, y, color, {
    layers,
    currentLayerIndex,
    brushSize,
    canvasWidth,
    canvasHeight,
    pixelSize,
    ctx: offscreenCtx
  });
  
  redrawCanvas();
}

/**
 * Handle mouse move on canvas
 */
function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  
  // Update coordinate display
  const coordsEl = containerEl.querySelector('#pixel-coords');
  const colorEl = containerEl.querySelector('#pixel-color');
  
  // Always show coordinates, even outside canvas (useful for move tool)
  coordsEl.textContent = `X: ${x}, Y: ${y}`;
  
  if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
    const pixel = getCurrentPixel(x, y);
    if (pixel) {
      colorEl.textContent = pixel;
      colorEl.style.background = pixel;
    } else {
      colorEl.textContent = 'Transparent';
      colorEl.style.background = 'transparent';
    }
  } else {
    colorEl.textContent = 'Outside canvas';
    colorEl.style.background = 'transparent';
  }
  
  if (!isDrawing) return;
  
  // Don't restrict move tool to canvas bounds - it needs to track outside movement
  if (currentTool !== 'move' && (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight)) return;
  
  const color = e.buttons === 2 ? secondaryColor : currentColor;
  
  drawingTools[currentTool].onMove(x, y, lastX, lastY, color, {
    layers,
    currentLayerIndex,
    brushSize,
    canvasWidth,
    canvasHeight,
    pixelSize,
    ctx: offscreenCtx
  });
  
  lastX = x;
  lastY = y;
  
  redrawCanvas();
}

/**
 * Handle mouse up on canvas
 */
function handleMouseUp(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);
  
  const color = e.button === 2 ? secondaryColor : currentColor;
  
  drawingTools[currentTool].onEnd(x, y, color, {
    layers,
    currentLayerIndex,
    brushSize,
    canvasWidth,
    canvasHeight,
    pixelSize,
    ctx: offscreenCtx
  });
  
  isDrawing = false;
  redrawCanvas();
  saveToHistory();
  updateHistoryButtons();
}

/**
 * Handle mouse leave canvas
 */
function handleMouseLeave(e) {
  if (isDrawing) {
    handleMouseUp(e);
  }
}

/**
 * Handle right click (secondary color)
 */
function handleRightClick(e) {
  e.preventDefault();
  return false;
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyDown(e) {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT') return;
  
  const key = e.key.toLowerCase();
  const ctrl = e.ctrlKey || e.metaKey;
  
  // Tool shortcuts
  const toolShortcuts = {
    'p': 'pencil',
    'e': 'eraser',
    'f': 'fill',
    'i': 'eyedropper',
    'l': 'line',
    'r': 'rectangle',
    'c': 'circle',
    's': 'select',
    'm': 'move'
  };
  
  if (toolShortcuts[key] && !ctrl) {
    e.preventDefault();
    selectTool(toolShortcuts[key]);
    return;
  }
  
  // Other shortcuts
  if (key === 'g' && !ctrl) {
    e.preventDefault();
    toggleGrid();
  } else if (key === 'x' && !ctrl) {
    e.preventDefault();
    containerEl.querySelector('#btn-swap-colors').click();
  } else if (key === '+' || key === '=') {
    e.preventDefault();
    zoomIn();
  } else if (key === '-') {
    e.preventDefault();
    zoomOut();
  } else if (ctrl && key === 'z') {
    e.preventDefault();
    undo();
  } else if (ctrl && key === 'y') {
    e.preventDefault();
    redo();
  } else if (ctrl && key === 'n') {
    e.preventDefault();
    handleNew();
  } else if (ctrl && key === 's') {
    e.preventDefault();
    handleExport();
  }
}

/**
 * Select a tool
 */
function selectTool(tool) {
  currentTool = tool;
  
  // Update UI
  containerEl.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tool === tool) {
      btn.classList.add('active');
    }
  });
  
  // Update cursor
  const overlayCanvas = containerEl.querySelector('#overlay-canvas');
  const cursorClass = `cursor-${tool}`;
  overlayCanvas.className = 'overlay-canvas ' + cursorClass;
}

/**
 * Redraw the entire canvas
 */
function redrawCanvas() {
  // Clear main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw checkerboard background
  drawCheckerboard(ctx, canvas.width, canvas.height);
  
  // Draw all visible layers
  layers.forEach(layer => {
    if (!layer.visible) return;
    if (!layer.pixels) return; // Safety check
    
    ctx.globalAlpha = layer.opacity;
    
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Safety check for pixel array
        if (!layer.pixels[y]) continue;
        
        const color = layer.pixels[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  });
  
  // Draw grid
  if (showGrid) {
    drawGrid();
  }
  
  if (showPixelGrid && pixelSize >= 4) {
    drawPixelGrid();
  }
}

/**
 * Draw checkerboard background
 */
function drawCheckerboard(context, width, height) {
  const tileSize = 10;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#e0e0e0';
  
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        context.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}

/**
 * Draw grid lines
 */
function drawGrid() {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  
  // Vertical lines every 8 pixels
  for (let x = 0; x <= canvasWidth; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x * pixelSize, 0);
    ctx.lineTo(x * pixelSize, canvas.height);
    ctx.stroke();
  }
  
  // Horizontal lines every 8 pixels
  for (let y = 0; y <= canvasHeight; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelSize);
    ctx.lineTo(canvas.width, y * pixelSize);
    ctx.stroke();
  }
}

/**
 * Draw pixel grid
 */
function drawPixelGrid() {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x <= canvasWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * pixelSize, 0);
    ctx.lineTo(x * pixelSize, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= canvasHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelSize);
    ctx.lineTo(canvas.width, y * pixelSize);
    ctx.stroke();
  }
}

/**
 * Get current pixel color at position
 */
function getCurrentPixel(x, y) {
  // Check layers from top to bottom
  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i].visible && layers[i].pixels[y] && layers[i].pixels[y][x]) {
      return layers[i].pixels[y][x];
    }
  }
  return null;
}

/**
 * Toggle grid
 */
function toggleGrid() {
  showGrid = !showGrid;
  containerEl.querySelector('#btn-grid').classList.toggle('active', showGrid);
  redrawCanvas();
}

/**
 * Toggle pixel grid
 */
function togglePixelGrid() {
  showPixelGrid = !showPixelGrid;
  containerEl.querySelector('#btn-pixel-grid').classList.toggle('active', showPixelGrid);
  redrawCanvas();
}

/**
 * Zoom in
 */
function zoomIn() {
  if (pixelSize < 32) {
    pixelSize = Math.min(32, pixelSize + 2);
    updateZoom();
  }
}

/**
 * Zoom out
 */
function zoomOut() {
  if (pixelSize > 2) {
    pixelSize = Math.max(2, pixelSize - 2);
    updateZoom();
  }
}

/**
 * Update zoom level
 */
function updateZoom() {
  canvas.width = canvasWidth * pixelSize;
  canvas.height = canvasHeight * pixelSize;
  
  const overlayCanvas = containerEl.querySelector('#overlay-canvas');
  overlayCanvas.width = canvasWidth * pixelSize;
  overlayCanvas.height = canvasHeight * pixelSize;
  
  containerEl.querySelector('#zoom-level').textContent = `${pixelSize}x`;
  redrawCanvas();
}

/**
 * Save current state to history
 */
function saveToHistory() {
  // Remove any future history if we're not at the end
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  
  // Deep clone layers
  const state = deepCloneLayers(layers);
  history.push(state);
  
  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex++;
  }
  
  updateHistoryButtons();
}

/**
 * Undo last action
 */
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    layers = deepCloneLayers(history[historyIndex]);
    redrawCanvas();
    updateHistoryButtons();
    updateLayerManager();
  }
}

/**
 * Redo last undone action
 */
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    layers = deepCloneLayers(history[historyIndex]);
    redrawCanvas();
    updateHistoryButtons();
    updateLayerManager();
  }
}

/**
 * Update history buttons state
 */
function updateHistoryButtons() {
  const undoBtn = containerEl.querySelector('#btn-undo');
  const redoBtn = containerEl.querySelector('#btn-redo');
  
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

/**
 * Handle new canvas
 */
async function handleNew() {
  const confirmed = await showConfirm(
    'Create New Canvas',
    'This will clear your current canvas. Are you sure?'
  );
  
  if (confirmed) {
    initializeLayers();
    history = [];
    historyIndex = -1;
    saveToHistory();
    updateHistoryButtons();
    redrawCanvas();
    updateLayerManager();
    
    await showAlert('Canvas Cleared', 'A new canvas has been created!');
  }
}

/**
 * Handle resize canvas
 */
async function handleResize() {
  const newWidth = prompt(`Enter new width (current: ${canvasWidth}px):`, canvasWidth);
  if (!newWidth) return;
  
  const newHeight = prompt(`Enter new height (current: ${canvasHeight}px):`, canvasHeight);
  if (!newHeight) return;
  
  const w = parseInt(newWidth);
  const h = parseInt(newHeight);
  
  if (w > 0 && w <= 512 && h > 0 && h <= 512) {
    canvasWidth = w;
    canvasHeight = h;
    
    // Resize all layers
    layers.forEach(layer => {
      const newPixels = createEmptyPixelData();
      // Copy old pixels
      for (let y = 0; y < Math.min(layer.pixels.length, h); y++) {
        for (let x = 0; x < Math.min(layer.pixels[y].length, w); x++) {
          newPixels[y][x] = layer.pixels[y][x];
        }
      }
      layer.pixels = newPixels;
    });
    
    // Update offscreen canvas
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    
    updateZoom();
    saveToHistory();
    containerEl.querySelector('#canvas-size-text').textContent = `${canvasWidth}×${canvasHeight}px`;
    
    await showAlert('Canvas Resized', `Canvas is now ${canvasWidth}×${canvasHeight}px`);
  } else {
    await showAlert('Invalid Size', 'Please enter valid dimensions (1-512px)');
  }
}

/**
 * Handle import image
 */
function handleImport() {
  importImage((imageData, width, height) => {
    const oldWidth = canvasWidth;
    const oldHeight = canvasHeight;
    
    canvasWidth = width;
    canvasHeight = height;
    
    // Resize existing layers to match new canvas size
    layers.forEach(layer => {
      const newPixels = createEmptyPixelData();
      // Copy old pixels that fit in new dimensions
      for (let y = 0; y < Math.min(oldHeight, height); y++) {
        for (let x = 0; x < Math.min(oldWidth, width); x++) {
          if (layer.pixels[y] && layer.pixels[y][x]) {
            newPixels[y][x] = layer.pixels[y][x];
          }
        }
      }
      layer.pixels = newPixels;
    });
    
    // Create new layer with imported image
    const newLayer = {
      id: generateUUID(),
      name: 'Imported Image',
      visible: true,
      opacity: 1.0,
      pixels: imageData
    };
    
    layers.push(newLayer);
    currentLayerIndex = layers.length - 1;
    
    // Update offscreen canvas
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    
    updateZoom();
    saveToHistory();
    updateLayerManager();
    containerEl.querySelector('#canvas-size-text').textContent = `${canvasWidth}×${canvasHeight}px`;
  });
}

/**
 * Handle export canvas
 */
function handleExport() {
  exportCanvas(canvas, canvasWidth, canvasHeight, layers);
}

/**
 * Handle palette color select
 */
function handlePaletteColorSelect(color) {
  currentColor = color;
  const primaryColorPicker = containerEl.querySelector('#primary-color');
  const primaryColorHex = containerEl.querySelector('#primary-color-hex');
  primaryColorPicker.value = color;
  primaryColorHex.value = color;
  containerEl.querySelector('.color-swatch-container.primary .color-display').style.background = color;
}

/**
 * Handle layer change
 */
function handleLayerChange(newLayers, newIndex) {
  layers = newLayers;
  currentLayerIndex = newIndex;
  redrawCanvas();
  saveToHistory();
}

/**
 * Add new layer
 */
function addLayer() {
  const newLayer = {
    id: generateUUID(),
    name: `Layer ${layers.length + 1}`,
    visible: true,
    opacity: 1.0,
    pixels: createEmptyPixelData()
  };
  
  layers.push(newLayer);
  currentLayerIndex = layers.length - 1;
  updateLayerManager();
  saveToHistory();
}

/**
 * Update layer manager UI
 */
function updateLayerManager() {
  const layerContainer = containerEl.querySelector('#layer-manager');
  layerContainer.innerHTML = '';
  createLayerManager(layerContainer, layers, currentLayerIndex, handleLayerChange);
}

/**
 * Update brush preview
 */
function updateBrushPreview() {
  const preview = containerEl.querySelector('.brush-preview-dot');
  if (preview) {
    const size = Math.min(brushSize * 4, 80);
    preview.style.width = `${size}px`;
    preview.style.height = `${size}px`;
  }
}
