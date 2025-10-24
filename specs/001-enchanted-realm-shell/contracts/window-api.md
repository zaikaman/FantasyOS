# Window Management API

**Purpose**: Define the public API contract for window lifecycle, positioning, and z-index management  
**Version**: 1.0.0  
**Date**: 2025-10-25

## Overview

The Window Management API provides functions for creating, manipulating, and destroying application windows in the Enchanted Realm Shell. All windows are draggable, resizable parchment-style containers that host application content.

## Core Concepts

### Window Lifecycle States

```
[CREATED] → [ACTIVE] → [MINIMIZED] → [RESTORED] → [ACTIVE]
                ↓                                     ↓
            [FOCUSED]                            [FOCUSED]
                ↓
           [CLOSED] (destroyed)
```

### Z-Index Management

- **Base z-index**: 1000 (first window)
- **Auto-increment**: Each new window gets `MAX(existing z-index) + 1`
- **Focus behavior**: Clicking a window brings it to front (new max z-index)
- **Maximum z-index**: 9999 (prevents CSS overflow)
- **Reset threshold**: If z-index exceeds 9000, re-index all windows (1000, 1001, 1002...)

### Position Constraints

- **Minimum position**: `x ≥ 0`, `y ≥ 0`
- **Maximum position**: `x ≤ screen.width - 100`, `y ≤ screen.height - 100` (ensures title bar visible)
- **Default position**: Center of screen with 20px offset per new window (cascading effect)

### Size Constraints

- **Minimum size**: 300px × 200px
- **Maximum size**: `screen.width × screen.height`
- **Default size**: Defined per application (e.g., calculator: 400×500, file explorer: 800×600)

---

## API Functions

### Window Creation

#### `createWindow(appId: string, options?: WindowOptions): Window`

Creates a new application window and adds it to the desktop.

**Parameters**:
- `appId` (string, required): Application identifier from app registry
- `options` (WindowOptions, optional): Override default window properties

**WindowOptions**:
```typescript
interface WindowOptions {
  x?: number;           // Initial X position (default: center with cascade)
  y?: number;           // Initial Y position (default: center with cascade)
  width?: number;       // Initial width (default: from app definition)
  height?: number;      // Initial height (default: from app definition)
  title?: string;       // Window title (default: from app definition)
  minimized?: boolean;  // Start minimized (default: false)
}
```

**Returns**: `Window` object

**Throws**:
- `Error('App not found')` - If appId doesn't exist in registry
- `Error('Maximum windows reached')` - If already at max window limit (default 20)
- `Error('App already running')` - If app is singleton and instance exists

**Example**:
```javascript
import { createWindow } from './window/window-manager.js';

// Create window with default options
const calcWindow = createWindow('mana-calculator');

// Create window with custom position/size
const exploreWindow = createWindow('treasure-chest', {
  x: 100,
  y: 100,
  width: 900,
  height: 700,
  title: 'My Treasure Vault'
});
```

**Side Effects**:
- Adds window to `state.windows` array
- Inserts window element into DOM
- Sets `state.activeWindowId` to new window
- Persists window to database
- Triggers `'windows'` state subscribers
- Generates quest notification ("A new portal has been summoned!")

---

### Window Destruction

#### `closeWindow(windowId: string): void`

Closes and destroys a window, removing it from the desktop.

**Parameters**:
- `windowId` (string, required): UUID of window to close

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist

**Example**:
```javascript
import { closeWindow } from './window/window-manager.js';

closeWindow('win-calc-abc123');
```

**Side Effects**:
- Removes window from `state.windows` array
- Removes window element from DOM (with fade-out animation)
- Deletes window from database
- Triggers `'windows'` state subscribers
- If active window, sets `state.activeWindowId` to next highest z-index window

---

### Window Focus & Z-Index

#### `focusWindow(windowId: string): void`

Brings a window to the front (highest z-index) and marks it as active.

**Parameters**:
- `windowId` (string, required): UUID of window to focus

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist

**Example**:
```javascript
import { focusWindow } from './window/window-manager.js';

// Clicking a window brings it to front
windowElement.addEventListener('pointerdown', () => {
  focusWindow(window.id);
});
```

**Side Effects**:
- Updates `window.zIndex` to `MAX(all z-indexes) + 1`
- Sets `state.activeWindowId` to windowId
- Updates window in database
- Adds CSS class `'active'` to window element
- Triggers `'activeWindowId'` state subscribers

---

#### `getActiveWindow(): Window | null`

Returns the currently active (focused) window.

**Returns**: `Window` object or `null` if no windows open

