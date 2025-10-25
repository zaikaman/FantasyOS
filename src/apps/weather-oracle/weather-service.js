/**
 * Weather Service
 * Fetches real-time weather data from WeatherAPI
 */

const WEATHER_API_KEY = import.meta.env.VITE_WEATHERAPI_API_KEY;
const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

/**
 * Fetch current weather for a location
 * @param {string} location - City name, zip code, or coordinates
 * @returns {Promise<Object>} Weather data
 */
export async function fetchWeather(location = 'London') {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/forecast.json?key=${WEATHER_API_KEY}&q=${location}&days=3&aqi=yes`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return parseWeatherData(data);
  } catch (error) {
    console.error('[WeatherService] Failed to fetch weather:', error);
    throw error;
  }
}

/**
 * Search for locations
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of matching locations
 */
export async function searchLocations(query) {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE}/search.json?key=${WEATHER_API_KEY}&q=${query}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[WeatherService] Failed to search locations:', error);
    throw error;
  }
}

/**
 * Parse weather data into a clean format
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed weather data
 */
function parseWeatherData(data) {
  const { location, current, forecast } = data;

  return {
    location: {
      name: location.name,
      region: location.region,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
      localtime: location.localtime
    },
    current: {
      temp_c: current.temp_c,
      temp_f: current.temp_f,
      condition: current.condition.text,
      conditionCode: current.condition.code,
      icon: current.condition.icon,
      windSpeed: current.wind_kph,
      windDir: current.wind_dir,
      windDirFull: getWindDirection(current.wind_dir),
      humidity: current.humidity,
      feelsLike_c: current.feelslike_c,
      feelsLike_f: current.feelslike_f,
      uv: current.uv,
      pressure: current.pressure_mb,
      visibility: current.vis_km,
      cloudCover: current.cloud,
      airQuality: current.air_quality
    },
    forecast: forecast.forecastday.map(day => ({
      date: day.date,
      maxTemp_c: day.day.maxtemp_c,
      minTemp_c: day.day.mintemp_c,
      condition: day.day.condition.text,
      conditionCode: day.day.condition.code,
      icon: day.day.condition.icon,
      chanceOfRain: day.day.daily_chance_of_rain,
      chanceOfSnow: day.day.daily_chance_of_snow
    }))
  };
}

/**
 * Get full wind direction name
 * @param {string} dir - Wind direction abbreviation
 * @returns {string} Full direction name
 */
function getWindDirection(dir) {
  const directions = {
    'N': 'North',
    'NNE': 'North-Northeast',
    'NE': 'Northeast',
    'ENE': 'East-Northeast',
    'E': 'East',
    'ESE': 'East-Southeast',
    'SE': 'Southeast',
    'SSE': 'South-Southeast',
    'S': 'South',
    'SSW': 'South-Southwest',
    'SW': 'Southwest',
    'WSW': 'West-Southwest',
    'W': 'West',
    'WNW': 'West-Northwest',
    'NW': 'Northwest',
    'NNW': 'North-Northwest'
  };
  
  return directions[dir] || dir;
}

/**
 * Get weather emoji based on condition code
 * @param {number} code - Weather condition code
 * @returns {string} Emoji representation
 */
export function getWeatherEmoji(code) {
  // WeatherAPI condition codes
  if (code === 1000) return '☀️'; // Sunny/Clear
  if ([1003, 1006].includes(code)) return '⛅'; // Partly cloudy
  if (code === 1009) return '☁️'; // Cloudy/Overcast
  if ([1030, 1135, 1147].includes(code)) return '🌫️'; // Mist/Fog
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) return '🌧️'; // Rain
  if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return '❄️'; // Snow
  if ([1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return '🌨️'; // Sleet/Ice
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️'; // Thunder
  
  return '🌤️'; // Default
}
