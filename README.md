# 🧙‍♂️ RuneShell - Enchanted Realm Shell

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![Vite](https://img.shields.io/badge/vite-5.4.21-purple)

**A mystical desktop environment where magic meets technology**

*Experience a fully-functional browser-based operating system wrapped in medieval fantasy aesthetics*

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📜 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#-architecture)
- [Applications](#-applications)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**RuneShell** (Enchanted Realm Shell) is a fantasy-themed desktop environment that runs entirely in your browser. Inspired by traditional Linux desktop environments, it provides a complete windowing system, file management, application ecosystem, and persistent storage—all wrapped in an immersive medieval fantasy aesthetic.

Built with modern web technologies including Vite, SQL.js, and the Vapi AI SDK, RuneShell demonstrates the power of Progressive Web Applications while delivering a unique, enchanting user experience.

### Key Highlights

- 🪟 **Full Window Management** - Drag, resize, minimize, maximize, and close windows with smooth animations
- 💾 **Persistent Storage** - IndexedDB-powered file system for notes, drawings, and application data
- 🎮 **Rich Application Ecosystem** - 14+ built-in applications from calculators to games
- 🎨 **Customizable Themes** - Multiple color schemes and backgrounds
- 🧚 **Particle Effects** - Animated fireflies with adjustable density
- 🗓️ **Calendar System** - Event management with persistent storage
- 🎵 **Media Support** - Music player, YouTube integration, and audio capabilities
- 🤖 **AI Voice Agent** - Vapi-powered voice assistant (RuneWizz)
- ⚡ **High Performance** - Optimized rendering with sub-1.5s initialization target

---

## ✨ Features

### Core Operating System Features

#### Window Management System
- **Draggable Windows** - Click and drag window title bars to reposition
- **Resizable Windows** - Drag corners or edges to resize with live feedback
- **Z-Index Management** - Click to bring windows to front
- **Minimize/Maximize** - Collapse windows to taskbar or expand to full screen
- **Window Snapping** - Smart positioning to prevent off-screen windows
- **Multi-Window Multitasking** - Run multiple applications simultaneously
- **Keyboard Shortcuts** - Efficient navigation (Esc to close, Ctrl+M to minimize, etc.)

#### File System
- **Treasure Chest Explorer** - Visual file browser with fantasy theming
- **IndexedDB Backend** - Persistent storage that survives browser sessions
- **File Types** - Support for notes (scrolls), drawings (artifacts), and structured data
- **CRUD Operations** - Create, read, update, and delete files
- **File Metadata** - Creation dates, modification tracking, and tags
- **Storage Quotas** - Intelligent handling of browser storage limits

#### Desktop Environment
- **Mossy Forest Background** - Immersive fantasy atmosphere
- **Animated Particles** - Firefly effects with configurable density
- **Application Launcher** - Glowing rune icons for quick app access
- **Taskbar** - Persistent bottom bar showing active windows
- **Clock Tower HUD** - Animated analog clock with digital display
- **Calendar Integration** - Event scheduling and reminders
- **Notification System** - Quest-style popup notifications (optional)

### Theme & Customization

#### Realm Customizer
- **Color Themes**
  - Mossy Green (default)
  - Volcanic Red
  - Arctic Blue
  - Twilight Purple
- **Background Options**
  - Multiple fantasy landscapes
  - Custom image support
- **Particle Settings**
  - Adjustable density (0-4)
  - Enable/disable animations
- **Performance Modes**
  - Low, Medium, High quality settings

### Built-in Applications

#### Productivity Apps
1. **Potion Mixer (Notepad)** - Rich text editor for notes and scrolls
2. **Quest Log** - Todo list and task management
3. **Mana Calculator** - Fantasy-themed calculator with spell effects
4. **Calendar of Moons** - Event scheduling and date management
5. **Spell Tome Library** - Document reader and PDF viewer

#### Creative Apps
6. **Hex Canvas Studio** - Drawing application with color palettes and tools
7. **Bardic Lute Player** - Music player with YouTube integration
8. **Meditation Chamber** - Pomodoro timer with ambient sounds

#### Utility Apps
9. **Weather Oracle** - Real-time weather information with fantasy presentation
10. **Echo Chamber Terminal** - Command-line interface with SQL.js integration
11. **Treasure Chest** - File manager and storage explorer
12. **Realm Customizer** - Settings and theme configuration

#### Entertainment
13. **Mystical Games Arcade** - Collection of 7 classic games:
    - Snake
    - Tetris
    - Pac-Man
    - Space Defender
    - Bounce
    - Puzzle Slider
    - Spider Solitaire

#### AI Integration
14. **RuneWizz Voice Agent** - AI-powered voice assistant using Vapi SDK
    - Voice-to-voice conversations
    - Context-aware responses
    - Tool calling for file management
    - Calendar integration
    - Weather queries

---

## 🎮 Demo

### Live Demo
Visit the live deployment: [RuneShell on Vercel](#) *(Add your deployment URL)*

### Screenshots

*(Add screenshots of your application here)*

```
[Desktop Overview] [Window Management] [Treasure Chest] [Games Arcade]
```

### Video Demo

*(Optional: Link to a video demonstration)*

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Modern web browser (Chrome >= 90, Firefox >= 88, Safari >= 14)

### Clone the Repository

```bash
git clone https://github.com/zaikaman/FantasyOS.git
cd RuneShell
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (optional for AI features):

```env
# Vapi AI Configuration (for RuneWizz voice agent)
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=your_assistant_id

# Tavily API (for web search in Echo Chamber)
VITE_TAVILY_API_KEY=your_tavily_api_key
```

---

## 💻 Usage

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

Access the application at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Additional Commands

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code formatting
npm run format:check

# Build with bundle analysis
npm run build:analyze
```

---

## 🏗️ Architecture

### Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES2020+)
- **Build Tool**: Vite 5.4.21
- **Database**: IndexedDB with SQL.js for advanced queries
- **AI Integration**: Vapi AI SDK (@vapi-ai/web)
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier
- **Deployment**: Vercel with serverless functions

### Project Structure

```
RuneShell/
├── index.html              # Main entry point with desktop layout
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── vercel.json             # Deployment configuration
│
├── src/                    # Source code
│   ├── main.js             # Application initialization
│   ├── core/               # Core systems
│   │   ├── state.js        # Global state management
│   │   ├── event-bus.js    # Event system
│   │   └── notification-triggers.js
│   ├── window/             # Window management
│   │   ├── window-manager.js
│   │   ├── drag-handler.js
│   │   ├── resize-handler.js
│   │   └── keyboard-shortcuts.js
│   ├── desktop/            # Desktop environment
│   │   ├── desktop.js
│   │   └── particles.js    # Firefly animation
│   ├── storage/            # Data persistence
│   │   ├── database.js     # IndexedDB wrapper
│   │   ├── queries.js      # SQL.js queries
│   │   ├── restore-session.js
│   │   └── cleanup.js
│   ├── apps/               # Application modules
│   │   ├── mana-calculator/
│   │   ├── treasure-chest/
│   │   ├── quest-log/
│   │   ├── weather-oracle/
│   │   ├── potion-mixer/
│   │   ├── realm-customizer/
│   │   ├── echo-chamber/
│   │   ├── games-arcade/
│   │   ├── spell-tome-library/
│   │   ├── bardic-lute-player/
│   │   ├── hex-canvas/
│   │   ├── meditation-chamber/
│   │   └── rune-wizz/
│   ├── taskbar/            # Taskbar system
│   │   └── taskbar.js
│   ├── hud/                # HUD elements
│   │   └── clock-tower.js
│   ├── notifications/      # Notification system
│   ├── assets/             # Images, icons, backgrounds
│   └── utils/              # Utility functions
│       └── performance.js
│
├── styles/                 # CSS modules
│   ├── reset.css
│   ├── variables.css       # CSS custom properties
│   ├── desktop.css
│   ├── window.css
│   ├── taskbar.css
│   └── [app-specific].css
│
├── games/                  # Game implementations
│   ├── snake/
│   ├── tetris/
│   ├── pacman/
│   ├── defender/
│   ├── bounce/
│   ├── puzzle/
│   └── spider/
│
├── api/                    # Serverless functions
│   ├── tavily-proxy.js     # Search API proxy
│   └── vapi-tool-handler.js # AI tool handler
│
├── docs/                   # Documentation
│   └── fern/               # API documentation
│
└── specs/                  # Feature specifications
    └── 001-enchanted-realm-shell/
```

### Core Systems

#### State Management
- Centralized state store with reactive updates
- Subscribe/publish pattern for component communication
- Automatic persistence to IndexedDB
- Debounced auto-save to prevent excessive writes

#### Event System
- Global event bus for decoupled communication
- Type-safe event definitions
- Support for async event handlers
- Event lifecycle hooks

#### Window Management
- Z-index stack management
- Drag and drop with boundary constraints
- Resize with minimum/maximum dimensions
- Window state persistence and restoration
- Keyboard navigation support

#### Storage Layer
- IndexedDB for structured data
- SQL.js for complex queries
- Automatic schema migrations
- Backup and restore functionality
- Storage quota management

---

## 📱 Applications

### Detailed Application Guide

#### 🧪 Potion Mixer (Notepad)
A rich text editor styled as an alchemist's workbench.

**Features:**
- Create and edit text notes
- Auto-save functionality
- Search within notes
- Markdown support
- Export to plain text

**Usage:**
1. Click the Potion Mixer icon on desktop
2. Click "New Scroll" to create a note
3. Type your content
4. Saves automatically to Treasure Chest

#### 📋 Quest Log (Todo List)
Task management with fantasy theming.

**Features:**
- Create tasks with descriptions
- Mark complete/incomplete
- Set priorities (High, Medium, Low)
- Due date tracking
- Filter by status
- Persistent storage

**Usage:**
1. Open Quest Log application
2. Click "+ New Quest" 
3. Enter task details
4. Check off quests as completed

#### 🔮 Mana Calculator
A magical calculator with spell effects.

**Features:**
- Basic arithmetic operations
- Floating orb interface
- Magical animations
- Keyboard input support
- Memory functions

**Usage:**
- Click calculator buttons or use keyboard
- Press "Cast" (=) to see results
- Errors display fantasy messages

#### 🎨 Hex Canvas Studio
A drawing application with medieval aesthetic.

**Features:**
- Brush and eraser tools
- Color picker with palette
- Adjustable brush size
- Undo/redo functionality
- Save as artifact to Treasure Chest
- Export as PNG

**Usage:**
1. Select tool (brush/eraser)
2. Choose color from palette
3. Draw on canvas
4. Click "Store Artifact" to save

#### 🎵 Bardic Lute Player
Music player with YouTube integration.

**Features:**
- YouTube video embedding
- Search and play songs
- Playlist management
- Volume control
- Now playing display

**Usage:**
1. Enter YouTube URL or search query
2. Click "Summon Music"
3. Control playback with player controls

#### 🎮 Mystical Games Arcade
Collection of classic games reimagined with fantasy themes.

**Available Games:**
- **Snake** - Classic snake with mystical serpent graphics
- **Tetris** - Block puzzle with rune pieces
- **Pac-Man** - Maze navigation with fantasy sprites
- **Space Defender** - Shoot 'em up with magical projectiles
- **Bounce** - Ball physics puzzle
- **Puzzle Slider** - Image sliding puzzle
- **Spider Solitaire** - Card game with decorative deck

**Usage:**
1. Open Games Arcade
2. Select a game from the menu
3. Follow game-specific instructions
4. High scores saved automatically

#### 🗓️ Calendar of Moons
Event scheduling with lunar theming.

**Features:**
- Monthly calendar view
- Create/edit/delete events
- Event reminders
- Color-coded categories
- Export to ICS

**Usage:**
1. Click Clock Tower HUD calendar button
2. Click "+ Add Event" 
3. Fill in event details
4. Events display on calendar

#### 🤖 RuneWizz Voice Agent
AI-powered voice assistant.

**Features:**
- Voice-to-voice conversations
- Natural language understanding
- File management commands
- Calendar integration
- Weather queries
- Context-aware responses

**Usage:**
1. Open RuneWizz application
2. Click microphone to start conversation
3. Speak your request
4. AI responds with voice and text

**Example Commands:**
- "Create a new note called Meeting Notes"
- "What events do I have tomorrow?"
- "What's the weather in London?"
- "Show me my files"

---

## 🛠️ Development

### Development Guidelines

#### Code Style
- ES2020+ JavaScript features
- Modular architecture with clear separation of concerns
- JSDoc comments for all public functions
- Consistent naming conventions (camelCase for variables/functions)
- Fantasy-themed naming where appropriate

#### Adding a New Application

1. **Create Application Directory**
```bash
mkdir src/apps/my-new-app
touch src/apps/my-new-app/index.js
touch styles/my-new-app.css
```

2. **Implement Application Class**
```javascript
// src/apps/my-new-app/index.js
export class MyNewApp {
  constructor() {
    this.title = 'My New App';
    this.icon = '🆕';
  }

  render() {
    return `
      <div class="my-new-app">
        <h2>My New App Content</h2>
      </div>
    `;
  }

  mount(container) {
    container.innerHTML = this.render();
    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    // Add event listeners
  }

  destroy() {
    // Cleanup
  }
}
```

3. **Register in App Registry**
```javascript
// src/apps/app-registry.js
import { MyNewApp } from './my-new-app/index.js';

export const APP_REGISTRY = {
  // ...existing apps
  'my-new-app': {
    name: 'My New App',
    icon: '🆕',
    class: MyNewApp,
    position: { x: 100, y: 100 }
  }
};
```

4. **Add Desktop Icon**
```html
<!-- index.html -->
<div class="my-new-app-icon" id="my-new-app-icon">
  <img src="/src/assets/my-icon.png" alt="My New App">
  <span class="app-icon-label">My New App</span>
</div>
```

5. **Import CSS in main.js**
```javascript
import '../styles/my-new-app.css';
```

#### Performance Best Practices

- Use `requestAnimationFrame` for animations
- Debounce expensive operations (window resize, auto-save)
- Lazy load application modules
- Minimize DOM manipulations
- Use CSS transforms for animations
- Implement virtual scrolling for large lists
- Cache frequently accessed data

#### Testing

```javascript
// Example test with Vitest
import { describe, it, expect } from 'vitest';
import { MyNewApp } from '../src/apps/my-new-app';

describe('MyNewApp', () => {
  it('should initialize with correct properties', () => {
    const app = new MyNewApp();
    expect(app.title).toBe('My New App');
    expect(app.icon).toBe('🆕');
  });

  it('should render content', () => {
    const app = new MyNewApp();
    const html = app.render();
    expect(html).toContain('My New App Content');
  });
});
```

### Build Configuration

#### Vite Configuration
The `vite.config.js` includes:
- Path aliases for clean imports
- Terser minification with console removal
- Manual chunking for sql.js
- Build optimization
- Development server with HMR
- Bundle analysis with `rollup-plugin-visualizer`

#### Environment Variables
- `VITE_VAPI_PUBLIC_KEY` - Vapi AI public key
- `VITE_VAPI_ASSISTANT_ID` - Assistant configuration ID
- `VITE_TAVILY_API_KEY` - Search API key

---

## 🧪 Testing

### Unit Tests

Run unit tests with Vitest:

```bash
npm run test
```

Watch mode for TDD:

```bash
npm run test:watch
```

### End-to-End Tests

Run E2E tests with Playwright:

```bash
npm run test:e2e
```

### Test Coverage

Generate coverage report:

```bash
npm run test -- --coverage
```

### Manual Testing Checklist

- [ ] Desktop loads with background and particles
- [ ] All application icons are visible and clickable
- [ ] Windows can be dragged, resized, minimized, maximized
- [ ] Multiple windows manage z-index correctly
- [ ] Files persist after browser refresh
- [ ] Theme changes apply immediately
- [ ] Calendar events save and display correctly
- [ ] Games are playable without errors
- [ ] Voice agent connects and responds
- [ ] No console errors in production build

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Production Deployment**
```bash
vercel --prod
```

The `vercel.json` configuration includes:
- COEP/COOP headers for SharedArrayBuffer support
- Security headers (X-Frame-Options, CSP)
- SPA routing rewrites
- API serverless functions

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Upload the `dist/` directory to your hosting provider

3. Configure server headers (required for SQL.js):
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t runeshell .
docker run -p 5173:5173 runeshell
```

---

## ⚡ Performance

### Optimization Strategies

#### Load Time Optimization
- **Target**: First Contentful Paint < 1.5s
- Lazy loading for non-critical modules
- Code splitting for large dependencies
- Image optimization and lazy loading
- Critical CSS inlining

#### Runtime Optimization
- RequestAnimationFrame for smooth animations
- Debounced scroll and resize handlers
- Virtual DOM techniques for large lists
- Web Workers for heavy computations
- IndexedDB batch operations

#### Bundle Size
- Production build < 500KB (excluding games)
- Tree-shaking unused code
- Terser minification
- Gzip compression
- Manual chunk splitting

### Performance Monitoring

Built-in performance monitoring:

```javascript
import { mark, measure, logAllMetrics } from '@utils/performance';

// Mark events
mark('operation-start');
// ... perform operation
mark('operation-end');

// Measure duration
measure('operation-duration', 'operation-start', 'operation-end');

// Log all metrics
logAllMetrics();
```

View in browser DevTools:
- Performance tab for profiling
- Network tab for load analysis
- Memory tab for leak detection

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

1. **Report Bugs** - Open an issue with detailed reproduction steps
2. **Suggest Features** - Share your ideas in discussions
3. **Submit Pull Requests** - Fix bugs or implement features
4. **Improve Documentation** - Clarify or expand docs
5. **Create Themes** - Design new color schemes and backgrounds
6. **Build Applications** - Create new apps for the ecosystem

### Development Workflow

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/FantasyOS.git
cd RuneShell
```

2. **Create Feature Branch**
```bash
git checkout -b feature/my-new-feature
```

3. **Make Changes**
- Follow code style guidelines
- Add tests for new functionality
- Update documentation

4. **Test Your Changes**
```bash
npm run lint
npm run test
npm run build
```

5. **Commit with Conventional Commits**
```bash
git commit -m "feat: add new mystical application"
git commit -m "fix: resolve window dragging bug"
git commit -m "docs: update README with examples"
```

6. **Push and Create PR**
```bash
git push origin feature/my-new-feature
```

### Code Review Process

- All PRs require review before merging
- CI/CD checks must pass
- Maintain test coverage above 70%
- Follow semantic versioning

### Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Share knowledge and learnings

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 RuneShell Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Technologies

- **Vite** - Lightning-fast build tool
- **SQL.js** - SQLite compiled to WebAssembly
- **Vapi AI** - Voice AI SDK
- **IndexedDB** - Browser storage API

### Inspiration

- Traditional Linux desktop environments (GNOME, KDE)
- Fantasy RPG user interfaces
- Retro computing aesthetics
- Medieval manuscripts and illuminations

### Assets

- Font families: Cinzel, Crimson Text, MedievalSharp, Uncial Antiqua
- Icon design: Custom fantasy-themed SVG illustrations
- Background art: Original fantasy landscapes

---

## 📞 Support

### Getting Help

- **Documentation**: Check this README and `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/zaikaman/FantasyOS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zaikaman/FantasyOS/discussions)

### Reporting Bugs

When reporting bugs, please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots or video (if applicable)

### Feature Requests

For feature requests, please describe:
- Use case and motivation
- Proposed solution
- Alternative approaches considered
- Willingness to contribute implementation

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] **v0.2.0** - Mobile responsive design
- [ ] **v0.3.0** - Multiplayer features (shared workspaces)
- [ ] **v0.4.0** - Plugin system for third-party apps
- [ ] **v0.5.0** - Cloud sync across devices
- [ ] **v1.0.0** - Stable API and production-ready release

### Long-term Vision

- PWA installability
- Offline-first capabilities
- WebRTC peer-to-peer file sharing
- Collaborative editing
- Theme marketplace
- Developer SDK

---

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **Applications**: 14 built-in apps
- **Games**: 7 classic games
- **Components**: 50+ modular components
- **CSS Custom Properties**: 100+ theming variables
- **Supported Browsers**: Chrome, Firefox, Safari, Edge

---

<div align="center">

### ✨ Made with magic and code ✨

**Star this repository if you find it enchanting!**

[⬆ Back to Top](#-runeshell---enchanted-realm-shell)

</div>
