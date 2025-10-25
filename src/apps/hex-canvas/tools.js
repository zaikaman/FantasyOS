/**
 * Drawing Tools for Hex Canvas
 * Implements all drawing tool behaviors
 */

/**
 * Deep clone a pixel array (2D array of colors or null)
 */
function clonePixelArray(pixels) {
  return pixels.map(row => row.slice());
}

/**
 * Pencil Tool - Draw individual pixels
 */
const pencilTool = {
  onStart(x, y, color, state) {
    drawPixel(x, y, color, state);
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Draw line between last and current position for smooth drawing
    drawLine(lastX, lastY, x, y, color, state);
  },
  
  onEnd(x, y, color, state) {
    // Nothing special on end
  }
};

/**
 * Eraser Tool - Remove pixels
 */
const eraserTool = {
  onStart(x, y, color, state) {
    erasePixel(x, y, state);
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Erase line between positions
    const dx = Math.abs(x - lastX);
    const dy = Math.abs(y - lastY);
    const steps = Math.max(dx, dy);
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const px = Math.round(lastX + (x - lastX) * t);
      const py = Math.round(lastY + (y - lastY) * t);
      erasePixel(px, py, state);
    }
  },
  
  onEnd(x, y, color, state) {
    // Nothing special on end
  }
};

/**
 * Fill Bucket Tool - Flood fill
 */
const fillTool = {
  onStart(x, y, color, state) {
    floodFill(x, y, color, state);
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // No action on move
  },
  
  onEnd(x, y, color, state) {
    // Nothing special on end
  }
};

/**
 * Eyedropper Tool - Pick color from canvas
 */
const eyedropperTool = {
  onStart(x, y, color, state) {
    const pickedColor = getPixelColor(x, y, state);
    if (pickedColor) {
      // Emit color picked event
      window.dispatchEvent(new CustomEvent('hex-canvas-color-picked', { 
        detail: { color: pickedColor } 
      }));
    }
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // No action on move
  },
  
  onEnd(x, y, color, state) {
    // Nothing special on end
  }
};

/**
 * Line Tool - Draw straight lines
 */
let lineStart = null;
const lineTool = {
  onStart(x, y, color, state) {
    lineStart = { x, y };
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Preview is handled by overlay canvas
  },
  
  onEnd(x, y, color, state) {
    if (lineStart) {
      drawLine(lineStart.x, lineStart.y, x, y, color, state);
      lineStart = null;
    }
  }
};

/**
 * Rectangle Tool - Draw rectangles
 */
let rectStart = null;
const rectangleTool = {
  onStart(x, y, color, state) {
    rectStart = { x, y };
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Preview is handled by overlay canvas
  },
  
  onEnd(x, y, color, state) {
    if (rectStart) {
      drawRectangle(rectStart.x, rectStart.y, x, y, color, state, false);
      rectStart = null;
    }
  }
};

/**
 * Circle Tool - Draw circles
 */
let circleStart = null;
const circleTool = {
  onStart(x, y, color, state) {
    circleStart = { x, y };
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Preview is handled by overlay canvas
  },
  
  onEnd(x, y, color, state) {
    if (circleStart) {
      const radius = Math.round(Math.sqrt(
        Math.pow(x - circleStart.x, 2) + Math.pow(y - circleStart.y, 2)
      ));
      drawCircle(circleStart.x, circleStart.y, radius, color, state, false);
      circleStart = null;
    }
  }
};

/**
 * Select Tool - Select rectangular areas
 */
let selectStart = null;
const selectTool = {
  onStart(x, y, color, state) {
    selectStart = { x, y };
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    // Preview is handled by overlay canvas
  },
  
  onEnd(x, y, color, state) {
    if (selectStart) {
      // Create selection area
      window.dispatchEvent(new CustomEvent('hex-canvas-selection', {
        detail: {
          x1: Math.min(selectStart.x, x),
          y1: Math.min(selectStart.y, y),
          x2: Math.max(selectStart.x, x),
          y2: Math.max(selectStart.y, y)
        }
      }));
      selectStart = null;
    }
  }
};

/**
 * Move Tool - Move selected area or entire layer
 * Uses extended canvas concept to preserve pixels outside bounds
 */
let moveStart = null;
let moveOriginalPixels = null;
let moveOriginalHidden = null;

