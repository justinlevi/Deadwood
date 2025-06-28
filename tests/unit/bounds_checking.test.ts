import { describe, it, expect } from 'vitest'
import { getPlayerSafe, getLocationSafe } from '../../src/game/utils'
import { createPlayers } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'

const players = createPlayers(2)
const board = createInitialBoard()

describe('bounds checking', () => {
  it('handles invalid player index gracefully', () => {
    const player = getPlayerSafe(players, 99)
    expect(player).toBeUndefined()
  })

  it('handles invalid location index gracefully', () => {
    expect(getLocationSafe(board, -1)).toBeUndefined()
    expect(getLocationSafe(board, 999)).toBeUndefined()
  })
})
