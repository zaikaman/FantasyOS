# Implementation Plan: Enchanted Realm Shell

**Branch**: `001-enchanted-realm-shell` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-enchanted-realm-shell/spec.md`

## Summary

The Enchanted Realm Shell is a browser-based fantasy desktop environment simulator featuring a full-screen immersive interface with mossy backgrounds, animated fireflies, and glowing rune icons. Users can launch applications in draggable parchment-style windows, manage files through a magical treasure chest interface with persistent storage, receive AI-generated quest notifications, and perform calculations via a mystical Mana Calculator orb. The technical approach leverages a lightweight monolithic SPA architecture built with Vite, vanilla JavaScript, sql.js for SQLite persistence, Canvas API for particle effects, and inline SVG assets—targeting a <500KB bundle size for instant deployment on Vercel.

## Technical Context

**Language/Version**: JavaScript ES6+ (modern browser support: Chrome 90+, Firefox 88+, Safari 14+)  
**Build Tool**: Vite 5.x (dev server + production bundler with tree-shaking and minification)  
**Primary Dependencies**: sql.js 1.10+ (WebAssembly SQLite for local database operations)  
**Storage**: sql.js (SQLite in-memory database persisted to IndexedDB via storage adapter)  
**Testing**: Vitest (Vite-native test runner) + Playwright (E2E browser testing)  
**Target Platform**: Modern web browsers (desktop-first, responsive down to 1280x720)  
**Project Type**: Single-page application (monolithic SPA architecture)  
**Performance Goals**: 
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- 30+ FPS for all animations
- Bundle size < 500KB gzipped
- Window drag/resize operations < 16ms per frame (60 FPS)

**Constraints**:
- No external UI libraries (vanilla JS only)
- No external CSS frameworks (custom CSS with CSS variables)
- Inline SVG assets only (no image files except optional AI-generated content)
- Maximum 500KB total bundle size (including sql.js WASM)
- Browser-local storage only (no backend server)
- Offline-capable after first load (service worker for caching)

**Scale/Scope**:
- Single-user local experience
- Support for 20+ simultaneous windows
- 1000+ files in treasure chest storage
- SQLite database size up to 50MB (browser quota permitting)
- 3 core applications (Mana Calculator, Treasure Chest Explorer, Quest Log)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Implementation:
- [x] Feature specification approved with clear acceptance criteria ✅
- [x] Tests written and failing (will be Phase 2 - TDD cycle) ⏳
- [x] Performance budget defined (<500KB bundle, <1.5s FCP, 30+ FPS) ✅
- [x] Accessibility requirements identified (keyboard navigation, ARIA labels, screen reader support) ✅
- [x] Design system components identified (inline SVG runes, parchment windows, fantasy theming) ✅

### Code Quality Standards:
- [x] ESLint configured for JavaScript linting (zero warnings policy)
- [x] Prettier for code formatting consistency
- [x] SOLID principles applied (modular architecture with single-responsibility modules)
- [x] Error handling strategy defined (graceful degradation for storage/API failures)
- [x] Code review process in place (peer review required before merge)

### Testing Standards:
- [x] TDD approach planned (write tests first for each user story)
- [x] Test coverage targets: 80% for business logic (state management, persistence layer)
- [x] Test organization: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- [x] Contract tests for SQLite schema and data model
- [x] Integration tests for IndexedDB persistence
- [x] E2E tests for user workflows using Playwright

### UX Consistency:
- [x] Design system: Fantasy-themed with consistent color palette (mossy greens, mystical purples, glowing gold)
- [x] Accessibility: WCAG 2.1 Level AA compliance (keyboard navigation, ARIA labels, focus indicators)
- [x] Responsive design: Desktop-first with breakpoints at 1920px, 1280px, 1024px
- [x] Error messages: Fantasy-themed, user-friendly ("The mana flows are disrupted!" vs technical errors)
- [x] Loading states: Mystical loading animations for async operations
- [x] Feedback: Visual/audio feedback for all user interactions

### Performance Requirements:
- [x] Response time budgets defined (< 1.5s FCP, < 3.5s TTI, < 16ms frame time)
- [x] Resource constraints: < 500KB bundle, efficient memory management (cleanup on window close)
- [x] Scalability: O(n) algorithms for window management, indexed queries for file lookups
- [x] Performance testing: Lighthouse CI integration for automated performance checks
- [x] Monitoring: Console performance markers for critical operations

### Complexity Justification:
**No violations** - Architecture aligns with simplicity principles:
- Vanilla JS avoids framework complexity
- sql.js chosen over IndexedDB raw API for relational data modeling (justified by file relationships)
- Monolithic SPA reduces build complexity vs micro-frontends
- Inline SVG assets eliminate HTTP requests and asset pipeline complexity

## Project Structure

### Documentation (this feature)

```text
specs/001-enchanted-realm-shell/
├── plan.md              # This file
├── research.md          # Phase 0: Technology research and decisions
├── data-model.md        # Phase 1: SQLite schema and entity relationships
├── quickstart.md        # Phase 1: Developer getting started guide
├── contracts/           # Phase 1: API contracts and data schemas
│   ├── sqlite-schema.sql    # SQLite table definitions
│   ├── state-contract.md    # Global state shape and reactivity contract
│   └── window-api.md        # Window management API specification
└── tasks.md             # Phase 2: Implementation task breakdown (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project structure (browser-based SPA)
/
├── index.html                  # Entry point with full-viewport desktop container
├── vite.config.js              # Vite build configuration
├── package.json                # Dependencies: vite, sql.js, vitest, playwright
├── .eslintrc.json              # ESLint configuration (zero warnings)
├── .prettierrc                 # Prettier code formatting
│
├── src/
│   ├── main.js                 # Application entry point, initialize desktop
│   │
│   ├── core/
│   │   ├── state.js            # Global state singleton with reactivity
│   │   ├── database.js         # sql.js wrapper with IndexedDB persistence
│   │   └── events.js           # Custom event bus for app communication
│   │
│   ├── desktop/
│   │   ├── desktop.js          # Desktop environment manager
│   │   ├── particles.js        # Canvas particle system (fireflies)
│   │   ├── background.js       # Mossy background rendering
│   │   └── runes.js            # Rune icon launcher system
│   │
│   ├── window/
│   │   ├── window-manager.js   # Window lifecycle and z-index management
│   │   ├── window.js           # Individual window component (drag/resize)
│   │   ├── drag-handler.js     # Native drag API integration
│   │   └── resize-handler.js   # Native resize interaction handler
│   │
│   ├── apps/
│   │   ├── app-registry.js     # Application registration and factory
│   │   ├── mana-calculator/
│   │   │   ├── calculator.js   # Calculator application logic
│   │   │   └── calculator.css  # Orb-style calculator UI
│   │   ├── treasure-chest/
│   │   │   ├── explorer.js     # File explorer application
│   │   │   ├── file-editor.js  # Note/doodle editor
│   │   │   └── explorer.css    # Treasure chest UI styling
│   │   └── quest-log/
│   │       ├── quest-log.js    # Third application (quest tracker)
│   │       └── quest-log.css   # Quest log styling
│   │
│   ├── sidebar/
│   │   ├── tavern-sidebar.js   # Tavern sidebar manager (minimized windows + notifications)
│   │   ├── notifications.js    # Quest notification system
│   │   └── ai-generator.js     # AI notification generation (with fallback templates)
│   │
│   ├── storage/
│   │   ├── files.js            # File CRUD operations (scrolls/artifacts)
│   │   ├── windows.js          # Window state persistence
│   │   └── migrations.js       # Database schema migrations
│   │
│   ├── utils/
│   │   ├── dom.js              # DOM manipulation helpers
│   │   ├── animations.js       # CSS/JS animation utilities
│   │   └── performance.js      # Throttle/debounce/RAF utilities
│   │
│   └── assets/
│       ├── runes/              # Inline SVG rune definitions
│       │   ├── calculator.svg.js   # Export as JS template literal
│       │   ├── chest.svg.js        # Treasure chest rune
│       │   └── quest.svg.js        # Quest log rune
│       └── parchment/          # Inline SVG parchment textures
│           └── window-border.svg.js
│
├── styles/
│   ├── global.css              # CSS variables, resets, fantasy theme
│   ├── desktop.css             # Desktop environment styling
│   ├── window.css              # Window chrome (title bar, borders, shadows)
│   └── sidebar.css             # Tavern sidebar styling
│
└── tests/
    ├── unit/
    │   ├── state.test.js       # State management tests
    │   ├── database.test.js    # SQLite operations tests
    │   ├── window-manager.test.js
    │   └── files.test.js       # File CRUD tests
    ├── integration/
    │   ├── persistence.test.js # IndexedDB integration tests
    │   ├── window-lifecycle.test.js
    │   └── app-launch.test.js  # Application launching tests
    └── e2e/
        ├── desktop-workflow.spec.js    # Full user workflows
        ├── file-management.spec.js     # Create/edit/delete files
        └── accessibility.spec.js       # Keyboard navigation, ARIA
