/**
 * AI Notification Generator
 * OpenAI API integration for context-aware notifications
 */

import { getRandomTemplate } from './templates.js';

// Load environment variables (in production, these should be injected)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://v98store.com/v1';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-nano-2025-08-07';

/**
 * Generate AI notification based on context
 * @param {Object} context - Notification context
 * @returns {Promise<Object>} Notification object {title, message, icon}
 */
export async function generateAINotification(context) {
  // Check if AI is enabled and API key is available
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_api_key_here') {
    console.log('[AI] API key not configured, using template fallback');
    return getTemplateFallback(context.category);
  }

  try {
    // Construct AI prompt
    const prompt = constructPrompt(context);
    
    // Call OpenAI API
    const notification = await callOpenAI(prompt);
    
    console.log('[AI] Generated notification:', notification);
    return notification;
  } catch (error) {
    console.error('[AI] Failed to generate AI notification:', error);
    
    // Fallback to templates on error
    return getTemplateFallback(context.category);
  }
}

/**
 * Construct AI prompt based on context
 * @param {Object} context - Notification context
 * @returns {string} Prompt for AI
 */
function constructPrompt(context) {
  const basePrompt = `You are a whimsical fantasy narrator for an enchanted desktop operating system called "Enchanted Realm Shell". Generate a brief, engaging notification message.

Context:
- Event: ${context.category}
- User action: ${context.action || 'general activity'}
- Time since last activity: ${context.timeSinceLastActivity || 'recently'}
${context.fileName ? `- File name: ${context.fileName}` : ''}
${context.fileType ? `- File type: ${context.fileType}` : ''}
${context.windowCount ? `- Open windows: ${context.windowCount}` : ''}

Requirements:
1. Keep it SHORT (1-2 sentences max, under 100 characters)
2. Use fantasy/medieval theme (wizards, scrolls, magic, taverns, quests)
3. Be encouraging and whimsical
4. Match the tone to the event (celebratory for saves, mysterious for idle, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "title": "3-5 word fantasy title",
  "message": "Brief message under 100 chars",
  "icon": "single appropriate emoji"
}`;

  return basePrompt;
}

/**
 * Call OpenAI API
 * @param {string} prompt - Prompt text
 * @returns {Promise<Object>} Notification object
 */
async function callOpenAI(prompt) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a creative fantasy narrator. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid OpenAI API response format');
  }

  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  let notification;
  try {
    // Try to extract JSON if wrapped in markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                      content.match(/```\s*([\s\S]*?)\s*```/);
    
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    notification = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('[AI] Failed to parse AI response:', content);
    throw new Error('Failed to parse AI notification JSON');
  }

  // Validate notification structure
  if (!notification.title || !notification.message) {
    throw new Error('AI notification missing required fields');
  }

  // Ensure icon exists
  if (!notification.icon) {
    notification.icon = '✨';
  }

  return notification;
}

/**
 * Get template fallback for category
 * @param {string} category - Notification category
 * @returns {Object} Notification template
 */
function getTemplateFallback(category) {
  const template = getRandomTemplate(category);
  console.log('[AI] Using template fallback:', template);
  return template;
}

/**
 * Test AI connection
 * @returns {Promise<boolean>} True if AI is available
 */
export async function testAIConnection() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_api_key_here') {
    return false;
  }

  try {
    const testContext = {
      category: 'welcome',
      action: 'connection test'
    };
    
    await generateAINotification(testContext);
    return true;
  } catch (error) {
    console.error('[AI] Connection test failed:', error);
    return false;
  }
}
