/**
 * RuneWizz - Voice Agent for FantasyOS
 * Complete voice control for all OS operations
 */

import Vapi from '@vapi-ai/web';
import { createRuneWizzAssistant } from './assistant-config.js';
import { handleToolCall } from './tool-handlers.js';

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
    padding: 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: var(--color-text-light);
    font-family: var(--font-fantasy);
    overflow: hidden;
  `;

  // Header
  const header = document.createElement('div');
  header.className = 'rune-wizz-header';
  header.style.cssText = `
    text-align: center;
    margin-bottom: 2rem;
  `;
  header.innerHTML = `
    <h1 style="font-size: 2.5rem; margin: 0; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);">
      🧙‍♂️ RuneWizz
    </h1>
    <p style="margin: 0.5rem 0 0; color: var(--color-text-muted); font-size: 0.9rem;">
      Voice-Powered OS Control
    </p>
  `;

  // Voice visualizer
  const visualizer = document.createElement('div');
  visualizer.className = 'voice-visualizer';
  visualizer.id = 'voice-visualizer';
  visualizer.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
    position: relative;
  `;

  const orb = document.createElement('div');
  orb.className = 'voice-orb';
  orb.id = 'voice-orb';
  orb.style.cssText = `
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.1));
    border: 3px solid rgba(255, 215, 0, 0.6);
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.4), inset 0 0 40px rgba(255, 215, 0, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
  `;
  orb.innerHTML = '🔮';
  visualizer.appendChild(orb);

  // Status indicator
  const status = document.createElement('div');
  status.className = 'voice-status';
  status.id = 'voice-status';
  status.style.cssText = `
    text-align: center;
    margin: 1rem 0;
    font-size: 1.1rem;
    color: var(--color-accent);
    min-height: 2rem;
  `;
  status.textContent = 'Ready to listen...';

  // Controls
  const controls = document.createElement('div');
  controls.className = 'voice-controls';
  controls.style.cssText = `
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1.5rem 0;
  `;

  const startBtn = createButton('Start Voice', '▶️', 'start');
  const stopBtn = createButton('Stop', '⏹️', 'stop', true);
  const muteBtn = createButton('Mute', '🔇', 'mute', true);

  controls.appendChild(startBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(muteBtn);

  // Transcript area
  const transcriptArea = document.createElement('div');
  transcriptArea.className = 'transcript-area';
  transcriptArea.id = 'transcript-area';
  transcriptArea.style.cssText = `
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    overflow-y: auto;
    max-height: 200px;
    font-size: 0.9rem;
    color: var(--color-text-light);
  `;
  transcriptArea.innerHTML = '<div style="color: var(--color-text-muted); font-style: italic;">Transcript will appear here...</div>';

  // Capabilities info
  const capabilities = document.createElement('div');
  capabilities.className = 'capabilities-info';
  capabilities.style.cssText = `
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--color-text-muted);
  `;
  capabilities.innerHTML = `
    <strong style="color: var(--color-gold);">🎯 Voice Commands:</strong><br>
    • Window Management (open, close, minimize, restore, focus)<br>
    • App Control (launch any app, switch between apps)<br>
    • Settings (customize theme, background, particles)<br>
    • File Operations (create, delete, search files)<br>
    • Notifications (read, dismiss, manage)<br>
    • System Info (check time, date, weather)<br>
    • And much more...
  `;

  // Assemble UI
  container.appendChild(header);
  container.appendChild(visualizer);
  container.appendChild(status);
  container.appendChild(controls);
  container.appendChild(transcriptArea);
  container.appendChild(capabilities);

  // Initialize Vapi
  initializeVapi(startBtn, stopBtn, muteBtn, orb, status, transcriptArea);

  return container;
}

/**
 * Create a button with icon
 */
