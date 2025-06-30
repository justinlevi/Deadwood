import type { SimulationResult } from '../core/simulator'

export interface NashStrategy {
  actionType: string
  probability: number
}

export interface NashEquilibrium {
  player: number
  strategies: NashStrategy[]
  expectedPayoff: number
}

export class NashEquilibriumSolver {
  private epsilon: number = 0.001
  private maxIterations: number = 10000
  
  constructor(epsilon?: number, maxIterations?: number) {
    if (epsilon !== undefined) this.epsilon = epsilon
    if (maxIterations !== undefined) this.maxIterations = maxIterations
  }
  
  // Simplified Nash equilibrium finder for 2-player zero-sum games
  findNashEquilibrium2Player(payoffMatrix: number[][]): {
    player1: number[]
    player2: number[]
    value: number
  } {
    const m = payoffMatrix.length // Player 1 strategies
    const n = payoffMatrix[0].length // Player 2 strategies
    
    // Use linear programming via simplex method
    // Convert to standard form: maximize -v subject to constraints
    
    // For small games, use iterative method
    if (m <= 3 && n <= 3) {
      return this.solveSmallGame(payoffMatrix)
    }
    
    // For larger games, use fictitious play
    return this.fictitiousPlay(payoffMatrix)
  }
  
  private solveSmallGame(payoffMatrix: number[][]): {
    player1: number[]
    player2: number[]
    value: number
  } {
    const m = payoffMatrix.length
    const n = payoffMatrix[0].length
    
    // For 2x2 games, use analytical solution
    if (m === 2 && n === 2) {
      const a = payoffMatrix[0][0]
      const b = payoffMatrix[0][1]
      const c = payoffMatrix[1][0]
      const d = payoffMatrix[1][1]
      
      const det = (a - b - c + d)
      
      if (Math.abs(det) < this.epsilon) {
        // Degenerate case
        return {
          player1: [0.5, 0.5],
          player2: [0.5, 0.5],
          value: (a + b + c + d) / 4
        }
      }
      
      const p = (d - c) / det
      const q = (d - b) / det
      
      const player1 = [Math.max(0, Math.min(1, p)), Math.max(0, Math.min(1, 1 - p))]
      const player2 = [Math.max(0, Math.min(1, q)), Math.max(0, Math.min(1, 1 - q))]
      
      const value = (a * d - b * c) / det
      
      return { player1, player2, value }
    }
    
    // For other small games, use fictitious play
    return this.fictitiousPlay(payoffMatrix)
  }
  
