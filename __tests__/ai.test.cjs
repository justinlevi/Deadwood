import { screen, waitFor } from '@testing-library/react'
import { startGame } from './helpers'

describe('AI Player', () => {
  test('AI takes actions on its turn', async () => {
    await startGame(2)
    // complete two actions for human
    await waitFor(() => screen.getByText(/Turn 1/i))
    // rest twice to end turn
    const restButton = screen.getByRole('button', { name: /Rest/i })
    restButton.click()
    restButton.click()
    await waitFor(() => screen.getByText(/Turn 2/i))
    await waitFor(() => expect(screen.getByText(/Turn 3/i)).toBeInTheDocument())
  })
})
