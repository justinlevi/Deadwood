import { describe, it, expect } from 'vitest'
import { gameReducer } from '../../src/game'
import type { GameState } from '../../src/game'
import { GamePhase, ActionType } from '../../src/game'
import { createInitialBoard } from '../../src/game'
import { createPlayers, CHARACTERS } from '../../src/game/players'
import { executeAction } from '../../src/game/reducer'

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

describe('gameReducer', () => {
  it('handles rest action', () => {
    const state = gameReducer(initialState, { type: 'SELECT_ACTION', payload: ActionType.REST })
    expect(state.completedActions).toHaveLength(1)
    expect(state.players[0].gold).toBe(5)
  })
})
it('handles challenge target by index', () => {
  const state: GameState = {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players: [
      { ...createPlayers(2)[0], id: 'player-0', position: 0, gold: 3, totalInfluence: 0 },
      { ...createPlayers(2)[1], id: 'player-1', position: 0, gold: 3, totalInfluence: 2 }
    ],
    board: [{ ...createInitialBoard()[0], influences: { 'player-1': 2 }, id: 0 }],
    roundCount: 1,
    gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  }

  const afterSelect = gameReducer(state, { type: 'SELECT_ACTION', payload: ActionType.CHALLENGE })
  const afterTarget = gameReducer(afterSelect, { type: 'SET_ACTION_TARGET', payload: { target: 1 } })
  const finalState = gameReducer(afterTarget, { type: 'CONFIRM_ACTION' })
  expect(finalState.players[1].totalInfluence).toBe(1)
  expect(finalState.board[0].influences['player-1']).toBe(1)
})

const makePlayer = (index: number, position = 0) => ({
  id: `player-${index}`,
  name: `Player ${index}`,
  character: CHARACTERS[index % CHARACTERS.length],
  position,
  gold: 3,
  totalInfluence: 0,
  isAI: index > 0,
  actionsRemaining: 2,
})

describe('challenge action targeting', () => {
  it('correctly identifies challenge target by index', () => {
    const board = createInitialBoard()
    board[0].influences = { 'player-1': 2 }

    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [
        makePlayer(0, 0),
        { ...makePlayer(1, 0), totalInfluence: 2 },
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

    expect(newState.players[1].totalInfluence).toBe(1)
    expect(newState.board[0].influences['player-1']).toBe(1)
    expect(newState.players[0].gold).toBe(1)
  })

  it('handles invalid challenge target index gracefully', () => {
    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0), makePlayer(1)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: 5,
    })

    expect(newState.players[0].gold).toBe(3)
  })

  it('handles negative challenge target index', () => {
    const state = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0), makePlayer(1)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'medium' as const },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    } as any

    const newState = executeAction(state, {
      type: ActionType.CHALLENGE,
      target: -1,
    })

    expect(newState.players[0].gold).toBe(3)
  })
})

