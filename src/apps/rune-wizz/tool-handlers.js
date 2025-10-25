/**
 * Tool Call Handlers for RuneWizz
 * Executes OS operations based on function calls
 */

import { getState, setState } from '../../core/state.js';
import { 
  createWindow, 
  closeWindow, 
  minimizeWindow, 
  restoreWindow, 
  toggleMaximizeWindow,
  focusWindow,
  getAllWindows,
  getWindowById,
  setWindowPosition,
  setWindowSize
} from '../../window/window-manager.js';
import { getAppById, getAllApps } from '../app-registry.js';
import { 
  insertFile, 
  updateFile, 
  deleteFile, 
  getAllFiles,
  getSetting,
  setSetting,
  getAllSettings,
  insertNotification,
  getAllNotifications,
  getUnreadNotifications,
  updateNotification,
  dismissNotification,
  deleteOldNotifications,
  getCalendarEvents,
  insertCalendarEvent
} from '../../storage/queries.js';
import { generateUUID } from '../../utils/uuid.js';
import { now } from '../../utils/date.js';
import { setParticleDensity, startParticles, stopParticles } from '../../desktop/particles.js';
import { getBackgroundUrl } from '../../assets/backgrounds.js';

/**
 * Main handler for tool calls
 * @param {Object} toolCall - Tool call object from Vapi
 * @returns {Promise<Object>} Result object
 */
