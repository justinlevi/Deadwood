import { describe, it, expect } from 'vitest'
import gameReducer from '../../src/game/reducer'
import { ActionType, GamePhase, type GameState } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'
import { createPlayers } from '../../src/game/players'

const createState = (count: number): GameState => ({
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 0,
  players: createPlayers(count),
  board: createInitialBoard(),
  roundCount: 1,
  gameConfig: { playerCount: count, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
})

const completeTurn = (state: GameState): GameState => {
  let s = gameReducer(state, { type: 'SELECT_ACTION', payload: ActionType.REST })
  s = gameReducer(s, { type: 'CONFIRM_ACTION' })
  s = gameReducer(s, { type: 'SELECT_ACTION', payload: ActionType.REST })
  s = gameReducer(s, { type: 'CONFIRM_ACTION' })
  return s
}

describe('round counting', () => {
  it('tracks rounds in 3-player game', () => {
    let state = createState(3)
    for (let i = 0; i < 6; i++) {
      state = completeTurn(state)
    }
    expect(state.roundCount).toBe(3)
    expect(state.currentPlayer).toBe(0)
  })
})
