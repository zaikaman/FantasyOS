/**
 * Background Asset Loader
 * Import background images so Vite can properly bundle them
 */

import background1 from './background.png';
import background2 from './background2.png';
import background3 from './background3.png';
import background4 from './background4.png';

// Export backgrounds with their IDs and imported URLs
export const BACKGROUND_ASSETS = {
  background: background1,
  background2: background2,
  background3: background3,
  background4: background4
};

// Available backgrounds configuration
export const BACKGROUNDS = [
  { id: 'background', name: 'Enchanted Forest', path: background1 },
  { id: 'background2', name: 'Mystical Mountains', path: background2 },
  { id: 'background3', name: 'Arcane Depths', path: background3 },
  { id: 'background4', name: 'Celestial Heights', path: background4 }
];

/**
 * Get background URL by ID
 * @param {string} id - Background ID
 * @returns {string} Background image URL
 */
export function getBackgroundUrl(id) {
  return BACKGROUND_ASSETS[id] || BACKGROUND_ASSETS.background;
}
