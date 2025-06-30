import { GameSimulator } from './simulator'
import { Database } from './database'
import { 
  randomAI, 
  greedyAI, 
  balancedAI, 
  aggressiveAI, 
  defensiveAI 
} from '../ai/strategies-fixed'
import { mctsAI } from '../analysis/mcts'

export interface BatchConfiguration {
  totalGames: number
  playerCounts: number[]
  aiDifficulties: Array<'easy' | 'medium' | 'hard'>
  strategies: string[]
  strategyMatchups?: Array<string[]> // Specific strategy combinations to test
  saveToDatabase: boolean
  onProgress?: (completed: number, total: number, currentConfig: string) => void
}

export interface BatchResult {
  totalGames: number
  configurations: Array<{
    playerCount: number
    aiDifficulty: 'easy' | 'medium' | 'hard'
    strategies: string[]
    gamesRun: number
  }>
  startTime: string
  endTime: string
  errors: string[]
}

export class BatchRunner {
  private simulator: GameSimulator
  private database: Database | null
  
  constructor(simulator: GameSimulator, database?: Database) {
    this.simulator = simulator
    this.database = database || null
    
    // Register all AI strategies
    this.registerStrategies()
  }
  
  private registerStrategies() {
    this.simulator.registerAIStrategy('random', randomAI)
    this.simulator.registerAIStrategy('greedy', greedyAI)
    this.simulator.registerAIStrategy('balanced', balancedAI)
    this.simulator.registerAIStrategy('aggressive', aggressiveAI)
    this.simulator.registerAIStrategy('defensive', defensiveAI)
    this.simulator.registerAIStrategy('mcts', mctsAI)
    this.simulator.registerAIStrategy('default', (state, playerIndex) => {
      // Use balanced AI as default
      return balancedAI(state, playerIndex)
    })
  }
  
  async runBatch(config: BatchConfiguration): Promise<BatchResult> {
    const startTime = new Date().toISOString()
    const errors: string[] = []
    const configurations: BatchResult['configurations'] = []
    
    let totalCompleted = 0
    const totalToRun = this.calculateTotalGames(config)
    
    try {
      // Initialize database if needed
      if (config.saveToDatabase && this.database) {
        await this.database.init()
      }
      
      // Run games for each configuration
      for (const playerCount of config.playerCounts) {
        for (const difficulty of config.aiDifficulties) {
          // If specific matchups are provided, use those
          if (config.strategyMatchups && config.strategyMatchups.length > 0) {
            for (const matchup of config.strategyMatchups) {
              if (matchup.length !== playerCount) {
                errors.push(`Matchup ${matchup.join(',')} doesn't match player count ${playerCount}`)
                continue
              }
              
              const gamesPerMatchup = Math.floor(config.totalGames / config.strategyMatchups.length)
              const configName = `${playerCount}P-${difficulty}-${matchup.join('vs')}`
              
              try {
                const results = await this.simulator.simulateBatch(
                  gamesPerMatchup,
                  playerCount,
                  difficulty,
                  matchup,
                  (completed, total) => {
                    if (config.onProgress) {
                      config.onProgress(totalCompleted + completed, totalToRun, configName)
                    }
                  }
                )
                
                if (config.saveToDatabase && this.database) {
                  await this.database.saveSimulations(results)
                }
                
                totalCompleted += results.length
                configurations.push({
                  playerCount,
                  aiDifficulty: difficulty,
                  strategies: matchup,
                  gamesRun: results.length
                })
              } catch (error) {
                errors.push(`Error in ${configName}: ${error}`)
              }
            }
          } else {
            // Generate all possible strategy combinations
            const strategyCombinations = this.generateStrategyCombinations(
              config.strategies,
              playerCount
            )
            
            const gamesPerCombination = Math.floor(
              config.totalGames / (config.playerCounts.length * config.aiDifficulties.length * strategyCombinations.length)
            )
            
            for (const strategies of strategyCombinations) {
              const configName = `${playerCount}P-${difficulty}-${strategies.join('vs')}`
              
              try {
                const results = await this.simulator.simulateBatch(
                  gamesPerCombination,
                  playerCount,
                  difficulty,
                  strategies,
                  (completed, total) => {
                    if (config.onProgress) {
                      config.onProgress(totalCompleted + completed, totalToRun, configName)
                    }
                  }
                )
                
                if (config.saveToDatabase && this.database) {
                  await this.database.saveSimulations(results)
                }
                
                totalCompleted += results.length
                configurations.push({
                  playerCount,
                  aiDifficulty: difficulty,
                  strategies,
                  gamesRun: results.length
                })
              } catch (error) {
                errors.push(`Error in ${configName}: ${error}`)
              }
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Batch runner error: ${error}`)
    }
    
    const endTime = new Date().toISOString()
    
    return {
      totalGames: totalCompleted,
      configurations,
      startTime,
      endTime,
      errors
    }
  }
  
  private calculateTotalGames(config: BatchConfiguration): number {
    if (config.strategyMatchups && config.strategyMatchups.length > 0) {
      return config.totalGames
    }
    
    let total = 0
    for (const playerCount of config.playerCounts) {
      const combinations = this.generateStrategyCombinations(config.strategies, playerCount)
      total += combinations.length * config.aiDifficulties.length
    }
    
    const gamesPerConfig = Math.floor(config.totalGames / total)
    return total * gamesPerConfig
  }
  
  private generateStrategyCombinations(strategies: string[], playerCount: number): string[][] {
    // For simplicity, we'll test each strategy against itself and one mixed game
    const combinations: string[][] = []
    
    // Each strategy vs itself
    for (const strategy of strategies) {
      combinations.push(Array(playerCount).fill(strategy))
    }
    
    // Mixed strategies (round-robin style)
    if (strategies.length >= playerCount) {
      for (let i = 0; i < strategies.length; i++) {
        const combination: string[] = []
        for (let j = 0; j < playerCount; j++) {
          combination.push(strategies[(i + j) % strategies.length])
        }
        combinations.push(combination)
      }
    }
    
    return combinations
  }
  
  // Utility method to run standard test suite
  async runStandardTestSuite(gamesPerTest: number = 100): Promise<BatchResult> {
    return this.runBatch({
      totalGames: gamesPerTest * 36, // 6 strategies * 3 player counts * 2 (pure + mixed)
      playerCounts: [2, 3, 4],
      aiDifficulties: ['medium'],
      strategies: ['random', 'greedy', 'balanced', 'aggressive', 'defensive', 'mcts'],
      saveToDatabase: true
    })
  }
  
  // Run specific matchup tests
  async runMatchupTests(matchups: string[][], gamesPerMatchup: number = 100): Promise<BatchResult> {
    const playerCount = matchups[0].length
    
    return this.runBatch({
      totalGames: matchups.length * gamesPerMatchup,
      playerCounts: [playerCount],
      aiDifficulties: ['medium'],
      strategies: [],
      strategyMatchups: matchups,
      saveToDatabase: true
    })
  }
  
  // Run character balance test (each character plays with each strategy)
  async runCharacterBalanceTest(gamesPerConfig: number = 100): Promise<BatchResult> {
    // This requires modifying the simulator to control character selection
    // For now, we'll run many games and rely on random character distribution
    return this.runBatch({
      totalGames: gamesPerConfig * 24, // 6 strategies * 4 characters
      playerCounts: [4], // All characters in play
      aiDifficulties: ['medium'],
      strategies: ['balanced'], // Use balanced AI for fair comparison
      saveToDatabase: true
    })
  }
}