// Main entry point for Deadwood Simulator
// Environment is already set up by simulate.cjs

import { GameSimulator } from './core/simulator'
import { BatchRunner } from './core/batch-runner'
import { InMemoryDatabase } from './core/database'
import { StatisticsAnalyzer } from './analysis/statistics'
import { generateHTMLReport } from './reports/html-report'
import * as fs from 'fs/promises'
import * as path from 'path'

async function main() {
  console.log('🎮 Deadwood Game Simulator')
  console.log('========================\n')

  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  // Initialize components
  const simulator = new GameSimulator()
  const database = new InMemoryDatabase()
  const batchRunner = new BatchRunner(simulator, database)
  const analyzer = new StatisticsAnalyzer()

  await database.init()

  switch (command) {
    case 'quick': {
      console.log('Running quick test (100 games)...')
      const result = await batchRunner.runStandardTestSuite(100)
      console.log(`\n✅ Completed ${result.totalGames} games`)

      const simulations = await database.getSimulations()
      const report = await generateQuickReport(analyzer, simulations)
      console.log(report)
      break
    }

    case 'full': {
      console.log('Running full test suite (1000 games per configuration)...')
      const result = await batchRunner.runStandardTestSuite(1000)
      console.log(`\n✅ Completed ${result.totalGames} games`)

      const simulations = await database.getSimulations()
      await generateFullReport(analyzer, simulations)
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

      const simulations = await database.getSimulations()
      const report = await generateQuickReport(analyzer, simulations)
      console.log(report)
      break
    }

    case 'test': {
      console.log('Running comprehensive test suite...\n')
      await runComprehensiveTests(batchRunner, analyzer, database)
      break
    }

    case 'verify': {
      console.log('Verifying simulator functionality...\n')
      await verifySimulator(simulator, analyzer)
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
      console.log('  test               Run comprehensive test scenarios')
      console.log('  verify             Verify simulator is working correctly')
      console.log('  help               Show this help message')
      console.log('\nAI Strategies:')
      console.log('  random, greedy, balanced, aggressive, defensive, mcts')
    }
  }
}

async function generateQuickReport(
  analyzer: StatisticsAnalyzer,
  simulations: any[]
): Promise<string> {
  const winRates = analyzer.calculateWinRates(simulations)
  const actionStats = analyzer.calculateActionStats(simulations)
  const balance = analyzer.calculateBalanceMetrics(simulations)

  let report = '\n📊 SIMULATION REPORT\n'
  report += '===================\n\n'

  report += 'Character Win Rates:\n'
  winRates.forEach((stat) => {
    const bar = '█'.repeat(Math.floor(stat.winRate / 2))
    report += `  ${stat.character.padEnd(12)} ${stat.winRate.toFixed(1).padStart(5)}% ${bar}\n`
  })

  report += '\nAction Usage (per game):\n'
  actionStats.forEach((stat) => {
    report += `  ${stat.actionType.padEnd(12)} ${stat.avgPerGame.toFixed(1)}\n`
  })

  report += '\nGame Balance:\n'
  report += `  Balance Score: ${balance.characterBalance.toFixed(2)} / 1.00\n`
  report += `  Win Rate Std Dev: ${balance.winRateStdDev.toFixed(2)}%\n`
  report += `  Average Game Length: ${balance.avgGameLength.toFixed(1)} rounds\n`

  return report
}

async function generateFullReport(
  analyzer: StatisticsAnalyzer,
  simulations: any[]
) {
  const report = await generateHTMLReport(analyzer, simulations)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `simulation-report-${timestamp}.html`

  await fs.writeFile(filename, report)
  console.log(`\n📁 Full HTML report saved to: ${filename}`)
}

async function runComprehensiveTests(
  batchRunner: BatchRunner,
  analyzer: StatisticsAnalyzer,
  database: any
) {
  const testScenarios = [
    {
      name: 'Baseline Random',
      matchups: [['random', 'random', 'random', 'random']],
      games: 500,
    },
    {
      name: 'Strategy Comparison',
      matchups: [
        ['greedy', 'greedy', 'greedy', 'greedy'],
        ['balanced', 'balanced', 'balanced', 'balanced'],
        ['aggressive', 'aggressive', 'aggressive', 'aggressive'],
        ['defensive', 'defensive', 'defensive', 'defensive'],
      ],
      games: 500,
    },
    {
      name: 'Mixed Strategies',
      matchups: [
        ['random', 'greedy', 'balanced', 'aggressive'],
        ['defensive', 'balanced', 'greedy', 'random'],
        ['aggressive', 'defensive', 'random', 'balanced'],
      ],
      games: 500,
    },
    {
      name: 'Head-to-Head',
      matchups: [
        ['greedy', 'balanced'],
        ['aggressive', 'defensive'],
        ['balanced', 'aggressive'],
      ],
      games: 500,
    },
  ]

  for (const scenario of testScenarios) {
    console.log(`\n📊 ${scenario.name}`)
    console.log('─'.repeat(40))

    await database.clear()

    const result = await batchRunner.runMatchupTests(
      scenario.matchups,
      scenario.games / scenario.matchups.length
    )

    const simulations = await database.getSimulations()
    const report = await generateQuickReport(analyzer, simulations)
    console.log(report)
  }

  console.log('\n✅ All test scenarios complete!')
}

async function verifySimulator(
  simulator: GameSimulator,
  analyzer: StatisticsAnalyzer
) {
  console.log('1. Testing basic game simulation...')
  try {
    const result = await simulator.simulateGame({
      playerCount: 2,
      aiDifficulty: 'medium',
      aiStrategies: ['balanced', 'balanced'],
    })
    console.log('   ✅ Basic simulation works')
    console.log(
      `   - Winner: Player ${result.winner + 1} (${result.winnerCharacter})`
    )
    console.log(`   - Rounds: ${result.rounds}`)
    console.log(`   - Actions: ${result.actions.length}`)
  } catch (error) {
    console.log('   ❌ Basic simulation failed:', error)
    return
  }

  console.log('\n2. Testing all AI strategies...')
  const strategies = ['random', 'greedy', 'balanced', 'aggressive', 'defensive']

  for (const strategy of strategies) {
    try {
      const results = []
      for (let i = 0; i < 10; i++) {
        const result = await simulator.simulateGame({
          playerCount: 4,
          aiDifficulty: 'medium',
          aiStrategies: [strategy, strategy, strategy, strategy],
        })
        results.push(result)
      }

      const actionStats = analyzer.calculateActionStats(results)
      const claimStats = actionStats.find((s) => s.actionType === 'claim')

      console.log(
        `   ${strategy.padEnd(12)} ✅ Claims per game: ${claimStats?.avgPerGame.toFixed(1) || 0}`
      )
    } catch (error) {
      console.log(`   ${strategy.padEnd(12)} ❌ Error:`, error)
    }
  }

  console.log('\n3. Testing performance...')
  const start = Date.now()
  const results = []

  for (let i = 0; i < 100; i++) {
    results.push(
      await simulator.simulateGame({
        playerCount: 4,
        aiDifficulty: 'medium',
        aiStrategies: ['balanced', 'balanced', 'balanced', 'balanced'],
      })
    )
  }

  const duration = (Date.now() - start) / 1000
  console.log(
    `   ✅ 100 games in ${duration.toFixed(1)}s (${(100 / duration).toFixed(0)} games/sec)`
  )

  console.log('\n✅ Simulator verification complete!')
}

// Run the CLI
main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
