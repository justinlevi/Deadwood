import type { SimulationResult } from '../core/simulator'

export interface WinRateStats {
  character: string
  games: number
  wins: number
  winRate: number
  avgInfluence: number
  avgGold: number
  avgRounds: number
}

export interface ActionStats {
  actionType: string
  totalUsage: number
  avgPerGame: number
  avgPerRound: number
  successRate: number // For claims/challenges
}

export interface LocationStats {
  locationId: number
  totalClaims: number
  avgInfluencePerGame: number
  contestedness: number // How often multiple players have influence
}

export interface FirstPlayerAdvantage {
  position: number
  games: number
  wins: number
  winRate: number
}

export interface StrategyPerformance {
  strategy: string
  games: number
  wins: number
  winRate: number
  avgInfluence: number
  avgGameLength: number
}

export class StatisticsAnalyzer {
  calculateWinRates(simulations: SimulationResult[]): WinRateStats[] {
    const stats = new Map<string, WinRateStats>()

    // Initialize stats for all characters
    const characters = ['al', 'seth', 'cy', 'jane']
    characters.forEach((char) => {
      stats.set(char, {
        character: char,
        games: 0,
        wins: 0,
        winRate: 0,
        avgInfluence: 0,
        avgGold: 0,
        avgRounds: 0,
      })
    })

    // Process simulations
    simulations.forEach((sim) => {
      sim.finalScores.forEach((score, index) => {
        const stat = stats.get(score.character)!
        stat.games++

        if (index === sim.winner) {
          stat.wins++
        }

        stat.avgInfluence += score.totalInfluence
        stat.avgGold += score.gold
        stat.avgRounds += sim.rounds
      })
    })

    // Calculate averages
    stats.forEach((stat) => {
      if (stat.games > 0) {
        stat.winRate = (stat.wins / stat.games) * 100
        stat.avgInfluence /= stat.games
        stat.avgGold /= stat.games
        stat.avgRounds /= stat.games
      }
    })

    return Array.from(stats.values()).sort((a, b) => b.winRate - a.winRate)
  }

  calculateActionStats(simulations: SimulationResult[]): ActionStats[] {
    const stats = new Map<string, ActionStats>()
    const actionTypes = ['move', 'claim', 'challenge', 'rest']

    // Initialize
    actionTypes.forEach((type) => {
      stats.set(type, {
        actionType: type,
        totalUsage: 0,
        avgPerGame: 0,
        avgPerRound: 0,
        successRate: 100, // Rest and move always succeed
      })
    })

    let totalGames = simulations.length
    let totalRounds = 0
    let claimAttempts = 0
    let claimSuccesses = 0
    let challengeAttempts = 0
    let challengeSuccesses = 0

    simulations.forEach((sim) => {
      totalRounds += sim.rounds

      sim.actions.forEach((action) => {
        const stat = stats.get(action.actionType)!
        stat.totalUsage++

        // Track success rates
        if (action.actionType === 'claim') {
          claimAttempts++
          if (action.influenceAfter > action.influenceBefore) {
            claimSuccesses++
          }
        } else if (action.actionType === 'challenge') {
          challengeAttempts++
          // Challenge is successful if it costs gold (meaning it executed)
          if (action.cost > 0) {
            challengeSuccesses++
          }
        }
      })
    })

    // Calculate averages and success rates
    stats.forEach((stat, type) => {
      stat.avgPerGame = totalGames > 0 ? stat.totalUsage / totalGames : 0
      stat.avgPerRound = totalRounds > 0 ? stat.totalUsage / totalRounds : 0

      if (type === 'claim' && claimAttempts > 0) {
        stat.successRate = (claimSuccesses / claimAttempts) * 100
      } else if (type === 'challenge' && challengeAttempts > 0) {
        stat.successRate = (challengeSuccesses / challengeAttempts) * 100
      }
    })

    return Array.from(stats.values())
  }

