# Global State Contract

**Purpose**: Define the shape and reactivity contract for the global state singleton  
**Version**: 1.0.0  
**Date**: 2025-10-25

## State Shape

```typescript
interface GlobalState {
  // Window Management
  windows: Window[];
  activeWindowId: string | null;
  nextZIndex: number;
  maxWindows: number;
  
  // Application Registry
  apps: AppDefinition[];
  
  // File Storage
  files: File[];
  selectedFileId: string | null;
  
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // Desktop Environment
  desktop: {
    particleCount: number;
    particlesEnabled: boolean;
    backgroundTheme: string;
  };
  
  // Sidebar
  sidebar: {
    visible: boolean;
    minimizedWindows: string[]; // Window IDs
    activeTab: 'windows' | 'notifications';
  };
  
  // Settings
  settings: Record<string, any>;
  
  // System State
  isInitialized: boolean;
  isDatabaseReady: boolean;
  lastSaveTimestamp: number;
  storageQuotaUsedMB: number;
}
```

## Type Definitions

### Window

```typescript
interface Window {
  id: string;                 // UUID v4, e.g., 'win-calc-abc123'
  appId: string;              // Application identifier
  title: string;              // Window title (from app definition)
  x: number;                  // Position X in pixels
  y: number;                  // Position Y in pixels
  width: number;              // Width in pixels
  height: number;             // Height in pixels
  zIndex: number;             // Stacking order
  minimized: boolean;         // True if minimized to sidebar
  element: HTMLElement | null; // DOM reference (not persisted)
  createdAt: number;          // Unix timestamp (ms)
  modifiedAt: number;         // Unix timestamp (ms)
}
```

### AppDefinition

```typescript
interface AppDefinition {
  id: string;                 // Unique app identifier (e.g., 'mana-calculator')
  name: string;               // Display name (e.g., 'Mana Calculator')
  icon: string;               // SVG markup as string
  runeColor: string;          // Hex color for rune glow
  component: () => HTMLElement; // Factory function to create app content
  defaultWindow: {            // Default window dimensions
    width: number;
    height: number;
  };
  singleton: boolean;         // If true, only one instance allowed
}
```

### File

```typescript
interface File {
  id: string;                 // UUID v4, e.g., 'file-scroll-xyz789'
  name: string;               // User-defined filename
  type: 'scroll' | 'artifact'; // File type
  content: string;            // Text or base64 data URL
  thumbnail: string | null;   // Base64 thumbnail (artifacts only)
  createdAt: number;          // Unix timestamp (ms)
  modifiedAt: number;         // Unix timestamp (ms)
  sizeBytes: number;          // Content size in bytes
}
```

### Notification

```typescript
interface Notification {
  id: string;                 // UUID v4, e.g., 'notif-quest-123'
  text: string;               // Notification message (max 280 chars)
  context: NotificationContext | null; // Trigger metadata
  timestamp: number;          // Unix timestamp (ms)
  read: boolean;              // Read status
  dismissed: boolean;         // Dismissed status
}

interface NotificationContext {
  action: 'idle' | 'file_saved' | 'file_deleted' | 'window_opened' | 'window_closed' | 'calculator_used' | 'system';
  metadata?: Record<string, any>; // Additional context data
}
```

## Reactivity Contract

### Subscription API

```typescript
// Subscribe to state changes
function subscribe(path: string, callback: (newValue: any, oldValue: any) => void): UnsubscribeFunction;

type UnsubscribeFunction = () => void;
```

**Subscription Paths**:
- `'windows'` - Entire windows array changed (window added/removed)
- `'windows.{id}'` - Specific window changed (position, size, zIndex)
- `'windows.{id}.x'` - Specific property of specific window
- `'activeWindowId'` - Active window changed
- `'files'` - Files array changed
- `'notifications'` - Notifications array changed
- `'desktop.particleCount'` - Particle density changed
- `'sidebar.visible'` - Sidebar visibility changed

### Mutation API