function createButton(label, icon, action, disabled = false) {
  const btn = document.createElement('button');
  btn.className = `voice-btn voice-btn-${action}`;
  btn.disabled = disabled;
  btn.style.cssText = `
    padding: 0.75rem 1.5rem;
    background: ${disabled ? 'rgba(100, 100, 100, 0.3)' : 'linear-gradient(135deg, #FFD700, #FFA500)'};
    color: ${disabled ? '#666' : '#1a1a2e'};
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    transition: all 0.3s ease;
    box-shadow: ${disabled ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.4)'};
    font-family: var(--font-fantasy);
  `;
  btn.innerHTML = `${icon} ${label}`;
  
  if (!disabled) {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
    });
  }

  return btn;
}

/**
 * Initialize Vapi instance and event handlers
 */
function initializeVapi(startBtn, stopBtn, muteBtn, orb, statusEl, transcriptEl) {
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error('[RuneWizz] VAPI_PUBLIC_KEY not found in environment');
    statusEl.textContent = '❌ Configuration Error: Missing API Key';
    statusEl.style.color = '#ff4444';
    return;
  }

  // Initialize Vapi client
  vapiInstance = new Vapi(publicKey);

  // Event: Call started
  vapiInstance.on('call-start', () => {
    console.log('[RuneWizz] Call started');
    isCallActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    muteBtn.disabled = false;
    statusEl.textContent = '🎤 Listening...';
    statusEl.style.color = '#00ff88';
    animateOrb(orb, true);
  });

  // Event: Call ended
  vapiInstance.on('call-end', () => {
    console.log('[RuneWizz] Call ended');
    isCallActive = false;
    isMuted = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    muteBtn.disabled = true;
    muteBtn.innerHTML = '🔇 Mute';
    statusEl.textContent = 'Ready to listen...';
    statusEl.style.color = 'var(--color-accent)';
    animateOrb(orb, false);
  });

  // Event: Speech start
  vapiInstance.on('speech-start', () => {
    console.log('[RuneWizz] Speech started');
    statusEl.textContent = '🗣️ Speaking...';
    orbPulse(orb, '#FFA500');
  });

  // Event: Speech end
  vapiInstance.on('speech-end', () => {
    console.log('[RuneWizz] Speech ended');
    statusEl.textContent = '🎤 Listening...';
    orbPulse(orb, '#FFD700');
  });

  // Event: Volume level
  vapiInstance.on('volume-level', (volume) => {
    updateOrbSize(orb, volume);
  });

  // Event: Messages (transcripts, tool calls, etc)
  vapiInstance.on('message', (message) => {
    console.log('[RuneWizz] Message:', message);
    handleMessage(message, transcriptEl);
  });

  // Event: Error
  vapiInstance.on('error', (error) => {
    console.error('[RuneWizz] Error:', error);
    statusEl.textContent = `❌ Error: ${error.message || 'Unknown error'}`;
    statusEl.style.color = '#ff4444';
    addTranscript(transcriptEl, 'system', `Error: ${error.message || 'Unknown error'}`);
  });

  // Button handlers
  startBtn.addEventListener('click', async () => {
    try {
      statusEl.textContent = '⚡ Initializing...';
      
      // Get assistant ID from environment variable
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      
      if (assistantId) {
        // Use assistant ID from dashboard
        console.log('[RuneWizz] Starting with assistant ID:', assistantId);
        await vapiInstance.start(assistantId);
      } else {
        // Fallback to inline assistant creation (but this may cause issues)
        console.warn('[RuneWizz] No VITE_VAPI_ASSISTANT_ID found, using inline assistant config');
        const assistant = await createRuneWizzAssistant();
        await vapiInstance.start(assistant);
      }
    } catch (error) {
      console.error('[RuneWizz] Failed to start:', error);
      statusEl.textContent = `❌ Failed to start: ${error.message}`;
      statusEl.style.color = '#ff4444';
    }
  });

  stopBtn.addEventListener('click', () => {
    vapiInstance.stop();
  });

  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    vapiInstance.setMuted(isMuted);
    muteBtn.innerHTML = isMuted ? '🔊 Unmute' : '🔇 Mute';
    statusEl.textContent = isMuted ? '🔇 Muted' : '🎤 Listening...';
  });

  // Orb click to toggle
  orb.addEventListener('click', () => {
    if (isCallActive) {
      vapiInstance.stop();
    } else {
      startBtn.click();
    }
  });
}

