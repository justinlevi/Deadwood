#!/usr/bin/env node

// Mock import.meta for Vite compatibility
;(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test',
    },
  },
}

import { GameSimulator } from './core/simulator'
import { BatchRunner } from './core/batch-runner'
import { InMemoryDatabase } from './core/database'
import { StatisticsAnalyzer } from './analysis/statistics'

async function main() {
  console.log('🎮 Deadwood Game Simulator')
  console.log('========================\n')

  // Initialize components
  const simulator = new GameSimulator()
  const database = new InMemoryDatabase()
  const batchRunner = new BatchRunner(simulator, database)
  const analyzer = new StatisticsAnalyzer()

  await database.init()

  // Parse command line arguments
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  switch (command) {
    case 'quick': {
      console.log('Running quick test (100 games)...')
      const result = await batchRunner.runStandardTestSuite(100)
      console.log(`\n✅ Completed ${result.totalGames} games`)

      // Show basic stats
      const simulations = await database.getSimulations()
      const winRates = analyzer.calculateWinRates(simulations)

      console.log('\nCharacter Win Rates:')
      winRates.forEach((stat) => {
        console.log(
          `  ${stat.character}: ${stat.winRate.toFixed(1)}% (${stat.wins}/${stat.games})`
        )
      })
      break
    }

    case 'full': {
      console.log('Running full test suite (1000 games per configuration)...')
      const result = await batchRunner.runStandardTestSuite(1000)
      console.log(`\n✅ Completed ${result.totalGames} games`)

      // Generate detailed report
      const simulations = await database.getSimulations()
      generateReport(analyzer, simulations)
      break
    }

    case 'custom': {
      const games = parseInt(args[1]) || 100
      const players = parseInt(args[2]) || 4
      const strategy = args[3] || 'balanced'

      console.log(
        `Running custom simulation: ${games} games, ${players} players, ${strategy} AI`
      )

      const result = await batchRunner.runBatch({
        totalGames: games,
        playerCounts: [players],
        aiDifficulties: ['medium'],
        strategies: [strategy],
        saveToDatabase: true,
        onProgress: (completed, total) => {
          process.stdout.write(
            `\rProgress: ${completed}/${total} (${((completed / total) * 100).toFixed(0)}%)`
          )
        },
      })

      console.log(`\n\n✅ Completed ${result.totalGames} games`)
      break
    }

    case 'export': {
      const simulations = await database.getSimulations()
      const filename = args[1] || `deadwood-sims-${Date.now()}.json`

      const fs = await import('fs').then((m) => m.promises)
      await fs.writeFile(filename, database.exportToJSON())

      console.log(
        `✅ Exported ${simulations.length} simulations to ${filename}`
      )
      break
    }

    case 'help':
    default: {
      console.log('Usage: npm run simulate [command] [options]')
      console.log('\nCommands:')
      console.log('  quick              Run quick test (100 games)')
      console.log(
        '  full               Run full test suite (1000 games per config)'
      )
      console.log('  custom [n] [p] [s] Run custom simulation')
      console.log('                     n: number of games (default: 100)')
      console.log('                     p: player count (default: 4)')
      console.log('                     s: AI strategy (default: balanced)')
      console.log('  export [filename]  Export results to JSON file')
      console.log('  help               Show this help message')
      console.log('\nAI Strategies:')
      console.log('  random, greedy, balanced, aggressive, defensive, mcts')
    }
  }
}

function generateReport(analyzer: StatisticsAnalyzer, simulations: any[]) {
  console.log('\n📊 SIMULATION REPORT')
  console.log('===================\n')

  // Character balance
  const winRates = analyzer.calculateWinRates(simulations)
  console.log('Character Win Rates:')
  winRates.forEach((stat) => {
    const bar = '█'.repeat(Math.floor(stat.winRate / 2))
    console.log(
      `  ${stat.character.padEnd(12)} ${stat.winRate.toFixed(1).padStart(5)}% ${bar}`
    )
  })

  // Action usage
  const actionStats = analyzer.calculateActionStats(simulations)
  console.log('\nAction Usage:')
  actionStats.forEach((stat) => {
    console.log(
      `  ${stat.actionType.padEnd(12)} ${stat.avgPerGame.toFixed(1)} per game`
    )
  })

  // First player advantage
  const fpAdvantage = analyzer.calculateFirstPlayerAdvantage(simulations)
  console.log('\nTurn Order Advantage:')
  fpAdvantage.forEach((stat) => {
    console.log(`  Player ${stat.position + 1}: ${stat.winRate.toFixed(1)}%`)
  })

  // Balance metrics
  const balance = analyzer.calculateBalanceMetrics(simulations)
  console.log('\nGame Balance:')
  console.log(`  Balance Score: ${balance.characterBalance.toFixed(2)} / 1.00`)
  console.log(`  Win Rate Std Dev: ${balance.winRateStdDev.toFixed(2)}%`)

  // Strategy performance
  const strategies = analyzer.calculateStrategyPerformance(simulations)
  if (strategies.length > 0) {
    console.log('\nAI Strategy Performance:')
    strategies.forEach((stat) => {
      console.log(
        `  ${stat.strategy.padEnd(12)} ${stat.winRate.toFixed(1)}% win rate`
      )
    })
  }
}

// Run the CLI
main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
