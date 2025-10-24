# Quickstart: Enchanted Realm Shell Development

**Purpose**: Get developers up and running with the Enchanted Realm Shell codebase  
**Target Audience**: Frontend developers familiar with vanilla JavaScript, Vite, and browser APIs  
**Time to Complete**: 15-20 minutes

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ (v20 LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Git**: v2.30+ for version control
- **Modern Browser**: Chrome 90+, Firefox 88+, or Safari 14+
- **Code Editor**: VS Code recommended (with ESLint and Prettier extensions)

### Knowledge Requirements

- JavaScript ES6+ (modules, async/await, Proxy, Canvas API)
- HTML5 & CSS3 (flexbox, grid, CSS variables, transforms)
- Browser APIs (IndexedDB, requestAnimationFrame, Pointer Events)
- Basic SQL (for sql.js queries)

---

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/fantasy-os.git
cd fantasy-os

# Checkout the feature branch
git checkout 001-enchanted-realm-shell

# Install dependencies
npm install
```

### 2. Start Development Server

```bash
# Start Vite dev server with HMR
npm run dev
```

Visit `http://localhost:5173` in your browser. You should see the Enchanted Realm Shell desktop environment.

### 3. Verify Installation

You should see:
- ✅ Full-screen mossy background
- ✅ Animated fireflies (particles)
- ✅ Three glowing rune icons (Mana Calculator, Treasure Chest, Quest Log)
- ✅ Tavern sidebar on the right
- ✅ Welcome notification

---

## Project Structure Tour (10 Minutes)

### Directory Layout

```
fantasy-os/
├── index.html              # Entry point - full-viewport desktop container
├── package.json            # Dependencies: vite, sql.js, vitest, playwright
├── vite.config.js          # Build configuration (<500KB target)
│
├── src/
│   ├── main.js             # App initialization (database, desktop, particles)
│   │
│   ├── core/               # Global singletons
│   │   ├── state.js        # Reactive state with Proxy
│   │   ├── database.js     # sql.js wrapper + IndexedDB persistence
│   │   └── events.js       # Custom event bus
│   │
│   ├── desktop/            # Visual environment
│   │   ├── desktop.js      # Desktop manager (renders runes, handles clicks)
│   │   ├── particles.js    # Canvas firefly particle system
│   │   ├── background.js   # Mossy background renderer
│   │   └── runes.js        # Rune icon launcher system
│   │
│   ├── window/             # Window management
│   │   ├── window-manager.js  # Lifecycle, z-index, minimize/restore
│   │   ├── window.js       # Individual window component
│   │   ├── drag-handler.js # Pointer events for dragging
│   │   └── resize-handler.js  # Pointer events for resizing
│   │
│   ├── apps/               # Application registry
│   │   ├── app-registry.js # Register apps, create instances
│   │   ├── mana-calculator/
│   │   ├── treasure-chest/
│   │   └── quest-log/
│   │
│   ├── sidebar/            # Tavern sidebar
│   │   ├── tavern-sidebar.js  # Sidebar manager
│   │   ├── notifications.js   # Quest notification system
│   │   └── ai-generator.js    # AI notification generation
│   │
│   ├── storage/            # Persistence layer
│   │   ├── files.js        # File CRUD operations
│   │   ├── windows.js      # Window state persistence
│   │   └── migrations.js   # Database schema migrations
│   │
│   ├── utils/              # Shared utilities
│   │   ├── dom.js          # DOM helpers
│   │   ├── animations.js   # Animation utilities
│   │   └── performance.js  # Throttle/debounce/RAF
│   │
│   └── assets/             # Inline SVG assets
│       ├── runes/          # App rune icons
│       └── parchment/      # Window textures
│
├── styles/
│   ├── global.css          # CSS variables, resets, theme
│   ├── desktop.css         # Desktop styling
│   ├── window.css          # Window chrome
│   └── sidebar.css         # Tavern sidebar
│
└── tests/
    ├── unit/               # Jest/Vitest unit tests
    ├── integration/        # Integration tests
    └── e2e/                # Playwright E2E tests
```

### Key Files to Know

1. **`src/main.js`** - Application entry point
   - Initializes database (sql.js + IndexedDB)
   - Loads state from database
   - Renders desktop environment
   - Starts particle animation

2. **`src/core/state.js`** - Global reactive state
   - Proxy-based reactivity (subscribe to changes)
   - Manages windows, files, notifications, settings

3. **`src/window/window-manager.js`** - Window operations
   - Create, close, focus, minimize, restore
   - Z-index management
   - Position/size updates

4. **`src/core/database.js`** - Persistence
   - sql.js initialization
   - SQLite → IndexedDB export/import
   - Auto-save on state changes

5. **`src/desktop/particles.js`** - Firefly animation
   - Canvas 2D particle system
   - 60 FPS animation loop
   - Particle physics (position, velocity, fade)

---

## Common Development Tasks

### Task 1: Create a New Application

**Goal**: Add a new application to the desktop (e.g., "Spell Book")

**Steps**:

1. Create app directory and files:
```bash
mkdir -p src/apps/spell-book
touch src/apps/spell-book/spell-book.js
touch src/apps/spell-book/spell-book.css
```

2. Create the app component (`src/apps/spell-book/spell-book.js`):
```javascript
export function createSpellBook() {
  const container = document.createElement('div');
  container.className = 'spell-book-app';
  container.innerHTML = `
    <h1>Spell Book</h1>
    <p>Your mystical spells appear here...</p>
  `;
  return container;
}
```

3. Register the app (`src/apps/app-registry.js`):
```javascript
import { createSpellBook } from './spell-book/spell-book.js';
import { spellBookRune } from '../assets/runes/spell-book.svg.js';

export const appRegistry = [
  // ... existing apps
  {
    id: 'spell-book',
    name: 'Spell Book',
    icon: spellBookRune('#8A2BE2', 64), // Purple rune
    runeColor: '#8A2BE2',
    component: createSpellBook,
    defaultWindow: { width: 600, height: 700 },
    singleton: true
  }
];
```

4. Create rune icon (`src/assets/runes/spell-book.svg.js`):
```javascript
export const spellBookRune = (color = '#8A2BE2', size = 64) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="${color}" opacity="0.8"/>
    <text x="50" y="65" text-anchor="middle" font-size="50" fill="#FFF">📖</text>
  </svg>
`;
```

5. Test: Refresh browser, click new rune icon, verify app launches in window

---

### Task 2: Modify Desktop Particle System

**Goal**: Change firefly count or behavior

**File**: `src/desktop/particles.js`

**Change particle count**:
```javascript
// Find the particle pool initialization
const PARTICLE_COUNT = 150; // Change from 100 to 150
```

**Change particle color**:
```javascript
// In renderParticle function
ctx.fillStyle = `rgba(255, 223, 0, ${particle.opacity})`; // Gold fireflies
// Or
ctx.fillStyle = `rgba(135, 206, 250, ${particle.opacity})`; // Blue fireflies
```

**Change particle speed**:
```javascript
// In createParticle function
particle.vx = (Math.random() - 0.5) * 2; // Change multiplier (higher = faster)
particle.vy = (Math.random() - 0.5) * 2;
```

---

### Task 3: Add a New Database Table

**Goal**: Add a "tags" table for organizing files

**Steps**:

1. Create migration (`src/storage/migrations/002_add_tags.sql`):
```sql
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#FFD700',
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS file_tags (
    file_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (file_id, tag_id),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

UPDATE schema_version SET version = 2, applied_at = strftime('%s', 'now') * 1000;
```

2. Update migration runner (`src/storage/migrations.js`):
```javascript
import migration002 from './migrations/002_add_tags.sql?raw';

const migrations = [
  { version: 1, sql: migration001 },
  { version: 2, sql: migration002 } // Add new migration
];
```

3. Add tag management functions (`src/storage/tags.js`):
```javascript
export async function createTag(name, color) {
  const id = `tag-${crypto.randomUUID()}`;
  await db.run('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
    [id, name, color, Date.now()]);
  return id;
}

export async function addTagToFile(fileId, tagId) {
  await db.run('INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)', [fileId, tagId]);
}
```

4. Test: Clear IndexedDB in DevTools, refresh page, verify new tables created

---

### Task 4: Customize Fantasy Theme

**Goal**: Change color scheme to a darker, gothic theme

**File**: `styles/global.css`

**Update CSS variables**:
```css
:root {
  /* Change from mossy green to dark purple */
  --color-primary: #4B0082;           /* Indigo */
  --color-secondary: #8A2BE2;         /* Blue Violet */
  --color-background: #1a0033;        /* Very dark purple */
  --color-accent: #FFD700;            /* Gold */
  --color-text: #E6E6FA;              /* Lavender */
  
  /* Update parchment to darker tone */
  --parchment-bg: #2a1a3a;
  --parchment-border: #8A2BE2;
}
```

**Update firefly colors** (`src/desktop/particles.js`):
```javascript
ctx.fillStyle = `rgba(138, 43, 226, ${particle.opacity})`; // Purple fireflies
```

---

## Development Workflow

### TDD Cycle (Recommended)

1. **Write failing test** (`tests/unit/example.test.js`):
```javascript
import { describe, it, expect } from 'vitest';
import { createWindow } from '../src/window/window-manager.js';

describe('Window Manager', () => {
  it('creates window with correct default position', () => {
    const window = createWindow('mana-calculator');
    expect(window.x).toBeGreaterThan(0);
    expect(window.y).toBeGreaterThan(0);
  });
});
```

2. **Run tests** (watch mode):
```bash
npm run test:watch
```

3. **Implement feature** until tests pass

4. **Refactor** while keeping tests green

### Hot Module Replacement (HMR)

Vite provides instant updates without full page reload:

- **JavaScript changes**: Component re-renders automatically
- **CSS changes**: Styles update without reload
- **State preservation**: Window positions/sizes maintained during HMR

### Debugging

**Browser DevTools**:
```javascript
// Expose state for debugging (development only)
if (import.meta.env.DEV) {
  window.__DEBUG__ = {
    state,
    db,
    createWindow,
    focusWindow,
    // ... other utilities
  };
}

// In console:
__DEBUG__.state.windows         // View all windows
__DEBUG__.createWindow('mana-calculator')  // Create window
```

**Performance Profiling**:
```javascript
// Add performance markers
performance.mark('window-create-start');
createWindow('treasure-chest');
performance.mark('window-create-end');
performance.measure('Window Creation', 'window-create-start', 'window-create-end');

// View in DevTools Performance tab
```

---

## Building for Production

### Build Command

```bash
npm run build
```

**Output** (`dist/` directory):
- `index.html` - Entry point
- `assets/index-[hash].js` - Minified JavaScript (<500KB)
- `assets/index-[hash].css` - Minified CSS
- `assets/sql-wasm-[hash].wasm` - sql.js WebAssembly binary

### Bundle Size Analysis

```bash
npm run build:analyze
```

Opens bundle size visualizer showing:
- sql.js WASM: ~400KB
- Application code: ~50KB
- CSS: ~20KB
- SVG assets: ~30KB

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

*(COEP/COOP headers required for SharedArrayBuffer used by sql.js)*

---

## Troubleshooting

### Issue: "Database failed to load"

**Symptom**: Console error: `Error: Failed to load sql.js WASM binary`

**Solution**:
1. Check network tab - verify `sql-wasm.wasm` loaded successfully
2. Ensure COEP/COOP headers are set correctly (required for SharedArrayBuffer)
3. Clear browser cache and reload

### Issue: "Particles not animating"

**Symptom**: Fireflies don't move

**Solution**:
1. Check console for errors in `particles.js`
2. Verify canvas element exists in DOM: `document.querySelector('canvas#particles')`
3. Check `requestAnimationFrame` loop is running: Add `console.log` in `animate()`

### Issue: "Windows not persisting"

**Symptom**: Window positions reset after browser refresh

**Solution**:
1. Check IndexedDB in DevTools → Application → IndexedDB
2. Verify `enchanted-realm-db` database exists with `sqliteDb` object store
3. Check auto-save is enabled: `state.settings.auto_save_interval > 0`
4. Manually trigger save: `await saveToDatabase()` in console

### Issue: "Bundle size exceeds 500KB"

**Symptom**: Build fails with size warning

**Solution**:
1. Run `npm run build:analyze` to identify large chunks
2. Check for accidental imports of large libraries
3. Ensure tree-shaking is working (use named imports, not `import *`)
4. Consider code splitting: `const app = await import('./apps/large-app.js')`

---

## Testing

### Run All Tests

```bash
# Unit + integration tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Watch mode
npm run test:watch
```

### Write a Unit Test

```javascript
// tests/unit/state.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { state, subscribe } from '../../src/core/state.js';

describe('Global State Reactivity', () => {
  let notifications = [];
  
  beforeEach(() => {
    notifications = [];
    state.windows = [];
  });
  
  it('triggers subscriber when windows array changes', () => {
    subscribe('windows', (newWindows) => {
      notifications.push(newWindows);
    });
    
    state.windows.push({ id: 'win-1' });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual([{ id: 'win-1' }]);
  });
});
```

### Write an E2E Test

```javascript
// tests/e2e/desktop-workflow.spec.js
import { test, expect } from '@playwright/test';

test('user can open, drag, and close window', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for desktop to load
  await page.waitForSelector('.rune-icon');
  
  // Click calculator rune
  await page.click('[data-app="mana-calculator"]');
  
  // Verify window appears
  const window = await page.locator('.window[data-app="mana-calculator"]');
  await expect(window).toBeVisible();
  
  // Drag window
  const titleBar = window.locator('.window-title');
  await titleBar.dragTo(titleBar, { targetPosition: { x: 200, y: 100 } });
  
  // Close window
  await window.locator('.close-btn').click();
  await expect(window).not.toBeVisible();
});
```

---

## Next Steps

1. **Read the contracts**:
   - [`contracts/state-contract.md`](./contracts/state-contract.md) - Global state API
   - [`contracts/window-api.md`](./contracts/window-api.md) - Window management API
   - [`contracts/sqlite-schema.sql`](./contracts/sqlite-schema.sql) - Database schema

2. **Explore example apps**:
   - `src/apps/mana-calculator/` - Simple calculator
   - `src/apps/treasure-chest/` - File management with Canvas drawing

3. **Join development**:
   - Create a new app (spell book, potion mixer, quest tracker, etc.)
   - Improve particle system (add weather effects, seasons)
   - Enhance theming (multiple color schemes, custom fonts)
   - Add sound effects (fantasy ambience, UI interactions)

4. **Run tasks**:
   - Use `/speckit.tasks` to generate implementation tasks
   - Follow TDD workflow: tests first, then implementation

---

**Happy Coding! May your code be bug-free and your windows always draggable! 🧙‍♂️✨**
