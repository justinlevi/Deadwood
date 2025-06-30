import React from 'react'
import type { Player, Location as DWLocation } from '../game/types'

interface Props {
  location: DWLocation
  /** Players currently at this location */
  players: Player[]
  /** All players in the game (for looking up influence colors) */
  allPlayers: Player[]
  onClick: () => void
  isValidTarget: boolean
  currentPlayerId: string
  showMoveCost?: number
  isCurrentLocation?: boolean
  highlightedPlayers?: string[]
  isSelected?: boolean
  currentPlayerColor?: string
}

const locationImageMap: Record<string, string> = {
  'Gem Saloon': '/gem.jpg',
  'Hardware Store': '/hardware.jpg',
  'Bella Union': '/bella.jpg',
  'Sheriff Office': '/sheriff.jpg',
  'Freight Office': '/freight.jpg',
  "Wu's Pig Alley": '/wus.jpg',
}

const LocationCard: React.FC<Props> = ({
  location,
  players,
  allPlayers,
  onClick,
  isValidTarget,
  currentPlayerId,
  showMoveCost,
  isCurrentLocation,
  highlightedPlayers = [],
  isSelected = false,
  currentPlayerColor,
}) => {
  const influences = Object.entries(location.influences)
    .filter(([, influence]) => influence > 0)
    .sort((a, b) => b[1] - a[1])

  const baseClasses =
    'relative min-h-[120px] lg:min-h-[140px] 2xl:min-h-[160px] h-full flex flex-col p-3 lg:p-4 rounded-lg border-4 transition-all duration-200 bg-cover bg-center bg-no-repeat'

  const getCardClasses = () => {
    if (isCurrentLocation) {
      return `${baseClasses}`
    }
    if (isSelected) {
      return `${baseClasses} border-8 cursor-pointer ring-4 scale-105`
    }
    if (isValidTarget) {
      return `${baseClasses} border-deadwood-green cursor-pointer hover:scale-105`
    }
    return `${baseClasses} border-deadwood-brown`
  }

  const getInlineStyles = () => {
    const backgroundImage = locationImageMap[location.name]
    const styles: React.CSSProperties = {}

    if (backgroundImage) {
      styles.backgroundImage = `url(${backgroundImage})`
    }

    if ((isSelected || isCurrentLocation) && currentPlayerColor) {
      styles.borderColor = currentPlayerColor
      styles.boxShadow = `0 0 0 4px ${currentPlayerColor}33` // 33 is 20% opacity in hex
    }

    return styles
  }

  return (
    <div
      onClick={isValidTarget ? onClick : undefined}
      className={getCardClasses()}
      style={getInlineStyles()}
    >
      {/* Semi-transparent overlay for text readability */}
      <div className="absolute inset-0 bg-black/20 rounded-lg"></div>

      {/* Content container with relative positioning to appear above overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {isValidTarget && showMoveCost !== undefined && showMoveCost > 0 && (
          <div
            className="absolute top-1 right-1 bg-deadwood-gold px-2 py-1 rounded text-xs lg:text-sm font-bold text-deadwood-dark-brown"
            data-testid="move-cost"
          >
            {showMoveCost}g
          </div>
        )}

        {influences.length > 0 && (
          <div className="mb-2">
            {influences.map(([playerId, influence]) => {
              const player = allPlayers.find((p) => p.id === playerId)
              if (!player) return null
              return (
                <div
                  key={playerId}
                  className={`text-sm lg:text-base mb-1 drop-shadow-lg ${
                    playerId === currentPlayerId ? 'font-bold' : ''
                  }`}
                  data-current={playerId === currentPlayerId ? 'true' : 'false'}
                  style={{
                    color: player.color,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {'★'.repeat(influence)}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-auto">
          {players.map((player) => {
            const isHighlighted = highlightedPlayers.includes(player.id)
            const isCurrent = player.id === currentPlayerId

            const badgeClasses = `
              px-2 py-1 rounded text-xs lg:text-sm font-bold transition-all text-white
              ${isHighlighted ? 'border-2 border-red-900' : ''}
            `

            return (
              <div
                key={player.id}
                className={badgeClasses}
                style={{ backgroundColor: player.color }}
              >
                {player.character.name.split(' ')[0]}
              </div>
            )
          })}
        </div>

        {/* Location name at bottom left */}
        <h3 className="text-base lg:text-lg font-bold text-white mt-2 drop-shadow-lg">
          {location.name}
        </h3>
      </div>
    </div>
  )
}

export default LocationCard
