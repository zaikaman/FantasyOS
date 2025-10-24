/**
 * Calculator Display
 * Display area for calculator numbers with glowing rune aesthetic
 */

import { getState } from './calculator-engine.js';

/**
 * Create calculator display element
 * @returns {HTMLElement} Display element
 */
export function createDisplay() {
  const displayEl = document.createElement('div');
  displayEl.className = 'calculator-display';
  
  displayEl.innerHTML = `
    <div class="display-glow"></div>
    <div class="display-value" id="calc-display">0</div>
    <div class="display-operation" id="calc-operation"></div>
  `;

  return displayEl;
}

/**
 * Update display with current value
 * @param {HTMLElement} container - Calculator container
 */
export function updateDisplay(container) {
  const displayEl = container.querySelector('#calc-display');
  const operationEl = container.querySelector('#calc-operation');
  
  if (!displayEl) return;

  const state = getState();
  
  // Update display value
  let displayValue = state.currentValue;
  
  // Format long numbers
  if (displayValue.length > 12 && !state.error) {
    const numValue = parseFloat(displayValue);
    displayValue = numValue.toExponential(6);
  }
  
  displayEl.textContent = displayValue;
  
  // Add error class if there's an error
  if (state.error) {
    displayEl.classList.add('error');
  } else {
    displayEl.classList.remove('error');
  }
  
  // Update operation indicator
  if (operationEl) {
    if (state.operation && state.previousValue !== null) {
      operationEl.textContent = `${state.previousValue} ${state.operation}`;
      operationEl.classList.add('active');
    } else {
      operationEl.textContent = '';
      operationEl.classList.remove('active');
    }
  }
}

/**
 * Trigger display glow animation
 * @param {HTMLElement} container - Calculator container
 */
export function triggerGlow(container) {
  const glowEl = container.querySelector('.display-glow');
  
  if (glowEl) {
    glowEl.classList.remove('pulse');
    // Force reflow
    void glowEl.offsetWidth;
    glowEl.classList.add('pulse');
    
    setTimeout(() => {
      glowEl.classList.remove('pulse');
    }, 1000);
  }
}
