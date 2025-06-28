import React, { useReducer, useEffect } from 'react'
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
import gameReducer from './game/reducer'
import generateAIActions from './game/ai'
import GameSetup from './components/GameSetup'
import LocationCard from './components/LocationCard'
import ActionButton from './components/ActionButton'
import GameOver from './components/GameOver'

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
    message: '',
  }
  const [gameState, dispatch] = useReducer(gameReducer, initialState)

  // expose helpers for Playwright tests
  useEffect(() => {
    ;(window as any).dispatchGameAction = dispatch
    ;(window as any).getGameState = () => gameState
    ;(window as any).GamePhase = GamePhase
    ;(window as any).ActionType = ActionType
  }, [dispatch, gameState])

  useEffect(() => {
    if (
      gameState.phase === GamePhase.PLAYER_TURN &&
      gameState.players[gameState.currentPlayer]?.isAI &&
      !gameState.pendingAction &&
      gameState.completedActions.length === 0
    ) {
      const timer = setTimeout(() => {
        const aiActions = generateAIActions(gameState)
        let delay = 0
        aiActions.forEach((action) => {
          setTimeout(() => {
            dispatch({ type: 'SELECT_ACTION', payload: action.type })
            if (action.target !== undefined || action.amount !== undefined) {
              setTimeout(() => {
                dispatch({
                  type: 'SET_ACTION_TARGET',
                  payload: { target: action.target, amount: action.amount },
                })
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
      const playersAtLocation = gameState.players.filter(
        (p) => p.position === locationId
      )
      const currentPlayer = gameState.players[gameState.currentPlayer]
      const validTargets = playersAtLocation.filter(
        (p) =>
          p.id !== currentPlayer.id &&
          canChallenge(currentPlayer, p) &&
          getLocationInfluence(gameState.board[p.position], p.id) > 0
      )
      if (validTargets.length > 0) {
        const targetIndex = gameState.players.indexOf(validTargets[0])
        dispatch({
          type: 'SET_ACTION_TARGET',
          payload: { target: targetIndex },
        })
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
    return gameState.players
      .filter(
        (p) =>
          p.id !== currentPlayer.id &&
          canChallenge(currentPlayer, p) &&
          getLocationInfluence(gameState.board[p.position], p.id) > 0
      )
      .map((p) => p.id)
  }

  const isActionAvailable = (action: ActionType): boolean => {
    const currentPlayer = gameState.players[gameState.currentPlayer]
    if (!currentPlayer) return false
    switch (action) {
      case ActionType.MOVE:
        return true
      case ActionType.CLAIM: {
        const location = gameState.board[currentPlayer.position]
        const currentInfluence = getLocationInfluence(
          location,
          currentPlayer.id
        )
        return (
          currentPlayer.gold >= 1 && currentInfluence < location.maxInfluence
        )
      }
      case ActionType.CHALLENGE: {
        const cost = getChallengeCost(currentPlayer)
        if (currentPlayer.gold < cost) return false
        const hasValidTargets = gameState.players.some(
          (p, i) =>
            i !== gameState.currentPlayer &&
            canChallenge(currentPlayer, p) &&
            gameState.board[p.position].influences[p.id] > 0
        )
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

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isHumanTurn = currentPlayer && !currentPlayer.isAI
  const validChallengeTargets = getValidChallengeTargets()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B4513, #A0522D)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: '#654321',
          color: 'white',
          padding: '0.75rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {gameState.message}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          paddingBottom: isHumanTurn ? '200px' : '1rem',
        }}
      >
        <div
          style={{
            background: '#F5DEB3',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: '#654321',
                }}
              >
                {currentPlayer?.name} - {currentPlayer?.character.name}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#8B4513',
                  fontStyle: 'italic',
                }}
              >
                {currentPlayer?.character.ability}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.9rem',
              color: '#654321',
            }}
          >
            <div>
              Gold: <strong>{currentPlayer?.gold}</strong>
            </div>
            <div>
              Influence: <strong>{currentPlayer?.totalInfluence}</strong>
            </div>
            <div>
              Actions: <strong>{2 - gameState.completedActions.length}</strong>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {gameState.board.map((location) => {
            const playersAtLocation = gameState.players.filter(
              (p) => p.position === location.id
            )
            const isCurrentLocation = currentPlayer?.position === location.id
            let isValidTarget = false
            let moveCost: number | undefined
            if (
              gameState.pendingAction?.type === ActionType.MOVE &&
              currentPlayer
            ) {
              isValidTarget = location.id !== currentPlayer.position
              moveCost = getMoveCost(
                currentPlayer,
                currentPlayer.position,
                location.id
              )
              if (moveCost > currentPlayer.gold) isValidTarget = false
            } else if (
              gameState.pendingAction?.type === ActionType.CHALLENGE &&
              currentPlayer
            ) {
              const hasValidTargets = playersAtLocation.some((p) =>
                validChallengeTargets.includes(p.id)
              )
              isValidTarget = hasValidTargets
            }
            return (
              <LocationCard
                key={location.id}
                location={location}
                players={playersAtLocation}
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
              />
            )
          })}
        </div>
        <div
          style={{
            background: 'rgba(245, 222, 179, 0.7)',
            borderRadius: '8px',
            padding: '0.75rem',
          }}
        >
          <h3
            style={{
              margin: '0 0 0.5rem 0',
              color: '#654321',
              fontSize: '1rem',
            }}
          >
            Other Players
          </h3>
          {gameState.players
            .filter((p) => p.id !== currentPlayer?.id)
            .map((player) => (
              <div
                key={player.id}
                style={{
                  fontSize: '0.8rem',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {player.name} - {player.character.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <span>Gold: {player.gold}</span>
                  <span>Influence: {player.totalInfluence}</span>
                  <span>Location: {LOCATIONS[player.position].name}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
      {isHumanTurn && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#F5DEB3',
            borderTop: '3px solid #8B4513',
            padding: '1rem',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {gameState.pendingAction && (
            <div style={{ marginBottom: '1rem' }}>
              {gameState.pendingAction.type === ActionType.CLAIM && (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    alignItems: 'center',
                  }}
                >
                  <label
                    style={{ flex: 1, fontSize: '0.9rem', color: '#654321' }}
                  >
                    Claim amount:
                  </label>
                  <select
                    value={gameState.pendingAction.amount || 1}
                    onChange={(e) =>
                      handleClaimAmountChange(Number(e.target.value))
                    }
                    style={{
                      flex: 2,
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '2px solid #8B4513',
                      background: '#FFF8DC',
                    }}
                  >
                    {[1, 2, 3].map((amt) => {
                      const location = gameState.board[currentPlayer.position]
                      const currentInf = getLocationInfluence(
                        location,
                        currentPlayer.id
                      )
                      const maxClaim = Math.min(
                        currentPlayer.gold,
                        location.maxInfluence - currentInf
                      )
                      if (amt > maxClaim) return null
                      return (
                        <option key={amt} value={amt}>
                          {amt} Gold = {amt} Influence
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => dispatch({ type: 'CANCEL_ACTION' })}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#DC143C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => dispatch({ type: 'CONFIRM_ACTION' })}
                  disabled={
                    (gameState.pendingAction.type === ActionType.MOVE &&
                      gameState.pendingAction.target === undefined) ||
                    (gameState.pendingAction.type === ActionType.CHALLENGE &&
                      gameState.pendingAction.target === undefined)
                  }
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    background:
                      gameState.pendingAction.target !== undefined ||
                      gameState.pendingAction.type === ActionType.CLAIM
                        ? '#32CD32'
                        : '#D3D3D3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor:
                      gameState.pendingAction.target !== undefined ||
                      gameState.pendingAction.type === ActionType.CLAIM
                        ? 'pointer'
                        : 'not-allowed',
                  }}
                >
                  Confirm {gameState.pendingAction.type}
                </button>
              </div>
            </div>
          )}
          {!gameState.pendingAction && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <ActionButton
                  action={ActionType.MOVE}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.MOVE
                  )}
                  isDisabled={
                    !isActionAvailable(ActionType.MOVE) ||
                    gameState.completedActions.length >= 2
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
                    !isActionAvailable(ActionType.CLAIM) ||
                    gameState.completedActions.length >= 2
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
                    !isActionAvailable(ActionType.CHALLENGE) ||
                    gameState.completedActions.length >= 2
                  }
                  onClick={() => handleActionSelect(ActionType.CHALLENGE)}
                  cost={getChallengeCost(currentPlayer)}
                />
                <ActionButton
                  action={ActionType.REST}
                  isSelected={gameState.completedActions.some(
                    (a) => a.type === ActionType.REST
                  )}
                  isDisabled={gameState.completedActions.length >= 2}
                  onClick={() => handleActionSelect(ActionType.REST)}
                />
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  color: '#8B4513',
                }}
              >
                Selected: {gameState.completedActions.length}/2 actions
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default DeadwoodGame
