/**
 * Weather Oracle
 * A mystical crystal ball showing weather forecasts with fantasy prophecies
 */

import { fetchWeather, getWeatherEmoji } from './weather-service.js';
import { generateProphecy, getQuickInterpretation } from './prophecy-generator.js';
import { eventBus, Events } from '../../core/event-bus.js';

let currentLocation = 'London';
let weatherData = null;
let isLoading = false;

/**
 * Create Weather Oracle app
 * @param {HTMLElement} windowEl - Window DOM element
 * @returns {HTMLElement} App container
 */
export function createWeatherOracleApp(windowEl) {
  const container = document.createElement('div');
  container.className = 'weather-oracle-container';
  
  // Create header
  const header = createHeader();
  
  // Create scrollable content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'oracle-content-wrapper';
  
  // Create location search
  const searchPanel = createSearchPanel(container);
  
  // Create crystal ball display
  const crystalBall = createCrystalBall();
  
  // Create weather details panel
  const detailsPanel = createDetailsPanel();
  
  // Create forecast panel
  const forecastPanel = createForecastPanel();
  
  // Assemble content
  contentWrapper.appendChild(searchPanel);
  contentWrapper.appendChild(crystalBall);
  contentWrapper.appendChild(detailsPanel);
  contentWrapper.appendChild(forecastPanel);
  
  // Assemble app
  container.appendChild(header);
  container.appendChild(contentWrapper);
  
  // Load initial weather data
  loadWeather(container, currentLocation);
  
  console.log('[WeatherOracle] Oracle initialized');
  
  return container;
}

/**
 * Create header section
 * @returns {HTMLElement} Header element
 */
function createHeader() {
  const header = document.createElement('div');
  header.className = 'oracle-header';
  header.innerHTML = `
    <div class="oracle-title">🔮 Wand Weather Oracle</div>
    <div class="oracle-subtitle">Scrying the Meteorological Fates</div>
  `;
  return header;
}

/**
 * Create crystal ball display
 * @returns {HTMLElement} Crystal ball element
 */
function createCrystalBall() {
  const ball = document.createElement('div');
  ball.className = 'crystal-ball-display';
  ball.id = 'crystal-ball-display';
  ball.innerHTML = `
    <div class="crystal-ball-inner">
      <div class="ball-glow"></div>
      <div class="ball-reflection"></div>
      <div class="ball-content">
        <div class="loading-runes">✨ Consulting the spirits... ✨</div>
      </div>
    </div>
    <div class="ball-stand"></div>
  `;
  return ball;
}

/**
 * Create weather details panel
 * @returns {HTMLElement} Details panel element
 */
function createDetailsPanel() {
  const panel = document.createElement('div');
  panel.className = 'weather-details-panel';
  panel.id = 'weather-details';
  panel.innerHTML = `
    <div class="detail-loading">Awaiting the oracle's vision...</div>
  `;
  return panel;
}

/**
 * Create forecast panel
 * @returns {HTMLElement} Forecast panel element
 */
function createForecastPanel() {
  const panel = document.createElement('div');
  panel.className = 'forecast-panel';
  panel.id = 'forecast-panel';
  panel.innerHTML = '';
  return panel;
}

/**
 * Create location search panel
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} Search panel element
 */
function createSearchPanel(container) {
  const panel = document.createElement('div');
  panel.className = 'location-search-panel';
  panel.innerHTML = `
    <div class="search-wrapper">
      <input 
        type="text" 
        id="location-search" 
        class="location-input" 
        placeholder="Enter realm or city..."
        value="${currentLocation}"
      />
      <button id="search-btn" class="search-btn">🔍 Scry</button>
      <button id="refresh-btn" class="refresh-btn" title="Refresh prophecy">🔄</button>
    </div>
  `;
  
  // Add event listeners
  const input = panel.querySelector('#location-search');
  const searchBtn = panel.querySelector('#search-btn');
  const refreshBtn = panel.querySelector('#refresh-btn');
  
  searchBtn.addEventListener('click', () => {
    const location = input.value.trim();
    if (location) {
      currentLocation = location;
      loadWeather(container, location);
    }
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const location = input.value.trim();
      if (location) {
        currentLocation = location;
        loadWeather(container, location);
      }
    }
  });
  
  refreshBtn.addEventListener('click', () => {
    loadWeather(container, currentLocation);
  });
  
  return panel;
}

/**
 * Load weather data for a location
 * @param {HTMLElement} container - App container
 * @param {string} location - Location to fetch weather for
 */