  calculateLocationHeatmap(simulations: SimulationResult[]): LocationStats[] {
    const locationCount = 6 // Hardcoded for Deadwood
    const stats: LocationStats[] = []

    for (let i = 0; i < locationCount; i++) {
      stats.push({
        locationId: i,
        totalClaims: 0,
        avgInfluencePerGame: 0,
        contestedness: 0,
      })
    }

    // Process all claim actions
    simulations.forEach((sim) => {
      const locationInfluences = new Map<number, Set<string>>()

      sim.actions.forEach((action) => {
        if (action.actionType === 'claim' && action.target !== undefined) {
          stats[action.target].totalClaims += action.amount || 1

          if (!locationInfluences.has(action.target)) {
            locationInfluences.set(action.target, new Set())
          }
          locationInfluences.get(action.target)!.add(action.playerId)
        }
      })

      // Calculate contestedness
      locationInfluences.forEach((players, location) => {
        if (players.size > 1) {
          stats[location].contestedness++
        }
      })
    })

    // Calculate averages
    const totalGames = simulations.length
    if (totalGames > 0) {
      stats.forEach((stat) => {
        stat.avgInfluencePerGame = stat.totalClaims / totalGames
        stat.contestedness = (stat.contestedness / totalGames) * 100
      })
    }

    return stats
  }

  calculateFirstPlayerAdvantage(
    simulations: SimulationResult[]
  ): FirstPlayerAdvantage[] {
    const stats = new Map<number, FirstPlayerAdvantage>()

    simulations.forEach((sim) => {
      sim.finalScores.forEach((score, position) => {
        if (!stats.has(position)) {
          stats.set(position, {
            position,
            games: 0,
            wins: 0,
            winRate: 0,
          })
        }

        const stat = stats.get(position)!
        stat.games++

        if (position === sim.winner) {
          stat.wins++
        }
      })
    })

    // Calculate win rates
    stats.forEach((stat) => {
      stat.winRate = stat.games > 0 ? (stat.wins / stat.games) * 100 : 0
    })

    return Array.from(stats.values()).sort((a, b) => a.position - b.position)
  }

  calculateGameLengthDistribution(
    simulations: SimulationResult[]
  ): Map<number, number> {
    const distribution = new Map<number, number>()

    simulations.forEach((sim) => {
      const rounds = sim.rounds
      distribution.set(rounds, (distribution.get(rounds) || 0) + 1)
    })

    return distribution
  }

  calculateStrategyPerformance(
    simulations: SimulationResult[]
  ): StrategyPerformance[] {
    const stats = new Map<string, StrategyPerformance>()

    simulations.forEach((sim) => {
      sim.aiStrategies.forEach((strategy, playerIndex) => {
        if (!strategy) return // Skip empty strategies

        if (!stats.has(strategy)) {
          stats.set(strategy, {
            strategy,
            games: 0,
            wins: 0,
            winRate: 0,
            avgInfluence: 0,
            avgGameLength: 0,
          })
        }

        const stat = stats.get(strategy)!
        stat.games++

        if (playerIndex === sim.winner) {
          stat.wins++
        }

        stat.avgInfluence += sim.finalScores[playerIndex].totalInfluence
        stat.avgGameLength += sim.rounds
      })
    })

    // Calculate averages
    stats.forEach((stat) => {
      if (stat.games > 0) {
        stat.winRate = (stat.wins / stat.games) * 100
        stat.avgInfluence /= stat.games
        stat.avgGameLength /= stat.games
      }
    })

    return Array.from(stats.values()).sort((a, b) => b.winRate - a.winRate)
  }

  // Helper method to calculate standard deviation
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    return Math.sqrt(variance)
  }

  // Calculate balance metrics
  calculateBalanceMetrics(simulations: SimulationResult[]): {
    characterBalance: number // 0-1, higher is more balanced
    winRateStdDev: number
    influenceStdDev: number
  } {
    const winRates = this.calculateWinRates(simulations)
    const winRateValues = winRates.map((w) => w.winRate)
    const influenceValues = winRates.map((w) => w.avgInfluence)

    const winRateStdDev = this.calculateStandardDeviation(winRateValues)
    const influenceStdDev = this.calculateStandardDeviation(influenceValues)

    // Character balance: inverse of standard deviation normalized to 0-1
    // Perfect balance = 1, worst balance = 0
    const maxPossibleStdDev = 50 // Theoretical max if one character wins 100% and others 0%
    const characterBalance = 1 - winRateStdDev / maxPossibleStdDev

    return {
      characterBalance,
      winRateStdDev,
      influenceStdDev,
    }
  }
}
