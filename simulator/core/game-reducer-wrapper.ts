import type { GameState, GameAction } from '../../src/game/types'
import { GamePhase, ActionType } from '../../src/game/types'
import { createPlayers } from '../../src/game/players'
import { createInitialBoard } from '../../src/game/board'
import {
  getMoveCost,
  getChallengeCost,
  getLocationInfluence,
  canChallenge,
  getPlayerSafe,
  getLocationSafe,
  findPlayerIndexSafe,
} from '../../src/game/utils'

// Copy of the reducer without logging dependencies
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
  completedActions: any[]
): GameState | null => {
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

export const executeAction = (state: GameState, action: any): GameState => {
  const currentPlayer = getPlayerSafe(state.players, state.currentPlayer)
  if (!currentPlayer) {
    console.error('Invalid current player index')
    return state
  }
  const newBoard = [...state.board]
  const newPlayers = [...state.players]
  let logEntry: string | null = null
  let executed = false

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
      logEntry = `${currentPlayer.name} moved to ${targetLocation.name}`
      executed = true
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
        console.warn('Cannot claim: insufficient space or gold')
        break
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
      logEntry = `${currentPlayer.name} claimed ${actualAmount} influence`
      executed = true
      break
    }
    case ActionType.CHALLENGE: {
      if (action.target === undefined) break

      if (action.target < 0 || action.target >= newPlayers.length) {
        console.error('Invalid challenge target index:', action.target)
        break
      }

      const targetPlayer = getPlayerSafe(newPlayers, action.target)
      if (!targetPlayer) {
        console.error('Target player not found')
        break
      }

      if (!canChallenge(currentPlayer, targetPlayer)) {
        console.error('Cannot challenge: target not in valid position')
        break
      }

      const location = getLocationSafe(newBoard, targetPlayer.position)
      if (!location) break
      const targetInfluence = getLocationInfluence(location, targetPlayer.id)

      if (targetInfluence <= 0) {
        console.warn('Cannot challenge: target has no influence at location')
        break
      }

      const challengeCost = getChallengeCost(currentPlayer)
      if (currentPlayer.gold < challengeCost) {
        console.warn('Cannot challenge: insufficient gold')
        break
      }

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

      logEntry = `${currentPlayer.name} challenged ${targetPlayer.name}`
      executed = true
      break
    }
    case ActionType.REST: {
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        gold: currentPlayer.gold + 2,
      }
      logEntry = `${currentPlayer.name} rested and gained 2g`
      executed = true
      break
    }
  }

  if (!executed) return state

  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    actionLog: [...(state.actionLog || []), ...(logEntry ? [logEntry] : [])],
  }
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
        actionLog: [],
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

          const nextState = {
            ...newState,
            currentPlayer: nextPlayer,
            roundCount: nextRound,
            completedActions: [],
            pendingAction: undefined,
            message: newState.players[nextPlayer].isAI
              ? `Round ${nextRound} • ${newState.players[nextPlayer].character.name}'s turn`
              : `Round ${nextRound} • Your turn`,
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

      return {
        ...state,
        pendingAction: { type: actionType },
        message:
          actionType === ActionType.MOVE
            ? 'Select a location to move to'
            : actionType === ActionType.CLAIM
              ? 'Select claim amount and confirm'
              : 'Select a player to challenge',
      }
    }
    case 'SET_ACTION_TARGET': {
      if (!state.pendingAction) return state
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
        message: state.players[nextPlayer].isAI
          ? `Round ${nextRound} • ${state.players[nextPlayer].character.name}'s turn`
          : `Round ${nextRound} • Your turn`,
      }
    }
    case 'SET_STATE': {
      return action.payload
    }
    case 'SET_MESSAGE': {
      return { ...state, message: action.payload }
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
        actionLog: [],
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
