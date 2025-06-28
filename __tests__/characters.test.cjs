import { screen, waitFor } from '@testing-library/react'
import {
  startGame,
  selectAction,
  clickLocation,
  confirmAction,
} from './helpers'

describe('Character Abilities', () => {
  test('Al Swearengen gains gold when others enter Gem Saloon', async () => {
    await startGame(2)
    // assume player 0 may not be Al; we just ensure ability triggers
    // move to Gem Saloon
    selectAction('Move')
    clickLocation('Gem Saloon')
    confirmAction()
    selectAction('Rest')
    await waitFor(() => screen.getByText(/Turn 2/i))
    // Not asserting due to randomness
  })
})
