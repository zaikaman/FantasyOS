/**
 * Meditation Chamber
 * A mystical Pomodoro timer and focus app with ambient sounds
 */

import { eventBus, Events } from '../../core/event-bus.js';
import { showAlert, showConfirm } from '../../utils/modal.js';

let containerEl = null;
let timerInterval = null;
let currentMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let timeRemaining = 25 * 60; // seconds
let isRunning = false;
let completedSessions = 0;
let currentAmbientSound = 'silence';
let audioContext = null;
let ambientOscillator = null;
let ambientGainNode = null;

// Timer presets (in minutes)
const PRESETS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

// Ambient sounds configuration
const AMBIENT_SOUNDS = {
  forest: { name: '🌲 Enchanted Forest', description: 'Mystical forest whispers' },
  rain: { name: '🌧️ Arcane Rain', description: 'Soothing rain on ancient stones' },
  fire: { name: '🔥 Crackling Hearth', description: 'Warm fireplace sounds' },
  wind: { name: '🌬️ Mountain Winds', description: 'Gentle mountain breeze' },
  ocean: { name: '🌊 Mystic Waves', description: 'Calming ocean rhythms' },
  silence: { name: '🔇 Sacred Silence', description: 'Pure quiet meditation' }
};

/**
 * Create Meditation Chamber app
 * @returns {HTMLElement} App container
 */
export function createMeditationChamberApp() {
  console.log('[MeditationChamber] Initializing sacred space...');
  
  containerEl = document.createElement('div');
  containerEl.className = 'meditation-chamber-container';
  
  render();
  
  console.log('[MeditationChamber] Sacred space ready for meditation!');
  return containerEl;
}

/**
 * Render the main app interface
 */
