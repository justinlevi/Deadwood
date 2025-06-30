import React, { useReducer, useEffect, useRef } from 'react'
import {
  GamePhase,
  ActionType,
  type GameState,
  LOCATIONS,
  createInitialBoard,
  getMoveCost,
  getChallengeCost,
  canChallenge,
  getLocationInfluence,
} from './game'
import { getPlayerSafe, getLocationSafe } from './game/utils'
import gameReducer from './game/reducer'
import generateAIActions from './game/ai'
import GameSetup from './components/GameSetup'
import LocationCard from './components/LocationCard'
import ActionButton from './components/ActionButton'
import GameOver from './components/GameOver'
import ConfirmModal from './components/ConfirmModal'

const DeadwoodGame: React.FC = () => {
  const initialState: GameState = {
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
    selectedLocation: undefined,
  }
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  const currentPlayer = gameState.phase !== GamePhase.SETUP 
    ? getPlayerSafe(gameState.players, gameState.currentPlayer)
    : null

  if (!currentPlayer && gameState.phase === GamePhase.PLAYER_TURN) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Invalid game state - current player not found
        <button
          onClick={() => dispatch({ type: 'RESET_GAME' })}
          className="mt-4 px-4 py-2 bg-deadwood-red text-white rounded hover:bg-red-700 transition-colors"
        >
          Reset Game
        </button>
      </div>
    )
  }

  // expose helpers for Playwright tests
  useEffect(() => {
    ;(window as any).dispatchGameAction = dispatch
    ;(window as any).getGameState = () => gameState
    ;(window as any).GamePhase = GamePhase
    ;(window as any).ActionType = ActionType
  }, [dispatch, gameState])

  const aiTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const aiFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearAll = () => {
      aiTimersRef.current.forEach(clearTimeout)
      aiTimersRef.current = []
      if (aiFailsafeRef.current) {
        clearTimeout(aiFailsafeRef.current)
        aiFailsafeRef.current = null
      }
    }

    if (
      gameState.phase !== GamePhase.PLAYER_TURN ||
      !gameState.players[gameState.currentPlayer]?.isAI
    ) {
      clearAll()
      return
    }

    if (aiTimersRef.current.length) return

    const main = setTimeout(() => {
      const aiActions = generateAIActions(gameState)
      aiActions.forEach((a, i) => {
        const t1 = setTimeout(
          () => dispatch({ type: 'SELECT_ACTION', payload: a.type }),
          i * 2000
        )
        const t2 = setTimeout(
          () =>
            dispatch({
              type: 'SET_ACTION_TARGET',
              payload: { target: a.target, amount: a.amount },
            }),
          i * 2000 + 500
        )
        const t3 = setTimeout(
          () => dispatch({ type: 'CONFIRM_ACTION' }),
          i * 2000 + 1000
        )
        aiTimersRef.current.push(t1, t2, t3)
      })
    }, 1500)

    aiTimersRef.current.push(main)
    if (!aiFailsafeRef.current) {
      aiFailsafeRef.current = setTimeout(
        () => dispatch({ type: 'END_TURN' }),
        10000
      )
    }

    return clearAll
  }, [gameState.phase, gameState.currentPlayer])

  useEffect(() => {
    if (
      gameState.phase !== GamePhase.PLAYER_TURN ||
      !gameState.players[gameState.currentPlayer]?.isAI
    ) {
      if (aiFailsafeRef.current) {
        clearTimeout(aiFailsafeRef.current)
        aiFailsafeRef.current = null
      }
      return
    }

    if (
      gameState.completedActions.length >= 2 &&
      !gameState.pendingAction &&
      aiFailsafeRef.current
    ) {
      clearTimeout(aiFailsafeRef.current)
      aiFailsafeRef.current = null
    }
  }, [
    gameState.phase,
    gameState.currentPlayer,
    gameState.completedActions.length,
    gameState.pendingAction,
  ])

  const handleActionSelect = (action: ActionType) => {
    if (gameState.completedActions.length >= 2) {
      console.warn('Cannot select action: already completed 2 actions')
      return
    }
    if (gameState.pendingAction) {
      console.warn('Cannot select action: pending action in progress')
      return
    }
    if (!isActionAvailable(action)) {
      console.warn(`Cannot select action: ${action} not available`)
      return
    }

    // For move and challenge actions, use the selected location
    if (action === ActionType.MOVE && gameState.selectedLocation !== undefined) {
      dispatch({ type: 'SELECT_ACTION', payload: action })
      dispatch({ type: 'SET_ACTION_TARGET', payload: { target: gameState.selectedLocation } })
    } else if (action === ActionType.CHALLENGE && gameState.selectedLocation !== undefined) {
      dispatch({ type: 'SELECT_ACTION', payload: action })
      
      const location = getLocationSafe(gameState.board, gameState.selectedLocation)
      if (!location) return
      
      const playersAtLocation = gameState.players.filter(
        (p) => p.position === gameState.selectedLocation
      )
      const cp = currentPlayer!
      const validTargets = playersAtLocation.filter(
        (p) =>
          p.id !== cp.id &&
          canChallenge(cp, p) &&
          getLocationInfluence(gameState.board[p.position], p.id) > 0
      )

      if (validTargets.length > 0) {
        dispatch({
          type: 'SHOW_CHALLENGE_TARGETS',
          payload: validTargets.map((p) => ({
            playerId: p.id,
            playerIndex: gameState.players.indexOf(p),
          })),
        })
      }
    } else {
      dispatch({ type: 'SELECT_ACTION', payload: action })
    }
  }

  const handleLocationClick = (locationId: number) => {
    // In the new flow, clicking a location just selects it
    dispatch({ type: 'SELECT_LOCATION', payload: locationId })
  }

  const handleClaimAmountChange = (amount: number) => {
    if (gameState.pendingAction?.type === ActionType.CLAIM) {
      dispatch({ type: 'SET_ACTION_TARGET', payload: { amount } })
    }
  }

  const getClaimValidation = () => {
    if (gameState.pendingAction?.type !== ActionType.CLAIM) return null

    const amount = gameState.pendingAction.amount || 1
    const current = currentPlayer!
    const location = getLocationSafe(gameState.board, current.position)
    if (!location) return { valid: false, message: 'Invalid location' }
    const currentInf = getLocationInfluence(location, current.id)
    const maxSpace = location.maxInfluence - currentInf
    const maxAffordable = current.gold

    if (amount > maxAffordable) {
      return { valid: false, message: 'Not enough gold' }
    }
    if (amount > maxSpace) {
      return { valid: false, message: 'Not enough space at location' }
    }
    if (maxSpace === 0) {
      return { valid: false, message: 'Location is full' }
    }

    return { valid: true, message: null }
  }

  const getValidChallengeTargets = (): string[] => {
    if (gameState.pendingAction?.type !== ActionType.CHALLENGE) return []
    const current = currentPlayer!
    return gameState.players
      .filter((p, index) => {
        if (index === gameState.currentPlayer) return false
        if (!canChallenge(current, p)) return false
        const location = getLocationSafe(gameState.board, p.position)
        if (!location) return false
        const inf = getLocationInfluence(location, p.id)
        return p.id !== current.id && inf > 0
      })
      .map((p) => p.id)
  }

  const isActionAvailable = (action: ActionType): boolean => {
    const current = currentPlayer
    if (!current) return false
    
    switch (action) {
      case ActionType.MOVE: {
        // Move is available if a location is selected and it's not the current location
        if (gameState.selectedLocation === undefined) return false
        if (gameState.selectedLocation === current.position) return false
        const moveCost = getMoveCost(current, current.position, gameState.selectedLocation)
        return current.gold >= moveCost
      }
      case ActionType.CLAIM: {
        // Claim is only available at current location
        const location = getLocationSafe(gameState.board, current.position)
        if (!location) return false
        const currentInfluence = getLocationInfluence(location, current.id)
        const hasSpace = currentInfluence < location.maxInfluence
        const hasGold = current.gold >= 1
        return hasSpace && hasGold
      }
      case ActionType.CHALLENGE: {
        // Challenge is available if a location is selected with valid targets
        if (gameState.selectedLocation === undefined) return false
        const cost = getChallengeCost(current)
        if (current.gold < cost) return false
        
        const playersAtLocation = gameState.players.filter(
          (p) => p.position === gameState.selectedLocation
        )
        const hasValidTargets = playersAtLocation.some((p) => {
          if (p.id === current.id) return false
          if (!canChallenge(current, p)) return false
          const location = getLocationSafe(gameState.board, p.position)
          if (!location) return false
          const inf = getLocationInfluence(location, p.id)
          return inf > 0
        })
        return hasValidTargets
      }
      case ActionType.REST:
        return true
      default:
        return false
    }
  }

  if (gameState.phase === GamePhase.SETUP) {
    return (
      <GameSetup
        onStartGame={(config) =>
          dispatch({ type: 'START_GAME', payload: config })
        }
      />
    )
  }
  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <GameOver
        gameState={gameState}
        onNewGame={() => dispatch({ type: 'RESET_GAME' })}
      />
    )
  }

  const isHumanTurn = currentPlayer && !currentPlayer.isAI
  const validChallengeTargets = getValidChallengeTargets()
  const canSelectActions =
    isHumanTurn &&
    gameState.completedActions.length < 2 &&
    !gameState.pendingAction

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-deadwood-brown to-deadwood-sienna flex flex-col overflow-hidden">
      {/* Game Header */}
      <div className="bg-deadwood-dark-brown text-white py-3 px-4 shadow-lg">
        <div className="text-center text-lg md:text-xl font-bold">
          {gameState.pendingAction?.type === ActionType.MOVE && gameState.pendingAction.target === undefined
            ? 'Select a location to move to'
            : gameState.pendingAction?.type === ActionType.CHALLENGE && gameState.pendingAction.target === undefined
            ? 'Select a player to challenge'
            : gameState.selectedLocation === undefined && !gameState.pendingAction && isHumanTurn
            ? 'Click a location to see available actions'
            : gameState.message}
        </div>
        <div className="text-center text-sm md:text-base opacity-80 mt-1">
          Round {gameState.roundCount} of 20 • Player{' '}
          {gameState.currentPlayer + 1} of {gameState.players.length}
        </div>
      </div>

      {/* Main Game Grid */}
      <div className="flex-1 overflow-auto" style={{ paddingBottom: isHumanTurn ? '250px' : '1rem' }}>
        <div className="p-4 lg:p-6 xl:p-8 max-w-[2400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr_350px] 2xl:grid-cols-[400px_1fr_400px] 3xl:grid-cols-[minmax(400px,500px)_1fr_minmax(400px,500px)] gap-4 lg:gap-6">
            
            {/* Current Player Info */}
            <div 
              className="bg-deadwood-tan rounded-lg p-4 shadow-lg border-4 relative overflow-hidden"
              style={{ borderColor: currentPlayer?.color || '#ffd700' }}
              data-testid="current-player"
            >
              {/* Player color overlay */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundColor: currentPlayer?.color }}
              ></div>
              <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg flex items-center gap-1 text-deadwood-dark-brown">
                    <span
                      data-testid="current-player-star"
                      style={{ color: currentPlayer?.color }}
                    >
                      ★
                    </span>
                    {currentPlayer?.name} - {currentPlayer?.character.name}
                  </div>
                  <div className="text-sm italic text-deadwood-brown">
                    {currentPlayer?.character.ability}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-deadwood-dark-brown">
                <div>Gold: <strong>{currentPlayer?.gold}</strong></div>
                <div>Influence: <strong>{currentPlayer?.totalInfluence}</strong></div>
                <div>Actions: <strong>{2 - gameState.completedActions.length}</strong></div>
              </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="lg:row-span-2">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                {gameState.board.map((location) => {
                  const playersAtLocation = gameState.players.filter(
                    (p) => p.position === location.id
                  )
                  const isCurrentLocation = currentPlayer?.position === location.id
                  // In the new flow, all locations are clickable
                  const isValidTarget = true
                  // Only show move cost when in move selection mode
                  const moveCost = currentPlayer && 
                    location.id !== currentPlayer.position &&
                    gameState.pendingAction?.type === ActionType.MOVE
                    ? getMoveCost(currentPlayer, currentPlayer.position, location.id)
                    : undefined
                  return (
                    <LocationCard
                      key={location.id}
                      location={location}
                      players={playersAtLocation}
                      allPlayers={gameState.players}
                      onClick={() => handleLocationClick(location.id)}
                      isValidTarget={isValidTarget}
                      currentPlayerId={currentPlayer?.id || ''}
                      showMoveCost={moveCost}
                      isCurrentLocation={isCurrentLocation}
                      highlightedPlayers={
                        gameState.pendingAction?.type === ActionType.CHALLENGE
                          ? validChallengeTargets
                          : []
                      }
                      isSelected={gameState.selectedLocation === location.id}
                      currentPlayerColor={currentPlayer?.color}
                    />
                  )
                })}
              </div>
            </div>

            {/* Other Players Section - Hidden on mobile, shown on large screens */}
            <div className="lg:block hidden">
              <div className="bg-deadwood-tan/70 lg:bg-deadwood-tan rounded-lg p-4 shadow-lg 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-8rem)] 2xl:overflow-y-auto">
                <h3 className="text-lg font-bold mb-3 text-deadwood-dark-brown">
                  Other Players
                </h3>
                {gameState.players
                  .filter((p) => p.id !== currentPlayer?.id)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="mb-3 p-3 bg-white/50 rounded border-2 transition-all hover:bg-white/70"
                      style={{ borderColor: player.color }}
                      data-testid={`other-player-${player.id}`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-1">
                        <span
                          data-testid="player-star"
                          style={{ color: player.color }}
                        >
                          ★
                        </span>
                        {player.name} - {player.character.name}
                      </div>
                      <div className="text-sm flex gap-3">
                        <span>Gold: {player.gold}</span>
                        <span>Influence: {player.totalInfluence}</span>
                        <span>Location: {LOCATIONS[player.position].name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action History - Shows on XL+ screens */}
            {gameState.actionLog && gameState.actionLog.length > 0 && (
              <div className="hidden xl:block lg:col-start-3">
                <div className="bg-deadwood-light-tan text-deadwood-dark-brown border border-deadwood-brown p-3 rounded-lg shadow-lg 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-8rem)] 2xl:overflow-y-auto">
                  <h3 className="font-bold mb-2">Action History</h3>
                  <div className="text-sm space-y-1">
                    {gameState.actionLog.map((entry, i) => (
                      <div key={i} className="pb-1 border-b border-deadwood-brown/20 last:border-0">
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Other Players - Shows below board on mobile */}
            <div className="lg:hidden">
              <div className="bg-deadwood-tan/70 rounded-lg p-4 shadow-lg">
                <h3 className="text-lg font-bold mb-3 text-deadwood-dark-brown">
                  Other Players
                </h3>
                {gameState.players
                  .filter((p) => p.id !== currentPlayer?.id)
                  .map((player) => (
                    <div
                      key={player.id}
                      className="mb-3 p-3 bg-white/50 rounded border-2"
                      style={{ borderColor: player.color }}
                      data-testid={`other-player-${player.id}`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-1">
                        <span 
                          data-testid="player-star"
                          style={{ color: player.color }}
                        >
                          ★
                        </span>
                        {player.name} - {player.character.name}
                      </div>
                      <div className="text-sm flex gap-3">
                        <span>Gold: {player.gold}</span>
                        <span>Influence: {player.totalInfluence}</span>
                        <span>Location: {LOCATIONS[player.position].name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Mobile Action History */}
            {gameState.actionLog && gameState.actionLog.length > 0 && (
              <div className="xl:hidden">
                <div className="bg-deadwood-light-tan text-deadwood-dark-brown border border-deadwood-brown p-3 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  <h3 className="font-bold mb-2">Action History</h3>
                  <div className="text-sm space-y-1">
                    {gameState.actionLog.map((entry, i) => (
                      <div key={i} className="pb-1 border-b border-deadwood-brown/20 last:border-0">
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Move Confirmation Modal */}
      {gameState.pendingAction?.type === ActionType.MOVE && gameState.pendingAction.target !== undefined && isHumanTurn && (
        <ConfirmModal
          isOpen={true}
          title="Confirm Move"
          message={(() => {
            const cost = getMoveCost(
              currentPlayer!,
              currentPlayer!.position,
              gameState.pendingAction.target
            );
            const locationName = LOCATIONS[gameState.pendingAction.target].name;
            console.log('Move cost calculation:', {
              from: currentPlayer!.position,
              fromName: LOCATIONS[currentPlayer!.position].name,
              to: gameState.pendingAction.target,
              toName: locationName,
              cost: cost,
              character: currentPlayer!.character.name
            });
            return cost > 0 
              ? `Move to ${locationName} for ${cost} gold?`
              : `Move to ${locationName}? (Free - Adjacent location)`;
          })()}
          confirmText="Confirm Move"
          onConfirm={() => dispatch({ type: 'CONFIRM_ACTION' })}
          onCancel={() => dispatch({ type: 'CANCEL_ACTION' })}
          disabled={false}
        />
      )}

      {/* Claim Confirmation Modal */}
      {gameState.pendingAction?.type === ActionType.CLAIM && isHumanTurn && (
        <ConfirmModal
          isOpen={true}
          title="Confirm Claim"
          confirmText="Confirm Claim"
          onConfirm={() => dispatch({ type: 'CONFIRM_ACTION' })}
          onCancel={() => dispatch({ type: 'CANCEL_ACTION' })}
          disabled={!getClaimValidation()?.valid}
        >
          <div className="mb-4">
            <label className="block text-deadwood-dark-brown font-bold mb-2">
              Claim amount:
            </label>
            <select
              className="w-full px-3 py-2 rounded border-2 border-deadwood-brown bg-deadwood-light-tan"
              value={gameState.pendingAction.amount || 1}
              onChange={(e) => handleClaimAmountChange(Number(e.target.value))}
            >
              {[1, 2, 3].map((amt) => {
                const location = getLocationSafe(gameState.board, currentPlayer!.position)
                if (!location) return null
                const currentInf = getLocationInfluence(location, currentPlayer!.id)
                const maxSpace = location.maxInfluence - currentInf
                const maxAffordable = currentPlayer!.gold
                const maxClaim = Math.min(maxAffordable, maxSpace)

                if (amt > maxClaim) {
                  return (
                    <option key={amt} value={amt} disabled={true} className="text-gray-500">
                      {amt} Gold (Not available)
                    </option>
                  )
                }
                return (
                  <option key={amt} value={amt}>
                    {amt} Gold
                  </option>
                )
              })}
            </select>
            {(() => {
              const validation = getClaimValidation()
              if (!validation?.valid) {
                return (
                  <div className="text-deadwood-red text-sm mt-2">
                    {validation?.message}
                  </div>
                )
              }
              return null
            })()}
          </div>
        </ConfirmModal>
      )}

      {/* Challenge Confirmation Modal */}
      {gameState.pendingAction?.type === ActionType.CHALLENGE && gameState.challengeTargets && gameState.challengeTargets.length > 0 && isHumanTurn && (
        <ConfirmModal
          isOpen={true}
          title="Select Target to Challenge"
          confirmText="Confirm Challenge"
          onConfirm={() => dispatch({ type: 'CONFIRM_ACTION' })}
          onCancel={() => dispatch({ type: 'CANCEL_ACTION' })}
          disabled={gameState.pendingAction.target === undefined}
        >
          <div className="mb-4">
            <div className="mb-3 text-deadwood-dark-brown">
              Select which player to challenge at this location:
            </div>
            {gameState.challengeTargets.map((target) => {
              const player = gameState.players.find((p) => p.id === target.playerId)!
              const isSelected = gameState.pendingAction.target === target.playerIndex
              return (
                <button
                  key={target.playerId}
                  className={`w-full p-3 mb-2 rounded transition-all ${
                    isSelected 
                      ? 'ring-4 ring-opacity-50 scale-105' 
                      : 'hover:bg-deadwood-sienna'
                  } ${isSelected ? 'bg-deadwood-gold text-deadwood-dark-brown' : 'bg-deadwood-brown text-white'}`}
                  style={isSelected && currentPlayer?.color ? { 
                    backgroundColor: currentPlayer.color,
                    color: 'white',
                    boxShadow: `0 0 0 4px ${currentPlayer.color}33`
                  } : undefined}
                  onClick={() =>
                    dispatch({
                      type: 'SELECT_CHALLENGE_TARGET',
                      payload: target.playerIndex,
                    })
                  }
                >
                  {player.name} - {player.character.name}
                  <div className="text-sm mt-1">
                    Influence: {getLocationInfluence(gameState.board[player.position], player.id)}
                  </div>
                </button>
              )
            })}
            {gameState.pendingAction.target !== undefined && (
              <div className="text-sm mt-3 text-deadwood-brown">
                Challenge cost: {getChallengeCost(currentPlayer!)} gold
              </div>
            )}
          </div>
        </ConfirmModal>
      )}

      {/* Actions Panel */}
      {isHumanTurn && (
        <div className="fixed bottom-0 left-0 right-0 bg-deadwood-tan border-t-4 border-deadwood-brown p-4 shadow-2xl z-50">
          <div className="max-w-[2400px] mx-auto">
            <div className="flex gap-2 mb-2 max-w-4xl mx-auto">
                <ActionButton
                  action={ActionType.MOVE}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.MOVE
                  )}
                  isDisabled={
                    !canSelectActions || !isActionAvailable(ActionType.MOVE)
                  }
                  onClick={() => handleActionSelect(ActionType.MOVE)}
                  cost={currentPlayer?.character.id === 'jane' ? 0 : undefined}
                />
                <ActionButton
                  action={ActionType.CLAIM}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.CLAIM
                  )}
                  isDisabled={
                    !canSelectActions || !isActionAvailable(ActionType.CLAIM)
                  }
                  onClick={() => handleActionSelect(ActionType.CLAIM)}
                  cost={1}
                />
                <ActionButton
                  action={ActionType.CHALLENGE}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.CHALLENGE
                  )}
                  isDisabled={
                    !canSelectActions || !isActionAvailable(ActionType.CHALLENGE)
                  }
                  onClick={() => handleActionSelect(ActionType.CHALLENGE)}
                  cost={getChallengeCost(currentPlayer)}
                />
                <ActionButton
                  action={ActionType.REST}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.REST
                  )}
                  isDisabled={!canSelectActions}
                  onClick={() => handleActionSelect(ActionType.REST)}
                />
              </div>
              <div className="text-center text-sm text-deadwood-brown">
                {`Selected: ${gameState.completedActions.length}/2 actions`}
              </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeadwoodGame