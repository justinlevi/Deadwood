import { describe, it, expect } from 'vitest'
import {
  getPlayerSafe,
  getLocationSafe,
  findPlayerIndexSafe,
} from '../../src/game/utils'
import { createPlayers } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'

describe('array bounds checking', () => {
  it('handles invalid player index gracefully', () => {
    const players = createPlayers(2)
    expect(getPlayerSafe(players, 0)).toBeDefined()
    expect(getPlayerSafe(players, 1)).toBeDefined()
    expect(getPlayerSafe(players, -1)).toBeUndefined()
    expect(getPlayerSafe(players, 2)).toBeUndefined()
    expect(getPlayerSafe(players, 99)).toBeUndefined()
  })

  it('handles invalid location index gracefully', () => {
    const board = createInitialBoard()
    expect(getLocationSafe(board, 0)).toBeDefined()
    expect(getLocationSafe(board, 5)).toBeDefined()
    expect(getLocationSafe(board, -1)).toBeUndefined()
    expect(getLocationSafe(board, 6)).toBeUndefined()
    expect(getLocationSafe(board, 999)).toBeUndefined()
  })

  it('finds player index safely', () => {
    const players = createPlayers(2)
    const index = findPlayerIndexSafe(players, players[0].id)
    expect(index).toBe(0)
    const invalidIndex = findPlayerIndexSafe(players, 'non-existent')
    expect(invalidIndex).toBe(-1)
  })

  it('handles empty arrays', () => {
    expect(getPlayerSafe([], 0)).toBeUndefined()
    expect(getLocationSafe([], 0)).toBeUndefined()
    expect(findPlayerIndexSafe([], 'any')).toBe(-1)
  })
})
