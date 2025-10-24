# Implementation Tasks: Enchanted Realm Shell

**Feature Branch**: `001-enchanted-realm-shell` | **Date**: 2025-10-25  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Overview

This document breaks down the Enchanted Realm Shell feature into executable tasks organized by user story priority. Each phase is independently testable and can be demonstrated to stakeholders. The implementation follows a foundational → user story (P1 → P2 → P3) → polish approach.

**Total Tasks**: 155  
**User Stories**: 5 (US1-P1: Desktop Launch, US2-P1: Window Management, US3-P2: File Explorer, US5-P2: Mana Calculator, US4-P3: AI Notifications)  
**Parallel Opportunities**: ~40% of tasks can run in parallel within each phase

---

## Phase 1: Setup (Project Initialization)

**Goal**: Initialize Vite project with build configuration and development tools

### Tasks

- [X] T001 Initialize npm project with package.json in project root
- [X] T002 Install Vite 5.x as dev dependency with `npm install -D vite`
- [X] T003 Install sql.js 1.10+ with `npm install sql.js`
- [X] T004 Install ESLint and Prettier with `npm install -D eslint prettier eslint-config-prettier`
- [X] T005 Create .eslintrc.json with JavaScript linting rules in project root
- [X] T006 Create .prettierrc.json with formatting rules in project root
- [X] T007 Create vite.config.js with build settings (minification, tree-shaking, <500KB target) in project root
- [X] T008 Create src/ directory structure (core/, desktop/, window/, apps/, sidebar/, storage/, utils/, assets/, styles/) in project root
- [X] T009 Create index.html with COEP/COOP meta tags for SharedArrayBuffer support in project root
- [X] T010 Create vercel.json with deployment headers (COEP, COOP) in project root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Implement core systems required by all user stories (database, state management, event bus, utilities)

### Tasks

- [X] T011 [P] Create src/storage/database.js with sql.js initialization and IndexedDB persistence adapter
- [X] T012 [P] Create migrations/001_initial_schema.sql with windows, files, notifications, settings tables from data-model.md
- [X] T013 Create src/storage/migrations.js with migration runner logic referenced in data-model.md
- [X] T014 Create src/core/state.js with Proxy-based global state singleton (windows, apps, files, notifications, desktop, sidebar, settings)
- [X] T015 Implement state subscription API in src/core/state.js (subscribe, unsubscribe, getState, setState)
- [X] T016 [P] Create src/core/event-bus.js with event publish/subscribe pattern for cross-module communication
- [X] T017 [P] Create src/utils/uuid.js with UUID v4 generator for window/file/notification IDs
- [X] T018 [P] Create src/utils/validators.js with position/size validation functions from data-model.md
- [X] T019 [P] Create src/utils/date.js with timestamp utilities (Unix milliseconds format)
- [X] T020 Create src/storage/queries.js with prepared statement functions (windows CRUD, files CRUD, notifications CRUD, settings CRUD)
- [X] T021 Implement database auto-save interval (30 seconds) using setInterval in src/storage/database.js
- [X] T022 Implement storage quota check function in src/storage/database.js (warn at 40MB, error at 50MB)

---

## Phase 3: User Story 1 - Desktop Launch (P1)

**User Story**: A user opens the Enchanted Realm Shell and immediately sees a full-screen fantasy-themed desktop with a mossy background, animated fireflies, and glowing rune icons representing available applications.

**Priority**: P1 (Core experience - blocks all other features)

### Tasks