export async function handleToolCall(toolCall) {
  // Handle the single runewizz_control function
  if (toolCall.name === 'runewizz_control' || toolCall.function?.name === 'runewizz_control') {
    const params = toolCall.parameters || toolCall.function?.arguments || toolCall.arguments || {};
    const action = params.action;
    
    console.log('[RuneWizz] Executing action:', action, params);
    
    // Route to appropriate handler based on action
    try {
      let result;
      
      switch (action) {
        // Window management
        case 'create_window':
        case 'launch_app':
          result = await handleCreateWindow(params);
          break;
        case 'close_window':
          result = await handleCloseWindow(params);
          break;
        case 'close_all_windows':
          result = await handleCloseAllWindows();
          break;
        case 'minimize_window':
          result = await handleMinimizeWindow(params);
          break;
        case 'get_all_windows':
          result = await handleGetAllWindows();
          break;
        case 'get_available_apps':
          result = await handleGetAvailableApps();
          break;
        // Settings
        case 'change_theme':
          result = await handleChangeTheme(params);
          break;
        case 'toggle_particles':
          result = await handleToggleParticles(params);
          break;
        // System info
        case 'get_system_time':
          result = await handleGetSystemTime(params);
          break;
        case 'get_system_status':
          result = await handleGetSystemStatus();
          break;
        // Notifications
        case 'create_notification':
          result = await handleCreateNotification(params);
          break;
        case 'read_notifications':
          result = await handleReadNotifications();
          break;
        // Games
        case 'open_game':
          result = await handleOpenGame(params);
          break;
        // Tasks
        case 'create_task':
          result = await handleCreateTask({
            title: params.task_title,
            description: params.task_description,
            priority: params.task_priority
          });
          break;
        default:
          result = {
            success: false,
            message: `Unknown action: ${action}`
          };
      }
      
      return result;
    } catch (error) {
      console.error('[RuneWizz] Tool execution error:', error);
      return {
        success: false,
        message: `Error: ${error.message}`,
        error: error.toString()
      };
    }
  }
  
  // Fallback for individual function names (legacy support)
  const functionName = toolCall.name || toolCall.function?.name;
  const parameters = toolCall.parameters || toolCall.function?.arguments || toolCall.arguments || {};
  
  console.log('[RuneWizz] Executing tool:', functionName, parameters);
  
  try {
    let result;
    
    switch (functionName) {
      // ========== WINDOW MANAGEMENT ==========
      case 'create_window':
      case 'launch_app':
        result = await handleCreateWindow(parameters);
        break;
      
      case 'close_window':
        result = await handleCloseWindow(parameters);
        break;
      
      case 'close_all_windows':
        result = await handleCloseAllWindows();
        break;
      
      case 'minimize_window':
        result = await handleMinimizeWindow(parameters);
        break;
      
      case 'restore_window':
        result = await handleRestoreWindow(parameters);
        break;
      
      case 'maximize_window':
        result = await handleMaximizeWindow(parameters);
        break;
      
      case 'focus_window':
        result = await handleFocusWindow(parameters);
        break;
      
      case 'get_all_windows':
        result = await handleGetAllWindows();
        break;
      
      case 'get_active_window':
        result = await handleGetActiveWindow();
        break;
      
      case 'move_window':
        result = await handleMoveWindow(parameters);
        break;
      
      case 'resize_window':
        result = await handleResizeWindow(parameters);
        break;
      
      // ========== APPLICATION CONTROL ==========
      case 'get_available_apps':
        result = await handleGetAvailableApps();
        break;
      
      case 'get_app_info':
        result = await handleGetAppInfo(parameters);
        break;
      
      // ========== FILE OPERATIONS ==========
      case 'create_file':
        result = await handleCreateFile(parameters);
        break;
      
      case 'read_file':
        result = await handleReadFile(parameters);
        break;
      
      case 'update_file':
        result = await handleUpdateFile(parameters);
        break;
      
      case 'delete_file':
        result = await handleDeleteFile(parameters);
        break;
      
      case 'list_files':
        result = await handleListFiles(parameters);
        break;
      
      case 'search_files':
        result = await handleSearchFiles(parameters);
        break;
      
      case 'get_storage_info':
        result = await handleGetStorageInfo();
        break;
      
      // ========== SETTINGS ==========
      case 'change_theme':
        result = await handleChangeTheme(parameters);
        break;
      
      case 'change_background':
        result = await handleChangeBackground(parameters);
        break;
      
      case 'toggle_particles':
        result = await handleToggleParticles(parameters);
        break;
      
      case 'set_particle_density':
        result = await handleSetParticleDensity(parameters);
        break;
      
      case 'get_setting':
        result = await handleGetSetting(parameters);
        break;
      
      case 'update_setting':
        result = await handleUpdateSetting(parameters);
        break;
      
      case 'get_all_settings':
        result = await handleGetAllSettings();
        break;
      
      // ========== NOTIFICATIONS ==========
      case 'create_notification':
        result = await handleCreateNotification(parameters);
        break;
      
      case 'get_notifications':
        result = await handleGetNotifications(parameters);
        break;
      
      case 'read_notifications':
        result = await handleReadNotifications();
        break;
      
      case 'mark_notification_read':
        result = await handleMarkNotificationRead(parameters);
        break;
      
      case 'dismiss_notification':
        result = await handleDismissNotification(parameters);
        break;
      
      case 'clear_old_notifications':
        result = await handleClearOldNotifications();
        break;
      
      // ========== SYSTEM INFO ==========
      case 'get_system_time':
        result = await handleGetSystemTime(parameters);
        break;
      
      case 'get_system_status':
        result = await handleGetSystemStatus();
        break;
      
      case 'get_weather':
        result = await handleGetWeather(parameters);
        break;
      
      // ========== CALENDAR & TASKS ==========
      case 'create_calendar_event':
        result = await handleCreateCalendarEvent(parameters);
        break;
      
      case 'get_calendar_events':
        result = await handleGetCalendarEvents(parameters);
        break;
      
      case 'create_task':
        result = await handleCreateTask(parameters);
        break;
      
      // ========== SPECIAL COMMANDS ==========
      case 'open_game':
        result = await handleOpenGame(parameters);
        break;
      
      case 'play_music':
        result = await handlePlayMusic(parameters);
        break;
      
      case 'search_book':
        result = await handleSearchBook(parameters);
        break;
      
      case 'start_pomodoro':
        result = await handleStartPomodoro(parameters);
        break;
      
      default:
        result = {
          success: false,
          message: `Unknown function: ${functionName}`
        };
    }
    
    return result;
  } catch (error) {
    console.error('[RuneWizz] Tool execution error:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      error: error.toString()
    };
  }
}

// ============================================================================
// WINDOW MANAGEMENT HANDLERS
// ============================================================================

async function handleCreateWindow(params) {
  const { app_id, title } = params;
  const app = getAppById(app_id);
  
  if (!app) {
    return { success: false, message: `App not found: ${app_id}` };
  }
  
  const options = title ? { title } : {};
  const window = createWindow(app_id, options);
  
  return {
    success: true,
    message: `Opened ${app.name}`,
    data: { window_id: window.id, app_name: app.name }
  };
}

