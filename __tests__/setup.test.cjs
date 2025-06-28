import { screen } from '@testing-library/react'
import { startGame } from './helpers'

describe('Game Setup', () => {
  test('starting a 2-player game initializes players', async () => {
    await startGame(2)
    const players = screen.getAllByText(/Gold:/i)
    expect(players).toHaveLength(2)
    players.forEach((player) => expect(player.textContent).toMatch(/Gold: 3/))
  })
})
