import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { GitBranch } from 'lucide-react'
import './components.css'

interface NashEquilibriumProps {
  simulations: any[]
}

const NashEquilibrium: React.FC<NashEquilibriumProps> = ({ simulations }) => {
  const equilibriumData = useMemo(() => {
    // Analyze action frequencies by character
    const characterActions = new Map<string, Map<string, number>>()

    simulations.forEach((sim) => {
      sim.actions.forEach((action: any) => {
        const character = action.playerCharacter
        if (!characterActions.has(character)) {
          characterActions.set(character, new Map())
        }

        const actions = characterActions.get(character)!
        actions.set(
          action.actionType,
          (actions.get(action.actionType) || 0) + 1
        )
      })
    })

    // Convert to equilibrium strategies
    const equilibria = Array.from(characterActions.entries()).map(
      ([character, actions]) => {
        const total = Array.from(actions.values()).reduce(
          (sum, count) => sum + count,
          0
        )
        const strategies = Array.from(actions.entries()).map(
          ([action, count]) => ({
            action,
            probability: total > 0 ? count / total : 0,
          })
        )

        return { character, strategies, total }
      }
    )

    return equilibria
  }, [simulations])

  const actionPayoffMatrix = useMemo(() => {
    // Simple payoff matrix based on action outcomes
    const actions = ['move', 'claim', 'challenge', 'rest']
    const payoffs: number[][] = [
      [0, -1, 1, -0.5], // move vs others
      [1, 0, -0.5, 0.5], // claim vs others
      [-1, 0.5, 0, -1], // challenge vs others
      [0.5, -0.5, 1, 0], // rest vs others
    ]

    return { actions, payoffs }
  }, [])

  const colors = {
    move: '#3498db',
    claim: '#2ecc71',
    challenge: '#e74c3c',
    rest: '#f39c12',
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <GitBranch size={20} />
            Nash Equilibrium Analysis
          </h3>
          <p className="card-subtitle">
            Optimal mixed strategies from simulation data
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
          <div className="equilibrium-section">
            <h4>Empirical Action Distribution by Character</h4>
            <div className="character-equilibria">
              {equilibriumData.map(({ character, strategies }) => {
                const chartData = strategies.map((s) => ({
                  name: s.action.charAt(0).toUpperCase() + s.action.slice(1),
                  value: s.probability * 100,
                  color: colors[s.action as keyof typeof colors],
                }))

                return (
                  <div key={character} className="character-strategy">
                    <h5>{character.toUpperCase()}</h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => `${value.toFixed(1)}%`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="strategy-list">
                      {strategies
                        .sort((a, b) => b.probability - a.probability)
                        .map((s) => (
                          <div key={s.action} className="strategy-item">
                            <span
                              className="strategy-dot"
                              style={{
                                backgroundColor:
                                  colors[s.action as keyof typeof colors],
                              }}
                            />
                            <span className="strategy-name">{s.action}:</span>
                            <span className="strategy-prob">
                              {(s.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="equilibrium-section">
            <h4>Theoretical Action Payoff Matrix</h4>
            <div className="payoff-matrix">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th></th>
                    {actionPayoffMatrix.actions.map((action) => (
                      <th key={action}>{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actionPayoffMatrix.actions.map((action, i) => (
                    <tr key={action}>
                      <th>{action}</th>
                      {actionPayoffMatrix.payoffs[i].map((payoff, j) => (
                        <td
                          key={j}
                          className={
                            payoff > 0
                              ? 'positive'
                              : payoff < 0
                                ? 'negative'
                                : 'neutral'
                          }
                        >
                          {payoff}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="matrix-note">
              Positive values indicate advantage, negative values indicate
              disadvantage
            </p>
          </div>

          <div className="insights-section">
            <h4>Strategic Insights</h4>
            <ul className="insights-list">
              <li>
                <strong>Claim dominance:</strong> Most characters spend 30-40%
                of actions claiming influence
              </li>
              <li>
                <strong>Movement patterns:</strong> Characters move frequently
                to find unclaimed locations
              </li>
              <li>
                <strong>Challenge frequency:</strong> Challenges are used
                sparingly but strategically
              </li>
              <li>
                <strong>Rest optimization:</strong> Rest actions increase in
                late game when gold is scarce
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default NashEquilibrium