async function handleCloseWindow(params) {
  const { window_id } = params;
  const state = getState();
  
  const targetId = window_id || state.activeWindowId;
  
  if (!targetId) {
    return { success: false, message: 'No window to close' };
  }
  
  const window = getWindowById(targetId);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  await closeWindow(targetId);
  
  return {
    success: true,
    message: `Closed ${window.title}`,
    data: { window_id: targetId }
  };
}

async function handleCloseAllWindows() {
  const windows = getAllWindows();
  
  for (const window of windows) {
    await closeWindow(window.id);
  }
  
  return {
    success: true,
    message: `Closed ${windows.length} windows`,
    data: { count: windows.length }
  };
}

async function handleMinimizeWindow(params) {
  const { window_id } = params;
  const state = getState();
  
  const targetId = window_id || state.activeWindowId;
  
  if (!targetId) {
    return { success: false, message: 'No window to minimize' };
  }
  
  const window = getWindowById(targetId);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  minimizeWindow(targetId);
  
  return {
    success: true,
    message: `Minimized ${window.title}`,
    data: { window_id: targetId }
  };
}

async function handleRestoreWindow(params) {
  const { window_id } = params;
  
  if (!window_id) {
    return { success: false, message: 'Window ID required' };
  }
  
  const window = getWindowById(window_id);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  restoreWindow(window_id);
  
  return {
    success: true,
    message: `Restored ${window.title}`,
    data: { window_id }
  };
}

async function handleMaximizeWindow(params) {
  const { window_id } = params;
  const state = getState();
  
  const targetId = window_id || state.activeWindowId;
  
  if (!targetId) {
    return { success: false, message: 'No window to maximize' };
  }
  
  const window = getWindowById(targetId);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  toggleMaximizeWindow(targetId);
  
  return {
    success: true,
    message: `Maximized ${window.title}`,
    data: { window_id: targetId }
  };
}

async function handleFocusWindow(params) {
  const { window_id } = params;
  
  if (!window_id) {
    return { success: false, message: 'Window ID required' };
  }
  
  const window = getWindowById(window_id);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  focusWindow(window_id);
  
  return {
    success: true,
    message: `Focused ${window.title}`,
    data: { window_id }
  };
}

async function handleGetAllWindows() {
  const windows = getAllWindows();
  
  const windowList = windows.map(w => ({
    id: w.id,
    title: w.title,
    app_id: w.app_id,
    minimized: w.minimized,
    x: w.x,
    y: w.y,
    width: w.width,
    height: w.height
  }));
  
  return {
    success: true,
    message: `Found ${windows.length} windows`,
    data: { windows: windowList, count: windows.length }
  };
}

async function handleGetActiveWindow() {
  const state = getState();
  const activeId = state.activeWindowId;
  
  if (!activeId) {
    return { success: true, message: 'No active window', data: null };
  }
  
  const window = getWindowById(activeId);
  
  return {
    success: true,
    message: `Active window: ${window?.title || 'Unknown'}`,
    data: window
  };
}

async function handleMoveWindow(params) {
  const { window_id, x, y } = params;
  
  const window = getWindowById(window_id);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  setWindowPosition(window_id, x, y);
  
  return {
    success: true,
    message: `Moved ${window.title} to (${x}, ${y})`,
    data: { window_id, x, y }
  };
}

async function handleResizeWindow(params) {
  const { window_id, width, height } = params;
  
  const window = getWindowById(window_id);
  if (!window) {
    return { success: false, message: 'Window not found' };
  }
  
  setWindowSize(window_id, width, height);
  
  return {
    success: true,
    message: `Resized ${window.title} to ${width}x${height}`,
    data: { window_id, width, height }
  };
}

// ============================================================================
// APPLICATION CONTROL HANDLERS
// ============================================================================

async function handleGetAvailableApps() {
  const apps = getAllApps();
  
  const appList = apps.map(app => ({
    id: app.id,
    name: app.name,
    description: app.description
  }));
  
  return {
    success: true,
    message: `Found ${apps.length} available apps`,
    data: { apps: appList, count: apps.length }
  };
}

