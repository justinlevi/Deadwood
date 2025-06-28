import { describe, it, expect } from 'vitest'
import { getMoveCost, getChallengeCost, canChallenge } from '../../src/game/utils'
import { CHARACTERS } from '../../src/game/players'

const makePlayer = (characterIndex: number, position = 0) => ({
  id: `p${characterIndex}`,
  name: `P${characterIndex}`,
  character: CHARACTERS[characterIndex],
  position,
  gold: 3,
  totalInfluence: 0,
  isAI: false,
  actionsRemaining: 2,
})

describe('utils', () => {
  it('calculates move cost including Calamity Jane ability', () => {
    const normal = makePlayer(0, 0) // Al Swearengen
    const jane = makePlayer(3, 0) // Calamity Jane
    expect(getMoveCost(normal, 0, 1)).toBe(0)
    expect(getMoveCost(normal, 0, 2)).toBe(1)
    expect(getMoveCost(jane, 0, 5)).toBe(0)
  })

  it('calculates challenge cost including Seth Bullock ability', () => {
    const seth = makePlayer(1)
    const al = makePlayer(0)
    expect(getChallengeCost(seth)).toBe(1)
    expect(getChallengeCost(al)).toBe(2)
  })

  it('determines valid challenge targets with Cy Tolliver ability', () => {
    const cy = makePlayer(2, 0)
    const targetAdjacent = makePlayer(1, 1)
    const normal = makePlayer(0, 0)
    expect(canChallenge(cy, targetAdjacent)).toBe(true)
    expect(canChallenge(normal, targetAdjacent)).toBe(false)
  })
})