function render() {
  containerEl.innerHTML = `
    <div class="meditation-header">
      <h2 class="meditation-title">🕉️ Meditation Chamber</h2>
      <div class="session-counter">
        <span class="counter-label">Sessions Completed:</span>
        <span class="counter-value" id="session-count">0</span>
      </div>
    </div>

    <div class="meditation-workspace">
      <!-- Timer Display -->
      <div class="timer-container">
        <div class="timer-circle" id="timer-circle">
          <svg class="timer-progress" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" class="progress-bg" />
            <circle cx="100" cy="100" r="90" class="progress-bar" id="progress-bar" />
          </svg>
          <div class="timer-content">
            <div class="timer-mode" id="timer-mode">Focus Time</div>
            <div class="timer-display" id="timer-display">25:00</div>
            <div class="timer-status" id="timer-status">Ready to begin</div>
          </div>
        </div>
        
        <!-- Floating Particles -->
        <div class="meditation-particles" id="meditation-particles"></div>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button class="btn-timer btn-start" id="btn-start" title="Start Meditation">
          ▶ Start
        </button>
        <button class="btn-timer btn-pause" id="btn-pause" title="Pause" style="display: none;">
          ⏸ Pause
        </button>
        <button class="btn-timer btn-reset" id="btn-reset" title="Reset Timer">
          ↻ Reset
        </button>
      </div>

      <!-- Mode Selection -->
      <div class="mode-selector">
        <button class="btn-mode active" data-mode="focus" id="mode-focus">
          <div class="mode-icon">⏱️</div>
          <div class="mode-label">Focus</div>
          <div class="mode-duration">25 min</div>
        </button>
        <button class="btn-mode" data-mode="shortBreak" id="mode-short">
          <div class="mode-icon">☕</div>
          <div class="mode-label">Short Break</div>
          <div class="mode-duration">5 min</div>
        </button>
        <button class="btn-mode" data-mode="longBreak" id="mode-long">
          <div class="mode-icon">🌙</div>
          <div class="mode-label">Long Break</div>
          <div class="mode-duration">15 min</div>
        </button>
      </div>

      <!-- Settings Panel -->
      <div class="settings-panel">
        <h3 class="panel-title">⚙️ Sacred Settings</h3>
        
        <!-- Custom Durations -->
        <div class="setting-group">
          <label class="setting-label">Custom Durations (minutes)</label>
          <div class="duration-inputs">
            <div class="duration-input-group">
              <label>Focus:</label>
              <input type="number" id="input-focus" min="1" max="120" value="25" />
            </div>
            <div class="duration-input-group">
              <label>Short Break:</label>
              <input type="number" id="input-short" min="1" max="60" value="5" />
            </div>
            <div class="duration-input-group">
              <label>Long Break:</label>
              <input type="number" id="input-long" min="1" max="60" value="15" />
            </div>
          </div>
        </div>

        <!-- Ambient Sounds -->
        <div class="setting-group">
          <label class="setting-label">Ambient Sounds</label>
          <div class="sound-grid" id="sound-grid">
            ${Object.entries(AMBIENT_SOUNDS).map(([key, sound]) => `
              <button class="btn-sound ${key === 'silence' ? 'active' : ''}" data-sound="${key}">
                <div class="sound-icon">${sound.name.split(' ')[0]}</div>
                <div class="sound-name">${sound.name.split(' ').slice(1).join(' ')}</div>
              </button>
            `).join('')}
          </div>
          <div class="sound-description" id="sound-description">
            ${AMBIENT_SOUNDS.silence.description}
          </div>
        </div>

        <!-- Auto-start Settings -->
        <div class="setting-group">
          <label class="setting-checkbox">
            <input type="checkbox" id="auto-start-breaks" />
            <span>Auto-start breaks</span>
          </label>
          <label class="setting-checkbox">
            <input type="checkbox" id="auto-start-focus" />
            <span>Auto-start focus sessions</span>
          </label>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
  updateTimerDisplay();
  createMeditationParticles();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  const btnStart = containerEl.querySelector('#btn-start');
  const btnPause = containerEl.querySelector('#btn-pause');
  const btnReset = containerEl.querySelector('#btn-reset');
  
  // Control buttons
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);
  
  // Mode buttons
  containerEl.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });
  
  // Sound buttons
  containerEl.querySelectorAll('.btn-sound').forEach(btn => {
    btn.addEventListener('click', () => selectSound(btn.dataset.sound));
  });
  
  // Duration inputs
  ['focus', 'short', 'long'].forEach(mode => {
    const input = containerEl.querySelector(`#input-${mode}`);
    input.addEventListener('change', () => updateCustomDuration(mode, input.value));
  });
}

/**
 * Start the timer
 */
function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  updateControlButtons();
  updateTimerStatus('Meditating...');
  
  // Start particle animation
  containerEl.querySelector('#meditation-particles').classList.add('active');
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    
    if (timeRemaining <= 0) {
      completeSession();
      return;
    }
    
    updateTimerDisplay();
  }, 1000);
  
  // Play ambient sound
  playAmbientSound();
}

/**
 * Pause the timer
 */
function pauseTimer() {
  if (!isRunning) return;
  
  isRunning = false;
  updateControlButtons();
  updateTimerStatus('Paused');
  
  // Pause particles
  containerEl.querySelector('#meditation-particles').classList.remove('active');
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Stop ambient sound
  stopAmbientSound();
}

/**
 * Reset the timer
 */
async function resetTimer() {
  if (isRunning) {
    const confirmed = await showConfirm(
      'Are you sure you want to reset the current session?',
      '⚠️ Reset Timer'
    );
    if (!confirmed) return;
  }
  
  pauseTimer();
  timeRemaining = PRESETS[currentMode] * 60;
  updateTimerDisplay();
  updateTimerStatus('Ready to begin');
  
  // Reset particles
  containerEl.querySelector('#meditation-particles').classList.remove('active');
}

/**
 * Complete a session
 */
