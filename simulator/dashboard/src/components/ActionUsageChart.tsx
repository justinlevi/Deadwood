import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Target } from 'lucide-react'
import './components.css'

interface ActionUsageChartProps {
  simulations: any[]
}

const ActionUsageChart: React.FC<ActionUsageChartProps> = ({ simulations }) => {
  const data = useMemo(() => {
    const actionCounts = new Map<string, number>()
    let totalActions = 0

    simulations.forEach((sim) => {
      sim.actions.forEach((action: any) => {
        actionCounts.set(
          action.actionType,
          (actionCounts.get(action.actionType) || 0) + 1
        )
        totalActions++
      })
    })

    const colors = {
      move: '#3498db',
      claim: '#2ecc71',
      challenge: '#e74c3c',
      rest: '#f39c12',
    }

    return Array.from(actionCounts.entries()).map(([action, count]) => ({
      name: action.charAt(0).toUpperCase() + action.slice(1),
      value: count,
      percentage: totalActions > 0 ? (count / totalActions) * 100 : 0,
      color: colors[action as keyof typeof colors] || '#95a5a6',
    }))
  }, [simulations])

  const totalGames = simulations.length
  const avgActionsPerGame = useMemo(() => {
    if (totalGames === 0) return 0
    const totalActions = simulations.reduce(
      (sum, sim) => sum + sim.actions.length,
      0
    )
    return totalActions / totalGames
  }, [simulations])

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Target size={20} />
            Action Usage Distribution
          </h3>
          <p className="card-subtitle">Frequency of each action type</p>
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
              <div className="stat-value">{avgActionsPerGame.toFixed(1)}</div>
              <div className="stat-label">Actions/Game</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(avgActionsPerGame / 2).toFixed(1)}
              </div>
              <div className="stat-label">Actions/Player</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: string) => [
                  `${value} (${data.find((d) => d.name === name)?.percentage.toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="action-stats">
            <h4>Action Breakdown</h4>
            <div className="action-list">
              {data.map((action) => (
                <div key={action.name} className="action-item">
                  <div className="action-header">
                    <span className="action-name">
                      <span
                        className="action-color"
                        style={{ backgroundColor: action.color }}
                      />
                      {action.name}
                    </span>
                    <span className="action-count">{action.value}</span>
                  </div>
                  <div className="action-bar">
                    <div
                      className="action-fill"
                      style={{
                        width: `${action.percentage}%`,
                        backgroundColor: action.color,
                      }}
                    />
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

export default ActionUsageChart
