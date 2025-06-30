import React, { useMemo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { Users } from 'lucide-react'
import './components.css'

interface CharacterBalanceProps {
  simulations: any[]
}

const CharacterBalance: React.FC<CharacterBalanceProps> = ({ simulations }) => {
  const balanceData = useMemo(() => {
    const characters = ['al', 'seth', 'cy', 'jane']
    const characterNames = {
      al: 'Al Swearengen',
      seth: 'Seth Bullock',
      cy: 'Cy Tolliver',
      jane: 'Calamity Jane'
    }
    
    const stats = characters.map(char => {
      let wins = 0
      let totalInfluence = 0
      let totalGold = 0
      let games = 0
      let avgPosition = 0
      
      simulations.forEach(sim => {
        sim.finalScores.forEach((score: any, index: number) => {
          if (score.character === char) {
            games++
            totalInfluence += score.totalInfluence
            totalGold += score.gold
            avgPosition += index + 1
            if (index === sim.winner) wins++
          }
        })
      })
      
      return {
        character: characterNames[char as keyof typeof characterNames],
        winRate: games > 0 ? (wins / games) * 100 : 0,
        avgInfluence: games > 0 ? totalInfluence / games : 0,
        avgGold: games > 0 ? totalGold / games : 0,
        avgPosition: games > 0 ? avgPosition / games : 0,
        games
      }
    })
    
    // Normalize values for radar chart (0-100 scale)
    const maxInfluence = Math.max(...stats.map(s => s.avgInfluence))
    const maxGold = Math.max(...stats.map(s => s.avgGold))
    
    return stats.map(stat => ({
      character: stat.character,
      'Win Rate': stat.winRate,
      'Avg Influence': maxInfluence > 0 ? (stat.avgInfluence / maxInfluence) * 100 : 0,
      'Avg Gold': maxGold > 0 ? (stat.avgGold / maxGold) * 100 : 0,
      'Position': 100 - ((stat.avgPosition - 1) / 3) * 100, // Invert so higher is better
      games: stat.games
    }))
  }, [simulations])
  
  const balanceScore = useMemo(() => {
    if (simulations.length === 0) return 0
    
    const winRates = balanceData.map(d => d['Win Rate'])
    const expectedRate = 25 // 25% for 4 players
    
    const variance = winRates.reduce((sum, rate) => {
      return sum + Math.pow(rate - expectedRate, 2)
    }, 0) / winRates.length
    
    const stdDev = Math.sqrt(variance)
    // Convert to 0-100 score where 100 is perfect balance
    return Math.max(0, 100 - stdDev * 4)
  }, [balanceData, simulations])
  
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Users size={20} />
            Character Balance Analysis
          </h3>
          <p className="card-subtitle">Comparative performance metrics</p>
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
              <div className="stat-value">{balanceScore.toFixed(0)}</div>
              <div className="stat-label">Balance Score</div>
              <div className="stat-detail">100 = Perfect Balance</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={balanceData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="character" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="Win Rate"
                stroke="#e74c3c"
                fill="#e74c3c"
                fillOpacity={0.3}
              />
              <Radar
                name="Influence"
                dataKey="Avg Influence"
                stroke="#3498db"
                fill="#3498db"
                fillOpacity={0.3}
              />
              <Radar
                name="Gold"
                dataKey="Avg Gold"
                stroke="#f39c12"
                fill="#f39c12"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
          
          <div className="balance-details">
            <h4>Character Statistics</h4>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Character</th>
                  <th>Games</th>
                  <th>Win Rate</th>
                  <th>Avg Influence</th>
                  <th>Avg Gold</th>
                </tr>
              </thead>
              <tbody>
                {balanceData.map(char => (
                  <tr key={char.character}>
                    <td>{char.character}</td>
                    <td>{char.games}</td>
                    <td>{char['Win Rate'].toFixed(1)}%</td>
                    <td>{(char['Avg Influence'] * 12 / 100).toFixed(1)}</td>
                    <td>{(char['Avg Gold'] * 10 / 100).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default CharacterBalance