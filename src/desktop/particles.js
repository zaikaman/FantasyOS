/**
 * Particle System
 * Canvas 2D firefly animation with 60 FPS target
 */

import { startFPSMonitoring, updateFPS, logFPSSummary } from '../utils/performance.js';
import { eventBus } from '../core/event-bus.js';

const PARTICLE_COUNT = 100;
const PARTICLE_SPAWN_RATE = 2; // particles per second
const PARTICLE_LIFETIME = 10000; // 10 seconds
const PARTICLE_SIZE_MIN = 2;
const PARTICLE_SIZE_MAX = 4;
const PARTICLE_SPEED_MIN = 0.2;
const PARTICLE_SPEED_MAX = 0.8;
const PARTICLE_GLOW_RADIUS = 10;

let canvas = null;
let ctx = null;
let particles = [];
let animationFrameId = null;
let lastSpawnTime = 0;
let isRunning = false;
let maxActiveParticles = 100; // Track maximum allowed active particles

/**
 * Particle class
 */
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * (canvas?.width || window.innerWidth);
    this.y = Math.random() * (canvas?.height || window.innerHeight);
    this.vx = (Math.random() - 0.5) * PARTICLE_SPEED_MAX;
    this.vy = (Math.random() - 0.5) * PARTICLE_SPEED_MAX;
    this.size = PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN);
    this.opacity = Math.random() * 0.6 + 0.4; // 0.4 - 1.0 (increased visibility)
    this.glowIntensity = Math.random() * 0.5 + 0.6; // 0.6 - 1.1 (brighter glow)
    this.birthTime = Date.now();
    this.lifetime = PARTICLE_LIFETIME;
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) {
      return;
    }

    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Add subtle gravity and wind
    this.vy += 0.0001 * deltaTime; // Gentle downward drift
    this.vx += Math.sin(Date.now() / 1000) * 0.0002 * deltaTime; // Wavering wind

    // Wrap around screen edges
    if (this.x < 0) {
      this.x = canvas.width;
    }
    if (this.x > canvas.width) {
      this.x = 0;
    }
    if (this.y < 0) {
      this.y = canvas.height;
    }
    if (this.y > canvas.height) {
      this.y = 0;
    }

    // Fade out near end of lifetime
    const age = Date.now() - this.birthTime;
    if (age > this.lifetime * 0.8) {
      const fadeProgress = (age - this.lifetime * 0.8) / (this.lifetime * 0.2);
      this.opacity = Math.max(0, (0.8 - fadeProgress) * (Math.random() * 0.5 + 0.3));
    }

    // Deactivate if too old
    if (age > this.lifetime) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active || this.opacity <= 0) {
      return;
    }

    // Draw glow with golden mystical color
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, PARTICLE_GLOW_RADIUS * this.glowIntensity);
    gradient.addColorStop(0, `rgba(255, 215, 100, ${this.opacity})`);
    gradient.addColorStop(0.3, `rgba(255, 215, 100, ${this.opacity * 0.5})`);
    gradient.addColorStop(0.6, `rgba(93, 216, 237, ${this.opacity * 0.3})`);
    gradient.addColorStop(1, 'rgba(93, 216, 237, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, PARTICLE_GLOW_RADIUS * this.glowIntensity, 0, Math.PI * 2);
    ctx.fill();

    // Draw core with slight cyan tint
    ctx.fillStyle = `rgba(255, 255, 220, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Initialize particle system
 * @param {HTMLCanvasElement} canvasElement - Canvas element
 */
export function initParticles(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d', { alpha: true });

  // Set canvas size
  resizeCanvas();

  // Initialize particle pool
  particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

  // Start with some particles inactive for staggered spawn
  particles.forEach((particle, i) => {
    if (i > PARTICLE_COUNT / 2) {
      particle.active = false;
    }
  });

  // Handle window resize
  window.addEventListener('resize', resizeCanvas);

  // Listen for particle density changes
  eventBus.on('particles:density-changed', ({ density }) => {
    setParticleDensity(density);
  });

  console.log('[Particles] Initialized with', PARTICLE_COUNT, 'particles');
}

/**
 * Resize canvas to match window
 */
function resizeCanvas() {
  if (!canvas) {
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Start particle animation loop
 */
export function startParticles() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  lastSpawnTime = Date.now();
  
  // Start FPS monitoring
  startFPSMonitoring();
  
  animate();

  console.log('[Particles] Animation started');
}

/**
 * Stop particle animation loop
 */
export function stopParticles() {
  if (!isRunning) {
    return;
  }

  isRunning = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Log final FPS summary
  logFPSSummary();

  console.log('[Particles] Animation stopped');
}

/**
 * Animation loop
 */
let lastFrameTime = Date.now();

function animate() {
  if (!isRunning) {
    return;
  }

  // Update FPS metrics
  updateFPS();

  const currentTime = Date.now();
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Spawn new particles
  spawnParticles(currentTime);

  // Update and draw particles
  particles.forEach(particle => {
    particle.update(deltaTime);
    particle.draw();
  });

  // Schedule next frame
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Spawn new particles at configured rate
 * @param {number} currentTime - Current timestamp
 */
function spawnParticles(currentTime) {
  const timeSinceLastSpawn = currentTime - lastSpawnTime;
  const particlesToSpawn = Math.floor((timeSinceLastSpawn / 1000) * PARTICLE_SPAWN_RATE);

  if (particlesToSpawn > 0) {
    let spawned = 0;
    let activeCount = particles.filter(p => p.active).length;

    for (const particle of particles) {
      // Only spawn if we haven't reached the max active particle count
      if (!particle.active && spawned < particlesToSpawn && activeCount < maxActiveParticles) {
        particle.reset();
        spawned++;
        activeCount++;
      }

      if (spawned >= particlesToSpawn || activeCount >= maxActiveParticles) {
        break;
      }
    }

    lastSpawnTime = currentTime;
  }
}

/**
 * Set particle density (update particle count)
 * @param {number} density - Density percentage (0-100)
 */
export function setParticleDensity(density) {
  // Convert percentage (0-100) to actual particle count
  // 0% = 0 particles, 50% = 75 particles, 100% = 150 particles
  const percentage = Math.max(0, Math.min(100, density));
  const newCount = Math.floor((percentage / 100) * 150);

  // Update max active particles
  maxActiveParticles = newCount;

  if (newCount === 0) {
    // Deactivate all particles
    particles.forEach(p => p.active = false);
    console.log('[Particles] All particles deactivated (density: 0%)');
    return;
  }

  // Count currently active particles
  const activeCount = particles.filter(p => p.active).length;

  if (activeCount > newCount) {
    // Deactivate excess particles
    let deactivated = 0;
    for (const particle of particles) {
      if (particle.active && deactivated < (activeCount - newCount)) {
        particle.active = false;
        deactivated++;
      }
    }
  }

  // Ensure we have enough particle objects in the pool
  if (newCount > particles.length) {
    const toAdd = newCount - particles.length;
    for (let i = 0; i < toAdd; i++) {
      const particle = new Particle();
      particle.active = false;
      particles.push(particle);
    }
  }

  console.log(`[Particles] Density set to ${percentage}% (max ${newCount} particles, currently ${particles.filter(p => p.active).length} active)`);
}

/**
 * Toggle particle system on/off
 * @param {boolean} enabled - Enable or disable
 */
export function setParticlesEnabled(enabled) {
  if (enabled) {
    startParticles();
  } else {
    stopParticles();
    // Clear canvas
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

/**
 * Cleanup particle system
 */
export function destroyParticles() {
  stopParticles();
  particles = [];
  canvas = null;
  ctx = null;

  window.removeEventListener('resize', resizeCanvas);

  console.log('[Particles] Destroyed');
}
