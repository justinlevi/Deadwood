#!/bin/bash

# Create a build directory
mkdir -p build

# Create environment setup
cat > build/setup-env.js << 'EOF'
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test'
    }
  }
}

// Mock browser globals
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
}
global.window = { analytics: null }
global.navigator = { onLine: true }
EOF

# Create a wrapper for the test
cat > build/run-500-test.js << 'EOF'
require('./setup-env.js')
require('../test-500-games.ts')
EOF

echo "Running 500 game simulation..."
cd build && npx tsx run-500-test.js