import { StatisticsAnalyzer } from '../analysis/statistics'

export async function generateHTMLReport(
  analyzer: StatisticsAnalyzer,
  simulations: any[]
): Promise<string> {
  const winRates = analyzer.calculateWinRates(simulations)
  const actionStats = analyzer.calculateActionStats(simulations)
  const locationHeatmap = analyzer.calculateLocationHeatmap(simulations)
  const firstPlayerAdvantage =
    analyzer.calculateFirstPlayerAdvantage(simulations)
  const balance = analyzer.calculateBalanceMetrics(simulations)
  const strategyPerformance = analyzer.calculateStrategyPerformance(simulations)
  const gameLengthDist = analyzer.calculateGameLengthDistribution(simulations)

  const timestamp = new Date().toISOString()
  const totalGames = simulations.length

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deadwood Simulation Report - ${timestamp}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2.5rem;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
            margin: 0 0 0.5rem 0;
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        
        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #8B4513;
        }
        
        .section {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .section h2 {
            margin-top: 0;
            color: #8B4513;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 0.5rem;
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin: 2rem 0;
        }
        
        .chart-container.small {
            height: 300px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        th {
            background: #f8f8f8;
            font-weight: 600;
            color: #666;
        }
        
        tr:hover {
            background: #f5f5f5;
        }
        
        .heatmap {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 10px;
            margin: 2rem 0;
        }
        
        .heatmap-cell {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .heatmap-label {
            font-size: 0.8rem;
            opacity: 0.9;
        }
        
        .heatmap-value {
            font-size: 1.5rem;
        }
        
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
        
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Deadwood Simulation Report</h1>
        <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
        <p>Total Games Simulated: ${totalGames.toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <h3>Balance Score</h3>
            <div class="value">${balance.characterBalance.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <h3>Win Rate Std Dev</h3>
            <div class="value">${balance.winRateStdDev.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
            <h3>Avg Game Length</h3>
            <div class="value">${balance.avgGameLength.toFixed(1)}</div>
        </div>
        <div class="stat-card">
            <h3>Victory Types</h3>
            <div class="value">${balance.victoryTypes.influence}/${balance.victoryTypes.location}/${balance.victoryTypes.rounds}</div>
        </div>
    </div>
    
    ${generateBalanceWarnings(balance, winRates, actionStats)}
    
    <div class="section">
        <h2>Character Win Rates</h2>
        <div class="chart-container">
            <canvas id="winRateChart"></canvas>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Character</th>
                    <th>Games</th>
                    <th>Wins</th>
                    <th>Win Rate</th>
                    <th>Deviation</th>
                </tr>
            </thead>
            <tbody>
                ${winRates
                  .map(
                    (stat) => `
                    <tr>
                        <td><strong>${stat.character}</strong></td>
                        <td>${stat.games}</td>
                        <td>${stat.wins}</td>
                        <td>${stat.winRate.toFixed(1)}%</td>
                        <td>${(stat.winRate - 25).toFixed(1)}%</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
    
    <div class="grid-2">
        <div class="section">
            <h2>Action Usage</h2>
            <div class="chart-container small">
                <canvas id="actionChart"></canvas>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Total</th>
                        <th>Per Game</th>
                    </tr>
                </thead>
                <tbody>
                    ${actionStats
                      .map(
                        (stat) => `
                        <tr>
                            <td><strong>${stat.actionType}</strong></td>
                            <td>${stat.totalActions.toLocaleString()}</td>
                            <td>${stat.avgPerGame.toFixed(1)}</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Game Length Distribution</h2>
            <div class="chart-container small">
                <canvas id="lengthChart"></canvas>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Location Heatmap</h2>
        <p>Average influence claimed per location per game</p>
        <div class="heatmap">
            ${locationHeatmap
              .map((loc) => {
                const intensity = Math.min(
                  255,
                  Math.floor(loc.avgInfluence * 85)
                )
                const color = `rgb(${139 + intensity / 3}, ${69 - intensity / 5}, ${19 - intensity / 10})`
                return `
                    <div class="heatmap-cell" style="background: ${color}">
                        <div class="heatmap-label">${loc.locationName}</div>
                        <div class="heatmap-value">${loc.avgInfluence.toFixed(1)}</div>
                    </div>
                `
              })
              .join('')}
        </div>
    </div>
    
    <div class="grid-2">
        <div class="section">
            <h2>First Player Advantage</h2>
            <div class="chart-container small">
                <canvas id="turnOrderChart"></canvas>
            </div>
        </div>
        
        ${
          strategyPerformance.length > 0
            ? `
        <div class="section">
            <h2>AI Strategy Performance</h2>
            <div class="chart-container small">
                <canvas id="strategyChart"></canvas>
            </div>
        </div>
        `
            : ''
        }
    </div>
    
    <script>
        // Win Rate Chart
        new Chart(document.getElementById('winRateChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(winRates.map((s) => s.character))},
                datasets: [{
                    label: 'Win Rate %',
                    data: ${JSON.stringify(winRates.map((s) => s.winRate))},
                    backgroundColor: [
                        'rgba(139, 69, 19, 0.8)',
                        'rgba(210, 105, 30, 0.8)',
                        'rgba(160, 82, 45, 0.8)',
                        'rgba(205, 133, 63, 0.8)',
                        'rgba(184, 134, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(139, 69, 19, 1)',
                        'rgba(210, 105, 30, 1)',
                        'rgba(160, 82, 45, 1)',
                        'rgba(205, 133, 63, 1)',
                        'rgba(184, 134, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Character Win Rates (Expected: 25% each)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(50, Math.ceil(Math.max(...winRates.map(s => s.winRate)) / 10) * 10),
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Action Usage Chart
        new Chart(document.getElementById('actionChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(actionStats.map((s) => s.actionType))},
                datasets: [{
                    data: ${JSON.stringify(actionStats.map((s) => s.totalActions))},
                    backgroundColor: [
                        'rgba(139, 69, 19, 0.8)',
                        'rgba(210, 105, 30, 0.8)',
                        'rgba(160, 82, 45, 0.8)',
                        'rgba(205, 133, 63, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Game Length Chart
        new Chart(document.getElementById('lengthChart'), {
            type: 'line',
            data: {
                labels: ${JSON.stringify(gameLengthDist.map((d) => d.rounds))},
                datasets: [{
                    label: 'Games',
                    data: ${JSON.stringify(gameLengthDist.map((d) => d.count))},
                    borderColor: 'rgba(139, 69, 19, 1)',
                    backgroundColor: 'rgba(139, 69, 19, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Rounds'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Games'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Turn Order Chart
        new Chart(document.getElementById('turnOrderChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(firstPlayerAdvantage.map((s) => `Player ${s.position + 1}`))},
                datasets: [{
                    label: 'Win Rate %',
                    data: ${JSON.stringify(firstPlayerAdvantage.map((s) => s.winRate))},
                    backgroundColor: 'rgba(139, 69, 19, 0.8)',
                    borderColor: 'rgba(139, 69, 19, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        ${
          strategyPerformance.length > 0
            ? `
        // Strategy Performance Chart
        new Chart(document.getElementById('strategyChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(strategyPerformance.map((s) => s.strategy))},
                datasets: [{
                    label: 'Win Rate %',
                    data: ${JSON.stringify(strategyPerformance.map((s) => s.winRate))},
                    backgroundColor: 'rgba(210, 105, 30, 0.8)',
                    borderColor: 'rgba(210, 105, 30, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        `
            : ''
        }
    </script>
</body>
</html>`

  return html
}

function generateBalanceWarnings(
  balance: any,
  winRates: any[],
  actionStats: any[]
): string {
  const warnings: string[] = []
  const successes: string[] = []

  // Check character balance
  winRates.forEach((stat) => {
    if (stat.winRate > 35) {
      warnings.push(
        `${stat.character} win rate too high (${stat.winRate.toFixed(1)}%)`
      )
    } else if (stat.winRate < 15) {
      warnings.push(
        `${stat.character} win rate too low (${stat.winRate.toFixed(1)}%)`
      )
    }
  })

  // Check game length
  if (balance.avgGameLength > 15) {
    warnings.push(
      `Games taking too long (avg ${balance.avgGameLength.toFixed(1)} rounds)`
    )
  } else if (balance.avgGameLength < 8) {
    warnings.push(
      `Games ending too quickly (avg ${balance.avgGameLength.toFixed(1)} rounds)`
    )
  }

  // Check action usage
  const challengeStats = actionStats.find((s) => s.actionType === 'challenge')
  if (challengeStats && challengeStats.avgPerGame < 0.5) {
    warnings.push(
      `Challenges underused (${challengeStats.avgPerGame.toFixed(1)} per game)`
    )
  }

  const claimStats = actionStats.find((s) => s.actionType === 'claim')
  if (claimStats && claimStats.avgPerGame < 10) {
    warnings.push(
      `Claims too low (${claimStats.avgPerGame.toFixed(1)} per game)`
    )
  }

  // Check balance score
  if (balance.characterBalance > 0.8) {
    successes.push(
      `Good character balance (score: ${balance.characterBalance.toFixed(2)})`
    )
  }

  if (balance.winRateStdDev < 10) {
    successes.push(
      `Excellent win rate distribution (σ: ${balance.winRateStdDev.toFixed(1)}%)`
    )
  }

  let html = ''

  if (warnings.length > 0) {
    html += '<div class="warning"><strong>⚠️ Balance Warnings:</strong><ul>'
    warnings.forEach((w) => (html += `<li>${w}</li>`))
    html += '</ul></div>'
  }

  if (successes.length > 0) {
    html += '<div class="success"><strong>✅ Balance Achievements:</strong><ul>'
    successes.forEach((s) => (html += `<li>${s}</li>`))
    html += '</ul></div>'
  }

  return html
}
