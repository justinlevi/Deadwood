import type { Player, Location } from './types'
import { isAdjacent } from './board'

export const getMoveCost = (
  player: Player,
  from: number,
  to: number
): number => {
  if (player.character.id === 'jane') return 0
  return isAdjacent(from, to) ? 0 : 1
}

export const getChallengeCost = (player: Player): number => {
  return player.character.id === 'seth' ? 1 : 2
}

export const canChallenge = (player: Player, target: Player): boolean => {
  if (player.character.id === 'cy') {
    return (
      player.position === target.position ||
      isAdjacent(player.position, target.position)
    )
  }
  return player.position === target.position
}

export const getLocationInfluence = (
  location: Location,
  playerId: string
): number => {
  return location.influences[playerId] || 0
}
