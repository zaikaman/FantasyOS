# Research: Enchanted Realm Shell

**Purpose**: Resolve technical unknowns and document technology decisions for implementation  
**Date**: 2025-10-25  
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Research Tasks Completed

### 1. SQLite in Browser: sql.js vs IndexedDB

**Decision**: Use **sql.js** (WebAssembly SQLite) with IndexedDB as persistence layer

**Rationale**:
- **Relational modeling**: Files have relationships (tags, folders, metadata) that SQL handles elegantly vs IndexedDB key-value
- **Query capabilities**: SQL queries for filtering/searching files by type, name, date vs manual iteration in IndexedDB
- **Schema migrations**: Built-in ALTER TABLE support for evolving data model
- **Bundle size**: sql.js WASM binary is ~400KB gzipped, fits within 500KB budget
- **Persistence**: sql.js can export database to Uint8Array and store in IndexedDB for cross-session persistence
- **Performance**: In-memory SQLite operations are fast (<1ms for simple queries), batch writes to IndexedDB periodically

**Alternatives considered**:
- **Raw IndexedDB**: Lighter weight (~0KB bundle cost) but complex for relational queries, manual indexing, harder schema evolution
- **Dexie.js**: IndexedDB wrapper (~30KB) but still key-value model, doesn't provide SQL querying
- **LocalForage**: Abstraction over IndexedDB (~20KB) but same limitations as raw IndexedDB

**Best practices for sql.js**:
- Load WASM binary asynchronously on app init
- Use prepared statements to prevent SQL injection
- Batch INSERT/UPDATE operations in transactions for performance
- Export database to IndexedDB every 30 seconds or on window unload
- Use PRAGMA statements for performance tuning (journal_mode=MEMORY, synchronous=OFF for in-memory DB)

**References**:
- sql.js GitHub: https://github.com/sql-js/sql.js
- WebAssembly performance: ~80-95% of native C SQLite performance
- IndexedDB quota: Typically 50% of available disk space (Chrome), minimum 50MB

---

### 2. Canvas Particle System for Fireflies

**Decision**: Use **HTML5 Canvas 2D context** with requestAnimationFrame for particle animation

**Rationale**:
- **Performance**: Canvas 2D can handle 100-200 particles at 60 FPS on modern hardware
- **Bundle size**: Zero additional dependencies, native browser API
- **Flexibility**: Full control over particle physics (position, velocity, acceleration, fading)
- **Layering**: Canvas as background layer, HTML/CSS windows overlay on top

**Implementation approach**:
- Fullscreen canvas element with `position: fixed; z-index: 0` behind all content
- Particle pool (100 particles) with spawn rate of 2-3 per second
- Each particle: `{x, y, vx, vy, opacity, size, glowIntensity}`
- Update loop (60 FPS): Update positions, apply gravity/wind, fade out old particles
- Render loop: `clearRect()` → draw particles with `shadowBlur` for glow effect
- Use `globalCompositeOperation = 'lighter'` for additive blending (firefly glow)

**Performance optimizations**:
- Object pooling: Reuse particle objects instead of creating/destroying
- Dirty rectangle: Only redraw changed areas (not fullscreen clear)
- Reduce particles on low-FPS devices (detect FPS drop, reduce spawn rate)
- Use `will-change: transform` on canvas for GPU acceleration

**Alternatives considered**:
- **CSS animations**: Limited to pre-defined keyframes, can't do complex physics
- **WebGL/Three.js**: Overkill for 2D particles, adds 100KB+ to bundle
- **Lottie animations**: Static animations, no dynamic particle spawning

**Best practices**:
- Throttle particle spawning during window drag operations (maintain 60 FPS priority)
- Pause animation when tab is hidden (`document.visibilityState`)
- Use `OffscreenCanvas` in Web Worker if main thread becomes bottleneck (future optimization)

---

### 3. Window Drag & Resize with Native APIs

**Decision**: Use **native pointer events** (pointerdown, pointermove, pointerup) for cross-device support