function completeSession() {
  pauseTimer();
  
  if (currentMode === 'focus') {
    completedSessions++;
    updateSessionCounter();
    
    // Play completion sound effect
    playCompletionSound();
    
    // Show notification
    showNotification(
      'Focus Session Complete! 🎉',
      'Time for a well-deserved break.'
    );
    
    // Auto-switch to break
    const autoStartBreaks = containerEl.querySelector('#auto-start-breaks').checked;
    const nextMode = completedSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
    
    switchMode(nextMode);
    
    if (autoStartBreaks) {
      setTimeout(() => startTimer(), 2000);
    }
  } else {
    // Break complete
    playCompletionSound();
    
    showNotification(
      'Break Complete! 💪',
      'Ready to focus again?'
    );
    
    switchMode('focus');
    
    const autoStartFocus = containerEl.querySelector('#auto-start-focus').checked;
    if (autoStartFocus) {
      setTimeout(() => startTimer(), 2000);
    }
  }
}

/**
 * Switch timer mode
 */
function switchMode(mode) {
  if (isRunning) {
    pauseTimer();
  }
  
  currentMode = mode;
  timeRemaining = PRESETS[mode] * 60;
  
  // Update active button
  containerEl.querySelectorAll('.btn-mode').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  // Update mode display
  const modeNames = {
    focus: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  };
  
  containerEl.querySelector('#timer-mode').textContent = modeNames[mode];
  updateTimerDisplay();
  updateTimerStatus('Ready to begin');
  
  // Update timer circle color
  const colors = {
    focus: '#4a9eff',
    shortBreak: '#90ee90',
    longBreak: '#9d7ff0'
  };
  
  const progressBar = containerEl.querySelector('#progress-bar');
  progressBar.style.stroke = colors[mode];
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const displayEl = containerEl.querySelector('#timer-display');
  if (displayEl) {
    displayEl.textContent = display;
  }
  
  // Update progress circle
  updateProgressCircle();
}

/**
 * Update progress circle
 */
function updateProgressCircle() {
  const totalTime = PRESETS[currentMode] * 60;
  const progress = (totalTime - timeRemaining) / totalTime;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const offset = circumference * (1 - progress);
  
  const progressBar = containerEl.querySelector('#progress-bar');
  if (progressBar) {
    progressBar.style.strokeDasharray = circumference;
    progressBar.style.strokeDashoffset = offset;
  }
}

/**
 * Update control buttons
 */
function updateControlButtons() {
  const btnStart = containerEl.querySelector('#btn-start');
  const btnPause = containerEl.querySelector('#btn-pause');
  
  if (isRunning) {
    btnStart.style.display = 'none';
    btnPause.style.display = 'block';
  } else {
    btnStart.style.display = 'block';
    btnPause.style.display = 'none';
  }
}

/**
 * Update timer status text
 */
function updateTimerStatus(status) {
  const statusEl = containerEl.querySelector('#timer-status');
  if (statusEl) {
    statusEl.textContent = status;
  }
}

/**
 * Update session counter
 */
function updateSessionCounter() {
  const counterEl = containerEl.querySelector('#session-count');
  if (counterEl) {
    counterEl.textContent = completedSessions;
    
    // Animate counter
    counterEl.style.transform = 'scale(1.3)';
    setTimeout(() => {
      counterEl.style.transform = 'scale(1)';
    }, 300);
  }
}

/**
 * Select ambient sound
 */
function selectSound(soundKey) {
  currentAmbientSound = soundKey;
  
  // Update active button
  containerEl.querySelectorAll('.btn-sound').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sound === soundKey);
  });
  
  // Update description
  const descEl = containerEl.querySelector('#sound-description');
  if (descEl) {
    descEl.textContent = AMBIENT_SOUNDS[soundKey].description;
  }
  
  // If timer is running, switch sound immediately
  if (isRunning) {
    stopAmbientSound();
    playAmbientSound();
  }
}

/**
 * Update custom duration
 */