```

**Structure Decision**: 

Selected **single project structure** because:
1. **Browser-based SPA**: No backend/frontend split needed - all code runs in browser
2. **Monolithic architecture**: Global state singleton and tightly coupled modules benefit from single compilation unit
3. **Performance optimization**: Vite can tree-shake and code-split from single entry point
4. **Simplicity**: No need for separate build processes or deployment pipelines
5. **Bundle size constraint**: Single project allows fine-grained control over final bundle size

The structure separates concerns into logical modules:
- `core/` - Global singletons (state, database, events)
- `desktop/` - Visual environment rendering
- `window/` - Window management system
- `apps/` - Individual applications
- `sidebar/` - Tavern sidebar and notifications
- `storage/` - Persistence layer
- `utils/` - Shared utilities
- `assets/` - Inline SVG assets as JavaScript

## Complexity Tracking

> **No violations requiring justification**

The architecture intentionally embraces simplicity:

| Design Decision | Justification | Complexity Level |
|----------------|---------------|------------------|
| **Vanilla JS (no framework)** | Avoids React/Vue complexity, reduces bundle size, meets <500KB target | Low ✅ |
| **sql.js for storage** | Provides relational model for file relationships vs raw IndexedDB key-value (more maintainable) | Medium ✅ |
| **Monolithic SPA** | Simpler than micro-frontends or SSR, appropriate for single-user browser app | Low ✅ |
| **Global state singleton** | Simple reactivity without Redux/MobX complexity, appropriate for small app scope | Low ✅ |
| **Inline SVG assets** | Eliminates build pipeline complexity, no asset loading/caching issues | Low ✅ |
| **Native drag/resize APIs** | Uses browser primitives vs third-party library (e.g., interact.js) | Low ✅ |

**Alternative considered and rejected**:
- **React + IndexedDB**: Would exceed 500KB bundle size, adds framework complexity
- **Raw IndexedDB**: Harder to model file relationships and query patterns vs SQL
- **External SVG files**: Adds HTTP requests, asset pipeline, and caching complexity
- **Micro-frontend architecture**: Overkill for 3 applications, increases build complexity

All complexity is justified by functional requirements and performance constraints.