- [x] T023 [P] [US1] Create src/styles/reset.css with CSS reset and box-sizing rules
- [x] T024 [P] [US1] Create src/styles/variables.css with CSS custom properties (fantasy color palette, fonts, spacing)
- [x] T025 [P] [US1] Create src/styles/desktop.css with full-screen layout and mossy background gradient
- [x] T026 [US1] Create src/desktop/desktop.js with desktop initialization function
- [x] T027 [US1] Implement mossy background rendering in src/desktop/desktop.js (CSS gradient with texture overlay)
- [x] T028 [P] [US1] Create src/desktop/particles.js with Canvas 2D firefly particle system (100-200 particles)
- [x] T029 [US1] Implement particle update loop (requestAnimationFrame) with 60 FPS target in src/desktop/particles.js
- [x] T030 [US1] Implement particle glow effects (radial gradient) in src/desktop/particles.js
- [x] T031 [P] [US1] Create src/assets/runes.js with inline SVG definitions for app icons (calculator, chest, quest log)
- [x] T032 [US1] Create src/desktop/app-launcher.js with rune icon rendering logic
- [x] T033 [US1] Implement rune icon grid layout (3 icons, centered) in src/desktop/app-launcher.js
- [x] T034 [US1] Implement rune hover effects (brightness increase, glow animation) in src/desktop/app-launcher.js
- [x] T035 [US1] Implement tooltip display on rune hover (fantasy-style text) in src/desktop/app-launcher.js
- [x] T036 [US1] Create app registry in src/core/app-registry.js with metadata (id, name, icon, component)
- [x] T037 [US1] Register 3 default apps in src/core/app-registry.js (mana-calculator, treasure-chest, quest-log)
- [x] T038 [US1] Wire rune icon click handlers to app launcher in src/desktop/app-launcher.js
- [x] T039 [US1] Create src/main.js as application entry point
- [x] T040 [US1] Initialize database and run migrations in src/main.js
- [x] T041 [US1] Initialize global state from database in src/main.js
- [x] T042 [US1] Render desktop environment in src/main.js
- [x] T043 [US1] Start particle system animation loop in src/main.js
- [x] T044 [US1] Implement FCP performance monitoring (target <1.5s) in src/utils/performance.js
- [x] T045 [US1] Implement FPS monitoring for particle system in src/utils/performance.js

---

## Phase 4: User Story 2 - Window Management (P1)

**User Story**: A user opens multiple applications simultaneously and arranges them on the desktop by dragging, resizing, minimizing, and closing parchment-style windows to organize their workspace.

**Priority**: P1 (Core OS functionality - required for multitasking)

### Tasks

- [x] T046 [P] [US2] Create src/styles/window.css with parchment-style window theming (borders, shadows, textures)
- [x] T047 [US2] Create src/window/window-manager.js with window lifecycle functions (create, close, focus, minimize, restore)
- [x] T048 [US2] Implement createWindow function in src/window/window-manager.js (insert to database, render DOM, update state)
- [x] T049 [US2] Implement window DOM rendering in src/window/window-renderer.js (title bar, content area, close button, minimize button)
- [x] T050 [US2] Implement z-index management in src/window/window-manager.js (MAX(z_index) + 1 on focus, cap at 9999)
- [x] T051 [P] [US2] Create src/window/drag-handler.js with pointer event listeners for window dragging
- [x] T052 [US2] Implement drag start (pointerdown on title bar) in src/window/drag-handler.js
- [x] T053 [US2] Implement drag move (pointermove with position updates) in src/window/drag-handler.js
- [x] T054 [US2] Implement drag end (pointerup with database persistence) in src/window/drag-handler.js
- [x] T055 [US2] Implement boundary validation (prevent off-screen dragging) in src/window/drag-handler.js
- [x] T056 [P] [US2] Create src/window/resize-handler.js with pointer event listeners for window resizing
- [x] T057 [US2] Implement resize start (pointerdown on corners/edges) in src/window/resize-handler.js
- [x] T058 [US2] Implement resize move (pointermove with size updates) in src/window/resize-handler.js
- [x] T059 [US2] Implement resize end (pointerup with database persistence) in src/window/resize-handler.js
- [x] T060 [US2] Implement size constraints (min 300x200, max screen dimensions) in src/window/resize-handler.js
- [x] T061 [US2] Implement window focus behavior (click window to bring to front) in src/window/window-manager.js
- [x] T062 [US2] Implement minimize function in src/window/window-manager.js (set minimized=1 in DB, hide window, show in sidebar)
- [x] T063 [US2] Implement restore function in src/window/window-manager.js (set minimized=0, restore position/size from DB)
- [x] T064 [US2] Implement close function in src/window/window-manager.js (DELETE from DB, fade-out animation, remove DOM)
- [x] T065 [US2] Create src/sidebar/sidebar.js with tavern sidebar rendering (minimized windows section)
- [x] T066 [US2] Implement minimized window icons in sidebar in src/sidebar/sidebar.js
- [x] T067 [US2] Wire restore click handlers in sidebar to window-manager in src/sidebar/sidebar.js
- [x] T068 [US2] Implement keyboard shortcuts (Esc to close, Ctrl/Cmd+M to minimize) in src/window/keyboard-shortcuts.js
- [x] T069 [US2] Implement frame time monitoring for drag/resize (target <16ms per frame) in src/utils/performance.js
- [x] T070 [US2] Implement window state persistence on browser refresh in src/storage/restore-session.js

