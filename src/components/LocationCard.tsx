import React from 'react'
import type { Player, Location as DWLocation } from '../game/types'
import styles from './LocationCard.module.css'

interface Props {
  location: DWLocation
  players: Player[]
  onClick: () => void
  isValidTarget: boolean
  currentPlayerId: string
  showMoveCost?: number
  isCurrentLocation?: boolean
  highlightedPlayers?: string[]
}

const LocationCard: React.FC<Props> = ({
  location,
  players,
  onClick,
  isValidTarget,
  currentPlayerId,
  showMoveCost,
  isCurrentLocation,
  highlightedPlayers = [],
}) => {
  const influences = Object.entries(location.influences)
    .filter(([, influence]) => influence > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div
      onClick={isValidTarget ? onClick : undefined}
      className={styles.card}
      data-current={isCurrentLocation ? 'true' : 'false'}
      data-valid={isValidTarget ? 'true' : 'false'}
    >
      <h3 className={styles.title}>{location.name}</h3>
      {isValidTarget && showMoveCost !== undefined && showMoveCost > 0 && (
        <div className={styles.moveCost}>{showMoveCost}g</div>
      )}
      {influences.length > 0 && (
        <div className={styles.influences}>
          {influences.map(([playerId, influence]) => {
            const player = players.find((p) => p.id === playerId)
            if (!player) return null
            return (
              <div
                key={playerId}
                className={styles.influence}
                data-current={playerId === currentPlayerId}
              >
                {'★'.repeat(influence)}
              </div>
            )
          })}
        </div>
      )}
      <div className={styles.players}>
        {players.map((player) => (
          <div
            key={player.id}
            className={styles.player}
            data-current={player.id === currentPlayerId}
            data-highlight={highlightedPlayers.includes(player.id)}
          >
            {player.character.name.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LocationCard