**Rationale**:
- **Unified API**: Pointer events work for mouse, touch, and pen inputs
- **Performance**: Native browser handling, no library overhead
- **Precision**: `event.clientX/Y` provides exact cursor position for smooth dragging
- **No dependencies**: Avoids interact.js (~50KB) or similar libraries

**Implementation approach - Drag**:
```javascript
// On title bar pointerdown:
1. Store initial offset: offsetX = event.clientX - window.x, offsetY = event.clientY - window.y
2. Add document-level pointermove listener
3. On pointermove: window.x = event.clientX - offsetX, window.y = event.clientY - offsetY
4. Apply bounds checking (prevent dragging off-screen)
5. Update window.style.transform = `translate(${x}px, ${y}px)`
6. On pointerup: Remove pointermove listener

// Optimization: Use requestAnimationFrame to throttle updates to 60 FPS
```

**Implementation approach - Resize**:
```javascript
// On corner/edge pointerdown:
1. Determine resize direction (N, S, E, W, NE, NW, SE, SW)
2. Store initial dimensions and cursor position
3. On pointermove:
   - Calculate delta: dx = event.clientX - initialX, dy = event.clientY - initialY
   - Update width/height based on direction
   - Apply min/max constraints (min: 300x200, max: screen dimensions)
4. Update window.style.width/height
5. On pointerup: Remove listeners

// Use 8 invisible hit zones (10px wide) on edges/corners for resize cursors
```

**Performance optimizations**:
- Use CSS `transform` for positioning (GPU-accelerated) instead of `top/left`
- Debounce style updates with `requestAnimationFrame`
- Use `will-change: transform` during drag operation
- Disable pointer-events on window content during drag (prevent iframe mouse capture issues)

**Alternatives considered**:
- **Mouse events only**: Doesn't support touch devices
- **Touch events**: Separate implementation needed for mouse vs touch
- **Drag & Drop API**: Designed for file dragging, not window positioning
- **interact.js library**: Adds 50KB, provides features we don't need (snapping, gestures)

**Best practices**:
- Use `event.preventDefault()` to prevent text selection during drag
- Use `setPointerCapture()` to ensure events go to window even if cursor leaves bounds
- Provide visual feedback (cursor changes: move, ns-resize, ew-resize, nwse-resize, nesw-resize)

---

### 4. Global State Management (Reactivity)

**Decision**: Build **custom reactive state singleton** using Proxy and Observer pattern

**Rationale**:
- **Bundle size**: ~2KB custom solution vs 45KB (Redux) or 35KB (MobX)
- **Simplicity**: Single global state object, no actions/reducers/stores complexity
- **Reactivity**: JavaScript Proxy intercepts state mutations, notifies subscribers
- **Appropriate scale**: 3 applications, 20 windows max - not complex enough to need full state management library

**Implementation approach**:
```javascript
// state.js
const state = {
  windows: [],           // [{id, x, y, width, height, zIndex, appId, minimized}]
  apps: [],              // [{id, name, icon, component}]
  files: [],             // [{id, name, type, content, createdAt, modifiedAt}]
  notifications: [],     // [{id, text, timestamp, read}]
  activeWindowId: null,
  nextZIndex: 1000
};

const subscribers = new Map(); // key: path, value: Set of callbacks

const stateProxy = new Proxy(state, {
  set(target, prop, value) {
    target[prop] = value;
    notify(prop, value); // Trigger all subscribers for this path
    return true;
  }
});

function subscribe(path, callback) {
  if (!subscribers.has(path)) subscribers.set(path, new Set());
  subscribers.get(path).add(callback);
  return () => subscribers.get(path).delete(callback); // Return unsubscribe function
}

export { stateProxy as state, subscribe };
```

**Usage example**:
```javascript
// In window-manager.js
subscribe('windows', (newWindows) => {
  // Re-render window list
});

// Mutating state triggers reactivity
state.windows.push(newWindow); // Subscribers notified
```

**Performance optimizations**:
- Batch notifications using microtask queue (`Promise.resolve().then()`)
- Unsubscribe when components unmount to prevent memory leaks
- Use shallow comparison for array/object changes (avoid unnecessary re-renders)

