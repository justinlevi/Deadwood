import type { GameState, PendingAction } from '../../src/game/types'
import { ActionType } from '../../src/game/types'
import { LOCATIONS } from '../../src/game/board'
import {
  getLocationInfluence,
  getChallengeCost,
  canChallenge,
  getMoveCost,
  getPlayerSafe,
  getLocationSafe,
} from '../../src/game/utils'

// Random AI - makes completely random valid actions
export const randomAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  const possibleActions: PendingAction[] = []

  // Add all possible actions
  // Rest is always possible
  possibleActions.push({ type: ActionType.REST })

  // Check claim
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(
    player.gold,
    location.maxInfluence - currentInfluence
  )
  if (maxClaim > 0) {
    for (let i = 1; i <= maxClaim; i++) {
      possibleActions.push({ type: ActionType.CLAIM, amount: i })
    }
  }

  // Check moves
  for (let i = 0; i < LOCATIONS.length; i++) {
    if (i !== player.position) {
      const cost = getMoveCost(player, player.position, i)
      if (player.gold >= cost) {
        possibleActions.push({ type: ActionType.MOVE, target: i })
      }
    }
  }

  // Check challenges
  if (player.gold >= getChallengeCost(player)) {
    state.players.forEach((target, targetIndex) => {
      if (targetIndex !== playerIndex && canChallenge(player, target)) {
        const targetLocation = state.board[target.position]
        if (getLocationInfluence(targetLocation, target.id) > 0) {
          possibleActions.push({
            type: ActionType.CHALLENGE,
            target: targetIndex,
          })
        }
      }
    })
  }

  // Pick 2 random actions
  while (actions.length < 2 && possibleActions.length > 0) {
    const randomIndex = Math.floor(Math.random() * possibleActions.length)
    actions.push(possibleActions[randomIndex])
    possibleActions.splice(randomIndex, 1)
  }

  // Fill with rest if needed
  while (actions.length < 2) {
    actions.push({ type: ActionType.REST })
  }

  return actions
}

// Greedy AI - always tries to maximize influence gain
export const greedyAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []

  // Priority 1: Claim as much as possible at current location
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(
    player.gold,
    location.maxInfluence - currentInfluence
  )

  if (maxClaim >= 2) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
    actions.push({
      type: ActionType.CLAIM,
      amount: Math.min(2, player.gold - actions[0].amount!),
    })
  } else if (maxClaim === 1) {
    actions.push({ type: ActionType.CLAIM, amount: 1 })
  }

  // Priority 2: Move to locations where we can claim more
  if (actions.length < 2) {
    let bestMove: PendingAction | null = null
    let bestPotential = 0

    for (let i = 0; i < LOCATIONS.length; i++) {
      if (i !== player.position) {
        const cost = getMoveCost(player, player.position, i)
        if (player.gold >= cost) {
          const targetLocation = state.board[i]
          const targetInfluence = getLocationInfluence(
            targetLocation,
            player.id
          )
          const potential = Math.min(
            player.gold - cost,
            targetLocation.maxInfluence - targetInfluence
          )

          if (potential > bestPotential) {
            bestPotential = potential
            bestMove = { type: ActionType.MOVE, target: i }
          }
        }
      }
    }

    if (bestMove && bestPotential > 0) {
      actions.push(bestMove)
    }
  }

  // Priority 3: Rest to get more gold
  while (actions.length < 2) {
    actions.push({ type: ActionType.REST })
  }

  return actions
}

