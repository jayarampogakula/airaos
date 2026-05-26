import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let targetInput = input;
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const loc = window.location;
      if ((loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') && loc.port !== '3001' && loc.port !== '5173') {
        targetInput = `http://localhost:3001${input}`;
      }
    }
    return originalFetch(targetInput, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
