import { Page } from '@playwright/test'
import type { GameState, Player, Location, GamePhase } from '../../src/game/types'

// Helper to create a default game state
export function createDefaultGameState(overrides: Partial<GameState> = {}): GameState {
  const player1: Player = {
    id: 'player-0',
    name: 'You',
    character: {
      id: 'seth',
      name: 'Seth Bullock',
      ability: 'Challenge cost -1',
      description: 'Challenge actions cost 1 less gold (minimum 1)'
    },
    color: '#FF6B6B',
    position: 0,
    gold: 3,
    totalInfluence: 0,
    isAI: false,
    actionsRemaining: 2
  }

  const player2: Player = {
    id: 'player-1', 
    name: 'AI Player 1',
    character: {
      id: 'al',
      name: 'Al Swearengen',
      ability: 'Saloon income',
      description: 'Gain 1 gold when another player enters the Gem Saloon'
    },
    color: '#4ECDC4',
    position: 1,
    gold: 3,
    totalInfluence: 0,
    isAI: true,
    actionsRemaining: 2
  }

  const board: Location[] = [
    { id: 0, name: 'Gem Saloon', influences: {}, maxInfluence: 3 },
    { id: 1, name: 'Hardware Store', influences: {}, maxInfluence: 3 },
    { id: 2, name: 'Bella Union', influences: {}, maxInfluence: 3 },
    { id: 3, name: 'Nuttal & Mann\'s', influences: {}, maxInfluence: 3 },
    { id: 4, name: 'The Freight Office', influences: {}, maxInfluence: 4 },
    { id: 5, name: 'Deadwood Stage', influences: {}, maxInfluence: 2 }
  ]

  const defaultState: GameState = {
    phase: 'player_turn' as GamePhase,
    currentPlayer: 0,
    players: [player1, player2],
    board,
    roundCount: 1,
    gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
    actionHistory: [],
    actionLog: [],
    completedActions: [],
    pendingAction: undefined,
    message: 'Round 1 • Your turn',
    ...overrides
  }

  return defaultState
}

// Helper to set game state in the browser
export async function setGameState(page: Page, state: GameState) {
  await page.evaluate((gameState) => {
    const dispatch = (window as any).dispatchGameAction
    if (dispatch) {
      dispatch({ type: 'SET_STATE', payload: gameState })
    }
  }, state)
  
  // Wait for state to be applied and UI to update
  await page.waitForTimeout(200)
}

// Helper to start game and immediately set state
export async function startGameWithState(page: Page, state: GameState) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await page.waitForTimeout(200) // Wait for game to initialize
  await setGameState(page, state)
}

// Preset states for common test scenarios
export const TestStates = {
  // Player has influence at current location, ready to claim more
  readyToClaim: (): GameState => {
    const state = createDefaultGameState()
    state.board[0].influences['player-0'] = 1
    return state
  },

  // Player can challenge opponent who has influence
  readyToChallenge: (): GameState => {
    const state = createDefaultGameState()
    // Both players at same location (Gem Saloon)
    state.players[1].position = 0
    state.board[0].influences['player-1'] = 2
    state.players[1].totalInfluence = 2
    state.players[0].gold = 3
    return state
  },

  // Player needs to select challenge target
  selectingChallengeTarget: (): GameState => {
    const state = createDefaultGameState()
    state.board[0].influences['player-1'] = 2
    state.players[0].gold = 3
    state.pendingAction = { type: 'challenge' }
    state.message = 'Select a player to challenge'
    return state
  },

  // Near victory conditions
  nearInfluenceVictory: (): GameState => {
    const state = createDefaultGameState()
    state.players[0].totalInfluence = 11
    state.board[0].influences['player-0'] = 2
    return state
  },

  // Location control victory setup
  nearLocationVictory: (): GameState => {
    const state = createDefaultGameState()
    state.board[0].influences['player-0'] = 3 // Max at Gem Saloon
    state.board[1].influences['player-0'] = 3 // Max at Hardware Store
    state.board[2].influences['player-0'] = 2 // Almost max at Bella Union
    state.players[0].position = 2
    state.players[0].totalInfluence = 8
    return state
  },

  // Mid-game state
  midGame: (): GameState => {
    const state = createDefaultGameState()
    state.roundCount = 10
    state.players[0].gold = 5
    state.players[0].totalInfluence = 6
    state.players[1].gold = 4
    state.players[1].totalInfluence = 5
    state.board[0].influences = { 'player-0': 2, 'player-1': 1 }
    state.board[1].influences = { 'player-1': 2 }
    state.board[3].influences = { 'player-0': 3 }
    state.board[4].influences = { 'player-0': 1, 'player-1': 2 }
    return state
  },

  // Insufficient resources
  noGold: (): GameState => {
    const state = createDefaultGameState()
    state.players[0].gold = 0
    return state
  },

  // One action completed
  oneActionCompleted: (): GameState => {
    const state = createDefaultGameState()
    state.completedActions = [{ type: 'rest' }]
    state.message = 'Select your final action'
    state.players[0].gold = 4 // Got gold from rest
    return state
  },

  // Character-specific states
  cyTolliverAdjacent: (): GameState => {
    const state = createDefaultGameState()
    state.players[0].character = {
      id: 'cy',
      name: 'Cy Tolliver',
      ability: 'Adjacent challenge',
      description: 'Can challenge players in adjacent locations'
    }
    state.players[0].position = 0 // Gem Saloon
    state.players[1].position = 1 // Hardware Store (adjacent)
    state.board[1].influences['player-1'] = 2
    return state
  }
}