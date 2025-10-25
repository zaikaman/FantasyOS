import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy games folder to dist
const projectRoot = join(__dirname, '..');
const gamesSource = join(projectRoot, 'games');
const gamesDest = join(projectRoot, 'dist', 'games');

console.log('📦 Copying games folder to dist...');
copyDir(gamesSource, gamesDest);
console.log('✅ Games folder copied successfully!');
