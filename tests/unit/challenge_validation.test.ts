import { describe, it, expect } from 'vitest'
import { executeAction } from '../../src/game/reducer'
import { ActionType, GamePhase, type GameState } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'
import { createPlayers } from '../../src/game/players'

const state: GameState = {
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

state.players[0].gold = 3
state.players[1].position = 0

// No influence on board

describe('challenge validation', () => {
  it('does not deduct gold for invalid challenge', () => {
    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: 1,
    })
    expect(newState.players[0].gold).toBe(3)
    expect(newState.board[0].influences).toEqual({})
  })
})
