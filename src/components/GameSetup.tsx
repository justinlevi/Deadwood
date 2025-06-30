import React, { useState } from 'react'
import type { GameConfig } from '../game/types'

interface Props {
  onStartGame: (config: GameConfig) => void
}

const GameSetup: React.FC<Props> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2)
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-deadwood-brown to-deadwood-sienna flex items-center justify-center p-4">
      <div className="bg-deadwood-tan p-8 rounded-lg shadow-2xl border-4 border-deadwood-dark-brown max-w-md w-full animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-deadwood-dark-brown">
          Deadwood Showdown
        </h1>
        <div className="mb-6">
          <label className="block text-deadwood-dark-brown font-bold mb-2">
            Number of Players:
          </label>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="w-full px-4 py-2 rounded border-2 border-deadwood-brown bg-deadwood-light-tan text-deadwood-dark-brown focus:outline-none focus:border-deadwood-gold transition-colors"
          >
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>
        <div className="mb-8">
          <label className="block text-deadwood-dark-brown font-bold mb-2">
            AI Difficulty:
          </label>
          <select
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value as any)}
            className="w-full px-4 py-2 rounded border-2 border-deadwood-brown bg-deadwood-light-tan text-deadwood-dark-brown focus:outline-none focus:border-deadwood-gold transition-colors"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button
          className="w-full py-3 bg-deadwood-brown text-white font-bold rounded hover:bg-deadwood-sienna transform hover:scale-105 transition-all duration-200 shadow-lg"
          onClick={() => onStartGame({ playerCount, aiDifficulty })}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}

export default GameSetup
