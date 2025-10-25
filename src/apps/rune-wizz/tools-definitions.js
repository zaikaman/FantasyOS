/**
 * Tool Definitions for RuneWizz
 * Comprehensive function definitions for OS control
 */

/**
 * Get all tool/function definitions
 * @returns {Array} Array of OpenAI-style function definitions
 */
export function getToolDefinitions() {
  return [
    // =====================
    // WINDOW MANAGEMENT
    // =====================
    {
      name: 'create_window',
      description: 'Create and open a new window for any application. Use this to launch apps.',
      parameters: {
        type: 'object',
        properties: {
          app_id: {
            type: 'string',
            description: 'The application ID to open. Available apps: treasure-chest, mana-calculator, quest-log, weather-oracle, potion-mixer, realm-customizer, echo-chamber, games-arcade, spell-tome-library, bardic-lute-player, hex-canvas, meditation-chamber',
            enum: ['treasure-chest', 'mana-calculator', 'quest-log', 'weather-oracle', 'potion-mixer', 'realm-customizer', 'echo-chamber', 'games-arcade', 'spell-tome-library', 'bardic-lute-player', 'hex-canvas', 'meditation-chamber']
          },
          title: {
            type: 'string',
            description: 'Optional custom window title'
          }
        },
        required: ['app_id']
      }
    },
    {
      name: 'close_window',
      description: 'Close a specific window by its ID or close the currently active window',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to close. If not provided, closes the active window.'
          }
        }
      }
    },
    {
      name: 'close_all_windows',
      description: 'Close all open windows at once',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'minimize_window',
      description: 'Minimize a window by its ID or the currently active window',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to minimize. If not provided, minimizes the active window.'
          }
        }
      }
    },
    {
      name: 'restore_window',
      description: 'Restore a minimized window',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to restore',
          }
        },
        required: ['window_id']
      }
    },
    {
      name: 'maximize_window',
      description: 'Maximize a window to fill the screen',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to maximize. If not provided, maximizes the active window.'
          }
        }
      }
    },
    {
      name: 'focus_window',
      description: 'Bring a window to front and focus it',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to focus',
          }
        },
        required: ['window_id']
      }
    },
    {
      name: 'get_all_windows',
      description: 'Get a list of all currently open windows with their IDs, titles, and states',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_active_window',
      description: 'Get information about the currently active/focused window',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'move_window',
      description: 'Move a window to a specific position on screen',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to move'
          },
          x: {
            type: 'number',
            description: 'X coordinate in pixels'
          },
          y: {
            type: 'number',
            description: 'Y coordinate in pixels'
          }
        },
        required: ['window_id', 'x', 'y']
      }
    },
    {
      name: 'resize_window',
      description: 'Resize a window to specific dimensions',
      parameters: {
        type: 'object',
        properties: {
          window_id: {
            type: 'string',
            description: 'The window ID to resize'
          },
          width: {
            type: 'number',
            description: 'Width in pixels'
          },
          height: {
            type: 'number',
            description: 'Height in pixels'
          }
        },
        required: ['window_id', 'width', 'height']
      }
    },

    // =====================
    // APPLICATION CONTROL
    // =====================
    {
      name: 'launch_app',
      description: 'Launch an application (creates a window for it)',
      parameters: {
        type: 'object',
        properties: {
          app_id: {
            type: 'string',
            description: 'The application ID to launch',
            enum: ['treasure-chest', 'mana-calculator', 'quest-log', 'weather-oracle', 'potion-mixer', 'realm-customizer', 'echo-chamber', 'games-arcade', 'spell-tome-library', 'bardic-lute-player', 'hex-canvas', 'meditation-chamber']
          }
        },
        required: ['app_id']
      }
    },
    {
      name: 'get_available_apps',
      description: 'Get a list of all available applications that can be launched',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_app_info',
      description: 'Get detailed information about a specific app',
      parameters: {
        type: 'object',
        properties: {
          app_id: {
            type: 'string',
            description: 'The application ID'
          }
        },
        required: ['app_id']
      }
    },

    // =====================
    // FILE OPERATIONS
    // =====================
    {
      name: 'create_file',
      description: 'Create a new file (scroll or artifact)',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'File name'
          },
          type: {
            type: 'string',
            description: 'File type: scroll (text) or artifact (binary)',
            enum: ['scroll', 'artifact']
          },
          content: {
            type: 'string',
            description: 'File content'
          }
        },
        required: ['name', 'type', 'content']
      }
    },
    {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          file_id: {
            type: 'string',
            description: 'The file ID to read'
          }
        },
        required: ['file_id']
      }
    },
    {
      name: 'update_file',
      description: 'Update an existing file\'s content or name',
      parameters: {
        type: 'object',
        properties: {
          file_id: {
            type: 'string',
            description: 'The file ID to update'
          },
          name: {
            type: 'string',
            description: 'New file name (optional)'
          },
          content: {
            type: 'string',
            description: 'New file content (optional)'
          }
        },
        required: ['file_id']
      }
    },
    {
      name: 'delete_file',
      description: 'Delete a file permanently',
      parameters: {
        type: 'object',
        properties: {
          file_id: {
            type: 'string',
            description: 'The file ID to delete'
          }
        },
        required: ['file_id']
      }
    },
    {
      name: 'list_files',
      description: 'List all files, optionally filtered by type',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by file type: scroll or artifact',
            enum: ['scroll', 'artifact', 'all']
          }
        }
      }
    },
    {
      name: 'search_files',
      description: 'Search for files by name',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'get_storage_info',
      description: 'Get storage usage information',
      parameters: {
        type: 'object',
        properties: {}
      }
    },

    // =====================
    // SETTINGS & CUSTOMIZATION
    // =====================
    {
      name: 'change_theme',
      description: 'Change the realm color theme',
      parameters: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            description: 'Theme name',
            enum: ['mossy', 'volcanic', 'arctic', 'twilight']
          }
        },
        required: ['theme']
      }
    },
    {
      name: 'change_background',
      description: 'Change the desktop background wallpaper',
      parameters: {
        type: 'object',
        properties: {
          background_id: {
            type: 'string',
            description: 'Background identifier'
          }
        },
        required: ['background_id']
      }
    },
    {
      name: 'toggle_particles',
      description: 'Enable or disable particle effects',
      parameters: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'True to enable, false to disable'
          }
        },
        required: ['enabled']
      }
    },
    {
      name: 'set_particle_density',
      description: 'Set particle effect density (0-5)',
      parameters: {
        type: 'object',
        properties: {
          density: {
            type: 'number',
            description: 'Particle density level from 0 to 5',
            minimum: 0,
            maximum: 5
          }
        },
        required: ['density']
      }
    },
    {
      name: 'get_setting',
      description: 'Get a specific setting value',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Setting key name'
          }
        },
        required: ['key']
      }
    },
    {
      name: 'update_setting',
      description: 'Update a setting value',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Setting key name'
          },
          value: {
            type: 'string',
            description: 'New setting value'
          }
        },
        required: ['key', 'value']
      }
    },
    {
      name: 'get_all_settings',
      description: 'Get all current settings',
      parameters: {
        type: 'object',
        properties: {}
      }
    },

    // =====================
    // NOTIFICATIONS
    // =====================
    {
      name: 'create_notification',
      description: 'Create a new notification',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Notification message'
          },
          context: {
            type: 'string',
            description: 'Optional context or category'
          }
        },
        required: ['text']
      }
    },
    {
      name: 'get_notifications',
      description: 'Get all notifications or only unread ones',
      parameters: {
        type: 'object',
        properties: {
          unread_only: {
            type: 'boolean',
            description: 'If true, returns only unread notifications'
          }
        }
      }
    },
    {
      name: 'read_notifications',
      description: 'Read out the unread notifications',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'mark_notification_read',
      description: 'Mark a notification as read',
      parameters: {
        type: 'object',
        properties: {
          notification_id: {
            type: 'string',
            description: 'Notification ID'
          }
        },
        required: ['notification_id']
      }
    },
    {
      name: 'dismiss_notification',
      description: 'Dismiss a notification',
      parameters: {
        type: 'object',
        properties: {
          notification_id: {
            type: 'string',
            description: 'Notification ID'
          }
        },
        required: ['notification_id']
      }
    },
    {
      name: 'clear_old_notifications',
      description: 'Clear old dismissed notifications (older than 7 days)',
      parameters: {
        type: 'object',
        properties: {}
      }
    },

    // =====================
    // SYSTEM INFORMATION
    // =====================
    {
      name: 'get_system_time',
      description: 'Get the current date and time',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: 'Time format: 12h or 24h',
            enum: ['12h', '24h']
          }
        }
      }
    },
    {
      name: 'get_system_status',
      description: 'Get overall system status and information',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_weather',
      description: 'Get current weather information (requires location)',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Location for weather query (city name or coordinates)'
          }
        },
        required: ['location']
      }
    },

    // =====================
    // CALENDAR & TASKS
    // =====================
    {
      name: 'create_calendar_event',
      description: 'Create a new calendar event',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Event title'
          },
          date: {
            type: 'string',
            description: 'Event date (ISO format or natural language)'
          },
          description: {
            type: 'string',
            description: 'Event description'
          }
        },
        required: ['title', 'date']
      }
    },
    {
      name: 'get_calendar_events',
      description: 'Get calendar events for a specific date range',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date (ISO format or "today")'
          },
          end_date: {
            type: 'string',
            description: 'End date (ISO format)'
          }
        }
      }
    },
    {
      name: 'create_task',
      description: 'Create a new task in the Quest Log',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Task title'
          },
          description: {
            type: 'string',
            description: 'Task description'
          },
          priority: {
            type: 'string',
            description: 'Task priority level',
            enum: ['low', 'medium', 'high']
          }
        },
        required: ['title']
      }
    },

    // =====================
    // SPECIAL COMMANDS
    // =====================
    {
      name: 'open_game',
      description: 'Open a specific game in the Games Arcade',
      parameters: {
        type: 'object',
        properties: {
          game_name: {
            type: 'string',
            description: 'Name of the game to open',
            enum: ['snake', 'tetris', 'pacman', 'bounce', 'defender', 'puzzle', 'spider']
          }
        },
        required: ['game_name']
      }
    },
    {
      name: 'play_music',
      description: 'Search and play music in the Bardic Lute Player',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Song name, artist, or search query'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'search_book',
      description: 'Search for and open a book in the Spell Tome Library',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Book title or author'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'start_pomodoro',
      description: 'Start a Pomodoro timer in the Meditation Chamber',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'number',
            description: 'Duration in minutes (default: 25)'
          }
        }
      }
    },
  ];
}

