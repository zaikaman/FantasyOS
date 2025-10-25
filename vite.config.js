import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { tavilyProxyPlugin } from './vite-plugins/tavily-proxy.js';

export default defineConfig(({ mode }) => ({
  // Base URL for deployment
  base: './',

  // Build configuration
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-js': ['sql.js']
        }
      }
    },
    chunkSizeWarningLimit: 500,
    sourcemap: mode === 'development'
  },

  // Server configuration
  server: {
    port: 5173,
    open: true,
    headers: {
      // Removed COEP/COOP headers to allow YouTube embeds
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
      // 'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },

  // Preview server (after build)
  preview: {
    port: 5173,
    headers: {
      // Removed COEP/COOP headers to allow YouTube embeds
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
      // 'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },

  // Plugins
  plugins: [
    tavilyProxyPlugin(),
    mode === 'analyze' &&
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
  ].filter(Boolean),

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@desktop': '/src/desktop',
      '@window': '/src/window',
      '@apps': '/src/apps',
      '@sidebar': '/src/sidebar',
      '@storage': '/src/storage',
      '@utils': '/src/utils',
      '@assets': '/src/assets',
      '@styles': '/styles'
    }
  },

  // Optimizations
  optimizeDeps: {
    include: ['sql.js']
  }
}));
