import React, { useState } from 'react'
import { Play, Settings, Download, Upload } from 'lucide-react'
import './SimulatorControl.css'

interface SimulatorControlProps {
  onSimulationsComplete: (simulations: any[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const SimulatorControl: React.FC<SimulatorControlProps> = ({
  onSimulationsComplete,
  isLoading,
  setIsLoading,
}) => {
  const [config, setConfig] = useState({
    totalGames: 100,
    playerCount: 4,
    aiDifficulty: 'medium' as 'easy' | 'medium' | 'hard',
    strategies: ['balanced'],
    useAllStrategies: false,
  })

  const allStrategies = [
    'random',
    'greedy',
    'balanced',
    'aggressive',
    'defensive',
    'mcts',
  ]

  const runSimulation = async () => {
    setIsLoading(true)

    try {
      // In a real implementation, this would call the actual simulator
      // For now, we'll simulate with mock data
      const mockSimulations = generateMockSimulations(config)

      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onSimulationsComplete(mockSimulations)
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Failed to run simulation')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    const data = localStorage.getItem('deadwood-simulations')
    if (!data) {
      alert('No simulation data to export')
      return
    }

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deadwood-simulations-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          onSimulationsComplete(data)
          alert(`Imported ${data.length} simulations`)
        } else {
          alert('Invalid data format')
        }
      } catch (error) {
        alert('Failed to parse file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="simulator-control">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Simulation Configuration</h2>
          <div className="control-buttons">
            <button
              className="button button-secondary"
              onClick={exportData}
              title="Export simulation data"
            >
              <Download size={18} />
              Export
            </button>
            <label
              className="button button-secondary"
              title="Import simulation data"
            >
              <Upload size={18} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="config-grid">
          <div className="config-group">
            <label htmlFor="totalGames">Number of Games</label>
            <input
              id="totalGames"
              type="number"
              min="10"
              max="10000"
              value={config.totalGames}
              onChange={(e) =>
                setConfig({
                  ...config,
                  totalGames: parseInt(e.target.value) || 100,
                })
              }
              disabled={isLoading}
            />
          </div>

          <div className="config-group">
            <label htmlFor="playerCount">Player Count</label>
            <select
              id="playerCount"
              value={config.playerCount}
              onChange={(e) =>
                setConfig({ ...config, playerCount: parseInt(e.target.value) })
              }
              disabled={isLoading}
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </select>
          </div>

          <div className="config-group">
            <label htmlFor="aiDifficulty">AI Difficulty</label>
            <select
              id="aiDifficulty"
              value={config.aiDifficulty}
              onChange={(e) =>
                setConfig({ ...config, aiDifficulty: e.target.value as any })
              }
              disabled={isLoading}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="config-group">
            <label>
              <input
                type="checkbox"
                checked={config.useAllStrategies}
                onChange={(e) =>
                  setConfig({ ...config, useAllStrategies: e.target.checked })
                }
                disabled={isLoading}
              />
              Test All AI Strategies
            </label>
          </div>
        </div>

        {!config.useAllStrategies && (
          <div className="strategy-selection">
            <label>AI Strategies</label>
            <div className="strategy-chips">
              {allStrategies.map((strategy) => (
                <button
                  key={strategy}
                  className={`chip ${config.strategies.includes(strategy) ? 'active' : ''}`}
                  onClick={() => {
                    if (config.strategies.includes(strategy)) {
                      setConfig({
                        ...config,
                        strategies: config.strategies.filter(
                          (s) => s !== strategy
                        ),
                      })
                    } else {
                      setConfig({
                        ...config,
                        strategies: [...config.strategies, strategy],
                      })
                    }
                  }}
                  disabled={isLoading}
                >
                  {strategy}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="button button-primary button-large"
          onClick={runSimulation}
          disabled={
            isLoading ||
            (!config.useAllStrategies && config.strategies.length === 0)
          }
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              Running Simulations...
            </>
          ) : (
            <>
              <Play size={20} />
              Run Simulation
            </>
          )}
        </button>

        {isLoading && (
          <div className="progress-bar">
            <div className="progress-fill" />
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Quick Actions</h3>
        <div className="quick-actions">
          <button
            className="button button-outline"
            onClick={() => {
              setConfig({
                totalGames: 1000,
                playerCount: 4,
                aiDifficulty: 'medium',
                strategies: allStrategies,
                useAllStrategies: true,
              })
            }}
            disabled={isLoading}
          >
            <Settings size={18} />
            Standard Test Suite
          </button>

          <button
            className="button button-outline"
            onClick={() => {
              setConfig({
                totalGames: 500,
                playerCount: 2,
                aiDifficulty: 'hard',
                strategies: ['balanced', 'aggressive'],
                useAllStrategies: false,
              })
            }}
            disabled={isLoading}
          >
            <Settings size={18} />
            Competitive 1v1
          </button>

          <button
            className="button button-outline"
            onClick={() => {
              setConfig({
                totalGames: 100,
                playerCount: 4,
                aiDifficulty: 'medium',
                strategies: ['mcts'],
                useAllStrategies: false,
              })
            }}
            disabled={isLoading}
          >
            <Settings size={18} />
            MCTS Analysis
          </button>
        </div>
      </div>
    </div>
  )
}

// Mock data generator for demonstration
function generateMockSimulations(config: any): any[] {
  const simulations = []
  const characters = ['al', 'seth', 'cy', 'jane']
  const strategies = config.useAllStrategies
    ? ['random', 'greedy', 'balanced', 'aggressive', 'defensive', 'mcts']
    : config.strategies

  for (let i = 0; i < config.totalGames; i++) {
    const playerChars = characters.slice(0, config.playerCount)
    const winner = Math.floor(Math.random() * config.playerCount)
    const rounds = 10 + Math.floor(Math.random() * 11)

    const finalScores = playerChars.map((char, idx) => ({
      playerId: `player-${idx}`,
      character: char,
      totalInfluence: Math.floor(Math.random() * 12) + 1,
      gold: Math.floor(Math.random() * 10),
      isAI: idx !== 0,
    }))

    // Ensure winner has high influence
    finalScores[winner].totalInfluence = Math.max(
      finalScores[winner].totalInfluence,
      Math.floor(Math.random() * 4) + 9
    )

    const actions = []
    for (let round = 1; round <= rounds; round++) {
      for (let player = 0; player < config.playerCount; player++) {
        const actionTypes = ['move', 'claim', 'challenge', 'rest']
        for (let a = 0; a < 2; a++) {
          const actionType =
            actionTypes[Math.floor(Math.random() * actionTypes.length)]
          actions.push({
            round,
            playerId: `player-${player}`,
            playerCharacter: playerChars[player],
            actionType,
            target:
              actionType === 'move' ? Math.floor(Math.random() * 6) : undefined,
            amount:
              actionType === 'claim'
                ? Math.floor(Math.random() * 2) + 1
                : undefined,
            cost: actionType === 'rest' ? 0 : Math.floor(Math.random() * 3),
            goldBefore: Math.floor(Math.random() * 10),
            goldAfter: Math.floor(Math.random() * 10),
            influenceBefore: Math.floor(Math.random() * 10),
            influenceAfter: Math.floor(Math.random() * 12),
          })
        }
      }
    }

    simulations.push({
      gameId: `sim-${Date.now()}-${i}`,
      winner,
      winnerCharacter: playerChars[winner],
      rounds,
      finalScores,
      actions,
      startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      endTime: new Date().toISOString(),
      aiStrategies: strategies,
    })
  }

  return simulations
}

export default SimulatorControl