const moveTool = {
  onStart(x, y, color, state) {
    moveStart = { x, y };
    
    const { layers, currentLayerIndex } = state;
    if (layers[currentLayerIndex]) {
      const layer = layers[currentLayerIndex];
      
      // Deep copy the visible pixels
      moveOriginalPixels = clonePixelArray(layer.pixels);
      
      // Deep copy any hidden pixels (pixels that were moved outside before)
      moveOriginalHidden = layer._hiddenPixels ? {...layer._hiddenPixels} : {};
    }
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    if (moveStart && moveOriginalPixels) {
      const dx = x - moveStart.x;
      const dy = y - moveStart.y;
      
      applyMovePreview(dx, dy, moveOriginalPixels, moveOriginalHidden, state);
    }
  },
  
  onEnd(x, y, color, state) {
    if (moveStart && moveOriginalPixels) {
      const dx = x - moveStart.x;
      const dy = y - moveStart.y;
      
      if (dx !== 0 || dy !== 0) {
        applyMovePreview(dx, dy, moveOriginalPixels, moveOriginalHidden, state);
      }
      
      moveStart = null;
      moveOriginalPixels = null;
      moveOriginalHidden = null;
    }
  }
};

/**
 * Spray Paint Tool - Random spray pattern
 */
const sprayTool = {
  onStart(x, y, color, state) {
    sprayPaint(x, y, color, state);
  },
  
  onMove(x, y, lastX, lastY, color, state) {
    sprayPaint(x, y, color, state);
  },
  
  onEnd(x, y, color, state) {
    // Nothing special on end
  }
};

// Helper functions

/**
 * Draw a single pixel
 */
function drawPixel(x, y, color, state) {
  const { layers, currentLayerIndex, brushSize, canvasWidth, canvasHeight } = state;
  
  if (!layers[currentLayerIndex]) return;
  
  const halfSize = Math.floor(brushSize / 2);
  
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const px = x + dx;
      const py = y + dy;
      
      if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
        // Check if within circular brush
        if (dx * dx + dy * dy <= halfSize * halfSize + halfSize) {
          layers[currentLayerIndex].pixels[py][px] = color;
        }
      }
    }
  }
}

/**
 * Erase a pixel
 */
function erasePixel(x, y, state) {
  const { layers, currentLayerIndex, brushSize, canvasWidth, canvasHeight } = state;
  
  if (!layers[currentLayerIndex]) return;
  
  const halfSize = Math.floor(brushSize / 2);
  
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const px = x + dx;
      const py = y + dy;
      
      if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
        if (dx * dx + dy * dy <= halfSize * halfSize + halfSize) {
          layers[currentLayerIndex].pixels[py][px] = null;
        }
      }
    }
  }
}

/**
 * Draw a line using Bresenham's algorithm
 */
function drawLine(x0, y0, x1, y1, color, state) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  let x = x0;
  let y = y0;
  
  while (true) {
    drawPixel(x, y, color, state);
    
    if (x === x1 && y === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Draw a rectangle
 */
function drawRectangle(x0, y0, x1, y1, color, state, filled) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  
  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        drawPixel(x, y, color, state);
      }
    }
  } else {
    // Draw outline
    for (let x = minX; x <= maxX; x++) {
      drawPixel(x, minY, color, state);
      drawPixel(x, maxY, color, state);
    }
    for (let y = minY; y <= maxY; y++) {
      drawPixel(minX, y, color, state);
      drawPixel(maxX, y, color, state);
    }
  }
}

/**
 * Draw a circle using midpoint circle algorithm
 */
function drawCircle(cx, cy, radius, color, state, filled) {
  if (filled) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          drawPixel(cx + x, cy + y, color, state);
        }
      }
    }
  } else {
    let x = radius;
    let y = 0;
    let err = 0;
    
    while (x >= y) {
      drawPixel(cx + x, cy + y, color, state);
      drawPixel(cx + y, cy + x, color, state);
      drawPixel(cx - y, cy + x, color, state);
      drawPixel(cx - x, cy + y, color, state);
      drawPixel(cx - x, cy - y, color, state);
      drawPixel(cx - y, cy - x, color, state);
      drawPixel(cx + y, cy - x, color, state);
      drawPixel(cx + x, cy - y, color, state);
      
      y++;
      err += 1 + 2 * y;
      if (2 * (err - x) + 1 > 0) {
        x--;
        err += 1 - 2 * x;
      }
    }
  }
}

