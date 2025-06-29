import { describe, it, expect } from 'vitest'
import gameReducer from '../../src/game/reducer'
import { createInitialBoard } from '../../src/game/board'
import { createPlayers } from '../../src/game/players'
import { GamePhase, ActionType, type GameState } from '../../src/game/types'

const initialState: GameState = {
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 0,
  players: createPlayers(2),
  board: createInitialBoard(),
  roundCount: 1,
  gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
}

describe('rest action turn flow', () => {
  it('double rest ends the turn and passes control', () => {
    let state = gameReducer(initialState, { type: 'SELECT_ACTION', payload: ActionType.REST })
    state = gameReducer(state, { type: 'SELECT_ACTION', payload: ActionType.REST })
    expect(state.completedActions).toHaveLength(0)
    expect(state.currentPlayer).toBe(1)
  })
})
