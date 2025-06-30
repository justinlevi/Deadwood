#!/usr/bin/env npx tsx

// Mock environment
(global as any).import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'placeholder-key',
      MODE: 'test'
    }
  }
};

(global as any).sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(global as any).window = { analytics: null };
Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true, configurable: true });

import { GameSimulator } from './core/simulator'
import { balancedAI } from './ai/strategies-fixed'

async function debugGame() {
  console.log('🔍 Debug Single Game\n')
  
  const simulator = new GameSimulator()
  simulator.registerAIStrategy('balanced', balancedAI)
  
  const result = await simulator.simulateGame({
    playerCount: 4,
    aiDifficulty: 'medium',
    aiStrategies: ['balanced', 'balanced', 'balanced', 'balanced']
  })
  
  console.log('Game Results:')
  console.log(`Winner: Player ${result.winner + 1} (${result.winnerCharacter})`)
  console.log(`Rounds: ${result.rounds}`)
  console.log('\nFinal Scores:')
  result.finalScores.forEach((score, idx) => {
    console.log(`  Player ${idx + 1} (${score.character}): ${score.totalInfluence} influence, ${score.gold} gold`)
  })
  
  // Count actions
  const actionCounts = { move: 0, claim: 0, challenge: 0, rest: 0 }
  result.actions.forEach(action => {
    actionCounts[action.actionType]++
  })
  
  console.log('\nAction Summary:')
  Object.entries(actionCounts).forEach(([action, count]) => {
    console.log(`  ${action}: ${count}`)
  })
  
  // Track Al's gold gains
  const alPlayer = result.finalScores.find(s => s.character === 'al')
  if (alPlayer) {
    console.log(`\nAl's final gold: ${alPlayer.gold}`)
    
    // Count Gem Saloon visits
    let gemVisits = 0
    result.actions.forEach((action, idx) => {
      if (action.actionType === 'move' && action.target === 0) {
        const playerId = action.playerId
        const playerChar = result.finalScores.find(s => s.playerId === playerId)?.character
        if (playerChar !== 'al') {
          gemVisits++
        }
      }
    })
    console.log(`Gem Saloon visits by others: ${gemVisits}`)
  }
}

debugGame().catch(console.error)