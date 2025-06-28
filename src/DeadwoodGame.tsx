import React, { useReducer, useState, useEffect } from 'react'

interface GameConfig {
  playerCount: number
  aiDifficulty: 'easy' | 'medium' | 'hard'
}

interface Character {
  id: string
  name: string
  ability: string
  description: string
}

interface Player {
  id: string
  name: string
  character: Character
  position: number
  gold: number
  totalInfluence: number
  isAI: boolean
  actionsRemaining: number
}

interface Location {
  id: number
  name: string
  influences: { [playerId: string]: number }
  maxInfluence: number
}

interface PendingAction {
  type: ActionType
  target?: number
  amount?: number
}

interface GameState {
  phase: GamePhase
  currentPlayer: number
  players: Player[]
  board: Location[]
  turnCount: number
  gameConfig: GameConfig
  actionHistory: Action[]
  winner?: number
  completedActions: PendingAction[]
  pendingAction?: PendingAction
  message: string
}

enum GamePhase {
  SETUP = 'setup',
  PLAYER_TURN = 'player_turn',
  ACTION_SELECTION = 'action_selection',
  ACTION_RESOLUTION = 'action_resolution',
  GAME_OVER = 'game_over'
}

enum ActionType {
  MOVE = 'move',
  CLAIM = 'claim',
  CHALLENGE = 'challenge',
  REST = 'rest'
}

interface Action {
  type: ActionType
  playerId: string
  target?: number
  amount?: number
  cost: number
}

type GameAction =
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

const CHARACTERS: Character[] = [
  {
    id: 'al',
    name: 'Al Swearengen',
    ability: 'Gains +1 gold when any player enters Gem Saloon',
    description: 'The ruthless owner of the Gem Saloon'
  },
  {
    id: 'seth',
    name: 'Seth Bullock',
    ability: 'Challenge actions cost 1 less gold (minimum 1)',
    description: 'The principled sheriff of Deadwood'
  },
  {
    id: 'cy',
    name: 'Cy Tolliver',
    ability: 'Can challenge opponents from adjacent locations',
    description: 'The cunning owner of the Bella Union'
  },
  {
    id: 'jane',
    name: 'Calamity Jane',
    ability: 'All movement is free',
    description: 'The fearless frontierswoman'
  }
]

const LOCATIONS = [
  { id: 0, name: 'Gem Saloon', adjacent: [1, 3] },
  { id: 1, name: 'Hardware Store', adjacent: [0, 2, 4] },
  { id: 2, name: 'Bella Union', adjacent: [1, 5] },
  { id: 3, name: 'Sheriff Office', adjacent: [0, 4] },
  { id: 4, name: 'Freight Office', adjacent: [1, 3, 5] },
  { id: 5, name: "Wu's Pig Alley", adjacent: [2, 4] }
]

const createInitialBoard = (): Location[] => {
  return LOCATIONS.map((loc) => ({
    id: loc.id,
    name: loc.name,
    influences: {},
    maxInfluence: 3
  }))
}

const createPlayers = (playerCount: number): Player[] => {
  const shuffledCharacters = [...CHARACTERS].sort(() => Math.random() - 0.5)
  const players: Player[] = []
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: i === 0 ? 'You' : `AI Player ${i}`,
      character: shuffledCharacters[i],
      position: Math.floor(Math.random() * 6),
      gold: 3,
      totalInfluence: 0,
      isAI: i !== 0,
      actionsRemaining: 2
    })
  }
  return players
}

const isAdjacent = (from: number, to: number): boolean => {
  return LOCATIONS[from].adjacent.includes(to)
}

const getMoveCost = (player: Player, from: number, to: number): number => {
  if (player.character.id === 'jane') return 0
  return isAdjacent(from, to) ? 0 : 1
}

const getChallengeCost = (player: Player): number => {
  return player.character.id === 'seth' ? 1 : 2
}

const canChallenge = (player: Player, target: Player): boolean => {
  if (player.character.id === 'cy') {
    return player.position === target.position || isAdjacent(player.position, target.position)
  }
  return player.position === target.position
}

const getLocationInfluence = (location: Location, playerId: string): number => {
  return location.influences[playerId] || 0
}

const checkVictoryConditions = (state: GameState): number | undefined => {
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
      } else if (player.totalInfluence === maxInfluence && player.gold > state.players[winner].gold) {
        winner = index
      }
    })
    return winner
  }
  return undefined
}

