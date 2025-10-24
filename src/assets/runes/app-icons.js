/**
 * SVG Rune Icons
 * Inline SVG definitions for app launcher icons
 */

/**
 * Mana Calculator Rune
 * @param {string} color - Fill color (default: gold)
 * @param {number} size - Icon size in pixels
 * @returns {string} SVG markup
 */
export const calculatorRune = (color = '#FFD700', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="glow-calc" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#glow-calc)" opacity="0.6"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="3"/>
    <text x="50" y="65" text-anchor="middle" font-size="48" font-weight="bold" fill="${color}">Σ</text>
    <circle cx="50" cy="15" r="3" fill="${color}"/>
    <circle cx="85" cy="50" r="3" fill="${color}"/>
    <circle cx="50" cy="85" r="3" fill="${color}"/>
    <circle cx="15" cy="50" r="3" fill="${color}"/>
  </svg>
`;

/**
 * Treasure Chest Rune
 * @param {string} color - Fill color (default: gold)
 * @param {number} size - Icon size in pixels
 * @returns {string} SVG markup
 */
export const treasureChestRune = (color = '#FFD700', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="glow-chest" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#glow-chest)" opacity="0.6"/>
    <!-- Chest body -->
    <rect x="25" y="45" width="50" height="35" fill="none" stroke="${color}" stroke-width="3" rx="4"/>
    <!-- Chest lid -->
    <path d="M 25 45 Q 50 25, 75 45" fill="none" stroke="${color}" stroke-width="3"/>
    <!-- Lock -->
    <circle cx="50" cy="60" r="6" fill="${color}"/>
    <rect x="48" y="60" width="4" height="10" fill="${color}"/>
    <!-- Decorative gems -->
    <circle cx="35" cy="55" r="2" fill="${color}"/>
    <circle cx="65" cy="55" r="2" fill="${color}"/>
    <circle cx="50" cy="75" r="2" fill="${color}"/>
  </svg>
`;

/**
 * Quest Log Rune
 * @param {string} color - Fill color (default: gold)
 * @param {number} size - Icon size in pixels
 * @returns {string} SVG markup
 */
export const questLogRune = (color = '#FFD700', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="glow-quest" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#glow-quest)" opacity="0.6"/>
    <!-- Scroll -->
    <rect x="30" y="20" width="40" height="60" fill="none" stroke="${color}" stroke-width="3" rx="2"/>
    <!-- Scroll curls -->
    <circle cx="30" cy="20" r="4" fill="${color}"/>
    <circle cx="70" cy="20" r="4" fill="${color}"/>
    <circle cx="30" cy="80" r="4" fill="${color}"/>
    <circle cx="70" cy="80" r="4" fill="${color}"/>
    <!-- Text lines -->
    <line x1="38" y1="35" x2="62" y2="35" stroke="${color}" stroke-width="2"/>
    <line x1="38" y1="45" x2="62" y2="45" stroke="${color}" stroke-width="2"/>
    <line x1="38" y1="55" x2="55" y2="55" stroke="${color}" stroke-width="2"/>
    <!-- Quill -->
    <path d="M 65 60 L 72 75 L 68 73 L 65 60 Z" fill="${color}"/>
  </svg>
`;
