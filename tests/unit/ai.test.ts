import { describe, it, expect } from 'vitest'
import generateAIActions from '../../src/game/ai'
import { createInitialBoard } from '../../src/game'
import { createPlayers } from '../../src/game/players'
import { GamePhase } from '../../src/game/types'
import type { GameState } from '../../src/game'

const setupState = (): GameState => ({
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 1,
  players: createPlayers(2),
  board: createInitialBoard(),
  roundCount: 1,
  gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
})

describe('generateAIActions', () => {
  it('returns two actions', () => {
    const state = setupState()
    const actions = generateAIActions(state)
    expect(actions.length).toBe(2)
  })
})