async function handleGetAppInfo(params) {
  const { app_id } = params;
  const app = getAppById(app_id);
  
  if (!app) {
    return { success: false, message: 'App not found' };
  }
  
  return {
    success: true,
    message: `App info: ${app.name}`,
    data: {
      id: app.id,
      name: app.name,
      description: app.description,
      singleton: app.singleton
    }
  };
}

// ============================================================================
// FILE OPERATION HANDLERS
// ============================================================================

async function handleCreateFile(params) {
  const { name, type, content } = params;
  
  const fileData = {
    id: generateUUID(),
    name,
    type,
    content,
    size: content.length,
    created_at: now(),
    modified_at: now()
  };
  
  insertFile(fileData);
  
  const state = getState();
  setState({
    files: [...state.files, fileData]
  });
  
  return {
    success: true,
    message: `Created file: ${name}`,
    data: { file_id: fileData.id, name }
  };
}

async function handleReadFile(params) {
  const { file_id } = params;
  const state = getState();
  
  const file = state.files.find(f => f.id === file_id);
  
  if (!file) {
    return { success: false, message: 'File not found' };
  }
  
  return {
    success: true,
    message: `Read file: ${file.name}`,
    data: file
  };
}

async function handleUpdateFile(params) {
  const { file_id, name, content } = params;
  const state = getState();
  
  const file = state.files.find(f => f.id === file_id);
  
  if (!file) {
    return { success: false, message: 'File not found' };
  }
  
  const updates = { modified_at: now() };
  if (name) updates.name = name;
  if (content !== undefined) {
    updates.content = content;
    updates.size = content.length;
  }
  
  updateFile(file_id, updates);
  
  const updatedFiles = state.files.map(f =>
    f.id === file_id ? { ...f, ...updates } : f
  );
  setState({ files: updatedFiles });
  
  return {
    success: true,
    message: `Updated file: ${name || file.name}`,
    data: { file_id, ...updates }
  };
}

async function handleDeleteFile(params) {
  const { file_id } = params;
  const state = getState();
  
  const file = state.files.find(f => f.id === file_id);
  
  if (!file) {
    return { success: false, message: 'File not found' };
  }
  
  deleteFile(file_id);
  
  setState({
    files: state.files.filter(f => f.id !== file_id)
  });
  
  return {
    success: true,
    message: `Deleted file: ${file.name}`,
    data: { file_id }
  };
}

async function handleListFiles(params) {
  const { type } = params;
  const state = getState();
  
  let files = state.files;
  
  if (type && type !== 'all') {
    files = files.filter(f => f.type === type);
  }
  
  return {
    success: true,
    message: `Found ${files.length} files`,
    data: { files, count: files.length }
  };
}

async function handleSearchFiles(params) {
  const { query } = params;
  const state = getState();
  
  const results = state.files.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return {
    success: true,
    message: `Found ${results.length} files matching "${query}"`,
    data: { files: results, count: results.length }
  };
}

async function handleGetStorageInfo() {
  const state = getState();
  const totalSize = state.files.reduce((sum, f) => sum + (f.size || 0), 0);
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  return {
    success: true,
    message: `Using ${sizeInMB} MB`,
    data: {
      total_files: state.files.length,
      total_bytes: totalSize,
      total_mb: sizeInMB
    }
  };
}

// ============================================================================
// SETTINGS HANDLERS
// ============================================================================

async function handleChangeTheme(params) {
  const { theme } = params;
  
  setSetting('realm_theme', theme);
  
  const state = getState();
  setState({
    settings: { ...state.settings, realm_theme: theme }
  });
  
  // Apply theme
  applyTheme(theme);
  
  return {
    success: true,
    message: `Changed theme to ${theme}`,
    data: { theme }
  };
}

async function handleChangeBackground(params) {
  const { background_id } = params;
  
  setSetting('realm_background', background_id);
  
  const state = getState();
  setState({
    settings: { ...state.settings, realm_background: background_id }
  });
  
  // Apply background
  const desktopBg = document.querySelector('.desktop-background');
  if (desktopBg) {
    const backgroundUrl = getBackgroundUrl(background_id);
    desktopBg.style.backgroundImage = `url('${backgroundUrl}')`;
  }
  
  return {
    success: true,
    message: `Changed background to ${background_id}`,
    data: { background_id }
  };
}

