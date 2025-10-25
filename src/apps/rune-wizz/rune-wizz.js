/**
 * RuneWizz - Voice Agent for FantasyOS
 * Simple voice assistant with OS context awareness
 */

import Vapi from '@vapi-ai/web';

let vapiInstance = null;
let isCallActive = false;
let isMuted = false;

/**
 * Create RuneWizz voice agent app
 * @returns {HTMLElement} App container
 */
export function createRuneWizzApp() {
  const container = document.createElement('div');
  container.className = 'rune-wizz-container';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%);
    color: var(--color-text-light);
    font-family: var(--font-family-fantasy);
    overflow: hidden;
    position: relative;
  `;

  // Mystical background pattern
  const bgPattern = document.createElement('div');
  bgPattern.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(157, 127, 240, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  `;
  container.appendChild(bgPattern);

  // Content wrapper
  const content = document.createElement('div');
  content.style.cssText = `
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  `;

  // Header with icon and title
  const header = document.createElement('div');
  header.className = 'rune-wizz-header';
  header.style.cssText = `
    text-align: center;
    margin-bottom: 1.5rem;
  `;
  header.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5)); display: flex; justify-content: center; align-items: center;">
      <img src="src/assets/wizard.png" alt="Wizard" style="width: 80px; height: 80px; object-fit: contain;">
    </div>
    <h1 style="font-size: 1.8rem; margin: 0; font-family: var(--font-family-fantasy); background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);">
      RuneWizz
    </h1>
    <p style="margin: 0.25rem 0 0; color: var(--color-text-muted); font-size: 0.85rem; font-family: var(--font-family-fantasy);">
      Mystical Voice Companion
    </p>
  `;

  // Main orb and status area
  const orbSection = document.createElement('div');
  orbSection.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  `;

  // Mystical orb (clickable button)
  const orb = document.createElement('button');
  orb.className = 'voice-orb';
  orb.id = 'voice-orb';
  orb.style.cssText = `
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.4), rgba(255, 165, 0, 0.1));
    border: 3px solid rgba(255, 215, 0, 0.6);
    box-shadow: 
      0 0 40px rgba(255, 215, 0, 0.4), 
      inset 0 0 30px rgba(255, 215, 0, 0.2),
      0 8px 32px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    position: relative;
    overflow: hidden;
    outline: none;
  `;
  orb.innerHTML = '<img src="src/assets/crystal-ball-blue.png" alt="Crystal Ball" style="width: 100%; height: 100%; object-fit: contain;">';

  // Orb inner glow
  const orbGlow = document.createElement('div');
  orbGlow.style.cssText = `
    position: absolute;
    top: 10%;
    left: 10%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
    border-radius: 50%;
    pointer-events: none;
  `;
  orb.appendChild(orbGlow);

  // Status text
  const status = document.createElement('div');
  status.className = 'voice-status';
  status.id = 'voice-status';
  status.style.cssText = `
    text-align: center;
    font-size: 1rem;
    color: var(--color-gold);
    min-height: 1.5rem;
    font-family: var(--font-family-fantasy);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  `;
  status.textContent = 'Ready to listen...';

  // Action hint
  const hint = document.createElement('div');
  hint.id = 'action-hint';
  hint.style.cssText = `
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-family: var(--font-family-fantasy);
    font-style: italic;
  `;
  hint.textContent = 'Click the orb to begin';

  orbSection.appendChild(orb);
  orbSection.appendChild(status);
  orbSection.appendChild(hint);

  // Compact capabilities info
  const capabilities = document.createElement('div');
  capabilities.className = 'capabilities-info';
  capabilities.style.cssText = `
    padding: 0.75rem;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: var(--font-family-fantasy);
    line-height: 1.4;
  `;
  capabilities.innerHTML = `
    <strong style="color: var(--color-gold); font-size: 0.8rem;">✨ I can help with:</strong><br>
    📜 Files & Artifacts • 📅 Events • ⚙️ Settings • 🎮 App Guides
  `;

  // Assemble UI
  content.appendChild(header);
  content.appendChild(orbSection);
  content.appendChild(capabilities);
  container.appendChild(content);

  // Initialize Vapi with the orb button
  initializeVapi(orb, status, hint);

  // Add cleanup function to stop the call when window closes
  container.cleanup = () => {
    console.log('[RuneWizz] Cleanup: Stopping active call');
    if (vapiInstance && isCallActive) {
      vapiInstance.stop();
      isCallActive = false;
    }
  };

  return container;
}

