#!/usr/bin/env npx tsx

// Mock environment BEFORE any imports
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test'
    }
  }
};

(global as any).sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(global as any).window = { analytics: null };
Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true, configurable: true });

// Suppress console warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes('Cannot')) return;
  originalWarn(...args);
};

import { GameSimulator } from './core/simulator'
import { BatchRunner } from './core/batch-runner'
import { InMemoryDatabase } from './core/database'
import { StatisticsAnalyzer } from './analysis/statistics'
import { generateHTMLReport } from './reports/html-report'
import * as fs from 'fs/promises'

async function run500Games() {
  console.log('🎮 Running 500 Game Simulation')
  console.log('==============================\n')
  
  const simulator = new GameSimulator()
  const database = new InMemoryDatabase()
  const batchRunner = new BatchRunner(simulator, database)
  const analyzer = new StatisticsAnalyzer()
  
  await database.init()
  
  // Run 500 games with balanced AI
  const result = await batchRunner.runBatch({
    totalGames: 500,
    playerCounts: [4],
    aiDifficulties: ['medium'],
    strategies: ['balanced'],
    saveToDatabase: true,
    onProgress: (completed, total) => {
      if (completed % 25 === 0 || completed === total) {
        console.log(`Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`)
      }
    }
  })
  
  console.log(`\n✅ Completed ${result.totalGames} games\n`)
  
  // Get results
  const simulations = await database.getSimulations()
  
  // Generate console report
  const winRates = analyzer.calculateWinRates(simulations)
  const actionStats = analyzer.calculateActionStats(simulations)
  const balance = analyzer.calculateBalanceMetrics(simulations)
  
  console.log('📊 SIMULATION RESULTS')
  console.log('====================\n')
  
  console.log('Character Win Rates:')
  winRates.forEach(stat => {
    const bar = '█'.repeat(Math.floor(stat.winRate / 2))
    console.log(`  ${stat.character.padEnd(12)} ${stat.winRate.toFixed(1).padStart(5)}% ${bar}`)
  })
  
  console.log('\nAction Usage (per game):')
  actionStats.forEach(stat => {
    console.log(`  ${stat.actionType.padEnd(12)} ${stat.avgPerGame.toFixed(1)}`)
  })
  
  console.log('\nGame Balance:')
  console.log(`  Balance Score: ${balance.characterBalance.toFixed(2)} / 1.00`)
  console.log(`  Win Rate Std Dev: ${balance.winRateStdDev.toFixed(2)}%`)
  console.log(`  Average Game Length: ${balance.avgGameLength.toFixed(1)} rounds`)
  
  // Generate HTML report
  const htmlReport = await generateHTMLReport(analyzer, simulations)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `deadwood-report-${timestamp}.html`
  
  await fs.writeFile(filename, htmlReport)
  console.log(`\n📁 Visual report saved to: ${filename}`)
  console.log('   Open this file in your browser to see charts and detailed analysis.')
}

run500Games().catch(console.error)