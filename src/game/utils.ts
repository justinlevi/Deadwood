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

export const getPlayerSafe = (
  players: Player[],
  index: number
): Player | undefined => {
  if (index < 0 || index >= players.length) {
    console.error(`Invalid player index: ${index}`)
    return undefined
  }
  return players[index]
}

export const getLocationSafe = (
  board: Location[],
  index: number
): Location | undefined => {
  if (index < 0 || index >= board.length) {
    console.error(`Invalid location index: ${index}`)
    return undefined
  }
  return board[index]
}

export const findPlayerIndex = (
  players: Player[],
  playerId: string
): number => {
  const idx = players.findIndex((p) => p.id === playerId)
  if (idx === -1) {
    console.error(`Player not found: ${playerId}`)
  }
  return idx
}
