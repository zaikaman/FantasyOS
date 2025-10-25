/**
 * Layer Manager for Hex Canvas
 * Manages layers: visibility, opacity, reordering
 */

/**
 * Deep clone a layer with all its properties
 */
function deepCloneLayer(layer) {
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
}

/**
 * Create layer manager UI
 * @param {HTMLElement} container - Container element
 * @param {Array} layers - Layers array
 * @param {number} currentIndex - Current layer index
 * @param {Function} onChange - Callback when layers change
 */
export function createLayerManager(container, layers, currentIndex, onChange) {
  // Store onChange callback on container for future updates
  container._onChange = onChange;
  
  container.innerHTML = `
    <div class="layer-manager">
      <div class="layers-list" id="layers-list">
        ${renderLayers(layers, currentIndex)}
      </div>
      
      <div class="layer-actions">
        <button class="btn-layer-action" id="btn-duplicate-layer" title="Duplicate Layer">
          📋
        </button>
        <button class="btn-layer-action" id="btn-merge-down" title="Merge Down" ${currentIndex === 0 ? 'disabled' : ''}>
          ⬇️
        </button>
        <button class="btn-layer-action" id="btn-delete-layer" title="Delete Layer" ${layers.length === 1 ? 'disabled' : ''}>
          🗑️
        </button>
      </div>
    </div>
  `;
  
  setupLayerListeners(container, layers, currentIndex, onChange);
}

/**
 * Render layers list
 */
function renderLayers(layers, currentIndex) {
  return layers.map((layer, index) => `
    <div class="layer-item ${index === currentIndex ? 'active' : ''}" data-index="${index}">
      <div class="layer-visibility" data-action="toggle-visibility" data-index="${index}">
        ${layer.visible ? '👁️' : '🚫'}
      </div>
      
      <div class="layer-preview">
        <canvas class="layer-preview-canvas" data-layer-index="${index}"></canvas>
      </div>
      
      <div class="layer-info">
        <input 
          type="text" 
          class="layer-name-input" 
          value="${layer.name}"
          data-index="${index}"
          maxlength="20"
        />
        <div class="layer-opacity-control">
          <input 
            type="range" 
            class="layer-opacity-slider"
            min="0"
            max="100"
            value="${Math.round(layer.opacity * 100)}"
            data-index="${index}"
            title="Opacity: ${Math.round(layer.opacity * 100)}%"
          />
          <span class="layer-opacity-value">${Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>
      
      <div class="layer-controls">
        <button class="btn-layer-move" data-action="move-up" data-index="${index}" ${index === layers.length - 1 ? 'disabled' : ''}>
          ▲
        </button>
        <button class="btn-layer-move" data-action="move-down" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
          ▼
        </button>
      </div>
    </div>
  `).reverse().join(''); // Reverse to show top layer first
}

/**
 * Setup layer event listeners
 */