/**
 * Flood fill algorithm
 */
function floodFill(startX, startY, fillColor, state) {
  const { layers, currentLayerIndex, canvasWidth, canvasHeight } = state;
  
  if (!layers[currentLayerIndex]) return;
  
  const layer = layers[currentLayerIndex];
  const targetColor = layer.pixels[startY][startX];
  
  // Don't fill if same color
  if (targetColor === fillColor) return;
  
  const stack = [[startX, startY]];
  const visited = new Set();
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;
    
    const currentColor = layer.pixels[y][x];
    
    // Check if colors match (both null or both same value)
    const colorsMatch = (currentColor === targetColor) || 
                        (currentColor === null && targetColor === null);
    
    if (!colorsMatch) continue;
    
    visited.add(key);
    layer.pixels[y][x] = fillColor;
    
    // Add neighbors to stack
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
}

/**
 * Get pixel color at position
 */
function getPixelColor(x, y, state) {
  const { layers, canvasWidth, canvasHeight } = state;
  
  if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return null;
  
  // Check from top layer to bottom
  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i].visible && layers[i].pixels[y][x]) {
      return layers[i].pixels[y][x];
    }
  }
  
  return null;
}

/**
 * Apply move preview - preserves pixels outside canvas bounds
 */
function applyMovePreview(dx, dy, originalPixels, originalHidden, state) {
  const { layers, currentLayerIndex, canvasWidth, canvasHeight } = state;
  
  if (!layers[currentLayerIndex]) return;
  
  const layer = layers[currentLayerIndex];
  
  // Create fresh pixel array
  const newPixels = [];
  for (let y = 0; y < canvasHeight; y++) {
    newPixels[y] = new Array(canvasWidth).fill(null);
  }
  
  const newHiddenPixels = {};
  
  // Process visible original pixels
  for (let sourceY = 0; sourceY < canvasHeight; sourceY++) {
    for (let sourceX = 0; sourceX < canvasWidth; sourceX++) {
      const pixel = originalPixels[sourceY]?.[sourceX];
      if (!pixel) continue;
      
      const destX = sourceX + dx;
      const destY = sourceY + dy;
      
      if (destX >= 0 && destX < canvasWidth && destY >= 0 && destY < canvasHeight) {
        newPixels[destY][destX] = pixel;
      } else {
        newHiddenPixels[`${destX},${destY}`] = pixel;
      }
    }
  }
  
  // Process previously hidden pixels
  for (const [key, pixel] of Object.entries(originalHidden || {})) {
    const [oldX, oldY] = key.split(',').map(Number);
    const destX = oldX + dx;
    const destY = oldY + dy;
    
    if (destX >= 0 && destX < canvasWidth && destY >= 0 && destY < canvasHeight) {
      newPixels[destY][destX] = pixel;
    } else {
      newHiddenPixels[`${destX},${destY}`] = pixel;
    }
  }
  
  layer.pixels = newPixels;
  layer._hiddenPixels = newHiddenPixels;
}

/**
 * Move layer by offset using original pixels (legacy)
 */
function moveLayerWithOffset(dx, dy, originalPixels, state) {
  applyMovePreview(dx, dy, originalPixels, {}, state);
}

/**
 * Move layer by offset (legacy function - kept for compatibility)
 */
function moveLayer(dx, dy, state) {
  const { layers, currentLayerIndex, canvasWidth, canvasHeight } = state;
  
  if (!layers[currentLayerIndex]) return;
  
  const layer = layers[currentLayerIndex];
  const originalPixels = clonePixelArray(layer.pixels);
  
  moveLayerWithOffset(dx, dy, originalPixels, state);
}

/**
 * Spray paint effect
 */
function sprayPaint(x, y, color, state) {
  const { brushSize } = state;
  const density = brushSize * 3;
  const radius = brushSize * 2;
  
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const dx = Math.round(Math.cos(angle) * distance);
    const dy = Math.round(Math.sin(angle) * distance);
    
    drawPixel(x + dx, y + dy, color, { ...state, brushSize: 1 });
  }
}

/**
 * Export all tools
 */
export const drawingTools = {
  pencil: pencilTool,
  eraser: eraserTool,
  fill: fillTool,
  eyedropper: eyedropperTool,
  line: lineTool,
  rectangle: rectangleTool,
  circle: circleTool,
  select: selectTool,
  move: moveTool,
  spray: sprayTool
};
