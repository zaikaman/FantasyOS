/**
 * Arcane Clock Tower - HUD Widget
 * Persistent clock with calendar and hourly chimes
 */

import { getState, subscribe, updateState } from '../core/state.js';
import { eventBus, Events } from '../core/event-bus.js';
import { playChime } from './clock-bells.js';
import { getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../storage/queries.js';
import { showConfirm, showPrompt, showCustomModal } from '../utils/modal.js';

let clockTowerElement = null;
let hourHandElement = null;
let minuteHandElement = null;
let secondHandElement = null;
let timeDisplayElement = null;
let dateDisplayElement = null;
let calendarToggle = null;
let calendarPanel = null;
let calendarEventsContainer = null;
let towerStructure = null;

let lastChimeHour = -1;
let updateInterval = null;

// Moon phase symbols (8 phases)
const MOON_PHASES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

/**
 * Initialize clock tower
 */
export function initClockTower() {
  console.log('[ClockTower] Initializing...');

  // Get DOM elements
  clockTowerElement = document.getElementById('clock-tower');
  hourHandElement = document.getElementById('hour-hand');
  minuteHandElement = document.getElementById('minute-hand');
  secondHandElement = document.getElementById('second-hand');
  timeDisplayElement = document.getElementById('time-display');
  calendarToggle = document.getElementById('calendar-toggle');
  calendarPanel = document.getElementById('calendar-panel');
  calendarEventsContainer = document.getElementById('calendar-events');
  towerStructure = clockTowerElement?.querySelector('.tower-structure');

  if (!clockTowerElement) {
    console.error('[ClockTower] Clock tower element not found');
    return;
  }

  // Get time/date display elements
  const timeText = timeDisplayElement?.querySelector('.time-text');
  const dateText = timeDisplayElement?.querySelector('.date-text');

  if (timeText && dateText) {
    dateDisplayElement = dateText;
  }

  // Setup calendar toggle
  setupCalendarToggle();

  // Setup calendar interactions
  setupCalendarInteractions();

  // Start clock updates
  startClock();

  // Render calendar events
  renderCalendarEvents();

  // Subscribe to calendar event changes
  subscribe('calendar_events', () => {
    renderCalendarEvents();
  });

  console.log('[ClockTower] Initialized');
}

/**
 * Start clock updates
 */
function startClock() {
  // Update immediately
  updateClock();

  // Update every second
  updateInterval = setInterval(() => {
    updateClock();
  }, 1000);
}

/**
 * Update clock display and hands
 */
function updateClock() {
  const now = new Date();
  
  // Get time components
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Update clock hands
  updateClockHands(hours, minutes, seconds);

  // Update time display
  updateTimeDisplay(hours, minutes);

  // Update date display
  updateDateDisplay(now);

  // Check for hourly chime
  checkHourlyChime(hours);
}

/**
 * Update clock hands rotation
 * @param {number} hours - Current hours (0-23)
 * @param {number} minutes - Current minutes (0-59)
 * @param {number} seconds - Current seconds (0-59)
 */
function updateClockHands(hours, minutes, seconds) {
  // Calculate rotation angles
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = (((hours % 12) + minutes / 60) / 12) * 360;

  // Apply rotations
  if (secondHandElement) {
    secondHandElement.style.transform = `rotate(${secondAngle}deg)`;
  }

  if (minuteHandElement) {
    minuteHandElement.style.transform = `rotate(${minuteAngle}deg)`;
  }

  if (hourHandElement) {
    hourHandElement.style.transform = `rotate(${hourAngle}deg)`;
  }
}

/**
 * Update time display text
 * @param {number} hours - Current hours
 * @param {number} minutes - Current minutes
 */
function updateTimeDisplay(hours, minutes) {
  const timeText = timeDisplayElement?.querySelector('.time-text');
  
  if (timeText) {
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    timeText.textContent = formattedTime;
  }
}

/**
 * Update date display text
 * @param {Date} date - Current date
 */
function updateDateDisplay(date) {
  if (dateDisplayElement) {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    dateDisplayElement.textContent = formattedDate;
  }
}

/**
 * Check and trigger hourly chime
 * @param {number} hours - Current hours
 */
function checkHourlyChime(hours) {
  // Only chime on the hour (when minutes and seconds are 00:00)
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Trigger chime at the top of the hour
  if (minutes === 0 && seconds === 0 && hours !== lastChimeHour) {
    lastChimeHour = hours;
    triggerChime(hours);
  }
}

/**
 * Trigger clock chime
 * @param {number} hours - Number of chimes (hour of day)
 */
function triggerChime(hours) {
  console.log(`[ClockTower] 🔔 Chiming ${hours % 12 || 12} times...`);

  // Add chiming animation to tower
  if (towerStructure) {
    towerStructure.classList.add('chiming');
    setTimeout(() => {
      towerStructure.classList.remove('chiming');
    }, 1000);
  }

  // Play bell chimes
  const chimeCount = hours % 12 || 12; // Convert to 12-hour format
  playChime(chimeCount);

  // Emit chime event
  eventBus.emit('clock:chime', { 
    hour: hours, 
    chimes: chimeCount,
    timestamp: Date.now() 
  });
}

/**
 * Setup calendar toggle button
 */
function setupCalendarToggle() {
  if (!calendarToggle || !calendarPanel) {
    return;
  }

  calendarToggle.addEventListener('click', () => {
    toggleCalendar();
  });

  // Close calendar when clicking close button
  const closeBtn = document.getElementById('calendar-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideCalendar();
    });
  }

  // Close calendar when clicking outside
  document.addEventListener('click', (event) => {
    if (!clockTowerElement?.contains(event.target)) {
      hideCalendar();
    }
  });
}