function updateCustomDuration(mode, value) {
  const minutes = parseInt(value, 10);
  if (isNaN(minutes) || minutes < 1) return;
  
  const modeMap = {
    focus: 'focus',
    short: 'shortBreak',
    long: 'longBreak'
  };
  
  const targetMode = modeMap[mode];
  PRESETS[targetMode] = minutes;
  
  // Update button label
  const btn = containerEl.querySelector(`#mode-${mode === 'focus' ? 'focus' : mode === 'short' ? 'short' : 'long'}`);
  const durationEl = btn.querySelector('.mode-duration');
  if (durationEl) {
    durationEl.textContent = `${minutes} min`;
  }
  
  // If this is the current mode and timer is not running, update time
  if (targetMode === currentMode && !isRunning) {
    timeRemaining = minutes * 60;
    updateTimerDisplay();
  }
}

/**
 * Initialize audio context
 */
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play ambient sound
 */
function playAmbientSound() {
  if (currentAmbientSound === 'silence') return;
  
  stopAmbientSound(); // Stop any existing sound first
  
  const ctx = initAudioContext();
  
  console.log(`[MeditationChamber] Playing ambient sound: ${currentAmbientSound}`);
  
  // Create ambient sound based on selection
  switch (currentAmbientSound) {
    case 'forest':
      playForestSound(ctx);
      break;
    case 'rain':
      playRainSound(ctx);
      break;
    case 'fire':
      playFireSound(ctx);
      break;
    case 'wind':
      playWindSound(ctx);
      break;
    case 'ocean':
      playOceanSound(ctx);
      break;
  }
}

/**
 * Play forest ambient sound
 */
function playForestSound(ctx) {
  // Create a gentle wind-like sound with birds
  ambientOscillator = ctx.createOscillator();
  ambientGainNode = ctx.createGain();
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  ambientOscillator.type = 'sine';
  ambientOscillator.frequency.value = 200;
  
  ambientGainNode.gain.value = 0.03;
  
  ambientOscillator.connect(filter);
  filter.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);
  
  ambientOscillator.start();
  
  // Random bird chirps
  setInterval(() => {
    if (isRunning && currentAmbientSound === 'forest') {
      playBirdChirp(ctx);
    }
  }, 3000 + Math.random() * 5000);
}

/**
 * Play bird chirp
 */
function playBirdChirp(ctx) {
  const chirp = ctx.createOscillator();
  const chirpGain = ctx.createGain();
  
  chirp.type = 'sine';
  chirp.frequency.setValueAtTime(2000, ctx.currentTime);
  chirp.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
  
  chirpGain.gain.setValueAtTime(0.05, ctx.currentTime);
  chirpGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  chirp.connect(chirpGain);
  chirpGain.connect(ctx.destination);
  
  chirp.start(ctx.currentTime);
  chirp.stop(ctx.currentTime + 0.1);
}

/**
 * Play rain ambient sound
 */
function playRainSound(ctx) {
  // White noise for rain
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  ambientOscillator = ctx.createBufferSource();
  ambientOscillator.buffer = noiseBuffer;
  ambientOscillator.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;
  
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.1;
  
  ambientOscillator.connect(filter);
  filter.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);
  
  ambientOscillator.start();
}

/**
 * Play fire crackling sound
 */
function playFireSound(ctx) {
  // Noise with modulation for crackling
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  ambientOscillator = ctx.createBufferSource();
  ambientOscillator.buffer = noiseBuffer;
  ambientOscillator.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;
  filter.Q.value = 5;
  
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.05;
  
  ambientOscillator.connect(filter);
  filter.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);
  
  ambientOscillator.start();
}

/**
 * Play wind ambient sound
 */