/**
 * Get current OS context for the assistant
 */
function getOSContext() {
  // Import storage queries dynamically
  const storage = window.fantasyOS?.storage;
  
  if (!storage) {
    console.warn('[RuneWizz] Storage API not available yet');
  }

  const context = {
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  };

  // Get user files (scrolls and artifacts)
  try {
    if (storage?.getAllFiles) {
      const files = storage.getAllFiles();
      console.log('[RuneWizz] Retrieved files:', files.length);
      
      const scrolls = files.filter(f => f.type === 'scroll');
      const artifacts = files.filter(f => f.type === 'artifact');
      
      context.scrolls = scrolls.map(f => ({ 
        name: f.name, 
        size: `${(f.size_bytes / 1024).toFixed(1)}KB`, 
        modified: new Date(f.modified_at).toLocaleString() 
      }));
      
      context.artifacts = artifacts.map(f => ({ 
        name: f.name, 
        size: `${(f.size_bytes / 1024).toFixed(1)}KB`, 
        modified: new Date(f.modified_at).toLocaleString() 
      }));
      
      context.totalFiles = files.length;
      context.scrollCount = scrolls.length;
      context.artifactCount = artifacts.length;
    } else {
      context.dataNote = 'File data not available';
    }
  } catch (error) {
    console.error('[RuneWizz] Error getting files:', error);
    context.filesError = error.message;
  }

  // Get calendar events
  try {
    if (storage?.getAllCalendarEvents) {
      const events = storage.getAllCalendarEvents();
      console.log('[RuneWizz] Retrieved events:', events.length);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcoming = events
        .filter(e => new Date(e.event_date) >= now)
        .slice(0, 5);
      
      context.upcomingEvents = upcoming.map(e => ({ 
        title: e.title, 
        date: e.event_date, 
        time: e.event_time || 'No time set', 
        type: e.event_type 
      }));
      
      context.totalEvents = events.length;
      context.upcomingCount = upcoming.length;
    } else {
      context.dataNote = (context.dataNote || '') + ' Calendar data not available';
    }
  } catch (error) {
    console.error('[RuneWizz] Error getting events:', error);
    context.eventsError = error.message;
  }

  // Get realm settings
  try {
    if (storage?.getAllSettings) {
      const settings = storage.getAllSettings();
      console.log('[RuneWizz] Retrieved settings:', settings);
      
      // Map the actual setting keys from the database
      context.realmSettings = {
        theme: settings.theme || 'mossy-forest',
        background: settings.background || 'default',
        runeGlow: settings.rune_glow !== false,
        particlesEnabled: settings.particle_enabled !== false,
        particleDensity: settings.particle_density || 2,
        backgroundMusicEnabled: settings.background_music_enabled || false,
        backgroundMusicVolume: settings.background_music_volume || 0.3,
        notificationSoundEnabled: settings.notification_sound_enabled !== false,
        clockPosition: settings.clock_position || 'top-right'
      };
    } else {
      context.dataNote = (context.dataNote || '') + ' Settings data not available';
    }
  } catch (error) {
    console.error('[RuneWizz] Error getting settings:', error);
    context.settingsError = error.message;
  }

  // Get unread notifications
  try {
    if (storage?.getUnreadNotifications) {
      const notifications = storage.getUnreadNotifications();
      console.log('[RuneWizz] Retrieved notifications:', notifications.length);
      
      context.unreadNotifications = notifications.length;
      if (notifications.length > 0) {
        context.recentNotifications = notifications
          .slice(0, 3)
          .map(n => ({ text: n.text, time: new Date(n.timestamp).toLocaleString() }));
      }
    } else {
      context.dataNote = (context.dataNote || '') + ' Notifications data not available';
    }
  } catch (error) {
    console.error('[RuneWizz] Error getting notifications:', error);
    context.notificationsError = error.message;
  }

  console.log('[RuneWizz] Final context:', context);
  return context;
}