/**
 * Toggle calendar panel visibility
 */
function toggleCalendar() {
  if (calendarPanel?.classList.contains('hidden')) {
    showCalendar();
  } else {
    hideCalendar();
  }
}

/**
 * Show calendar panel
 */
function showCalendar() {
  calendarPanel?.classList.remove('hidden');
  renderCalendarEvents();
}

/**
 * Hide calendar panel
 */
function hideCalendar() {
  calendarPanel?.classList.add('hidden');
}

/**
 * Setup calendar interactions (add event, drag & drop)
 */
function setupCalendarInteractions() {
  // Add event button
  const addEventBtn = document.getElementById('btn-add-event');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      showAddEventDialog();
    });
  }
}

/**
 * Render calendar events
 */
function renderCalendarEvents() {
  if (!calendarEventsContainer) {
    return;
  }

  const events = getCalendarEvents();

  // Clear existing
  calendarEventsContainer.innerHTML = '';

  if (events.length === 0) {
    calendarEventsContainer.innerHTML = `
      <div class="calendar-empty">
        No upcoming events. Click "+" to add a moon event.
      </div>
    `;
    return;
  }

  // Sort events by date
  const sortedEvents = events.sort((a, b) => {
    return new Date(a.event_date) - new Date(b.event_date);
  });

  // Render each event
  sortedEvents.forEach(event => {
    const eventElement = createEventElement(event);
    calendarEventsContainer.appendChild(eventElement);
  });

  console.log(`[ClockTower] Rendered ${events.length} calendar events`);
}

/**
 * Create calendar event element
 * @param {Object} event - Calendar event data
 * @returns {HTMLElement} Event element
 */
function createEventElement(event) {
  const div = document.createElement('div');
  div.className = 'calendar-event';
  div.dataset.eventId = event.id;
  div.draggable = true;

  // Get moon phase for event
  const moonPhase = getMoonPhaseForDate(new Date(event.event_date));

  // Format date
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  div.innerHTML = `
    <div class="event-moon">${moonPhase}</div>
    <div class="event-title">${escapeHtml(event.title)}</div>
    <div class="event-date">${formattedDate}</div>
    ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
  `;

  // Setup drag handlers
  setupEventDragHandlers(div, event);

  return div;
}