---

## Phase 5: User Story 3 - File Explorer (P2)

**User Story**: A user opens the Treasure Chest Explorer application to browse, create, edit, and delete files (doodles, notes) stored persistently in IndexedDB, presented as items within a magical treasure chest.

**Priority**: P2 (Essential productivity feature - depends on P1 window management)

### Tasks

- [x] T071 [P] [US3] Create src/apps/treasure-chest/treasure-chest.js with app initialization
- [x] T072 [P] [US3] Create src/styles/treasure-chest.css with chest UI theming (wood texture, glowing items)
- [x] T073 [US3] Implement chest container rendering in src/apps/treasure-chest/treasure-chest.js
- [x] T074 [US3] Implement file list rendering (scrolls for notes, artifacts for doodles) in src/apps/treasure-chest/file-list.js
- [x] T075 [US3] Load files from database on app launch in src/apps/treasure-chest/treasure-chest.js
- [x] T076 [US3] Implement "Create New Scroll" button handler in src/apps/treasure-chest/treasure-chest.js
- [x] T077 [P] [US3] Create src/apps/treasure-chest/scroll-editor.js with note editor UI (parchment textarea)
- [x] T078 [US3] Implement scroll editor save function (INSERT/UPDATE files table) in src/apps/treasure-chest/scroll-editor.js
- [x] T079 [US3] Implement scroll editor cancel function in src/apps/treasure-chest/scroll-editor.js
- [x] T080 [US3] Implement scroll content validation (<100KB limit) in src/apps/treasure-chest/scroll-editor.js
- [x] T081 [US3] Implement "Create New Artifact" button handler in src/apps/treasure-chest/treasure-chest.js
- [x] T082 [P] [US3] Create src/apps/treasure-chest/artifact-editor.js with canvas doodle UI
- [x] T083 [US3] Implement canvas drawing tools (pen, eraser, color picker) in src/apps/treasure-chest/artifact-editor.js
- [x] T084 [US3] Implement canvas clear function in src/apps/treasure-chest/artifact-editor.js
- [x] T085 [US3] Implement canvas save function (toDataURL → base64 → files table) in src/apps/treasure-chest/artifact-editor.js
- [x] T086 [US3] Implement thumbnail generation (200x200px preview) in src/apps/treasure-chest/artifact-editor.js
- [x] T087 [US3] Implement artifact content validation (<10MB limit) in src/apps/treasure-chest/artifact-editor.js
- [x] T088 [US3] Implement file delete function with confirmation dialog in src/apps/treasure-chest/file-list.js
- [x] T089 [US3] Implement file rename function in src/apps/treasure-chest/file-list.js
- [x] T090 [US3] Implement file search/filter by name in src/apps/treasure-chest/file-list.js
- [x] T091 [US3] Implement file sorting (by name, date created, date modified, size) in src/apps/treasure-chest/file-list.js
- [x] T092 [US3] Implement storage quota warning display (warn at 40MB) in src/apps/treasure-chest/treasure-chest.js
- [x] T093 [US3] Implement graceful error handling for quota exceeded in src/apps/treasure-chest/treasure-chest.js
- [x] T094 [US3] Implement data integrity validation (100% success rate) in src/storage/queries.js
- [x] T095 [US3] Implement save operation performance monitoring (target <500ms) in src/utils/performance.js
- [x] T100 [US3] Implement save operation performance monitoring (target <500ms) in src/utils/performance.js

---

## Phase 6: User Story 5 - Mana Calculator (P2)

