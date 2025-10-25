/**
 * Echo Chamber Terminal (RuneShell)
 * A fantasy terminal with AI-powered command parsing and mystical outputs
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { getAllFiles } from '../../storage/queries.js';
import { generateUUID } from '../../utils/uuid.js';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const MODEL = import.meta.env.VITE_OPENAI_MODEL;
const WEATHER_API_KEY = import.meta.env.VITE_WEATHERAPI_API_KEY;
const RUNWARE_API_KEY = import.meta.env.VITE_RUNWARE_API_KEY;

let commandHistory = [];
let historyIndex = -1;
let isGoblinMode = false;
let shadowsRevealed = false;

// AI Chat memory - persists only during current browser session
let conversationHistory = [];
const MAX_CONVERSATION_HISTORY = 20; // Keep last 20 messages to avoid token limits

/**
 * Create Echo Chamber Terminal app
 */
export function createEchoChamberApp(windowEl) {
  const container = document.createElement('div');
  container.className = 'echo-chamber-container';
  
  // Create output pane
  const output = document.createElement('pre');
  output.className = 'echo-output';
  output.innerHTML = `<div class="echo-banner">
  <div class="echo-banner-title">🜏 THE ECHO CHAMBER OF RUNESHELL 🜏</div>
  <div class="echo-banner-subtitle">"Where words become spells and commands bend reality"</div>
</div>

<span class="echo-info">⚡ AI POWERS AVAILABLE:</span>
<span class="echo-dim">• Scry weather across realms (e.g. "weather in Tokyo")
• Summon YouTube visions (e.g. "video epic fails")
• Research arcane knowledge (e.g. "search quantum physics")
• Generate mystical images (e.g. "generate dragon castle")
• Compute mana calculations (e.g. "calculate 42 * 137")
• View thy quest scrolls (e.g. "show my files")</span>

<span class="echo-info">💭 MYSTICAL FEATURES:</span>
<span class="echo-dim">• I remember our conversations this session
• Type "recall" to view memory, "forget" to clear it
• Try "speak goblin" for chaotic error messages
• Ask "what can you do" for more guidance</span>

Type thy will, seeker... or simply greet me! ✨`;
  
  // Create input container with rune decoration
  const inputContainer = document.createElement('div');
  inputContainer.className = 'echo-input-container';
  
  const rune = document.createElement('span');
  rune.className = 'echo-rune';
  rune.textContent = '⚡';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'echo-input';
  input.placeholder = 'Speak thy command...';
  input.autocomplete = 'off';
  
  inputContainer.appendChild(rune);
  inputContainer.appendChild(input);
  
  container.appendChild(output);
  container.appendChild(inputContainer);
  
  // Focus input
  setTimeout(() => input.focus(), 100);
  
  // Event handlers
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      if (cmd) {
        appendOutput(output, `<span class="echo-prompt">⚡ ${cmd}</span>`);
        input.value = '';
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
        await processCommand(cmd, output);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
    }
  });
  
  // Voice input (optional)
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      input.value = transcript;
      appendOutput(output, `<span class="echo-whisper">🎙️ Voice: ${transcript}</span>`);
    };
    
    input.addEventListener('dblclick', () => {
      try {
        recognition.start();
        appendOutput(output, '<span class="echo-info">🎙️ Listening for thy voice...</span>');
      } catch (err) {
        console.error('[EchoChamber] Voice recognition error:', err);
      }
    });
  }
  
  return container;
}

/**
 * Append output with scroll to bottom
 */
function appendOutput(output, html) {
  output.innerHTML += '\n' + html;
  output.scrollTop = output.scrollHeight;
}

/**
 * Process command with AI parsing
 */
