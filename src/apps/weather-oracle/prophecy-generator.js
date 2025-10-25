/**
 * Prophecy Generator
 * Generates fantasy-themed weather predictions using AI
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = import.meta.env.VITE_BASE_URL;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL;

/**
 * Generate a fantasy prophecy based on weather data
 * @param {Object} weatherData - Current weather information
 * @returns {Promise<string>} AI-generated prophecy
 */
export async function generateProphecy(weatherData) {
  try {
    const { current, location } = weatherData;
    
    const prompt = `You are a mystical weather oracle in a fantasy realm. Based on this weather data, create a short, dramatic prophecy (2-3 sentences max) in an ancient, mystical tone:

Location: ${location.name}, ${location.country}
Condition: ${current.condition}
Temperature: ${current.temp_c}°C
Wind: ${current.windSpeed} km/h from the ${current.windDirFull}
Humidity: ${current.humidity}%
Cloud Cover: ${current.cloudCover}%

Include creative fantasy elements like:
- Dragon sighting risks based on wind/temperature
- Magical creatures and their behavior
- Mystical portents and omens
- Enchanted weather phenomena
- Ancient prophecies and warnings

Be dramatic, mysterious, and entertaining. Use emojis sparingly (1-2 max).`;

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
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
            content: 'You are an ancient weather oracle who speaks in mystical, fantasy-themed prophecies. Keep responses concise and dramatic.'
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
      const errorText = await response.text();
      console.error('[ProphecyGenerator] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[ProphecyGenerator] Invalid API response:', data);
      throw new Error('Invalid OpenAI API response format');
    }
    
    const content = data.choices[0].message.content.trim();
    console.log('[ProphecyGenerator] AI response:', content);
    
    return content;
  } catch (error) {
    console.error('[ProphecyGenerator] Failed to generate prophecy:', error);
    console.error('[ProphecyGenerator] Error details:', {
      message: error.message,
      stack: error.stack
    });
    return generateFallbackProphecy(weatherData);
  }
}

/**
 * Generate a fallback prophecy when AI is unavailable
 * @param {Object} weatherData - Current weather information
 * @returns {string} Rule-based prophecy
 */
function generateFallbackProphecy(weatherData) {
  const { current } = weatherData;
  const prophecies = [];

  // Wind-based prophecies
  if (current.windSpeed > 30) {
    prophecies.push(`Gale winds from the ${current.windDirFull}: +${Math.floor(current.windSpeed / 3)}% dragon sighting risk! 🐉`);
  } else if (current.windSpeed > 15) {
    prophecies.push(`The ${current.windDirFull} winds carry whispers of enchantment.`);
  } else {
    prophecies.push('The air lies still, a calm before mystical storms.');
  }

  // Temperature-based prophecies
  if (current.temp_c > 30) {
    prophecies.push('Fire elementals dance in the scorching heat—keep your wands cool! 🔥');
  } else if (current.temp_c < 5) {
    prophecies.push('Ice wraiths stir in the frozen air—beware frostbite curses! ❄️');
  } else if (current.temp_c > 20) {
    prophecies.push('Perfect weather for potion brewing and spell practice.');
  }

  // Condition-based prophecies
  const condition = current.condition.toLowerCase();
  if (condition.includes('rain')) {
    prophecies.push('The sky weeps mana—a favorable omen for water mages.');
  } else if (condition.includes('cloud')) {
    prophecies.push('Clouds veil the heavens—mysterious forces gather strength.');
  } else if (condition.includes('clear') || condition.includes('sunny')) {
    prophecies.push('The sun god smiles upon the realm this day.');
  } else if (condition.includes('snow')) {
    prophecies.push('Winter spirits blanket the land in crystalline magic.');
  }

  // Humidity-based prophecies
  if (current.humidity > 80) {
    prophecies.push('Moisture-loving sprites flourish in the heavy air.');
  }

  // Cloud cover prophecies
  if (current.cloudCover > 80) {
    prophecies.push('Shadow creatures find comfort in the darkened skies.');
  }

  // UV-based prophecies
  if (current.uv > 7) {
    prophecies.push('The sun\'s rays burn with arcane intensity—protection spells advised!');
  }

  // Select 2-3 random prophecies
  const selected = prophecies
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(3, prophecies.length));

  return selected.join(' ');
}

/**
 * Get a quick mystical interpretation of weather
 * @param {Object} weatherData - Weather information
 * @returns {string} Quick interpretation
 */
export function getQuickInterpretation(weatherData) {
  const { current } = weatherData;
  const interpretations = {
    'sunny': '☀️ The realm basks in celestial light',
    'clear': '✨ Crystal clear skies—perfect for stargazing',
    'partly cloudy': '⛅ A balance of light and shadow',
    'cloudy': '☁️ The heavens veil their secrets',
    'overcast': '☁️ Grey skies bring contemplation',
    'rain': '🌧️ Nature\'s tears nourish the land',
    'drizzle': '💧 Gentle droplets of liquid mana',
    'thunderstorm': '⛈️ The Storm Lords rage!',
    'snow': '❄️ Winter\'s crystalline blessing',
    'fog': '🌫️ Mystical mists obscure the path',
    'mist': '🌫️ Ethereal veils shroud the realm'
  };

  const condition = current.condition.toLowerCase();
  for (const [key, value] of Object.entries(interpretations)) {
    if (condition.includes(key)) {
      return value;
    }
  }

  return '🌤️ The weather weaves its mysterious pattern';
}
