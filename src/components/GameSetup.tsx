import React, { useState } from 'react'
import type { GameConfig } from '../game/types'
import styles from './GameSetup.module.css'

interface Props {
  onStartGame: (config: GameConfig) => void
}

const GameSetup: React.FC<Props> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(2)
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Deadwood Showdown</h1>
        <div className={styles.field}>
          <label>Number of Players:</label>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
          >
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>
        <div className={styles.field}>
          <label>AI Difficulty:</label>
          <select
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value as any)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button
          className={styles.startButton}
          onClick={() => onStartGame({ playerCount, aiDifficulty })}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}

export default GameSetup