// Balanced AI - FIXED to properly prioritize claims
export const balancedAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []

  // Evaluate current situation
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(
    player.gold,
    location.maxInfluence - currentInfluence
  )

  // Score each possible action
  type ScoredAction = { action: PendingAction; score: number }
  const scoredActions: ScoredAction[] = []

  // Score claims - INCREASED BASE SCORE
  if (maxClaim > 0) {
    for (let amount = 1; amount <= Math.min(2, maxClaim); amount++) {
      const score =
        amount * 20 + // DOUBLED from 10 to prioritize claims
        (currentInfluence + amount === 3 ? 30 : 0) + // Increased bonus for maxing location
        (player.gold > 5 ? 5 : -5) // Penalty if low on gold
      scoredActions.push({ action: { type: ActionType.CLAIM, amount }, score })
    }
  }

  // Score moves - REDUCED BASE SCORE
  for (let i = 0; i < LOCATIONS.length; i++) {
    if (i !== player.position) {
      const cost = getMoveCost(player, player.position, i)
      if (player.gold >= cost) {
        const targetLocation = state.board[i]
        const targetInfluence = getLocationInfluence(targetLocation, player.id)
        const potential = Math.min(
          player.gold - cost,
          targetLocation.maxInfluence - targetInfluence
        )

        let score = potential * 5 // REDUCED from 8

        // Bonus for moving to uncontested locations
        const totalInfluence = Object.values(targetLocation.influences).reduce(
          (a, b) => a + b,
          0
        )
        if (totalInfluence === 0) score += 10

        // Penalty for expensive moves when low on gold
        if (cost > 0 && player.gold < 5) score -= 10

        scoredActions.push({
          action: { type: ActionType.MOVE, target: i },
          score,
        })
      }
    }
  }

  // Score challenges
  if (player.gold >= getChallengeCost(player)) {
    state.players.forEach((target, targetIndex) => {
      if (targetIndex !== playerIndex && canChallenge(player, target)) {
        const targetLocation = state.board[target.position]
        const targetInfluence = getLocationInfluence(targetLocation, target.id)

        if (targetInfluence > 0) {
          let score = 5 // Base disruption value

          // Higher score for challenging leaders
          if (target.totalInfluence > player.totalInfluence) score += 10

          // Higher score for removing last influence
          if (targetInfluence === 1) score += 5

          // Higher score if target is close to winning
          if (target.totalInfluence >= 10) score += 15

          scoredActions.push({
            action: { type: ActionType.CHALLENGE, target: targetIndex },
            score,
          })
        }
      }
    })
  }

  // Score rest - minimal but sometimes necessary
  scoredActions.push({ action: { type: ActionType.REST }, score: 3 })

  // Sort by score and pick top 2
  scoredActions.sort((a, b) => b.score - a.score)

  // Always try to include at least one claim if possible
  const hasClaimAction = scoredActions
    .slice(0, 2)
    .some((sa) => sa.action.type === ActionType.CLAIM)
  if (!hasClaimAction && maxClaim > 0) {
    // Force a claim as the first action
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
    // Add the highest scoring non-claim action
    const nonClaimAction = scoredActions.find(
      (sa) => sa.action.type !== ActionType.CLAIM
    )
    if (nonClaimAction) {
      actions.push(nonClaimAction.action)
    }
  } else {
    // Take top 2 scored actions
    for (let i = 0; i < Math.min(2, scoredActions.length); i++) {
      actions.push(scoredActions[i].action)
    }
  }

  // Fill with rest if needed
  while (actions.length < 2) {
    actions.push({ type: ActionType.REST })
  }

  return actions
}