/**
 * Handle incoming messages from Vapi
 */
function handleMessage(message, transcriptEl) {
  switch (message.type) {
    case 'transcript':
      if (message.transcriptType === 'final') {
        const role = message.role === 'user' ? 'You' : 'RuneWizz';
        addTranscript(transcriptEl, message.role, `${role}: ${message.transcript}`);
      }
      break;
    
    case 'function-call':
    case 'tool-calls':
      // Handle tool calls locally
      handleToolCallsMessage(message, transcriptEl);
      break;
    
    case 'conversation-update':
      // Optional: update conversation history
      break;
  }
}

/**
 * Handle tool calls message
 */
async function handleToolCallsMessage(message, transcriptEl) {
  const toolCalls = message.toolCallList || message.functionCall ? [message.functionCall] : [];
  
  for (const toolCall of toolCalls) {
    try {
      addTranscript(transcriptEl, 'system', `🔧 Executing: ${toolCall.name || toolCall.function?.name}`);
      
      const result = await handleToolCall(toolCall);
      
      addTranscript(transcriptEl, 'system', `✅ ${result.message || 'Action completed'}`);
      
      // Send result back to Vapi if needed
      if (toolCall.id) {
        vapiInstance.send({
          type: 'add-message',
          message: {
            role: 'function',
            name: toolCall.name || toolCall.function?.name,
            content: JSON.stringify(result)
          }
        });
      }
    } catch (error) {
      console.error('[RuneWizz] Tool call failed:', error);
      addTranscript(transcriptEl, 'system', `❌ Failed: ${error.message}`);
    }
  }
}

/**
 * Add transcript entry
 */
function addTranscript(transcriptEl, role, text) {
  const entry = document.createElement('div');
  entry.style.cssText = `
    margin: 0.5rem 0;
    padding: 0.5rem;
    border-left: 3px solid ${role === 'user' ? '#00ff88' : role === 'system' ? '#FFD700' : '#9D7FF0'};
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  `;
  entry.textContent = text;
  
  // Remove placeholder if exists
  const placeholder = transcriptEl.querySelector('[style*="font-style: italic"]');
  if (placeholder) {
    placeholder.remove();
  }
  
  transcriptEl.appendChild(entry);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

/**
 * Animate orb
 */
function animateOrb(orb, active) {
  if (active) {
    orb.style.animation = 'pulse 2s infinite';
    orb.style.boxShadow = '0 0 80px rgba(255, 215, 0, 0.8), inset 0 0 60px rgba(255, 215, 0, 0.4)';
  } else {
    orb.style.animation = '';
    orb.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.4), inset 0 0 40px rgba(255, 215, 0, 0.2)';
  }
}

/**
 * Pulse orb with color
 */
function orbPulse(orb, color) {
  const originalBorder = orb.style.border;
  orb.style.border = `3px solid ${color}`;
  orb.style.boxShadow = `0 0 100px ${color}, inset 0 0 60px ${color}`;
  
  setTimeout(() => {
    orb.style.border = originalBorder;
    orb.style.boxShadow = '0 0 80px rgba(255, 215, 0, 0.8), inset 0 0 60px rgba(255, 215, 0, 0.4)';
  }, 300);
}

/**
 * Update orb size based on volume
 */
function updateOrbSize(orb, volume) {
  const scale = 1 + (volume * 0.3);
  orb.style.transform = `scale(${scale})`;
}

// Add pulse animation to document
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 80px rgba(255, 215, 0, 0.8), inset 0 0 60px rgba(255, 215, 0, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 120px rgba(255, 215, 0, 1), inset 0 0 80px rgba(255, 215, 0, 0.6);
    }
  }
`;
document.head.appendChild(style);
