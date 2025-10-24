/**
 * Mana Calculator
 * A magical orb interface for performing mathematical calculations
 */

import { createDisplay, updateDisplay } from './calculator-display.js';
import { createButtons, handleKeyboardInput } from './calculator-buttons.js';
import { reset } from './calculator-engine.js';
import { eventBus, Events } from '../../core/event-bus.js';

/**
 * Create Mana Calculator app
 * @param {Object} window - Window object
 * @returns {HTMLElement} App container
 */
export function createManaCalculatorApp(window) {
  const container = document.createElement('div');
  container.className = 'mana-calculator-container';
  
  // Create orb frame
  const orbFrame = document.createElement('div');
  orbFrame.className = 'calculator-orb';
  
  // Add mystical glow effects
  const glowOuter = document.createElement('div');
  glowOuter.className = 'orb-glow-outer';
  
  const glowInner = document.createElement('div');
  glowInner.className = 'orb-glow-inner';
  
  // Create calculator body
  const calcBody = document.createElement('div');
  calcBody.className = 'calculator-body';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'calculator-header';
  header.innerHTML = `
    <div class="calculator-title">✨ Mana Calculator</div>
    <div class="calculator-subtitle">Channel the arcane energies</div>
  `;
  
  // Create display
  const display = createDisplay();
  
  // Create buttons
  const buttons = createButtons(container);
  
  // Assemble calculator
  calcBody.appendChild(header);
  calcBody.appendChild(display);
  calcBody.appendChild(buttons);
  
  orbFrame.appendChild(glowOuter);
  orbFrame.appendChild(glowInner);
  orbFrame.appendChild(calcBody);
  
  container.appendChild(orbFrame);
  
  // Initialize display
  updateDisplay(container);
  
  // Setup keyboard handler
  const keyboardHandler = (event) => {
    handleKeyboardInput(event, container);
  };
  
  // Add keyboard listener when window is focused
  window.addEventListener('focus', () => {
    document.addEventListener('keydown', keyboardHandler);
  });
  
  // Remove keyboard listener when window loses focus
  window.addEventListener('blur', () => {
    document.removeEventListener('keydown', keyboardHandler);
  });
  
  // Cleanup on window close
  eventBus.on(Events.WINDOW_CLOSED, (data) => {
    if (data.windowId === window.id) {
      document.removeEventListener('keydown', keyboardHandler);
    }
  });
  
  // Reset calculator state when window opens
  reset();
  updateDisplay(container);
  
  console.log('[ManaCalculator] Calculator initialized');
  
  return container;
}
