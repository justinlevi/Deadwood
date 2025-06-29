import { describe, it, expect } from 'vitest'
import { executeAction } from '../../src/game/reducer'
import gameReducer from '../../src/game/reducer'
import { ActionType, GamePhase } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'
import { CHARACTERS } from '../../src/game/players'

const makePlayer = (charIndex: number, position = 0, gold = 3) => ({
  id: `p${charIndex}`,
  name: `P${charIndex}`,
  character: CHARACTERS[charIndex],
  position,
  gold,
  totalInfluence: 0,
  isAI: false,
  actionsRemaining: 2,
})

describe('challenge cost validation', () => {
  it('does not deduct gold for invalid challenge - no influence', () => {
    const board = createInitialBoard()
    // No influence at location 0

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [
        makePlayer(0, 0, 3), // Challenger with 3 gold
        makePlayer(1, 0, 3), // Target at same location, no influence
      ],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: 1,
    })

    // Gold should not change
    expect(newState.players[0].gold).toBe(3)
    // No influence should be removed
    expect(newState.board[0].influences).toEqual({})
  })

  it('does not deduct gold for invalid challenge - wrong position', () => {
    const board = createInitialBoard()
    board[1].influences = { p0: 2 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [
        makePlayer(1, 0, 3), // Seth at location 0
        makePlayer(0, 1, 3), // Al at location 1 with influence
      ],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: 1,
    })

    // Gold should not change (Seth can't challenge someone at different location)
    expect(newState.players[0].gold).toBe(3)
    expect(newState.board[1].influences['p0']).toBe(2)
  })

  it('deducts gold only for valid challenge', () => {
    const board = createInitialBoard()
    board[0].influences = { p0: 2 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [
        makePlayer(1, 0, 3), // Seth (1 gold challenge cost)
        makePlayer(0, 0, 3), // Al at same location with influence
      ],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: 1,
    })

    // Should deduct 1 gold (Seth's ability)
    expect(newState.players[0].gold).toBe(2)
    // Should reduce influence
    expect(newState.board[0].influences['p0']).toBe(1)
    expect(newState.players[1].totalInfluence).toBe(-1)
  })

  it('prevents challenge selection when no valid targets', () => {
    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 0, 3), makePlayer(1, 1, 3)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = gameReducer(state, {
      type: 'SELECT_ACTION',
      payload: ActionType.CHALLENGE,
    })

    // Should not create pending action
    expect(newState.pendingAction).toBeUndefined()
    expect(newState).toEqual(state)
  })
})
