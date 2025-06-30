import React from 'react'
import type { GameState } from '../game/types'

interface Props {
  gameState: GameState
  onNewGame: () => void
}

const GameOver: React.FC<Props> = ({ gameState, onNewGame }) => {
  const winner = gameState.players[gameState.winner!]
  return (
    <div className="min-h-screen bg-gradient-to-br from-deadwood-brown to-deadwood-sienna flex items-center justify-center p-4">
      <div className="bg-deadwood-tan p-8 rounded-lg shadow-2xl border-4 border-deadwood-dark-brown max-w-2xl w-full animate-slide-up">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-deadwood-dark-brown">
          Game Over!
        </h1>
        <h2 className="text-2xl md:text-3xl text-center mb-8 text-deadwood-brown">
          {winner.name} ({winner.character.name}) Wins!
        </h2>
        <div className="bg-deadwood-light-tan p-6 rounded-lg border-2 border-deadwood-brown mb-8">
          <h3 className="text-xl font-bold mb-4 text-deadwood-dark-brown">
            Final Scores:
          </h3>
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`flex justify-between items-center py-2 px-4 mb-2 rounded ${
                index === gameState.winner
                  ? 'bg-deadwood-gold text-white font-bold'
                  : 'bg-white/50'
              }`}
            >
              <span>{player.name}:</span>
              <span>
                {player.totalInfluence} influence, {player.gold} gold
                {index === gameState.winner && ' 🏆'}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onNewGame}
          className="w-full py-3 bg-deadwood-brown text-white font-bold rounded hover:bg-deadwood-sienna transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          New Game
        </button>
      </div>
    </div>
  )
}

export default GameOver
