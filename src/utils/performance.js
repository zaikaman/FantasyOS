/**
 * Performance Monitoring Utilities
 * Tracks FCP (First Contentful Paint) and FPS for the Enchanted Realm Shell.
 * Designed to meet <1.5s FCP and 30+ FPS targets.
 */

/**
 * Performance metrics storage
 */
const metrics = {
  fcp: null,
  fcpTimestamp: null,
  fps: {
    current: 0,
    avg: 0,
    min: Infinity,
    max: 0,
    samples: [],
    maxSamples: 60, // Track last 60 frames (~1 second at 60 FPS)
  },
  frameTime: {
    current: 0,
    avg: 0,
    min: Infinity,
    max: 0,
    samples: [],
    maxSamples: 60,
    isTracking: false,
    lastFrameStart: 0,
  },
  marks: new Map(),
  measures: new Map(),
};

/**
 * Initialize performance monitoring
 * Sets up FCP observer and prepares FPS tracking
 */
export function initPerformanceMonitoring() {
  // Mark app start
  mark('app-start');

  // Observe First Contentful Paint
  observeFCP();

  // Log initial page load metrics
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`[Performance] Page load: ${loadTime}ms`);
  }
}

/**
 * Observe First Contentful Paint (FCP) using PerformanceObserver
 * Target: <1.5s (1500ms)
 */
function observeFCP() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
          metrics.fcpTimestamp = Date.now();

          const isFast = entry.startTime < 1500;
          const status = isFast ? '✓' : '✗';
          const color = isFast ? 'color: green' : 'color: red';

          console.log(
            `%c[Performance] ${status} FCP: ${entry.startTime.toFixed(2)}ms (target: <1500ms)`,
            color
          );

          // Measure from app start to FCP
          measure('app-to-fcp', 'app-start');

          // Disconnect observer after first paint
          observer.disconnect();
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.warn('[Performance] PerformanceObserver not supported:', error);
  }
}

/**
 * Get FCP metric
 * @returns {number|null} FCP time in milliseconds, or null if not yet measured
 */
export function getFCP() {
  return metrics.fcp;
}

/**
 * Check if FCP meets the <1.5s target
 * @returns {boolean} true if FCP < 1500ms, false otherwise
 */
export function isFCPFast() {
  return metrics.fcp !== null && metrics.fcp < 1500;
}

/**
 * Start FPS monitoring
 * Call this when starting animations (e.g., particle system)
 */
export function startFPSMonitoring() {
  metrics.fps.lastFrameTime = performance.now();
  metrics.fps.frameCount = 0;
  metrics.fps.samples = [];
  metrics.fps.min = Infinity;
  metrics.fps.max = 0;

  mark('fps-monitoring-start');
  console.log('[Performance] FPS monitoring started (target: 30+ FPS)');
}

/**
 * Update FPS calculation
 * Call this every frame in your animation loop
 * @returns {number} Current FPS
 */
export function updateFPS() {
  const now = performance.now();
  const delta = now - (metrics.fps.lastFrameTime || now);
  metrics.fps.lastFrameTime = now;

  if (delta > 0) {
    const currentFPS = 1000 / delta;
    metrics.fps.current = currentFPS;

    // Update min/max
    if (currentFPS < metrics.fps.min) metrics.fps.min = currentFPS;
    if (currentFPS > metrics.fps.max) metrics.fps.max = currentFPS;

    // Add to samples (rolling window)
    metrics.fps.samples.push(currentFPS);
    if (metrics.fps.samples.length > metrics.fps.maxSamples) {
      metrics.fps.samples.shift();
    }

    // Calculate average
    const sum = metrics.fps.samples.reduce((acc, val) => acc + val, 0);
    metrics.fps.avg = sum / metrics.fps.samples.length;

    // Increment frame count
    metrics.fps.frameCount = (metrics.fps.frameCount || 0) + 1;

    // Warn if FPS drops below 30
    if (metrics.fps.avg < 30 && metrics.fps.samples.length >= 30) {
      console.warn(
        `[Performance] ⚠ Low FPS detected: ${metrics.fps.avg.toFixed(1)} FPS (target: 30+)`
      );
    }
  }

  return metrics.fps.current;
}