async function processCommand(cmd, output) {
  const cmdLower = cmd.toLowerCase();
  
  // Easter eggs and special commands (non-AI)
  if (cmdLower.includes('speak goblin')) {
    isGoblinMode = !isGoblinMode;
    appendOutput(output, `<span class="echo-success">✨ Goblin mode ${isGoblinMode ? 'ENABLED' : 'DISABLED'}! Error messages shall now be ${isGoblinMode ? 'limericks' : 'normal'}.</span>`);
    return;
  }
  
  if (cmdLower.includes('reveal shadows')) {
    shadowsRevealed = !shadowsRevealed;
    appendOutput(output, `<span class="echo-success">🔮 Debug shadows ${shadowsRevealed ? 'REVEALED' : 'CONCEALED'}!</span>`);
    if (shadowsRevealed) {
      const state = { windows: window.__DEBUG__?.eventBus || 'N/A', files: getAllFiles().length };
      appendOutput(output, `<span class="echo-scroll">${JSON.stringify(state, null, 2)}</span>`);
    }
    return;
  }
  
  // Clear conversation memory
  if (cmdLower === 'forget' || cmdLower === 'clear memory' || cmdLower === 'forget all') {
    conversationHistory = [];
    appendOutput(output, `<span class="echo-success">🌫️ The spirits forget... Conversation memory has been cleared.</span>`);
    return;
  }
  
  // Show conversation history
  if (cmdLower === 'recall' || cmdLower === 'show memory' || cmdLower === 'history') {
    if (conversationHistory.length === 0) {
      appendOutput(output, `<span class="echo-info">📜 The scrolls are empty... No conversation history yet.</span>`);
    } else {
      const historyCount = conversationHistory.length / 2; // Each exchange is 2 messages
      appendOutput(output, `<span class="echo-info">📜 Conversation Memory (${historyCount} exchanges):</span>`);
      conversationHistory.forEach((msg, i) => {
        const prefix = msg.role === 'user' ? '⚡ You' : '✨ Spirit';
        const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
        appendOutput(output, `<span class="echo-dim">${prefix}: ${content}</span>`);
      });
    }
    return;
  }
  
  // AI-powered command parsing
  try {
    const intent = await parseCommandIntent(cmd);
    
    if (intent.type === 'greeting') {
      await handleGreeting(cmd, output);
    } else if (intent.type === 'weather') {
      await handleWeather(intent.location, output);
    } else if (intent.type === 'video') {
      await handleVideoSearch(intent.query, output);
    } else if (intent.type === 'search') {
      await handleWebSearch(intent.query, output);
    } else if (intent.type === 'quest_log') {
      await handleQuestLog(output);
    } else if (intent.type === 'calculation') {
      await handleCalculation(intent.expression, output);
    } else if (intent.type === 'image') {
      await handleImageSearch(intent.query, output);
    } else if (intent.type === 'generate_image') {
      await handleImageGeneration(intent.prompt, output);
    } else {
      showError(output, 'Thy command eludes comprehension. Try "Scry weather" or "Generate dragon image".');
    }
  } catch (err) {
    console.error('[EchoChamber] Command error:', err);
    showError(output, err.message || 'The ethereal energies falter!');
  }
}

/**
 * Parse command intent using AI
 */
