#!/usr/bin/env npx tsx

// Mock import.meta for Vite compatibility BEFORE any imports
;(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test',
    },
  },
}

// Now import and run the actual simulation
import('./run-simulation.ts')