const executeAction = (state: GameState, action: PendingAction): GameState => {
  const currentPlayer = state.players[state.currentPlayer]
  const newBoard = [...state.board]
  const newPlayers = [...state.players]
  switch (action.type) {
    case ActionType.MOVE: {
      if (action.target === undefined) break
      const moveCost = getMoveCost(currentPlayer, currentPlayer.position, action.target)
      newPlayers[state.currentPlayer] = {
        ...currentPlayer,
        position: action.target,
        gold: currentPlayer.gold - moveCost
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
      const actualAmount = Math.min(amount, location.maxInfluence - currentInfluence)
      if (actualAmount > 0) {
        newBoard[currentPlayer.position] = {
          ...location,
          influences: {
            ...location.influences,
            [currentPlayer.id]: currentInfluence + actualAmount
          }
        }
        newPlayers[state.currentPlayer] = {
          ...currentPlayer,
          gold: currentPlayer.gold - actualAmount,
          totalInfluence: currentPlayer.totalInfluence + actualAmount
        }
      }
      break
    }
    case ActionType.CHALLENGE: {
      if (action.target === undefined) break
      const challengeCost = getChallengeCost(currentPlayer)
      const targetPlayer = newPlayers.find((p) => p.id === `player-${action.target}`)
      if (targetPlayer) {
        const location = newBoard[targetPlayer.position]
        const targetInfluence = getLocationInfluence(location, targetPlayer.id)
        if (targetInfluence > 0) {
          newBoard[targetPlayer.position] = {
            ...location,
            influences: { ...location.influences, [targetPlayer.id]: targetInfluence - 1 }
          }
          const targetIndex = newPlayers.findIndex((p) => p.id === targetPlayer.id)
          newPlayers[targetIndex] = { ...targetPlayer, totalInfluence: targetPlayer.totalInfluence - 1 }
          newPlayers[state.currentPlayer] = { ...currentPlayer, gold: currentPlayer.gold - challengeCost }
        }
      }
      break
    }
    case ActionType.REST: {
      newPlayers[state.currentPlayer] = { ...currentPlayer, gold: currentPlayer.gold + 2 }
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
        message: `Turn 1 • ${players[0].character.name}'s turn`
      }
    }
    case 'SELECT_ACTION': {
      const actionType = action.payload
      const currentPlayer = state.players[state.currentPlayer]
      if (actionType === ActionType.REST) {
        const newState = executeAction(state, { type: ActionType.REST })
        return {
          ...newState,
          completedActions: [...state.completedActions, { type: ActionType.REST }],
          message: state.completedActions.length === 0 ? 'Select your final action' : 'Turn complete!'
        }
      }
      if (actionType === ActionType.CLAIM) {
        const location = state.board[currentPlayer.position]
        const currentInfluence = getLocationInfluence(location, currentPlayer.id)
        const maxClaim = Math.min(currentPlayer.gold, location.maxInfluence - currentInfluence)
        if (maxClaim > 0) {
          return {
            ...state,
            pendingAction: { type: ActionType.CLAIM, amount: 1 },
            message: 'Select claim amount and confirm'
          }
        }
      }
      return {
        ...state,
        pendingAction: { type: actionType },
        message: actionType === ActionType.MOVE ? 'Select a location to move to' : 'Select a player to challenge'
      }
    }
    case 'SET_ACTION_TARGET': {
      if (!state.pendingAction) return state
      return {
        ...state,
        pendingAction: {
          ...state.pendingAction,
          target: action.payload.target,
          amount: action.payload.amount !== undefined ? action.payload.amount : state.pendingAction.amount
        }
      }
    }
    case 'CONFIRM_ACTION': {
      if (!state.pendingAction) return state
      const newState = executeAction(state, state.pendingAction)
      const newCompletedActions = [...state.completedActions, state.pendingAction]
      if (newCompletedActions.length >= 2) {
        const winner = checkVictoryConditions(newState)
        if (winner !== undefined) {
          return {
            ...newState,
            phase: GamePhase.GAME_OVER,
            winner,
            completedActions: newCompletedActions,
            pendingAction: undefined,
            message: `${newState.players[winner].name} wins!`
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
          message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${newState.players[nextPlayer].character.name}'s turn`
        }
      }
      return {
        ...newState,
        completedActions: newCompletedActions,
        pendingAction: undefined,
        message: 'Select your final action'
      }
    }
    case 'CANCEL_ACTION': {
      return { ...state, pendingAction: undefined, message: state.completedActions.length === 0 ? 'Select 2 actions' : 'Select your final action' }
    }
    case 'END_TURN': {
      const winner = checkVictoryConditions(state)
      if (winner !== undefined) {
        return { ...state, phase: GamePhase.GAME_OVER, winner, message: `${state.players[winner].name} wins!` }
      }
      const nextPlayer = (state.currentPlayer + 1) % state.players.length
      const isNewRound = nextPlayer === 0
      return {
        ...state,
        currentPlayer: nextPlayer,
        turnCount: isNewRound ? state.turnCount + 1 : state.turnCount,
        completedActions: [],
        pendingAction: undefined,
        message: `Turn ${isNewRound ? state.turnCount + 1 : state.turnCount} • ${state.players[nextPlayer].character.name}'s turn`
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
        message: ''
      }
    }
    default:
      return state
  }
}

const generateAIActions = (state: GameState): PendingAction[] => {
  const currentPlayer = state.players[state.currentPlayer]
  const actions: PendingAction[] = []
  const location = state.board[currentPlayer.position]
  const currentInfluence = getLocationInfluence(location, currentPlayer.id)
  const maxClaim = Math.min(currentPlayer.gold, location.maxInfluence - currentInfluence)
  if (maxClaim > 0) {
    actions.push({ type: ActionType.CLAIM, amount: Math.min(2, maxClaim) })
  }
  if (currentPlayer.gold >= getChallengeCost(currentPlayer)) {
    const validTargets = state.players.filter((p, i) => i !== state.currentPlayer && canChallenge(currentPlayer, p) && state.board[p.position].influences[p.id] > 0)
    if (validTargets.length > 0) {
      actions.push({ type: ActionType.CHALLENGE, target: state.players.indexOf(validTargets[0]) })
    }
  }
  while (actions.length < 2) {
    if (currentPlayer.gold < 2) {
      actions.push({ type: ActionType.REST })
    } else {
      const adjacentLocs = LOCATIONS[currentPlayer.position].adjacent
      const targetLoc = adjacentLocs[Math.floor(Math.random() * adjacentLocs.length)]
      actions.push({ type: ActionType.MOVE, target: targetLoc })
    }
  }
  return actions.slice(0, 2)
}

const GameSetup: React.FC<{ onStartGame: (config: GameConfig) => void }> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2)
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #8B4513, #A0522D)' }}>
      <div style={{ background: '#F5DEB3', padding: '2rem', borderRadius: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: '#654321', fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'Georgia, serif' }}>Deadwood Showdown</h1>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#654321', fontWeight: 'bold' }}>Number of Players:</label>
          <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '0.5rem', border: '2px solid #8B4513', background: '#FFF8DC' }}>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#654321', fontWeight: 'bold' }}>AI Difficulty:</label>
          <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '0.5rem', border: '2px solid #8B4513', background: '#FFF8DC' }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button onClick={() => onStartGame({ playerCount, aiDifficulty })} style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'white', background: '#8B4513', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.background = '#A0522D')} onMouseOut={(e) => (e.currentTarget.style.background = '#8B4513')}>Start Game</button>
      </div>
    </div>
  )
}

