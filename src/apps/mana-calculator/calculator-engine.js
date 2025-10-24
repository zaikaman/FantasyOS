/**
 * Calculator Engine
 * Core arithmetic logic for the Mana Calculator
 */

/**
 * Calculator state
 */
const state = {
  currentValue: '0',
  previousValue: null,
  operation: null,
  shouldResetDisplay: false,
  error: null,
};

/**
 * Get current state
 */
export function getState() {
  return { ...state };
}

/**
 * Reset calculator to initial state
 */
export function reset() {
  state.currentValue = '0';
  state.previousValue = null;
  state.operation = null;
  state.shouldResetDisplay = false;
  state.error = null;
}

/**
 * Append digit to current value
 * @param {string} digit - Digit to append (0-9)
 */
export function inputDigit(digit) {
  if (state.error) {
    reset();
  }

  if (state.shouldResetDisplay) {
    state.currentValue = digit;
    state.shouldResetDisplay = false;
  } else {
    state.currentValue = state.currentValue === '0' ? digit : state.currentValue + digit;
  }
}

/**
 * Input decimal point
 */
export function inputDecimal() {
  if (state.error) {
    reset();
  }

  if (state.shouldResetDisplay) {
    state.currentValue = '0.';
    state.shouldResetDisplay = false;
    return;
  }

  if (!state.currentValue.includes('.')) {
    state.currentValue += '.';
  }
}

/**
 * Set operation
 * @param {string} nextOperation - Operation to perform (+, -, *, /)
 */
export function setOperation(nextOperation) {
  if (state.error) {
    reset();
  }

  const currentFloat = parseFloat(state.currentValue);

  if (state.previousValue === null) {
    state.previousValue = currentFloat;
  } else if (state.operation) {
    const result = performCalculation();
    
    if (state.error) {
      return;
    }

    state.previousValue = result;
    state.currentValue = String(result);
  }

  state.operation = nextOperation;
  state.shouldResetDisplay = true;
}

/**
 * Calculate result
 */
export function calculate() {
  if (state.error) {
    reset();
    return;
  }

  if (state.operation && state.previousValue !== null) {
    const result = performCalculation();
    
    if (state.error) {
      return;
    }

    state.currentValue = String(result);
    state.previousValue = null;
    state.operation = null;
    state.shouldResetDisplay = true;
  }
}

/**
 * Perform calculation based on current operation
 * @returns {number} Result of calculation
 */
function performCalculation() {
  const prev = parseFloat(state.previousValue);
  const current = parseFloat(state.currentValue);

  let result;

  switch (state.operation) {
    case '+':
      result = add(prev, current);
      break;
    case '-':
      result = subtract(prev, current);
      break;
    case '*':
      result = multiply(prev, current);
      break;
    case '/':
      result = divide(prev, current);
      break;
    default:
      return current;
  }

  return result;
}

/**
 * Addition operation
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum
 */
export function add(a, b) {
  return a + b;
}

/**
 * Subtraction operation
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Difference
 */
export function subtract(a, b) {
  return a - b;
}

/**
 * Multiplication operation
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Product
 */
export function multiply(a, b) {
  return a * b;
}

/**
 * Division operation
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Quotient
 */
export function divide(a, b) {
  if (b === 0) {
    state.error = 'The mana flows are unstable!';
    state.currentValue = state.error;
    return 0;
  }
  return a / b;
}

/**
 * Toggle sign (positive/negative)
 */
export function toggleSign() {
  if (state.error) {
    reset();
    return;
  }

  const currentFloat = parseFloat(state.currentValue);
  state.currentValue = String(currentFloat * -1);
}

/**
 * Calculate percentage
 */
export function percentage() {
  if (state.error) {
    reset();
    return;
  }

  const currentFloat = parseFloat(state.currentValue);
  state.currentValue = String(currentFloat / 100);
}

/**
 * Clear current entry
 */
export function clearEntry() {
  state.currentValue = '0';
  state.error = null;
}

/**
 * Backspace (delete last digit)
 */
export function backspace() {
  if (state.error) {
    reset();
    return;
  }

  if (state.currentValue.length > 1) {
    state.currentValue = state.currentValue.slice(0, -1);
  } else {
    state.currentValue = '0';
  }
}
