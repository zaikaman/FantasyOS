/**
 * Bardic Lute Player
 * A mystical music player that searches and plays music from across the web
 */

import { searchMusic, getEmbedUrl } from './music-service.js';
import { eventBus, Events } from '../../core/event-bus.js';

let currentResults = [];
let isSearching = false;
let currentPlayer = null;

/**
 * Create Bardic Lute Player app
 * @param {HTMLElement} windowEl - Window DOM element
 * @returns {HTMLElement} App container
 */
export function createBardicLutePlayerApp(windowEl) {
  const container = document.createElement('div');
  container.className = 'bardic-lute-container';
  
  // Create header
  const header = createHeader();
  
  // Create search panel
  const searchPanel = createSearchPanel(container);
  
  // Create player section
  const playerSection = createPlayerSection();
  
  // Create results list
  const resultsList = createResultsList(container);
  
  // Assemble app
  container.appendChild(header);
  container.appendChild(searchPanel);
  container.appendChild(playerSection);
  container.appendChild(resultsList);
  
  console.log('[BardicLute] Lute player initialized');
  
  return container;
}

/**
 * Create header section
 * @returns {HTMLElement} Header element
 */
function createHeader() {
  const header = document.createElement('div');
  header.className = 'lute-header';
  header.innerHTML = `
    <div class="lute-title">🎵 Bardic Lute Player</div>
    <div class="lute-subtitle">Summon melodies from across the realms</div>
  `;
  return header;
}

/**
 * Create search panel
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} Search panel element
 */
function createSearchPanel(container) {
  const panel = document.createElement('div');
  panel.className = 'lute-search-panel';
  panel.innerHTML = `
    <div class="search-wrapper">
      <input 
        type="text" 
        id="music-search" 
        class="music-search-input" 
        placeholder="Enter song name, artist, or genre..."
      />
      <button id="music-search-btn" class="music-search-btn">
        <span class="btn-icon">🔍</span>
        <span class="btn-text">Search</span>
      </button>
    </div>
    <div class="search-examples">
      <span class="example-label">Try:</span>
      <button class="example-btn" data-query="medieval tavern music">Medieval Tavern</button>
      <button class="example-btn" data-query="fantasy epic soundtrack">Epic Soundtrack</button>
      <button class="example-btn" data-query="celtic folk music">Celtic Folk</button>
    </div>
    <div class="search-status hidden" id="search-status">
      <div class="status-content">
        <div class="status-spinner"></div>
        <span class="status-text">Searching...</span>
      </div>
    </div>
  `;
  
  // Add event listeners
  const input = panel.querySelector('#music-search');
  const searchBtn = panel.querySelector('#music-search-btn');
  const exampleBtns = panel.querySelectorAll('.example-btn');
  
  searchBtn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query) {
      performSearch(container, query);
    }
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        performSearch(container, query);
      }
    }
  });
  
  // Example button handlers
  exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      input.value = query;
      performSearch(container, query);
    });
  });
  
  return panel;
}

/**
 * Create player section
 * @returns {HTMLElement} Player section element
 */
function createPlayerSection() {
  const section = document.createElement('div');
  section.className = 'lute-player-section';
  section.id = 'lute-player';
  section.innerHTML = `
    <div class="player-placeholder">
      <div class="lute-icon">🎻</div>
      <p>Search for a song to begin your musical journey</p>
    </div>
  `;
  return section;
}

/**
 * Create results list
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} Results list element
 */
function createResultsList(container) {
  const list = document.createElement('div');
  list.className = 'lute-results-list';
  list.id = 'music-results';
  list.innerHTML = `
    <div style="padding: 2rem; text-align: center; color: #FFD700;">
      <p>Results will appear here after searching...</p>
    </div>
  `;
  console.log('[BardicLute] Results list created');
  return list;
}

/**
 * Perform music search
 * @param {HTMLElement} container - App container
 * @param {string} query - Search query
 */
