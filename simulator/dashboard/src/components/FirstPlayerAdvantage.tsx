import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import './components.css'

interface FirstPlayerAdvantageProps {
  simulations: any[]
}

const FirstPlayerAdvantage: React.FC<FirstPlayerAdvantageProps> = ({
  simulations,
}) => {
  const data = useMemo(() => {
    const positionStats = new Map<number, { games: number; wins: number }>()

    simulations.forEach((sim) => {
      const playerCount = sim.finalScores.length

      sim.finalScores.forEach((score: any, position: number) => {
        if (!positionStats.has(position)) {
          positionStats.set(position, { games: 0, wins: 0 })
        }

        const stats = positionStats.get(position)!
        stats.games++
        if (position === sim.winner) {
          stats.wins++
        }
      })
    })

    return Array.from(positionStats.entries())
      .map(([position, stats]) => ({
        position: `P${position + 1}`,
        winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
        games: stats.games,
        wins: stats.wins,
      }))
      .sort(
        (a, b) => parseInt(a.position.slice(1)) - parseInt(b.position.slice(1))
      )
  }, [simulations])

  const expectedWinRate = data.length > 0 ? 100 / data.length : 25

  const advantage = useMemo(() => {
    if (data.length === 0) return 0
    const firstPlayerRate = data[0]?.winRate || 0
    return firstPlayerRate - expectedWinRate
  }, [data, expectedWinRate])

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <TrendingUp size={20} />
            Turn Order Analysis
          </h3>
          <p className="card-subtitle">Win rate by player position</p>
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
            <div className="stat-card">
              <div
                className="stat-value"
                style={{ color: advantage > 5 ? '#e74c3c' : '#2ecc71' }}
              >
                {advantage > 0 ? '+' : ''}
                {advantage.toFixed(1)}%
              </div>
              <div className="stat-label">First Player Advantage</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{expectedWinRate.toFixed(1)}%</div>
              <div className="stat-label">Expected Rate</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" />
              <YAxis domain={[0, 'dataMax + 10']} />
              <Tooltip
                formatter={(value: any) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
              />
              <Bar dataKey="winRate" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="position-analysis">
            <h4>Position Details</h4>
            <div className="position-grid">
              {data.map((pos, index) => (
                <div key={pos.position} className="position-card">
                  <div className="position-header">
                    <span className="position-name">{pos.position}</span>
                    <span
                      className="position-rate"
                      style={{
                        color:
                          pos.winRate > expectedWinRate ? '#2ecc71' : '#e74c3c',
                      }}
                    >
                      {pos.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="position-stats">
                    <span>
                      {pos.wins} wins / {pos.games} games
                    </span>
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

export default FirstPlayerAdvantage
