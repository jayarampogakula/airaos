import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Calculate version based on git commit count
let commitCount = 40; // Default fallback
try {
  commitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10) || 40;
} catch (e) {
  // Graceful fallback
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