async function parseCommandIntent(cmd) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'system',
        content: `You are a JSON-only API. Parse user commands into JSON objects. ONLY return valid JSON, no other text.

SYSTEM CONTEXT - You are the Echo Chamber Terminal (RuneShell) in RuneShell, a mystical fantasy desktop environment with the following capabilities:

AVAILABLE APPLICATIONS:
- Quest Log: Task/file manager for tracking quests and adventures
- Treasure Chest Explorer: File browser for managing scrolls and artifacts (supports folders)
- Mana Calculator: Arcane calculator with mystical precision
- Weather Oracle: Weather forecasting with fantasy-themed prophecies
- Potion Mixer Notepad: Rich text editor with alchemical animations
- Realm Customizer Altar: Settings/theme customizer for the desktop
- Echo Chamber Terminal (you): AI-powered command terminal

DATA STORAGE SYSTEM:
- Files: User-created documents stored in SQLite database (name, type, content, thumbnail, folder_id, size_bytes)
- Folders: Hierarchical folder structure with parent_id relationships
- Notifications: System notifications with read/dismissed states
- Calendar Events: Event tracking with event_date, event_time, event_type, linked_quest_id
- Settings: User preferences (particle_density, particle_enabled, theme_color)
- Windows: Active application windows with position, size, z_index, minimized state

SYSTEM CAPABILITIES:
- Event Bus: Cross-module communication system (file:created, window:opened, notification:created, etc.)
- Window Manager: Creates, focuses, minimizes, maximizes, closes application windows
- Reactive State: Global state management with subscriptions
- Desktop: Particle effects, customizable backgrounds (mossy_green theme)
- Database: SQLite in browser via sql.js with full CRUD operations

COMMAND TYPES: 
- greeting (no params) - for hi, hello, how are you, casual chat, time/date queries, general questions about the system
- weather (location) - for weather queries using WeatherAPI
- video (query) - for YouTube video searches and embedding
- search (query) - for web searches about complex topics using Tavily AI
- quest_log (no params) - for showing files from database
- calculation (expression) - for math calculations
- image (query) - for finding existing images via Unsplash
- generate_image (prompt) - for AI image generation using Runware API

COMMAND INTERPRETATION GUIDELINES:
- Use "greeting" for: time/date, how are you, what can you do, system capabilities, asking about apps/features
- Use "quest_log" when users want to see their files, quests, or documents
- Use "search" only for topics needing external web research (news, facts, complex info)
- When users mention apps, explain them conversationally via "greeting"
- For questions about RuneShell features, use "greeting" and explain the mystical environment

Examples:
"hi" -> {"type":"greeting"}
"what time is it" -> {"type":"greeting"}
"what can you do" -> {"type":"greeting"}
"tell me about the apps" -> {"type":"greeting"}
"how does this system work" -> {"type":"greeting"}
"what is the quest log" -> {"type":"greeting"}
"show my files" -> {"type":"quest_log"}
"Scry weather in London" -> {"type":"weather","location":"London"}
"Summon cat fails" -> {"type":"video","query":"cat fails"}
"Research latest AI developments" -> {"type":"search","query":"latest AI developments"}
"Recite quest log" -> {"type":"quest_log"}
"Compute 42 * 7" -> {"type":"calculation","expression":"42 * 7"}
"Echo image of dragon hoard" -> {"type":"image","query":"dragon hoard"}
"Generate dragon breathing fire" -> {"type":"generate_image","prompt":"dragon breathing fire"}

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no extra text.`
      }, {
        role: 'user',
        content: cmd
      }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });
  
  if (!response.ok) throw new Error('The oracle is silent...');
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

/**
 * Handle greetings (AI-generated response with conversation memory)
 */
async function handleGreeting(userMessage, output) {
  appendOutput(output, '<span class="echo-loading">✨ The spirits whisper...</span>');
  
  try {
    // Get current date/time for context
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Get system context
    const files = getAllFiles();
    const fileCount = files.length;
    
    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: `You are a mystical fantasy terminal assistant in the Echo Chamber of RuneShell within RuneShell. Respond to greetings and questions in a whimsical, medieval fantasy style. Keep responses brief (2-4 sentences) and use fantasy/magic themed language.

SYSTEM ENVIRONMENT - RuneShell (Enchanted Realm Shell):
You are running inside a magical desktop environment with these mystical applications:

📜 Quest Log - Task manager for tracking quests and adventures
💎 Treasure Chest Explorer - File browser with ${fileCount} scrolls/artifacts stored
🔮 Mana Calculator - Arcane calculator for mystical computations  
🌤️ Weather Oracle - Scries meteorological fates across the realms
🧪 Potion Mixer Notepad - Rich text editor with alchemical animations
⚗️ Realm Customizer Altar - Customizes desktop themes and particle effects
⚡ Echo Chamber Terminal (you) - AI-powered RuneShell with these powers:
  • Weather scrying (WeatherAPI integration)
  • Video summoning (YouTube search & embed)
  • Web research (Tavily AI search for knowledge)
  • Image conjuring (Unsplash + Runware AI generation)
  • Mana calculations (mathematical sorcery)
  • Quest log access (view files in database)
  • Conversational magic (remember session context)

DATA REALMS:
- SQLite database storing files, folders, notifications, calendar events, settings
- Reactive state management tracking windows, apps, and desktop environment
- Event bus for mystical cross-module communication

SPECIAL ABILITIES:
- Conversation memory during this session ("recall" to view, "forget" to clear)
- Goblin mode for humorous error messages ("speak goblin")
- Shadow revelation for debug info ("reveal shadows")

Current date: ${dateStr}
Current time: ${timeStr}

When asked about capabilities or features:
- Explain the magical apps available
- Mention your AI powers (weather, images, search, videos, calculations)
- Reference the fantasy theme (scrolls, quests, mana, spells)
- Keep it mystical but informative

You have memory of this conversation session. Reference previous exchanges naturally when relevant.`
      },
      ...conversationHistory, // Include previous conversation
      {
        role: 'user',
        content: userMessage
      }
    ];
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.8
      })
    });
    
    if (!response.ok) throw new Error('The oracle is silent...');
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add to conversation history
    conversationHistory.push({ role: 'user', content: userMessage });
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    
    // Trim history if too long (keep last N messages)
    if (conversationHistory.length > MAX_CONVERSATION_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
    }
    
    appendOutput(output, `<span class="echo-success">${aiResponse}</span>`);
  } catch (err) {
    console.error('[EchoChamber] Greeting error:', err);
    appendOutput(output, '<span class="echo-success">✨ Well met, traveler! The Echo Chamber awaits thy command.</span>');
  }
}

