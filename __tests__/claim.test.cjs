import { screen, waitFor, fireEvent } from '@testing-library/react'
import { startGame, selectAction, confirmAction } from './helpers'

describe('Claim Action', () => {
  test('claiming influence costs gold and increases influence', async () => {
    await startGame()
    selectAction('Claim')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    confirmAction()
    await waitFor(() => {
      expect(screen.getByText(/Gold: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Influence: 2/)).toBeInTheDocument()
    })
  })
})
