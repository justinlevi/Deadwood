import type { GameState, PendingAction, GameAction } from './types'
import { GamePhase, ActionType } from './types'
import { createPlayers } from './players'
import { createInitialBoard } from './board'
import { getMoveCost, getChallengeCost, getLocationInfluence } from './utils'

export const checkVictoryConditions = (
  state: GameState
): number | undefined => {
  for (const player of state.players) {
    let maxInfluenceCount = 0
    for (const location of state.board) {
      if (getLocationInfluence(location, player.id) === 3) maxInfluenceCount++
    }
    if (maxInfluenceCount >= 3) return state.players.indexOf(player)
    if (player.totalInfluence >= 12) return state.players.indexOf(player)
  }
  if (state.turnCount >= 20) {
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

export const executeAction = (
  state: GameState,
  action: PendingAction
): GameState => {
  const currentPlayer = state.players[state.currentPlayer]
  const newBoard = [...state.board]
  const newPlayers = [...state.players]
  switch (action.type) {
    case ActionType.MOVE: {
      if (action.target === undefined) break
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
        if (alPlayer) {
          const alIndex = newPlayers.indexOf(alPlayer)
          newPlayers[alIndex] = { ...alPlayer, gold: alPlayer.gold + 1 }
        }
      }
      break
    }
    case ActionType.CLAIM: {
      const amount = action.amount || 1
      const location = newBoard[currentPlayer.position]
      const currentInfluence = getLocationInfluence(location, currentPlayer.id)
      const actualAmount = Math.min(
        amount,
        location.maxInfluence - currentInfluence
      )
      if (actualAmount > 0) {
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
      }
      break
    }
    case ActionType.CHALLENGE: {
      if (action.target === undefined) break
      const challengeCost = getChallengeCost(currentPlayer)
      const targetPlayer = newPlayers.find(
        (p) => p.id === `player-${action.target}`
      )
      if (targetPlayer) {
        const location = newBoard[targetPlayer.position]
        const targetInfluence = getLocationInfluence(location, targetPlayer.id)
        if (targetInfluence > 0) {
          newBoard[targetPlayer.position] = {
            ...location,
            influences: {
              ...location.influences,
              [targetPlayer.id]: targetInfluence - 1,
            },
          }
          const targetIndex = newPlayers.findIndex(
            (p) => p.id === targetPlayer.id
          )
          newPlayers[targetIndex] = {
            ...targetPlayer,
            totalInfluence: targetPlayer.totalInfluence - 1,
          }
          newPlayers[state.currentPlayer] = {
            ...currentPlayer,
            gold: currentPlayer.gold - challengeCost,
          }
        }
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
        turnCount: 1,
        gameConfig: action.payload,
        actionHistory: [],
        completedActions: [],
        pendingAction: undefined,
        message: `Turn 1 • ${players[0].character.name}'s turn`,
      }
    }
    case 'SELECT_ACTION': {
      const actionType = action.payload
      const currentPlayer = state.players[state.currentPlayer]
      if (actionType === ActionType.REST) {
        const newState = executeAction(state, { type: ActionType.REST })
        return {
          ...newState,
          completedActions: [
            ...state.completedActions,
            { type: ActionType.REST },
          ],
          message:
            state.completedActions.length === 0
              ? 'Select your final action'
              : 'Turn complete!',
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
      if (newCompletedActions.length >= 2) {
        const winner = checkVictoryConditions(newState)
        if (winner !== undefined) {
          return {
            ...newState,
            phase: GamePhase.GAME_OVER,
            winner,
            completedActions: newCompletedActions,
            pendingAction: undefined,
            message: `${newState.players[winner].name} wins!`,
          }
        }
        const nextPlayer = (state.currentPlayer + 1) % state.players.length
        const isNewRound = nextPlayer === 0
        return {
          ...newState,
          currentPlayer: nextPlayer,
          turnCount: isNewRound ? state.turnCount + 1 : state.turnCount,
          completedActions: [],
          pendingAction: undefined,
          message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${newState.players[nextPlayer].character.name}'s turn`,
        }
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
        message:
          state.completedActions.length === 0
            ? 'Select 2 actions'
            : 'Select your final action',
      }
    }
    case 'END_TURN': {
      const winner = checkVictoryConditions(state)
      if (winner !== undefined) {
        return {
          ...state,
          phase: GamePhase.GAME_OVER,
          winner,
          message: `${state.players[winner].name} wins!`,
        }
      }
      const nextPlayer = (state.currentPlayer + 1) % state.players.length
      const isNewRound = nextPlayer === 0
      return {
        ...state,
        currentPlayer: nextPlayer,
        turnCount: isNewRound ? state.turnCount + 1 : state.turnCount,
        completedActions: [],
        pendingAction: undefined,
        message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${state.players[nextPlayer].character.name}'s turn`,
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
        turnCount: 0,
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
