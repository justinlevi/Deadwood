import { describe, it, expect } from 'vitest'
import { gameReducer } from '../../src/game'
import type { GameState } from '../../src/game'
import { GamePhase, ActionType } from '../../src/game'
import { createInitialBoard } from '../../src/game'
import { createPlayers } from '../../src/game/players'

const initialState: GameState = {
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 0,
  players: createPlayers(2),
  board: createInitialBoard(),
  turnCount: 1,
  gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
}

describe('gameReducer', () => {
  it('handles rest action', () => {
    const state = gameReducer(initialState, { type: 'SELECT_ACTION', payload: ActionType.REST })
    expect(state.completedActions).toHaveLength(1)
    expect(state.players[0].gold).toBe(5)
  })
})
