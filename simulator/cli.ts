#!/usr/bin/env npx tsx

// Mock environment BEFORE any imports
;(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test',
    },
  },
}

// Mock browser globals
;(global as any).sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}
;(global as any).window = { analytics: null }
// Navigator is read-only in Node, so we need to define it differently
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true,
  configurable: true,
})

// Now import and run the CLI
import('./run-simulation.ts')