async function handleToggleParticles(params) {
  const { enabled } = params;
  
  setSetting('particle_enabled', enabled ? 1 : 0);
  
  const state = getState();
  setState({
    settings: { ...state.settings, particle_enabled: enabled }
  });
  
  if (enabled) {
    startParticles();
  } else {
    stopParticles();
  }
  
  return {
    success: true,
    message: `Particles ${enabled ? 'enabled' : 'disabled'}`,
    data: { enabled }
  };
}

async function handleSetParticleDensity(params) {
  const { density } = params;
  
  setSetting('particle_density', density);
  
  const state = getState();
  setState({
    settings: { ...state.settings, particle_density: density }
  });
  
  setParticleDensity(density);
  
  return {
    success: true,
    message: `Set particle density to ${density}`,
    data: { density }
  };
}

async function handleGetSetting(params) {
  const { key } = params;
  const value = getSetting(key);
  
  return {
    success: true,
    message: `Setting ${key}: ${value}`,
    data: { key, value }
  };
}

async function handleUpdateSetting(params) {
  const { key, value } = params;
  
  setSetting(key, value);
  
  const state = getState();
  setState({
    settings: { ...state.settings, [key]: value }
  });
  
  return {
    success: true,
    message: `Updated setting ${key}`,
    data: { key, value }
  };
}

async function handleGetAllSettings() {
  const settings = getAllSettings();
  
  return {
    success: true,
    message: 'Retrieved all settings',
    data: { settings }
  };
}

// ============================================================================
// NOTIFICATION HANDLERS
// ============================================================================

async function handleCreateNotification(params) {
  const { text, context } = params;
  
  const notification = {
    id: generateUUID(),
    text,
    context: context || 'voice_command',
    timestamp: now(),
    read: 0,
    dismissed: 0
  };
  
  insertNotification(notification);
  
  const state = getState();
  setState({
    notifications: [...state.notifications, notification]
  });
  
  return {
    success: true,
    message: 'Notification created',
    data: { notification_id: notification.id }
  };
}

async function handleGetNotifications(params) {
  const { unread_only } = params;
  
  const notifications = unread_only ? getUnreadNotifications() : getAllNotifications();
  
  return {
    success: true,
    message: `Found ${notifications.length} notifications`,
    data: { notifications, count: notifications.length }
  };
}

async function handleReadNotifications() {
  const notifications = getUnreadNotifications();
  
  if (notifications.length === 0) {
    return {
      success: true,
      message: 'No unread notifications',
      data: { notifications: [], count: 0 }
    };
  }
  
  const messages = notifications.map(n => `${n.text} (${new Date(n.timestamp).toLocaleString()})`);
  
  return {
    success: true,
    message: `You have ${notifications.length} unread notifications: ${messages.join('; ')}`,
    data: { notifications, count: notifications.length }
  };
}

async function handleMarkNotificationRead(params) {
  const { notification_id } = params;
  
  updateNotification(notification_id, { read: 1 });
  
  const state = getState();
  setState({
    notifications: state.notifications.map(n =>
      n.id === notification_id ? { ...n, read: 1 } : n
    )
  });
  
  return {
    success: true,
    message: 'Notification marked as read',
    data: { notification_id }
  };
}

async function handleDismissNotification(params) {
  const { notification_id } = params;
  
  dismissNotification(notification_id);
  
  const state = getState();
  setState({
    notifications: state.notifications.map(n =>
      n.id === notification_id ? { ...n, dismissed: 1 } : n
    )
  });
  
  return {
    success: true,
    message: 'Notification dismissed',
    data: { notification_id }
  };
}

async function handleClearOldNotifications() {
  deleteOldNotifications();
  
  return {
    success: true,
    message: 'Cleared old notifications'
  };
}

// ============================================================================
// SYSTEM INFO HANDLERS
// ============================================================================

