import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock } from 'lucide-react'
import './components.css'

interface GameLengthChartProps {
  simulations: any[]
}

const GameLengthChart: React.FC<GameLengthChartProps> = ({ simulations }) => {
  const data = useMemo(() => {
    const lengthDistribution = new Map<number, number>()
    
    simulations.forEach(sim => {
      const rounds = sim.rounds
      lengthDistribution.set(rounds, (lengthDistribution.get(rounds) || 0) + 1)
    })
    
    const chartData = []
    for (let i = 1; i <= 20; i++) {
      chartData.push({
        round: i,
        games: lengthDistribution.get(i) || 0,
        percentage: simulations.length > 0 ? 
          ((lengthDistribution.get(i) || 0) / simulations.length) * 100 : 0
      })
    }
    
    return chartData
  }, [simulations])
  
  const stats = useMemo(() => {
    if (simulations.length === 0) return { avg: 0, min: 0, max: 0 }
    
    const lengths = simulations.map(sim => sim.rounds)
    return {
      avg: lengths.reduce((a, b) => a + b, 0) / lengths.length,
      min: Math.min(...lengths),
      max: Math.max(...lengths)
    }
  }, [simulations])
  
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Clock size={20} />
            Game Length Distribution
          </h3>
          <p className="card-subtitle">Number of rounds per game</p>
        </div>
      </div>
      
      {simulations.length === 0 ? (
        <div className="empty-state">
          <p>No simulation data available. Run some simulations to see results.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.avg.toFixed(1)}</div>
              <div className="stat-label">Avg Rounds</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.min}</div>
              <div className="stat-label">Min Rounds</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.max}</div>
              <div className="stat-label">Max Rounds</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'games' ? value : `${value.toFixed(1)}%`,
                  name === 'games' ? 'Games' : 'Percentage'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="games" 
                stroke="#3498db" 
                strokeWidth={2}
                dot={{ fill: '#3498db', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

export default GameLengthChart