/**
 * Get app ID from natural language
 * Helper function to map common app references to IDs
 */
export function getAppIdFromName(name) {
  const appMap = {
    'calculator': 'mana-calculator',
    'calc': 'mana-calculator',
    'mana calculator': 'mana-calculator',
    
    'files': 'treasure-chest',
    'file manager': 'treasure-chest',
    'treasure chest': 'treasure-chest',
    'explorer': 'treasure-chest',
    
    'tasks': 'quest-log',
    'todo': 'quest-log',
    'quest log': 'quest-log',
    'quests': 'quest-log',
    
    'weather': 'weather-oracle',
    'weather oracle': 'weather-oracle',
    
    'notepad': 'potion-mixer',
    'notes': 'potion-mixer',
    'potion mixer': 'potion-mixer',
    'editor': 'potion-mixer',
    
    'settings': 'realm-customizer',
    'customizer': 'realm-customizer',
    'realm customizer': 'realm-customizer',
    'preferences': 'realm-customizer',
    
    'terminal': 'echo-chamber',
    'echo chamber': 'echo-chamber',
    'console': 'echo-chamber',
    'command': 'echo-chamber',
    
    'games': 'games-arcade',
    'arcade': 'games-arcade',
    'games arcade': 'games-arcade',
    
    'library': 'spell-tome-library',
    'books': 'spell-tome-library',
    'spell tome library': 'spell-tome-library',
    'reader': 'spell-tome-library',
    'ebook': 'spell-tome-library',
    
    'music': 'bardic-lute-player',
    'music player': 'bardic-lute-player',
    'bardic lute player': 'bardic-lute-player',
    'lute': 'bardic-lute-player',
    'player': 'bardic-lute-player',
    
    'draw': 'hex-canvas',
    'drawing': 'hex-canvas',
    'hex canvas': 'hex-canvas',
    'canvas': 'hex-canvas',
    'paint': 'hex-canvas',
    'art': 'hex-canvas',
    
    'timer': 'meditation-chamber',
    'pomodoro': 'meditation-chamber',
    'meditation chamber': 'meditation-chamber',
    'meditation': 'meditation-chamber',
    'focus': 'meditation-chamber',
  };
  
  const normalized = name.toLowerCase().trim();
  return appMap[normalized] || null;
}
