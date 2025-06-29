import type { GameState, PendingAction, GameAction } from './types'
import { GamePhase, ActionType } from './types'
import { createPlayers } from './players'
import { createInitialBoard } from './board'
import {
  getMoveCost,
  getChallengeCost,
  getLocationInfluence,
  canChallenge,
  getPlayerSafe,
  getLocationSafe,
  findPlayerIndexSafe,
} from './utils'

export const checkVictoryConditions = (
  state: GameState
): number | undefined => {
  // Check for immediate victory conditions first
  for (const player of state.players) {
    let maxInfluenceCount = 0
    for (const location of state.board) {
      if (getLocationInfluence(location, player.id) === 3) maxInfluenceCount++
    }
    if (maxInfluenceCount >= 3) return state.players.indexOf(player)
    if (player.totalInfluence >= 12) return state.players.indexOf(player)
  }

  // Check if we've exceeded 20 rounds (game ends after round 20 completes)
  // When currentPlayer is 0 and roundCount is 21, we've just started round 21
  if (state.roundCount > 20 && state.currentPlayer === 0) {
    let maxInfluence = -1
    let winner = 0
    state.players.forEach((player, index) => {
      if (player.totalInfluence > maxInfluence) {
        maxInfluence = player.totalInfluence
        winner = index
      } else if (
        player.totalInfluence === maxInfluence &&
        player.gold > state.players[winner].gold
      ) {
        winner = index
      }
    })
    return winner
  }
  return undefined
}

const checkAndHandleVictory = (
  _state: GameState,
  newState: GameState,
  completedActions: PendingAction[]
): GameState | null => {
  void _state
  const winner = checkVictoryConditions(newState)
  if (winner !== undefined) {
    return {
      ...newState,
      phase: GamePhase.GAME_OVER,
      winner,
      completedActions,
      pendingAction: undefined,
      message: `${newState.players[winner].name} wins!`,
    }
  }
  return null
}

