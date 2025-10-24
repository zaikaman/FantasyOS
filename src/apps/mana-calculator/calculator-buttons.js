/**
 * Calculator Buttons
 * Button grid for calculator input
 */

import {
  inputDigit,
  inputDecimal,
  setOperation,
  calculate,
  reset,
  clearEntry,
  backspace,
  toggleSign,
  percentage,
} from './calculator-engine.js';
import { updateDisplay, triggerGlow } from './calculator-display.js';

/**
 * Button configuration
 */
const buttons = [
  { label: 'C', action: 'clear', class: 'btn-function' },
  { label: 'CE', action: 'clearEntry', class: 'btn-function' },
  { label: '←', action: 'backspace', class: 'btn-function' },
  { label: '/', action: 'divide', class: 'btn-operator' },
  
  { label: '7', action: 'digit', value: '7', class: 'btn-number' },
  { label: '8', action: 'digit', value: '8', class: 'btn-number' },
  { label: '9', action: 'digit', value: '9', class: 'btn-number' },
  { label: '*', action: 'multiply', class: 'btn-operator' },
  
  { label: '4', action: 'digit', value: '4', class: 'btn-number' },
  { label: '5', action: 'digit', value: '5', class: 'btn-number' },
  { label: '6', action: 'digit', value: '6', class: 'btn-number' },
  { label: '-', action: 'subtract', class: 'btn-operator' },
  
  { label: '1', action: 'digit', value: '1', class: 'btn-number' },
  { label: '2', action: 'digit', value: '2', class: 'btn-number' },
  { label: '3', action: 'digit', value: '3', class: 'btn-number' },
  { label: '+', action: 'add', class: 'btn-operator' },
  
  { label: '±', action: 'toggleSign', class: 'btn-function' },
  { label: '0', action: 'digit', value: '0', class: 'btn-number' },
  { label: '.', action: 'decimal', class: 'btn-number' },
  { label: '⚡ Cast', action: 'equals', class: 'btn-equals' },
];

/**
 * Create calculator buttons grid
 * @param {HTMLElement} container - Calculator container
 * @returns {HTMLElement} Buttons element
 */
export function createButtons(container) {
  const buttonsEl = document.createElement('div');
  buttonsEl.className = 'calculator-buttons';
  
  buttons.forEach(btn => {
    const buttonEl = document.createElement('button');
    buttonEl.className = `calc-btn ${btn.class}`;
    buttonEl.textContent = btn.label;
    buttonEl.dataset.action = btn.action;
    
    if (btn.value) {
      buttonEl.dataset.value = btn.value;
    }
    
    buttonEl.addEventListener('click', () => {
      handleButtonClick(btn, container);
    });
    
    buttonsEl.appendChild(buttonEl);
  });
  
  return buttonsEl;
}

/**
 * Handle button click
 * @param {Object} btn - Button configuration
 * @param {HTMLElement} container - Calculator container
 */
function handleButtonClick(btn, container) {
  switch (btn.action) {
    case 'digit':
      inputDigit(btn.value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'add':
      setOperation('+');
      break;
    case 'subtract':
      setOperation('-');
      break;
    case 'multiply':
      setOperation('*');
      break;
    case 'divide':
      setOperation('/');
      break;
    case 'equals':
      calculate();
      triggerGlow(container);
      break;
    case 'clear':
      reset();
      break;
    case 'clearEntry':
      clearEntry();
      break;
    case 'backspace':
      backspace();
      break;
    case 'toggleSign':
      toggleSign();
      break;
    case 'percentage':
      percentage();
      break;
  }
  
  updateDisplay(container);
}

/**
 * Handle keyboard input
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement} container - Calculator container
 */
export function handleKeyboardInput(event, container) {
  const key = event.key;
  
  // Numbers
  if (key >= '0' && key <= '9') {
    inputDigit(key);
    updateDisplay(container);
    return;
  }
  
  // Decimal point
  if (key === '.' || key === ',') {
    inputDecimal();
    updateDisplay(container);
    return;
  }
  
  // Operators
  if (key === '+' || key === '-' || key === '*' || key === '/') {
    setOperation(key);
    updateDisplay(container);
    return;
  }
  
  // Equals
  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    calculate();
    triggerGlow(container);
    updateDisplay(container);
    return;
  }
  
  // Backspace
  if (key === 'Backspace') {
    event.preventDefault();
    backspace();
    updateDisplay(container);
    return;
  }
  
  // Clear
  if (key === 'Escape' || key.toLowerCase() === 'c') {
    reset();
    updateDisplay(container);
    return;
  }
  
  // Clear Entry
  if (key === 'Delete') {
    clearEntry();
    updateDisplay(container);
    return;
  }
}
