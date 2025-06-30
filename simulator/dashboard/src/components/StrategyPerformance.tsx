import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GitBranch } from 'lucide-react'
import './components.css'

interface StrategyPerformanceProps {
  simulations: any[]
}

const StrategyPerformance: React.FC<StrategyPerformanceProps> = ({ simulations }) => {
  const data = useMemo(() => {
    const strategyStats = new Map<string, {
      games: number
      wins: number
      totalInfluence: number
      totalRounds: number
    }>()
    
    simulations.forEach(sim => {
      sim.aiStrategies.forEach((strategy: string, playerIndex: number) => {
        if (!strategy) return
        
        if (!strategyStats.has(strategy)) {
          strategyStats.set(strategy, {
            games: 0,
            wins: 0,
            totalInfluence: 0,
            totalRounds: 0
          })
        }
        
        const stats = strategyStats.get(strategy)!
        stats.games++
        stats.totalRounds += sim.rounds
        stats.totalInfluence += sim.finalScores[playerIndex].totalInfluence
        
        if (playerIndex === sim.winner) {
          stats.wins++
        }
      })
    })
    
    return Array.from(strategyStats.entries()).map(([strategy, stats]) => ({
      strategy,
      winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
      avgInfluence: stats.games > 0 ? stats.totalInfluence / stats.games : 0,
      avgGameLength: stats.games > 0 ? stats.totalRounds / stats.games : 0,
      games: stats.games,
      wins: stats.wins
    })).sort((a, b) => b.winRate - a.winRate)
  }, [simulations])
  
  const bestStrategy = data.length > 0 ? data[0] : null
  
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <GitBranch size={20} />
            AI Strategy Performance
          </h3>
          <p className="card-subtitle">Win rates by AI strategy type</p>
        </div>
      </div>
      
      {simulations.length === 0 ? (
        <div className="empty-state">
          <p>No simulation data available. Run some simulations to see results.</p>
        </div>
      ) : (
        <>
          {bestStrategy && (
            <div className="highlight-box">
              <div className="highlight-label">Best Performing Strategy</div>
              <div className="highlight-value">{bestStrategy.strategy}</div>
              <div className="highlight-stats">
                {bestStrategy.winRate.toFixed(1)}% win rate • 
                {bestStrategy.avgInfluence.toFixed(1)} avg influence
              </div>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax + 10']} />
              <YAxis dataKey="strategy" type="category" width={80} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'winRate' ? `${value.toFixed(1)}%` : value.toFixed(1),
                  name === 'winRate' ? 'Win Rate' : 'Avg Influence'
                ]}
              />
              <Bar dataKey="winRate" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="strategy-details">
            <h4>Strategy Breakdown</h4>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Avg Influence</th>
                  <th>Avg Game Length</th>
                </tr>
              </thead>
              <tbody>
                {data.map(strategy => (
                  <tr key={strategy.strategy}>
                    <td className="strategy-name">{strategy.strategy}</td>
                    <td>{strategy.games}</td>
                    <td>{strategy.wins}</td>
                    <td>{strategy.winRate.toFixed(1)}%</td>
                    <td>{strategy.avgInfluence.toFixed(1)}</td>
                    <td>{strategy.avgGameLength.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="strategy-descriptions">
            <h4>Strategy Descriptions</h4>
            <div className="description-list">
              <div className="description-item">
                <strong>random:</strong> Makes completely random valid actions
              </div>
              <div className="description-item">
                <strong>greedy:</strong> Maximizes influence gain at every opportunity
              </div>
              <div className="description-item">
                <strong>balanced:</strong> Balances influence, positioning, and disruption
              </div>
              <div className="description-item">
                <strong>aggressive:</strong> Focuses on challenging opponents and controlling key locations
              </div>
              <div className="description-item">
                <strong>defensive:</strong> Avoids confrontation and builds influence in safe locations
              </div>
              <div className="description-item">
                <strong>mcts:</strong> Uses Monte Carlo Tree Search for decision making
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StrategyPerformance