function playWindSound(ctx) {
  // Low frequency oscillating noise
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  ambientOscillator = ctx.createBufferSource();
  ambientOscillator.buffer = noiseBuffer;
  ambientOscillator.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.06;
  
  // LFO for wind gusts
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.5;
  lfoGain.gain.value = 0.03;
  
  lfo.connect(lfoGain);
  lfoGain.connect(ambientGainNode.gain);
  
  ambientOscillator.connect(filter);
  filter.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);
  
  ambientOscillator.start();
  lfo.start();
}

/**
 * Play ocean waves sound
 */
function playOceanSound(ctx) {
  // Noise with low frequency modulation for waves
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  ambientOscillator = ctx.createBufferSource();
  ambientOscillator.buffer = noiseBuffer;
  ambientOscillator.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.08;
  
  // LFO for wave motion
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 0.04;
  
  lfo.connect(lfoGain);
  lfoGain.connect(ambientGainNode.gain);
  
  ambientOscillator.connect(filter);
  filter.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);
  
  ambientOscillator.start();
  lfo.start();
}

/**
 * Stop ambient sound
 */
function stopAmbientSound() {
  if (ambientOscillator) {
    try {
      ambientOscillator.stop();
    } catch (e) {
      // Already stopped
    }
    ambientOscillator = null;
  }
  
  if (ambientGainNode) {
    ambientGainNode = null;
  }
}

/**
 * Play completion sound effect (Singing Bowl / Bell)
 */
function playCompletionSound() {
  const ctx = initAudioContext();
  
  // Create a singing bowl / meditation bell sound
  const fundamentalFreq = 432; // Hz (healing frequency)
  const duration = 3;
  
  // Fundamental tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = fundamentalFreq;
  gain1.gain.setValueAtTime(0.3, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  // Harmonics
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = fundamentalFreq * 2;
  gain2.gain.setValueAtTime(0.15, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.value = fundamentalFreq * 3;
  gain3.gain.setValueAtTime(0.1, ctx.currentTime);
  gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  // Add reverb-like effect
  const convolver = ctx.createConvolver();
  const reverbBuffer = createReverbBuffer(ctx);
  convolver.buffer = reverbBuffer;
  
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 0.7;
  wetGain.gain.value = 0.3;
  
  // Connect fundamental
  osc1.connect(gain1);
  gain1.connect(dryGain);
  gain1.connect(convolver);
  
  // Connect harmonics
  osc2.connect(gain2);
  gain2.connect(dryGain);
  gain2.connect(convolver);
  
  osc3.connect(gain3);
  gain3.connect(dryGain);
  gain3.connect(convolver);
  
  // Connect to destination
  convolver.connect(wetGain);
  dryGain.connect(ctx.destination);
  wetGain.connect(ctx.destination);
  
  // Start all oscillators
  const startTime = ctx.currentTime;
  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  
  // Stop after duration
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
  osc3.stop(startTime + duration);
  
  console.log('[MeditationChamber] Playing completion bell');
}

/**
 * Create reverb buffer for bell sound
 */
function createReverbBuffer(ctx) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2; // 2 second reverb
  const buffer = ctx.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }
  
  return buffer;
}

/**
 * Create floating meditation particles
 */
function createMeditationParticles() {
  const particlesContainer = containerEl.querySelector('#meditation-particles');
  if (!particlesContainer) return;
  
  // Create 12 floating particles
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'meditation-particle';
    
    const size = Math.random() * 8 + 4;
    const delay = Math.random() * 4;
    const duration = Math.random() * 6 + 4;
    const angle = (i / 12) * 360;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.setProperty('--angle', `${angle}deg`);
    
    particlesContainer.appendChild(particle);
  }
}

/**
 * Show notification
 */
function showNotification(title, message) {
  eventBus.emit(Events.NOTIFICATION, {
    title: title,
    message: message,
    type: 'success',
    timestamp: Date.now()
  });
}

/**
 * Cleanup function
 */
export function destroyMeditationChamberApp() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  stopAmbientSound();
  
  console.log('[MeditationChamber] Sacred space closed');
}