```typescript
// Direct mutation triggers reactivity (Proxy-based)
state.windows.push(newWindow);           // Triggers 'windows' subscribers
state.windows[0].x = 100;                 // Triggers 'windows.{id}.x' subscribers
state.activeWindowId = 'win-calc-123';   // Triggers 'activeWindowId' subscribers

// Batched mutations (multiple updates, single notification)
batchUpdate(() => {
  state.windows[0].x = 100;
  state.windows[0].y = 50;
  state.windows[0].width = 800;
}); // Triggers once after all updates
```

## State Management Functions

### Window Management

```typescript
// Add new window
function addWindow(appId: string, options?: Partial<Window>): Window;

// Remove window
function removeWindow(windowId: string): void;

// Focus window (bring to front)
function focusWindow(windowId: string): void;

// Minimize window
function minimizeWindow(windowId: string): void;

// Restore window
function restoreWindow(windowId: string): void;

// Update window position
function updateWindowPosition(windowId: string, x: number, y: number): void;

// Update window size
function updateWindowSize(windowId: string, width: number, height: number): void;

// Get all windows sorted by z-index
function getWindowsByZIndex(): Window[];

// Get windows by app ID
function getWindowsByAppId(appId: string): Window[];
```

### File Management

```typescript
// Create file
function createFile(name: string, type: 'scroll' | 'artifact', content: string): File;

// Update file
function updateFile(fileId: string, updates: Partial<File>): void;

// Delete file
function deleteFile(fileId: string): void;

// Get files by type
function getFilesByType(type: 'scroll' | 'artifact'): File[];

// Search files by name
function searchFiles(query: string): File[];

// Get total storage usage
function getStorageUsageMB(): number;
```

### Notification Management

```typescript
// Add notification
function addNotification(text: string, context?: NotificationContext): Notification;

// Mark as read
function markNotificationRead(notificationId: string): void;

// Dismiss notification
function dismissNotification(notificationId: string): void;

// Get unread notifications
function getUnreadNotifications(): Notification[];

// Clear old dismissed notifications (older than 7 days)
function cleanupNotifications(): void;
```

### Settings Management

```typescript
// Get setting
function getSetting<T>(key: string, defaultValue: T): T;

// Set setting
function setSetting(key: string, value: any): void;

// Get all settings
function getAllSettings(): Record<string, any>;
```

## Persistence Contract

### Auto-Save Behavior

**Triggers**:
- Window position/size changed → Debounced save after 1 second of inactivity
- Window created/closed → Immediate save
- File created/updated/deleted → Immediate save
- Settings changed → Immediate save
- Periodic save every 30 seconds (configurable)
- On browser beforeunload event → Synchronous save

**Save Function**:
```typescript
async function saveToDatabase(): Promise<void> {
  // Export current state to SQLite
  // Update windows, files, notifications, settings tables
  // Export database to Uint8Array
  // Save to IndexedDB
  // Update lastSaveTimestamp
}
```

**Load Function**:
```typescript
async function loadFromDatabase(): Promise<void> {
  // Load database from IndexedDB
  // Read all tables (windows, files, notifications, settings)
  // Hydrate global state
  // Mark isDatabaseReady = true
  // Trigger initial render
}
```

### Error Handling

**Database Errors**:
```typescript
// If database fails to load
state.isDatabaseReady = false;
showNotification('The ancient tomes are corrupted! Your realm may not persist.', { type: 'error' });
// Continue with empty state (graceful degradation)

// If database save fails
console.error('Failed to persist state:', error);
showNotification('The scrolls could not be sealed! Changes may be lost.', { type: 'warning' });
// Retry save after 5 seconds (with exponential backoff)
```

**Quota Exceeded**:
```typescript
// If IndexedDB quota exceeded
showNotification('Your treasure chest is full! Delete old files to make space.', { type: 'error' });
preventNewFileSaves = true;
// Offer export/download option
```

## Performance Optimizations

### Subscription Batching

```typescript
// Batch multiple state updates into single notification
let pendingNotifications = new Set<string>();
let batchTimeout: number | null = null;

function scheduleNotify(path: string) {
  pendingNotifications.add(path);
  
  if (!batchTimeout) {
    batchTimeout = requestAnimationFrame(() => {
      pendingNotifications.forEach(path => notifySubscribers(path));
      pendingNotifications.clear();
      batchTimeout = null;
    });
  }
}
```

