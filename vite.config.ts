import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Calculate version based on git commit count
let commitCount = 42; // Default fallback
const versionFilePath = path.resolve(__dirname, 'src/version.json');

try {
  const countStr = execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  const parsed = parseInt(countStr, 10);
  if (!isNaN(parsed) && parsed > 0) {
    commitCount = parsed;
    try {
      fs.writeFileSync(versionFilePath, JSON.stringify({ commitCount }, null, 2));
    } catch (writeErr) {
      // Ignore write errors
    }
  }
} catch (e) {
  try {
    if (fs.existsSync(versionFilePath)) {
      const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
      if (data && typeof data.commitCount === 'number') {
        commitCount = data.commitCount;
      }
    }
  } catch (readErr) {
    // Ignore read errors
  }
}

const major = Math.floor(commitCount / 100);
const minor = Math.floor((commitCount % 100) / 10);
const patch = commitCount % 10;
const appVersion = `v${major}.${minor}.${patch}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
