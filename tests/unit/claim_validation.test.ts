import { describe, it, expect } from 'vitest'
import { executeAction } from '../../src/game/reducer'
import { ActionType, GamePhase } from '../../src/game/types'
import { createInitialBoard } from '../../src/game/board'

const makePlayer = (id: number, gold = 3, position = 0) => ({
  id: `p${id}`,
  name: `Player ${id}`,
  character: { id: 'test', name: 'Test', ability: '', description: '' },
  position,
  gold,
  totalInfluence: 0,
  isAI: false,
  actionsRemaining: 2,
})

describe('claim amount validation', () => {
  it('respects location space constraints', () => {
    const board = createInitialBoard()
    board[0].influences = { 'p0': 2 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 3)],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 1, aiDifficulty: 'easy' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }

    const newState = executeAction(state as any, {
      type: ActionType.CLAIM,
      amount: 3,
    })

    expect(newState.board[0].influences['p0']).toBe(3)
    expect(newState.players[0].gold).toBe(2)
    expect(newState.players[0].totalInfluence).toBe(1)
  })

  it('respects gold constraints', () => {
    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 1)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 1, aiDifficulty: 'easy' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }

    const newState = executeAction(state as any, {
      type: ActionType.CLAIM,
      amount: 3,
    })

    expect(newState.board[0].influences['p0']).toBe(1)
    expect(newState.players[0].gold).toBe(0)
    expect(newState.players[0].totalInfluence).toBe(1)
  })

  it('handles zero available claim gracefully', () => {
    const board = createInitialBoard()
    board[0].influences = { 'p0': 3 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 3)],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 1, aiDifficulty: 'easy' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }

    const newState = executeAction(state as any, {
      type: ActionType.CLAIM,
      amount: 1,
    })

    expect(newState.board[0].influences['p0']).toBe(3)
    expect(newState.players[0].gold).toBe(3)
    expect(newState.players[0].totalInfluence).toBe(0)
  })

  it('claims correct amount when multiple constraints apply', () => {
    const board = createInitialBoard()
    board[0].influences = { 'p0': 1 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 2)],
      board,
      roundCount: 1,
      gameConfig: { playerCount: 1, aiDifficulty: 'easy' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }

    const newState = executeAction(state as any, {
      type: ActionType.CLAIM,
      amount: 3,
    })

    expect(newState.board[0].influences['p0']).toBe(3)
    expect(newState.players[0].gold).toBe(0)
    expect(newState.players[0].totalInfluence).toBe(2)
  })
})
