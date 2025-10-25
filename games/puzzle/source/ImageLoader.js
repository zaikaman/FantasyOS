/**
 * Image Loader for Puzzle Game
 * Dynamically constructs proper image URLs for Vite
 */

/**
 * Gets the proper image URL for a puzzle
 * @param {String} imageName - Format like "animal1" or "city5"
 * @returns {String} Proper image URL
 */
export function getPuzzleImageUrl(imageName) {
    const parts = imageName.match(/([a-zA-Z]+)|([0-9]+)/g);
    const category = parts[0];
    const number = parts[1];
    
    // Use new URL with import.meta.url to get proper asset path
    return new URL(`../images/${category}/${number}.jpg`, import.meta.url).href;
}