async function loadWeather(container, location) {
  if (isLoading) return;
  
  isLoading = true;
  
  const ballContent = container.querySelector('.ball-content');
  const detailsPanel = container.querySelector('#weather-details');
  const forecastPanel = container.querySelector('#forecast-panel');
  
  // Show loading state
  if (ballContent) {
    ballContent.innerHTML = `
      <div class="loading-runes">✨ Consulting the spirits... ✨</div>
    `;
  }
  if (detailsPanel) {
    detailsPanel.innerHTML = `<div class="detail-loading">Awaiting the oracle's vision...</div>`;
  }
  if (forecastPanel) {
    forecastPanel.innerHTML = '';
  }
  
  try {
    // Fetch weather data
    weatherData = await fetchWeather(location);
    
    // Update crystal ball with current weather
    if (ballContent) {
      updateCrystalBall(ballContent, weatherData);
    }
    
    // Generate and display prophecy
    if (detailsPanel) {
      await updateProphecy(detailsPanel, weatherData);
    }
    
    // Update forecast
    if (forecastPanel) {
      updateForecast(forecastPanel, weatherData);
    }
    
  } catch (error) {
    console.error('[WeatherOracle] Failed to load weather:', error);
    if (ballContent) {
      ballContent.innerHTML = `
        <div class="error-message">
          ⚠️ The spirits are silent...<br>
          <small>Location not found or connection failed</small>
        </div>
      `;
    }
    if (detailsPanel) {
      detailsPanel.innerHTML = `
        <div class="detail-error">The crystal ball's vision is clouded. Try another location.</div>
      `;
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Update crystal ball display with weather data
 * @param {HTMLElement} ballContent - Ball content element
 * @param {Object} data - Weather data
 */
function updateCrystalBall(ballContent, data) {
  const { current, location } = data;
  const emoji = getWeatherEmoji(current.conditionCode);
  
  ballContent.innerHTML = `
    <div class="ball-weather-icon">${emoji}</div>
    <div class="ball-temp">${Math.round(current.temp_c)}°C</div>
    <div class="ball-location">${location.name}</div>
    <div class="ball-condition">${current.condition}</div>
  `;
}

/**
 * Update prophecy section
 * @param {HTMLElement} panel - Details panel element
 * @param {Object} data - Weather data
 */
async function updateProphecy(panel, data) {
  const { current, location } = data;
  
  // Show quick interpretation first
  panel.innerHTML = `
    <div class="prophecy-section">
      <div class="prophecy-title">📜 The Oracle Speaks</div>
      <div class="prophecy-text generating">Channeling ancient wisdom...</div>
    </div>
    <div class="weather-stats">
      <div class="stat-item">
        <div class="stat-label">🌡️ Temperature</div>
        <div class="stat-value">${Math.round(current.temp_c)}°C (Feels like ${Math.round(current.feelsLike_c)}°C)</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">💨 Wind</div>
        <div class="stat-value">${current.windSpeed} km/h ${current.windDir}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">💧 Humidity</div>
        <div class="stat-value">${current.humidity}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">☁️ Clouds</div>
        <div class="stat-value">${current.cloudCover}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">👁️ Visibility</div>
        <div class="stat-value">${current.visibility} km</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">☀️ UV Index</div>
        <div class="stat-value">${current.uv}</div>
      </div>
    </div>
  `;
  
  // Generate AI prophecy
  try {
    console.log('[WeatherOracle] Generating AI prophecy...');
    const prophecy = await generateProphecy(data);
    console.log('[WeatherOracle] Received prophecy:', prophecy);
    const prophecyText = panel.querySelector('.prophecy-text');
    if (prophecyText) {
      prophecyText.textContent = prophecy;
      prophecyText.classList.remove('generating');
    }
  } catch (error) {
    console.error('[WeatherOracle] Failed to generate prophecy:', error);
    // Keep the fallback text or show a default message
    const prophecyText = panel.querySelector('.prophecy-text');
    if (prophecyText) {
      prophecyText.textContent = 'The spirits whisper of mysterious weather patterns...';
      prophecyText.classList.remove('generating');
    }
  }
}

/**
 * Update forecast panel
 * @param {HTMLElement} panel - Forecast panel element
 * @param {Object} data - Weather data
 */
function updateForecast(panel, data) {
  const { forecast } = data;
  
  panel.innerHTML = `
    <div class="forecast-title">🌙 Three-Day Prophecy</div>
    <div class="forecast-grid">
      ${forecast.map((day, index) => {
        const emoji = getWeatherEmoji(day.conditionCode);
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       date.toLocaleDateString('en-US', { weekday: 'short' });
        
        return `
          <div class="forecast-card">
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${emoji}</div>
            <div class="forecast-condition">${day.condition}</div>
            <div class="forecast-temp">
              <span class="temp-max">${Math.round(day.maxTemp_c)}°</span>
              <span class="temp-separator">/</span>
              <span class="temp-min">${Math.round(day.minTemp_c)}°</span>
            </div>
            ${day.chanceOfRain > 0 ? `<div class="forecast-rain">🌧️ ${day.chanceOfRain}%</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
