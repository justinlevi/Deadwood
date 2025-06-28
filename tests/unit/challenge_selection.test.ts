import { describe, it, expect } from 'vitest'
import gameReducer from '../../src/game/reducer'
import { GamePhase, ActionType, type GameState } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'
import { createPlayers } from '../../src/game/players'

const initialState: GameState = {
  phase: GamePhase.PLAYER_TURN,
  currentPlayer: 0,
  players: createPlayers(3),
  board: createInitialBoard(),
  roundCount: 1,
  gameConfig: { playerCount: 3, aiDifficulty: 'easy' },
  actionHistory: [],
  completedActions: [],
  pendingAction: undefined,
  message: '',
}

initialState.players[0].position = 0
initialState.players[1].position = 0
initialState.players[2].position = 0
initialState.board[0].influences[initialState.players[1].id] = 2
initialState.board[0].influences[initialState.players[2].id] = 1
initialState.players[1].totalInfluence = 2
initialState.players[2].totalInfluence = 1

describe('challenge target selection', () => {
  it('shows targets when multiple valid options exist', () => {
    let state = gameReducer(initialState, {
      type: 'SELECT_ACTION',
      payload: ActionType.CHALLENGE,
    })
    state = gameReducer(state, {
      type: 'SHOW_CHALLENGE_TARGETS',
      payload: [
        { playerId: initialState.players[1].id, playerIndex: 1 },
        { playerId: initialState.players[2].id, playerIndex: 2 },
      ],
    })
    expect(state.challengeTargets).toHaveLength(2)
    expect(state.message).toBe('Select which player to challenge')
  })

  it('sets the selected challenge target', () => {
    const stateWithTargets: GameState = {
      ...initialState,
      pendingAction: { type: ActionType.CHALLENGE },
      challengeTargets: [
        { playerId: initialState.players[1].id, playerIndex: 1 },
        { playerId: initialState.players[2].id, playerIndex: 2 },
      ],
    }

    const newState = gameReducer(stateWithTargets, {
      type: 'SELECT_CHALLENGE_TARGET',
      payload: 2,
    })

    expect(newState.pendingAction?.target).toBe(2)
    expect(newState.challengeTargets).toBeUndefined()
  })
})
