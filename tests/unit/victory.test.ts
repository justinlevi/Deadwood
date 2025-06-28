import { describe, it, expect } from 'vitest'
import { checkVictoryConditions } from '../../src/game/reducer'
import { GamePhase, type GameState } from '../../src/game/types'
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
      turnCount: 1,
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
      turnCount: 1,
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
      turnCount: 20,
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
})
