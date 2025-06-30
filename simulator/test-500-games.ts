#!/usr/bin/env npx tsx

// Mock import.meta for Vite compatibility FIRST
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test'
    }
  }
}

// Now we can import
import { GameSimulator } from './core/simulator'
import { randomAI, greedyAI, balancedAI, aggressiveAI } from './ai/strategies'
import { StatisticsAnalyzer } from './analysis/statistics'

async function run500Games() {
  console.log('🎮 Deadwood Game Simulator - 500 Game Test')
  console.log('==========================================\n')
  
  const simulator = new GameSimulator()
  
  // Register strategies
  simulator.registerAIStrategy('random', randomAI)
  simulator.registerAIStrategy('greedy', greedyAI)
  simulator.registerAIStrategy('balanced', balancedAI)
  simulator.registerAIStrategy('aggressive', aggressiveAI)
  
  console.log('Running 500 games with balanced AI...\n')
  
  const results = []
  const startTime = Date.now()
  
  for (let i = 0; i < 500; i++) {
    if (i % 50 === 0) {
      process.stdout.write(`\rProgress: ${i}/500 games (${Math.round(i/500*100)}%)`)
    }
    
    const result = await simulator.simulateGame({
      playerCount: 4,
      aiDifficulty: 'medium',
      aiStrategies: ['balanced', 'balanced', 'balanced', 'balanced']
    })
    
    results.push(result)
  }
  
  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000
  
  console.log(`\n\n✅ Completed 500 games in ${duration.toFixed(1)} seconds`)
  console.log(`Average time per game: ${(duration / 500 * 1000).toFixed(0)}ms\n`)
  
  // Analyze results
  const analyzer = new StatisticsAnalyzer()
  const winRates = analyzer.calculateWinRates(results)
  const actionStats = analyzer.calculateActionStats(results)
  const balance = analyzer.calculateBalanceMetrics(results)
  
  console.log('📊 RESULTS')
  console.log('==========\n')
  
  console.log('Character Win Rates:')
  winRates.forEach(stat => {
    const bar = '█'.repeat(Math.floor(stat.winRate / 2))
    console.log(`  ${stat.character.padEnd(12)} ${stat.winRate.toFixed(1).padStart(5)}% ${bar}`)
  })
  
  console.log('\nAction Usage:')
  actionStats.forEach(stat => {
    console.log(`  ${stat.actionType.padEnd(12)} ${stat.avgPerGame.toFixed(1)} per game`)
  })
  
  console.log('\nGame Balance:')
  console.log(`  Balance Score: ${balance.characterBalance.toFixed(2)} / 1.00`)
  console.log(`  Win Rate Std Dev: ${balance.winRateStdDev.toFixed(2)}%`)
  console.log(`  Average Game Length: ${results.reduce((sum, r) => sum + r.rounds, 0) / results.length} rounds`)
  
  // Save results
  const fs = await import('fs').then(m => m.promises)
  const reportData = {
    summary: {
      totalGames: 500,
      duration: duration,
      avgGameTime: duration / 500,
      timestamp: new Date().toISOString()
    },
    winRates,
    actionStats,
    balance,
    games: results
  }
  
  await fs.writeFile('simulation-500-games.json', JSON.stringify(reportData, null, 2))
  console.log('\n📁 Full results saved to simulation-500-games.json')
}

run500Games().catch(console.error)