  private fictitiousPlay(payoffMatrix: number[][]): {
    player1: number[]
    player2: number[]
    value: number
  } {
    const m = payoffMatrix.length
    const n = payoffMatrix[0].length
    
    // Initialize strategies
    const player1Strategy = new Array(m).fill(1 / m)
    const player2Strategy = new Array(n).fill(1 / n)
    
    // History of opponent plays
    const player1History = new Array(m).fill(0)
    const player2History = new Array(n).fill(0)
    
    let converged = false
    let iterations = 0
    
    while (!converged && iterations < this.maxIterations) {
      // Player 1 best response
      let bestResponse1 = 0
      let bestValue1 = -Infinity
      
      for (let i = 0; i < m; i++) {
        let value = 0
        for (let j = 0; j < n; j++) {
          value += payoffMatrix[i][j] * player2Strategy[j]
        }
        if (value > bestValue1) {
          bestValue1 = value
          bestResponse1 = i
        }
      }
      
      player1History[bestResponse1]++
      
      // Player 2 best response (minimize)
      let bestResponse2 = 0
      let bestValue2 = Infinity
      
      for (let j = 0; j < n; j++) {
        let value = 0
        for (let i = 0; i < m; i++) {
          value += payoffMatrix[i][j] * player1Strategy[i]
        }
        if (value < bestValue2) {
          bestValue2 = value
          bestResponse2 = j
        }
      }
      
      player2History[bestResponse2]++
      
      // Update strategies
      const oldStrategy1 = [...player1Strategy]
      const oldStrategy2 = [...player2Strategy]
      
      const total1 = player1History.reduce((a, b) => a + b, 0)
      const total2 = player2History.reduce((a, b) => a + b, 0)
      
      for (let i = 0; i < m; i++) {
        player1Strategy[i] = player1History[i] / total1
      }
      
      for (let j = 0; j < n; j++) {
        player2Strategy[j] = player2History[j] / total2
      }
      
      // Check convergence
      const diff1 = Math.max(...player1Strategy.map((v, i) => Math.abs(v - oldStrategy1[i])))
      const diff2 = Math.max(...player2Strategy.map((v, j) => Math.abs(v - oldStrategy2[j])))
      
      converged = diff1 < this.epsilon && diff2 < this.epsilon
      iterations++
    }
    
    // Calculate game value
    let value = 0
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        value += payoffMatrix[i][j] * player1Strategy[i] * player2Strategy[j]
      }
    }
    
    return {
      player1: player1Strategy,
      player2: player2Strategy,
      value
    }
  }
  
  // Analyze action frequencies from simulations to find empirical equilibrium
  analyzeEmpiricalEquilibrium(simulations: SimulationResult[]): Map<string, NashStrategy[]> {
    const characterStrategies = new Map<string, Map<string, number>>()
    const characterCounts = new Map<string, number>()
    
    // Count action usage by character
    simulations.forEach(sim => {
      sim.actions.forEach(action => {
        const character = action.playerCharacter
        
        if (!characterStrategies.has(character)) {
          characterStrategies.set(character, new Map())
          characterCounts.set(character, 0)
        }
        
        const strategies = characterStrategies.get(character)!
        strategies.set(action.actionType, (strategies.get(action.actionType) || 0) + 1)
        characterCounts.set(character, characterCounts.get(character)! + 1)
      })
    })
    
    // Convert to probabilities
    const equilibria = new Map<string, NashStrategy[]>()
    
    characterStrategies.forEach((strategies, character) => {
      const total = characterCounts.get(character)!
      const nashStrategies: NashStrategy[] = []
      
      strategies.forEach((count, actionType) => {
        nashStrategies.push({
          actionType,
          probability: count / total
        })
      })
      
      // Sort by probability
      nashStrategies.sort((a, b) => b.probability - a.probability)
      equilibria.set(character, nashStrategies)
    })
    
    return equilibria
  }
  
  // Build simplified payoff matrix for action choices
  buildActionPayoffMatrix(simulations: SimulationResult[]): {
    actions: string[]
    payoffs: number[][]
  } {
    const actions = ['move', 'claim', 'challenge', 'rest']
    const n = actions.length
    const payoffs: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    const counts: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    
    // Analyze pairwise action outcomes
    simulations.forEach(sim => {
      // Group actions by round
      const roundActions = new Map<number, Array<{
        playerId: string
        actionType: string
        influenceGain: number
      }>>()
      
      sim.actions.forEach(action => {
        if (!roundActions.has(action.round)) {
          roundActions.set(action.round, [])
        }
        
        roundActions.get(action.round)!.push({
          playerId: action.playerId,
          actionType: action.actionType,
          influenceGain: action.influenceAfter - action.influenceBefore
        })
      })
      
      // Compare action outcomes within rounds
      roundActions.forEach(actions => {
        for (let i = 0; i < actions.length; i++) {
          for (let j = i + 1; j < actions.length; j++) {
            const action1 = actions[i]
            const action2 = actions[j]
            
            const idx1 = this.getActionIndex(action1.actionType)
            const idx2 = this.getActionIndex(action2.actionType)
            
            if (idx1 !== -1 && idx2 !== -1) {
              // Payoff based on influence gain difference
              const payoff = action1.influenceGain - action2.influenceGain
              payoffs[idx1][idx2] += payoff
              payoffs[idx2][idx1] -= payoff
              counts[idx1][idx2]++
              counts[idx2][idx1]++
            }
          }
        }
      })
    })
    
    // Normalize payoffs
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (counts[i][j] > 0) {
          payoffs[i][j] /= counts[i][j]
        }
      }
    }
    
    return { actions, payoffs }
  }
  
  private getActionIndex(actionType: string): number {
    const actions = ['move', 'claim', 'challenge', 'rest']
    return actions.indexOf(actionType)
  }
  
  // Find mixed strategy Nash equilibrium for action selection
  findActionEquilibrium(simulations: SimulationResult[]): {
    strategies: NashStrategy[]
    description: string
  } {
    const { actions, payoffs } = this.buildActionPayoffMatrix(simulations)
    const equilibrium = this.findNashEquilibrium2Player(payoffs)
    
    const strategies: NashStrategy[] = actions.map((action, i) => ({
      actionType: action,
      probability: equilibrium.player1[i]
    }))
    
    // Generate description
    const dominantStrategy = strategies.reduce((a, b) => 
      a.probability > b.probability ? a : b
    )
    
    const description = `Nash equilibrium suggests playing ${dominantStrategy.actionType} ` +
      `${(dominantStrategy.probability * 100).toFixed(1)}% of the time. ` +
      `Expected value: ${equilibrium.value.toFixed(2)}`
    
    return { strategies, description }
  }
}