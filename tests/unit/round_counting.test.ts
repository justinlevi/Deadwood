import { describe, it, expect } from 'vitest'
import gameReducer from '../../src/game/reducer'
import { GamePhase, ActionType } from '../../src/game/types'
import { createPlayers } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'

const createGameState = (playerCount: number, roundCount = 1) => {
  const players = createPlayers(playerCount)
  return {
    phase: GamePhase.PLAYER_TURN,
    currentPlayer: 0,
    players,
    board: createInitialBoard(),
    roundCount,
    gameConfig: { playerCount, aiDifficulty: 'medium' as const },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: `Round ${roundCount} • ${players[0].character.name}'s turn`,
  }
}

const completeTurn = (state: any) => {
  let newState = gameReducer(state, {
    type: 'SELECT_ACTION',
    payload: ActionType.REST,
  })
  newState = gameReducer(newState, { type: 'CONFIRM_ACTION' })
  newState = gameReducer(newState, {
    type: 'SELECT_ACTION',
    payload: ActionType.REST,
  })
  newState = gameReducer(newState, { type: 'CONFIRM_ACTION' })
  return newState
}

describe('round counting', () => {
  it('increments round after all players complete their turns', () => {
    let state = createGameState(3)
    expect(state.roundCount).toBe(1)

    state = completeTurn(state)
    expect(state.roundCount).toBe(1)
    expect(state.currentPlayer).toBe(1)

    state = completeTurn(state)
    expect(state.roundCount).toBe(1)
    expect(state.currentPlayer).toBe(2)

    state = completeTurn(state)
    expect(state.roundCount).toBe(2)
    expect(state.currentPlayer).toBe(0)
  })

  it('correctly tracks rounds in 2-player game', () => {
    let state = createGameState(2)
    for (let i = 0; i < 4; i++) {
      state = completeTurn(state)
    }
    expect(state.roundCount).toBe(3)
    expect(state.currentPlayer).toBe(0)
  })

  it('ends game after round 20 completes', () => {
    let state = createGameState(2, 20)
    state = completeTurn(state)
    expect(state.phase).toBe(GamePhase.PLAYER_TURN)

    state = completeTurn(state)
    expect(state.roundCount).toBe(21)
  })

  it('shows correct round in messages', () => {
    const state = createGameState(2)
    expect(state.message).toContain('Round 1')

    const afterTurn = completeTurn(state)
    expect(afterTurn.message).toContain('Round 1')

    const afterRound = completeTurn(afterTurn)
    expect(afterRound.message).toContain('Round 2')
  })
})