export const executeAction = (
  state: GameState,
  action: PendingAction
): GameState => {
  const currentPlayer = getPlayerSafe(state.players, state.currentPlayer)
  if (!currentPlayer) {
    console.error('Invalid current player index')
    return state
  }
  const newBoard = [...state.board]
  const newPlayers = [...state.players]
  switch (action.type) {
    case ActionType.MOVE: {
      if (action.target === undefined) break
      const targetLocation = getLocationSafe(newBoard, action.target)
      if (!targetLocation) {
        console.error('Invalid move target location')
        break
      }
      const moveCost = getMoveCost(
        currentPlayer,
        currentPlayer.position,
        action.target
      )
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        position: action.target,
        gold: currentPlayer.gold - moveCost,
      }
      if (action.target === 0) {
        const alPlayer = newPlayers.find((p) => p.character.id === 'al')
        if (alPlayer && currentPlayer.character.id !== 'al') {
          const alIndex = findPlayerIndexSafe(newPlayers, alPlayer.id)
          if (alIndex !== -1) {
            newPlayers[alIndex] = { ...alPlayer, gold: alPlayer.gold + 1 }
          }
        }
      }
      break
    }
    case ActionType.CLAIM: {
      const amount = action.amount || 1
      const location = getLocationSafe(newBoard, currentPlayer.position)
      if (!location) {
        console.error('Invalid current position')
        break
      }
      const currentInfluence = getLocationInfluence(location, currentPlayer.id)
      const maxSpace = location.maxInfluence - currentInfluence
      const maxAffordable = currentPlayer.gold
      const actualAmount = Math.min(amount, maxSpace, maxAffordable)

      if (actualAmount <= 0) {
        // Can't claim anything
        console.warn('Cannot claim: insufficient space or gold')
        break
      }

      if (actualAmount < amount) {
        // Log that we're claiming less than requested
        console.info(
          `Claiming ${actualAmount} instead of ${amount} due to constraints`
        )
      }

      newBoard[currentPlayer.position] = {
        ...location,
        influences: {
          ...location.influences,
          [currentPlayer.id]: currentInfluence + actualAmount,
        },
      }
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        gold: currentPlayer.gold - actualAmount,
        totalInfluence: currentPlayer.totalInfluence + actualAmount,
      }
      break
    }
    case ActionType.CHALLENGE: {
      if (action.target === undefined) break

      // Validate target index first
      if (action.target < 0 || action.target >= newPlayers.length) {
        console.error('Invalid challenge target index:', action.target)
        break
      }

      const targetPlayer = getPlayerSafe(newPlayers, action.target)
      if (!targetPlayer) {
        console.error('Target player not found')
        break
      }

      // Check if current player can challenge target (position check)
      if (!canChallenge(currentPlayer, targetPlayer)) {
        console.error('Cannot challenge: target not in valid position')
        break
      }

      const location = getLocationSafe(newBoard, targetPlayer.position)
      if (!location) break
      const targetInfluence = getLocationInfluence(location, targetPlayer.id)

      // Check if target has influence BEFORE deducting gold
      if (targetInfluence <= 0) {
        console.warn('Cannot challenge: target has no influence at location')
        break
      }

      // Check if current player has enough gold
      const challengeCost = getChallengeCost(currentPlayer)
      if (currentPlayer.gold < challengeCost) {
        console.warn('Cannot challenge: insufficient gold')
        break
      }

      // All validations passed, now execute the challenge
      newBoard[targetPlayer.position] = {
        ...location,
        influences: {
          ...location.influences,
          [targetPlayer.id]: targetInfluence - 1,
        },
      }

      newPlayers[action.target] = {
        ...targetPlayer,
        totalInfluence: targetPlayer.totalInfluence - 1,
      }

      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        gold: currentPlayer.gold - challengeCost,
      }

      break
    }
    case ActionType.REST: {
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        gold: currentPlayer.gold + 2,
      }
      break
    }
  }
  return { ...state, board: newBoard, players: newPlayers }
}

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const players = createPlayers(action.payload.playerCount)
      return {
        phase: GamePhase.PLAYER_TURN,
        currentPlayer: 0,
        players,
        board: createInitialBoard(),
        roundCount: 1,
        gameConfig: action.payload,
        actionHistory: [],
        completedActions: [],
        pendingAction: undefined,
        message: `Round 1 • ${players[0].character.name}'s turn`,
      }
    }
    case 'SELECT_ACTION': {
      if (state.phase !== GamePhase.PLAYER_TURN) {
        console.warn('Cannot select action: not in player turn phase')
        return state
      }
      const actionType = action.payload
      const currentPlayer = state.players[state.currentPlayer]
      if (actionType === ActionType.REST) {
        const newState = executeAction(state, { type: ActionType.REST })
        const newCompleted = [
          ...state.completedActions,
          { type: ActionType.REST },
        ]
        const victoryState = checkAndHandleVictory(
          state,
          newState,
          newCompleted
        )
        if (victoryState) return victoryState

        if (newCompleted.length >= 2) {
          const nextPlayer = (state.currentPlayer + 1) % state.players.length
          const isNewRound = nextPlayer === 0
          const nextRound = isNewRound ? state.roundCount + 1 : state.roundCount

          // Check victory at the start of a new round
          const nextState = {
            ...newState,
            currentPlayer: nextPlayer,
            roundCount: nextRound,
            completedActions: [],
            pendingAction: undefined,
            message: `Round ${nextRound} • ${newState.players[nextPlayer].character.name}'s turn`,
          }

          const winner = checkVictoryConditions(nextState)
          if (winner !== undefined) {
            return {
              ...nextState,
              phase: GamePhase.GAME_OVER,
              winner,
              message: `${nextState.players[winner].name} wins!`,
            }
          }

          return nextState
        }

        return {
          ...newState,
          completedActions: newCompleted,
          pendingAction: undefined,
          message: 'Select your final action',
        }
      }
      if (actionType === ActionType.CLAIM) {
        const location = state.board[currentPlayer.position]
        const currentInfluence = getLocationInfluence(
          location,
          currentPlayer.id
        )
        const maxClaim = Math.min(
          currentPlayer.gold,
          location.maxInfluence - currentInfluence
        )
        if (maxClaim > 0) {
          return {
            ...state,
            pendingAction: { type: ActionType.CLAIM, amount: 1 },
            message: 'Select claim amount and confirm',
          }
        }
      }
      if (actionType === ActionType.CHALLENGE) {
        const cost = getChallengeCost(currentPlayer)
        if (currentPlayer.gold < cost) {
          console.warn('Cannot select challenge: insufficient gold')
          return state
        }
        const hasValidTargets = state.players.some((p, i) => {
          if (i === state.currentPlayer) return false
          if (!canChallenge(currentPlayer, p)) return false
          const influence = getLocationInfluence(state.board[p.position], p.id)
          return influence > 0
        })
        if (!hasValidTargets) {
          console.warn('Cannot select challenge: no valid targets')
          return state
        }
      }
      return {
        ...state,
        pendingAction: { type: actionType },
        message:
          actionType === ActionType.MOVE
            ? 'Select a location to move to'
            : 'Select a player to challenge',
      }
    }
    case 'SET_ACTION_TARGET': {
      if (!state.pendingAction) return state

      // Validate challenge targets before setting
      if (
        state.pendingAction.type === ActionType.CHALLENGE &&
        action.payload.target !== undefined
      ) {
        const targetIndex = action.payload.target
        const currentPlayer = state.players[state.currentPlayer]

        if (targetIndex < 0 || targetIndex >= state.players.length) {
          console.error('Invalid target index')
          return state
        }

        const targetPlayer = state.players[targetIndex]
        if (!canChallenge(currentPlayer, targetPlayer)) {
          console.error('Cannot challenge this target')
          return state
        }

        const targetInfluence = getLocationInfluence(
          state.board[targetPlayer.position],
          targetPlayer.id
        )
        if (targetInfluence <= 0) {
          console.error('Target has no influence to challenge')
          return state
        }
      }
      return {
        ...state,
        pendingAction: {
          ...state.pendingAction,
          target: action.payload.target,
          amount:
            action.payload.amount !== undefined
              ? action.payload.amount
              : state.pendingAction.amount,
        },
      }
    }
    case 'CONFIRM_ACTION': {
      if (!state.pendingAction) return state
      const newState = executeAction(state, state.pendingAction)
      const newCompletedActions = [
        ...state.completedActions,
        state.pendingAction,
      ]
      const victoryState = checkAndHandleVictory(
        state,
        newState,
        newCompletedActions
      )
      if (victoryState) return victoryState

      if (newCompletedActions.length >= 2) {
        const nextPlayer = (state.currentPlayer + 1) % state.players.length
        const isNewRound = nextPlayer === 0
        const nextRound = isNewRound ? state.roundCount + 1 : state.roundCount

        // Check victory at the start of a new round
        const nextState = {
          ...newState,
          currentPlayer: nextPlayer,
          roundCount: nextRound,
          completedActions: [],
          pendingAction: undefined,
          message: `Round ${nextRound} • ${newState.players[nextPlayer].character.name}'s turn`,
        }

        const winner = checkVictoryConditions(nextState)
        if (winner !== undefined) {
          return {
            ...nextState,
            phase: GamePhase.GAME_OVER,
            winner,
            message: `${nextState.players[winner].name} wins!`,
          }
        }

        return nextState
      }
      return {
        ...newState,
        completedActions: newCompletedActions,
        pendingAction: undefined,
        message: 'Select your final action',
      }
    }
    case 'CANCEL_ACTION': {
      return {
        ...state,
        pendingAction: undefined,
        challengeTargets: undefined,
        message:
          state.completedActions.length === 0
            ? 'Select 2 actions'
            : 'Select your final action',
      }
    }
    case 'END_TURN': {
      const nextPlayer = (state.currentPlayer + 1) % state.players.length
      const isNewRound = nextPlayer === 0
      const nextRound = isNewRound ? state.roundCount + 1 : state.roundCount

      // Check victory at the start of a new round if we've completed 20 rounds
      const winner = checkVictoryConditions({
        ...state,
        currentPlayer: nextPlayer,
        roundCount: nextRound,
      })

      if (winner !== undefined) {
        return {
          ...state,
          phase: GamePhase.GAME_OVER,
          winner,
          message: `${state.players[winner].name} wins!`,
        }
      }

      return {
        ...state,
        currentPlayer: nextPlayer,
        roundCount: nextRound,
        completedActions: [],
        pendingAction: undefined,
        message: `Round ${nextRound} • ${state.players[nextPlayer].character.name}'s turn`,
      }
    }
    case 'SET_STATE': {
      return action.payload
    }
    case 'SET_MESSAGE': {
      return { ...state, message: action.payload }
    }
    case 'SHOW_CHALLENGE_TARGETS': {
      return {
        ...state,
        challengeTargets: action.payload,
        message: 'Select which player to challenge',
      }
    }
    case 'SELECT_CHALLENGE_TARGET': {
      if (!state.pendingAction) return state
      return {
        ...state,
        pendingAction: {
          ...state.pendingAction,
          target: action.payload,
        },
        challengeTargets: undefined,
      }
    }
    case 'RESET_GAME': {
      return {
        phase: GamePhase.SETUP,
        currentPlayer: 0,
        players: [],
        board: createInitialBoard(),
        roundCount: 1,
        gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
        actionHistory: [],
        completedActions: [],
        pendingAction: undefined,
        message: '',
      }
    }
    default:
      return state
  }
}

export default gameReducer
