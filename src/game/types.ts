export interface GameConfig {
  playerCount: number
  aiDifficulty: 'easy' | 'medium' | 'hard'
}

export interface Character {
  id: string
  name: string
  ability: string
  description: string
}

export interface Player {
  id: string
  name: string
  character: Character
  color: string
  position: number
  gold: number
  totalInfluence: number
  isAI: boolean
  actionsRemaining: number
}

export interface Location {
  id: number
  name: string
  influences: { [playerId: string]: number }
  maxInfluence: number
}

export interface PendingAction {
  type: ActionType
  target?: number
  amount?: number
}

export interface GameState {
  phase: GamePhase
  currentPlayer: number
  players: Player[]
  board: Location[]
  roundCount: number
  gameConfig: GameConfig
  actionHistory: Action[]
  /** Running log of executed actions */
  actionLog?: string[]
  winner?: number
  completedActions: PendingAction[]
  pendingAction?: PendingAction
  message: string
  challengeTargets?: Array<{ playerId: string; playerIndex: number }>
}

export const GamePhase = {
  SETUP: 'setup',
  PLAYER_TURN: 'player_turn',
  ACTION_SELECTION: 'action_selection',
  ACTION_RESOLUTION: 'action_resolution',
  GAME_OVER: 'game_over',
} as const
export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase]

export const ActionType = {
  MOVE: 'move',
  CLAIM: 'claim',
  CHALLENGE: 'challenge',
  REST: 'rest',
} as const
export type ActionType = (typeof ActionType)[keyof typeof ActionType]

export interface Action {
  type: ActionType
  playerId: string
  target?: number
  amount?: number
  cost: number
}

export type GameAction =
  | { type: 'START_GAME'; payload: GameConfig }
  | { type: 'SELECT_ACTION'; payload: ActionType }
  | { type: 'SET_ACTION_TARGET'; payload: { target?: number; amount?: number } }
  | { type: 'CONFIRM_ACTION' }
  | { type: 'CANCEL_ACTION' }
  | { type: 'EXECUTE_ACTIONS' }
  | { type: 'END_TURN' }
  | { type: 'SET_STATE'; payload: GameState }
  | { type: 'RESET_GAME' }
  | { type: 'SET_MESSAGE'; payload: string }
  | {
      type: 'SHOW_CHALLENGE_TARGETS'
      payload: Array<{ playerId: string; playerIndex: number }>
    }
  | { type: 'SELECT_CHALLENGE_TARGET'; payload: number }
