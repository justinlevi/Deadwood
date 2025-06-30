import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import './components.css'

interface WinRateChartProps {
  simulations: any[]
}

const WinRateChart: React.FC<WinRateChartProps> = ({ simulations }) => {
  const data = useMemo(() => {
    const characterStats = new Map<string, { games: number; wins: number }>()

    simulations.forEach((sim) => {
      sim.finalScores.forEach((score: any, index: number) => {
        const character = score.character
        if (!characterStats.has(character)) {
          characterStats.set(character, { games: 0, wins: 0 })
        }

        const stats = characterStats.get(character)!
        stats.games++
        if (index === sim.winner) {
          stats.wins++
        }
      })
    })

    const characters = [
      { id: 'al', name: 'Al Swearengen', color: '#e74c3c' },
      { id: 'seth', name: 'Seth Bullock', color: '#3498db' },
      { id: 'cy', name: 'Cy Tolliver', color: '#2ecc71' },
      { id: 'jane', name: 'Calamity Jane', color: '#f39c12' },
    ]

    return characters.map((char) => {
      const stats = characterStats.get(char.id) || { games: 0, wins: 0 }
      return {
        name: char.name,
        character: char.id,
        winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
        games: stats.games,
        wins: stats.wins,
        color: char.color,
      }
    })
  }, [simulations])

  const averageWinRate = 100 / 4 // Expected win rate in a balanced 4-player game

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <TrendingUp size={20} />
            Character Win Rates
          </h3>
          <p className="card-subtitle">
            Win percentage by character across all games
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
          <div className="stats-grid">
            {data.map((char) => (
              <div key={char.character} className="stat-card">
                <div className="stat-value" style={{ color: char.color }}>
                  {char.winRate.toFixed(1)}%
                </div>
                <div className="stat-label">{char.character}</div>
                <div className="stat-detail">
                  {char.wins} / {char.games}
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="character" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              />
              <Bar dataKey="winRate" fill="#3498db" radius={[4, 4, 0, 0]} />
              <ReferenceLine
                y={averageWinRate}
                stroke="#95a5a6"
                strokeDasharray="5 5"
                label="Expected"
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="chart-legend">
            <span className="legend-item">
              <span
                className="legend-line"
                style={{ backgroundColor: '#95a5a6' }}
              />
              Expected win rate (balanced game): {averageWinRate.toFixed(1)}%
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// Add ReferenceLine component since it's not in the main recharts export
const ReferenceLine: React.FC<any> = ({
  y,
  stroke,
  strokeDasharray,
  label,
}) => {
  return null // This would be implemented by recharts
}

export default WinRateChart