**Example**:
```javascript
import { getActiveWindow } from './window/window-manager.js';

const activeWin = getActiveWindow();
if (activeWin) {
  console.log('Active window:', activeWin.title);
}
```

---

#### `reindexWindows(): void`

Resets all window z-indexes to sequential values starting at 1000. Called automatically when max z-index exceeds 9000.

**Example**:
```javascript
// Automatically called by focusWindow when needed
// Manual call example:
import { reindexWindows } from './window/window-manager.js';

reindexWindows();
// Windows now have z-indexes: 1000, 1001, 1002, ... (ordered by current z-index)
```

**Side Effects**:
- Updates all `window.zIndex` values
- Updates all windows in database (batch transaction)
- Triggers `'windows'` state subscribers

---

### Window Minimization

#### `minimizeWindow(windowId: string): void`

Minimizes a window to the tavern sidebar.

**Parameters**:
- `windowId` (string, required): UUID of window to minimize

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist

**Example**:
```javascript
import { minimizeWindow } from './window/window-manager.js';

// Minimize button click handler
minimizeBtn.addEventListener('click', () => {
  minimizeWindow(window.id);
});
```

**Side Effects**:
- Sets `window.minimized = true`
- Hides window element (CSS `display: none`)
- Adds window ID to `state.sidebar.minimizedWindows`
- Updates window in database
- Triggers animation (window shrinks to sidebar icon)
- Triggers `'windows'` and `'sidebar.minimizedWindows'` subscribers

---

#### `restoreWindow(windowId: string): void`

Restores a minimized window to its previous position and size.

**Parameters**:
- `windowId` (string, required): UUID of window to restore

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist
- `Error('Window not minimized')` - If window is already visible

**Example**:
```javascript
import { restoreWindow } from './window/window-manager.js';

// Clicking minimized window icon in sidebar
sidebarIcon.addEventListener('click', () => {
  restoreWindow(window.id);
});
```

**Side Effects**:
- Sets `window.minimized = false`
- Shows window element (CSS `display: block`)
- Removes window ID from `state.sidebar.minimizedWindows`
- Focuses window (brings to front)
- Updates window in database
- Triggers animation (window expands from sidebar icon)
- Triggers `'windows'` and `'sidebar.minimizedWindows'` subscribers

---

### Window Positioning

#### `setWindowPosition(windowId: string, x: number, y: number): void`

Sets the absolute position of a window.

**Parameters**:
- `windowId` (string, required): UUID of window
- `x` (number, required): X coordinate in pixels
- `y` (number, required): Y coordinate in pixels

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist
- `Error('Position out of bounds')` - If x/y violate constraints

**Example**:
```javascript
import { setWindowPosition } from './window/window-manager.js';

// Center window on screen
setWindowPosition(window.id, 
  (screen.width - window.width) / 2,
  (screen.height - window.height) / 2
);
```

**Side Effects**:
- Updates `window.x` and `window.y`
- Updates CSS `transform: translate(${x}px, ${y}px)`
- Updates window in database (debounced - 1 second after last change)
- Triggers `'windows.{id}'` state subscribers

---

#### `moveWindow(windowId: string, deltaX: number, deltaY: number): void`

Moves a window by a relative offset.

**Parameters**:
- `windowId` (string, required): UUID of window
- `deltaX` (number, required): Horizontal offset in pixels
- `deltaY` (number, required): Vertical offset in pixels

**Example**:
```javascript
import { moveWindow } from './window/window-manager.js';

// Move window 50px right, 30px down
moveWindow(window.id, 50, 30);
```

**Side Effects**: Same as `setWindowPosition`

---

### Window Resizing

#### `setWindowSize(windowId: string, width: number, height: number): void`

Sets the absolute size of a window.

**Parameters**:
- `windowId` (string, required): UUID of window
- `width` (number, required): Width in pixels
- `height` (number, required): Height in pixels

**Throws**:
- `Error('Window not found')` - If windowId doesn't exist
- `Error('Size out of range')` - If width/height violate constraints (min 300×200, max screen size)

**Example**:
```javascript
import { setWindowSize } from './window/window-manager.js';

// Resize window to 800x600
setWindowSize(window.id, 800, 600);
```

**Side Effects**:
- Updates `window.width` and `window.height`
- Updates CSS `width` and `height` properties
- Updates window in database (debounced - 1 second after last change)
- Triggers `'windows.{id}'` state subscribers
- Notifies app component of size change (for responsive layouts)

---

#### `resizeWindow(windowId: string, deltaWidth: number, deltaHeight: number): void`

Resizes a window by a relative offset.

**Parameters**:
- `windowId` (string, required): UUID of window
- `deltaWidth` (number, required): Width change in pixels
- `deltaHeight` (number, required): Height change in pixels

