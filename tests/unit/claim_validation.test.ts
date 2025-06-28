import { describe, it, expect } from 'vitest'
import { executeAction } from '../../src/game/reducer'
import { ActionType, type GameState, GamePhase } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'
import { createPlayers } from '../../src/game/players'

const state: GameState = {
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 0,
  players: createPlayers(1),
  board: createInitialBoard(),
  roundCount: 1,
  gameConfig: { playerCount: 1, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
}

state.players[0].gold = 3
state.players[0].position = 0
state.board[0].influences[state.players[0].id] = 2

describe('claim validation', () => {
  it('respects constraints and only claims available space', () => {
    const newState = executeAction(state, { type: ActionType.CLAIM, amount: 3 })
    expect(newState.board[0].influences[state.players[0].id]).toBe(3)
    expect(newState.players[0].gold).toBe(2)
    expect(newState.players[0].totalInfluence).toBe(1)
  })
})