interface LocationCardProps {
  location: Location
  players: Player[]
  onClick: () => void
  isValidTarget: boolean
  currentPlayerId: string
  showMoveCost?: number
  isCurrentLocation?: boolean
  highlightedPlayers?: string[]
}

const LocationCard: React.FC<LocationCardProps> = ({ location, players, onClick, isValidTarget, currentPlayerId, showMoveCost, isCurrentLocation, highlightedPlayers = [] }) => {
  const influences = Object.entries(location.influences).filter(([, influence]) => influence > 0).sort((a, b) => b[1] - a[1])
  return (
    <div onClick={isValidTarget ? onClick : undefined} style={{ border: `3px solid ${isCurrentLocation ? '#FFD700' : isValidTarget ? '#32CD32' : '#8B4513'}`, borderRadius: '8px', padding: '0.75rem', background: isCurrentLocation ? 'linear-gradient(135deg, #FFE4B5, #FFDAB9)' : isValidTarget ? 'linear-gradient(135deg, #90EE90, #98FB98)' : 'linear-gradient(135deg, #DEB887, #F4A460)', cursor: isValidTarget ? 'pointer' : 'default', transition: 'all 0.2s ease', position: 'relative', minHeight: '120px' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#654321', fontWeight: 'bold' }}>{location.name}</h3>
      {isValidTarget && showMoveCost !== undefined && showMoveCost > 0 && <div style={{ position: 'absolute', top: '5px', right: '5px', background: '#FFD700', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: '#654321' }}>{showMoveCost}g</div>}
      {influences.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {influences.map(([playerId, influence]) => {
            const player = players.find((p) => p.id === playerId)
            if (!player) return null
            return (
              <div key={playerId} style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: playerId === currentPlayerId ? '#006400' : '#8B4513', fontWeight: playerId === currentPlayerId ? 'bold' : 'normal' }}>{'★'.repeat(influence)}</div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: 'auto' }}>
        {players.map((player) => (
          <div key={player.id} style={{ padding: '2px 6px', background: highlightedPlayers.includes(player.id) ? '#DC143C' : player.id === currentPlayerId ? '#FFD700' : '#8B4513', color: highlightedPlayers.includes(player.id) || player.id === currentPlayerId ? '#FFF' : 'white', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 'bold', border: highlightedPlayers.includes(player.id) ? '2px solid #8B0000' : 'none' }}>{player.character.name.split(' ')[0]}</div>
        ))}
      </div>
    </div>
  )
}

interface ActionButtonProps {
  action: ActionType
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
  cost?: number
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, isSelected, isDisabled, onClick, cost }) => {
  const actionInfo = {
    [ActionType.MOVE]: { label: 'Move', icon: '→' },
    [ActionType.CLAIM]: { label: 'Claim', icon: '★' },
    [ActionType.CHALLENGE]: { label: 'Challenge', icon: '⚔' },
    [ActionType.REST]: { label: 'Rest', icon: '+2g' }
  } as const
  const info = actionInfo[action]
  return (
    <button onClick={onClick} disabled={isDisabled} style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '6px', background: isSelected ? '#32CD32' : isDisabled ? '#D3D3D3' : '#8B4513', color: isDisabled ? '#999' : 'white', fontWeight: 'bold', cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', opacity: isDisabled ? 0.6 : 1 }}>
      <div style={{ fontSize: '1.2rem' }}>{info.icon}</div>
      <div>{info.label}</div>
      {cost !== undefined && cost > 0 && <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>({cost}g)</div>}
    </button>
  )
}

const GameOver: React.FC<{ gameState: GameState; onNewGame: () => void }> = ({ gameState, onNewGame }) => {
  const winner = gameState.players[gameState.winner!]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #8B4513, #A0522D)' }}>
      <div style={{ background: '#F5DEB3', padding: '2rem', borderRadius: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ color: '#654321', marginBottom: '1rem' }}>Game Over!</h1>
        <h2 style={{ color: '#8B4513', marginBottom: '1.5rem' }}>{winner.name} ({winner.character.name}) Wins!</h2>
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <h3 style={{ color: '#654321', marginBottom: '0.5rem' }}>Final Scores:</h3>
          {gameState.players.map((player, index) => (
            <div key={player.id} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              {player.name}: {player.totalInfluence} influence, {player.gold} gold
              {index === gameState.winner && ' 🏆'}
            </div>
          ))}
        </div>
        <button onClick={onNewGame} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', background: '#8B4513', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>New Game</button>
      </div>
    </div>
  )
}

const DeadwoodGame: React.FC = () => {
  const initialState: GameState = {
    phase: GamePhase.SETUP,
    currentPlayer: 0,
    players: [],
    board: createInitialBoard(),
    turnCount: 0,
    gameConfig: { playerCount: 2, aiDifficulty: 'medium' },
    actionHistory: [],
    completedActions: [],
    pendingAction: undefined,
    message: ''
  }
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  useEffect(() => {
    if (gameState.phase === GamePhase.PLAYER_TURN && gameState.players[gameState.currentPlayer]?.isAI && !gameState.pendingAction && gameState.completedActions.length === 0) {
      const timer = setTimeout(() => {
        const aiActions = generateAIActions(gameState)
        let delay = 0
        aiActions.forEach((action) => {
          setTimeout(() => {
            dispatch({ type: 'SELECT_ACTION', payload: action.type })
            if (action.target !== undefined || action.amount !== undefined) {
              setTimeout(() => {
                dispatch({ type: 'SET_ACTION_TARGET', payload: { target: action.target, amount: action.amount } })
                setTimeout(() => dispatch({ type: 'CONFIRM_ACTION' }), 500)
              }, 500)
            } else if (action.type !== ActionType.REST) {
              setTimeout(() => dispatch({ type: 'CONFIRM_ACTION' }), 500)
            }
          }, delay)
          delay += 2000
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  const handleActionSelect = (action: ActionType) => {
    if (gameState.completedActions.length < 2 && !gameState.pendingAction) {
      dispatch({ type: 'SELECT_ACTION', payload: action })
    }
  }

  const handleLocationClick = (locationId: number) => {
    if (!gameState.pendingAction) return
    if (gameState.pendingAction.type === ActionType.MOVE) {
      dispatch({ type: 'SET_ACTION_TARGET', payload: { target: locationId } })
    } else if (gameState.pendingAction.type === ActionType.CHALLENGE) {
      const playersAtLocation = gameState.players.filter((p) => p.position === locationId)
      const currentPlayer = gameState.players[gameState.currentPlayer]
      const validTargets = playersAtLocation.filter((p) => p.id !== currentPlayer.id && canChallenge(currentPlayer, p) && getLocationInfluence(gameState.board[p.position], p.id) > 0)
      if (validTargets.length > 0) {
        const targetIndex = gameState.players.indexOf(validTargets[0])
        dispatch({ type: 'SET_ACTION_TARGET', payload: { target: targetIndex } })
      }
    }
  }

  const handleClaimAmountChange = (amount: number) => {
    if (gameState.pendingAction?.type === ActionType.CLAIM) {
      dispatch({ type: 'SET_ACTION_TARGET', payload: { amount } })
    }
  }

  const getValidChallengeTargets = (): string[] => {
    if (gameState.pendingAction?.type !== ActionType.CHALLENGE) return []
    const currentPlayer = gameState.players[gameState.currentPlayer]
    return gameState.players.filter((p) => p.id !== currentPlayer.id && canChallenge(currentPlayer, p) && getLocationInfluence(gameState.board[p.position], p.id) > 0).map((p) => p.id)
  }

  const isActionAvailable = (action: ActionType): boolean => {
    const currentPlayer = gameState.players[gameState.currentPlayer]
    if (!currentPlayer) return false
    switch (action) {
      case ActionType.MOVE:
        return true
      case ActionType.CLAIM: {
        const location = gameState.board[currentPlayer.position]
        const currentInfluence = getLocationInfluence(location, currentPlayer.id)
        return currentPlayer.gold >= 1 && currentInfluence < location.maxInfluence
      }
      case ActionType.CHALLENGE: {
        const cost = getChallengeCost(currentPlayer)
        if (currentPlayer.gold < cost) return false
        const hasValidTargets = gameState.players.some((p, i) => i !== gameState.currentPlayer && canChallenge(currentPlayer, p) && gameState.board[p.position].influences[p.id] > 0)
        return hasValidTargets
      }
      case ActionType.REST:
        return true
      default:
        return false
    }
  }

  if (gameState.phase === GamePhase.SETUP) {
    return <GameSetup onStartGame={(config) => dispatch({ type: 'START_GAME', payload: config })} />
  }
  if (gameState.phase === GamePhase.GAME_OVER) {
    return <GameOver gameState={gameState} onNewGame={() => dispatch({ type: 'RESET_GAME' })} />
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isHumanTurn = currentPlayer && !currentPlayer.isAI
  const validChallengeTargets = getValidChallengeTargets()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #8B4513, #A0522D)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#654321', color: 'white', padding: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>{gameState.message}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem', paddingBottom: isHumanTurn ? '200px' : '1rem' }}>
        <div style={{ background: '#F5DEB3', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#654321' }}>{currentPlayer?.name} - {currentPlayer?.character.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#8B4513', fontStyle: 'italic' }}>{currentPlayer?.character.ability}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#654321' }}>
            <div>Gold: <strong>{currentPlayer?.gold}</strong></div>
            <div>Influence: <strong>{currentPlayer?.totalInfluence}</strong></div>
            <div>Actions: <strong>{2 - gameState.completedActions.length}</strong></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {gameState.board.map((location) => {
            const playersAtLocation = gameState.players.filter((p) => p.position === location.id)
            const isCurrentLocation = currentPlayer?.position === location.id
            let isValidTarget = false
            let moveCost: number | undefined
            if (gameState.pendingAction?.type === ActionType.MOVE && currentPlayer) {
              isValidTarget = location.id !== currentPlayer.position
              moveCost = getMoveCost(currentPlayer, currentPlayer.position, location.id)
              if (moveCost > currentPlayer.gold) isValidTarget = false
            } else if (gameState.pendingAction?.type === ActionType.CHALLENGE && currentPlayer) {
              const hasValidTargets = playersAtLocation.some((p) => validChallengeTargets.includes(p.id))
              isValidTarget = hasValidTargets
            }
            return (
              <LocationCard key={location.id} location={location} players={playersAtLocation} onClick={() => handleLocationClick(location.id)} isValidTarget={isValidTarget} currentPlayerId={currentPlayer?.id || ''} showMoveCost={moveCost} isCurrentLocation={isCurrentLocation} highlightedPlayers={gameState.pendingAction?.type === ActionType.CHALLENGE ? validChallengeTargets : []} />
            )
          })}
        </div>
        <div style={{ background: 'rgba(245, 222, 179, 0.7)', borderRadius: '8px', padding: '0.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#654321', fontSize: '1rem' }}>Other Players</h3>
          {gameState.players.filter((p) => p.id !== currentPlayer?.id).map((player) => (
            <div key={player.id} style={{ fontSize: '0.8rem', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{player.name} - {player.character.name}</div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                <span>Gold: {player.gold}</span>
                <span>Influence: {player.totalInfluence}</span>
                <span>Location: {LOCATIONS[player.position].name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isHumanTurn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#F5DEB3', borderTop: '3px solid #8B4513', padding: '1rem', boxShadow: '0 -2px 8px rgba(0,0,0,0.3)' }}>
          {gameState.pendingAction && (
            <div style={{ marginBottom: '1rem' }}>
              {gameState.pendingAction.type === ActionType.CLAIM && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <label style={{ flex: 1, fontSize: '0.9rem', color: '#654321' }}>Claim amount:</label>
                  <select value={gameState.pendingAction.amount || 1} onChange={(e) => handleClaimAmountChange(Number(e.target.value))} style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '2px solid #8B4513', background: '#FFF8DC' }}>
                    {[1, 2, 3].map((amt) => {
                      const location = gameState.board[currentPlayer.position]
                      const currentInf = getLocationInfluence(location, currentPlayer.id)
                      const maxClaim = Math.min(currentPlayer.gold, location.maxInfluence - currentInf)
                      if (amt > maxClaim) return null
                      return <option key={amt} value={amt}>{amt} Gold = {amt} Influence</option>
                    })}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => dispatch({ type: 'CANCEL_ACTION' })} style={{ flex: 1, padding: '0.75rem', background: '#DC143C', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => dispatch({ type: 'CONFIRM_ACTION' })} disabled={(gameState.pendingAction.type === ActionType.MOVE && gameState.pendingAction.target === undefined) || (gameState.pendingAction.type === ActionType.CHALLENGE && gameState.pendingAction.target === undefined)} style={{ flex: 2, padding: '0.75rem', background: gameState.pendingAction.target !== undefined || gameState.pendingAction.type === ActionType.CLAIM ? '#32CD32' : '#D3D3D3', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: gameState.pendingAction.target !== undefined || gameState.pendingAction.type === ActionType.CLAIM ? 'pointer' : 'not-allowed' }}>Confirm {gameState.pendingAction.type}</button>
              </div>
            </div>
          )}
          {!gameState.pendingAction && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ActionButton action={ActionType.MOVE} isSelected={gameState.completedActions.some((a) => a.type === ActionType.MOVE)} isDisabled={!isActionAvailable(ActionType.MOVE) || gameState.completedActions.length >= 2} onClick={() => handleActionSelect(ActionType.MOVE)} cost={currentPlayer?.character.id === 'jane' ? 0 : undefined} />
                <ActionButton action={ActionType.CLAIM} isSelected={gameState.completedActions.some((a) => a.type === ActionType.CLAIM)} isDisabled={!isActionAvailable(ActionType.CLAIM) || gameState.completedActions.length >= 2} onClick={() => handleActionSelect(ActionType.CLAIM)} cost={1} />
                <ActionButton action={ActionType.CHALLENGE} isSelected={gameState.completedActions.some((a) => a.type === ActionType.CHALLENGE)} isDisabled={!isActionAvailable(ActionType.CHALLENGE) || gameState.completedActions.length >= 2} onClick={() => handleActionSelect(ActionType.CHALLENGE)} cost={getChallengeCost(currentPlayer)} />
                <ActionButton action={ActionType.REST} isSelected={gameState.completedActions.some((a) => a.type === ActionType.REST)} isDisabled={gameState.completedActions.length >= 2} onClick={() => handleActionSelect(ActionType.REST)} />
              </div>
              <div style={{ fontSize: '0.8rem', textAlign: 'center', color: '#8B4513' }}>Selected: {gameState.completedActions.length}/2 actions</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default DeadwoodGame