**Alternatives considered**:
- **Redux**: 45KB, overkill for small app, complex boilerplate
- **MobX**: 35KB, simpler than Redux but still adds significant bundle weight
- **Zustand**: 13KB (smallest state library), but still unnecessary for our scale
- **Vue reactivity system**: Could extract Vue 3's reactivity core (~10KB) but adds complexity

**Best practices**:
- Keep state normalized (e.g., windows array, not nested in apps)
- Use immutable updates for arrays/objects (spread operator) to ensure Proxy triggers
- Validate state mutations in development mode (e.g., ensure window IDs are unique)

---

### 5. Inline SVG Assets as JavaScript Modules

**Decision**: Store SVG markup as **JavaScript template literals** exported from modules

**Rationale**:
- **Zero HTTP requests**: SVG code bundled in JavaScript, no separate asset files
- **Tree-shaking**: Vite can eliminate unused SVG exports
- **Type safety**: Can add JSDoc comments for SVG parameters
- **Dynamic manipulation**: Easy to inject colors, sizes via template string interpolation
- **Bundle size**: SVG compresses well with gzip, minimal overhead

**Implementation approach**:
```javascript
// src/assets/runes/calculator.svg.js
export const calculatorRune = (color = '#FFD700', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="40" fill="${color}" filter="url(#glow)" opacity="0.8"/>
    <text x="50" y="60" text-anchor="middle" font-size="40" fill="#000">∑</text>
  </svg>
`;

