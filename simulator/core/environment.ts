/**
 * Unified environment setup for the Deadwood simulator
 * This module ensures all necessary globals and mocks are properly configured
 * before any game code is loaded.
 */

export function setupEnvironment() {
  // Mock import.meta.env for Vite compatibility
  if (!(global as any).import) {
    (global as any).import = {
      meta: {
        env: {
          VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'placeholder-key',
          MODE: 'test'
        }
      }
    }
  }

  // Mock browser APIs
  if (typeof global.sessionStorage === 'undefined') {
    (global as any).sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    }
  }

  if (typeof global.window === 'undefined') {
    (global as any).window = {
      analytics: null,
      location: { href: 'http://localhost' },
      document: { title: 'Deadwood Simulator' }
    }
  }

  if (typeof global.navigator === 'undefined') {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true
    })
  }

  // Mock crypto for session IDs
  if (typeof global.crypto === 'undefined') {
    (global as any).crypto = {
      randomUUID: () => 'test-' + Math.random().toString(36).substr(2, 9)
    }
  }

  // Suppress console.warn for supabase in test environment
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    if (args[0]?.includes?.('Supabase')) return
    originalWarn(...args)
  }
}

// Auto-setup when module is imported
setupEnvironment()