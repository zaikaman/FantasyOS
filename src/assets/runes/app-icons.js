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

/**
 * Weather Oracle Rune
 * @param {string} color - Fill color (default: gold)
 * @param {number} size - Icon size in pixels
 * @returns {string} SVG markup
 */
export const weatherOracleRune = (color = '#FFD700', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="glow-weather" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
      </radialGradient>
      <radialGradient id="ball-shine" cx="40%" cy="40%" r="50%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.6" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.2" />
      </radialGradient>
    </defs>
    <!-- Outer glow -->
    <circle cx="50" cy="50" r="45" fill="url(#glow-weather)" opacity="0.6"/>
    <!-- Crystal ball -->
    <circle cx="50" cy="45" r="25" fill="url(#ball-shine)" stroke="${color}" stroke-width="2.5"/>
    <!-- Inner mystical symbols -->
    <circle cx="50" cy="45" r="12" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <!-- Weather symbols inside -->
    <path d="M 50 38 L 52 42 L 56 42 L 53 45 L 54 49 L 50 46 L 46 49 L 47 45 L 44 42 L 48 42 Z" fill="${color}" opacity="0.8"/>
    <!-- Crystal stand -->
    <path d="M 40 70 L 45 71 L 50 80 L 55 71 L 60 70 L 50 70 Z" fill="${color}"/>
    <ellipse cx="50" cy="70" rx="10" ry="3" fill="${color}"/>
    <!-- Mystical runes around ball -->
    <circle cx="30" cy="30" r="2" fill="${color}"/>
    <circle cx="70" cy="30" r="2" fill="${color}"/>
    <circle cx="75" cy="50" r="2" fill="${color}"/>
    <circle cx="25" cy="50" r="2" fill="${color}"/>
  </svg>
`;
