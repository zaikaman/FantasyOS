/**
 * Particle System
 * Canvas 2D firefly animation with 60 FPS target
 */

import { startFPSMonitoring, updateFPS, logFPSSummary } from '../utils/performance.js';

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
    this.opacity = Math.random() * 0.5 + 0.3; // 0.3 - 0.8
    this.glowIntensity = Math.random() * 0.5 + 0.5; // 0.5 - 1.0
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

    // Draw glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, PARTICLE_GLOW_RADIUS * this.glowIntensity);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${this.opacity})`);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${this.opacity * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, PARTICLE_GLOW_RADIUS * this.glowIntensity, 0, Math.PI * 2);
    ctx.fill();

    // Draw core
    ctx.fillStyle = `rgba(255, 255, 200, ${this.opacity})`;
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

    for (const particle of particles) {
      if (!particle.active && spawned < particlesToSpawn) {
        particle.reset();
        spawned++;
      }

      if (spawned >= particlesToSpawn) {
        break;
      }
    }

    lastSpawnTime = currentTime;
  }
}

/**
 * Set particle density (update particle count)
 * @param {number} count - New particle count
 */
export function setParticleDensity(count) {
  const newCount = Math.max(50, Math.min(200, count));

  if (newCount > particles.length) {
    // Add more particles
    const toAdd = newCount - particles.length;
    for (let i = 0; i < toAdd; i++) {
      const particle = new Particle();
      particle.active = false;
      particles.push(particle);
    }
  } else if (newCount < particles.length) {
    // Remove particles
    particles = particles.slice(0, newCount);
  }

  console.log('[Particles] Density set to', newCount);
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
