import type { GameState, PendingAction } from '../../src/game/types'
import { ActionType } from '../../src/game/types'
import { LOCATIONS } from '../../src/game/board'
import {
  getLocationInfluence,
  getChallengeCost,
  canChallenge,
  getMoveCost,
  getPlayerSafe,
  getLocationSafe
} from '../../src/game/utils'

// Random AI - makes completely random valid actions
export const randomAI = (state: GameState, playerIndex: number): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  const possibleActions: PendingAction[] = []
  
  // Add all possible actions
  // Rest is always possible
  possibleActions.push({ type: ActionType.REST })
  
  // Check claim
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(player.gold, location.maxInfluence - currentInfluence)
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
          possibleActions.push({ type: ActionType.CHALLENGE, target: targetIndex })
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
export const greedyAI = (state: GameState, playerIndex: number): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  
  // Priority 1: Claim as much as possible at current location
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(player.gold, location.maxInfluence - currentInfluence)
  
  if (maxClaim >= 2) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, player.gold - actions[0].amount!) })
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
          const targetInfluence = getLocationInfluence(targetLocation, player.id)
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

// Balanced AI - balances between influence, positioning, and disruption
export const balancedAI = (state: GameState, playerIndex: number): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  
  // Evaluate current situation
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(player.gold, location.maxInfluence - currentInfluence)
  
  // Score each possible action
  type ScoredAction = { action: PendingAction; score: number }
  const scoredActions: ScoredAction[] = []
  
  // Score claims
  if (maxClaim > 0) {
    for (let amount = 1; amount <= Math.min(2, maxClaim); amount++) {
      const score = amount * 10 // Base score for influence
        + (currentInfluence + amount === 3 ? 20 : 0) // Bonus for maxing location
        + (player.gold > 5 ? 5 : -5) // Penalty if low on gold
      scoredActions.push({ action: { type: ActionType.CLAIM, amount }, score })
    }
  }
  
  // Score moves
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
        
        let score = potential * 8 // Potential influence gain
        
        // Bonus for moving to uncontested locations
        const totalInfluence = Object.values(targetLocation.influences).reduce((a, b) => a + b, 0)
        if (totalInfluence === 0) score += 10
        
        // Penalty for expensive moves when low on gold
        if (cost > 0 && player.gold < 5) score -= 10
        
        scoredActions.push({ action: { type: ActionType.MOVE, target: i }, score })
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
            score 
          })
        }
      }
    })
  }
  
  // Score rest
  const restScore = player.gold < 3 ? 15 : 5
  scoredActions.push({ action: { type: ActionType.REST }, score: restScore })
  
  // Sort by score and pick top 2
  scoredActions.sort((a, b) => b.score - a.score)
  
  for (let i = 0; i < Math.min(2, scoredActions.length); i++) {
    actions.push(scoredActions[i].action)
  }
  
  // Fill with rest if needed
  while (actions.length < 2) {
    actions.push({ type: ActionType.REST })
  }
  
  return actions
}

