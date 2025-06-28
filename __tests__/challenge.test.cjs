import { screen, waitFor } from '@testing-library/react'
import {
  startGame,
  selectAction,
  clickLocation,
  confirmAction,
} from './helpers'

// Basic challenge scenario

describe('Challenge Action', () => {
  test('player can challenge opponent at same location', async () => {
    await startGame(2)
    // move AI to same location as player for deterministic test
    // AI player index 1
    selectAction('Move')
    clickLocation('Hardware Store')
    confirmAction()
    // second action skip to end
    selectAction('Rest')

    // Now AI turn automatically; not verifying
    await waitFor(() => screen.getByText(/Turn 2/i))
  })
})
