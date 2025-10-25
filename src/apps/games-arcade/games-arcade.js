/**
 * Games Arcade - Portal to the Realm's Gaming Collection
 * Access all available games in a mystical arcade interface
 */

/**
 * Create Games Arcade app
 * @returns {HTMLElement} Games arcade container
 */
export function createGamesArcadeApp() {
  const container = document.createElement('div');
  container.className = 'games-arcade-container';

  // List of available games
  const games = [
    {
      id: 'bounce',
      name: 'Bounce',
      description: 'Classic bouncing ball arcade game',
      icon: '🏀',
      path: '/games/bounce/index.html'
    },
    {
      id: 'snake',
      name: 'Snake',
      description: 'Guide the serpent to grow longer',
      icon: '🐍',
      path: '/games/snake/index.html'
    },
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Stack the falling blocks perfectly',
      icon: '🟦',
      path: '/games/tetris/index.html'
    },
    {
      id: 'defender',
      name: 'Defender',
      description: 'Defend the realm from invaders',
      icon: '🛡️',
      path: '/games/defender/index.html'
    },
    {
      id: 'pacman',
      name: 'Pacman',
      description: 'Navigate the maze and collect dots',
      icon: '👻',
      path: '/games/pacman/index.html'
    },
    {
      id: 'puzzle',
      name: 'Puzzle',
      description: 'Solve the enchanted puzzle',
      icon: '🧩',
      path: '/games/puzzle/index.html'
    },
    {
      id: 'spider',
      name: 'Spider',
      description: 'The classic spider solitaire',
      icon: '🕷️',
      path: '/games/spider/index.html'
    }
  ];

  container.innerHTML = `
    <div class="arcade-header">
      <h1 class="arcade-title">🎮 Mystical Games Arcade 🎮</h1>
      <p class="arcade-subtitle">Choose your adventure from the realm's finest games</p>
    </div>
    
    <div class="games-grid">
      ${games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
          <div class="game-icon">${game.icon}</div>
          <h3 class="game-name">${game.name}</h3>
          <p class="game-description">${game.description}</p>
          <button type="button" class="btn-play-game" data-game-path="${game.path}" data-game-id="${game.id}">
            Play Now
          </button>
        </div>
      `).join('')}
    </div>

    <div class="game-viewer hidden" id="game-viewer">
      <div class="game-viewer-header">
        <button class="btn-back-to-arcade" id="btn-back">← Back to Arcade</button>
        <h2 class="current-game-title" id="current-game-title"></h2>
        <button class="btn-fullscreen" id="btn-fullscreen">⛶ Fullscreen</button>
      </div>
      <div class="game-frame-container">
        <iframe class="game-frame" id="game-frame" allowfullscreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"></iframe>
      </div>
    </div>
  `;

  // Get DOM elements
  const gamesGrid = container.querySelector('.games-grid');
  const gameViewer = container.querySelector('#game-viewer');
  const gameFrame = container.querySelector('#game-frame');
  const currentGameTitle = container.querySelector('#current-game-title');
  const btnBack = container.querySelector('#btn-back');
  const btnFullscreen = container.querySelector('#btn-fullscreen');
  const arcadeHeader = container.querySelector('.arcade-header');

  // Handle clicks on game cards or play buttons
  container.addEventListener('click', (e) => {
    console.log('[Games Arcade] Click detected on:', e.target, 'Classes:', e.target.className);
    
    // Check if clicked on a play button
    const playButton = e.target.classList.contains('btn-play-game') 
      ? e.target 
      : e.target.closest('.btn-play-game');
    
    // Check if clicked anywhere on a game card
    const gameCard = e.target.classList.contains('game-card')
      ? e.target
      : e.target.closest('.game-card');
    
    if (playButton) {
      // Clicked the play button directly
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[Games Arcade] Play button clicked:', playButton);
      const gamePath = playButton.getAttribute('data-game-path');
      const gameId = playButton.getAttribute('data-game-id');
      const game = games.find(g => g.id === gameId);
      
      console.log('[Games Arcade] Game data:', { gameId, gamePath, game });
      
      if (game && gamePath) {
        playGame(game, gamePath);
      } else {
        console.error('[Games Arcade] Missing game data - gameId:', gameId, 'gamePath:', gamePath, 'game:', game);
      }
    } else if (gameCard) {
      // Clicked anywhere on the game card
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[Games Arcade] Game card clicked:', gameCard);
      const gameId = gameCard.getAttribute('data-game-id');
      const game = games.find(g => g.id === gameId);
      
      console.log('[Games Arcade] Game data from card:', { gameId, game });
      
      if (game) {
        playGame(game, game.path);
      } else {
        console.error('[Games Arcade] Game not found for ID:', gameId);
      }
    }
  });

  // Play game function
  function playGame(game, path) {
    console.log(`[Games Arcade] playGame called with:`, game, path);
    
    // Hide games grid and show game viewer
    gamesGrid.classList.add('hidden');
    arcadeHeader.classList.add('hidden');
    gameViewer.classList.remove('hidden');
    
    // Set game title
    currentGameTitle.textContent = game.name;
    
    // Load game in iframe
    console.log(`[Games Arcade] Setting iframe src to: ${path}`);
    gameFrame.src = path;
    
    console.log(`[Games Arcade] Loading game: ${game.name}`);
  }

  // Back to arcade button
  btnBack.addEventListener('click', () => {
    // Stop game by clearing iframe
    gameFrame.src = '';
    
    // Show games grid and hide game viewer
    gameViewer.classList.add('hidden');
    gamesGrid.classList.remove('hidden');
    arcadeHeader.classList.remove('hidden');
  });

  // Fullscreen button
  btnFullscreen.addEventListener('click', () => {
    const frameContainer = container.querySelector('.game-frame-container');
    
    if (frameContainer.requestFullscreen) {
      frameContainer.requestFullscreen();
    } else if (frameContainer.webkitRequestFullscreen) {
      frameContainer.webkitRequestFullscreen();
    } else if (frameContainer.msRequestFullscreen) {
      frameContainer.msRequestFullscreen();
    }
  });

  return container;
}
