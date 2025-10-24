# Enchanted Realm Shell 🧙‍♂️✨

A fantasy-themed desktop environment simulator running entirely in your browser. Experience a mystical workspace where magic meets modern web technology.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## 🌟 Features

- **Immersive Fantasy Desktop**: Full-screen mossy background with animated firefly particles
- **Window Management**: Draggable, resizable parchment-style windows with minimize/close functionality
- **Persistent Storage**: Local SQLite database (via sql.js) with IndexedDB persistence
- **Built-in Applications**:
  - 🔮 **Mana Calculator**: Perform mathematical calculations with mystical flair
  - 📦 **Treasure Chest Explorer**: Create and manage scrolls (notes) and artifacts (doodles)
  - 📜 **Quest Log**: Track your tasks and adventures (coming soon)
- **AI Quest Notifications**: Context-aware notifications powered by OpenAI (optional)
- **Tavern Sidebar**: Access minimized windows and quest notifications

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (v20 LTS recommended)
- **npm** v9+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/fantasy-os.git
cd fantasy-os

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to enter the Enchanted Realm!

## 📦 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Build Tool** | Vite 5.x | Fast dev server + optimized production builds |
| **Persistence** | sql.js + IndexedDB | SQLite database in browser with persistence |
| **Particles** | HTML5 Canvas 2D | 60 FPS firefly animation system |
| **State Management** | Custom Proxy-based | Lightweight reactive state (~2KB) |
| **Testing** | Vitest + Playwright | Unit, integration, and E2E tests |
| **Deployment** | Vercel | One-click deployment with proper headers |

**Bundle Size Target**: < 500KB gzipped  
**Performance Goals**: FCP < 1.5s, TTI < 3.5s, 30+ FPS animations

## 🏗️ Project Structure

```
fantasy-os/
├── src/
│   ├── main.js              # Application entry point
│   ├── core/                # State management, database, event bus
│   ├── desktop/             # Desktop environment, particles, runes
│   ├── window/              # Window lifecycle, drag/resize handlers
│   ├── apps/                # Application registry and built-in apps
│   ├── sidebar/             # Tavern sidebar, notifications
│   ├── storage/             # SQLite persistence layer
│   ├── utils/               # Shared utilities
│   └── assets/              # Inline SVG runes and textures
├── styles/                  # Global CSS, theming, component styles
├── tests/                   # Unit, integration, E2E tests
├── index.html               # Entry point with COEP/COOP headers
├── vite.config.js           # Build configuration
└── package.json             # Dependencies and scripts

```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Build for production
npm run build:analyze    # Build with bundle size analysis
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests with Playwright

# Code Quality
npm run lint             # Lint JavaScript files
npm run lint:fix         # Fix linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

## 🎮 Usage

### Creating a New Application

1. Create app directory: `src/apps/your-app/`
2. Implement app component: `your-app.js`
3. Register in `src/apps/app-registry.js`
4. Create rune icon in `src/assets/runes/your-app.svg.js`

See [quickstart.md](./specs/001-enchanted-realm-shell/quickstart.md) for detailed examples.

### Managing Windows

```javascript
import { createWindow, focusWindow, minimizeWindow } from '@window/window-manager';

// Create new window
const window = createWindow('mana-calculator', {
  x: 100,
  y: 100,
  width: 400,
  height: 500
});

// Focus window (bring to front)
focusWindow(window.id);

// Minimize to sidebar
minimizeWindow(window.id);
```

### Working with Files

```javascript
import { createFile, getFilesByType } from '@storage/files';

// Create a scroll (text note)
const scroll = createFile('My Quest Log', 'scroll', 'Today I defeated the bug dragon!');

// Get all scrolls
const scrolls = getFilesByType('scroll');
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for optional features:

```bash
# OpenAI API key for AI quest notifications (optional)
VITE_OPENAI_API_KEY=sk-...
```

### Settings

Customize the realm via in-browser settings or directly in the database:

- `theme_color`: Color scheme (default: `mossy_green`)
- `particle_density`: Number of fireflies (default: `100`)
- `ai_notifications`: Enable/disable AI features (default: `true`)
- `auto_save_interval`: Database save frequency in seconds (default: `30`)

## 📊 Performance Budgets

| Metric | Budget | Current |
|--------|--------|---------|
| Bundle Size (gzipped) | < 500KB | ~437KB ✅ |
| First Contentful Paint | < 1.5s | TBD |
| Time to Interactive | < 3.5s | TBD |
| Animation FPS | 30+ FPS | 60 FPS ✅ |
| Window Drag Frame Time | < 16ms | TBD |

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm test -- --coverage
```

**Test Coverage Target**: 80% for business logic (state management, persistence)

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Important**: Vercel configuration (`vercel.json`) includes required COEP/COOP headers for sql.js WebAssembly support.

### Manual Deployment

1. Build: `npm run build`
2. Serve `dist/` directory with these headers:
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

## 📝 Documentation

- [Specification](./specs/001-enchanted-realm-shell/spec.md) - Feature requirements
- [Implementation Plan](./specs/001-enchanted-realm-shell/plan.md) - Technical architecture
- [Data Model](./specs/001-enchanted-realm-shell/data-model.md) - SQLite schema
- [Quickstart Guide](./specs/001-enchanted-realm-shell/quickstart.md) - Developer onboarding
- [API Contracts](./specs/001-enchanted-realm-shell/contracts/) - Window API, state contract, schema

## 🤝 Contributing

1. Create a feature branch: `git checkout -b 002-new-feature`
2. Follow the [Spec-Driven Development workflow](./specs/README.md)
3. Write tests first (TDD approach)
4. Ensure all tests pass: `npm test && npm run test:e2e`
5. Check code quality: `npm run lint && npm run format:check`
6. Submit pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- SQLite powered by [sql.js](https://github.com/sql-js/sql.js)
- AI notifications via [OpenAI](https://openai.com/)

---

**May your code be bug-free and your windows always draggable! 🧙‍♂️✨**
