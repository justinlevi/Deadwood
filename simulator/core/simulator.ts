import type { GameState, GameAction, PendingAction } from '../../src/game/types'
import { GamePhase } from '../../src/game/types'
import gameReducer from './game-reducer-wrapper'
import generateAIActions from '../../src/game/ai'

export interface SimulationResult {
  gameId: string
  winner: number
  winnerCharacter: string
  rounds: number
  finalScores: Array<{
    playerId: string
    character: string
    totalInfluence: number
    gold: number
    isAI: boolean
  }>
  actions: SimulationAction[]
  startTime: string
  endTime: string
  aiStrategies: string[]
}

export interface SimulationAction {
  round: number
  playerId: string
  playerCharacter: string
  actionType: string
  target?: number
  amount?: number
  cost: number
  goldBefore: number
  goldAfter: number
  influenceBefore: number
  influenceAfter: number
}

export type AIStrategy = (
  state: GameState,
  playerIndex: number
) => PendingAction[]

export class GameSimulator {
  private aiStrategies: Map<string, AIStrategy>

  constructor() {
    this.aiStrategies = new Map()
  }

  registerAIStrategy(name: string, strategy: AIStrategy) {
    this.aiStrategies.set(name, strategy)
  }

  getAIStrategy(name: string): AIStrategy | undefined {
    return this.aiStrategies.get(name)
  }

  async simulateGame(config: {
    playerCount: number
    aiDifficulty?: 'easy' | 'medium' | 'hard'
    aiStrategies?: string[]
  }): Promise<SimulationResult> {
    const { playerCount, aiDifficulty = 'medium', aiStrategies = [] } = config
    const gameId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date().toISOString()
    const actions: SimulationAction[] = []

    // Initialize game
    let state: GameState = gameReducer(
      {
        phase: GamePhase.SETUP,
        currentPlayer: 0,
        players: [],
        board: [],
        roundCount: 1,
        gameConfig: { playerCount, aiDifficulty },
        actionHistory: [],
        completedActions: [],
        message: '',
      },
      { type: 'START_GAME', payload: { playerCount, aiDifficulty } }
    )

    // Run game until completion
    while (state.phase !== GamePhase.GAME_OVER) {
      const currentPlayer = state.players[state.currentPlayer]

      // All players in simulator are AI-controlled
      // Get AI actions
      const strategyName = aiStrategies[state.currentPlayer] || 'default'
      const strategy = this.aiStrategies.get(strategyName)
      let aiActions: PendingAction[]

      if (strategy) {
        aiActions = strategy(state, state.currentPlayer)
      } else {
        // Fallback to default AI (only takes state parameter)
        aiActions = generateAIActions(state)
      }

      // Execute AI actions
      for (const action of aiActions) {
        const goldBefore = currentPlayer.gold
        const influenceBefore = currentPlayer.totalInfluence

        // Select action
        state = gameReducer(state, {
          type: 'SELECT_ACTION',
          payload: action.type,
        })

        // Set target/amount if needed
        if (action.target !== undefined || action.amount !== undefined) {
          state = gameReducer(state, {
            type: 'SET_ACTION_TARGET',
            payload: { target: action.target, amount: action.amount },
          })
        }

        // Confirm action
        state = gameReducer(state, { type: 'CONFIRM_ACTION' })

        // Record action
        const updatedPlayer = state.players[state.currentPlayer]
        actions.push({
          round: state.roundCount,
          playerId: currentPlayer.id,
          playerCharacter: currentPlayer.character.id,
          actionType: action.type,
          target: action.target,
          amount: action.amount,
          cost: goldBefore - updatedPlayer.gold,
          goldBefore,
          goldAfter: updatedPlayer.gold,
          influenceBefore,
          influenceAfter: updatedPlayer.totalInfluence,
        })
      }

      // Safety check to prevent infinite loops
      if (actions.length > 1000) {
        console.error('Game exceeded maximum actions, terminating')
        break
      }
    }

    const endTime = new Date().toISOString()

    return {
      gameId,
      winner: state.winner || 0,
      winnerCharacter: state.players[state.winner || 0].character.id,
      rounds: state.roundCount,
      finalScores: state.players.map((p) => ({
        playerId: p.id,
        character: p.character.id,
        totalInfluence: p.totalInfluence,
        gold: p.gold,
        isAI: true, // All players are AI in simulation
      })),
      actions,
      startTime,
      endTime,
      aiStrategies: aiStrategies,
    }
  }

  async simulateBatch(
    count: number,
    playerCount: number,
    aiDifficulty: 'easy' | 'medium' | 'hard',
    aiStrategyNames: string[] = [],
    onProgress?: (completed: number, total: number) => void
  ): Promise<SimulationResult[]> {
    const results: SimulationResult[] = []

    for (let i = 0; i < count; i++) {
      const result = await this.simulateGame({
        playerCount,
        aiDifficulty,
        aiStrategies: aiStrategyNames,
      })
      results.push(result)

      if (onProgress) {
        onProgress(i + 1, count)
      }
    }

    return results
  }
}
