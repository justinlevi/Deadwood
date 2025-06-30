#!/usr/bin/env node

// CRITICAL: Set up environment BEFORE any requires
const { environmentReady } = require('./core/environment.cjs')

if (!environmentReady) {
  console.error('Environment setup failed!')
  process.exit(1)
}

// Now we can safely load tsx and TypeScript files
const { register } = require('tsx/cjs/api')
register()

// Load and run the main simulation script
require('./index.ts')
