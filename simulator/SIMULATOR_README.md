# Deadwood Game Simulator

A comprehensive game simulator for testing balance, AI strategies, and game mechanics in Deadwood.

## Quick Start

```bash
# Install dependencies
npm install

# Run quick test (100 games)
npm run quick

# Verify AI strategies are working
npm run verify

# Run full test suite
npm run full

# Run custom simulation
npm run simulate custom 500 4 balanced
```

## Architecture

### Core Components

1. **Environment Setup** (`core/environment.cjs`)
   - Handles all Vite/browser API mocking
   - Must be loaded before any game code
   - Provides consistent environment for Node.js execution

2. **Game Simulator** (`core/simulator.ts`)
   - Runs individual game simulations
   - Manages AI strategy execution
   - Tracks all game actions and outcomes

3. **Batch Runner** (`core/batch-runner.ts`)
   - Orchestrates multiple simulations
   - Manages different AI matchups
   - Provides progress tracking

4. **AI Strategies** (`ai/strategies.ts`, `ai/strategies-fixed.ts`)
   - Multiple AI personalities (random, greedy, balanced, aggressive, defensive)
   - Fixed balanced AI addresses claiming issues
   - Extensible strategy system

### Key Fixes Applied

1. **Environment Variable Issues**
   - Created unified environment setup in `core/environment.cjs`
   - Single entry point through `simulate.cjs`
   - Proper mocking of `import.meta.env`

2. **AI Strategy Bug**
   - Fixed parameter passing in `simulator.ts` (line 169)
   - Fixed default strategy registration in batch runner
   - Created improved balanced AI that actually claims influence

3. **Import Issues**
   - MCTS now uses game-reducer-wrapper instead of importing from src
   - Removed logging dependencies from simulation code

## AI Strategy Analysis

### Current Performance (50 games per strategy)

| Strategy | Claims/Game | Avg Influence | Avg Rounds | Notes |
|----------|-------------|---------------|------------|-------|
| Random | 18.6 | 6.7 | 14.2 | Chaotic but functional |
| Greedy | 18.0 | 6.8 | 6.0 | Fast games, efficient |
| Balanced | 23.8 | 7.3 | 6.5 | Best overall performance |
| Aggressive | 48.1 | 2.9 | 21.0 | Challenges disrupt games |
| Defensive | 20.4 | 5.9 | 17.5 | Conservative play |

### Character Balance Issues

Current win rates show significant imbalance:
- **Cy Tolliver**: 60% (movement ability too strong)
- **Al Swearengen**: 20% (gold generation helps)
- **Seth Bullock**: 10% (challenge discount undervalued)
- **Calamity Jane**: 10% (extra actions not enough)

## Known Issues

1. **Challenge Mechanic**: Currently 0 successful challenges per game
   - Challenge positioning requirements may be too restrictive
   - AI doesn't prioritize positioning for challenges

2. **Character Balance**: Cy's movement ability provides too much advantage
   - Free movement allows better board control
   - Other abilities need buffs to compete

3. **Rest Overuse**: 87.9 rest actions per game is excessive
   - AI may be too conservative with gold spending
   - Rest provides too much value compared to other actions

## Recommendations

1. **Game Balance**
   - Reduce Cy's movement range or add cost
   - Buff Seth's challenge discount (maybe free challenges)
   - Increase Jane's starting gold or action efficiency
   - Make challenges easier to execute

2. **AI Improvements**
   - Add positioning strategy for challenges
   - Reduce rest action scoring
   - Add cooperative/vengeful behaviors
   - Implement learning from game history

3. **Simulator Enhancements**
   - Add configurable game rules for testing
   - Implement tournament mode
   - Add replay/visualization system
   - Create automated balance testing

## File Structure

```
simulator/
├── core/
│   ├── environment.cjs    # Environment setup
│   ├── simulator.ts       # Game simulation engine
│   ├── batch-runner.ts    # Batch simulation manager
│   ├── database.ts        # Result storage
│   └── game-reducer-wrapper.ts # Logging-free reducer
├── ai/
│   ├── strategies.ts      # Original AI strategies
│   └── strategies-fixed.ts # Improved AI strategies
├── analysis/
│   ├── statistics.ts      # Statistical analysis
│   ├── mcts.ts           # Monte Carlo Tree Search
│   └── nash.ts           # Nash equilibrium finder
├── dashboard/             # Web dashboard (separate app)
├── simulate.cjs          # Main entry point
├── index.ts              # CLI interface
└── package.json          # Dependencies and scripts
```

## Development Tips

1. Always use `npm run` commands - they ensure proper environment setup
2. Add new strategies to `ai/strategies-fixed.ts` and register in batch runner
3. Use `game-reducer-wrapper.ts` instead of importing from src/game
4. Test changes with `npm run verify` before full simulations

## Future Improvements

1. **Performance**: Parallelize simulations using worker threads
2. **Analysis**: Add more sophisticated balance metrics
3. **Visualization**: Real-time game viewer in dashboard
4. **Configuration**: YAML/JSON config for test scenarios
5. **CI/CD**: Automated balance testing on game changes