// Bulletproof environment setup for Node.js compatibility
// This file MUST be loaded before any other modules

// Mock import.meta for Vite compatibility
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test',
      DEV: false,
      PROD: true,
    },
  },
}

// Mock browser globals that logging.ts expects
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
}

global.window = {
  analytics: null,
  location: { href: 'http://localhost' },
  addEventListener: () => {},
  removeEventListener: () => {},
}

// Navigator is read-only in Node, define it properly
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'Node.js Simulator',
    language: 'en-US',
  },
  writable: true,
  configurable: true,
})

// Mock document for any UI-related code
global.document = {
  getElementById: () => null,
  createElement: () => ({}),
  addEventListener: () => {},
  removeEventListener: () => {},
}

// Export a flag to verify environment is set up
module.exports = { environmentReady: true }