/**
 * Handle weather scrying
 */
async function handleWeather(location, output) {
  appendOutput(output, '<span class="echo-loading">🔮 Parting the veil...</span>');
  
  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}`
  );
  
  if (!response.ok) throw new Error('The weather spirits refuse thy call!');
  
  const data = await response.json();
  const forecast = `
<div class="echo-card">
  <div class="echo-card-header">🌤️ METEOROLOGICAL PROPHECY</div>
  <div class="echo-card-body">
    <div><strong>Location:</strong> ${data.location.name}, ${data.location.country}</div>
    <div><strong>The veil parts:</strong> ${data.current.condition.text}</div>
    <div><strong>Temperature:</strong> ${data.current.temp_f}°F (${data.current.temp_c}°C)</div>
    <div><strong>Humidity:</strong> ${data.current.humidity}% basilisk rain chance</div>
    <div><strong>Wind:</strong> ${data.current.wind_mph} mph from ${data.current.wind_dir}</div>
    <div><strong>Visibility:</strong> ${data.current.vis_miles} leagues</div>
  </div>
</div>`;
  
  appendOutput(output, forecast);
}

/**
 * Handle video summoning
 */
async function handleVideoSearch(query, output) {
  appendOutput(output, '<span class="echo-loading">🎭 Opening portal to the YouTube dimension...</span>');
  
  try {
    let videoId = null;
    let embedUrl = null;
    
    // First, check if the query is already a YouTube URL
    const urlPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of urlPatterns) {
      const match = query.match(pattern);
      if (match) {
        videoId = match[1];
        console.log('[EchoChamber] Extracted video ID from URL/ID:', videoId);
        break;
      }
    }
    
    // If we have a direct video ID, use it with youtube-nocookie.com
    if (videoId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else {
      // Try Tavily to find a specific video
      try {
        const proxyUrl = import.meta.env.DEV 
          ? '/api/tavily-proxy' 
          : 'https://runeshell.vercel.app/api/tavily-proxy';
        
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `site:youtube.com/watch ${query}`,
            search_depth: 'basic',
            max_results: 5
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[EchoChamber] Tavily video search results:', data);

          // Try to extract video ID from any result
          if (data.results && data.results.length > 0) {
            for (const result of data.results) {
              const urlMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
              if (urlMatch) {
                videoId = urlMatch[1];
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
                console.log('[EchoChamber] Found video ID via Tavily:', videoId);
                break;
              }
            }
          }
        }
      } catch (tavilyErr) {
        console.warn('[EchoChamber] Tavily search failed:', tavilyErr);
      }
      
      // If Tavily didn't find anything, show helpful message (NO iframe embed fallback)
      if (!embedUrl) {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const fallbackHtml = `
<span class="echo-info">🎭 The spirits couldn't find a specific video to summon.</span>
<span class="echo-dim">💡 Try these options:</span>
<div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
  <div>• Paste a YouTube URL or video ID directly</div>
  <div>• <a href="${searchUrl}" target="_blank" style="color: #ffd700;">Click here to search on YouTube</a></div>
  <div>• Be more specific with your search terms</div>
