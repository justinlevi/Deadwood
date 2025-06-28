import { screen, waitFor, fireEvent } from '@testing-library/react'
import { startGame, selectAction, confirmAction } from './helpers'

describe('Victory Conditions', () => {
  test('game ends at 12 influence', async () => {
    await startGame()
    // increase influence quickly
    for (let i = 0; i < 6; i++) {
      selectAction('Claim')
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
      confirmAction()
      if (i % 2 === 1) await waitFor(() => screen.getByText(/Turn/))
    }
    await waitFor(() =>
      expect(screen.getByText(/Game Over/i)).toBeInTheDocument()
    )
  })
})