/**
 * Setup drag handlers for calendar event
 * @param {HTMLElement} element - Event element
 * @param {Object} event - Event data
 */
function setupEventDragHandlers(element, event) {
  element.addEventListener('dragstart', (e) => {
    element.classList.add('dragging');
    
    // Set drag data for quest log integration
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'calendar-event',
      event: event
    }));

    console.log('[ClockTower] Started dragging event:', event.title);
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
  });

  // Double-click to edit
  element.addEventListener('dblclick', () => {
    showEditEventDialog(event);
  });
}

/**
 * Get moon phase symbol for a date
 * @param {Date} date - Date to calculate moon phase for
 * @returns {string} Moon phase emoji
 */
function getMoonPhaseForDate(date) {
  // Simple moon phase calculation (approximate)
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Calculate days since known new moon (Jan 6, 2000)
  const baseDate = new Date(2000, 0, 6);
  const diffTime = date - baseDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Moon cycle is approximately 29.53 days
  const moonCycle = 29.53;
  const phase = (diffDays % moonCycle) / moonCycle;

  // Map to 8 phases
  const phaseIndex = Math.floor(phase * 8);
  return MOON_PHASES[phaseIndex];
}

/**
 * Show add event dialog
 */
async function showAddEventDialog() {
  const title = await showPrompt('Event Title:', '', '📅 New Event');
  if (!title) return;

  const dateStr = await showPrompt('Event Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0], '📆 Event Date');
  if (!dateStr) return;

  const description = await showPrompt('Description (optional):', '', '📝 Description');

  // Add event
  const event = addCalendarEvent({
    title,
    event_date: dateStr,
    description: description || '',
    event_type: 'custom'
  });

  if (event) {
    console.log('[ClockTower] Added calendar event:', event);
    
    // Trigger re-render
    const state = getState();
    updateState({
      calendar_events: getCalendarEvents()
    });

    // Emit event
    eventBus.emit('calendar:event-added', { event });
  }
}

/**
 * Show edit event dialog
 * @param {Object} event - Event to edit
 */
async function showEditEventDialog(event) {
  const action = await showCustomModal({
    title: '📅 Manage Event',
    message: `What would you like to do with "${event.title}"?`,
    buttons: [
      { id: 'delete', text: 'Delete', className: 'modal-btn-danger' },
      { id: 'cancel', text: 'Cancel', className: 'modal-btn-secondary' },
      { id: 'edit', text: 'Edit', className: 'modal-btn-primary' }
    ]
  });

  if (action === 'edit') {
    // Edit
    const newTitle = await showPrompt('Event Title:', event.title, '✏️ Edit Event');
    if (!newTitle) return;

    const newDateStr = await showPrompt('Event Date (YYYY-MM-DD):', event.event_date, '📅 Event Date');
    if (!newDateStr) return;

    const newDescription = await showPrompt('Description:', event.description, '📝 Description');

    updateCalendarEvent(event.id, {
      title: newTitle,
      event_date: newDateStr,
      description: newDescription || ''
    });

    // Trigger re-render
    const state = getState();
    updateState({
      calendar_events: getCalendarEvents()
    });

    eventBus.emit('calendar:event-updated', { event });
  } else if (action === 'delete') {
    // Delete
    const confirmDelete = await showConfirm(`Delete event "${event.title}"?`, '🗑️ Confirm Delete');
    if (confirmDelete) {
      deleteCalendarEvent(event.id);

      // Trigger re-render
      const state = getState();
      updateState({
        calendar_events: getCalendarEvents()
      });

      eventBus.emit('calendar:event-deleted', { event });
    }
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Stop clock updates
 */
export function stopClock() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

/**
 * Manually trigger a chime (for testing)
 * @param {number} count - Number of chimes
 */
export function manualChime(count = 1) {
  triggerChime(count);
}