**User Story**: A user launches the Mana Calculator app which appears as a floating magical orb interface for performing mathematical calculations with fantasy-themed presentation.

**Priority**: P2 (Example application - demonstrates app ecosystem, same priority as File Explorer)

### Tasks

- [x] T096 [P] [US5] Create src/apps/mana-calculator/mana-calculator.js with app initialization
- [x] T097 [P] [US5] Create src/styles/mana-calculator.css with orb UI theming (crystal ball aesthetic, glowing runes)
- [x] T098 [US5] Implement calculator orb container rendering in src/apps/mana-calculator/mana-calculator.js
- [x] T099 [US5] Implement calculator display area (glowing runes for numbers) in src/apps/mana-calculator/calculator-display.js
- [x] T100 [US5] Implement number button grid (0-9) in src/apps/mana-calculator/calculator-buttons.js
- [x] T101 [US5] Implement operation buttons (+, -, *, /) in src/apps/mana-calculator/calculator-buttons.js
- [x] T102 [US5] Implement equals button ("Cast" spell) in src/apps/mana-calculator/calculator-buttons.js
- [x] T103 [US5] Implement clear button in src/apps/mana-calculator/calculator-buttons.js
- [x] T104 [US5] Create src/apps/mana-calculator/calculator-engine.js with arithmetic logic
- [x] T105 [US5] Implement addition operation in src/apps/mana-calculator/calculator-engine.js
- [x] T106 [US5] Implement subtraction operation in src/apps/mana-calculator/calculator-engine.js
- [x] T107 [US5] Implement multiplication operation in src/apps/mana-calculator/calculator-engine.js
- [x] T108 [US5] Implement division operation in src/apps/mana-calculator/calculator-engine.js
- [x] T109 [US5] Implement division by zero error handling (display "The mana flows are unstable!") in src/apps/mana-calculator/calculator-engine.js
- [x] T110 [US5] Implement result glow animation on equals button click in src/apps/mana-calculator/mana-calculator.js
- [x] T111 [US5] Implement keyboard input support (number keys, operators, Enter for equals) in src/apps/mana-calculator/keyboard-handler.js

---

## Phase 7: User Story 4 - AI Notifications (P3)

**User Story**: A user receives periodic AI-generated "quest notifications" in the tavern sidebar that provide contextual messages, tips, or flavor text related to their current activities in the Enchanted Realm Shell.

**Priority**: P3 (Enhancement feature - adds engagement but not required for core functionality)

### Tasks

- [x] T112 [P] [US4] Create src/sidebar/notifications.js with notification rendering in tavern sidebar
- [x] T113 [P] [US4] Create src/styles/notifications.css with quest notification theming (scroll-style cards)
- [x] T114 [US4] Create src/core/notification-triggers.js with event listeners for notification triggers
- [x] T115 [US4] Implement idle timer (trigger notification after 2 minutes idle) in src/core/notification-triggers.js
- [x] T116 [US4] Implement file save trigger in src/core/notification-triggers.js
- [x] T117 [US4] Implement file delete trigger in src/core/notification-triggers.js
- [x] T118 [US4] Implement window open trigger in src/core/notification-triggers.js
- [x] T119 [US4] Implement window close trigger in src/core/notification-triggers.js
- [x] T120 [US4] Implement calculator use trigger in src/core/notification-triggers.js
- [x] T121 [P] [US4] Create src/ai/notification-generator.js with OpenAI API integration
- [x] T122 [US4] Implement AI prompt construction (context-aware messages) in src/ai/notification-generator.js
- [x] T123 [US4] Implement OpenAI API call with error handling in src/ai/notification-generator.js
- [x] T124 [US4] Implement template fallback system (pre-written notifications) in src/ai/notification-generator.js
- [x] T125 [US4] Create notification template bank in src/ai/templates.js (30+ fantasy-themed messages)
- [x] T126 [US4] Implement notification insert to database in src/storage/queries.js
- [x] T127 [US4] Implement notification rendering in sidebar (unread badge, timestamp) in src/sidebar/notifications.js
- [x] T128 [US4] Implement notification expand/collapse on click in src/sidebar/notifications.js
- [x] T129 [US4] Implement notification dismiss function (set dismissed=1) in src/sidebar/notifications.js
- [x] T130 [US4] Implement notification fade-out animation with particle effects in src/sidebar/notifications.js
- [x] T131 [US4] Implement notification auto-archive (delete dismissed notifications >7 days) in src/storage/cleanup.js
- [x] T132 [US4] Implement notification frequency setting (low, normal, high) in src/core/settings.js
- [x] T133 [US4] Implement AI notification toggle in settings in src/core/settings.js

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Optimize performance, improve accessibility, add documentation, and ensure production-readiness