</div>
<span class="echo-dim">Example: <code>video dQw4w9WgXcQ</code> or <code>video https://youtube.com/watch?v=...</code></span>`;
        appendOutput(output, fallbackHtml);
        return;
      }
    }
    
    // Embed the video with proper parameters
    const embedHtml = `
<span class="echo-success">✨ Portal manifested! Behold the vision:</span>
<div class="echo-embed">
  <iframe width="100%" height="400"
    src="${embedUrl}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen
    loading="lazy">
  </iframe>
</div>
<span class="echo-info">📺 <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Watch on YouTube</a></span>`;
    appendOutput(output, embedHtml);
    
  } catch (err) {
    console.error('[EchoChamber] Video search error:', err);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const errorHtml = `
<span class="echo-error">⚡ Portal magic fizzled!</span>
<span class="echo-dim">💡 <a href="${searchUrl}" target="_blank" style="color: #ffd700;">Click here to search on YouTube</a></span>
<span class="echo-dim">Or paste a YouTube URL/video ID directly (e.g., <code>video dQw4w9WgXcQ</code>)</span>`;
    appendOutput(output, errorHtml);
  }
}

/**
 * Handle web search (Tavily AI Search)
 */
async function handleWebSearch(query, output) {
  appendOutput(output, '<span class="echo-loading">📜 Consulting the forbidden scrolls via Tavily...</span>');
  
  try {
    // Use proxy to avoid CORS issues
    const proxyUrl = import.meta.env.DEV 
      ? '/api/tavily-proxy' 
      : 'https://runeshell.vercel.app/api/tavily-proxy';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        search_depth: 'advanced', // Use advanced for better, more recent results
        max_results: 8,
        include_raw_content: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[EchoChamber] Tavily proxy error:', errorData);
      throw new Error(errorData.error || 'Search failed');
    }
    
    const data = await response.json();
    console.log('[EchoChamber] Tavily response:', data);
    
    // Check if we got any data
    if (!data.answer && (!data.results || data.results.length === 0)) {
      showError(output, 'The Tavily oracles found no knowledge on this topic. The spirits remain silent...');
      return;
    }
    
    // Display the answer if available
    if (data.answer) {
      const scrollHtml = `
<div class="echo-card">
  <div class="echo-card-header">📖 FORBIDDEN KNOWLEDGE FROM THE ETHER</div>
  <div class="echo-card-body">
    ${data.answer}
  </div>
</div>`;
      appendOutput(output, scrollHtml);
    }
    
    // Display sources if available
    if (data.results && data.results.length > 0) {
      let topics = '\n<span class="echo-info">📚 Sacred Sources:\n';
      data.results.slice(0, 5).forEach((result, i) => {
        const snippet = result.content ? result.content.substring(0, 200) : 'No preview available';
        topics += `\n${i + 1}. <strong>${result.title}</strong>\n   ${snippet}...\n   🔗 <a href="${result.url}" target="_blank">Journey forth</a>\n`;
      });
      topics += '</span>';
      appendOutput(output, topics);
    }
    
  } catch (err) {
    console.error('[EchoChamber] Tavily search error:', err);
    showError(output, `The arcane search failed: ${err.message}. The spirits are disturbed...`);
  }
}

/**
 * Handle quest log retrieval
 */
async function handleQuestLog(output) {
  const files = getAllFiles();
  
  if (files.length === 0) {
    appendOutput(output, '<span class="echo-info">📜 Thy quest log is empty. Create files in the Treasure Chest!</span>');
    return;
  }
  
  const lorePrefixes = [
    'Ancient scroll of',
    'Sacred parchment titled',
    'Mystical tome known as',
    'Enchanted document of',
    'Forbidden text called'
  ];
  
  let questList = '<div class="echo-card">\n';
  questList += '  <div class="echo-card-header">📖 QUEST LOG - THY SACRED SCROLLS</div>\n';
  questList += '  <div class="echo-card-body">\n';
  
  files.slice(0, 10).forEach((file, i) => {
    const prefix = lorePrefixes[Math.floor(Math.random() * lorePrefixes.length)];
    questList += `    <div>${i + 1}. ${prefix} "${file.name}"</div>\n`;
  });
  
  if (files.length > 10) {
    questList += `    <div>... and ${files.length - 10} more hidden scrolls</div>\n`;
  }
  
  questList += '  </div>\n';
  questList += '</div>';
  appendOutput(output, questList);
}

/**
 * Handle calculation (Mana Calc integration)
 */
