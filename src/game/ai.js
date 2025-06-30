import { ActionType } from './types'
import { LOCATIONS } from './board'
import {
  getLocationInfluence,
  getChallengeCost,
  canChallenge,
  getPlayerSafe,
  getLocationSafe,
} from './utils'
const generateAIActions = (state) => {
  const currentPlayer = getPlayerSafe(state.players, state.currentPlayer)
  if (!currentPlayer) {
    console.error('AI: Invalid current player')
    return []
  }
  const actions = []
  const location = getLocationSafe(state.board, currentPlayer.position)
  if (!location) {
    console.error('AI: Invalid current location')
    return []
  }
  const currentInfluence = getLocationInfluence(location, currentPlayer.id)
  const maxClaim = Math.min(
    currentPlayer.gold,
    location.maxInfluence - currentInfluence
  )
  if (maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
  }
  if (currentPlayer.gold >= getChallengeCost(currentPlayer)) {
    const validTargets = state.players.filter((p, i) => {
      if (i === state.currentPlayer) return false
      if (!canChallenge(currentPlayer, p)) return false
      const loc = getLocationSafe(state.board, p.position)
      if (!loc) return false
      return loc.influences[p.id] > 0
    })
    if (validTargets.length > 0) {
      actions.push({
        type: ActionType.CHALLENGE,
        target: state.players.indexOf(validTargets[0]),
      })
    }
  }
  while (actions.length < 2) {
    if (currentPlayer.gold < 2) {
      actions.push({ type: ActionType.REST })
    } else {
      const loc = LOCATIONS[currentPlayer.position]
      const adjacentLocs = loc ? loc.adjacent : []
      const targetLoc =
        adjacentLocs[Math.floor(Math.random() * adjacentLocs.length)]
      actions.push({ type: ActionType.MOVE, target: targetLoc })
    }
  }
  return actions.slice(0, 2)
}
export default generateAIActions