**Example**:
```javascript
import { resizeWindow } from './window/window-manager.js';

// Make window 100px wider and 50px taller
resizeWindow(window.id, 100, 50);
```

**Side Effects**: Same as `setWindowSize`

---

### Window Queries

#### `getAllWindows(): Window[]`

Returns all windows sorted by z-index (lowest to highest).

**Returns**: Array of `Window` objects

**Example**:
```javascript
import { getAllWindows } from './window/window-manager.js';

const windows = getAllWindows();
windows.forEach(win => {
  console.log(win.title, win.zIndex);
});
```

---

#### `getWindowById(windowId: string): Window | null`

Returns a specific window by ID.

**Parameters**:
- `windowId` (string, required): UUID of window

**Returns**: `Window` object or `null` if not found

**Example**:
```javascript
import { getWindowById } from './window/window-manager.js';

const window = getWindowById('win-calc-abc123');
if (window) {
  console.log('Found window:', window.title);
}
```

---

#### `getWindowsByAppId(appId: string): Window[]`

Returns all windows for a specific application.

**Parameters**:
- `appId` (string, required): Application identifier

**Returns**: Array of `Window` objects

**Example**:
```javascript
import { getWindowsByAppId } from './window/window-manager.js';

// Check if calculator is already open
const calcWindows = getWindowsByAppId('mana-calculator');
if (calcWindows.length > 0) {
  focusWindow(calcWindows[0].id); // Focus existing window
} else {
  createWindow('mana-calculator'); // Create new window
}
```

---

#### `getMinimizedWindows(): Window[]`

Returns all minimized windows.

**Returns**: Array of `Window` objects where `minimized === true`

**Example**:
```javascript
import { getMinimizedWindows } from './window/window-manager.js';

const minimized = getMinimizedWindows();
console.log(`${minimized.length} windows in sidebar`);
```

---

## Event Hooks

The Window Manager supports custom event hooks for application-specific behavior:

```typescript
interface WindowEventHooks {
  onBeforeCreate?: (appId: string, options: WindowOptions) => WindowOptions | void;
  onAfterCreate?: (window: Window) => void;
  onBeforeClose?: (window: Window) => boolean; // Return false to cancel
  onAfterClose?: (windowId: string) => void;
  onFocus?: (window: Window) => void;
  onMinimize?: (window: Window) => void;
  onRestore?: (window: Window) => void;
  onResize?: (window: Window, oldSize: {width: number, height: number}) => void;
  onMove?: (window: Window, oldPos: {x: number, y: number}) => void;
}

// Register hooks
registerWindowHooks(hooks: WindowEventHooks): void;
```

**Example**:
```javascript
import { registerWindowHooks } from './window/window-manager.js';

registerWindowHooks({
  onBeforeClose: (window) => {
    if (window.appId === 'treasure-chest' && hasUnsavedChanges()) {
      return confirm('You have unsaved scrolls. Close anyway?');
    }
    return true;
  },
  
  onAfterCreate: (window) => {
    console.log(`Window created: ${window.title}`);
    addNotification(`Portal opened: ${window.title}`);
  }
});
```

---

## Performance Considerations

### Debouncing

Position and size updates are debounced during drag/resize operations:

```javascript
// Update visual position immediately (CSS transform)
window.element.style.transform = `translate(${x}px, ${y}px)`;

// Debounce database save (1 second after last change)
debouncedSave(window.id);
```

### RAF Throttling

Pointer events during drag/resize are throttled to 60 FPS:

```javascript
let rafId = null;

function onPointerMove(event) {
  if (rafId) return; // Already scheduled
  
  rafId = requestAnimationFrame(() => {
    updateWindowPosition(windowId, event.clientX, event.clientY);
    rafId = null;
  });
}
```

### Memory Management

Window elements use WeakRefs to allow garbage collection:

```javascript
interface Window {
  element: WeakRef<HTMLElement> | null;
}

// On window close
window.element = null; // Release reference, allow GC
```

---

## Accessibility

All windows must support keyboard navigation:

- **Tab**: Cycle through focusable elements within window
- **Escape**: Close active window
- **Cmd/Ctrl+M**: Minimize active window
- **Cmd/Ctrl+W**: Close active window
- **Cmd/Ctrl+Tab**: Cycle through open windows

Windows must have appropriate ARIA attributes:

```html
<div role="dialog" aria-labelledby="window-title-{id}" aria-modal="false" tabindex="0">
  <div class="window-title" id="window-title-{id}">{title}</div>
  <!-- Window content -->
</div>
```

---

**API Version**: 1.0.0  
**Last Updated**: 2025-10-25  
**Breaking Changes**: None (initial version)
