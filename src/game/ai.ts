import type { PendingAction, GameState } from './types'
import { ActionType } from './types'
import { LOCATIONS } from './board'
import { getLocationInfluence, getChallengeCost, canChallenge } from './utils'

const generateAIActions = (state: GameState): PendingAction[] => {
  const currentPlayer = state.players[state.currentPlayer]
  const actions: PendingAction[] = []
  const location = state.board[currentPlayer.position]
  const currentInfluence = getLocationInfluence(location, currentPlayer.id)
  const maxClaim = Math.min(
    currentPlayer.gold,
    location.maxInfluence - currentInfluence
  )
  if (maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
  }
  if (currentPlayer.gold >= getChallengeCost(currentPlayer)) {
    const validTargets = state.players.filter(
      (p, i) =>
        i !== state.currentPlayer &&
        canChallenge(currentPlayer, p) &&
        state.board[p.position].influences[p.id] > 0
    )
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
      const adjacentLocs = LOCATIONS[currentPlayer.position].adjacent
      const targetLoc =
        adjacentLocs[Math.floor(Math.random() * adjacentLocs.length)]
      actions.push({ type: ActionType.MOVE, target: targetLoc })
    }
  }
  return actions.slice(0, 2)
}

export default generateAIActions
