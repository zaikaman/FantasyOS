/**
 * Image Loader for Spider Game
 * Dynamically constructs proper image URLs for Vite
 */

/**
 * Gets the proper image URL for a card
 * @param {String} cardFile - Format like "AS" or "2B"
 * @returns {String} Proper image URL
 */
export function getCardImageUrl(cardFile) {
    // Use new URL with import.meta.url to get proper asset path
    return new URL(`../images/${cardFile}.svg`, import.meta.url).href;
}
