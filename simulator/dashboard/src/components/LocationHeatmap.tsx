import React, { useMemo } from 'react'
import { Map as MapIcon } from 'lucide-react'
import './LocationHeatmap.css'

interface LocationHeatmapProps {
  simulations: any[]
}

const LocationHeatmap: React.FC<LocationHeatmapProps> = ({ simulations }) => {
  const locationData = useMemo(() => {
    const locations = [
      { id: 0, name: 'Gem Saloon', x: 100, y: 100 },
      { id: 1, name: 'Hardware Store', x: 300, y: 100 },
      { id: 2, name: 'Bella Union', x: 500, y: 100 },
      { id: 3, name: 'Sheriff Office', x: 100, y: 300 },
      { id: 4, name: 'Freight Office', x: 300, y: 300 },
      { id: 5, name: "Wu's Pig Alley", x: 500, y: 300 },
    ]

    const stats = locations.map((loc) => ({
      ...loc,
      claims: 0,
      moves: 0,
      challenges: 0,
      totalInfluence: 0,
      contestedness: 0,
    }))

    // Process all actions
    simulations.forEach((sim) => {
      const locationPlayers = new Map<number, Set<string>>()

      sim.actions.forEach((action: any) => {
        if (action.actionType === 'claim' && action.target !== undefined) {
          stats[action.target].claims++
          stats[action.target].totalInfluence += action.amount || 1
        } else if (
          action.actionType === 'move' &&
          action.target !== undefined
        ) {
          stats[action.target].moves++
        } else if (
          action.actionType === 'challenge' &&
          action.target !== undefined
        ) {
          // Find where the challenge happened
          const targetPlayer = sim.finalScores[action.target]
          if (targetPlayer) {
            // This is simplified - in real data we'd track player positions
            stats[0].challenges++ // Default to first location
          }
        }

        // Track contestedness
        if (action.actionType === 'claim' && action.target !== undefined) {
          if (!locationPlayers.has(action.target)) {
            locationPlayers.set(action.target, new Set())
          }
          locationPlayers.get(action.target)!.add(action.playerId)
        }
      })

      // Calculate contestedness
      locationPlayers.forEach((players, locId) => {
        if (players.size > 1) {
          stats[locId].contestedness++
        }
      })
    })

    // Normalize values for heatmap
    const maxClaims = Math.max(...stats.map((s) => s.claims))
    const maxMoves = Math.max(...stats.map((s) => s.moves))

    return stats.map((stat) => ({
      ...stat,
      claimIntensity: maxClaims > 0 ? stat.claims / maxClaims : 0,
      moveIntensity: maxMoves > 0 ? stat.moves / maxMoves : 0,
      contestedRate:
        simulations.length > 0
          ? (stat.contestedness / simulations.length) * 100
          : 0,
    }))
  }, [simulations])

  const getHeatColor = (intensity: number) => {
    const hue = 240 - intensity * 240 // Blue to Red
    return `hsl(${hue}, 70%, 50%)`
  }

  return (
    <div className="card location-heatmap">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <MapIcon size={20} />
            Location Heatmap
          </h3>
          <p className="card-subtitle">
            Activity and influence distribution across locations
          </p>
        </div>
      </div>

      {simulations.length === 0 ? (
        <div className="empty-state">
          <p>
            No simulation data available. Run some simulations to see results.
          </p>
        </div>
      ) : (
        <>
          <div className="heatmap-controls">
            <label>
              View:
              <select defaultValue="claims">
                <option value="claims">Claim Activity</option>
                <option value="moves">Movement Activity</option>
                <option value="contested">Contestedness</option>
              </select>
            </label>
          </div>

          <div className="board-visualization">
            <svg viewBox="0 0 600 400" className="board-svg">
              {/* Draw connections */}
              <line
                x1="100"
                y1="100"
                x2="300"
                y2="100"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="300"
                y1="100"
                x2="500"
                y2="100"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="300"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="300"
                y1="100"
                x2="300"
                y2="300"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="500"
                y1="100"
                x2="500"
                y2="300"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="100"
                y1="300"
                x2="300"
                y2="300"
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1="300"
                y1="300"
                x2="500"
                y2="300"
                stroke="#ddd"
                strokeWidth="2"
              />

              {/* Draw locations */}
              {locationData.map((loc) => (
                <g key={loc.id}>
                  <circle
                    cx={loc.x}
                    cy={loc.y}
                    r="40"
                    fill={getHeatColor(loc.claimIntensity)}
                    stroke="#333"
                    strokeWidth="2"
                    className="location-node"
                  />
                  <text
                    x={loc.x}
                    y={loc.y + 60}
                    textAnchor="middle"
                    className="location-label"
                  >
                    {loc.name}
                  </text>
                  <text
                    x={loc.x}
                    y={loc.y}
                    textAnchor="middle"
                    className="location-value"
                    fill="white"
                  >
                    {loc.claims}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="location-stats">
            <h4>Location Statistics</h4>
            <div className="location-grid">
              {locationData.map((loc) => (
                <div key={loc.id} className="location-card">
                  <h5>{loc.name}</h5>
                  <div className="location-metrics">
                    <div className="metric">
                      <span className="metric-label">Claims:</span>
                      <span className="metric-value">{loc.claims}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Moves to:</span>
                      <span className="metric-value">{loc.moves}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Contested:</span>
                      <span className="metric-value">
                        {loc.contestedRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Total Influence:</span>
                      <span className="metric-value">{loc.totalInfluence}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LocationHeatmap