// Aggressive AI - focuses on challenging opponents and central control
export const aggressiveAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []

  // Priority 1: Challenge opponents if possible
  if (player.gold >= getChallengeCost(player)) {
    const challengeTargets: Array<{ index: number; score: number }> = []

    state.players.forEach((target, targetIndex) => {
      if (targetIndex !== playerIndex && canChallenge(player, target)) {
        const targetLocation = state.board[target.position]
        const targetInfluence = getLocationInfluence(targetLocation, target.id)

        if (targetInfluence > 0) {
          let score = targetInfluence * 10
          if (target.totalInfluence > player.totalInfluence) score += 20
          if ([2, 3, 4].includes(target.position)) score += 10 // Central locations

          challengeTargets.push({ index: targetIndex, score })
        }
      }
    })

    if (challengeTargets.length > 0) {
      challengeTargets.sort((a, b) => b.score - a.score)
      actions.push({
        type: ActionType.CHALLENGE,
        target: challengeTargets[0].index,
      })
    }
  }

  // Priority 2: Claim or move to central locations
  const centralLocations = [2, 3, 4] // Downtown, Railroad, Saloon
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(
    player.gold,
    location.maxInfluence - currentInfluence
  )

  if (centralLocations.includes(player.position) && maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
  } else if (actions.length < 2) {
    // Move to central location
    let bestMove: PendingAction | null = null
    let bestScore = -1

    for (const targetPos of centralLocations) {
      if (targetPos !== player.position) {
        const cost = getMoveCost(player, player.position, targetPos)
        if (player.gold >= cost) {
          const targetLocation = state.board[targetPos]
          const targetInfluence = getLocationInfluence(
            targetLocation,
            player.id
          )
          const potential = targetLocation.maxInfluence - targetInfluence

          const score = potential * 10 - cost * 2
          if (score > bestScore) {
            bestScore = score
            bestMove = { type: ActionType.MOVE, target: targetPos }
          }
        }
      }
    }

    if (bestMove) {
      actions.push(bestMove)
    }
  }

  // Fill remaining with claims or rest
  while (actions.length < 2) {
    if (maxClaim > 0 && player.gold > 0) {
      actions.push({ type: ActionType.CLAIM, amount: 1 })
    } else {
      actions.push({ type: ActionType.REST })
    }
  }

  return actions
}

// Defensive AI - avoids confrontation, builds in safe locations
export const defensiveAI = (
  state: GameState,
  playerIndex: number
): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []

  // Evaluate current location safety
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(
    player.gold,
    location.maxInfluence - currentInfluence
  )

  // Check if current location is "safe" (no other players or we have majority)
  let locationSafe = true
  let ourInfluence = currentInfluence
  let maxOtherInfluence = 0

  Object.entries(location.influences).forEach(([playerId, influence]) => {
    if (playerId !== player.id && influence > 0) {
      locationSafe = false
      maxOtherInfluence = Math.max(maxOtherInfluence, influence)
    }
  })

  // Priority 1: Claim in safe locations
  if (locationSafe && maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
    if (maxClaim > 2 && player.gold > 2) {
      actions.push({
        type: ActionType.CLAIM,
        amount: Math.min(2, maxClaim - 2),
      })
    }
  }

  // Priority 2: Move to safer locations
  if (actions.length < 2) {
    const edgeLocations = [0, 1, 5, 6, 7] // Less contested edges
    let bestMove: PendingAction | null = null
    let bestScore = -100

    for (const targetPos of edgeLocations) {
      if (targetPos !== player.position) {
        const cost = getMoveCost(player, player.position, targetPos)
        if (player.gold >= cost) {
          const targetLocation = state.board[targetPos]

          // Check if target is uncontested
          let targetSafe = true
          let targetOccupied = false

          Object.entries(targetLocation.influences).forEach(
            ([playerId, influence]) => {
              if (playerId !== player.id && influence > 0) {
                targetSafe = false
              }
            }
          )

          state.players.forEach((p, idx) => {
            if (idx !== playerIndex && p.position === targetPos) {
              targetOccupied = true
            }
          })

          const targetInfluence = getLocationInfluence(
            targetLocation,
            player.id
          )
          const potential = targetLocation.maxInfluence - targetInfluence

          let score = potential * 10
          if (targetSafe) score += 20
          if (targetOccupied) score -= 15
          score -= cost * 3

          if (score > bestScore) {
            bestScore = score
            bestMove = { type: ActionType.MOVE, target: targetPos }
          }
        }
      }
    }

    if (bestMove && bestScore > 0) {
      actions.push(bestMove)
    }
  }

  // Priority 3: Rest to build resources
  while (actions.length < 2) {
    if (!locationSafe && player.gold < 3) {
      // If threatened and low on gold, prioritize rest
      actions.push({ type: ActionType.REST })
    } else if (maxClaim > 0 && player.gold > 0) {
      // Otherwise try to claim what we can
      actions.push({ type: ActionType.CLAIM, amount: 1 })
    } else {
      actions.push({ type: ActionType.REST })
    }
  }

  return actions
}

// Export MCTS placeholder (implemented separately)
export { mctsAI } from '../analysis/mcts'