/**
 * Get current FPS metrics
 * @returns {Object} FPS stats (current, avg, min, max)
 */
export function getFPSMetrics() {
  return {
    current: Math.round(metrics.fps.current),
    avg: Math.round(metrics.fps.avg),
    min: metrics.fps.min === Infinity ? 0 : Math.round(metrics.fps.min),
    max: Math.round(metrics.fps.max),
    samples: metrics.fps.samples.length,
    frameCount: metrics.fps.frameCount || 0,
  };
}

/**
 * Check if FPS meets the 30+ target
 * @returns {boolean} true if average FPS >= 30
 */
export function isFPSGood() {
  return metrics.fps.avg >= 30;
}

/**
 * Log FPS summary to console
 */
export function logFPSSummary() {
  const stats = getFPSMetrics();
  const isGood = isFPSGood();
  const status = isGood ? '✓' : '✗';
  const color = isGood ? 'color: green' : 'color: orange';

  console.log(
    `%c[Performance] ${status} FPS: avg=${stats.avg}, min=${stats.min}, max=${stats.max} (${stats.frameCount} frames)`,
    color
  );
}

/**
 * Create a performance mark
 * @param {string} name - Mark name
 */
export function mark(name) {
  try {
    performance.mark(name);
    metrics.marks.set(name, performance.now());
  } catch (error) {
    console.warn(`[Performance] Failed to create mark "${name}":`, error);
  }
}

/**
 * Create a performance measure between two marks
 * @param {string} name - Measure name
 * @param {string} startMark - Start mark name
 * @param {string} [endMark] - End mark name (optional, defaults to now)
 * @returns {number|null} Duration in milliseconds
 */
export function measure(name, startMark, endMark) {
  try {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }

    const entries = performance.getEntriesByName(name, 'measure');
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      metrics.measures.set(name, duration);
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  } catch (error) {
    console.warn(`[Performance] Failed to measure "${name}":`, error);
  }
  return null;
}

/**
 * Get all performance metrics
 * @returns {Object} All collected metrics
 */
export function getAllMetrics() {
  return {
    fcp: metrics.fcp,
    fcpTimestamp: metrics.fcpTimestamp,
    fps: getFPSMetrics(),
    marks: Array.from(metrics.marks.entries()),
    measures: Array.from(metrics.measures.entries()),
  };
}

/**
 * Log all performance metrics to console
 */
export function logAllMetrics() {
  console.group('[Performance] Summary');
  console.log('FCP:', metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'not measured');
  console.log('FPS:', getFPSMetrics());
  console.log('Marks:', Array.from(metrics.marks.entries()));
  console.log('Measures:', Array.from(metrics.measures.entries()));
  console.groupEnd();
}

/**
 * Clear all performance metrics
 */
export function clearMetrics() {
  metrics.fcp = null;
  metrics.fcpTimestamp = null;
  metrics.fps = {
    current: 0,
    avg: 0,
    min: Infinity,
    max: 0,
    samples: [],
    maxSamples: 60,
  };
  metrics.marks.clear();
  metrics.measures.clear();

  try {
    performance.clearMarks();
    performance.clearMeasures();
  } catch (error) {
    console.warn('[Performance] Failed to clear performance entries:', error);
  }
}

/**
 * Enable/disable FPS display in dev mode
 * Creates a floating FPS counter overlay
 * @param {boolean} enable - Whether to show FPS counter
 */
