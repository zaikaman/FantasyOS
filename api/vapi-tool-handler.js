/**
 * Vapi Tool Handler - Server-side endpoint for handling RuneWizz tool calls
 * Deploy this to Vercel, Netlify, or any serverless platform
 */

// Note: In a real deployment, you'd import from your actual tool handlers
// For now, we'll create a proxy that forwards to the client

export default async function handler(req, res) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Vapi-Secret'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Optional: Verify request is from Vapi using server secret (disabled for testing)
  // Uncomment the code below if you want to add security in production
  /*
  const vapiSecret = req.headers['x-vapi-secret'];
  const expectedSecret = process.env.VAPI_SERVER_SECRET;
  
  if (expectedSecret && vapiSecret !== expectedSecret) {
    console.error('[Vapi Tool Handler] Invalid secret provided');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid X-Vapi-Secret header'
    });
  }
  */

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    console.log('[Vapi Tool Handler] Received payload:', JSON.stringify(payload, null, 2));

    const { message } = payload;

    if (!message) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Missing message in request body'
      });
    }

    // Handle different message types
    if (message.type === 'function-call') {
      return await handleFunctionCall(message, res);
    }

    if (message.type === 'tool-calls') {
      return await handleToolCalls(message, res);
    }

    // For other message types, just acknowledge
    console.log('[Vapi Tool Handler] Received message type:', message.type);
    res.status(200).json({ 
      received: true,
      messageType: message.type
    });
    
  } catch (error) {
    console.error('[Vapi Tool Handler] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Handle a single function call
 */
async function handleFunctionCall(message, res) {
  const { functionCall } = message;
  
  if (!functionCall) {
    return res.status(400).json({ 
      error: 'Bad request',
      message: 'Missing functionCall in message'
    });
  }

  console.log('[Vapi Tool Handler] Function call:', functionCall.name);
  console.log('[Vapi Tool Handler] Parameters:', JSON.stringify(functionCall.parameters));

  try {
    // Execute the tool
    const result = await executeTool(functionCall.name, functionCall.parameters);
    
    // Return result in the format Vapi expects
    return res.status(200).json({
      results: [{
        toolCallId: functionCall.id,
        result: JSON.stringify(result)
      }]
    });
  } catch (error) {
    console.error('[Vapi Tool Handler] Tool execution error:', error);
    
    // Return error in the format Vapi expects
    return res.status(200).json({
      results: [{
        toolCallId: functionCall.id,
        error: error.message,
        result: JSON.stringify({
          success: false,
          message: error.message
        })
      }]
    });
  }
}

/**
 * Handle multiple tool calls
 */
async function handleToolCalls(message, res) {
  const { toolCallList } = message;
  
  if (!toolCallList || !Array.isArray(toolCallList)) {
    return res.status(400).json({ 
      error: 'Bad request',
      message: 'Missing or invalid toolCallList in message'
    });
  }

  console.log('[Vapi Tool Handler] Processing', toolCallList.length, 'tool calls');

  const results = [];

  for (const toolCall of toolCallList) {
    try {
      const result = await executeTool(toolCall.function.name, toolCall.function.parameters);
      results.push({
        toolCallId: toolCall.id,
        result: JSON.stringify(result)
      });
    } catch (error) {
      console.error('[Vapi Tool Handler] Tool execution error:', error);
      results.push({
        toolCallId: toolCall.id,
        error: error.message,
        result: JSON.stringify({
          success: false,
          message: error.message
        })
      });
    }
  }

  return res.status(200).json({ results });
}

/**
 * Execute a tool/function call
 * 
 * IMPORTANT: This is a server-side implementation.
 * The actual tool execution needs to interact with the client browser.
 * 
 * For production, you have two options:
 * 1. Use WebSocket/SSE to send commands to connected clients
 * 2. Return instructions for the client to execute via the conversation
 */
async function executeTool(toolName, parameters) {
  console.log(`[Vapi Tool Handler] Executing tool: ${toolName}`);

  // For demonstration, we return mock responses
  // In production, you'd implement actual tool logic here
  
  switch (toolName) {
    // Window Management
    case 'create_window':
    case 'launch_app':
      return {
        success: true,
        message: `Opening ${parameters.app_id || 'application'}...`,
        action: 'window_created',
        data: {
          window_id: `win_${Date.now()}`,
          app_id: parameters.app_id
        }
      };

    case 'close_window':
      return {
        success: true,
        message: 'Window closed',
        action: 'window_closed'
      };

    case 'close_all_windows':
      return {
        success: true,
        message: 'All windows closed',
        action: 'all_windows_closed'
      };

    case 'get_all_windows':
      return {
        success: true,
        message: 'Retrieved window list',
        data: {
          windows: []
        }
      };

    case 'get_active_window':
      return {
        success: true,
        message: 'Retrieved active window',
        data: {
          window: null
        }
      };

    // Application Control
    case 'get_available_apps':
      return {
        success: true,
        message: 'Retrieved available apps',
        data: {
          apps: [
            'treasure-chest', 'mana-calculator', 'quest-log', 
            'weather-oracle', 'potion-mixer', 'realm-customizer',
            'echo-chamber', 'games-arcade', 'spell-tome-library',
            'bardic-lute-player', 'hex-canvas', 'meditation-chamber'
          ]
        }
      };

    // Settings
    case 'change_theme':
      return {
        success: true,
        message: `Theme changed to ${parameters.theme}`,
        action: 'theme_changed',
        data: { theme: parameters.theme }
      };

    case 'toggle_particles':
      return {
        success: true,
        message: `Particles ${parameters.enabled ? 'enabled' : 'disabled'}`,
        action: 'particles_toggled'
      };

    // System Info
    case 'get_system_time':
      return {
        success: true,
        message: 'Current time retrieved',
        data: {
          time: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString()
        }
      };

    case 'get_system_status':
      return {
        success: true,
        message: 'System status retrieved',
        data: {
          status: 'All systems operational',
          uptime: '42 minutes',
          memory: '2.3 GB available'
        }
      };

    // Notifications
    case 'create_notification':
      return {
        success: true,
        message: 'Notification created',
        action: 'notification_created',
        data: {
          notification_id: `notif_${Date.now()}`,
          text: parameters.text
        }
      };

    case 'read_notifications':
    case 'get_notifications':
      return {
        success: true,
        message: 'No unread notifications',
        data: {
          notifications: []
        }
      };

    // File Operations
    case 'create_file':
      return {
        success: true,
        message: `File "${parameters.name}" created`,
        action: 'file_created',
        data: {
          file_id: `file_${Date.now()}`,
          name: parameters.name,
          type: parameters.type
        }
      };

    case 'list_files':
      return {
        success: true,
        message: 'File list retrieved',
        data: {
          files: []
        }
      };

    // Games & Media
    case 'open_game':
      return {
        success: true,
        message: `Opening ${parameters.game_name} game...`,
        action: 'game_opened',
        data: { game: parameters.game_name }
      };

    case 'play_music':
      return {
        success: true,
        message: `Searching for: ${parameters.query}`,
        action: 'music_search',
        data: { query: parameters.query }
      };

    case 'search_book':
      return {
        success: true,
        message: `Searching for book: ${parameters.query}`,
        action: 'book_search',
        data: { query: parameters.query }
      };

    case 'start_pomodoro':
      return {
        success: true,
        message: `Starting ${parameters.duration || 25} minute Pomodoro timer`,
        action: 'pomodoro_started',
        data: { duration: parameters.duration || 25 }
      };

    // Calendar & Tasks
    case 'create_task':
      return {
        success: true,
        message: `Task created: ${parameters.title}`,
        action: 'task_created',
        data: {
          task_id: `task_${Date.now()}`,
          title: parameters.title,
          priority: parameters.priority || 'medium'
        }
      };

    case 'create_calendar_event':
      return {
        success: true,
        message: `Event created: ${parameters.title}`,
        action: 'event_created',
        data: {
          event_id: `event_${Date.now()}`,
          title: parameters.title,
          date: parameters.date
        }
      };

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