async function handleCalculation(expression, output) {
  try {
    // Safe eval using Function constructor (limited scope)
    const safeExpression = expression.replace(/[^0-9+\-*/.() ]/g, '');
    const result = Function(`"use strict"; return (${safeExpression})`)();
    
    appendOutput(output, `<span class="echo-success">⚡ The runes align! Result: ${result}</span>`);
    
    // Emit event for Mana Calculator sync
    eventBus.emit('mana:calculate', { expression, result });
  } catch (err) {
    showError(output, 'The mathematical energies are tangled! Check thy formula.');
  }
}

/**
 * Handle image search (Unsplash)
 */
async function handleImageSearch(query, output) {
  appendOutput(output, '<span class="echo-loading">🖼️ Conjuring visions from the astral plane...</span>');
  
  // Using Unsplash Source (no API key needed for basic usage)
  const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
  
  const imageHtml = `
<span class="echo-success">✨ Behold the vision:</span>
<div class="echo-image">
  <img src="${imageUrl}" alt="${query}" onload="this.classList.add('loaded')" />
  <p class="echo-caption">A glimpse of: ${query}</p>
</div>`;
  
  appendOutput(output, imageHtml);
}

/**
 * Handle AI image generation (Runware)
 */
async function handleImageGeneration(prompt, output) {
  appendOutput(output, '<span class="echo-loading">🎨 Weaving reality from the void... The alchemists work their magic...</span>');
  
  try {
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWARE_API_KEY}`
      },
      body: JSON.stringify([{
        taskType: 'imageInference',
        taskUUID: generateUUID(), // Use proper UUID v4
        model: 'runware:101@1',
        positivePrompt: prompt,
        width: 768,
        height: 768,
        numberResults: 1,
        outputFormat: 'WEBP',
        includeCost: true
      }])
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Runware API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[EchoChamber] Runware response:', result);
    
    // Response structure: { "data": [ { "imageURL": "...", "cost": ... } ] }
    if (result && result.data && result.data.length > 0 && result.data[0].imageURL) {
      const imageData = result.data[0];
      const imageUrl = imageData.imageURL;
      
      const imageHtml = `
<span class="echo-success">✨ The spell is complete! Behold thy creation:</span>
<div class="echo-image echo-generated">
  <img src="${imageUrl}" alt="${prompt}" onload="this.classList.add('loaded')" />
  <p class="echo-caption">🎨 Manifested from: "${prompt}"</p>
  <p class="echo-info" style="font-size: 0.75rem; margin-top: 0.5rem;">⚡ Cost: ${imageData.cost?.toFixed(4) || 'Unknown'} mana</p>
</div>`;
      
      appendOutput(output, imageHtml);
    } else {
      console.error('[EchoChamber] Invalid response structure:', result);
      throw new Error('No image URL in response');
    }
  } catch (err) {
    console.error('[EchoChamber] Image generation error:', err);
    showError(output, `The artistic spirits rebel! ${err.message || 'Try again with a different incantation.'}`);
  }
}

/**
 * Show error with goblin mode
 */
function showError(output, message) {
  if (isGoblinMode) {
    const limericks = [
      `There once was a command quite absurd,\nThe imp cackled at every word,\n"${message}",\nSo try once again,\nOr forever be mocked by this nerd!`,
      `A wizard typed gibberish one day,\nThe goblin just laughed in dismay,\n"${message}",\nNow don't be a fool,\nLearn proper spell school!`,
    ];
    const limerick = limericks[Math.floor(Math.random() * limericks.length)];
    
    const goblinHtml = `<div class="echo-card echo-card-error">
  <div class="echo-card-header">⚠️ GOBLIN ERROR DETECTED ⚠️</div>
  <div class="echo-card-body">
    <pre style="margin: 0; font-size: 1.2em; text-align: center;">
   /\\_/\\  
  ( o.o ) 
   > ^ <
    </pre>
    <div style="margin-top: 1rem; white-space: pre-line;">${limerick}</div>
  </div>
</div>`;
    appendOutput(output, goblinHtml);
  } else {
    const errorHtml = `<div class="echo-card echo-card-error">
  <div class="echo-card-header">⚠️ THERE'S BEEN A PROBLEM ⚠️</div>
  <div class="echo-card-body">
    <div style="margin-bottom: 0.5rem;">${message}</div>
    <div style="font-style: italic; opacity: 0.8;">Thy words twist like a troll's tongue!</div>
  </div>
</div>`;
    appendOutput(output, errorHtml);
  }
}
