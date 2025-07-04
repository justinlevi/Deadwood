import { describe, it, expect } from 'vitest'
import { executeAction } from '../../src/game/reducer'
import { ActionType, GamePhase, type GameState } from '../../src/game/types'
import { CHARACTERS } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'

const makePlayer = (charIndex: number, position: number) => ({
  id: `p${charIndex}`,
  name: `P${charIndex}`,
  character: CHARACTERS[charIndex],
  color: '#000',
  position,
  gold: 3,
  totalInfluence: 0,
  isAI: false,
  actionsRemaining: 2,
})

describe('character abilities', () => {
  it("Al Swearengen gains gold when players enter Gem Saloon", () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 1,
      players: [makePlayer(0, 1), makePlayer(1, 2)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    const newState = executeAction(state, { type: ActionType.MOVE, target: 0 })
    expect(newState.players[0].gold).toBe(4)
    expect(newState.players[1].position).toBe(0)
    expect(newState.players[1].gold).toBe(2)
  })

  it("Al Swearengen doesn't gain gold when he enters Gem Saloon", () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(0, 1), makePlayer(1, 2)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    const newState = executeAction(state, { type: ActionType.MOVE, target: 0 })
    expect(newState.players[0].position).toBe(0)
    expect(newState.players[0].gold).toBe(3)
  })

  it("Non-Al players don't trigger bonus when Al isn't in game", () => {
    const state: GameState = {
      phase: GamePhase.PLAYER_TURN,
      currentPlayer: 0,
      players: [makePlayer(1, 1), makePlayer(2, 2)],
      board: createInitialBoard(),
      roundCount: 1,
      gameConfig: { playerCount: 2, aiDifficulty: 'easy' },
      actionHistory: [],
      completedActions: [],
      pendingAction: undefined,
      message: '',
    }
    const newState = executeAction(state, { type: ActionType.MOVE, target: 0 })
    expect(newState.players[0].position).toBe(0)
    expect(newState.players[0].gold).toBe(3)
  })
})
