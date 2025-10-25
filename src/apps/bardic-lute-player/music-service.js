/**
 * Music Service
 * Uses OpenAI + Tavily API to search for music and YouTube links
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = import.meta.env.VITE_BASE_URL;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL;

/**
 * Search for music using AI-optimized queries
 * @param {string} query - Search query (song name, artist, etc.)
 * @returns {Promise<Array>} Array of music results
 */
export async function searchMusic(query) {
  try {
    console.log('[MusicService] Searching for:', query);
    
    // Step 1: Use OpenAI to generate optimized search queries
    const optimizedQueries = await generateOptimizedQueries(query);
    console.log('[MusicService] Optimized queries:', optimizedQueries);
    
    // Step 2: Search with Tavily using optimized queries
    const allResults = [];
    for (const optimizedQuery of optimizedQueries) {
      const results = await searchWithTavily(optimizedQuery);
      allResults.push(...results);
    }
    
    console.log('[MusicService] Total Tavily results:', allResults.length);
    
    // Step 3: Deduplicate and rank results
    let uniqueResults = deduplicateResults(allResults);
    
    // Step 4: Always try AI search to ensure we have good results
    console.log('[MusicService] Fetching AI-generated results as backup...');
    const aiResults = await searchWithAI(query);
    console.log('[MusicService] AI returned', aiResults.length, 'results');
    
    // Merge AI results (they go after Tavily results)
    uniqueResults.push(...aiResults);
    uniqueResults = deduplicateResults(uniqueResults);
    
    console.log('[MusicService] Final count:', uniqueResults.length, 'unique results');
    return uniqueResults.slice(0, 12); // Return top 12 results
    
  } catch (error) {
    console.error('[MusicService] Search error:', error);
    throw error;
  }
}

/**
 * Generate optimized search queries using OpenAI
 * @param {string} query - Original query
 * @returns {Promise<Array>} Optimized queries
 */
async function generateOptimizedQueries(query) {
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a music search expert. Given a music search query, generate 2-3 optimized YouTube search queries that will find the best official music videos. Focus on official uploads, popular versions, and correct artist/song names. Return ONLY a JSON array of strings, nothing else.'
          },
          {
            role: 'user',
            content: `Generate optimized YouTube search queries for: "${query}"`
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.warn('[MusicService] OpenAI query optimization failed, using original');
      return [`${query} official music video YouTube`, `${query} official audio YouTube`];
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse JSON array from response
    const queries = JSON.parse(content);
    return Array.isArray(queries) ? queries : [`${query} official music video YouTube`, `${query} official audio YouTube`];
    
  } catch (error) {
    console.warn('[MusicService] Query optimization error:', error);
    return [`${query} official music video YouTube`, `${query} official audio YouTube`];
  }
}

/**
 * Search with Tavily API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
async function searchWithTavily(query) {
  try {
    const response = await fetch('/api/tavily-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        search_depth: 'basic',
        max_results: 5,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[MusicService] Tavily response:', data);

    // Check if we have results array
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      console.warn('[MusicService] Tavily returned no results array');
      return [];
    }

    // Extract ONLY YouTube links
    const musicResults = data.results
      .filter(result => {
        if (!result.url) return false;
        const url = result.url.toLowerCase();
        return url.includes('youtube.com') || url.includes('youtu.be');
      })
      .map(result => ({
        title: cleanTitle(result.title || 'Unknown'),
        url: result.url,
        description: result.content || result.snippet || '',
        platform: 'YouTube',
        source: 'tavily'
      }));

    console.log('[MusicService] Extracted', musicResults.length, 'YouTube results from Tavily');
    return musicResults;
  } catch (error) {
    console.warn('[MusicService] Tavily search error:', error);
    return [];
  }
}

/**
 * Search using AI to generate YouTube links
 * @param {string} query - Search query
 * @returns {Promise<Array>} AI-generated results
 */
