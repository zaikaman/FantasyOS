/**
 * Clock Bells - Procedural Audio
 * Web Audio API synthesis for clock tower chimes
 */

let audioContext = null;
let masterGain = null;

/**
 * Initialize audio context
 */
function initAudio() {
  if (audioContext) {
    return audioContext;
  }

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3; // Default volume (30%)
    masterGain.connect(audioContext.destination);

    console.log('[ClockBells] Audio context initialized');
    return audioContext;
  } catch (error) {
    console.error('[ClockBells] Failed to initialize audio context:', error);
    return null;
  }
}

/**
 * Resume audio context (required after user interaction)
 */
async function resumeAudioContext() {
  const ctx = initAudio();
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Play a single bell tone
 * @param {number} frequency - Base frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {number} delay - Delay before playing in seconds
 * @returns {Promise} Promise that resolves when the tone completes
 */
function playBellTone(frequency = 440, duration = 2.0, delay = 0) {
  return new Promise((resolve) => {
    const ctx = initAudio();
    if (!ctx) {
      resolve();
      return;
    }

    const now = ctx.currentTime + delay;

    // Create oscillators for bell harmonics
    // Bells have a complex harmonic structure
    const fundamentalOsc = ctx.createOscillator();
    const harmonic2Osc = ctx.createOscillator();
    const harmonic3Osc = ctx.createOscillator();
    const harmonic4Osc = ctx.createOscillator();

    // Set frequencies (bell harmonics are not perfect multiples)
    fundamentalOsc.frequency.value = frequency;
    harmonic2Osc.frequency.value = frequency * 2.4; // Slightly sharp 2nd harmonic
    harmonic3Osc.frequency.value = frequency * 3.2; // Bell-like 3rd harmonic
    harmonic4Osc.frequency.value = frequency * 4.8; // Higher harmonic

    // Use sine waves for cleaner bell sound
    fundamentalOsc.type = 'sine';
    harmonic2Osc.type = 'sine';
    harmonic3Osc.type = 'sine';
    harmonic4Osc.type = 'sine';

    // Create gain nodes for each oscillator
    const fundamentalGain = ctx.createGain();
    const harmonic2Gain = ctx.createGain();
    const harmonic3Gain = ctx.createGain();
    const harmonic4Gain = ctx.createGain();

    // Set initial gains (harmonic balance)
    fundamentalGain.gain.value = 0.8;
    harmonic2Gain.gain.value = 0.4;
    harmonic3Gain.gain.value = 0.2;
    harmonic4Gain.gain.value = 0.1;

    // Create envelope (attack-decay-sustain-release)
    const attackTime = 0.01;
    const decayTime = 0.3;
    const sustainLevel = 0.3;
    const releaseTime = duration - attackTime - decayTime;

    // Apply envelope to each harmonic
    [fundamentalGain, harmonic2Gain, harmonic3Gain, harmonic4Gain].forEach(gain => {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gain.gain.value, now + attackTime);
      gain.gain.exponentialRampToValueAtTime(
        gain.gain.value * sustainLevel, 
        now + attackTime + decayTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    });

    // Add subtle vibrato for more realistic bell sound
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5; // 5 Hz vibrato
    vibratoGain.gain.value = 2; // Subtle pitch variation
    vibrato.connect(vibratoGain);
    vibratoGain.connect(fundamentalOsc.frequency);

    // Create reverb effect using convolver (simple impulse response)
    const reverb = createSimpleReverb(ctx);

    // Connect oscillators to their gains
    fundamentalOsc.connect(fundamentalGain);
    harmonic2Osc.connect(harmonic2Gain);
    harmonic3Osc.connect(harmonic3Gain);
    harmonic4Osc.connect(harmonic4Gain);

    // Connect gains to reverb
    fundamentalGain.connect(reverb);
    harmonic2Gain.connect(reverb);
    harmonic3Gain.connect(reverb);
    harmonic4Gain.connect(reverb);

    // Connect reverb to master gain
    reverb.connect(masterGain);

    // Start oscillators
    fundamentalOsc.start(now);
    harmonic2Osc.start(now);
    harmonic3Osc.start(now);
    harmonic4Osc.start(now);
    vibrato.start(now);

    // Stop oscillators
    fundamentalOsc.stop(now + duration);
    harmonic2Osc.stop(now + duration);
    harmonic3Osc.stop(now + duration);
    harmonic4Osc.stop(now + duration);
    vibrato.stop(now + duration);

    // Resolve promise when done
    setTimeout(() => {
      resolve();
    }, (delay + duration) * 1000);
  });
}

/**
 * Create simple reverb effect
 * @param {AudioContext} ctx - Audio context
 * @returns {ConvolverNode} Reverb node
 */
function createSimpleReverb(ctx) {
  const convolver = ctx.createConvolver();
  
  // Create impulse response for reverb
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2; // 2 second reverb
  const impulse = ctx.createBuffer(2, length, sampleRate);
  
  const leftChannel = impulse.getChannelData(0);
  const rightChannel = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const decay = Math.exp(-i / (sampleRate * 0.5)); // Exponential decay
    leftChannel[i] = (Math.random() * 2 - 1) * decay;
    rightChannel[i] = (Math.random() * 2 - 1) * decay;
  }

  convolver.buffer = impulse;
  return convolver;
}

/**
 * Play clock tower chime sequence
 * @param {number} count - Number of chimes (1-12)
 */
export async function playChime(count = 1) {
  console.log(`[ClockBells] Playing ${count} chime(s)...`);

  // Resume audio context (required for user interaction policy)
  await resumeAudioContext();

  // Clamp count to 1-12
  const chimeCount = Math.max(1, Math.min(12, count));

  // Bell frequencies (pentatonic scale for variety)
  // C, D, E, G, A (in different octaves)
  const bellFrequencies = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00  // A5
  ];

  // Play each chime with delay
  const chimeDelay = 0.8; // Delay between chimes in seconds
  const chimeDuration = 2.5; // Duration of each chime

  for (let i = 0; i < chimeCount; i++) {
    // Alternate between high and low bells for variation
    const frequency = i % 2 === 0 ? bellFrequencies[0] : bellFrequencies[2];
    
    // Play the bell tone
    playBellTone(frequency, chimeDuration, i * chimeDelay);
  }

  console.log('[ClockBells] Chime sequence started');
}

/**
 * Play a single test chime
 */
export async function playTestChime() {
  console.log('[ClockBells] Playing test chime...');
  await resumeAudioContext();
  await playBellTone(523.25, 2.5, 0);
}

/**
 * Set master volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export function setVolume(volume) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
    console.log(`[ClockBells] Volume set to ${volume * 100}%`);
  }
}

/**
 * Mute/unmute bells
 * @param {boolean} muted - Whether to mute
 */
export function setMuted(muted) {
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.3;
    console.log(`[ClockBells] ${muted ? 'Muted' : 'Unmuted'}`);
  }
}

// Auto-initialize on first user interaction
document.addEventListener('click', resumeAudioContext, { once: true });
document.addEventListener('keydown', resumeAudioContext, { once: true });
