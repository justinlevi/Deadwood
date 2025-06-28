import React from 'react'
import type { GameState } from '../game/types'
import styles from './GameOver.module.css'

interface Props {
  gameState: GameState
  onNewGame: () => void
}

const GameOver: React.FC<Props> = ({ gameState, onNewGame }) => {
  const winner = gameState.players[gameState.winner!]
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1>Game Over!</h1>
        <h2>
          {winner.name} ({winner.character.name}) Wins!
        </h2>
        <div className={styles.scores}>
          <h3>Final Scores:</h3>
          {gameState.players.map((player, index) => (
            <div key={player.id} className={styles.scoreLine}>
              {player.name}: {player.totalInfluence} influence, {player.gold}{' '}
              gold
              {index === gameState.winner && ' 🏆'}
            </div>
          ))}
        </div>
        <button onClick={onNewGame} className={styles.button}>
          New Game
        </button>
      </div>
    </div>
  )
}

export default GameOver