/**
 * Get app usage guide
 */
function getAppGuide() {
  return {
    'treasure-chest': {
      name: 'Treasure Chest Explorer',
      purpose: 'File manager for browsing, creating, and organizing scrolls (text files) and artifacts (images)',
      howToUse: 'Click the folder icon in taskbar. Create new files with the + button, organize in folders, search files, and delete unwanted items.',
      features: ['Browse files by type', 'Create/edit scrolls and artifacts', 'Folder organization', 'File search', 'Storage usage tracking']
    },
    'mana-calculator': {
      name: 'Mana Calculator', 
      purpose: 'Perform mathematical calculations with a mystical interface',
      howToUse: 'Click on buttons to input numbers and operators, use C to clear, = to calculate. Supports basic arithmetic and percentages.',
      features: ['Basic arithmetic (+, -, ×, ÷)', 'Percentage calculations', 'Decimal support', 'Memory clear function']
    },
    'quest-log': {
      name: 'Quest Log',
      purpose: 'Task manager and calendar for tracking quests (tasks) and events',
      howToUse: 'Access from taskbar. Add quests with title and optional description, set event dates/times, mark quests complete, and view upcoming events.',
      features: ['Create and manage quests', 'Calendar event scheduling', 'Quest completion tracking', 'Upcoming events view', 'Quest types (daily, main, side)']
    },
    'weather-oracle': {
      name: 'Weather Oracle',
      purpose: 'Check weather conditions and forecasts for any location worldwide',
      howToUse: 'Type a city name and press Enter or click Search. View current conditions and 3-day forecast with mystical weather descriptions.',
      features: ['Real-time weather data', '3-day forecast', 'Temperature in Celsius', 'Wind speed and humidity', 'Mystical weather interpretations']
    },
    'potion-mixer': {
      name: 'Potion Mixer Notepad',
      purpose: 'Rich text editor for creating and editing scrolls (text documents)',
      howToUse: 'Type your text, use toolbar for formatting (bold, italic, underline, headings), insert lists and links. Save to create a new scroll.',
      features: ['Rich text editing', 'Text formatting (bold, italic, underline)', 'Headings and lists', 'Link insertion', 'Auto-save support']
    },
    'realm-customizer': {
      name: 'Realm Customizer',
      purpose: 'Customize FantasyOS appearance with themes, backgrounds, particles, and settings',
      howToUse: 'Choose from theme presets, select background images, adjust particle effects, toggle rune glow, enable background music, and position the clock.',
      features: ['8 fantasy themes', '10+ background options', 'Particle density control', 'Rune glow toggle', 'Background music with volume', 'Clock positioning', 'Notification sound toggle']
    },
    'echo-chamber': {
      name: 'Echo Chamber Terminal (RuneShell)',
      purpose: 'AI-powered terminal for natural language commands and system interactions',
      howToUse: 'Type commands or natural language. Use "help" to see commands. AI understands requests like "search quantum physics", "weather Tokyo", "generate dragon image".',
      features: ['AI-powered command parsing', 'Weather lookup', 'Web search via Tavily', 'YouTube video search', 'Image generation', 'Math calculations', 'File operations', 'Goblin Mode for chaos']
    },
    'games-arcade': {
      name: 'Mystical Games Arcade',
      purpose: 'Collection of classic games reimagined with fantasy themes',
      howToUse: 'Click on a game card to launch it. Each game has its own controls (usually arrow keys or WASD).',
      features: ['Tetris', 'Snake', 'Pacman', 'Space Defender', 'Bounce', 'Puzzle', 'Spider Solitaire', 'Score tracking']
    },
    'spell-tome-library': {
      name: 'Spell Tome Library',
      purpose: 'Ebook reader supporting multiple formats (PDF, EPUB, MOBI, TXT)',
      howToUse: 'Open files from your computer using the file picker. Navigate pages with arrow buttons, adjust font size, search text, and bookmark pages.',
      features: ['Multi-format support (PDF, EPUB, MOBI, TXT)', 'Page navigation', 'Font size adjustment', 'Text search', 'Bookmarking', 'Table of contents']
    },
    'bardic-lute-player': {
      name: 'Bardic Lute Player',
      purpose: 'Music player that searches and streams music from YouTube',
      howToUse: 'Search for songs, artists, or playlists. Click to play. Use controls for play/pause, volume, seeking. Create playlists.',
      features: ['YouTube music search', 'Audio streaming', 'Playback controls', 'Volume adjustment', 'Playlist creation', 'Now playing display']
    },
    'hex-canvas': {
      name: 'Hex Canvas Studio',
      purpose: 'Professional pixel art and drawing application with layers and tools',
      howToUse: 'Use toolbar to select drawing tools (brush, pencil, eraser, fill). Pick colors from palette. Create layers. Save as artifact.',
      features: ['Multiple drawing tools', 'Layer system', 'Color palettes', 'Grid overlay', 'Undo/redo', 'Export as PNG', 'Custom brush sizes']
    },
    'meditation-chamber': {
      name: 'Meditation Chamber',
      purpose: 'Pomodoro timer and focus app with ambient sounds',
      howToUse: 'Set focus and break durations. Click Start to begin. Work during focus time, rest during breaks. Enable ambient sounds for atmosphere.',
      features: ['Pomodoro timer', 'Customizable durations', 'Break reminders', 'Ambient soundscapes', 'Session tracking', 'Focus statistics']
    },
    'rune-wizz': {
      name: 'RuneWizz Voice Agent',
      purpose: 'Voice-powered AI assistant with awareness of your FantasyOS data',
      howToUse: 'Click Start Voice to begin. Speak naturally to ask about your files, events, settings, or time. Click Stop to end.',
      features: ['Voice interaction', 'Context awareness', 'File information', 'Event reminders', 'Settings info', 'Natural conversation']
    }
  };
}

