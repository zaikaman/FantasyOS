/**
 * Audio Loader for Games
 * Dynamically constructs proper audio URLs for Vite
 */

/**
 * Gets the proper audio URL
 * @param {String} soundName - Name of the sound file (without .mp3)
 * @returns {String} Proper audio URL
 */
export function getAudioUrl(soundName) {
    // Use new URL with import.meta.url to get proper asset path
    return new URL(`../audio/${soundName}.mp3`, import.meta.url).href;
}