// Aggressive AI - focuses on challenging opponents and controlling key locations
export const aggressiveAI = (state: GameState, playerIndex: number): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  
  // Priority 1: Challenge high-value targets
  const challengeCost = getChallengeCost(player)
  if (player.gold >= challengeCost) {
    const challengeTargets: Array<{ index: number; priority: number }> = []
    
    state.players.forEach((target, targetIndex) => {
      if (targetIndex !== playerIndex && canChallenge(player, target)) {
        const targetLocation = state.board[target.position]
        const targetInfluence = getLocationInfluence(targetLocation, target.id)
        
        if (targetInfluence > 0) {
          let priority = targetInfluence * 10 // Base priority on influence amount
          
          // Higher priority for leaders
          if (target.totalInfluence >= 8) priority += 30
          
          // Higher priority if they're at a key location (center locations)
          if ([1, 4].includes(target.position)) priority += 10
          
          // Higher priority if we can afford multiple challenges
          if (player.gold >= challengeCost * 2) priority += 5
          
          challengeTargets.push({ index: targetIndex, priority })
        }
      }
    })
    
    // Sort by priority and take best targets
    challengeTargets.sort((a, b) => b.priority - a.priority)
    
    for (let i = 0; i < Math.min(2, challengeTargets.length); i++) {
      if (player.gold >= challengeCost * (i + 1)) {
        actions.push({ type: ActionType.CHALLENGE, target: challengeTargets[i].index })
      }
    }
  }
  
  // Priority 2: Control central locations
  if (actions.length < 2) {
    const centralLocations = [1, 4] // Hardware Store and Freight Office
    const currentLocation = state.board[player.position]
    const currentInfluence = getLocationInfluence(currentLocation, player.id)
    
    // If at central location, claim
    if (centralLocations.includes(player.position) && currentInfluence < 3 && player.gold > 0) {
      const maxClaim = Math.min(player.gold, 3 - currentInfluence)
      actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
    } else {
      // Move to central location
      for (const targetPos of centralLocations) {
        if (targetPos !== player.position) {
          const cost = getMoveCost(player, player.position, targetPos)
          if (player.gold >= cost) {
            const targetLocation = state.board[targetPos]
            const targetInfluence = getLocationInfluence(targetLocation, player.id)
            
            if (targetInfluence < 3) {
              actions.push({ type: ActionType.MOVE, target: targetPos })
              break
            }
          }
        }
      }
    }
  }
  
  // Priority 3: Build gold for more challenges
  while (actions.length < 2) {
    if (player.gold < 4) {
      actions.push({ type: ActionType.REST })
    } else {
      // If we have gold, claim current location
      const location = state.board[player.position]
      const influence = getLocationInfluence(location, player.id)
      if (influence < 3 && player.gold > 0) {
        actions.push({ type: ActionType.CLAIM, amount: 1 })
      } else {
        actions.push({ type: ActionType.REST })
      }
    }
  }
  
  return actions
}

// Defensive AI - focuses on protecting influence and avoiding confrontation
export const defensiveAI = (state: GameState, playerIndex: number): PendingAction[] => {
  const player = state.players[playerIndex]
  const actions: PendingAction[] = []
  
  // Analyze threats
  const threatsAtLocation = state.players.filter((p, i) => 
    i !== playerIndex && 
    (p.position === player.position || 
     (p.character.id === 'cy' && Math.abs(p.position - player.position) === 1))
  ).length
  
  // Priority 1: Move away from threats
  if (threatsAtLocation > 0 && actions.length < 2) {
    let safestMove: PendingAction | null = null
    let lowestThreat = threatsAtLocation
    
    for (let i = 0; i < LOCATIONS.length; i++) {
      if (i !== player.position) {
        const cost = getMoveCost(player, player.position, i)
        if (player.gold >= cost) {
          const threatsAtTarget = state.players.filter((p, idx) => 
            idx !== playerIndex && 
            (p.position === i || 
             (p.character.id === 'cy' && Math.abs(p.position - i) === 1))
          ).length
          
          if (threatsAtTarget < lowestThreat) {
            lowestThreat = threatsAtTarget
            safestMove = { type: ActionType.MOVE, target: i }
          }
        }
      }
    }
    
    if (safestMove) {
      actions.push(safestMove)
    }
  }
  
  // Priority 2: Build influence in safe locations
  const location = state.board[player.position]
  const currentInfluence = getLocationInfluence(location, player.id)
  const maxClaim = Math.min(player.gold, location.maxInfluence - currentInfluence)
  
  if (maxClaim > 0 && threatsAtLocation === 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
  }
  
  // Priority 3: Build gold reserves
  while (actions.length < 2) {
    if (player.gold < 5) {
      actions.push({ type: ActionType.REST })
    } else if (maxClaim > 0) {
      actions.push({ type: ActionType.CLAIM, amount: 1 })
    } else {
      // Find empty location to move to
      let emptyLocation: number | null = null
      for (let i = 0; i < LOCATIONS.length; i++) {
        if (i !== player.position) {
          const totalInfluence = Object.values(state.board[i].influences)
            .reduce((a, b) => a + b, 0)
          if (totalInfluence === 0) {
            const cost = getMoveCost(player, player.position, i)
            if (player.gold >= cost) {
              emptyLocation = i
              break
            }
          }
        }
      }
      
      if (emptyLocation !== null) {
        actions.push({ type: ActionType.MOVE, target: emptyLocation })
      } else {
        actions.push({ type: ActionType.REST })
      }
    }
  }
  
  return actions
}