### Shallow Comparison

```typescript
// Only notify if value actually changed
function shouldNotify(oldValue: any, newValue: any): boolean {
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    return oldValue.length !== newValue.length || !oldValue.every((v, i) => v === newValue[i]);
  }
  return oldValue !== newValue;
}
```

### Memory Management

```typescript
// Weak references for DOM elements
interface Window {
  element: WeakRef<HTMLElement> | null; // Use WeakRef to allow GC
}

// Cleanup on window close
function removeWindow(windowId: string) {
  const window = state.windows.find(w => w.id === windowId);
  if (window?.element) {
    window.element = null; // Release reference
  }
  state.windows = state.windows.filter(w => w.id !== windowId);
}
```

## Validation Rules

### Window Constraints

```typescript
function validateWindow(window: Partial<Window>): void {
  assert(window.x >= 0 && window.x <= screen.width - 100, 'Window X out of bounds');
  assert(window.y >= 0 && window.y <= screen.height - 100, 'Window Y out of bounds');
  assert(window.width >= 300 && window.width <= screen.width, 'Window width out of range');
  assert(window.height >= 200 && window.height <= screen.height, 'Window height out of range');
  assert(window.zIndex >= 1000 && window.zIndex <= 9999, 'Window z-index out of range');
}
```

### File Constraints

```typescript
function validateFile(file: Partial<File>): void {
  assert(file.name && file.name.length > 0 && file.name.length <= 255, 'Invalid file name');
  assert(file.type === 'scroll' || file.type === 'artifact', 'Invalid file type');
  
  if (file.type === 'scroll') {
    assert(file.content.length <= 100 * 1024, 'Scroll content exceeds 100KB limit');
  } else if (file.type === 'artifact') {
    assert(file.content.startsWith('data:image/'), 'Artifact must be image data URL');
    assert(file.content.length <= 10 * 1024 * 1024, 'Artifact exceeds 10MB limit');
  }
}
```

### Notification Constraints

```typescript
function validateNotification(notification: Partial<Notification>): void {
  assert(notification.text && notification.text.length > 0 && notification.text.length <= 280, 'Invalid notification text length');
}
```

## Usage Examples

### Example 1: Creating and Managing a Window

```javascript
import { state, subscribe } from './core/state.js';
import { addWindow, focusWindow } from './window/window-manager.js';

// Subscribe to window changes
const unsubscribe = subscribe('windows', (newWindows) => {
  console.log('Windows updated:', newWindows.length);
});

// Create new window
const window = addWindow('mana-calculator', {
  x: 100,
  y: 100,
  width: 400,
  height: 500
});

// Focus window (brings to front)
focusWindow(window.id);

// Cleanup subscription
unsubscribe();
```

### Example 2: Saving a File

```javascript
import { createFile, getStorageUsageMB } from './storage/files.js';
import { showNotification } from './sidebar/notifications.js';

// Check quota before saving
if (getStorageUsageMB() > 40) {
  showNotification('Your treasure chest is nearly full! Consider deleting old files.');
}

// Create new scroll
const file = createFile('My Quest Log', 'scroll', 'Today I defeated the bug dragon!');

// Auto-save to database happens automatically (debounced)
```

### Example 3: Listening to Active Window Changes

```javascript
import { state, subscribe } from './core/state.js';

subscribe('activeWindowId', (newWindowId, oldWindowId) => {
  console.log(`Focus changed from ${oldWindowId} to ${newWindowId}`);
  
  // Update UI (e.g., highlight active window)
  if (oldWindowId) {
    document.getElementById(oldWindowId)?.classList.remove('active');
  }
  if (newWindowId) {
    document.getElementById(newWindowId)?.classList.add('active');
  }
});
```

---

**Contract Version**: 1.0.0  
**Last Updated**: 2025-10-25  
**Breaking Changes**: None (initial version)