function setupLayerListeners(container, layers, currentIndex, onChange) {
  const layersList = container.querySelector('#layers-list');
  
  // Layer selection
  layersList.querySelectorAll('.layer-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]') || 
          e.target.classList.contains('layer-name-input') ||
          e.target.classList.contains('layer-opacity-slider')) {
        return; // Don't select if clicking on controls
      }
      
      const index = parseInt(item.dataset.index);
      onChange(layers, index);
      updateLayersUI(container, layers, index);
    });
  });
  
  // Visibility toggle
  layersList.querySelectorAll('[data-action="toggle-visibility"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      layers[index].visible = !layers[index].visible;
      
      // Update the icon immediately
      btn.textContent = layers[index].visible ? '👁️' : '🚫';
      
      // Trigger redraw via onChange
      onChange(layers, currentIndex);
    });
  });
  
  // Layer name change
  layersList.querySelectorAll('.layer-name-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(input.dataset.index);
      layers[index].name = e.target.value || `Layer ${index + 1}`;
      onChange(layers, currentIndex);
    });
    
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
  
  // Opacity change
  layersList.querySelectorAll('.layer-opacity-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const index = parseInt(slider.dataset.index);
      const opacity = parseInt(e.target.value) / 100;
      layers[index].opacity = opacity;
      
      const valueSpan = slider.parentElement.querySelector('.layer-opacity-value');
      valueSpan.textContent = `${Math.round(opacity * 100)}%`;
      slider.title = `Opacity: ${Math.round(opacity * 100)}%`;
      
      onChange(layers, currentIndex);
    });
    
    slider.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
  
  // Move up/down
  layersList.querySelectorAll('[data-action="move-up"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      if (index < layers.length - 1) {
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        const newIndex = index === currentIndex ? index + 1 : 
                        index + 1 === currentIndex ? index : currentIndex;
        onChange(layers, newIndex);
        updateLayersUI(container, layers, newIndex);
      }
    });
  });
  
  layersList.querySelectorAll('[data-action="move-down"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      if (index > 0) {
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        const newIndex = index === currentIndex ? index - 1 : 
                        index - 1 === currentIndex ? index : currentIndex;
        onChange(layers, newIndex);
        updateLayersUI(container, layers, newIndex);
      }
    });
  });
  
  // Layer actions
  const duplicateBtn = container.querySelector('#btn-duplicate-layer');
  duplicateBtn.addEventListener('click', () => {
    const newLayer = deepCloneLayer(layers[currentIndex]);
    newLayer.name = `${newLayer.name} Copy`;
    layers.splice(currentIndex + 1, 0, newLayer);
    onChange(layers, currentIndex + 1);
    updateLayersUI(container, layers, currentIndex + 1);
  });
  
  const mergeBtn = container.querySelector('#btn-merge-down');
  mergeBtn.addEventListener('click', () => {
    if (currentIndex > 0 && layers[currentIndex] && layers[currentIndex - 1]) {
      // Merge current layer with layer below
      const currentLayer = layers[currentIndex];
      const belowLayer = layers[currentIndex - 1];
      
      // Safety checks
      if (!currentLayer.pixels || !belowLayer.pixels) {
        console.error('Layer pixels are undefined');
        return;
      }
      
      // Combine pixels
      for (let y = 0; y < currentLayer.pixels.length; y++) {
        if (!currentLayer.pixels[y] || !belowLayer.pixels[y]) continue;
        
        for (let x = 0; x < currentLayer.pixels[y].length; x++) {
          if (currentLayer.pixels[y][x]) {
            belowLayer.pixels[y][x] = currentLayer.pixels[y][x];
          }
        }
      }
      
      // Remove current layer
      layers.splice(currentIndex, 1);
      onChange(layers, currentIndex - 1);
      updateLayersUI(container, layers, currentIndex - 1);
    }
  });
  
  const deleteBtn = container.querySelector('#btn-delete-layer');
  deleteBtn.addEventListener('click', () => {
    if (layers.length > 1) {
      layers.splice(currentIndex, 1);
      const newIndex = Math.min(currentIndex, layers.length - 1);
      onChange(layers, newIndex);
      updateLayersUI(container, layers, newIndex);
    }
  });
  
  // Render layer previews
  renderLayerPreviews(container, layers);
}

/**
 * Update layers UI
 */
function updateLayersUI(container, layers, currentIndex) {
  const layersList = container.querySelector('#layers-list');
  layersList.innerHTML = renderLayers(layers, currentIndex);
  setupLayerListeners(container, layers, currentIndex, 
    container._onChange || (() => {}));
}

/**
 * Render layer preview thumbnails
 */
function renderLayerPreviews(container, layers) {
  const canvases = container.querySelectorAll('.layer-preview-canvas');
  
  canvases.forEach(canvas => {
    const layerIndex = parseInt(canvas.dataset.layerIndex);
    const layer = layers[layerIndex];
    
    if (!layer) return;
    
    const size = 32; // Preview size
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Draw checkerboard background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#e0e0e0';
    
    const tileSize = 4;
    for (let y = 0; y < size; y += tileSize) {
      for (let x = 0; x < size; x += tileSize) {
        if ((x / tileSize + y / tileSize) % 2 === 0) {
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
    
    // Draw layer pixels
    const pixelWidth = layer.pixels[0]?.length || 0;
    const pixelHeight = layer.pixels.length;
    const scaleX = size / pixelWidth;
    const scaleY = size / pixelHeight;
    
    ctx.globalAlpha = layer.opacity;
    
    for (let y = 0; y < pixelHeight; y++) {
      for (let x = 0; x < pixelWidth; x++) {
        const color = layer.pixels[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x * scaleX),
            Math.floor(y * scaleY),
            Math.ceil(scaleX),
            Math.ceil(scaleY)
          );
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  });
}