export function showFPSCounter(enable = true) {
  const counterId = 'fps-counter-overlay';
  let counter = document.getElementById(counterId);

  if (enable && !counter) {
    counter = document.createElement('div');
    counter.id = counterId;
    counter.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 4px;
      z-index: 999999;
      pointer-events: none;
      min-width: 120px;
    `;
    document.body.appendChild(counter);

    // Update every frame
    const updateCounter = () => {
      if (!document.getElementById(counterId)) return;

      const stats = getFPSMetrics();
      const color = stats.avg >= 30 ? '#0f0' : stats.avg >= 15 ? '#ff0' : '#f00';
      counter.style.color = color;
      counter.innerHTML = `
        FPS: ${stats.current}<br>
        Avg: ${stats.avg}<br>
        Min: ${stats.min} | Max: ${stats.max}
      `;

      requestAnimationFrame(updateCounter);
    };
    updateCounter();
  } else if (!enable && counter) {
    counter.remove();
  }
}

/**
 * Start frame time monitoring for drag/resize operations
 * Call this when starting a drag or resize operation
 * Target: <16ms per frame (60 FPS = 16.67ms per frame)
 */
export function startFrameTimeMonitoring() {
  metrics.frameTime.isTracking = true;
  metrics.frameTime.lastFrameStart = performance.now();
  metrics.frameTime.samples = [];
  metrics.frameTime.min = Infinity;
  metrics.frameTime.max = 0;

  console.log('[Performance] Frame time monitoring started (target: <16ms per frame)');
}

/**
 * Update frame time measurement
 * Call this at the end of each frame in your drag/resize loop
 * @returns {number} Current frame time in milliseconds
 */
export function updateFrameTime() {
  if (!metrics.frameTime.isTracking) {
    return 0;
  }

  const now = performance.now();
  const frameTime = now - metrics.frameTime.lastFrameStart;
  metrics.frameTime.lastFrameStart = now;

  metrics.frameTime.current = frameTime;

  // Update min/max
  if (frameTime < metrics.frameTime.min) metrics.frameTime.min = frameTime;
  if (frameTime > metrics.frameTime.max) metrics.frameTime.max = frameTime;

  // Add to samples (rolling window)
  metrics.frameTime.samples.push(frameTime);
  if (metrics.frameTime.samples.length > metrics.frameTime.maxSamples) {
    metrics.frameTime.samples.shift();
  }

  // Calculate average
  const sum = metrics.frameTime.samples.reduce((acc, val) => acc + val, 0);
  metrics.frameTime.avg = sum / metrics.frameTime.samples.length;

  // Warn if frame time exceeds 16ms (60 FPS threshold)
  if (frameTime > 16 && metrics.frameTime.samples.length >= 10) {
    console.warn(
      `[Performance] ⚠ Slow frame detected: ${frameTime.toFixed(2)}ms (target: <16ms)`
    );
  }

  return frameTime;
}

/**
 * Stop frame time monitoring
 */
export function stopFrameTimeMonitoring() {
  if (!metrics.frameTime.isTracking) {
    return;
  }

  metrics.frameTime.isTracking = false;

  // Log summary
  const stats = getFrameTimeMetrics();
  const isGood = stats.avg < 16;
  const status = isGood ? '✓' : '✗';
  const color = isGood ? 'color: green' : 'color: orange';

  console.log(
    `%c[Performance] ${status} Frame time: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms (${stats.samples} frames)`,
    color
  );
}

/**
 * Get current frame time metrics
 * @returns {Object} Frame time stats
 */
export function getFrameTimeMetrics() {
  return {
    current: metrics.frameTime.current.toFixed(2),
    avg: metrics.frameTime.avg,
    min: metrics.frameTime.min === Infinity ? 0 : metrics.frameTime.min,
    max: metrics.frameTime.max,
    samples: metrics.frameTime.samples.length,
    isTracking: metrics.frameTime.isTracking,
  };
}

/**
 * Check if frame time meets the <16ms target
 * @returns {boolean} true if average frame time < 16ms
 */
export function isFrameTimeGood() {
  return metrics.frameTime.avg < 16;
}