// Usage in runes.js
import { calculatorRune } from '../assets/runes/calculator.svg.js';
const iconHTML = calculatorRune('#FFD700', 64);
element.innerHTML = iconHTML;
```

**SVG optimization**:
- Use SVGO to minify SVG markup before converting to JS (remove whitespace, simplify paths)
- Use `<defs>` for reusable gradients/filters (define once, reference multiple times)
- Prefer geometric shapes over complex paths (smaller file size)
- Use CSS classes for styling instead of inline attributes where possible

**Alternatives considered**:
- **External SVG files**: Requires HTTP requests, asset pipeline, cache management
- **Data URLs**: Base64 encoding adds 33% size overhead vs raw SVG
- **SVG sprites**: Single sprite file with `<use>` references - but still external HTTP request
- **Icon fonts**: Accessibility issues, limited styling, binary format (can't tree-shake unused icons)

**Best practices**:
- Keep SVG viewBox consistent (e.g., 0 0 100 100) for easy scaling
- Use semantic naming for SVG IDs (avoid conflicts when multiple SVGs on page)
- Add ARIA attributes for accessibility: `role="img"`, `aria-label="Mana Calculator"`
- Use CSS filters for glow effects instead of SVG filters (better performance)

---

### 6. Vite Build Configuration for <500KB Bundle

**Decision**: Aggressive Vite configuration with code splitting, minification, and compression

**Rationale**:
- **Vite features**: Built-in Rollup bundler with tree-shaking, minification, and code splitting
- **Performance**: Fast dev server with HMR, optimized production builds
- **Bundle analysis**: `rollup-plugin-visualizer` to identify large dependencies

**vite.config.js**:
```javascript
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    target: 'es2020',           // Modern browsers only (smaller polyfills)
    minify: 'terser',            // Aggressive minification
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-js': ['sql.js']   // Separate chunk for sql.js WASM (lazy load if needed)
        }
      }
    },
    chunkSizeWarningLimit: 500,  // Warn if chunk > 500KB
    sourcemap: false             // Disable sourcemaps in production (save size)
  },
  plugins: [
    visualizer({                 // Bundle size visualization
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

**Bundle size breakdown target**:
- sql.js WASM: ~400KB gzipped
- Application code (JS): ~50KB gzipped
- CSS: ~20KB gzipped
- Inline SVG assets: ~30KB gzipped
- **Total**: ~500KB gzipped

**Optimization strategies**:
- Tree-shaking: Import only used functions from sql.js (not entire library)
- Code splitting: Lazy load applications (Mana Calculator, Treasure Chest, Quest Log) on first launch
- CSS purging: Remove unused CSS classes (manual or with PurgeCSS)
- Compression: Enable Brotli compression on Vercel (better than gzip)

**Alternatives considered**:
- **Webpack**: More complex configuration, slower build times
- **Parcel**: Less control over bundle optimization
- **Rollup alone**: Vite provides better DX with dev server

**Best practices**:
- Use `import()` for lazy loading (code splitting)
- Avoid large dependencies (moment.js → use native Date, lodash → use native array methods)
- Measure bundle size in CI/CD (fail build if > 500KB)

---

### 7. AI Quest Notification Generation

**Decision**: Use **OpenAI GPT-4 API** with local fallback templates

**Rationale**:
- **Contextual relevance**: AI can generate unique notifications based on user actions (opened file, idle time, etc.)
- **Engagement**: Dynamic content keeps experience fresh vs static messages
- **Fallback strategy**: Pre-written templates if API fails (offline-first approach)
- **Cost**: Minimal API usage (1-2 requests per minute max), ~$0.01 per 1000 notifications

**Implementation approach**:
```javascript
// ai-generator.js
const FALLBACK_TEMPLATES = [
  "A mysterious energy stirs in the realm...",
  "The ancient tomes whisper secrets of old...",
  "Your mana reserves are at peak capacity!"
];

async function generateNotification(context) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'You are a mystical narrator in a fantasy desktop OS. Generate short (20 words max) quest notifications based on user actions. Use fantasy-themed language.'
        }, {
          role: 'user',
          content: `User action: ${context.action}. Generate a quest notification.`
        }],
        max_tokens: 50,
        temperature: 0.9
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.warn('AI generation failed, using fallback', error);
    return FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
  }
}
```

**Context triggers**:
- File saved: "You've sealed an ancient scroll in your treasure vault!"
- Window opened: "A new portal to knowledge has been summoned!"
- Idle 2 minutes: "The realm grows quiet... Perhaps a quest awaits?"
- Calculator used: "Mana calculations complete! The cosmic balance is maintained."

**Performance/cost optimizations**:
- Rate limiting: Max 1 API call per minute (queue requests)
- Caching: Store generated notifications in localStorage, reuse for similar contexts
- Timeout: 3 second API timeout, fallback to template on slow response
- Free tier: Use OpenAI free tier (first $5 credit) for development/testing

**Alternatives considered**:
- **Local LLM (ONNX)**: Too large for browser bundle (>100MB models)
- **Anthropic Claude**: Similar pricing to OpenAI, less mature API
- **Google Gemini**: Free tier available, but less consistent tone for fantasy content
- **Static templates only**: Works but less engaging, no contextual relevance

**Best practices**:
- Store API key in environment variables (not committed to git)
- Add user opt-in for AI features (privacy concern)
- Display "Generated by AI" disclaimer
- Monitor API usage and costs in production

---

## Summary of Decisions

| Component | Technology | Bundle Cost | Justification |
|-----------|-----------|-------------|---------------|
| **Build Tool** | Vite 5.x | 0KB (dev only) | Fast dev server, optimized production builds |
| **Persistence** | sql.js + IndexedDB | ~400KB | Relational queries, schema migrations |
| **Particles** | Canvas 2D API | 0KB | Native API, 60 FPS performance |
| **Drag/Resize** | Pointer Events | 0KB | Native API, cross-device support |
| **State** | Custom Proxy-based | ~2KB | Lightweight reactivity, no framework needed |
| **Assets** | Inline SVG (JS) | ~30KB | Zero HTTP requests, tree-shakable |
| **Testing** | Vitest + Playwright | 0KB (dev only) | Vite-native, fast E2E testing |
| **AI Notifications** | OpenAI API (optional) | ~5KB (API client) | Contextual content generation |
| **Total** | | **~437KB** | Within 500KB budget ✅ |

**Remaining budget**: ~63KB for additional features or optimizations

All research tasks completed. Ready for Phase 1 (Design & Contracts).