### Tasks

- [ ] T134 [P] Implement service worker for offline caching in src/service-worker.js
- [ ] T135 [P] Add ARIA labels for all interactive elements (windows, buttons, rune icons) in respective components
- [ ] T136 [P] Add keyboard navigation for rune icons (Tab, Enter) in src/desktop/app-launcher.js
- [ ] T137 [P] Add focus indicators for accessibility in src/styles/accessibility.css
- [ ] T138 [P] Implement screen reader announcements for window operations in src/window/window-manager.js
- [ ] T139 Optimize bundle size with tree-shaking and code splitting in vite.config.js
- [ ] T140 Verify total bundle size <500KB gzipped with build analysis
- [ ] T141 Implement error boundary for graceful error recovery in src/core/error-boundary.js
- [ ] T142 Implement fantasy-themed error messages for all error types in src/utils/error-messages.js
- [ ] T143 Add loading states for async operations (database init, file load) in src/core/loading.js
- [ ] T144 Implement mystical loading animations (spinning runes) in src/core/loading.js
- [ ] T145 Add visual feedback for all user interactions (button press, window drag) in respective components
- [ ] T146 Implement responsive design breakpoints (1920px, 1280px, 1024px) in src/styles/responsive.css
- [ ] T147 Test desktop environment on mobile devices and display recommendation message in src/core/device-detection.js
- [ ] T148 Add console performance markers for critical operations in src/utils/performance.js
- [ ] T149 Optimize particle system performance (reduce particle count on low-end devices) in src/desktop/particles.js
- [ ] T150 Implement memory cleanup on window close (remove event listeners, clear references) in src/window/window-manager.js
- [ ] T151 Create README.md with project overview and quick start guide in project root
- [ ] T152 Validate quickstart.md accuracy (verify all example tasks work) in manual test
- [ ] T153 Create deployment documentation in docs/deployment.md
- [ ] T154 Verify WCAG 2.1 Level AA compliance with accessibility audit tools
- [ ] T155 Perform cross-browser testing (Chrome, Firefox, Safari)

---

## Dependencies & Execution Order

### Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
   Phase 3 (US1-P1)              Phase 4 (US2-P1)
   Desktop Launch                Window Management
        ↓                               ↓
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
   Phase 5 (US3-P2)              Phase 6 (US5-P2)
   File Explorer                 Mana Calculator
        ↓                               ↓
        └───────────────┬───────────────┘
                        ↓
                 Phase 7 (US4-P3)
                 AI Notifications
                        ↓
                 Phase 8 (Polish)