async function performSearch(container, query) {
  if (isSearching) return;
  
  isSearching = true;
  const resultsList = container.querySelector('#music-results');
  const searchStatus = container.querySelector('#search-status');
  const searchBtn = container.querySelector('#music-search-btn');
  const searchInput = container.querySelector('#music-search');
  const playerSection = container.querySelector('#lute-player');
  
  // Hide the player section immediately when search starts
  if (playerSection) {
    playerSection.style.display = 'none';
  }
  
  // Show loading state in button
  if (searchBtn) {
    searchBtn.classList.add('loading');
    searchBtn.disabled = true;
    const btnText = searchBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Searching...';
  }
  
  // Disable input during search
  if (searchInput) {
    searchInput.disabled = true;
  }
  
  // Show status bar with loading animation
  if (searchStatus) {
    searchStatus.classList.remove('hidden');
    const statusText = searchStatus.querySelector('.status-text');
    
    // Animate status messages
    const messages = [
      'Consulting the mystical archives...',
      'Seeking melodies across realms...',
      'Summoning musical spirits...',
      'Channeling harmonic energies...'
    ];
    let messageIndex = 0;
    
    const messageInterval = setInterval(() => {
      if (statusText) {
        statusText.textContent = messages[messageIndex];
        messageIndex = (messageIndex + 1) % messages.length;
      }
    }, 2000);
    
    // Store interval ID to clear later
    searchStatus._messageInterval = messageInterval;
  }
  
  // Clear previous results and show skeleton
  resultsList.innerHTML = `
    <div class="results-skeleton">
      ${Array(6).fill(0).map(() => `
        <div class="skeleton-card">
          <div class="skeleton-line skeleton-platform"></div>
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-desc"></div>
          <div class="skeleton-line skeleton-desc"></div>
          <div class="skeleton-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  try {
    // Search for music with AI optimization
    currentResults = await searchMusic(query);
    
    console.log('[BardicLute] Search completed, found', currentResults.length, 'results');
    console.log('[BardicLute] Results:', currentResults);
    
    // Hide status bar
    if (searchStatus) {
      if (searchStatus._messageInterval) {
        clearInterval(searchStatus._messageInterval);
      }
      searchStatus.classList.add('hidden');
    }
    
    // Display results
    if (currentResults.length === 0) {
      resultsList.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🎵</div>
          <h3>No melodies found</h3>
          <p>Try a different search or use one of the example queries above</p>
        </div>
      `;
    } else {
      console.log('[BardicLute] Rendering', currentResults.length, 'results...');
      renderResults(container, currentResults);
      console.log('[BardicLute] Results rendered successfully');
      
      // Show success message briefly
      if (searchStatus) {
        const statusText = searchStatus.querySelector('.status-text');
        if (statusText) {
          statusText.textContent = `Found ${currentResults.length} melodies! ✨`;
        }
        searchStatus.classList.remove('hidden');
        searchStatus.classList.add('success');
        
        setTimeout(() => {
          searchStatus.classList.add('hidden');
          searchStatus.classList.remove('success');
        }, 2000);
      }
    }
    
  } catch (error) {
    console.error('[BardicLute] Search failed:', error);
    
    // Hide status bar
    if (searchStatus) {
      if (searchStatus._messageInterval) {
        clearInterval(searchStatus._messageInterval);
      }
      searchStatus.classList.add('hidden');
    }
    
    resultsList.innerHTML = `
      <div class="search-error">
        <div class="error-icon">⚠️</div>
        <h3>The mystical search has failed</h3>
        <p>${error.message || 'An unknown error occurred'}</p>
        <button class="retry-btn" onclick="this.closest('.bardic-lute-container').querySelector('#music-search-btn').click()">
          Try Again
        </button>
      </div>
    `;
  } finally {
    isSearching = false;
    
    // Restore button state
    if (searchBtn) {
      searchBtn.classList.remove('loading');
      searchBtn.disabled = false;
      const btnText = searchBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Search';
    }
    
    // Re-enable input
    if (searchInput) {
      searchInput.disabled = false;
      searchInput.focus();
    }
    
    // Clear any remaining intervals
    if (searchStatus && searchStatus._messageInterval) {
      clearInterval(searchStatus._messageInterval);
    }
  }
}

/**
 * Render search results
 * @param {HTMLElement} container - App container
 * @param {Array} results - Music results
 */
function renderResults(container, results) {
  console.log('[BardicLute] renderResults called with', results.length, 'results');
  const resultsList = container.querySelector('#music-results');
  console.log('[BardicLute] Results list element:', resultsList);
  
  if (!resultsList) {
    console.error('[BardicLute] Results list element not found!');
    return;
  }
  
  const html = `
    <div class="results-header">
      <h3>Found ${results.length} melodies</h3>
    </div>
    <div class="results-grid">
      ${results.map((result, index) => `
        <div class="result-card" data-index="${index}">
          <div class="result-platform">${getPlatformIcon(result.platform)} ${result.platform}</div>
          <div class="result-title">${escapeHtml(result.title)}</div>
          <div class="result-description">${escapeHtml(truncate(result.description, 120))}</div>
          <div class="result-actions">
            <button class="play-btn" data-index="${index}">▶ Play</button>
            <a href="${result.url}" target="_blank" class="open-link-btn">🔗 Open</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  console.log('[BardicLute] Generated HTML length:', html.length);
  resultsList.innerHTML = html;
  console.log('[BardicLute] HTML inserted into resultsList');
  
  // Add play button handlers
  const playBtns = resultsList.querySelectorAll('.play-btn');
  console.log('[BardicLute] Found', playBtns.length, 'play buttons');
  
  playBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      console.log('[BardicLute] Play button clicked for index:', index);
      playMusic(container, results[index]);
    });
  });
  
  console.log('[BardicLute] Render complete!');
}

/**
 * Play music in the player section
 * @param {HTMLElement} container - App container
 * @param {Object} musicItem - Music item to play
 */
function playMusic(container, musicItem) {
  const playerSection = container.querySelector('#lute-player');
  const videoId = extractYouTubeId(musicItem.url);
  
  if (!videoId) {
    console.error('[BardicLute] Invalid YouTube URL');
    return;
  }
  
  // Show the player section again when playing music
  if (playerSection) {
    playerSection.style.display = 'flex';
  }
  
  // Hide the header, search panel, and results when playing
  const header = container.querySelector('.lute-header');
  const searchPanel = container.querySelector('.lute-search-panel');
  const resultsSection = container.querySelector('#music-results');
  if (header) {
    header.style.display = 'none';
  }
  if (searchPanel) {
    searchPanel.style.display = 'none';
  }
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  
  playerSection.innerHTML = `
    <div class="vinyl-player">
      <div class="player-header">
        <button class="back-to-results-btn" id="back-to-results">
          ← Back to Results
        </button>
        <div class="player-info">
          <div class="now-playing-label">Now Playing</div>
          <div class="song-title">${escapeHtml(musicItem.title)}</div>
        </div>
      </div>
      
      <div class="player-visual">
        <div class="album-art-container">
          <img src="${thumbnailUrl}" alt="Album Art" class="album-art" id="album-art" crossorigin="anonymous">
        </div>
        
        <div class="vinyl-container">
          <div class="vinyl-disk spinning" id="vinyl-disk">
            <div class="vinyl-center"></div>
            <div class="vinyl-shine"></div>
          </div>
        </div>
      </div>
      
      <div class="player-controls-section">
        <div class="progress-container">
          <div class="progress-bar" id="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="time-display">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
        </div>
        
        <div class="player-controls">
          <button class="control-btn small" id="rewind-btn" title="Rewind 10s">
            <span class="control-icon">◄◄</span>
          </button>
          
          <button class="control-btn" id="play-pause-btn">
            <span class="control-icon">⏸</span>
          </button>
          
          <button class="control-btn small" id="forward-btn" title="Forward 10s">
            <span class="control-icon">►►</span>
          </button>
          
          <a href="${musicItem.url}" target="_blank" class="control-link">
            Open in YouTube
          </a>
        </div>
      </div>
      
      <!-- Hidden YouTube iframe for audio only -->
      <iframe
        id="youtube-player"
        style="display: none;"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&origin=${window.location.origin}"
        allow="autoplay; encrypted-media"
      ></iframe>
    </div>
  `;
  
  // Extract colors from thumbnail and apply to vinyl
  setTimeout(() => {
    extractColorsFromImage(thumbnailUrl, (colors) => {
      applyVinylColors(colors);
    });
  }, 100);
  
  // Initialize YouTube IFrame API
  const iframe = playerSection.querySelector('#youtube-player');
  let player = null;
  let isPlayerReady = false;
  let progressUpdateInterval = null;
  
  // Load YouTube IFrame API if not already loaded
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
  
  // Wait for API to be ready and initialize player
  const initPlayer = () => {
    if (window.YT && window.YT.Player) {
      player = new YT.Player('youtube-player', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    } else {
      setTimeout(initPlayer, 100);
    }
  };
  
  // Set up API ready callback
  if (!window.onYouTubeIframeAPIReady) {
    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  } else {
    initPlayer();
  }
  
  function onPlayerReady(event) {
    isPlayerReady = true;
    console.log('[BardicLute] YouTube player ready');
    
    // Start progress updates
    startProgressUpdates();
  }
  
  function onPlayerStateChange(event) {
    const vinylDisk = playerSection.querySelector('#vinyl-disk');
    const playPauseBtn = playerSection.querySelector('#play-pause-btn');
    const icon = playPauseBtn?.querySelector('.control-icon');
    
    // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2
    if (event.data === 1) { // Playing
      if (vinylDisk) vinylDisk.classList.add('spinning');
      if (icon) icon.textContent = '⏸';
    } else { // Paused or other state
      if (vinylDisk) vinylDisk.classList.remove('spinning');
      if (icon) icon.textContent = '▶';
    }
  }
  
  function startProgressUpdates() {
    if (progressUpdateInterval) {
      clearInterval(progressUpdateInterval);
    }
    
    const progressFill = playerSection.querySelector('#progress-fill');
    const currentTimeEl = playerSection.querySelector('#current-time');
    const durationEl = playerSection.querySelector('#duration');
    
    progressUpdateInterval = setInterval(() => {
      if (player && isPlayerReady && player.getDuration) {
        try {
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();
          
          if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            if (progressFill) {
              progressFill.style.width = `${percent}%`;
            }
            if (currentTimeEl) {
              currentTimeEl.textContent = formatTime(currentTime);
            }
            if (durationEl) {
              durationEl.textContent = formatTime(duration);
            }
          }
        } catch (e) {
          // Ignore errors from YouTube API
        }
      }
    }, 500);
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Back to results button
  const backBtn = playerSection.querySelector('#back-to-results');
  
  backBtn.addEventListener('click', () => {
    // Stop the player and clean up
    if (player && isPlayerReady) {
      try {
        player.pauseVideo();
      } catch (e) {
        // Ignore errors
      }
    }
    if (progressUpdateInterval) {
      clearInterval(progressUpdateInterval);
      progressUpdateInterval = null;
    }
    
    playerSection.style.display = 'none';
    
    // Show header, search panel, and results again
    const headerEl = container.querySelector('.lute-header');
    const searchPanelEl = container.querySelector('.lute-search-panel');
    const resultsEl = container.querySelector('#music-results');
    
    if (headerEl) {
      headerEl.style.display = 'flex';
    }
    if (searchPanelEl) {
      searchPanelEl.style.display = 'block';
    }
    if (resultsEl) {
      resultsEl.style.display = 'block';
    }
  });
  
  // Play/Pause control
  const playPauseBtn = playerSection.querySelector('#play-pause-btn');
  
  playPauseBtn.addEventListener('click', () => {
    if (player && isPlayerReady) {
      try {
        const state = player.getPlayerState();
        if (state === 1) { // Playing
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      } catch (e) {
        console.error('[BardicLute] Error controlling playback:', e);
      }
    }
  });
  
  // Rewind button (10 seconds back)
  const rewindBtn = playerSection.querySelector('#rewind-btn');
  rewindBtn.addEventListener('click', () => {
    if (player && isPlayerReady) {
      try {
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10), true);
      } catch (e) {
        console.error('[BardicLute] Error rewinding:', e);
      }
    }
  });
  
  // Forward button (10 seconds forward)
  const forwardBtn = playerSection.querySelector('#forward-btn');
  forwardBtn.addEventListener('click', () => {
    if (player && isPlayerReady) {
      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        player.seekTo(Math.min(duration, currentTime + 10), true);
      } catch (e) {
        console.error('[BardicLute] Error fast forwarding:', e);
      }
    }
  });
  
  // Progress bar click to seek
  const progressBar = playerSection.querySelector('#progress-bar');
  
  progressBar.addEventListener('click', (e) => {
    if (player && isPlayerReady) {
      try {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const duration = player.getDuration();
        const seekTime = duration * percent;
        player.seekTo(seekTime, true);
      } catch (e) {
        console.error('[BardicLute] Error seeking:', e);
      }
    }
  });
  
  console.log('[BardicLute] Now playing:', musicItem.title);
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID
 */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract dominant colors from image
 * @param {string} imageUrl - Image URL
 * @param {Function} callback - Callback with colors array
 */
function extractColorsFromImage(imageUrl, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colors = getDominantColors(imageData.data, 3);
      callback(colors);
    } catch (e) {
      console.warn('[BardicLute] Could not extract colors, using defaults');
      callback(['#8B4513', '#D2691E', '#CD853F']);
    }
  };
  
  img.onerror = function() {
    console.warn('[BardicLute] Could not load image for color extraction');
    callback(['#8B4513', '#D2691E', '#CD853F']);
  };
  
  img.src = imageUrl;
}

/**
 * Get dominant colors from image data
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} count - Number of colors to extract
 * @returns {Array} Array of hex color strings
 */
function getDominantColors(data, count) {
  const colorCounts = {};
  
  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Skip very dark or very light pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 240) continue;
    
    // Round to nearest 32 to group similar colors
    const rr = Math.round(r / 32) * 32;
    const gg = Math.round(g / 32) * 32;
    const bb = Math.round(b / 32) * 32;
    
    const color = `${rr},${gg},${bb}`;
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }
  
  // Sort by frequency and get top colors
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([color]) => {
      const [r, g, b] = color.split(',');
      return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
    });
  
  return sortedColors.length > 0 ? sortedColors : ['#8B4513', '#D2691E', '#CD853F'];
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Apply extracted colors to vinyl disk
 */
function applyVinylColors(colors) {
  const vinylDisk = document.querySelector('#vinyl-disk');
  if (!vinylDisk) return;
  
  const gradient = `conic-gradient(
    ${colors[0]} 0deg 120deg,
    ${colors[1]} 120deg 240deg,
    ${colors[2]} 240deg 360deg
  )`;
  
  vinylDisk.style.background = gradient;
  vinylDisk.style.setProperty('--vinyl-color-1', colors[0]);
  vinylDisk.style.setProperty('--vinyl-color-2', colors[1]);
  vinylDisk.style.setProperty('--vinyl-color-3', colors[2]);
}

/**
 * Get platform icon emoji
 * @param {string} platform - Platform name
 * @returns {string} Icon emoji
 */
function getPlatformIcon(platform) {
  return '🎬'; // Always YouTube now
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