async function handleGetSystemTime(params) {
  const { format } = params;
  const date = new Date();
  
  let timeStr;
  if (format === '12h') {
    timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else {
    timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return {
    success: true,
    message: `It's ${timeStr} on ${dateStr}`,
    data: {
      time: timeStr,
      date: dateStr,
      timestamp: date.getTime()
    }
  };
}

async function handleGetSystemStatus() {
  const state = getState();
  
  return {
    success: true,
    message: 'System status: Operational',
    data: {
      windows_open: state.windows.length,
      files_stored: state.files.length,
      unread_notifications: state.notifications.filter(n => !n.read).length,
      uptime: performance.now()
    }
  };
}

async function handleGetWeather(params) {
  // This would integrate with the Weather Oracle app
  // For now, return a placeholder
  const { location } = params;
  
  return {
    success: true,
    message: `To get weather for ${location}, I'll open the Weather Oracle for you`,
    data: { location, action: 'open_weather_oracle' }
  };
}

// ============================================================================
// CALENDAR & TASK HANDLERS
// ============================================================================

async function handleCreateCalendarEvent(params) {
  const { title, date, description } = params;
  
  const event = {
    id: generateUUID(),
    title,
    date,
    description: description || '',
    created_at: now()
  };
  
  insertCalendarEvent(event);
  
  const state = getState();
  setState({
    calendar_events: [...state.calendar_events, event]
  });
  
  return {
    success: true,
    message: `Created event: ${title}`,
    data: { event_id: event.id }
  };
}

async function handleGetCalendarEvents(params) {
  const events = getCalendarEvents();
  
  return {
    success: true,
    message: `Found ${events.length} events`,
    data: { events, count: events.length }
  };
}

async function handleCreateTask(params) {
  const { title, description, priority } = params;
  
  // This would integrate with Quest Log app
  // For now, create a notification as a task reminder
  const notification = {
    id: generateUUID(),
    text: `Task: ${title}${description ? ' - ' + description : ''}`,
    context: 'task',
    timestamp: now(),
    read: 0,
    dismissed: 0
  };
  
  insertNotification(notification);
  
  const state = getState();
  setState({
    notifications: [...state.notifications, notification]
  });
  
  return {
    success: true,
    message: `Created task: ${title}`,
    data: { task_id: notification.id }
  };
}

// ============================================================================
// SPECIAL COMMAND HANDLERS
// ============================================================================

async function handleOpenGame(params) {
  const { game_name } = params;
  
  // Open Games Arcade and navigate to specific game
  const window = createWindow('games-arcade');
  
  return {
    success: true,
    message: `Opening ${game_name} game`,
    data: { window_id: window.id, game: game_name }
  };
}

async function handlePlayMusic(params) {
  const { query } = params;
  
  // Open Bardic Lute Player with search query
  const window = createWindow('bardic-lute-player');
  
  return {
    success: true,
    message: `Searching for: ${query}`,
    data: { window_id: window.id, query }
  };
}

async function handleSearchBook(params) {
  const { query } = params;
  
  // Open Spell Tome Library with search query
  const window = createWindow('spell-tome-library');
  
  return {
    success: true,
    message: `Searching for book: ${query}`,
    data: { window_id: window.id, query }
  };
}

async function handleStartPomodoro(params) {
  const { duration } = params;
  
  // Open Meditation Chamber with duration
  const window = createWindow('meditation-chamber');
  
  return {
    success: true,
    message: `Starting ${duration || 25} minute timer`,
    data: { window_id: window.id, duration: duration || 25 }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyTheme(theme) {
  const root = document.documentElement;
  
  const themes = {
    mossy: { primary: '#2d5016', secondary: '#6b4e8c', accent: '#5dd8ed', gold: '#d4af37' },
    volcanic: { primary: '#8b1a1a', secondary: '#d97706', accent: '#f59e0b', gold: '#ea580c' },
    arctic: { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#60a5fa', gold: '#93c5fd' },
    twilight: { primary: '#4c1d95', secondary: '#7c3aed', accent: '#a78bfa', gold: '#c4b5fd' }
  };
  
  const selectedTheme = themes[theme];
  if (selectedTheme) {
    root.style.setProperty('--color-primary', selectedTheme.primary);
    root.style.setProperty('--color-secondary', selectedTheme.secondary);
    root.style.setProperty('--color-accent', selectedTheme.accent);
    root.style.setProperty('--color-gold', selectedTheme.gold);
  }
}
