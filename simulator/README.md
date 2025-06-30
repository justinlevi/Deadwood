# Deadwood Game Simulator & Analysis Dashboard

A comprehensive tool for simulating and analyzing Deadwood games to ensure game balance.

## Features

- **Game Simulator**: Run thousands of games programmatically
- **Multiple AI Strategies**: Random, Greedy, Balanced, Aggressive, Defensive, MCTS
- **Statistical Analysis**: Win rates, action usage, location heatmaps
- **Balance Metrics**: Character balance, first player advantage, Nash equilibrium
- **Interactive Dashboard**: Real-time visualizations and charts
- **Data Persistence**: Store and analyze historical simulation data

## Installation

```bash
# Install dependencies
npm install

# Build the simulator
npm run build:simulator
```

## Usage

### Command Line Interface

```bash
# Quick test (100 games)
npm run simulate quick

# Full analysis (1000 games per configuration)
npm run simulate full

# Custom simulation
npm run simulate custom <games> <players> <strategy>
npm run simulate custom 500 4 balanced

# Export results
npm run simulate export results.json

# Import previous results
npm run simulate import results.json
```

### Web Dashboard

```bash
# Start the dashboard
npm run dashboard

# Open http://localhost:3001 in your browser
```

### Programmatic Usage

```typescript
import { SimulationRunner } from './core/batch-runner'
import { RandomStrategy, GreedyStrategy } from './ai/strategies'

// Run a single simulation
const runner = new SimulationRunner()
const config = {
  games: 1000,
  players: 2,
  strategies: [new RandomStrategy(), new GreedyStrategy()]
}

const results = await runner.runBatch(config)
```

## Analysis Outputs

### 1. Character Balance
- Win rates per character
- Pick rates and ban rates
- Ability usage effectiveness
- Balance scores (0-100)

### 2. Action Analysis
- Action usage frequency by game phase
- Action efficiency (influence per gold)
- Temporal patterns
- Strategy correlations

### 3. Location Analysis
- Contestedness heatmap
- Win contribution by location
- Movement patterns
- Control importance

### 4. Game Balance Metrics
- First player advantage
- Average game length
- Victory condition distribution
- Comeback potential

### 5. Nash Equilibrium
- Optimal mixed strategies
- Dominant action identification
- Strategy counter-relationships

## Dashboard Views

1. **Overview**: High-level metrics and trends
2. **Characters**: Detailed character analysis
3. **Actions**: Action usage and efficiency
4. **Locations**: Board heatmaps and patterns
5. **Strategies**: AI performance comparison
6. **Balance**: Comprehensive balance report

## Interpreting Results

### Red Flags
- Character win rate > 60% or < 40%
- First player advantage > 55%
- Unused actions or locations
- Games ending too quickly (< 10 rounds)
- Single dominant strategy

### Good Signs
- Character win rates 45-55%
- All actions used regularly
- Multiple viable strategies
- Games lasting 12-18 rounds
- Dynamic location importance

## Configuration

Edit `simulator/config.ts` to adjust:
- Simulation parameters
- AI strategy weights
- Analysis thresholds
- Dashboard settings

## Export Formats

- **JSON**: Complete simulation data
- **CSV**: Statistical summaries
- **HTML**: Static analysis report
- **PNG**: Chart exports