async function searchWithAI(query) {
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a music database expert with knowledge of YouTube music videos. Given a song/artist query, provide realistic YouTube video data. Return ONLY a valid JSON array of objects with "title" (Full song name - Artist name), "videoId" (11-character YouTube video ID), and "description" (brief description). Return 5-8 results. Make the video IDs realistic and plausible. IMPORTANT: Return ONLY valid JSON, no other text.'
          },
          {
            role: 'user',
            content: `Find YouTube music videos for: "${query}"\n\nProvide title, videoId (realistic 11-char ID), and description for each. Return as JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.warn('[MusicService] AI search failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    
    // Check if we have a valid response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.warn('[MusicService] Invalid AI response structure');
      return [];
    }
    
    const content = data.choices[0].message.content.trim();
    
    console.log('[MusicService] AI response preview:', content.substring(0, 200));
    
    // Try to parse JSON array from response
    let aiResults;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      
      // Remove ```json and ``` markers
      cleanContent = cleanContent.replace(/```json\s*/gi, '');
      cleanContent = cleanContent.replace(/```\s*/g, '');
      
      // Trim whitespace
      cleanContent = cleanContent.trim();
      
      // Find JSON array boundaries
      const arrayStart = cleanContent.indexOf('[');
      const arrayEnd = cleanContent.lastIndexOf(']');
      
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        cleanContent = cleanContent.substring(arrayStart, arrayEnd + 1);
      }
      
      console.log('[MusicService] Cleaned content for parsing:', cleanContent.substring(0, 100));
      
      aiResults = JSON.parse(cleanContent);
    } catch (parseError) {
      console.warn('[MusicService] Failed to parse AI response:', parseError);
      console.warn('[MusicService] Raw content:', content);
      return [];
    }
    
    if (!Array.isArray(aiResults)) {
      console.warn('[MusicService] AI response is not an array:', typeof aiResults);
      return [];
    }
    
    const formattedResults = aiResults
      .filter(result => result && result.videoId && result.title)
      .map(result => ({
        title: cleanTitle(result.title),
        url: `https://www.youtube.com/watch?v=${result.videoId}`,
        description: result.description || '',
        platform: 'YouTube',
        source: 'ai'
      }));
    
    console.log('[MusicService] Formatted', formattedResults.length, 'AI results');
    return formattedResults;
    
  } catch (error) {
    console.error('[MusicService] AI search error:', error);
    return [];
  }
}

/**
 * Deduplicate results by URL
 * @param {Array} results - Array of results
 * @returns {Array} Deduplicated results
 */
function deduplicateResults(results) {
  const seen = new Set();
  const unique = [];
  
  for (const result of results) {
    const normalizedUrl = normalizeUrl(result.url);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(result);
    }
  }
  
  return unique;
}

/**
 * Normalize URL for comparison
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  // Extract YouTube video ID if present
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `youtube:${youtubeId}`;
  }
  
  // For other URLs, just lowercase and remove trailing slash
  return url.toLowerCase().replace(/\/$/, '');
}

/**
 * Clean up title (remove extra metadata)
 * @param {string} title - Original title
 * @returns {string} Cleaned title
 */
function cleanTitle(title) {
  // Remove common YouTube suffixes
  return title
    .replace(/\s*-\s*YouTube$/i, '')
    .replace(/\s*\|\s*YouTube$/i, '')
    .replace(/\s*\(Official (?:Music )?Video\)/gi, '')
    .replace(/\s*\[Official (?:Music )?Video\]/gi, '')
    .trim();
}

/**
 * Detect music platform from URL
 * @param {string} url - URL to check
 * @returns {string} Platform name
 */
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'YouTube';
  }
  if (urlLower.includes('spotify.com')) {
    return 'Spotify';
  }
  if (urlLower.includes('soundcloud.com')) {
    return 'SoundCloud';
  }
  return 'Web';
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractYouTubeId(url) {
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
 * Get embed URL for a music link
 * @param {string} url - Original URL
 * @returns {string} Embed URL
 */
export function getEmbedUrl(url) {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  }
  
  // For Spotify
  if (url.includes('spotify.com/track/')) {
    const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
    if (trackId) {
      return `https://open.spotify.com/embed/track/${trackId}`;
    }
  }
  
  // Return original URL as fallback
  return url;
}
