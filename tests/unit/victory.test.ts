import { describe, it, expect } from 'vitest'
import { checkVictoryConditions, default as gameReducer } from '../../src/game/reducer'
import { GamePhase, type GameState, ActionType } from '../../src/game/types'
import { CHARACTERS } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'

const makePlayer = (charIndex: number) => ({
  id: `p${charIndex}`,
  name: `P${charIndex}`,
  character: CHARACTERS[charIndex],
  position: 0,
  gold: 3,
  totalInfluence: 0,
  isAI: false,
  actionsRemaining: 2,
})

describe('victory conditions', () => {
  it('detects total influence victory', () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0), makePlayer(1)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    state.players[0].totalInfluence = 12
    expect(checkVictoryConditions(state)).toBe(0)
  })

  it('detects location control victory', () => {
    const board = createInitialBoard()
    board[0].influences['p0'] = 3
    board[1].influences['p0'] = 3
    board[2].influences['p0'] = 3
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0), makePlayer(1)],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    state.players[0].totalInfluence = 9
    expect(checkVictoryConditions(state)).toBe(0)
  })

  it('uses gold as tiebreaker at turn limit', () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0), makePlayer(1)],
      board: createInitialBoard(),
      roundCount: 20,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    state.players[0].totalInfluence = 5
    state.players[1].totalInfluence = 5
    state.players[0].gold = 3
    state.players[1].gold = 6
    expect(checkVictoryConditions(state)).toBe(1)
  })

  it('detects victory after first action', () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 1, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    state.players[0].totalInfluence = 11
    const afterSelect = gameReducer(state, {
      type: 'SELECT_ACTION',
      payload: ActionType.CLAIM,
    })
    const finalState = gameReducer(afterSelect, { type: 'CONFIRM_ACTION' })
    expect(finalState.phase).toBe(GamePhase.GAME_OVER)
    expect(finalState.winner).toBe(0)
    expect(finalState.completedActions).toHaveLength(1)
  })
})
