/**
 * Export Manager for Hex Canvas
 * Handles exporting and importing images
 */

import { showAlert } from '../../utils/modal.js';

/**
 * Export canvas as image
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @param {Array} layers - Layers data
 */
export function exportCanvas(canvas, width, height, layers) {
  // Create modal for export options
  const modal = document.createElement('div');
  modal.className = 'hex-export-modal';
  modal.innerHTML = `
    <div class="hex-export-content">
      <div class="hex-export-header">
        <h2>📦 Export Artwork</h2>
        <button class="btn-close-modal" id="btn-close-export">✕</button>
      </div>
      
      <div class="hex-export-body">
        <div class="export-options">
          <div class="export-option">
            <label>Format:</label>
            <select id="export-format" class="export-select">
              <option value="png">PNG (Recommended)</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG (Vector)</option>
            </select>
          </div>
          
          <div class="export-option">
            <label>Scale:</label>
            <select id="export-scale" class="export-select">
              <option value="1">1x (${width}×${height}px)</option>
              <option value="2" selected>2x (${width * 2}×${height * 2}px)</option>
              <option value="4">4x (${width * 4}×${height * 4}px)</option>
              <option value="8">8x (${width * 8}×${height * 8}px)</option>
              <option value="16">16x (${width * 16}×${height * 16}px)</option>
            </select>
          </div>
          
          <div class="export-option">
            <label>Background:</label>
            <select id="export-background" class="export-select">
              <option value="transparent">Transparent</option>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="custom">Custom Color</option>
            </select>
            <input 
              type="color" 
              id="export-bg-color" 
              value="#ffffff" 
              class="export-color-input"
              style="display: none;"
            />
          </div>
          
          <div class="export-option">
            <label>Filename:</label>
            <input 
              type="text" 
              id="export-filename" 
              value="hex-canvas-${Date.now()}"
              class="export-input"
            />
          </div>
        </div>
        
        <div class="export-preview">
          <h3>Preview</h3>
          <div class="preview-container" id="preview-container">
            <canvas id="export-preview-canvas"></canvas>
          </div>
        </div>
      </div>
      
      <div class="hex-export-footer">
        <button class="btn-secondary" id="btn-cancel-export">Cancel</button>
        <button class="btn-primary" id="btn-confirm-export">💾 Export</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Setup preview
  const previewCanvas = modal.querySelector('#export-preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  
  function updatePreview() {
    const scale = parseInt(modal.querySelector('#export-scale').value);
    const format = modal.querySelector('#export-format').value;
    const background = modal.querySelector('#export-background').value;
    const bgColor = modal.querySelector('#export-bg-color').value;
    
    previewCanvas.width = width * scale;
    previewCanvas.height = height * scale;
    previewCtx.imageSmoothingEnabled = false;
    
    // Draw background
    if (background !== 'transparent') {
      previewCtx.fillStyle = background === 'custom' ? bgColor : background;
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    
    // Draw layers
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      previewCtx.globalAlpha = layer.opacity;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = layer.pixels[y][x];
          if (color) {
            previewCtx.fillStyle = color;
            previewCtx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
      
      previewCtx.globalAlpha = 1.0;
    });
    
    // Adjust preview size
    const maxSize = 300;
    const previewScale = Math.min(maxSize / previewCanvas.width, maxSize / previewCanvas.height, 1);
    previewCanvas.style.width = `${previewCanvas.width * previewScale}px`;
    previewCanvas.style.height = `${previewCanvas.height * previewScale}px`;
  }
  
  updatePreview();
  
  // Event listeners
  modal.querySelector('#export-format').addEventListener('change', updatePreview);
  modal.querySelector('#export-scale').addEventListener('change', updatePreview);
  modal.querySelector('#export-background').addEventListener('change', (e) => {
    const bgColorInput = modal.querySelector('#export-bg-color');
    bgColorInput.style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
    updatePreview();
  });
  modal.querySelector('#export-bg-color').addEventListener('input', updatePreview);
  
  modal.querySelector('#btn-close-export').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#btn-cancel-export').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#btn-confirm-export').addEventListener('click', () => {
    const format = modal.querySelector('#export-format').value;
    const filename = modal.querySelector('#export-filename').value || 'hex-canvas';
    
    if (format === 'svg') {
      exportAsSVG(width, height, layers, filename);
    } else {
      const dataURL = previewCanvas.toDataURL(`image/${format}`);
      downloadImage(dataURL, `${filename}.${format}`);
    }
    
    document.body.removeChild(modal);
    showAlert('Export Complete', `Your artwork has been exported as ${filename}.${format}`);
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Export as SVG
 */
function exportAsSVG(width, height, layers, filename) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  layers.forEach(layer => {
    if (!layer.visible) return;
    
    svg += `<g opacity="${layer.opacity}">`;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = layer.pixels[y][x];
        if (color) {
          svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
        }
      }
    }
    
    svg += `</g>`;
  });
  
  svg += `</svg>`;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  downloadImage(url, `${filename}.svg`);
  URL.revokeObjectURL(url);
}

/**
 * Download image
 */
function downloadImage(dataURL, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import image from file
 * @param {Function} onLoad - Callback when image is loaded
 */
export function importImage(onLoad) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas to read pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Limit size
        const maxSize = 256;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Read pixel data
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = [];
        
        for (let y = 0; y < height; y++) {
          pixels[y] = [];
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            if (a < 128) {
              pixels[y][x] = null; // Transparent
            } else {
              pixels[y][x] = rgbToHex(r, g, b);
            }
          }
        }
        
        onLoad(pixels, width, height);
        showAlert('Import Complete', `Image imported as ${width}×${height}px canvas`);
      };
      
      img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
  });
  
  input.click();
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
