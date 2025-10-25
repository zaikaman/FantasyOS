/**
 * Snippet Generator
 * Generates mystical ingredients with icons
 */

import { generateUUID } from '../../utils/uuid.js';

const INGREDIENT_ICONS = [
  '🌿', '🍄', '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', 
  '🍃', '🌾', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾',
  '🔮', '✨', '⚗️', '🧪', '💎', '🌟', '⭐', '💫',
  '🕯️', '🪔', '🔥', '💧', '❄️', '⚡', '🌙', '☀️'
];

/**
 * Generate an ingredient object
 * @param {string} text - The ingredient text
 * @returns {Object} Ingredient object with id, text, and icon
 */
export function generateIngredient(text) {
  return {
    id: generateUUID(),
    text: text,
    icon: INGREDIENT_ICONS[Math.floor(Math.random() * INGREDIENT_ICONS.length)],
    createdAt: Date.now()
  };
}

/**
 * Get a random ingredient icon
 * @returns {string} Random emoji icon
 */
export function getRandomIcon() {
  return INGREDIENT_ICONS[Math.floor(Math.random() * INGREDIENT_ICONS.length)];
}
