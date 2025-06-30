#!/usr/bin/env npx tsx

// Mock import.meta for Vite compatibility
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test'
    }
  }
}

import { GameSimulator } from './core/simulator'
import { randomAI } from './ai/strategies'
import { StatisticsAnalyzer } from './analysis/statistics'

async function runRandomTest() {
  console.log('🎮 Testing with Random AI (500 games)...\n')
  
  const simulator = new GameSimulator()
  simulator.registerAIStrategy('random', randomAI)
  
  const results = []
  
  for (let i = 0; i < 500; i++) {
    if (i % 50 === 0) {
      process.stdout.write(`\rProgress: ${i}/500 games`)
    }
    
    const result = await simulator.simulateGame({
      playerCount: 4,
      aiDifficulty: 'medium',
      aiStrategies: ['random', 'random', 'random', 'random']
    })
    
    results.push(result)
  }
  
  console.log('\n\nResults with Random AI:')
  const analyzer = new StatisticsAnalyzer()
  const winRates = analyzer.calculateWinRates(results)
  
  winRates.forEach(stat => {
    const bar = '█'.repeat(Math.floor(stat.winRate / 2))
    console.log(`  ${stat.character.padEnd(12)} ${stat.winRate.toFixed(1).padStart(5)}% ${bar}`)
  })
}

runRandomTest().catch(console.error)