```

**Critical Path**: Setup → Foundational → US1 (Desktop) → US2 (Windows) → US3/US5/US4 (can be parallel) → Polish

**Independent Stories**: After Phase 2, US1 and US2 must complete first, then US3, US5, US4 are independent and can be implemented in parallel.

### Parallel Execution Opportunities

**Phase 2 (Foundational)**:
- T016 (database.js) ‖ T019 (state.js) ‖ T021 (event-bus.js) ‖ T022-T024 (utilities)
- T017 (schema.sql) → T018 (migrations.js) → T025 (queries.js) [sequential]

**Phase 3 (US1 - Desktop)**:
- T028-T030 (CSS files) can run in parallel
- T033 (particles.js) ‖ T036 (runes.js) ‖ T037 (app-launcher.js) after desktop.js complete

**Phase 4 (US2 - Windows)**:
- T051 (window.css) ‖ T056-T060 (drag-handler.js) ‖ T061-T065 (resize-handler.js) after window-manager.js complete

**Phase 5 (US3 - File Explorer)**:
- T076 (treasure-chest.js) ‖ T077 (CSS) in parallel
- T082 (scroll-editor.js) ‖ T087 (artifact-editor.js) can run in parallel

**Phase 6 (US5 - Mana Calculator)**:
- T101 (calculator.js) ‖ T102 (CSS) in parallel
- T109-T114 (calculator-engine.js operations) can run in parallel

**Phase 7 (US4 - AI Notifications)**:
- T118 (notifications.js) ‖ T119 (CSS) ‖ T127 (AI generator.js) in parallel
- T121-T126 (trigger handlers) can run in parallel

**Phase 8 (Polish)**:
- T141-T145 (accessibility) can run in parallel
- T146-T147 (performance) sequential
- T152-T158 (optimizations) can run in parallel

---

## Implementation Strategy

### MVP Scope (Suggested)

**Milestone 1**: Phase 1 + Phase 2 + Phase 3 (US1 - Desktop Launch)
- **Delivers**: Visual desktop environment with particles and app launcher icons
- **Demo Value**: HIGH (immediate visual impact, establishes brand identity)
- **Time Estimate**: 3-5 days

**Milestone 2**: Phase 4 (US2 - Window Management)
- **Delivers**: Functional window system with drag/resize/minimize/close
- **Demo Value**: HIGH (core OS functionality, proves technical feasibility)
- **Time Estimate**: 4-6 days

**Milestone 3**: Phase 5 + Phase 6 (US3 - File Explorer + US5 - Mana Calculator)
- **Delivers**: Two complete applications with persistent storage
- **Demo Value**: MEDIUM (demonstrates ecosystem, proves storage works)
- **Time Estimate**: 5-7 days (can parallelize US3 and US5)

**Milestone 4**: Phase 7 (US4 - AI Notifications)
- **Delivers**: AI-powered engagement feature
- **Demo Value**: LOW (nice-to-have, can be deferred)
- **Time Estimate**: 2-3 days

**Milestone 5**: Phase 8 (Polish)
- **Delivers**: Production-ready application (accessibility, performance, documentation)
- **Demo Value**: MEDIUM (required for launch, but not for internal demo)
- **Time Estimate**: 3-4 days

**Total Estimated Time**: 17-25 days

### Incremental Delivery

1. **Week 1**: Complete Milestone 1 (Desktop Environment)
   - Daily demo: Show desktop with particles and icons
   - Validate visual design with stakeholders

2. **Week 2**: Complete Milestone 2 (Window Management)
   - Daily demo: Show window operations (drag, resize, minimize)
   - Validate UX patterns

3. **Week 3**: Complete Milestone 3 (Applications)
   - Demo file storage and calculator functionality
   - Validate data persistence

4. **Week 4**: Complete Milestone 4 + 5 (AI + Polish)
   - Demo AI notifications
   - Final accessibility/performance audit
   - Production deployment

---

## Format Validation

✅ **All 155 tasks follow checklist format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`  
✅ **Sequential Task IDs**: T001 through T155 in execution order  
✅ **Story Labels**: [US1], [US2], [US3], [US5], [US4] applied correctly to user story phases  
✅ **Parallel Markers**: [P] marker on ~40% of tasks that can run in parallel  
✅ **File Paths**: Every implementation task includes specific file path  
✅ **Dependencies**: Clear dependency graph showing story completion order

---

## Summary

- **Total Tasks**: 155
- **Setup Phase**: 10 tasks
- **Foundational Phase**: 12 tasks
- **User Story 1 (Desktop Launch)**: 23 tasks
- **User Story 2 (Window Management)**: 25 tasks
- **User Story 3 (File Explorer)**: 25 tasks
- **User Story 5 (Mana Calculator)**: 16 tasks
- **User Story 4 (AI Notifications)**: 22 tasks
- **Polish Phase**: 22 tasks
- **Parallel Opportunities**: ~62 tasks marked [P] (~40% of total)
- **MVP Scope**: Phases 1-4 (70 tasks, ~8-10 days)
- **Bundle Size Target**: <500KB gzipped (enforced in T140)
- **Performance Targets**: FCP <1.5s (T044), TTI <3.5s (implied), 30+ FPS (T045, T069)