/**
 * Create assistant configuration with OS context
 */
function createAssistantWithContext() {
  const context = getOSContext();
  const appGuide = getAppGuide();
  
  return {
    // Model configuration
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are RuneWizz, a mystical voice assistant for FantasyOS - an enchanted desktop operating system with a fantasy theme.

PERSONALITY:
- Speak in a mystical, wizard-like manner with fantasy references
- Be helpful, friendly, and conversational
- Keep responses concise (2-3 sentences typically)
- Use occasional fantasy emojis: 🧙‍♂️ ✨ 🔮 ⚡ 🌟

USER'S CURRENT DATA:
${JSON.stringify(context, null, 2)}

AVAILABLE APPS & HOW TO USE THEM:
${JSON.stringify(appGuide, null, 2)}

CRITICAL INSTRUCTIONS:
1. ONLY use information from the context above - NEVER make up data
2. If specific data is missing or empty (like scrolls: [] or realmSettings missing), say "I don't see any [data type] in your realm yet" or "You haven't set up any [data] yet"
3. For settings, use the EXACT values from realmSettings object - don't guess or assume
4. If the user asks about something not in your context, tell them honestly that you don't have access to that information

WHAT YOU CAN HELP WITH:
- Information about their scrolls (text files) and artifacts (images/drawings)
- Their upcoming calendar events and quests  
- Current realm customizer settings (theme, background, particles, music, clock, etc.)
- Unread notifications and recent system messages
- Current date and time
- HOW TO USE any app in FantasyOS - explain features, controls, and purpose
- Which app to use for specific tasks

EXAMPLES:
User: "What scrolls do I have?"
You: "Let me check your archives! 📜 ${context.scrollCount > 0 ? `You have ${context.scrollCount} scrolls: [list actual scroll names]` : `I don't see any scrolls in your realm yet. You can create some using the Potion Mixer app!`}"

User: "What are my realm settings?"
You: "Your realm is configured thus: ${context.realmSettings ? `Theme is ${context.realmSettings.theme}, particles are ${context.realmSettings.particlesEnabled ? 'enabled' : 'disabled'}, and background music is ${context.realmSettings.backgroundMusicEnabled ? 'playing' : 'silent'}.` : `I cannot see your settings right now, traveler.`}"

User: "What events do I have?"
You: "${context.upcomingCount > 0 ? `You have ${context.upcomingCount} upcoming quests: [list them]` : `Your calendar is clear, no upcoming events scheduled!`}"

User: "How do I use the calculator?"
You: "The Mana Calculator performs mystical arithmetic! ✨ Click the buttons to input numbers and operators. Use C to clear, and = to calculate. It supports basic math and percentages. You'll find it in your taskbar!"

User: "How can I edit text?"
You: "For text editing, use the Potion Mixer Notepad! 🧪 It's a rich text editor where you can format text with bold, italic, headings, and lists. Just type and save to create a scroll. Access it from the taskbar!"

User: "What app plays music?"
You: "The Bardic Lute Player is your musical companion! 🎵 Search for any song from YouTube, create playlists, and control playback. Look for the music note icon in your taskbar to summon it!"

User: "How do I draw?"
You: "The Hex Canvas Studio is your mystical art workshop! 🎨 It has drawing tools, layers, color palettes, and can save your art as artifacts. Perfect for pixel art and sketching!"

REMEMBER: Be honest about what you know. If the data isn't in your context, say so! Don't hallucinate information. When explaining apps, use the guide provided to give accurate, helpful information.`
        }
      ]
    },
    
    // Voice configuration
    voice: {
      provider: "11labs",
      voiceId: "VR6AewLTigWG4xSOukaG"  // Arnold - Rich, deep male voice
    },
    
    // Transcriber configuration
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US"
    },
    
    // Call settings
    firstMessage: "Greetings, traveler! I am RuneWizz, your mystical voice companion. I have access to your scrolls, artifacts, calendar events, and realm settings. How may I assist you in your journey?",
    endCallMessage: "Farewell, traveler! May the arcane winds guide your journey. ✨",
    
    // Max call duration (in seconds) - 10 minutes
    maxDurationSeconds: 600
  };
}

/**
 * Initialize Vapi instance and event handlers
 */
function initializeVapi(orbBtn, statusEl, hintEl) {
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('[RuneWizz] VAPI_PUBLIC_KEY not found in environment');
    statusEl.textContent = '❌ Configuration Error';
    statusEl.style.color = '#ff4444';
    hintEl.textContent = 'Missing API Key';
    return;
  }

  // Initialize Vapi client
  vapiInstance = new Vapi(publicKey);
  
  // Update orb hover effects
  orbBtn.addEventListener('mouseenter', () => {
    if (!isCallActive) {
      orbBtn.style.transform = 'scale(1.05)';
      orbBtn.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.6), inset 0 0 40px rgba(255, 215, 0, 0.3), 0 12px 40px rgba(0, 0, 0, 0.4)';
    }
  });
  
  orbBtn.addEventListener('mouseleave', () => {
    if (!isCallActive) {
      orbBtn.style.transform = '';
      orbBtn.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)';
    }
  });

  // Event: Call started
  vapiInstance.on('call-start', () => {
    console.log('[RuneWizz] Call started');
    isCallActive = true;
    statusEl.textContent = '🎤 Listening...';
    statusEl.style.color = '#00ff88';
    hintEl.textContent = 'Click orb to end call';
    animateOrb(orbBtn, true);
    orbBtn.innerHTML = '<img src="src/assets/crystal-ball-blue.png" alt="Crystal Ball" style="width: 100%; height: 100%; object-fit: contain;">';
  });

  // Event: Call ended
  vapiInstance.on('call-end', () => {
    console.log('[RuneWizz] Call ended');
    isCallActive = false;
    isMuted = false;
    statusEl.textContent = 'Ready to listen...';
    statusEl.style.color = 'var(--color-gold)';
    hintEl.textContent = 'Click the orb to begin';
    animateOrb(orbBtn, false);
    orbBtn.innerHTML = '<img src="src/assets/crystal-ball-blue.png" alt="Crystal Ball" style="width: 100%; height: 100%; object-fit: contain;">';
  });

  // Event: Speech start
  vapiInstance.on('speech-start', () => {
    console.log('[RuneWizz] Speech started');
    statusEl.textContent = '🗣️ Speaking...';
    orbPulse(orbBtn, '#FFA500');
  });

  // Event: Speech end
  vapiInstance.on('speech-end', () => {
    console.log('[RuneWizz] Speech ended');
    statusEl.textContent = '🎤 Listening...';
    orbPulse(orbBtn, '#FFD700');
  });

  // Event: Volume level
  vapiInstance.on('volume-level', (volume) => {
    updateOrbSize(orbBtn, volume);
  });

  // Event: Messages (transcripts, tool calls, etc)
  vapiInstance.on('message', (message) => {
    console.log('[RuneWizz] Message:', message);
  });

  // Event: Error
  vapiInstance.on('error', (error) => {
    console.error('[RuneWizz] Error:', error);
    statusEl.textContent = `❌ Error`;
    statusEl.style.color = '#ff4444';
    hintEl.textContent = error.message || 'Unknown error';
  });

  // Orb click handler - toggle call
  orbBtn.addEventListener('click', async () => {
    if (isCallActive) {
      // Stop the call
      vapiInstance.stop();
    } else {
      // Start the call
      try {
        statusEl.textContent = '⚡ Initializing...';
        hintEl.textContent = 'Summoning mystical powers...';
        
        // Create assistant with current OS context
        const assistant = createAssistantWithContext();
        
        console.log('[RuneWizz] Starting with inline assistant configuration');
        await vapiInstance.start(assistant);
        
      } catch (error) {
        console.error('[RuneWizz] Failed to start:', error);
        statusEl.textContent = `❌ Failed to start`;
        statusEl.style.color = '#ff4444';
        hintEl.textContent = error.message || 'Unknown error';
      }
    }
  });
}

/**
 * Animate orb
 */
function animateOrb(orb, active) {
  if (active) {
    orb.style.animation = 'orbPulse 2s ease-in-out infinite';
    orb.style.boxShadow = '0 0 80px rgba(255, 215, 0, 0.9), inset 0 0 50px rgba(255, 215, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3)';
    orb.style.borderColor = 'rgba(255, 215, 0, 0.9)';
  } else {
    orb.style.animation = '';
    orb.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)';
    orb.style.borderColor = 'rgba(255, 215, 0, 0.6)';
  }
}

/**
 * Pulse orb with color
 */
function orbPulse(orb, color) {
  const originalBorder = orb.style.borderColor;
  const originalShadow = orb.style.boxShadow;
  
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 100px ${color}, inset 0 0 60px ${color}, 0 8px 32px rgba(0, 0, 0, 0.3)`;
  
  setTimeout(() => {
    orb.style.borderColor = originalBorder;
    orb.style.boxShadow = originalShadow;
  }, 300);
}

/**
 * Update orb size based on volume
 */
function updateOrbSize(orb, volume) {
  const scale = 1 + (volume * 0.15);
  const currentTransform = orb.style.transform;
  if (!currentTransform || currentTransform === '') {
    orb.style.transform = `scale(${scale})`;
  }
}

// Add mystical animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes orbPulse {
    0%, 100% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.08);
      filter: brightness(1.2);
    }
  }
  
  .voice-orb:active {
    transform: scale(0.95) !important;
  }
`;
document.head.appendChild(style);
